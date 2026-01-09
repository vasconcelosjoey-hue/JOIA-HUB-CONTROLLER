
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
        return <Icon size={24} strokeWidth={2.5}/>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {editingExpense && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-7 border-b flex justify-between items-center bg-zinc-50/50">
                            <h3 className="font-black text-sm flex items-center gap-3 uppercase tracking-[0.2em] text-zinc-400">
                                <Edit2 size={18} className="text-black" /> Editar Despesa
                            </h3>
                            <button onClick={() => setEditingExpense(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors"><X size={24} className="text-black"/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Nome / Pessoa</label>
                                <input type="text" value={editingExpense.title || ''} onChange={e => setEditingExpense({...editingExpense, title: e.target.value})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-6 py-4 font-black text-base focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Valor R$</label>
                                <input type="text" value={formatCurrency(editingExpense.value).replace('R$', '').trim()} onChange={e => setEditingExpense({...editingExpense, value: parseCurrencyInput(e.target.value)})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-6 py-4 font-black text-2xl focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                            </div>
                        </div>
                        <div className="p-6 bg-zinc-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setEditingExpense(null)} className="px-8 py-4 font-black text-zinc-400 hover:text-black transition-all text-xs uppercase tracking-widest">Cancelar</button>
                            <button onClick={handleUpdate} disabled={isSaving} className="bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />} Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black text-white rounded-[3rem] p-10 shadow-float border border-white/10 relative overflow-hidden transition-all duration-700 group">
                    <div className="relative z-10">
                        <p className="text-zinc-600 text-[12px] font-black uppercase tracking-[0.3em] mb-3">
                            {isSearching ? 'Soma da Busca (Mês)' : 'Total Mensal Operacional'}
                        </p>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter group-hover:scale-105 transition-transform duration-700">
                            {formatCurrency(stats.monthlyTotal)}
                        </h2>
                    </div>
                    <Receipt size={180} className="absolute -right-12 -bottom-12 text-white/5 rotate-12" />
                </div>
                <div className="bg-white rounded-[3rem] p-10 shadow-apple border border-zinc-100 flex justify-between items-center group transition-all duration-700">
                    <div className="relative z-10">
                        <p className="text-zinc-400 text-[12px] font-black uppercase tracking-[0.3em] mb-3">
                            {isSearching ? 'Soma da Busca (Hoje)' : 'Gasto Hoje'}
                        </p>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-black group-hover:scale-105 transition-transform duration-700">
                            {formatCurrency(stats.todayTotal)}
                        </h2>
                    </div>
                    <div className="p-7 bg-zinc-50 rounded-[2rem] shadow-inner group-hover:bg-zinc-100 transition-colors border border-zinc-100/50">
                        {isSearching ? <Search size={44} className="text-black" /> : <Clock size={44} className="text-zinc-200" />}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-apple border border-zinc-100 h-fit space-y-7">
                    <h3 className="text-base font-black text-black uppercase tracking-[0.2em] border-b border-zinc-50 pb-5 flex items-center gap-3">
                        <Receipt size={22} className="text-black" /> Nova Despesa
                    </h3>
                    
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-tight">Nome / Pessoa</label>
                            <div className="relative">
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Igor" className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 text-base font-black focus:bg-white focus:border-black outline-none transition-all shadow-sm placeholder:text-zinc-300" />
                                <UserCircle size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-tight">Categoria</label>
                            <div className="grid grid-cols-3 gap-2.5">
                                {categories.map(cat => (
                                    <button key={cat.id} onClick={() => setCategory(cat.id)} className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all min-h-[75px] ${category === cat.id ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-zinc-50 border-transparent text-zinc-400 hover:border-zinc-200'}`}>
                                        <cat.icon size={22} />
                                        <span className="text-[9px] font-black uppercase mt-1.5 tracking-tighter">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-tight">Breve Descrição</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Almoço Reunião Alpha" className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-black outline-none transition-all shadow-sm placeholder:text-zinc-300" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-tight">Valor R$</label>
                            <input type="text" value={value} onChange={e => setValue(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 text-lg font-black focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                        </div>

                        <button onClick={handleAdd} disabled={isSubmitting} className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-[0.98] mt-4">
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={22} strokeWidth={3} />} 
                            Registrar Despesa
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="relative group">
                        <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                        <input type="text" placeholder="Pesquisar registros..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-zinc-100 rounded-[2rem] pl-14 pr-6 py-4.5 text-base font-black shadow-apple focus:border-black outline-none transition-all" />
                    </div>

                    <div className="bg-white rounded-[3rem] shadow-apple border border-zinc-100 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="divide-y divide-zinc-50 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {filteredExpenses.length === 0 && !loading && (
                                <div className="p-28 text-center flex flex-col items-center gap-5">
                                    <div className="p-6 bg-zinc-50 rounded-full text-zinc-100 shadow-inner"><Receipt size={60} /></div>
                                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-300 italic">Histórico vazio</p>
                                </div>
                            )}
                            {filteredExpenses.map(exp => (
                                <div key={exp.id} onClick={() => setEditingExpense(exp)} className="p-7 flex items-center justify-between hover:bg-zinc-50/80 transition-all group cursor-pointer border-l-[10px] border-transparent hover:border-black">
                                    <div className="flex items-center gap-6 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-black group-hover:text-white transition-all duration-500">
                                            {getCategoryIcon(exp.category)}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-black text-lg md:text-xl text-black truncate uppercase tracking-tighter leading-none mb-1.5">{exp.title || 'Sem Título'}</p>
                                            
                                            {/* DESCRIÇÃO DA DESPESA LEGÍVEL */}
                                            <p className="text-[13px] font-bold text-zinc-500 truncate uppercase mb-3 leading-none">
                                                {exp.description || 'Nenhuma descrição.'}
                                            </p>

                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-zinc-300 flex items-center gap-1.5 uppercase tracking-widest bg-zinc-50 px-2 py-1 rounded-md">
                                                    <Calendar size={12}/> {new Date(exp.timestamp).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="text-[10px] font-black text-zinc-300 flex items-center gap-1.5 uppercase tracking-widest bg-zinc-50 px-2 py-1 rounded-md">
                                                    <Clock size={12}/> {new Date(exp.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 shrink-0 md:pl-6">
                                        <span className="font-black text-2xl md:text-3xl text-black tracking-tighter drop-shadow-sm">{formatCurrency(exp.value)}</span>
                                        <button onClick={(e) => handleDelete(exp.id, e)} className="p-3 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-100"><Trash2 size={24} /></button>
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
