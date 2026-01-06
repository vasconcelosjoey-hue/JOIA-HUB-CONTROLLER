
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Calculator, Save, Handshake, Loader2, ChevronDown, ChevronUp, Search, Edit2, X, Check, QrCode, Copy, Sparkles, Building2 } from 'lucide-react';
import { formatCurrency } from '../services/utils';
import { Partner, PartnershipCard, PixKey } from '../types';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { useToast } from '../context/ToastContext';

export const PartnershipManager: React.FC = () => {
    const { data: cards, loading, addItem, updateItem, deleteItem } = useFirestoreCollection<PartnershipCard>('partnerships');
    const { data: pixKeys, addItem: addPixKey, updateItem: updatePixKey, deleteItem: deletePixKey } = useFirestoreCollection<PixKey>('pix_keys');
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [editingCard, setEditingCard] = useState<PartnershipCard | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Pix Popover States
    const [isPixOpen, setIsPixOpen] = useState(false);
    const [editingPixId, setEditingPixId] = useState<string | null>(null);
    const [newPixType, setNewPixType] = useState<PixKey['type']>('ALEATORIA');
    const [newPixLabel, setNewPixLabel] = useState('');
    const [newPixBank, setNewPixBank] = useState('');
    const [newPixValue, setNewPixValue] = useState('');
    const [copyId, setCopyId] = useState<string | null>(null);
    const pixRef = useRef<HTMLDivElement>(null);

    const [companyName, setCompanyName] = useState('');
    const [totalValue, setTotalValue] = useState<string>('');
    const [dueDay, setDueDay] = useState<string>('');
    
    const generateId = () => Math.random().toString(36).substring(2, 9);
    const [partners, setPartners] = useState<Partner[]>([{ id: generateId(), name: '', value: 0 }]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pixRef.current && !pixRef.current.contains(event.target as Node)) {
                setIsPixOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleEditPix = (key: PixKey) => {
        setEditingPixId(key.id);
        setNewPixType(key.type);
        setNewPixLabel(key.label);
        setNewPixBank(key.bank || '');
        setNewPixValue(key.key);
    };

    const cancelPixEdit = () => {
        setEditingPixId(null);
        setNewPixLabel('');
        setNewPixValue('');
        setNewPixBank('');
        setNewPixType('ALEATORIA');
    };

    const handleSavePix = async () => {
        if (!newPixLabel || !newPixValue) {
            addToast('Preencha pelo menos Identificação e Chave.', 'warning');
            return;
        }
        try {
            if (editingPixId) {
                await updatePixKey(editingPixId, {
                    label: newPixLabel.trim(),
                    type: newPixType,
                    key: newPixValue.trim(),
                    bank: newPixBank.trim(),
                });
                addToast('Chave PIX atualizada!', 'success');
            } else {
                await addPixKey({
                    label: newPixLabel.trim(),
                    type: newPixType,
                    key: newPixValue.trim(),
                    bank: newPixBank.trim(),
                    createdAt: new Date().toISOString()
                } as PixKey);
                addToast('Chave PIX salva!', 'success');
            }
            cancelPixEdit();
        } catch (err) {
            addToast('Erro ao salvar PIX.', 'error');
        }
    };

    const copyPix = (id: string, key: string) => {
        navigator.clipboard.writeText(key);
        setCopyId(id);
        addToast('PIX copiado!', 'success');
        setTimeout(() => setCopyId(null), 2000);
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 relative">
            {/* Pix Key Popover Menu */}
            <div className="absolute top-0 right-0 z-50 flex flex-col items-end" ref={pixRef}>
                <button 
                    onClick={() => setIsPixOpen(!isPixOpen)}
                    className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-black hover:border-black"
                >
                    <QrCode size={14} className={isPixOpen ? 'text-black' : 'text-gray-400'} />
                    Chaves PIX
                    {isPixOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isPixOpen && (
                    <div className="mt-2 w-[90vw] max-w-[340px] md:w-80 bg-white border border-gray-200 rounded-3xl shadow-2xl animate-in slide-in-from-top-4 duration-300 overflow-hidden right-0">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {editingPixId ? 'Editando Chave' : 'Suas Chaves PIX'}
                            </span>
                            <Sparkles size={14} className="text-amber-500" />
                        </div>
                        
                        {/* PIX Form */}
                        <div className={`p-4 space-y-3 border-b border-gray-100 transition-colors ${editingPixId ? 'bg-amber-50/30' : 'bg-white/50 backdrop-blur-sm'}`}>
                            <div className="grid grid-cols-2 gap-2">
                                <select 
                                    value={newPixType} 
                                    onChange={e => setNewPixType(e.target.value as any)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase outline-none focus:border-black appearance-none w-full text-center"
                                >
                                    <option value="ALEATORIA">ALEA</option>
                                    <option value="CPF">CPF</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="EMAIL">EMAIL</option>
                                    <option value="TELEFONE">TEL</option>
                                </select>
                                <input 
                                    type="text" 
                                    value={newPixBank} 
                                    onChange={e => setNewPixBank(e.target.value)}
                                    placeholder="Banco (Ex: Nubank)" 
                                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-black w-full"
                                />
                            </div>
                            <input 
                                type="text" 
                                value={newPixLabel} 
                                onChange={e => setNewPixLabel(e.target.value)}
                                placeholder="Identificação (Ex: Joedge)" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-black"
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newPixValue} 
                                    onChange={e => setNewPixValue(e.target.value)}
                                    placeholder="A chave aqui..." 
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-mono outline-none focus:border-black"
                                />
                                {editingPixId && (
                                    <button onClick={cancelPixEdit} className="bg-gray-200 text-gray-500 p-2 rounded-lg hover:bg-gray-300 transition-colors shrink-0">
                                        <X size={14} />
                                    </button>
                                )}
                                <button 
                                    onClick={handleSavePix} 
                                    className={`${editingPixId ? 'bg-amber-500' : 'bg-black'} text-white p-2 rounded-lg hover:opacity-80 transition-all shrink-0`}
                                >
                                    {editingPixId ? <Check size={14} /> : <Plus size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* PIX List */}
                        <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                            {pixKeys.length === 0 ? (
                                <div className="p-8 text-center text-gray-300 text-[10px] font-black uppercase italic">Nenhuma chave salva</div>
                            ) : (
                                pixKeys.map(k => (
                                    <div key={k.id} className={`p-3 transition-colors group ${editingPixId === k.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[7px] font-black bg-gray-200 px-1 py-0.5 rounded-sm uppercase tracking-tighter shrink-0">{k.type}</span>
                                                    <span className="text-[10px] font-black text-black uppercase truncate max-w-[120px]">{k.label}</span>
                                                </div>
                                                {k.bank && (
                                                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                                                        <Building2 size={8} /> {k.bank}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={() => handleEditPix(k)}
                                                    className="text-gray-300 hover:text-black p-1"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => deletePixKey(k.id)} 
                                                    className="text-gray-300 hover:text-red-500 p-1"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 bg-gray-100/50 rounded-lg p-2">
                                            <span className="text-[10px] font-mono text-gray-500 truncate flex-1 break-all">{k.key}</span>
                                            <button 
                                                onClick={() => copyPix(k.id, k.key)}
                                                className={`p-1.5 rounded-md transition-all shrink-0 ${copyId === k.id ? 'bg-emerald-500 text-white' : 'bg-white border text-gray-400 hover:text-black hover:border-black shadow-sm'}`}
                                            >
                                                {copyId === k.id ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {editingCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-widest text-gray-400">
                                <Edit2 size={16} className="text-black" /> Editar Parceria
                            </h3>
                            <button onClick={() => setEditingCard(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa</label>
                                    <input type="text" value={editingCard.companyName} onKeyDown={(e) => handleKeyDown(e, handleUpdateCard)} onChange={e => setEditingCard({...editingCard, companyName: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-black focus:border-black outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</label>
                                        <input type="number" value={editingCard.totalValue} onKeyDown={(e) => handleKeyDown(e, handleUpdateCard)} onChange={e => setEditingCard({...editingCard, totalValue: parseFloat(e.target.value) || 0})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-black focus:border-black outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dia Pag.</label>
                                        <input type="number" value={editingCard.dueDay} onKeyDown={(e) => handleKeyDown(e, handleUpdateCard)} onChange={e => setEditingCard({...editingCard, dueDay: parseInt(e.target.value) || 1})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-black focus:border-black outline-none transition-all text-center" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Beneficiários</label>
                                    <button 
                                        onClick={() => setEditingCard({...editingCard, partners: autoDistribute(editingCard.totalValue, editingCard.partners)})} 
                                        className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg shadow-md uppercase tracking-tighter"
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
                                            }} placeholder="Nome" className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-black focus:border-black outline-none shadow-sm uppercase tracking-tight" />
                                            <input type="number" value={p.value} onChange={e => {
                                                const newPartners = [...editingCard.partners];
                                                newPartners[idx].value = parseFloat(e.target.value) || 0;
                                                setEditingCard({...editingCard, partners: newPartners});
                                            }} placeholder="Valor" className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-black focus:border-black outline-none shadow-sm" />
                                            <button onClick={() => {
                                                const newPartners = editingCard.partners.filter((_, i) => i !== idx);
                                                setEditingCard({...editingCard, partners: newPartners});
                                            }} className="text-gray-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setEditingCard({...editingCard, partners: [...editingCard.partners, {id: generateId(), name: '', value: 0}]})} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-black text-[10px] uppercase hover:border-black hover:text-black flex items-center justify-center gap-2 transition-all">
                                        <Plus size={14} /> Adicionar Sócio
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setEditingCard(null)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                            <button onClick={handleUpdateCard} disabled={isSaving} className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-gray-800 disabled:opacity-50 transition-all">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start pt-14 md:pt-0">
                {/* Form Creation Card */}
                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-float border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-black"></div>
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-gray-50 rounded-full group-hover:bg-black/5 transition-colors duration-700"></div>
                    
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 pb-3 border-b flex justify-between items-center relative z-10">
                        Configurar Rateio <Calculator size={14} className="text-black" />
                    </h3>
                    
                    <div className="space-y-6 relative z-10">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Projeto / Empresa</label>
                            <input type="text" value={companyName} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={e => setCompanyName(e.target.value)} placeholder="Nome do Cliente" className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-3.5 text-black font-black focus:bg-white focus:border-black outline-none transition-all text-sm shadow-inner uppercase tracking-tight" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Total R$</label>
                                <input type="number" value={totalValue} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={e => setTotalValue(e.target.value)} placeholder="0.00" className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-3.5 text-black font-black focus:bg-white focus:border-black outline-none transition-all text-sm shadow-inner" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dia Pagamento</label>
                                <input type="text" value={dueDay} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={e => setDueDay(e.target.value.replace(/\D/g, ''))} placeholder="DD" className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-3.5 text-black font-black focus:bg-white focus:border-black outline-none transition-all text-sm text-center shadow-inner" />
                            </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-3xl p-5 border-2 border-gray-100/50 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Distribuição de Lucro</label>
                                <button onClick={() => setPartners(autoDistribute(numericTotal, partners))} className="text-[9px] font-black bg-black text-white px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-tight">AUTO RATEIO</button>
                            </div>
                            
                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                {partners.map((partner) => (
                                    <div key={partner.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-300">
                                        <input type="text" value={partner.name} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={(e) => updatePartner(partner.id, 'name', e.target.value)} placeholder="Sócio / Parceiro" className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-black focus:border-black outline-none shadow-sm uppercase tracking-tight" />
                                        <input type="number" value={partner.value || ''} onKeyDown={(e) => handleKeyDown(e, handleSaveCard)} onChange={(e) => updatePartner(partner.id, 'value', e.target.value)} placeholder="0.00" className="w-24 bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-black focus:border-black outline-none shadow-sm" />
                                        <button onClick={() => handleRemovePartnerInput(partner.id)} className="text-gray-200 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddPartnerInput} className="w-full py-3.5 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-black text-[10px] uppercase hover:border-black hover:text-black flex items-center justify-center gap-2 transition-all shadow-sm">
                                <Plus size={14} /> Novo Beneficiário
                            </button>
                        </div>

                        <div className={`rounded-3xl p-5 flex items-center justify-between border-2 transition-all shadow-lg ${isBalanced ? 'bg-emerald-50 border-emerald-100 shadow-emerald-100/20' : 'bg-red-50 border-red-100 shadow-red-100/20'}`}>
                            <div>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>{isBalanced ? 'Saldo Verificado' : 'Diferença Pendente'}</p>
                                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight">Total Alocado: {formatCurrency(distributedTotal)}</p>
                            </div>
                            <p className={`text-2xl font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'} tracking-tighter`}>{formatCurrency(difference)}</p>
                        </div>

                        <button onClick={handleSaveCard} className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all">
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Nova Parceria
                        </button>
                    </div>
                </div>

                {/* List Side */}
                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                            <Search size={18} />
                        </div>
                        <input type="text" placeholder="Filtrar por nome do cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-transparent rounded-[1.5rem] pl-11 pr-5 py-4 text-sm font-black shadow-apple focus:border-black outline-none transition-all uppercase tracking-tight" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[75vh] custom-scrollbar pr-1">
                        {filteredCards.length === 0 && !loading && (
                            <div className="p-16 text-center text-gray-300 flex flex-col items-center gap-4 bg-white rounded-[2rem] border border-gray-100">
                                <Handshake size={48} strokeWidth={1} className="opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma parceria encontrada</p>
                            </div>
                        )}
                        {filteredCards.map(card => (
                            <div key={card.id} onClick={() => toggleCard(card.id)} className="bg-white rounded-[2rem] p-6 shadow-apple hover:shadow-float transition-all border-2 border-transparent hover:border-black/5 group relative cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="absolute top-6 right-6 flex gap-1 z-20">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingCard(card); }} className="text-gray-200 hover:text-black p-2 transition-all hover:bg-gray-50 rounded-lg"><Edit2 size={18} /></button>
                                    <button onClick={(e) => handleConfirmDelete(card.id, e)} className="text-gray-200 hover:text-red-500 p-2 transition-all hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-500 shrink-0 shadow-inner">
                                        <Building2 size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 truncate">
                                        <h4 className="font-black text-base truncate text-gray-900 uppercase tracking-tight">{card.companyName}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-sm font-black text-black">{formatCurrency(card.totalValue)}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dia {card.dueDay}</span>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-full hover:bg-gray-50">
                                        {expandedCards.has(card.id) ? <ChevronUp size={20} className="text-black" /> : <ChevronDown size={20} className="text-gray-400" />}
                                    </div>
                                </div>
                                
                                {expandedCards.has(card.id) && (
                                    <div className="mt-6 pt-6 border-t border-gray-50 space-y-2.5 animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Distribuição por Sócio</span>
                                        </div>
                                        {card.partners.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100/50 shadow-sm hover:bg-white transition-colors duration-300">
                                                <span className="font-black text-[10px] text-gray-700 uppercase tracking-tighter">{p.name}</span>
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
