import React, { useState } from 'react';
import { Bot, Plus, Trash2, DollarSign, Loader2, Layers, Search, Edit2, Check } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { CpuArchitecture } from './ui/cpu-architecture';
import { Project, AITool, Platform } from '../types';
import { useToast } from '../context/ToastContext';

export const AIToolsManager: React.FC = () => {
    const { data: tools, loading: loadingTools, addItem: addTool, updateItem: updateTool, deleteItem: deleteTool } = useFirestoreCollection<AITool>('ai_tools');
    const { data: platforms, loading: loadingPlatforms, addItem: addPlatform, updateItem: updatePlatform, deleteItem: deletePlatform } = useFirestoreCollection<Platform>('platforms');
    const { data: projects } = useFirestoreCollection<Project>('projects');
    const { addToast } = useToast();
    
    const loading = loadingTools || loadingPlatforms;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemType, setItemType] = useState<'TOOL' | 'PLATFORM'>('TOOL');
    
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newOwner, setNewOwner] = useState<'CARRYON' | 'SPENCER' | 'JOI.A.'>('CARRYON');
    const [linkedProjectId, setLinkedProjectId] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newName) {
            addToast('O nome é obrigatório.', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            if (itemType === 'TOOL') {
                const newTool: Omit<AITool, 'id'> = {
                    name: newName,
                    description: newDescription,
                    value: parseCurrencyInput(newValue),
                    dueDate: parseInt(newDate) || 1,
                    renovationCycle: 'MONTHLY',
                    owner: newOwner,
                    linkedProjectId: linkedProjectId || undefined,
                    createdAt: new Date().toISOString()
                };
                await addTool(newTool);
            } else {
                const newPlat: Omit<Platform, 'id'> = {
                    name: newName,
                    description: newDescription,
                    client: linkedProjectId ? (projects.find(p => p.id === linkedProjectId)?.nome || '') : 'AVULSO',
                    value: parseCurrencyInput(newValue),
                    dueDate: parseInt(newDate) || 1,
                    owner: newOwner,
                    linkedProjectId: linkedProjectId || undefined,
                    createdAt: new Date().toISOString()
                };
                await addPlatform(newPlat);
            }
            
            addToast('Registro adicionado!', 'success');
            setNewName(''); setNewDescription(''); setNewValue(''); setNewDate(''); setNewOwner('CARRYON'); setLinkedProjectId('');
        } catch(err) {
            addToast('Erro ao salvar.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInlineUpdate = async (item: any) => {
        try {
            if (item.type === 'TOOL') {
                const { type, ...rest } = item;
                await updateTool(item.id, rest);
            } else {
                const { type, ...rest } = item;
                await updatePlatform(item.id, rest);
            }
            addToast('Atualizado!', 'success');
            setEditingId(null);
        } catch (err) {
            addToast('Erro ao atualizar.', 'error');
        }
    };

    const handleDelete = async (id: string, type: 'TOOL' | 'PLATFORM') => {
        if (window.confirm('Excluir este item?')) {
            if (type === 'TOOL') await deleteTool(id);
            else await deletePlatform(id);
            addToast('Removido.', 'info');
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

    const totalCost = filteredList.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-apple border border-gray-200 h-fit">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 border-b pb-2 tracking-widest">Nova Despesa</h3>
                    <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                        <button onClick={() => setItemType('TOOL')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${itemType === 'TOOL' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>IA</button>
                        <button onClick={() => setItemType('PLATFORM')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${itemType === 'PLATFORM' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Plataforma</button>
                    </div>

                    <div className="space-y-3">
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                        <input type="text" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Descrição" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                        <select value={linkedProjectId} onChange={(e) => setLinkedProjectId(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black appearance-none">
                            <option value="">Vincular Projeto</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={newValue} onChange={e => setNewValue(formatCurrencyInput(e.target.value))} placeholder="Valor R$" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                            <input type="text" value={newDate} onChange={e => setNewDate(e.target.value.replace(/\D/g, ''))} placeholder="Dia Venc." className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-black outline-none" />
                        </div>
                        <select value={newOwner} onChange={(e) => setNewOwner(e.target.value as any)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black appearance-none">
                            <option value="CARRYON">CARRYON</option>
                            <option value="SPENCER">SPENCER</option>
                            <option value="JOI.A.">JOI.A.</option>
                        </select>
                        <button onClick={handleAdd} className="w-full bg-black text-white py-3 rounded-lg font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-md hover:bg-gray-800 transition-colors">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Adicionar
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-5">
                    <div className="bg-black text-white rounded-2xl p-5 md:p-6 shadow-float flex justify-between items-center relative overflow-hidden">
                        <div className="z-10">
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Gasto Consolidado Exibido</p>
                            <p className="text-3xl md:text-4xl font-black tracking-tighter">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className="z-10 bg-white/10 p-3 rounded-full hidden sm:block"><DollarSign size={24} /></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[200px] h-[100px] opacity-10 pointer-events-none">
                            <CpuArchitecture text="CORE" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-apple border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Lista Unificada</h3>
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-black outline-none" />
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100 min-h-[80px]">
                            {filteredList.map(item => (
                                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${item.type === 'TOOL' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {item.type === 'TOOL' ? <Bot size={18} /> : <Layers size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {editingId === item.id ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4">
                                                    <input type="text" value={item.name} className="border rounded px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-black outline-none" />
                                                    <input type="text" value={formatCurrency(item.value)} readOnly className="border rounded px-2 py-1 text-sm bg-gray-100" />
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-black text-sm truncate">{item.name}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                                        <span>Venc. Dia {item.dueDate}</span>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                        <span className="uppercase">{item.owner}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-3 pl-12 sm:pl-0">
                                        <p className="font-black text-sm md:text-base">{formatCurrency(item.value)}</p>
                                        <div className="flex gap-1">
                                            {editingId === item.id ? (
                                                <button onClick={() => handleInlineUpdate(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={16} /></button>
                                            ) : (
                                                <button onClick={() => setEditingId(item.id)} className="p-1.5 text-gray-300 hover:text-black rounded transition-colors"><Edit2 size={16} /></button>
                                            )}
                                            <button onClick={() => handleDelete(item.id, item.type)} className="p-1.5 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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