
import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Trash2, Loader2, Search, Calendar, Clock, DollarSign, Fuel, Utensils, Box, MoreHorizontal, Edit2, X, Save, Sparkles, UserCircle } from 'lucide-react';
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

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(exp => 
                (exp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                exp.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [expenses, searchTerm]);

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const todayStr = now.toISOString().split('T')[0];

        const listToSum = filteredExpenses;

        const monthlyTotal = listToSum.reduce((acc, exp) => {
            const expDate = new Date(exp.timestamp);
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                return acc + exp.value;
            }
            return acc;
        }, 0);

        const todayTotal = listToSum.reduce((acc, exp) => {
            if (exp.timestamp.startsWith(todayStr)) {
                return acc + exp.value;
            }
            return acc;
        }, 0);

        return { monthlyTotal, todayTotal };
    }, [filteredExpenses]);

    const isSearching = searchTerm.trim().length > 0;

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

    const handleUpdate = async () => {
        if (!editingExpense) return;
        setIsSaving(true);
        try {
            await updateItem(editingExpense.id, editingExpense);
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

    const getCategoryIcon = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        const Icon = cat?.icon || MoreHorizontal;
        return <Icon size={18} />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Pessoa</label>
                                <input type="text" value={editingExpense.title || ''} onChange={e => setEditingExpense({...editingExpense, title: e.target.value})} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 font-black focus:border-black outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor R$</label>
                                <input type="text" value={formatCurrency(editingExpense.value).replace('R$', '').trim()} onChange={e => setEditingExpense({...editingExpense, value: parseCurrencyInput(e.target.value)})} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 font-black text-xl focus:border-black outline-none transition-all" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-float border border-white/10 relative overflow-hidden transition-all duration-500 group">
                    <div className="relative z-10">
                        <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2">
                            {isSearching ? 'Soma da Busca (Mês)' : 'Total Mensal Operacional'}
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter group-hover:scale-105 transition-transform duration-500">
                            {formatCurrency(stats.monthlyTotal)}
                        </h2>
                    </div>
                    <Receipt size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 shadow-apple border border-gray-100 flex justify-between items-center group">
                    <div className="relative z-10">
                        <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] mb-2">
                            {isSearching ? 'Soma da Busca (Hoje)' : 'Gasto Hoje'}
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black group-hover:scale-105 transition-transform duration-500">
                            {formatCurrency(stats.todayTotal)}
                        </h2>
                    </div>
                    <div className="p-5 bg-zinc-50 rounded-[1.5rem] shadow-inner group-hover:bg-zinc-100 transition-colors">
                        {isSearching ? <Search size={36} className="text-black" /> : <Clock size={36} className="text-zinc-300" />}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2.5rem] p-6 shadow-apple border border-gray-200 h-fit space-y-6">
                    <h3 className="text-sm font-black text-black uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                        <Receipt size={18} className="text-black" /> Nova Despesa
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Nome / Pessoa</label>
                            <div className="relative">
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Igor" className="w-full bg-gray-50 border-2 border-transparent rounded-xl pl-11 pr-4 py-3.5 text-sm font-black focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                                <UserCircle size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Categoria</label>
                            <div className="grid grid-cols-3 gap-2">
                                {categories.map(cat => (
                                    <button key={cat.id} onClick={() => setCategory(cat.id)} className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all min-h-[60px] ${category === cat.id ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-gray-50 border-transparent text-zinc-400 hover:border-gray-200'}`}>
                                        <cat.icon size={20} />
                                        <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Breve Descrição</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Almoço Reunião Alpha" className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3.5 text-sm font-bold focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Valor R$</label>
                            <input type="text" value={value} onChange={e => setValue(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3.5 text-base font-black focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                        </div>

                        <button onClick={handleAdd} disabled={isSubmitting} className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-[0.98]">
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} strokeWidth={3} />} 
                            Registrar Despesa
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="relative group">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                        <input type="text" placeholder="Filtrar despesas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-[1.5rem] pl-12 pr-5 py-4 text-sm font-black shadow-apple focus:border-black outline-none transition-all" />
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-apple border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {filteredExpenses.length === 0 && !loading && (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <div className="p-5 bg-zinc-50 rounded-full text-zinc-200"><Receipt size={48} /></div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300 italic">Nada para mostrar aqui</p>
                                </div>
                            )}
                            {filteredExpenses.map(exp => (
                                <div key={exp.id} onClick={() => setEditingExpense(exp)} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-all group cursor-pointer border-l-[6px] border-transparent hover:border-black">
                                    <div className="flex items-center gap-5 min-w-0">
                                        <div className="w-12 h-12 rounded-[1rem] bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-black group-hover:text-white transition-all">
                                            {getCategoryIcon(exp.category)}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-black text-base md:text-lg text-black truncate uppercase tracking-tight leading-none mb-1">{exp.title || 'Sem Título'}</p>
                                            
                                            {/* DESCRIÇÃO DA DESPESA LEGÍVEL */}
                                            <p className="text-[11px] font-bold text-zinc-500 truncate uppercase mb-2 leading-none">
                                                {exp.description || 'Nenhuma descrição.'}
                                            </p>

                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black text-zinc-300 flex items-center gap-1 uppercase tracking-widest">
                                                    <Calendar size={10}/> {new Date(exp.timestamp).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                <span className="text-[9px] font-black text-zinc-300 flex items-center gap-1 uppercase tracking-widest">
                                                    <Clock size={10}/> {new Date(exp.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 shrink-0">
                                        <span className="font-black text-xl md:text-2xl text-black tracking-tighter">{formatCurrency(exp.value)}</span>
                                        <button onClick={(e) => handleDelete(exp.id, e)} className="p-2.5 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
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
