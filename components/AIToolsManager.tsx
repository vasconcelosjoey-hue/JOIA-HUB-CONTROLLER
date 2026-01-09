
import React, { useState, useMemo, useEffect } from 'react';
import { Zap, Plus, Trash2, TrendingUp, Loader2, Search, Edit2, X, Save, ShieldCheck, Layers, Briefcase, UserCircle, ChevronDown } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { CpuArchitecture } from './ui/cpu-architecture';
import { Project, AITool, Platform, PartnershipCard } from '../types';
import { useToast } from '../context/ToastContext';

export const AIToolsManager: React.FC = () => {
    const { data: tools, loading: loadingTools, addItem: addTool, updateItem: updateTool, deleteItem: deleteTool } = useFirestoreCollection<AITool>('ai_tools');
    const { data: platforms, loading: loadingPlatforms, updateItem: updatePlatform, deleteItem: deletePlatform } = useFirestoreCollection<Platform>('platforms');
    const { data: projects } = useFirestoreCollection<Project>('projects');
    const { addToast } = useToast();
    
    const loading = loadingTools || loadingPlatforms;

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newOwner, setNewOwner] = useState('CARRYON');
    const [linkedProjectId, setLinkedProjectId] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const linkingOptions = useMemo(() => {
        const seenNames = new Set();
        return projects
            .map(p => ({ id: p.id, name: p.nome }))
            .filter(opt => {
                const normalized = opt.name.trim().toUpperCase();
                if (seenNames.has(normalized)) return false;
                seenNames.add(normalized);
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [projects]);

    useEffect(() => {
        if (!linkedProjectId && linkingOptions.length > 0) {
            setLinkedProjectId(linkingOptions[0].id);
        }
    }, [linkingOptions, linkedProjectId]);

    const responsibleOptions = ['CARRYON', 'SPENCERF', 'JOI.A.'];

    const normalizeOwner = (owner?: string) => {
        if (owner === 'SPENCER') return 'SPENCERF';
        return owner || 'CARRYON';
    };

    const findLinkedName = (id: string) => {
        return projects.find(p => p.id === id)?.nome || 'Projeto Desconhecido';
    };

    const handleAdd = async () => {
        if (!newName) {
            addToast('Insira o nome da ferramenta.', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            const newTool: Omit<AITool, 'id'> = {
                name: newName.trim(),
                description: newDescription.trim(),
                value: parseCurrencyInput(newValue),
                dueDate: parseInt(newDate) || 1,
                renovationCycle: 'MONTHLY',
                owner: newOwner,
                linkedProjectId: linkedProjectId || (linkingOptions.length > 0 ? linkingOptions[0].id : undefined),
                createdAt: new Date().toISOString()
            };
            await addTool(newTool);
            
            addToast('Ferramenta adicionada!', 'success');
            setNewName(''); setNewDescription(''); setNewValue(''); setNewDate('');
            if (linkingOptions.length > 0) setLinkedProjectId(linkingOptions[0].id);
        } catch(err) {
            addToast('Erro ao salvar.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            const { type, ...rest } = editingItem;
            if (type === 'TOOL') {
                await updateTool(editingItem.id, rest);
            } else {
                const updatedItem = {
                    ...rest,
                    client: findLinkedName(rest.linkedProjectId)
                };
                await updatePlatform(editingItem.id, updatedItem);
            }
            addToast('Ferramenta atualizada!', 'success');
            setEditingItem(null);
        } catch (err) {
            addToast('Erro ao atualizar.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, type: 'TOOL' | 'PLATFORM') => {
        if (window.confirm('Excluir este item?')) {
            if (type === 'TOOL') await deleteTool(id);
            else await deletePlatform(id);
            addToast('Removido.', 'info');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            action();
        }
    };

    const combinedList = [
        ...tools.map(t => ({ ...t, owner: normalizeOwner(t.owner), type: 'TOOL' as const })),
        ...platforms.map(p => ({ ...p, owner: normalizeOwner(p.owner), type: 'PLATFORM' as const }))
    ].sort((a, b) => b.value - a.value);

    const filteredList = combinedList.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(searchLower) || (item.description && item.description.toLowerCase().includes(searchLower));
    });

    const totalToDisplay = filteredList.reduce((acc, curr) => acc + curr.value, 0);
    const isSearching = searchTerm.trim().length > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* MODAL DE EDIÇÃO IGUAL AO CADASTRO */}
            {editingItem && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-sm flex items-center gap-2 uppercase tracking-[0.2em] text-zinc-400">
                                <Edit2 size={16} className="text-black" /> Editar Ferramenta
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors"><X size={24} className="text-black"/></button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Nome da Ferramenta</label>
                                <input type="text" value={editingItem.name} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-5 py-3.5 font-black text-base focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Breve Descrição</label>
                                <input type="text" value={editingItem.description || ''} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-5 py-3.5 font-bold text-sm focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Vincular Projeto</label>
                                    <div className="relative">
                                        <select value={editingItem.linkedProjectId || ''} onChange={e => setEditingItem({...editingItem, linkedProjectId: e.target.value})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-5 py-3.5 pr-10 font-black text-sm focus:bg-white focus:border-black outline-none transition-all shadow-sm appearance-none">
                                            {linkingOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                        </select>
                                        <Briefcase size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center">Responsável</label>
                                    <div className="relative">
                                        <select value={normalizeOwner(editingItem.owner)} onChange={e => setEditingItem({...editingItem, owner: e.target.value})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-5 py-3.5 pr-10 font-black text-sm focus:bg-white focus:border-black outline-none transition-all shadow-sm appearance-none text-center">
                                            {responsibleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        <UserCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Valor Mensal</label>
                                    <input type="text" value={formatCurrency(editingItem.value).replace('R$', '').trim()} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, value: parseCurrencyInput(e.target.value)})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-5 py-3.5 font-black text-base focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center">Dia Vencimento</label>
                                    <input type="number" value={editingItem.dueDate} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, dueDate: parseInt(e.target.value) || 1})} className="w-full border-2 border-zinc-100 bg-zinc-50 rounded-2xl px-5 py-3.5 font-black text-base focus:bg-white focus:border-black outline-none transition-all shadow-sm text-center" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-zinc-50/80 flex justify-end gap-3">
                            <button onClick={() => setEditingItem(null)} className="px-8 py-3.5 font-black text-zinc-400 hover:text-black transition-all text-xs uppercase tracking-widest">Cancelar</button>
                            <button onClick={handleUpdate} disabled={isSaving} className="bg-black text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />} Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* FORMULÁRIO DE CADASTRO MELHORADO */}
                <div className="bg-white rounded-[2.5rem] p-7 shadow-apple border border-zinc-100 h-fit space-y-8">
                    <h3 className="text-base font-black text-black uppercase tracking-[0.2em] flex items-center gap-3 border-b border-zinc-50 pb-5">
                        <Zap size={22} className="fill-black" /> Nova Ferramenta
                    </h3>
                    
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em]">Nome da Ferramenta</label>
                            <input type="text" value={newName} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewName(e.target.value)} placeholder="Ex: ChatGPT Plus" className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 text-base font-black focus:bg-white focus:border-black outline-none transition-all shadow-sm placeholder:text-zinc-300" />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em]">Breve Descrição</label>
                            <input type="text" value={newDescription} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewDescription(e.target.value)} placeholder="Para que serve?" className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-black outline-none transition-all shadow-sm placeholder:text-zinc-300" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-tight">Vincular Projeto</label>
                                <div className="relative">
                                    <select value={linkedProjectId} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={(e) => setLinkedProjectId(e.target.value)} className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 pr-10 text-[12px] font-black outline-none focus:bg-white focus:border-black appearance-none transition-all shadow-sm">
                                        {linkingOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                    </select>
                                    <Briefcase size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-tight text-center">Responsável</label>
                                <div className="relative">
                                    <select value={newOwner} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={(e) => setNewOwner(e.target.value)} className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 pr-10 text-[12px] font-black outline-none focus:bg-white focus:border-black appearance-none transition-all shadow-sm text-center">
                                        {responsibleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <UserCircle size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-tight">Valor Mensal</label>
                                <input type="text" value={newValue} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewValue(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 text-base font-black focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-tight text-center">Dia Venc.</label>
                                <input type="text" value={newDate} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewDate(e.target.value.replace(/\D/g, ''))} placeholder="15" className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-4 text-base font-black text-center focus:bg-white focus:border-black outline-none transition-all shadow-sm" />
                            </div>
                        </div>

                        <button onClick={handleAdd} className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] mt-4">
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={22} strokeWidth={3} />} Adicionar Ferramenta
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {/* DASHBOARD CARD - BOLDER */}
                    <div className="bg-black text-white rounded-[2.5rem] p-8 md:p-12 shadow-float flex justify-between items-center relative overflow-hidden group transition-all duration-700">
                        <div className="z-10 relative">
                            <p className="text-zinc-600 text-[11px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                                {isSearching ? 'Total da Busca' : 'Custo Operacional Mensal'}
                                {isSearching && <span className="bg-zinc-800 text-zinc-400 px-4 py-1 rounded-full text-[9px] font-black animate-pulse border border-zinc-700">FILTRO ATIVO</span>}
                            </p>
                            <p className="text-5xl md:text-7xl font-black tracking-tighter group-hover:scale-105 transition-transform duration-700">
                                {formatCurrency(totalToDisplay)}
                            </p>
                        </div>
                        <div className="z-10 bg-white/5 p-6 rounded-[2rem] hidden sm:block backdrop-blur-xl border border-white/10 shadow-2xl">
                            {isSearching ? <Search size={40} className="text-white"/> : <TrendingUp size={40} className="text-white" />}
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[200px] opacity-[0.05] pointer-events-none grayscale invert">
                            <CpuArchitecture text="CORE" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-apple border border-zinc-100 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="p-7 border-b bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-5">
                            <h3 className="font-black text-sm text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-3"><Layers size={20} className="text-black"/> Lista Unificada</h3>
                            <div className="relative w-full sm:w-80 group">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                                <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-zinc-100 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-black focus:border-black outline-none shadow-sm transition-all" />
                            </div>
                        </div>

                        <div className="divide-y divide-zinc-50 flex-1 overflow-y-auto custom-scrollbar">
                            {filteredList.length === 0 && !loading && (
                                <div className="p-24 text-center flex flex-col items-center gap-5">
                                    <div className="p-6 bg-zinc-50 rounded-full text-zinc-200 shadow-inner"><Search size={50} /></div>
                                    <p className="text-[12px] font-black text-zinc-300 uppercase tracking-[0.2em] italic">Nenhum resultado encontrado</p>
                                </div>
                            )}
                            {filteredList.map(item => (
                                <div key={item.id} className="p-7 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-50/80 transition-all gap-5 group cursor-default border-l-[8px] border-transparent hover:border-black">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="font-black text-black text-xl md:text-2xl leading-none uppercase tracking-tighter">{item.name}</p>
                                            {item.type === 'PLATFORM' && <span className="bg-black text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-[0.1em] shadow-sm">CLIENTE</span>}
                                        </div>
                                        
                                        {/* DESCRIÇÃO MAIS VISÍVEL E HIERARQUIA CLARA */}
                                        <p className="text-[13px] font-bold text-zinc-600 mb-4 leading-relaxed max-w-2xl">
                                            {item.description || 'Nenhuma descrição detalhada disponível.'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="flex items-center gap-2 font-black text-white bg-black px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg">
                                                <UserCircle size={12} strokeWidth={3}/> {item.owner}
                                            </span>
                                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] bg-zinc-100 px-3 py-1.5 rounded-xl">Venc. Dia {item.dueDate}</span>
                                            
                                            {item.linkedProjectId && (
                                                <span className="text-[11px] font-black text-zinc-900 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl uppercase tracking-tight flex items-center gap-2 border border-emerald-100/50">
                                                    <Briefcase size={12} strokeWidth={2.5}/> {findLinkedName(item.linkedProjectId)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-6 shrink-0 md:pl-6">
                                        <div className="text-right">
                                            <p className="font-black text-2xl md:text-3xl text-black tracking-tighter drop-shadow-sm">{formatCurrency(item.value)}</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button onClick={() => setEditingItem(item)} className="p-3 text-zinc-300 hover:text-black hover:bg-white hover:shadow-apple rounded-2xl transition-all border border-transparent hover:border-zinc-100"><Edit2 size={22} /></button>
                                            <button onClick={() => handleDelete(item.id, item.type)} className="p-3 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"><Trash2 size={22} /></button>
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
