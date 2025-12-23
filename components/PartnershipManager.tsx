
import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Save, Handshake, Loader2, ChevronDown, ChevronUp, Search, Edit2, X, Check } from 'lucide-react';
import { formatCurrency } from '../services/utils';
import { Partner, PartnershipCard } from '../types';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { useToast } from '../context/ToastContext';

export const PartnershipManager: React.FC = () => {
    const { data: cards, loading, addItem, updateItem, deleteItem } = useFirestoreCollection<PartnershipCard>('partnerships');
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [editingCard, setEditingCard] = useState<PartnershipCard | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [totalValue, setTotalValue] = useState<string>('');
    const [dueDay, setDueDay] = useState<string>('');
    
    const generateId = () => Math.random().toString(36).substring(2, 9);
    const [partners, setPartners] = useState<Partner[]>([{ id: generateId(), name: '', value: 0 }]);

    const numericTotal = parseFloat(totalValue) || 0;
    const distributedTotal = partners.reduce((acc, p) => acc + (p.value || 0), 0);
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

    const autoDistribute = (targetTotal: number, targetPartners: Partner[]) => {
        if (targetTotal <= 0 || targetPartners.length === 0) return targetPartners;
        const share = targetTotal / targetPartners.length;
        const floorShare = Math.floor(share * 100) / 100;
        return targetPartners.map((p, index) => {
            let val = floorShare;
            if (index === targetPartners.length - 1) {
                const currentSum = floorShare * (targetPartners.length - 1);
                val = Math.round((targetTotal - currentSum) * 100) / 100;
            }
            return { ...p, value: val };
        });
    };

    const handleSaveCard = async () => {
        setIsSubmitting(true);
        try {
            await addItem({ 
                companyName: companyName || 'Parceria Sem Nome', 
                totalValue: numericTotal, 
                dueDay: parseInt(dueDay) || 1, 
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

    const handleUpdateCard = async () => {
        if (!editingCard) return;
        setIsSaving(true);
        try {
            await updateItem(editingCard.id, editingCard);
            addToast('Parceria atualizada!', 'success');
            setEditingCard(null);
        } catch (err) {
            addToast('Erro ao atualizar.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Excluir esta parceria?')) {
            await deleteItem(id);
            addToast('Removida.', 'info');
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            action();
        }
    };

    const filteredCards = cards.filter(card => card.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Edit2 size={16} /> Editar Parceria
                            </h3>
                            <button onClick={() => setEditingCard(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400">Empresa</label>
                                    <input type="text" value={editingCard.companyName} onKeyDown={(e) => handleKeyDown(e, handleUpdateCard)} onChange={e => setEditingCard({...editingCard, companyName: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-black outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400">Valor</label>
                                        <input type="number" value={editingCard.totalValue} onKeyDown={(e) => handleKeyDown(e, handleUpdateCard)} onChange={e => setEditingCard({...editingCard, totalValue: parseFloat(e.target.value) || 0})} className="w-full border rounded-xl px-4 py-2.5 font-black focus:ring-2 focus:ring-black outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400">Dia Pag.</label>
                                        <input type="number" value={editingCard.dueDay} onKeyDown={(e) => handleKeyDown(e, handleUpdateCard)} onChange={e => setEditingCard({...editingCard, dueDay: parseInt(e.target.value) || 1})} className="w-full border rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-black outline-none text-center" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Beneficiários</label>
                                    <button 
                                        onClick={() => setEditingCard({...editingCard, partners: autoDistribute(editingCard.totalValue, editingCard.partners)})} 
                                        className="text-[10px] font-bold bg-black text-white px-3 py-1 rounded-lg"
                                    >
                                        AUTO RATEIO
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {editingCard.partners.map((p, idx) => (
                                        <div key={p.id} className="flex gap-2 items-center">
                                            <input type="text" value={p.name} onChange={e => {
                                                const newPartners = [...editingCard.partners];
                                                newPartners[idx].name = e.target.value;
                                                setEditingCard({...editingCard, partners: newPartners});
                                            }} placeholder="Nome" className="flex-1 bg-white border rounded-xl px-3 py-2 text-xs font-bold focus:border-black outline-none" />
                                            <input type="number" value={p.value} onChange={e => {
                                                const newPartners = [...editingCard.partners];
                                                newPartners[idx].value = parseFloat(e.target.value) || 0;
                                                setEditingCard({...editingCard, partners: newPartners});
                                            }} placeholder="Valor" className="w-24 bg-white border rounded-xl px-3 py-2 text-xs font-bold focus:border-black outline-none" />
                                            <button onClick={() => {
                                                const newPartners = editingCard.partners.filter((_, i) => i !== idx);
                                                setEditingCard({...editingCard, partners: newPartners});
                                            }} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setEditingCard({...editingCard, partners: [...editingCard.partners, {id: generateId(), name: '', value: 0}]})} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold text-[10px] uppercase hover:border-black hover:text-black flex items-center justify-center gap-2 transition-all">
                                        <Plus size={14} /> Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-2 shrink-0">
                            <button onClick={() => setEditingCard(null)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Cancelar</button>
                            <button onClick={handleUpdateCard} disabled={isSaving} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-gray-800 disabled:opacity-50">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="bg-white rounded-[2rem] p-6 shadow-float border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-black"></div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 pb-2 border-b flex justify-between items-center">Configurar Rateio <Calculator size={14} /></h3>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Projeto / Empresa</label>
                            <input type="text" value={companyName} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={e => setCompanyName(e.target.value)} placeholder="Nome" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valor R$</label>
                                <input type="number" value={totalValue} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={e => setTotalValue(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dia Pag.</label>
                                <input type="text" value={dueDay} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={e => setDueDay(e.target.value.replace(/\D/g, ''))} placeholder="DD" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black outline-none text-sm text-center" />
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
                            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Distribuição</label><button onClick={() => setPartners(autoDistribute(numericTotal, partners))} className="text-[10px] font-bold bg-black text-white px-3 py-1 rounded-lg shadow-sm">AUTO RATEIO</button></div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {partners.map((partner) => (
                                    <div key={partner.id} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                                        <input type="text" value={partner.name} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={(e) => updatePartner(partner.id, 'name', e.target.value)} placeholder="Sócio" className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-black outline-none shadow-sm" />
                                        <input type="number" value={partner.value || ''} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={(e) => updatePartner(partner.id, 'value', e.target.value)} placeholder="0.00" className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-black outline-none shadow-sm" />
                                        <button onClick={() => handleRemovePartnerInput(partner.id)} className="text-gray-300 hover:text-red-500 p-1.5"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddPartnerInput} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold text-[10px] uppercase hover:border-black hover:text-black flex items-center justify-center gap-2 transition-all"><Plus size={14} /> Novo</button>
                        </div>
                        <div className={`rounded-2xl p-4 flex items-center justify-between border transition-all shadow-sm ${isBalanced ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div><p className={`text-[9px] font-black uppercase tracking-widest ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>{isBalanced ? 'Saldo Verificado' : 'Diferença Pendente'}</p><p className="text-[10px] text-gray-500 font-bold mt-1">Total: {formatCurrency(distributedTotal)}</p></div>
                            <p className={`text-xl font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(difference)}</p>
                        </div>
                        <button onClick={handleSaveCard} className="w-full bg-black text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 disabled:opacity-50 transition-all">{isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Parceria</button>
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
                                <div className="absolute top-5 right-5 flex gap-1 z-20">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingCard(card); }} className="text-gray-200 hover:text-black p-1.5 transition-colors"><Edit2 size={18} /></button>
                                    <button onClick={(e) => handleConfirmDelete(card.id, e)} className="text-gray-200 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={18} /></button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 truncate">
                                        <h4 className="font-bold text-base truncate text-gray-900">{card.companyName}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-bold text-black">{formatCurrency(card.totalValue)}</span>
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
