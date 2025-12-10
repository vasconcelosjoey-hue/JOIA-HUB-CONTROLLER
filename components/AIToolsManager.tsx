import React, { useState } from 'react';
import { Bot, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { CpuArchitecture } from './ui/cpu-architecture';

interface Tool {
    id: string;
    name: string;
    value: number;
    dueDate: number;
}

export const AIToolsManager: React.FC = () => {
    // Switch to Firestore
    const { data: tools, addItem, deleteItem } = useFirestoreCollection<Tool>('ai_tools');
    
    const [newName, setNewName] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDate, setNewDate] = useState('');

    const handleAdd = async () => {
        if (!newName || !newValue || !newDate) return;
        const newTool: Tool = {
            id: Date.now().toString(),
            name: newName,
            value: parseFloat(newValue),
            dueDate: parseInt(newDate)
        };
        await addItem(newTool);
        setNewName('');
        setNewValue('');
        setNewDate('');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover esta ferramenta?')) {
            await deleteItem(id);
        }
    };

    const totalCost = tools.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
             <div className="relative overflow-hidden text-center md:text-left">
                {/* Visual Integration of CPU Architecture */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[150px] opacity-10 pointer-events-none hidden md:block">
                    <CpuArchitecture text="AI CORE" />
                </div>
                
                <h2 className="text-4xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-3 relative z-10">
                    <Bot size={32} className="text-black" strokeWidth={2.5} />
                    Ferramentas IA
                </h2>
                <p className="text-gray-600 font-medium mt-1 text-lg relative z-10">Gerenciamento de assinaturas e custos operacionais.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Form */}
                <div className="bg-white rounded-3xl p-8 shadow-apple border border-gray-200 h-fit">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">Nova Ferramenta</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome da Ferramenta</label>
                            <input 
                                type="text" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ex: ChatGPT Plus"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={newValue}
                                        onChange={e => setNewValue(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 pl-8 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                    />
                                    <span className="absolute left-3 top-3.5 text-gray-500 text-xs font-bold">R$</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Dia Venc.</label>
                                <input 
                                    type="number" 
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                    placeholder="Dia"
                                    min="1" max="31"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleAdd}
                            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            <Plus size={20} strokeWidth={3} /> Adicionar
                        </button>
                    </div>
                </div>

                {/* List & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-black text-white rounded-3xl p-8 shadow-float flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Custo Mensal Total</p>
                            <p className="text-5xl font-black tracking-tighter">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="font-bold text-lg">{tools.length} Ferramentas</p>
                                <p className="text-gray-400 text-sm">Ativas</p>
                            </div>
                            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <DollarSign size={28} />
                            </div>
                        </div>
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    </div>

                    {/* Tools List */}
                    <div className="bg-white rounded-3xl shadow-apple border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-black text-black">Ferramentas Ativas</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {tools.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 font-medium">Nenhuma ferramenta cadastrada.</div>
                            ) : (
                                tools.map(tool => (
                                    <div key={tool.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                <Bot size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-black">{tool.name}</p>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                                                    <Calendar size={12} /> Dia {tool.dueDate}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="font-black text-lg">{formatCurrency(tool.value)}</p>
                                            <button 
                                                onClick={() => handleDelete(tool.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                                title="Remover"
                                            >
                                                <Trash2 size={18} />
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