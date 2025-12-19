import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Save, Building2, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="bg-white rounded-[2rem] p-6 shadow-float border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-black"></div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 pb-2 border-b flex justify-between items-center">Configurar Rateio <Calculator size={14} /></h3>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Projeto / Empresa</label>
                            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valor R$</label>
                                <input type="number" value={totalValue} onChange={e => setTotalValue(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dia Pag.</label>
                                <input type="text" value={dueDay} onChange={e => setDueDay(e.target.value.replace(/\D/g, ''))} placeholder="DD" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm text-center" />
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
                            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distribuição</label><button onClick={autoDistribute} className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg shadow-sm">AUTO RATEIO</button></div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {partners.map((partner) => (
                                    <div key={partner.id} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                                        <input type="text" value={partner.name} onChange={(e) => updatePartner(partner.id, 'name', e.target.value)} placeholder="Sócio" className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-black outline-none shadow-sm" />
                                        <input type="number" value={partner.value || ''} onChange={(e) => updatePartner(partner.id, 'value', e.target.value)} placeholder="0.00" className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-black outline-none shadow-sm" />
                                        <button onClick={() => handleRemovePartnerInput(partner.id)} className="text-gray-300 hover:text-red-500 p-1.5"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddPartnerInput} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold text-[10px] uppercase hover:border-black hover:text-black flex items-center justify-center gap-2 transition-all"><Plus size={14} /> Novo Beneficiário</button>
                        </div>
                        <div className={`rounded-2xl p-4 flex items-center justify-between border transition-all shadow-sm ${isBalanced ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div><p className={`text-[9px] font-black uppercase tracking-widest ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>{isBalanced ? 'Saldo Verificado' : 'Rateio Pendente'}</p><p className="text-[10px] text-gray-500 font-bold mt-1">Total: {formatCurrency(distributedTotal)}</p></div>
                            <p className={`text-xl font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(difference)}</p>
                        </div>
                        <button onClick={handleSaveCard} className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 disabled:opacity-50 transition-all">{isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Parceria</button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Filtrar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-[1.5rem] pl-11 pr-4 py-3.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-black outline-none" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[70vh] custom-scrollbar pr-2">
                        {filteredCards.map(card => (
                            <div key={card.id} onClick={() => toggleCard(card.id)} className="bg-white rounded-3xl p-5 shadow-apple hover:shadow-float transition-all border border-gray-100 group relative cursor-pointer animate-in fade-in">
                                <button onClick={(e) => handleConfirmDelete(card.id, e)} className="absolute top-5 right-5 text-gray-200 hover:text-red-500 z-20 p-1.5 transition-colors"><Trash2 size={18} /></button>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0"><Building2 size={24} className="text-gray-400" /></div>
                                    <div className="flex-1 truncate">
                                        <h4 className="font-black text-base truncate text-gray-900">{card.companyName}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-black text-black">{formatCurrency(card.totalValue)}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Dia {card.dueDay}</span>
                                        </div>
                                    </div>
                                    {expandedCards.has(card.id) ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                                {expandedCards.has(card.id) && (
                                    <div className="mt-5 pt-5 border-t border-gray-50 space-y-2 animate-in slide-in-from-top-4">
                                        {card.partners.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                                <span className="font-bold text-xs text-gray-600 uppercase tracking-tight">{p.name}</span>
                                                <span className="font-black text-xs text-black">{formatCurrency(p.value)}</span>
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