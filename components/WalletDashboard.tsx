import React, { useState, useMemo } from 'react';
import { useFirestoreSubCollection } from '../hooks/useFirestore';
import { Trash2, TrendingUp, Wallet, ArrowRight, Sparkles, TrendingDown, X, Infinity, BarChart3, ChevronLeft, ChevronRight, LayoutGrid, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, getBrasiliaDate } from '../services/utils';
import { WalletEntry } from '../types';
import { parseWalletCommand, ParsedTransaction, ParsedPixKey } from '../services/walletParser';

interface WalletDashboardProps {
    walletId: string;
    walletName: string;
}

type WalletMode = 'CONTINUUM' | 'CONTROLLER';

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ walletId, walletName }) => {
    // --- 1. DATA SOURCE (Event Sourcing) ---
    // Reads directly from wallets/{id}/walletEntries
    const { data: entries, addSubItem, deleteSubItem } = useFirestoreSubCollection<WalletEntry>('wallets', walletId, 'walletEntries');

    // --- 2. LOCAL STATE ---
    const [mode, setMode] = useState<WalletMode>('CONTINUUM');
    const [currentDate, setCurrentDate] = useState(getBrasiliaDate());
    const [smartCommand, setSmartCommand] = useState('');
    const [lastAction, setLastAction] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [showReports, setShowReports] = useState(false);

    // --- 3. CLIENT-SIDE CALCULATIONS ---
    const filteredEntries = useMemo(() => {
        if (mode === 'CONTINUUM') return entries;

        // Controller Mode: Filter by Month/Year
        return entries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate.getMonth() === currentDate.getMonth() && 
                   entryDate.getFullYear() === currentDate.getFullYear();
        });
    }, [entries, mode, currentDate]);

    const inflows = useMemo(() => filteredEntries.filter(e => e.type === 'INFLOW'), [filteredEntries]);
    const outflows = useMemo(() => filteredEntries.filter(e => e.type === 'OUTFLOW'), [filteredEntries]);

    // Dynamic Categorization for Outflows
    const outflowCategories = useMemo(() => {
        const groups: Record<string, WalletEntry[]> = {};
        outflows.forEach(item => {
            const cat = item.category || 'Geral';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return Object.entries(groups).map(([title, items]) => ({ title, items }));
    }, [outflows]);

    const totalIn = inflows.reduce((acc, curr) => acc + curr.amount, 0);
    const totalOut = outflows.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIn - totalOut;

    // --- 4. SMART COMMAND PARSER (Robust Version) ---
    const handleSmartSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const result = parseWalletCommand(smartCommand);

        if (result.type === 'UNKNOWN' || result.error) {
            setLastAction({ msg: result.error || 'Erro desconhecido', type: 'error' });
            setTimeout(() => setLastAction(null), 3000);
            return;
        }

        try {
            if (result.type === 'TRANSACTION' && result.data) {
                const tx = result.data as ParsedTransaction;
                
                const newEntry: Omit<WalletEntry, 'id' | 'ownerId' | 'createdAt'> = {
                    walletId,
                    type: tx.intent,
                    amount: tx.amount,
                    description: tx.description,
                    category: tx.category,
                    status: 'COMPLETED',
                    date: tx.date
                };

                await addSubItem(newEntry);
                setLastAction({ msg: `${tx.intent === 'INFLOW' ? 'Entrada' : 'Saída'} de ${formatCurrency(tx.amount)} registrada!`, type: 'success' });
            } 
            else if (result.type === 'PIX_KEY' && result.data) {
                 const keyData = result.data as ParsedPixKey;
                 // Store Pix Key as a reference entry
                 const pixEntry: Omit<WalletEntry, 'id' | 'ownerId' | 'createdAt'> = {
                    walletId,
                    type: 'OUTFLOW', // Using Outflow type but 0 amount for info storage
                    amount: 0,
                    description: `Chave Pix Salva: ${keyData.name}`,
                    category: 'Chaves Pix',
                    status: 'COMPLETED',
                    date: getBrasiliaDate().toISOString(),
                    tags: ['PIX_KEY', keyData.key]
                };

                await addSubItem(pixEntry);
                setLastAction({ msg: `Chave Pix de ${keyData.name} salva!`, type: 'success' });
            }

            setSmartCommand('');
        } catch (err) {
            console.error(err);
            setLastAction({ msg: 'Erro ao salvar no banco de dados.', type: 'error' });
        }

        setTimeout(() => setLastAction(null), 4000);
    };

    // --- 5. UI HELPERS ---
    const handleMonthChange = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    // --- UI RENDER ---
    const renderList = (items: WalletEntry[], emptyMsg: string, isOutflow = false) => (
        <div className="space-y-2">
            {items.length === 0 ? (
                <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center text-gray-400 text-xs font-bold uppercase">
                    {emptyMsg}
                </div>
            ) : (
                items.map(item => (
                    <div key={item.id} className="group flex items-center justify-between p-3 bg-white rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all animate-in slide-in-from-left-2">
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-gray-800 truncate">{item.description}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                                {new Date(item.date).toLocaleDateString('pt-BR')} • {item.category}
                                {item.tags?.includes('PIX_KEY') && <span className="ml-2 bg-blue-100 text-blue-700 px-1 rounded">Chave: {item.tags[1]}</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`font-black text-sm ${item.amount === 0 ? 'text-gray-400' : (isOutflow ? 'text-red-500' : 'text-emerald-600')}`}>
                                {item.amount > 0 ? (isOutflow ? '-' : '+') : ''}{formatCurrency(item.amount)}
                            </span>
                            <button 
                                onClick={() => deleteSubItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-24 font-sans px-2 sm:px-0">
             
             {/* Header */}
             <div className="bg-black/90 backdrop-blur text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Wallet size={16} />
                    </div>
                    <div>
                         <p className="text-[10px] font-bold uppercase text-white/60">Carteira Ativa</p>
                         <p className="font-black text-sm">{walletName}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1 justify-end">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Synced
                    </span>
                </div>
            </div>

            {/* Config & Modes */}
            <div className="flex flex-col gap-2 px-2 py-3 mb-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">VIEW MODE</span>
                    <button onClick={() => setShowReports(!showReports)} className={`p-2 rounded-lg transition-colors ${showReports ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
                        <LayoutGrid size={16} />
                    </button>
                </div>
                <div className="flex bg-gray-100/50 p-1 rounded-xl gap-1">
                    <button 
                        onClick={() => setMode('CONTINUUM')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'CONTINUUM' ? 'bg-white text-black shadow-apple scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Infinity size={14} strokeWidth={mode === 'CONTINUUM' ? 3 : 2} /> Continuum
                    </button>
                    <button 
                        onClick={() => setMode('CONTROLLER')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'CONTROLLER' ? 'bg-white text-black shadow-apple scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <BarChart3 size={14} strokeWidth={mode === 'CONTROLLER' ? 3 : 2} /> Controller
                    </button>
                </div>
                
                {mode === 'CONTROLLER' && (
                    <div className="flex items-center justify-center gap-4 py-2 border-t border-gray-100 mt-1 animate-in slide-in-from-top-2">
                        <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={16}/></button>
                        <span className="text-sm font-black text-black uppercase">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={16}/></button>
                    </div>
                )}
            </div>

            {/* SMART COMMAND BAR */}
             <div className="sticky top-0 z-30 pt-2 pb-1 bg-apple-bg/95 backdrop-blur-md">
                <div className={`relative p-[2px] rounded-2xl shadow-sm transition-all duration-500 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500`}>
                    <form onSubmit={handleSmartSubmit} className="relative bg-transparent rounded-xl overflow-hidden flex items-center">
                        <Sparkles className="absolute left-3 top-3 text-white animate-pulse z-10" size={16} />
                        <textarea 
                            value={smartCommand}
                            onChange={(e) => setSmartCommand(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSmartSubmit(e);
                                }
                            }}
                            placeholder="Ex: 'Entrada 500 Freelance', 'Gasto 80 Jantar em Lazer', 'Pix Joey 1234'..."
                            className="w-full pl-10 pr-10 py-2.5 font-bold italic text-sm text-white placeholder:text-white/70 placeholder:font-normal placeholder:not-italic outline-none resize-none h-[42px] focus:h-[80px] transition-all duration-300 custom-scrollbar pt-2.5 bg-transparent relative z-0"
                        />
                        <button type="submit" className="absolute right-2 top-2 bg-white text-black p-1.5 rounded-lg hover:scale-105 transition-transform z-10">
                            <ArrowRight size={14} />
                        </button>
                    </form>
                    {lastAction && (
                        <div className="absolute -bottom-10 left-0 w-full text-center">
                            <span className={`text-[10px] font-bold px-4 py-2 rounded-full shadow-float animate-in slide-in-from-top-2 fade-in ${lastAction.type === 'error' ? 'bg-red-500 text-white' : 'bg-black text-white'}`}>
                                {lastAction.msg}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* BALANCE CARD */}
            <div className="flex justify-center my-6">
                 <div className="bg-white px-8 py-6 rounded-3xl border border-gray-100 flex flex-col items-center justify-center shadow-float min-w-[240px] relative overflow-hidden transition-all duration-500">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">SALDO {mode === 'CONTROLLER' ? 'DO MÊS' : 'TOTAL'}</span>
                    <span className={`text-4xl font-black ${balance < 0 ? 'text-red-500' : 'text-black'}`}>{formatCurrency(balance)}</span>
                    <div className="flex gap-4 mt-2 w-full justify-center">
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-emerald-500 uppercase flex items-center justify-center gap-1"><ArrowUpRight size={10}/> Entradas</p>
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalIn)}</p>
                        </div>
                        <div className="w-px bg-gray-100 h-8"></div>
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-red-400 uppercase flex items-center justify-center gap-1"><ArrowDownRight size={10}/> Saídas</p>
                            <p className="text-sm font-bold text-red-500">{formatCurrency(totalOut)}</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* INFLOWS */}
                <div className="bg-gray-50/50 rounded-3xl p-4 border border-gray-200/50">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-black text-sm text-emerald-700 uppercase flex items-center gap-2">
                            <TrendingUp size={16} /> Entradas
                        </h3>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{inflows.length}</span>
                    </div>
                    {renderList(inflows, "Nenhuma entrada registrada.", false)}
                </div>

                {/* OUTFLOWS GROUPED */}
                <div className="space-y-4">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-sm text-red-600 uppercase flex items-center gap-2">
                            <TrendingDown size={16} /> Saídas por Categoria
                        </h3>
                    </div>
                    
                    {outflowCategories.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center text-gray-400 font-bold text-xs uppercase">
                            Nenhuma despesa registrada.
                        </div>
                    ) : (
                        outflowCategories.map((cat, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                                    <h4 className="font-black text-xs text-gray-500 uppercase tracking-widest">{cat.title}</h4>
                                    <span className="text-xs font-black text-red-500">
                                        {formatCurrency(cat.items.reduce((a,b) => a + b.amount, 0))}
                                    </span>
                                </div>
                                {renderList(cat.items, "", true)}
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {/* Reports Overlay */}
            {showReports && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 shadow-2xl relative">
                        <button onClick={() => setShowReports(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                        <h3 className="text-2xl font-black mb-6">Relatório Rápido</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Fluxo Líquido</p>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex mt-1">
                                    <div style={{ width: `${(totalIn / (totalIn + totalOut || 1)) * 100}%` }} className="bg-emerald-500"></div>
                                    <div style={{ width: `${(totalOut / (totalIn + totalOut || 1)) * 100}%` }} className="bg-red-500"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold mt-1">
                                    <span className="text-emerald-600">{(totalIn / (totalIn + totalOut || 1) * 100).toFixed(0)}% Entrada</span>
                                    <span className="text-red-600">{(totalOut / (totalIn + totalOut || 1) * 100).toFixed(0)}% Saída</span>
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Categorias de Gasto</p>
                                {outflowCategories
                                    .sort((a,b) => b.items.reduce((x,y) => x+y.amount,0) - a.items.reduce((x,y) => x+y.amount,0))
                                    .slice(0, 3)
                                    .map(cat => (
                                    <div key={cat.title} className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="font-bold text-sm">{cat.title}</span>
                                        <span className="font-mono text-sm">{formatCurrency(cat.items.reduce((a,b) => a+b.amount, 0))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};
