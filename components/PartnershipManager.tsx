
import React, { useState } from 'react';
import { Users, Plus, Trash2, Calculator, AlertTriangle, CheckCircle2, DollarSign, Building2, Save, Calendar, Loader2 } from 'lucide-react';
import { formatCurrency } from '../services/utils';
import { Partner, PartnershipCard } from '../types';
import { useFirestoreCollection } from '../hooks/useFirestore';

interface PartnershipManagerProps {
    cards: PartnershipCard[]; // Keep for compatibility if needed, but we'll use the hook internally
    onAddCard: (card: PartnershipCard) => void;
    onDeleteCard: (id: string) => void;
}

// Rewriting to use internal hook instead of props for data source to ensure consistency with other modules
export const PartnershipManager: React.FC<PartnershipManagerProps> = () => {
    // Switch to Firestore
    const { data: cards, loading, addItem, deleteItem } = useFirestoreCollection<PartnershipCard>('partnerships');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [companyName, setCompanyName] = useState('');
    const [totalValue, setTotalValue] = useState<string>('');
    const [dueDay, setDueDay] = useState<string>('');
    
    // Internal Helper for random unique string for UI list keys
    const generateId = () => Math.random().toString(36).substring(2, 9);

    const [partners, setPartners] = useState<Partner[]>([
        { id: generateId(), name: '', value: 0 }
    ]);

    // Derived States for Calculation
    const numericTotal = parseFloat(totalValue) || 0;
    const distributedTotal = partners.reduce((acc, p) => acc + p.value, 0);
    const difference = numericTotal - distributedTotal;
    const isBalanced = Math.abs(difference) < 0.05; // Allowing float small margin

    const handleAddPartnerInput = () => {
        setPartners([...partners, { id: generateId(), name: '', value: 0 }]);
    };

    const handleRemovePartnerInput = (id: string) => {
        setPartners(partners.filter(p => p.id !== id));
    };

    const updatePartner = (id: string, field: 'name' | 'value', val: string) => {
        setPartners(partners.map(p => {
            if (p.id === id) {
                return { 
                    ...p, 
                    [field]: field === 'value' ? (parseFloat(val) || 0) : val.toUpperCase()
                };
            }
            return p;
        }));
    };

    const autoDistribute = () => {
        if (numericTotal <= 0 || partners.length === 0) return;
        const share = numericTotal / partners.length;
        // Fix rounding issues by adding diff to last one
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
        if (!companyName || numericTotal <= 0 || !isBalanced || !dueDay) return;
        setIsSubmitting(true);
        try {
            // Remove 'id' to let Firestore generate it
            const newCard: any = {
                companyName,
                totalValue: numericTotal,
                dueDay: parseInt(dueDay),
                partners: [...partners] // Copy
            };

            await addItem(newCard);
            
            // Reset Form
            setCompanyName('');
            setTotalValue('');
            setDueDay('');
            setPartners([{ id: generateId(), name: '', value: 0 }]);
        } catch(err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja apagar este contrato de parceria?')) {
            await deleteItem(id);
        }
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-20">
             <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                    Parcerias
                </h2>
                <p className="text-gray-600 font-medium mt-0.5 text-sm md:text-base">Divisão de receitas e rateio entre atores.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                
                {/* CREATOR CARD */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-float border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-black"></div>
                    
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-5 pb-2 border-b border-gray-100 flex justify-between items-center">
                        Novo Rateio
                        <Calculator size={14} />
                    </h3>

                    <div className="space-y-5">
                        {/* Company Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Empresa / Projeto</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value.toUpperCase())}
                                        placeholder="Nome da Empresa"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm uppercase"
                                    />
                                    <Building2 size={16} className="absolute left-3 top-3 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Valor Mensal Total</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={totalValue}
                                        onChange={e => setTotalValue(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
                                    />
                                    <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Dia Pagamento</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={2}
                                        value={dueDay}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 2) {
                                                if (!val || parseInt(val) <= 31) {
                                                    setDueDay(val);
                                                }
                                            }
                                        }}
                                        placeholder="DD"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
                                    />
                                    <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Partners Section */}
                        <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200 space-y-3">
                            <div className="flex justify-between items-center mb-1 px-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atores Envolvidos</label>
                                <button 
                                    onClick={autoDistribute}
                                    className="text-[9px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1"
                                    title="Dividir valor total igualmente"
                                >
                                    <Calculator size={10} /> <span className="hidden sm:inline">Divisão Inteligente</span><span className="sm:hidden">Auto</span>
                                </button>
                            </div>
                            
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                {partners.map((partner, index) => (
                                    <div key={partner.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center animate-in slide-in-from-left duration-300 p-2 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none border sm:border-none border-gray-100">
                                        <div className="flex w-full sm:w-auto items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {index + 1}
                                            </div>
                                            <input 
                                                type="text" 
                                                value={partner.name}
                                                onChange={(e) => updatePartner(partner.id, 'name', e.target.value)}
                                                placeholder="Nome do Sócio"
                                                className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold focus:border-black outline-none uppercase"
                                            />
                                            {/* Mobile Delete Button (Shows here for layout reasons) */}
                                             {partners.length > 1 && (
                                                <button 
                                                    onClick={() => handleRemovePartnerInput(partner.id)}
                                                    className="sm:hidden text-gray-300 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative w-full sm:w-28 shrink-0">
                                            <input 
                                                type="number" 
                                                value={partner.value === 0 ? '' : partner.value}
                                                onChange={(e) => updatePartner(partner.id, 'value', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-white border border-gray-200 rounded-lg pl-6 pr-2 py-2 text-xs font-bold focus:border-black outline-none"
                                            />
                                            <span className="absolute left-2 top-2 text-gray-400 text-[10px] font-bold">R$</span>
                                        </div>
                                        {/* Desktop Delete Button */}
                                        {partners.length > 1 && (
                                            <button 
                                                onClick={() => handleRemovePartnerInput(partner.id)}
                                                className="hidden sm:block text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={handleAddPartnerInput}
                                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 font-bold text-[10px] uppercase hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={12} strokeWidth={3} /> Adicionar Sócio
                            </button>
                        </div>

                        {/* CALCULATION ALERT / STATUS BAR */}
                        <div className={`rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between border transition-all duration-500 gap-3 ${
                            isBalanced 
                            ? 'bg-emerald-50 border-emerald-100' 
                            : 'bg-red-50 border-red-100 animate-pulse'
                        }`}>
                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                {isBalanced ? (
                                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={16} />
                                    </div>
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={16} />
                                    </div>
                                )}
                                <div>
                                    <p className={`text-[10px] font-black uppercase ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {isBalanced ? 'Cálculo Validado' : 'Erro de Cálculo'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Distribuído: {formatCurrency(distributedTotal)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right w-full sm:w-auto border-t sm:border-t-0 border-gray-200 pt-2 sm:pt-0">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Diferença</p>
                                <p className={`text-base font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(difference)}
                                </p>
                            </div>
                        </div>

                        {/* Action */}
                        <button 
                            onClick={handleSaveCard}
                            disabled={isSubmitting || !isBalanced || !companyName || numericTotal <= 0 || !dueDay}
                            className={`w-full py-3 rounded-lg font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                                isBalanced && companyName && numericTotal > 0 && dueDay
                                ? 'bg-black text-white hover:bg-gray-800 hover:scale-[1.01]' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSubmitting ? 'Salvando...' : 'Criar Card de Parceria'}
                        </button>
                    </div>
                </div>

                {/* GRID OF EXISTING CARDS */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg text-gray-800">Contratos Ativos</h3>
                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {loading ? '...' : cards.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5 min-h-[100px]">
                        {loading ? (
                            <div className="p-10 flex items-center justify-center text-gray-400">
                                <Loader2 size={24} className="animate-spin mr-2"/> Carregando...
                            </div>
                        ) : cards.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl text-sm">
                                Nenhuma parceria cadastrada.
                            </div>
                        ) : (
                            cards.map(card => (
                                <div key={card.id} className="bg-white rounded-2xl p-5 shadow-apple hover:shadow-float transition-all duration-300 border border-gray-100 group relative animate-in fade-in">
                                    <button 
                                        onClick={() => handleConfirmDelete(card.id)}
                                        className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-700 border border-gray-100 relative shrink-0">
                                            <Building2 size={20} strokeWidth={1.5} />
                                            {/* Due Day Badge */}
                                            <div className="absolute -bottom-1.5 -right-1.5 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                                                Dia {card.dueDay}
                                            </div>
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-black text-base leading-tight truncate uppercase">{card.companyName}</h4>
                                            <p className="text-xs font-bold text-gray-400">{formatCurrency(card.totalValue)} / mês</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        {card.partners.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-xs text-gray-700 truncate uppercase">{p.name}</span>
                                                </div>
                                                <span className="font-black text-xs text-black whitespace-nowrap">{formatCurrency(p.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Rateio Total</span>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">100% Distribuído</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
