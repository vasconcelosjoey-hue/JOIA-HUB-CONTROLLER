
import React, { useState } from 'react';
import { Bot, Plus, Trash2, Calendar, DollarSign, Loader2, User, Layers, Briefcase, Building2, Search, FileText } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { CpuArchitecture } from './ui/cpu-architecture';
import { Project, AITool, Platform } from '../types';
import { useToast } from '../context/ToastContext';

export const AIToolsManager: React.FC = () => {
    // 1. Fetch ALL Data needed
    const { data: tools, loading: loadingTools, addItem: addTool, deleteItem: deleteTool } = useFirestoreCollection<AITool>('ai_tools');
    const { data: platforms, loading: loadingPlatforms, addItem: addPlatform, deleteItem: deletePlatform } = useFirestoreCollection<Platform>('platforms');
    const { data: projects } = useFirestoreCollection<Project>('projects');
    const { addToast } = useToast();
    
    const loading = loadingTools || loadingPlatforms;

    // 2. Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemType, setItemType] = useState<'TOOL' | 'PLATFORM'>('TOOL'); // Toggle between Tool and Platform
    
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState(''); // Added Description State
    const [newValue, setNewValue] = useState(''); // String for smart format
    const [newDate, setNewDate] = useState('');
    const [newOwner, setNewOwner] = useState<'CARRYON' | 'SPENCER' | 'JOI.A.'>('CARRYON');
    const [linkedProjectId, setLinkedProjectId] = useState('');
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = async () => {
        if (!newName || !newValue || !newDate) {
            addToast('Preencha os campos obrigatórios: Nome, Valor e Data.', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            if (itemType === 'TOOL') {
                const newTool: Omit<AITool, 'id'> = {
                    name: newName,
                    description: newDescription,
                    value: parseCurrencyInput(newValue),
                    dueDate: parseInt(newDate),
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
                    dueDate: parseInt(newDate),
                    owner: newOwner,
                    linkedProjectId: linkedProjectId || undefined,
                    createdAt: new Date().toISOString()
                };
                await addPlatform(newPlat);
            }
            
            addToast('Registro adicionado com sucesso!', 'success');
            
            // Reset
            setNewName('');
            setNewDescription('');
            setNewValue('');
            setNewDate('');
            setNewOwner('CARRYON');
            setLinkedProjectId('');
        } catch(err) {
            console.error(err);
            addToast('Erro ao salvar registro.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, type: 'TOOL' | 'PLATFORM') => {
        if (window.confirm('Tem certeza que deseja remover este item?')) {
            if (type === 'TOOL') await deleteTool(id);
            else await deletePlatform(id);
            addToast('Item removido.', 'info');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    // Unified List for Display
    const combinedList = [
        ...tools.map(t => ({ ...t, type: 'TOOL' as const })),
        ...platforms.map(p => ({ ...p, type: 'PLATFORM' as const }))
    ].sort((a, b) => b.value - a.value);

    // Filtered List based on Search
    const filteredList = combinedList.filter(item => {
        const linkedProjectName = item.linkedProjectId 
            ? projects.find(p => p.id === item.linkedProjectId)?.nome 
            : '';
        
        const searchLower = searchTerm.toLowerCase();
        
        return (
            item.name.toLowerCase().includes(searchLower) ||
            (item.description && item.description.toLowerCase().includes(searchLower)) ||
            (item.owner && item.owner.toLowerCase().includes(searchLower)) ||
            (linkedProjectName && linkedProjectName.toLowerCase().includes(searchLower))
        );
    });

    // UPDATED: Calculate Total based on FILTERED list, not combined list
    const totalCost = filteredList.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
             <div className="relative overflow-hidden text-center md:text-left">
                {/* Visual Integration of CPU Architecture */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[250px] h-[120px] opacity-10 pointer-events-none hidden md:block">
                    <CpuArchitecture text="CORE" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-2 relative z-10">
                    <Bot className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                    Ferramentas & Custos
                </h2>
                <p className="text-gray-600 font-medium mt-0.5 text-sm md:text-base relative z-10">Central de assinaturas, ferramentas e mensalidades.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <div className="bg-white rounded-2xl p-5 shadow-apple border border-gray-200 h-fit" onKeyDown={handleKeyDown}>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Nova Despesa</h3>
                    
                    {/* Type Toggle */}
                    <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                        <button 
                            onClick={() => setItemType('TOOL')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${itemType === 'TOOL' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Ferramenta IA
                        </button>
                        <button 
                            onClick={() => setItemType('PLATFORM')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${itemType === 'PLATFORM' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Plataforma Cliente
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Ferramenta/Plataforma</label>
                            <input 
                                type="text" 
                                value={newName}
                                onChange={e => setNewName(e.target.value.toUpperCase())}
                                placeholder={itemType === 'TOOL' ? "Ex: CHATGPT PLUS" : "Ex: SHOPIFY"}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm uppercase"
                            />
                        </div>

                         {/* Description Input */}
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Breve Descritivo (Detalhes)</label>
                            <input 
                                type="text" 
                                value={newDescription}
                                onChange={e => setNewDescription(e.target.value.toUpperCase())}
                                placeholder="EX: PLANO TEAM P/ GERAÇÃO DE IMAGENS..."
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm uppercase placeholder:text-gray-400"
                            />
                        </div>

                        {/* Project Link Dropdown */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Briefcase size={10} /> Vincular Projeto (Opcional)
                            </label>
                            <select 
                                value={linkedProjectId} 
                                onChange={(e) => setLinkedProjectId(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm appearance-none uppercase"
                            >
                                <option value="">-- SEM VÍNCULO --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
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
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm appearance-none uppercase"
                            >
                                <option value="CARRYON">CARRYON</option>
                                <option value="SPENCER">SPENCER</option>
                                <option value="JOI.A.">JOI.A.</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleAdd}
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
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Custo Mensal (Filtro)</p>
                            <p className="text-4xl font-black tracking-tighter">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="font-bold text-base">{loading ? '...' : filteredList.length} Itens</p>
                                <p className="text-gray-400 text-xs">Exibidos</p>
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
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <h3 className="font-black text-black text-sm">Lista Unificada</h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">TOOLS</span>
                                    <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-bold">CONTAS</span>
                                </div>
                            </div>
                            
                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="BUSCAR..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-black focus:outline-none placeholder:normal-case"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100 min-h-[80px]">
                            {loading ? (
                                <div className="p-6 flex items-center justify-center text-gray-400">
                                    <Loader2 size={20} className="animate-spin mr-2"/> Carregando...
                                </div>
                            ) : filteredList.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 font-medium text-sm">Nenhum custo encontrado.</div>
                            ) : (
                                filteredList.map(item => {
                                    // Resolve Linked Project Name
                                    const linkedProjectName = item.linkedProjectId 
                                        ? projects.find(p => p.id === item.linkedProjectId)?.nome 
                                        : null;

                                    return (
                                        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors group animate-in fade-in gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${
                                                    item.type === 'TOOL' 
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                                    : 'bg-orange-50 text-orange-600 border-orange-100'
                                                }`}>
                                                    {item.type === 'TOOL' ? <Bot size={18} /> : <Layers size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-black text-sm uppercase">{item.name}</p>
                                                    
                                                    {/* Display Description if exists */}
                                                    {item.description && (
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5 max-w-[200px] md:max-w-xs truncate uppercase">
                                                            <FileText size={10} className="shrink-0"/> {item.description}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-gray-500 mt-0.5">
                                                        <span className="flex items-center gap-1"><Calendar size={10} /> Dia {item.dueDate}</span>
                                                        
                                                        <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                        <span className="flex items-center gap-1 uppercase"><User size={10} /> {item.owner}</span>
                                                        
                                                        {linkedProjectName && (
                                                            <>
                                                                <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                                <span className="flex items-center gap-1 uppercase text-black bg-gray-200 px-1.5 py-0.5 rounded">
                                                                    <Building2 size={8} /> {linkedProjectName}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-12 sm:pl-0">
                                                <p className="font-black text-base">{formatCurrency(item.value)}</p>
                                                <button 
                                                    onClick={() => handleDelete(item.id, item.type)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1.5"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
