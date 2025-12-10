import React, { useState } from 'react';
import { Layers, Plus, Trash2, Calendar, User, Search } from 'lucide-react';
import { formatCurrency } from '../services/utils';
import { useFirestoreCollection } from '../hooks/useFirestore';

interface Platform {
    id: string;
    name: string;
    client: string;
    value: number;
    dueDate: number;
}

export const PlatformManager: React.FC = () => {
    // Switch to Firestore
    const { data: platforms, addItem, deleteItem } = useFirestoreCollection<Platform>('platforms');
    
    const [newName, setNewName] = useState('');
    const [newClient, setNewClient] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDate, setNewDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = async () => {
        if (!newName || !newClient || !newValue || !newDate) return;
        const newPlat: Platform = {
            id: Date.now().toString(),
            name: newName,
            client: newClient,
            value: parseFloat(newValue),
            dueDate: parseInt(newDate)
        };
        await addItem(newPlat);
        setNewName('');
        setNewClient('');
        setNewValue('');
        setNewDate('');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja apagar este registro?')) {
            await deleteItem(id);
        }
    };

    const filteredPlatforms = platforms.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.client.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCost = filteredPlatforms.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-8 animate-in slide-in-from-left duration-500">
             <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-black tracking-tight flex items-center justify-center md:justify-start gap-3">
                    <Layers size={32} className="text-black" strokeWidth={2.5} />
                    Mensalidades
                </h2>
                <p className="text-gray-600 font-medium mt-1 text-lg">Custos de ativação e plataformas de clientes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Form */}
                <div className="bg-white rounded-3xl p-8 shadow-apple border border-gray-200 h-fit">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">Nova Mensalidade</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome da Plataforma</label>
                            <input 
                                type="text" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ex: Shopify"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                            <input 
                                type="text" 
                                value={newClient}
                                onChange={e => setNewClient(e.target.value)}
                                placeholder="Ex: Alpha Corp"
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
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all text-center"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleAdd}
                            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            <Plus size={20} strokeWidth={3} /> Registrar
                        </button>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search & Stats */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                            <Search size={20} className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar por plataforma ou cliente..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-black font-medium placeholder:font-normal placeholder:text-gray-400"
                            />
                        </div>
                        <div className="bg-emerald-100 text-emerald-800 px-6 py-4 rounded-2xl font-bold flex flex-col justify-center min-w-[140px] border border-emerald-200">
                             <span className="text-xs uppercase opacity-70">Total Repasse</span>
                             <span className="text-xl">{formatCurrency(totalCost)}</span>
                        </div>
                    </div>

                    {/* Platform List */}
                    <div className="bg-white rounded-3xl shadow-apple border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-black text-black">Contas Cadastradas</h3>
                            <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">{filteredPlatforms.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {filteredPlatforms.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 font-medium">Nenhuma conta encontrada.</div>
                            ) : (
                                filteredPlatforms.map(plat => (
                                    <div key={plat.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors group gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                                                <Layers size={22} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-black text-lg leading-tight">{plat.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1 font-semibold"><User size={12}/> {plat.client}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="flex items-center gap-1"><Calendar size={12}/> Dia {plat.dueDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pl-16 md:pl-0">
                                            <p className="font-black text-xl text-black">{formatCurrency(plat.value)}</p>
                                            <button 
                                                onClick={() => handleDelete(plat.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                                title="Remover"
                                            >
                                                <Trash2 size={20} />
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