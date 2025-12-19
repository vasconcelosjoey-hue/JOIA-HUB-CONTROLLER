import React, { useState } from 'react';
import { Users, Plus, Trash2, Calculator, AlertTriangle, CheckCircle2, DollarSign, Building2, Save, Calendar, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { formatCurrency } from '../services/utils';
import { Partner, PartnershipCard } from '../types';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { useToast } from '../context/ToastContext';

interface PartnershipManagerProps {
    cards: PartnershipCard[];
    onAddCard: (card: PartnershipCard) => void;
    onDeleteCard: (id: string) => void;
}

export const PartnershipManager: React.FC<PartnershipManagerProps> = () => {
    const { data: cards, loading, addItem, deleteItem } = useFirestoreCollection<PartnershipCard>('partnerships');
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const [companyName, setCompanyName] = useState('');
    const [totalValue, setTotalValue] = useState<string>('');
    const [dueDay, setDueDay] = useState<string>('');
    
    const generateId = () => Math.random().toString(36).substring(2, 9);
    const [partners, setPartners] = useState<Partner[]>([{ id: generateId(), name: '', value: 0 }]);

    const numericTotal = parseFloat(totalValue) || 0;
    const distributedTotal = partners.reduce((acc, p) => acc + p.value, 0);
    const difference = numericTotal - distributedTotal;
    const isBalanced = Math.abs(difference) < 0.05;

    const toggleCard = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleAddPartnerInput = () => setPartners([...partners, { id: generateId(), name: '', value: 0 }]);
    const handleRemovePartnerInput = (id: string) => setPartners(partners.filter(p => p.id !== id));

    const updatePartner = (id: string, field: 'name' | 'value', val: string) => {
        setPartners(partners.map(p => p.id === id ? { ...p, [field]: field === 'value' ? (parseFloat(val) || 0) : val } : p));
    };

    const autoDistribute = () => {
        if (numericTotal <= 0 || partners.length === 0) return;
        const share = numericTotal / partners.length;
        const floorShare = Math.floor(share * 100) / 100;
        const newPartners = partners.map((p, index) => {
            let val = floorShare;
            if (index === partners.length - 1) {
                const currentSum = floorShare * partners.length;
                const diff = numericTotal - currentSum;
                val = floorShare + diff;
            }
            return { ...p, value: val };
        });
        setPartners(newPartners);
    };

    const handleSaveCard = async () => {
        if (!companyName || numericTotal <= 0 || !dueDay) {
             addToast('Preencha os campos obrigatórios.', 'warning');
             return;
        }
        if (!isBalanced) {
             addToast('O valor distribuído não fecha com o total.', 'warning');
             return;
        }
        setIsSubmitting(true);
        try {
            // Added 'createdAt' to satisfy TypeScript Omit<PartnershipCard, "id"> requirements.
            // Even though addItem adds it internally, the type system requires it because it's part of the PartnershipCard (via BaseEntity).
            await addItem({ 
                companyName, 
                totalValue: numericTotal, 
                dueDay: parseInt(dueDay), 
                partners: [...partners],
                createdAt: new Date().toISOString()
            });
            addToast('Parceria registrada!', 'success');
            setCompanyName(''); setTotalValue(''); setDueDay(''); setPartners([{ id: generateId(), name: '', value: 0 }]);
        } catch(err) {
            addToast('Erro ao salvar.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Excluir esta parceria?')) {
            await deleteItem(id);
            addToast('Removida.', 'info');
        }
    }

    const filteredCards = cards.filter(card => card.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-20">
             <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                    Parcerias
                </h2>
                <p className="text-gray-600 font-medium mt-0.5 text-sm md:text-base">Distribuição e rateio de receitas.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="bg-white rounded-2xl p-6 shadow-float border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-black"></div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-5 pb-2 border-b flex justify-between items-center">Novo Rateio <Calculator size={14} /></h3>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Empresa / Projeto</label>
                            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="number" value={totalValue} onChange={e => setTotalValue(e.target.value)} placeholder="Valor R$" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm" />
                            <input type="text" value={dueDay} onChange={e => setDueDay(e.target.value.replace(/\D/g, ''))} placeholder="Dia Pagamento" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm" />
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                            <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Sócios</label><button onClick={autoDistribute} className="text-[9px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md">Auto</button></div>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                {partners.map((partner, index) => (
                                    <div key={partner.id} className="flex gap-2 items-center">
                                        <input type="text" value={partner.name} onChange={(e) => updatePartner(partner.id, 'name', e.target.value)} placeholder="Sócio" className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold focus:border-black outline-none" />
                                        <input type="number" value={partner.value || ''} onChange={(e) => updatePartner(partner.id, 'value', e.target.value)} placeholder="0.00" className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold focus:border-black outline-none" />
                                        <button onClick={() => handleRemovePartnerInput(partner.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddPartnerInput} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 font-bold text-[10px] uppercase hover:border-black hover:text-black flex items-center justify-center gap-2"><Plus size={12} /> Adicionar Sócio</button>
                        </div>
                        <div className={`rounded-xl p-3 flex items-center justify-between border transition-all ${isBalanced ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div><p className={`text-[10px] font-black uppercase ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>{isBalanced ? 'Válido' : 'Divergente'}</p><p className="text-[9px] text-gray-500 font-medium">Distribuído: {formatCurrency(distributedTotal)}</p></div>
                            <p className={`text-base font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(difference)}</p>
                        </div>
                        <button onClick={handleSaveCard} className="w-full bg-black text-white py-3 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-2 shadow-md hover:bg-gray-800 disabled:opacity-50">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Criar Card</button>
                    </div>
                </div>
                <div className="space-y-5">
                    <input type="text" placeholder="Filtrar parceria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm" />
                    <div className="grid grid-cols-1 gap-4">
                        {filteredCards.map(card => (
                            <div key={card.id} onClick={() => toggleCard(card.id)} className="bg-white rounded-2xl p-5 shadow-apple hover:shadow-float transition-all border border-gray-100 group relative cursor-pointer">
                                <button onClick={(e) => handleConfirmDelete(card.id, e)} className="absolute top-5 right-5 text-gray-300 hover:text-red-500 z-20"><Trash2 size={16} /></button>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border shrink-0"><Building2 size={20} /></div>
                                    <div className="flex-1 truncate"><h4 className="font-black text-base truncate">{card.companyName}</h4><p className="text-xs font-bold text-gray-400">{formatCurrency(card.totalValue)} / mês (Dia {card.dueDay})</p></div>
                                    {expandedCards.has(card.id) ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                                {expandedCards.has(card.id) && (
                                    <div className="mt-4 pt-4 border-t space-y-2 animate-in slide-in-from-top-2">
                                        {card.partners.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border">
                                                <span className="font-bold text-xs text-gray-700">{p.name}</span>
                                                <span className="font-black text-xs">{formatCurrency(p.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
