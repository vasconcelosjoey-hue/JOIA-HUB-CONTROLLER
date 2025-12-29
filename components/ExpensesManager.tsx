
import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Trash2, Loader2, Search, Calendar, Clock, DollarSign, Fuel, Utensils, Box, MoreHorizontal, Edit2, X, Save, Sparkles } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { Expense } from '../types';
import { useToast } from '../context/ToastContext';

export const ExpensesManager: React.FC = () => {
    const { data: expenses, loading, addItem, updateItem, deleteItem } = useFirestoreCollection<Expense>('expenses');
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editValueStr, setEditValueStr] = useState('');
    
    // Form States for New Expense
    const [category, setCategory] = useState('AVULSA');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');

    const categories = [
        { id: 'AVULSA', label: 'Avulsa', icon: Sparkles },
        { id: 'GASOLINA', label: 'Gasolina', icon: Fuel },
        { id: 'REFEIÇÃO', label: 'Refeição', icon: Utensils },
        { id: 'LOGÍSTICA', label: 'Logística', icon: Box },
        { id: 'HARDWARE', label: 'Hardware', icon: DollarSign },
        { id: 'OUTROS', label: 'Outros', icon: MoreHorizontal },
    ];

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const todayStr = now.toISOString().split('T')[0];

        const monthlyTotal = expenses.reduce((acc, exp) => {
            const expDate = new Date(exp.timestamp);
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                return acc + exp.value;
            }
            return acc;
        }, 0);

        const todayTotal = expenses.reduce((acc, exp) => {
            if (exp.timestamp.startsWith(todayStr)) {
                return acc + exp.value;
            }
            return acc;
        }, 0);

        return { monthlyTotal, todayTotal };
    }, [expenses]);

    const handleAdd = async () => {
        if (!title) {
            addToast('Dê um nome para a despesa.', 'warning');
            return;
        }
        if (!value || parseCurrencyInput(value) <= 0) {
            addToast('Insira um valor válido.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const newExpense: Omit<Expense, 'id'> = {
                title: title.trim(),
                category,
                description: description.trim() || category,
                value: parseCurrencyInput(value),
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            await addItem(newExpense);
            addToast('Despesa registrada!', 'success');
            setTitle('');
            setDescription('');
            setValue('');
        } catch (err) {
            addToast('Erro ao salvar despesa.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (expense: Expense) => {
        setEditingExpense(expense);
        setEditValueStr(formatCurrency(expense.value).replace('R$', '').trim());
    };

    const handleUpdate = async () => {
        if (!editingExpense) return;
        if (!editingExpense.title) {
            addToast('A despesa precisa de um título.', 'warning');
            return;
        }
        if (editingExpense.value <= 0) {
            addToast('Insira um valor válido.', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            await updateItem(editingExpense.id, {
                title: editingExpense.title,
                category: editingExpense.category,
                description: editingExpense.description,
                value: editingExpense.value
            });
            addToast('Despesa atualizada!', 'success');
            setEditingExpense(null);
        } catch (err) {
            addToast('Erro ao atualizar despesa.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Excluir este registro?')) {
            await deleteItem(id);
            addToast('Registro removido.', 'info');
        }
    };

    const filteredExpenses = expenses
        .filter(exp => 
            (exp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
            exp.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const getCategoryIcon = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        const Icon = cat?.icon || MoreHorizontal;
        return <Icon size={16} />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Modal de Edição */}
            {editingExpense && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-sm flex items-center gap-2 uppercase tracking-widest text-gray-400">
                                <Edit2 size={16} className="text-black" /> Editar Despesa
                            </h3>
                            <button onClick={() => setEditingExpense(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Título</label>
                                <input 
                                    type="text" 
                                    value={editingExpense.title || ''} 
                                    onChange={e => setEditingExpense({...editingExpense, title: e.target.value})} 
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 font-black focus:border-black outline-none transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {categories.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => setEditingExpense({...editingExpense, category: cat.id})}
                                            className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all min-h-[60px] ${editingExpense.category === cat.id ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'}`}
                                        >
                                            <cat.icon size={18} />
                                            <span className="text-[7px] font-black uppercase mt-1 leading-none tracking-tighter">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={editingExpense.description} 
                                    onChange={e => setEditingExpense({...editingExpense, description: e.target.value})} 
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 font-bold focus:border-black outline-none transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={editValueStr} 
                                        onChange={e => {
                                            const formatted = formatCurrencyInput(e.target.value);
                                            setEditValueStr(formatted);
                                            setEditingExpense({...editingExpense, value: parseCurrencyInput(formatted)});
                                        }} 
                                        className="w-full border-2 border-gray-100 rounded-2xl pl-10 pr-5 py-3.5 font-black text-xl focus:border-black outline-none transition-all" 
                                    />
                                    <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setEditingExpense(null)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-2xl transition-all">Cancelar</button>
                            <button onClick={handleUpdate} disabled={isSaving} className="bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-gray-800 disabled:opacity-50 transition-all">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black text-white rounded-3xl p-6 shadow-float border border-white/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Mensal Operacional</p>
                        <h2 className="text-3xl font-black tracking-tighter">{formatCurrency(stats.monthlyTotal)}</h2>
                    </div>
                    <Receipt size={80} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-apple border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Gasto Hoje</p>
                        <h2 className="text-3xl font-black tracking-tighter text-black">{formatCurrency(stats.todayTotal)}</h2>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                        <Clock size={24} className="text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="bg-white rounded-[2rem] p-6 shadow-apple border border-gray-200 h-fit space-y-5">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-3">Nova Despesa</h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Nome / Pessoa</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Igor"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Categoria</label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {categories.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all min-h-[60px] ${category === cat.id ? 'bg-black text-white border-black shadow-md' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'}`}
                                    >
                                        <cat.icon size={18} />
                                        <span className="text-[7px] font-black uppercase mt-1 leading-none tracking-tighter">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Descrição (Opcional)</label>
                            <input 
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ex: Almoço Reunião Alpha"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Valor</label>
                            <input 
                                type="text"
                                value={value}
                                onChange={e => setValue(formatCurrencyInput(e.target.value))}
                                placeholder="R$ 0,00"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base font-black focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>

                        <button 
                            onClick={handleAdd}
                            disabled={isSubmitting}
                            className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                            Registrar Despesa
                        </button>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Buscar despesas..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-black outline-none"
                        />
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-apple border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {filteredExpenses.length === 0 && !loading && (
                                <div className="p-10 text-center text-gray-300">
                                    <Receipt size={40} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">Nenhuma despesa registrada</p>
                                </div>
                            )}
                            {filteredExpenses.map(exp => (
                                <div key={exp.id} onClick={() => handleEditClick(exp)} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-black group-hover:text-white transition-all">
                                            {getCategoryIcon(exp.category)}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-black text-sm text-black truncate uppercase tracking-tight">{exp.title || 'Sem Título'}</p>
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-bold text-gray-400 truncate uppercase">{exp.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[8px] font-bold text-gray-300 flex items-center gap-1">
                                                        <Calendar size={8}/> {new Date(exp.timestamp).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-200"></span>
                                                    <span className="text-[8px] font-bold text-gray-300 flex items-center gap-1">
                                                        <Clock size={8}/> {new Date(exp.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0 pl-2">
                                        <span className="font-black text-base text-black">{formatCurrency(exp.value)}</span>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                className="p-2 text-gray-200 hover:text-black hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(exp.id, e)}
                                                className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
