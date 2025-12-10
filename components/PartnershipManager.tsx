import React, { useState } from 'react';
import { Users, Plus, Trash2, Calculator, AlertTriangle, CheckCircle2, DollarSign, Building2, Save, Calendar } from 'lucide-react';
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
    const { data: cards, addItem, deleteItem } = useFirestoreCollection<PartnershipCard>('partnerships');

    // Form States
    const [companyName, setCompanyName] = useState('');
    const [totalValue, setTotalValue] = useState<string>('');
    const [dueDay, setDueDay] = useState<string>('');
    const [partners, setPartners] = useState<Partner[]>([
        { id: Date.now().toString(), name: '', value: 0 }
    ]);

    // Derived States for Calculation
    const numericTotal = parseFloat(totalValue) || 0;
    const distributedTotal = partners.reduce((acc, p) => acc + p.value, 0);
    const difference = numericTotal - distributedTotal;
    const isBalanced = Math.abs(difference) < 0.05; // Allowing float small margin

    const handleAddPartnerInput = () => {
        setPartners([...partners, { id: Date.now().toString(), name: '', value: 0 }]);
    };

    const handleRemovePartnerInput = (id: string) => {
        setPartners(partners.filter(p => p.id !== id));
    };

    const updatePartner = (id: string, field: 'name' | 'value', val: string) => {
        setPartners(partners.map(p => {
            if (p.id === id) {
                return { 
                    ...p, 
                    [field]: field === 'value' ? (parseFloat(val) || 0) : val 
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
        
        const newCard: PartnershipCard = {
            id: Date.now().toString(),
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
        setPartners([{ id: Date.now().toString(), name: '', value: 0 }]);
    };

    const handleConfirmDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja apagar este contrato de parceria?')) {
            await deleteItem(id);
        }
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
             <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-3">
                    <Users size={32} className="text-black" strokeWidth={2.5} />
                    Gestão de Parcerias
                </h2>
                <p className="text-gray-600 font-medium mt-1 text-lg">Divisão de receitas e rateio entre atores.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                
                {/* CREATOR CARD */}
                <div className="bg-white rounded-[2rem] p-8 shadow-float border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
                    
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 flex justify-between items-center">
                        Novo Contrato de Rateio
                        <Calculator size={16} />
                    </h3>

                    <div className="space-y-6">
                        {/* Company Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Empresa / Projeto</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="Nome da Empresa"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-3.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                    />
                                    <Building2 size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor Mensal Total</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={totalValue}
                                        onChange={e => setTotalValue(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-3.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                    />
                                    <DollarSign size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Dia Pagamento</label>
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
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-3.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                    />
                                    <Calendar size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Partners Section */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atores Envolvidos</label>
                                <button 
                                    onClick={autoDistribute}
                                    className="text-[10px] font-bold bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                                    title="Dividir valor total igualmente"
                                >
                                    <Calculator size={12} /> Divisão Inteligente
                                </button>
                            </div>
                            
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {partners.map((partner, index) => (
                                    <div key={partner.id} className="flex gap-3 items-center animate-in slide-in-from-left duration-300">
                                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={partner.name}
                                            onChange={(e) => updatePartner(partner.id, 'name', e.target.value)}
                                            placeholder="Nome do Sócio"
                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-black outline-none"
                                        />
                                        <div className="relative w-32 shrink-0">
                                            <input 
                                                type="number" 
                                                value={partner.value === 0 ? '' : partner.value}
                                                onChange={(e) => updatePartner(partner.id, 'value', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-white border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold focus:border-black outline-none"
                                            />
                                            <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-bold">R$</span>
                                        </div>
                                        {partners.length > 1 && (
                                            <button 
                                                onClick={() => handleRemovePartnerInput(partner.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={handleAddPartnerInput}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold text-xs uppercase hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} strokeWidth={3} /> Adicionar Sócio
                            </button>
                        </div>

                        {/* CALCULATION ALERT / STATUS BAR */}
                        <div className={`rounded-xl p-4 flex items-center justify-between border transition-all duration-500 ${
                            isBalanced 
                            ? 'bg-emerald-50 border-emerald-100' 
                            : 'bg-red-50 border-red-100 animate-pulse'
                        }`}>
                            <div className="flex items-center gap-3">
                                {isBalanced ? (
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 size={18} />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                        <AlertTriangle size={18} />
                                    </div>
                                )}
                                <div>
                                    <p className={`text-xs font-black uppercase ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {isBalanced ? 'Cálculo Validado' : 'Erro de Cálculo'}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Distribuído: {formatCurrency(distributedTotal)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Diferença</p>
                                <p className={`text-lg font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(difference)}
                                </p>
                            </div>
                        </div>

                        {/* Action */}
                        <button 
                            onClick={handleSaveCard}
                            disabled={!isBalanced || !companyName || numericTotal <= 0 || !dueDay}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                                isBalanced && companyName && numericTotal > 0 && dueDay
                                ? 'bg-black text-white hover:bg-gray-800 hover:scale-[1.01]' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Save size={18} /> Criar Card de Parceria
                        </button>
                    </div>
                </div>

                {/* GRID OF EXISTING CARDS */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-xl text-gray-800">Contratos Ativos</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{cards.length}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {cards.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                                Nenhuma parceria cadastrada.
                            </div>
                        ) : (
                            cards.map(card => (
                                <div key={card.id} className="bg-white rounded-3xl p-6 shadow-apple hover:shadow-float transition-all duration-300 border border-gray-100 group relative">
                                    <button 
                                        onClick={() => handleConfirmDelete(card.id)}
                                        className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-700 border border-gray-100 relative">
                                            <Building2 size={24} strokeWidth={1.5} />
                                            {/* Due Day Badge */}
                                            <div className="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                                                Dia {card.dueDay}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg leading-tight">{card.companyName}</h4>
                                            <p className="text-sm font-bold text-gray-400">{formatCurrency(card.totalValue)} / mês</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {card.partners.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-sm text-gray-700">{p.name}</span>
                                                </div>
                                                <span className="font-black text-sm text-black">{formatCurrency(p.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Rateio Total</span>
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">100% Distribuído</span>
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