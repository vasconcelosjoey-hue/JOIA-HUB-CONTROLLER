
import React, { useState, useMemo, useEffect } from 'react';
import { Zap, Plus, Trash2, TrendingUp, Loader2, Search, Edit2, X, Save, ShieldCheck, Layers, Briefcase, UserCircle } from 'lucide-react';
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
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-black text-sm flex items-center gap-2 uppercase tracking-widest text-gray-400">
                                <Edit2 size={16} className="text-black" /> Editar Item
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase">Nome</label>
                                <input type="text" value={editingItem.name} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-black text-sm focus:border-black outline-none transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase">Descrição</label>
                                <input type="text" value={editingItem.description || ''} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-sm focus:border-black outline-none transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Valor</label>
                                    <input type="text" value={formatCurrency(editingItem.value).replace('R$', '').trim()} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, value: parseCurrencyInput(e.target.value)})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-black text-sm focus:border-black outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase text-center">Dia Vencimento</label>
                                    <input type="number" value={editingItem.dueDate} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, dueDate: parseInt(e.target.value) || 1})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-black text-sm focus:border-black outline-none transition-all text-center" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setEditingItem(null)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                            <button onClick={handleUpdate} disabled={isSaving} className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-gray-800 disabled:opacity-50">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* FORMULÁRIO DE CADASTRO MELHORADO */}
                <div className="bg-white rounded-[2rem] p-6 shadow-apple border border-gray-200 h-fit space-y-6">
                    <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2 border-b pb-4">
                        <Zap size={18} className="fill-black" /> Nova Ferramenta
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Nome da Ferramenta</label>
                            <input type="text" value={newName} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewName(e.target.value)} placeholder="Ex: ChatGPT Plus" className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black focus:bg-white focus:border-black outline-none transition-all" />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Breve Descrição</label>
                            <input type="text" value={newDescription} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewDescription(e.target.value)} placeholder="Para que serve?" className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-black outline-none transition-all" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Vincular Projeto</label>
                                <div className="relative">
                                    <select value={linkedProjectId} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={(e) => setLinkedProjectId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 pr-8 text-[11px] font-black outline-none focus:bg-white focus:border-black appearance-none transition-all">
                                        {linkingOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                    </select>
                                    <Briefcase size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight text-center">Responsável</label>
                                <div className="relative">
                                    <select value={newOwner} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={(e) => setNewOwner(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 pr-8 text-[11px] font-black outline-none focus:bg-white focus:border-black appearance-none transition-all text-center">
                                        {responsibleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <UserCircle size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Valor Mensal</label>
                                <input type="text" value={newValue} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewValue(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black focus:bg-white focus:border-black outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight text-center">Dia Venc.</label>
                                <input type="text" value={newDate} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewDate(e.target.value.replace(/\D/g, ''))} placeholder="15" className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black text-center focus:bg-white focus:border-black outline-none transition-all" />
                            </div>
                        </div>

                        <button onClick={handleAdd} className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 transition-all active:scale-[0.98]">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />} Adicionar Ferramenta
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {/* DASHBOARD CARD - BOLDER */}
                    <div className="bg-black text-white rounded-[2.5rem] p-6 md:p-10 shadow-float flex justify-between items-center relative overflow-hidden group transition-all duration-500">
                        <div className="z-10 relative">
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                {isSearching ? 'Total da Busca' : 'Custo Operacional Mensal'}
                                {isSearching && <span className="bg-zinc-800 text-zinc-300 px-3 py-0.5 rounded-full text-[8px] animate-pulse">FILTRO ATIVO</span>}
                            </p>
                            <p className="text-4xl md:text-6xl font-black tracking-tighter group-hover:scale-105 transition-transform duration-500">
                                {formatCurrency(totalToDisplay)}
                            </p>
                        </div>
                        <div className="z-10 bg-white/10 p-5 rounded-full hidden sm:block backdrop-blur-md">
                            {isSearching ? <Search size={32} /> : <TrendingUp size={32} />}
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[150px] opacity-10 pointer-events-none">
                            <CpuArchitecture text="CORE" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-apple border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h3 className="font-black text-xs text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={16} className="text-black"/> Lista Unificada</h3>
                            <div className="relative w-full sm:w-72">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:border-black outline-none shadow-sm transition-all" />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100 min-h-[120px]">
                            {filteredList.length === 0 && !loading && (
                                <div className="p-20 text-center flex flex-col items-center gap-3">
                                    <div className="p-4 bg-gray-50 rounded-full text-gray-200"><Search size={40} /></div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Nenhum resultado para "{searchTerm}"</p>
                                </div>
                            )}
                            {filteredList.map(item => (
                                <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-all gap-4 group cursor-default">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-black text-black text-lg md:text-xl leading-none uppercase tracking-tight">{item.name}</p>
                                            {item.type === 'PLATFORM' && <span className="bg-orange-50 text-orange-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">CLIENTE</span>}
                                        </div>
                                        
                                        {/* DESCRIÇÃO MAIS VISÍVEL */}
                                        <p className="text-[12px] font-bold text-zinc-500 mb-2 leading-tight">
                                            {item.description || 'Nenhuma descrição informada.'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="flex items-center gap-1 font-black text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-tighter">
                                                <ShieldCheck size={10} className="text-black"/> {item.owner}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Venc. Dia {item.dueDate}</span>
                                            
                                            {item.linkedProjectId && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                    <span className="text-[10px] font-black text-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg uppercase tracking-tight flex items-center gap-1.5">
                                                        <Briefcase size={10} /> {findLinkedName(item.linkedProjectId)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-6 shrink-0">
                                        <div className="text-right">
                                            <p className="font-black text-xl md:text-2xl text-black tracking-tighter">{formatCurrency(item.value)}</p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => setEditingItem(item)} className="p-2.5 text-gray-300 hover:text-black hover:bg-white hover:shadow-sm rounded-xl transition-all"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(item.id, item.type)} className="p-2.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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
