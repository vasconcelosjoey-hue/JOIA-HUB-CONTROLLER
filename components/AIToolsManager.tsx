
import React, { useState, useMemo } from 'react';
import { Cpu, Plus, Trash2, TrendingUp, Loader2, Search, Edit2, X, Save } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { CpuArchitecture } from './ui/cpu-architecture';
import { Project, AITool, Platform, PartnershipCard } from '../types';
import { useToast } from '../context/ToastContext';

export const AIToolsManager: React.FC = () => {
    // Mantemos o carregamento de ambas as coleções para não perder dados legados
    const { data: tools, loading: loadingTools, addItem: addTool, updateItem: updateTool, deleteItem: deleteTool } = useFirestoreCollection<AITool>('ai_tools');
    const { data: platforms, loading: loadingPlatforms, updateItem: updatePlatform, deleteItem: deletePlatform } = useFirestoreCollection<Platform>('platforms');
    const { data: projects } = useFirestoreCollection<Project>('projects');
    const { data: partnerships } = useFirestoreCollection<PartnershipCard>('partnerships');
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
        // Unifica projetos e parcerias em uma única lista
        const allOptions = [
            ...projects.map(p => ({ id: p.id, name: p.nome })),
            ...partnerships.map(p => ({ id: p.id, name: p.companyName }))
        ];

        // Remove duplicidades por nome (ignora case e espaços extras)
        const seenNames = new Set();
        const uniqueOptions = allOptions.filter(opt => {
            const normalizedName = opt.name.trim().toUpperCase();
            if (seenNames.has(normalizedName)) {
                return false;
            }
            seenNames.add(normalizedName);
            return true;
        });

        return uniqueOptions.sort((a, b) => a.name.localeCompare(b.name));
    }, [projects, partnerships]);

    const responsibleOptions = useMemo(() => {
        return ['CARRYON', 'SPENCER', 'JOI.A.'];
    }, []);

    const findLinkedName = (id: string) => {
        return linkingOptions.find(opt => opt.id === id)?.name || 'Avulso';
    };

    const handleAdd = async () => {
        setIsSubmitting(true);
        try {
            const newTool: Omit<AITool, 'id'> = {
                name: newName || 'Ferramenta Sem Nome',
                description: newDescription,
                value: parseCurrencyInput(newValue),
                dueDate: parseInt(newDate) || 1,
                renovationCycle: 'MONTHLY',
                owner: newOwner,
                linkedProjectId: linkedProjectId || undefined,
                createdAt: new Date().toISOString()
            };
            await addTool(newTool);
            
            addToast('Ferramenta adicionada!', 'success');
            setNewName(''); setNewDescription(''); setNewValue(''); setNewDate(''); setLinkedProjectId('');
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
        ...tools.map(t => ({ ...t, type: 'TOOL' as const })),
        ...platforms.map(p => ({ ...p, type: 'PLATFORM' as const }))
    ].sort((a, b) => b.value - a.value);

    const filteredList = combinedList.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(searchLower) || (item.description && item.description.toLowerCase().includes(searchLower));
    });

    const totalGlobalCost = combinedList.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Edit2 size={16} /> Editar Ferramenta
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400">Nome</label>
                                <input type="text" value={editingItem.name} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-black outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400">Descrição</label>
                                <input type="text" value={editingItem.description || ''} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-black outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400">Valor</label>
                                    <input type="text" value={formatCurrency(editingItem.value).replace('R$', '').trim()} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, value: parseCurrencyInput(e.target.value)})} className="w-full border rounded-xl px-4 py-2.5 font-black focus:ring-2 focus:ring-black outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400">Dia Vencimento</label>
                                    <input type="number" value={editingItem.dueDate} onKeyDown={(e) => handleKeyDown(e, handleUpdate)} onChange={e => setEditingItem({...editingItem, dueDate: parseInt(e.target.value) || 1})} className="w-full border rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-black outline-none text-center" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400">Responsável Financeiro</label>
                                    <select value={editingItem.owner} onChange={e => setEditingItem({...editingItem, owner: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-black outline-none appearance-none bg-white">
                                        {responsibleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400">Vincular Projeto</label>
                                    <select value={editingItem.linkedProjectId || ''} onChange={e => setEditingItem({...editingItem, linkedProjectId: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-black outline-none appearance-none bg-white">
                                        <option value="">Nenhum (Avulso)</option>
                                        {linkingOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setEditingItem(null)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                            <button onClick={handleUpdate} disabled={isSaving} className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-gray-800 disabled:opacity-50">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-apple border border-gray-200 h-fit">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 border-b pb-2 tracking-widest flex items-center gap-2">Nova Ferramenta <Cpu size={12}/></h3>
                    
                    <div className="space-y-3">
                        <input type="text" value={newName} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewName(e.target.value)} placeholder="Nome da Ferramenta" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                        <input type="text" value={newDescription} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewDescription(e.target.value)} placeholder="Breve Descrição" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                        
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 tracking-tighter uppercase">Vincular Projeto</label>
                            <select value={linkedProjectId} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={(e) => setLinkedProjectId(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black appearance-none">
                                <option value="">Nenhum (Avulso)</option>
                                {linkingOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={newValue} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewValue(formatCurrencyInput(e.target.value))} placeholder="Valor R$" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                            <input type="text" value={newDate} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={e => setNewDate(e.target.value.replace(/\D/g, ''))} placeholder="Dia Venc." className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-black outline-none" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 tracking-tighter uppercase">Responsável Financeiro</label>
                            <select value={newOwner} onKeyDown={(e) => handleKeyDown(e, handleAdd)} onChange={(e) => setNewOwner(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black appearance-none">
                                {responsibleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <button onClick={handleAdd} className="w-full bg-black text-white py-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 shadow-md hover:bg-gray-800 transition-colors">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Adicionar Ferramenta
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-5">
                    <div className="bg-black text-white rounded-2xl p-5 md:p-6 shadow-float flex justify-between items-center relative overflow-hidden">
                        <div className="z-10">
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Custo Operacional Mensal</p>
                            <p className="text-3xl md:text-4xl font-black tracking-tighter">{formatCurrency(totalGlobalCost)}</p>
                        </div>
                        <div className="z-10 bg-white/10 p-3 rounded-full hidden sm:block"><TrendingUp size={24} /></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[200px] h-[100px] opacity-10 pointer-events-none">
                            <CpuArchitecture text="CORE" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-apple border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Lista Unificada</h3>
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Filtrar por nome ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-black outline-none" />
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100 min-h-[80px]">
                            {filteredList.length === 0 && !loading && (
                                <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nenhuma ferramenta encontrada</div>
                            )}
                            {filteredList.map(item => (
                                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-3 group">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-black text-sm truncate">{item.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                            <span>Venc. Dia {item.dueDate}</span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                            <span className="font-black text-black/70 uppercase">{item.owner}</span>
                                            {item.linkedProjectId && (
                                                <>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                    <span className="truncate italic uppercase text-[9px]">{findLinkedName(item.linkedProjectId)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 shrink-0">
                                        <p className="font-black text-sm md:text-base">{formatCurrency(item.value)}</p>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditingItem(item)} className="p-1.5 text-gray-300 hover:text-black hover:bg-gray-100 rounded-lg transition-all"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(item.id, item.type)} className="p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
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
