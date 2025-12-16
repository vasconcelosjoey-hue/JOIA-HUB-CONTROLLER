
import React, { useState } from 'react';
import { Bot, Plus, Trash2, Calendar, DollarSign, Loader2, User } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { CpuArchitecture } from './ui/cpu-architecture';

interface Tool {
    id: string;
    name: string;
    value: number;
    dueDate: number;
    owner?: 'CARRYON' | 'SPENCER' | 'JOI.A.';
}

export const AIToolsManager: React.FC = () => {
    // Switch to Firestore
    const { data: tools, loading, addItem, deleteItem } = useFirestoreCollection<Tool>('ai_tools');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newName, setNewName] = useState('');
    const [newValue, setNewValue] = useState(''); // String for smart format
    const [newDate, setNewDate] = useState('');
    const [newOwner, setNewOwner] = useState<Tool['owner']>('CARRYON');

    const handleAdd = async () => {
        if (!newName || !newValue || !newDate) return;
        setIsSubmitting(true);
        try {
            // Remove 'id' to allow Firestore to generate it
            const newTool: Omit<Tool, 'id'> = {
                name: newName,
                value: parseCurrencyInput(newValue),
                dueDate: parseInt(newDate),
                owner: newOwner
            };
            await addItem(newTool);
            setNewName('');
            setNewValue('');
            setNewDate('');
            setNewOwner('CARRYON');
        } catch(err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover esta ferramenta?')) {
            await deleteItem(id);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newName && newValue && newDate) {
            handleAdd();
        }
    };

    const totalCost = tools.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
             <div className="relative overflow-hidden text-center md:text-left">
                {/* Visual Integration of CPU Architecture */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[250px] h-[120px] opacity-10 pointer-events-none hidden md:block">
                    <CpuArchitecture text="AI CORE" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-2 relative z-10">
                    <Bot className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                    Ferramentas IA
                </h2>
                <p className="text-gray-600 font-medium mt-0.5 text-sm md:text-base relative z-10">Gerenciamento de assinaturas e custos operacionais.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <div className="bg-white rounded-2xl p-5 shadow-apple border border-gray-200 h-fit" onKeyDown={handleKeyDown}>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Nova Ferramenta</h3>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Ferramenta</label>
                            <input 
                                type="text" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ex: ChatGPT Plus"
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Valor (R$)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={newValue}
                                        onChange={e => setNewValue(formatCurrencyInput(e.target.value))}
                                        placeholder="0,00"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 pl-7 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
                                    />
                                    <span className="absolute left-2.5 top-2.5 text-gray-500 text-xs font-bold">R$</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Dia Venc.</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength={2}
                                    value={newDate}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 2) {
                                            if (!val || parseInt(val) <= 31) {
                                                setNewDate(val);
                                            }
                                        }
                                    }}
                                    placeholder="DD"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-center text-sm"
                                />
                            </div>
                        </div>

                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Responsável (Payer)</label>
                            <select 
                                value={newOwner} 
                                onChange={(e) => setNewOwner(e.target.value as any)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm appearance-none"
                            >
                                <option value="CARRYON">CARRYON</option>
                                <option value="SPENCER">SPENCER</option>
                                <option value="JOI.A.">JOI.A.</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleAdd}
                            disabled={isSubmitting || !newName || !newValue || !newDate}
                            className="w-full bg-black text-white font-black uppercase tracking-widest py-3 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                            {isSubmitting ? 'Salvando...' : 'Adicionar'}
                        </button>
                    </div>
                </div>

                {/* List & Summary */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Summary Card */}
                    <div className="bg-black text-white rounded-2xl p-6 shadow-float flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="relative z-10 text-center md:text-left">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Custo Mensal Total</p>
                            <p className="text-4xl font-black tracking-tighter">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="font-bold text-base">{loading ? '...' : tools.length} Ferramentas</p>
                                <p className="text-gray-400 text-xs">Ativas</p>
                            </div>
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                    </div>

                    {/* Tools List */}
                    <div className="bg-white rounded-2xl shadow-apple border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-black text-black text-sm">Ferramentas Ativas</h3>
                        </div>
                        <div className="divide-y divide-gray-100 min-h-[80px]">
                            {loading ? (
                                <div className="p-6 flex items-center justify-center text-gray-400">
                                    <Loader2 size={20} className="animate-spin mr-2"/> Carregando...
                                </div>
                            ) : tools.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 font-medium text-sm">Nenhuma ferramenta cadastrada.</div>
                            ) : (
                                tools.map(tool => (
                                    <div key={tool.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group animate-in fade-in">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                                <Bot size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-black text-sm">{tool.name}</p>
                                                <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500">
                                                    <span className="flex items-center gap-1"><Calendar size={10} /> Dia {tool.dueDate}</span>
                                                    {tool.owner && (
                                                        <>
                                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                            <span className="flex items-center gap-1 uppercase text-[9px]"><User size={10} /> {tool.owner}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-black text-base">{formatCurrency(tool.value)}</p>
                                            <button 
                                                onClick={() => handleDelete(tool.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1.5"
                                                title="Remover"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
