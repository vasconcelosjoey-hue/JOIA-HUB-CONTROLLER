
import React, { useState } from 'react';
import { Layers, Plus, Trash2, Calendar, User, Search, Loader2 } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';

interface Platform {
    id: string;
    name: string;
    client: string;
    value: number;
    dueDate: number;
    owner?: 'CARRYON' | 'SPENCER' | 'JOI.A.';
}

export const PlatformManager: React.FC = () => {
    // Switch to Firestore
    const { data: platforms, loading, addItem, deleteItem } = useFirestoreCollection<Platform>('platforms');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newName, setNewName] = useState('');
    const [newClient, setNewClient] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newOwner, setNewOwner] = useState<Platform['owner']>('CARRYON');
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = async () => {
        if (!newName || !newClient || !newValue || !newDate) return;
        setIsSubmitting(true);
        try {
            // Remove 'id' to allow Firestore to generate it
            const newPlat: Omit<Platform, 'id'> = {
                name: newName,
                client: newClient,
                value: parseCurrencyInput(newValue),
                dueDate: parseInt(newDate),
                owner: newOwner
            };
            await addItem(newPlat);
            setNewName('');
            setNewClient('');
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
        if (window.confirm('Tem certeza que deseja apagar este registro?')) {
            await deleteItem(id);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newName && newClient && newValue && newDate) {
            handleAdd();
        }
    };

    const filteredPlatforms = platforms.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.client.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCost = filteredPlatforms.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-left duration-500">
             <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                    <Layers className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                    Mensalidades
                </h2>
                <p className="text-gray-600 font-medium mt-0.5 text-sm md:text-base">Custos de ativação e plataformas de clientes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <div className="bg-white rounded-2xl p-5 shadow-apple border border-gray-200 h-fit" onKeyDown={handleKeyDown}>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Nova Mensalidade</h3>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Plataforma</label>
                            <input 
                                type="text" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ex: Shopify"
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Cliente</label>
                            <input 
                                type="text" 
                                value={newClient}
                                onChange={e => setNewClient(e.target.value)}
                                placeholder="Ex: Alpha Corp"
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
                            disabled={isSubmitting || !newName || !newClient || !newValue || !newDate}
                            className="w-full bg-black text-white font-black uppercase tracking-widest py-3 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                            {isSubmitting ? 'Salvando...' : 'Registrar'}
                        </button>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Search & Stats */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-200 flex items-center gap-3">
                            <Search size={18} className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar por plataforma ou cliente..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-black font-medium placeholder:font-normal placeholder:text-gray-400 text-sm"
                            />
                        </div>
                        <div className="bg-emerald-100 text-emerald-800 px-5 py-3 rounded-2xl font-bold flex flex-col justify-center min-w-[120px] border border-emerald-200">
                             <span className="text-[10px] uppercase opacity-70">Total Repasse</span>
                             <span className="text-lg">{formatCurrency(totalCost)}</span>
                        </div>
                    </div>

                    {/* Platform List */}
                    <div className="bg-white rounded-2xl shadow-apple border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-black text-black text-sm">Contas Cadastradas</h3>
                            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {loading ? '...' : filteredPlatforms.length}
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100 min-h-[80px]">
                            {loading ? (
                                <div className="p-6 flex items-center justify-center text-gray-400">
                                    <Loader2 size={20} className="animate-spin mr-2"/> Carregando...
                                </div>
                            ) : filteredPlatforms.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 font-medium text-sm">Nenhuma conta encontrada.</div>
                            ) : (
                                filteredPlatforms.map(plat => (
                                    <div key={plat.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors group gap-3 animate-in fade-in">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                                                <Layers size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-black text-base leading-tight">{plat.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1 font-semibold"><User size={10}/> {plat.client}</span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                    <span className="flex items-center gap-1"><Calendar size={10}/> Dia {plat.dueDate}</span>
                                                    {plat.owner && (
                                                        <>
                                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                            <span className="font-bold text-[9px] uppercase tracking-wide">{plat.owner}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pl-14 md:pl-0">
                                            <p className="font-black text-lg text-black">{formatCurrency(plat.value)}</p>
                                            <button 
                                                onClick={() => handleDelete(plat.id)}
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
