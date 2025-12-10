import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, TrendingUp, CreditCard, Target, Wallet, ArrowRight, Sparkles, TrendingDown, Layout, Edit3, X, GripVertical, AlertCircle, Copy, Check, Settings, Infinity, BarChart3, ChevronLeft, ChevronRight, Calendar, PieChart, ArrowUpRight, ArrowDownRight, LayoutGrid } from 'lucide-react';
import { formatCurrency } from '../services/utils';

// --- Types ---
interface FinanceItem {
    id: string;
    name: string;      
    details: string;   
    date: string;      
    value: number;
}

interface AccountBox {
    id: string;
    name: string;
    balance: number;
}

interface OutflowCategory {
    id: string;
    title: string;
    items: FinanceItem[];
}

interface PixKey {
    id: string;
    title: string;
    key: string;
    type?: string;
}

// Inner Data Structure (The actual content)
interface WalletData {
    accounts: AccountBox[];
    inflows: FinanceItem[];
    outflowCategories: OutflowCategory[];
    onRadar: FinanceItem[];
    cardLimits: FinanceItem[];
    pixKeys: PixKey[];
}

type WalletMode = 'CONTINUUM' | 'CONTROLLER';

// Global State Structure
interface DashboardState {
    mode: WalletMode;
    // Controller Mode State
    currentYear: number;
    currentMonth: number; // 0-11
    
    // Data Stores
    continuum: WalletData;
    controller: Record<string, WalletData>; // Key format: "YYYY-MM"
}

// --- Initial Mock Data - NOW FULLY CLEAN ---
const EMPTY_WALLET_DATA: WalletData = {
    accounts: [{ id: 'acc-1', name: 'Principal', balance: 0 }],
    inflows: [],
    outflowCategories: [], // Empty start
    onRadar: [],
    cardLimits: [],
    pixKeys: []
};

const INITIAL_STATE: DashboardState = {
    mode: 'CONTINUUM',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    continuum: JSON.parse(JSON.stringify(EMPTY_WALLET_DATA)), // Deep copy
    controller: {}
};

// --- Component Definition: DetailedSection ---
interface DetailedSectionProps {
    listId: string;
    title: string;
    icon: React.ReactNode;
    items: FinanceItem[];
    totalValue: number;
    onAddItem: () => void;
    onRemoveItem: (id: string) => void;
    onUpdateItem: (id: string, field: keyof FinanceItem, value: any) => void;
    onDragStart?: (listId: string, index: number) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (listId: string, index: number) => void;
    theme: 'green' | 'red' | 'purple' | 'gray';
    variant?: 'compact';
    titleEditable?: boolean;
    onTitleChange?: (newTitle: string) => void;
    focusId?: string | null;
    catId?: string;
    customHeaderAction?: React.ReactNode;
}

const DetailedSection: React.FC<DetailedSectionProps> = ({
    listId, title, icon, items, totalValue, onAddItem, onRemoveItem, onUpdateItem,
    onDragStart, onDragOver, onDrop, theme, variant, titleEditable, onTitleChange, focusId, customHeaderAction
}) => {
    const isCompact = variant === 'compact';
    
    // Theme colors
    const themeColors: Record<string, string> = {
        green: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        red: 'bg-red-50 border-red-100 text-red-600',
        purple: 'bg-purple-50 border-purple-100 text-purple-600',
        gray: 'bg-gray-50 border-gray-100 text-gray-600',
    };

    const activeTheme = themeColors[theme] || themeColors.gray;

    return (
        // REMOVED fixed height classes to allow auto-growth
        <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col relative transition-all duration-300 ease-in-out`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${activeTheme}`}>
                        {icon}
                    </div>
                    {titleEditable ? (
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => onTitleChange?.(e.target.value)}
                            className="font-black text-sm uppercase tracking-wide bg-transparent outline-none w-full min-w-0"
                            placeholder="NOME DA SESSÃO"
                        />
                    ) : (
                        <h3 className="font-black text-xs text-gray-500 uppercase tracking-widest truncate">{title}</h3>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {customHeaderAction}
                    <button onClick={onAddItem} className="bg-black text-white p-1 rounded-md hover:scale-110 transition-transform shadow-sm">
                        <Plus size={12} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-2">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-300">
                        <p className="text-[10px] font-bold uppercase">Lista Vazia</p>
                    </div>
                ) : (
                    items.map((item, index) => (
                        <div 
                            key={item.id} 
                            draggable={!!onDragStart}
                            onDragStart={() => onDragStart?.(listId, index)}
                            onDragOver={onDragOver}
                            onDrop={() => onDrop?.(listId, index)}
                            className={`group flex items-center gap-2 p-2 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all relative animate-in slide-in-from-left-2 duration-300 ${focusId === item.id ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-100' : ''}`}
                        >
                            {onDragStart && (
                                <div className="cursor-grab text-gray-300 hover:text-gray-500 hidden sm:block">
                                    <GripVertical size={12} />
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
                                {/* Name & Details */}
                                <div className={`${isCompact ? 'col-span-7' : 'col-span-6 sm:col-span-5'}`}>
                                    <input 
                                        type="text" 
                                        value={item.name} 
                                        onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
                                        className="font-bold text-xs text-black bg-transparent outline-none w-full placeholder:text-gray-300"
                                        placeholder="Nome..."
                                        autoFocus={focusId === item.id}
                                    />
                                    {!isCompact && (
                                        <input 
                                            type="text" 
                                            value={item.details} 
                                            onChange={(e) => onUpdateItem(item.id, 'details', e.target.value)}
                                            className="text-[10px] font-medium text-gray-400 bg-transparent outline-none w-full placeholder:text-gray-200 hidden sm:block"
                                            placeholder="Detalhes..."
                                        />
                                    )}
                                </div>
                                
                                {/* Date (If not compact) */}
                                {!isCompact && (
                                    <div className="col-span-3 hidden sm:flex items-center">
                                        <input 
                                            type="text" 
                                            value={item.date} 
                                            onChange={(e) => onUpdateItem(item.id, 'date', e.target.value)}
                                            className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 text-center w-full outline-none uppercase"
                                            placeholder="DATA"
                                        />
                                    </div>
                                )}

                                {/* Value */}
                                <div className={`${isCompact ? 'col-span-5' : 'col-span-6 sm:col-span-4'} flex items-center justify-end gap-1`}>
                                    <span className="text-[10px] text-gray-400 font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        value={item.value === 0 ? '' : item.value} 
                                        onChange={(e) => onUpdateItem(item.id, 'value', parseFloat(e.target.value) || 0)}
                                        className="font-black text-sm text-right bg-transparent outline-none w-full placeholder:text-gray-200"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Delete Item Button */}
                            <button 
                                onClick={() => onRemoveItem(item.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                type="button"
                                title="Excluir item"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Total */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                <span className="text-base font-black text-black">{formatCurrency(totalValue)}</span>
            </div>
        </div>
    );
};

// --- Report Modal Component ---
interface WalletReportsProps {
    data: WalletData;
    onClose: () => void;
    monthName: string;
}

const WalletReports: React.FC<WalletReportsProps> = ({ data, onClose, monthName }) => {
    // 1. Calculate Totals
    const totalIn = data.inflows.reduce((acc, i) => acc + i.value, 0);
    const totalOut = data.outflowCategories.reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.value, 0), 0);
    const balance = totalIn - totalOut;

    // 2. Calculate Category Breakdown
    const categoriesData = data.outflowCategories.map(cat => ({
        id: cat.id,
        title: cat.title,
        value: cat.items.reduce((acc, i) => acc + i.value, 0)
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    // Max value for progress bars
    const maxCatValue = Math.max(...categoriesData.map(c => c.value), 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-black flex items-center gap-2">
                            <LayoutGrid size={20} className="text-black" /> Dashboards & Relatórios
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{monthName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* 1. Balance Summary Cards */}
                    <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase mb-3">Balanço Geral</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                                    <ArrowUpRight size={16} />
                                    <span className="text-[10px] font-black uppercase">Entradas</span>
                                </div>
                                <p className="text-xl font-black text-emerald-700 truncate">{formatCurrency(totalIn)}</p>
                            </div>
                            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                                <div className="flex items-center gap-2 mb-2 text-red-600">
                                    <ArrowDownRight size={16} />
                                    <span className="text-[10px] font-black uppercase">Saídas</span>
                                </div>
                                <p className="text-xl font-black text-red-700 truncate">{formatCurrency(totalOut)}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Visual Bar Comparison */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>Proporção de Fluxo</span>
                            <span>{balance >= 0 ? 'Resultado Positivo' : 'Alerta de Déficit'}</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                            <div style={{ width: `${(totalIn / (totalIn + totalOut || 1)) * 100}%` }} className="bg-emerald-500 h-full transition-all duration-1000"></div>
                            <div style={{ width: `${(totalOut / (totalIn + totalOut || 1)) * 100}%` }} className="bg-red-500 h-full transition-all duration-1000"></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                            <span className="text-emerald-600">{((totalIn / (totalIn + totalOut || 1)) * 100).toFixed(0)}% Receita</span>
                            <span className="text-red-600">{((totalOut / (totalIn + totalOut || 1)) * 100).toFixed(0)}% Despesa</span>
                        </div>
                    </div>

                    {/* 3. Category Breakdown (Outras Sessões) */}
                    <div>
                        <h4 className="text-sm font-black text-black uppercase mb-4 flex items-center gap-2">
                            <PieChart size={14} /> Performance por Sessão
                        </h4>
                        <div className="space-y-4">
                            {categoriesData.length === 0 ? (
                                <div className="text-center p-6 border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                                    <p className="text-xs font-bold uppercase">Nenhum dado registrado</p>
                                </div>
                            ) : (
                                categoriesData.map((cat, idx) => (
                                    <div key={cat.id} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-700 flex items-center gap-2">
                                                <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[9px]">{idx + 1}</span>
                                                {cat.title}
                                            </span>
                                            <span className="text-black">{formatCurrency(cat.value)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-black rounded-full transition-all duration-1000"
                                                style={{ width: `${(cat.value / maxCatValue) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[2rem]">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Resultado Líquido</span>
                        <span className={`text-xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(balance)}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export const WalletDashboard: React.FC = () => {
    // New storage key for the V9 architecture
    const [state, setState] = useLocalStorage<DashboardState>('joia_wallet_v9_system', INITIAL_STATE);
    const [smartCommand, setSmartCommand] = useState('');
    const [lastAction, setLastAction] = useState<string | null>(null);
    const [showReports, setShowReports] = useState(false);
    
    // Auto-focus logic
    const [focusId, setFocusId] = useState<string | null>(null);

    // Drag & Drop State
    const [draggedItem, setDraggedItem] = useState<{ listId: string, index: number } | null>(null);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

    // --- Helper: Get Active Data ---
    const getControllerKey = (year: number, month: number) => `${year}-${month}`;
    
    const activeKey = getControllerKey(state.currentYear, state.currentMonth);

    const data: WalletData = useMemo(() => {
        if (state.mode === 'CONTINUUM') {
            return state.continuum;
        } else {
            // Return existing month data or empty template
            return state.controller[activeKey] || EMPTY_WALLET_DATA;
        }
    }, [state.mode, state.continuum, state.controller, activeKey]);

    // --- Helper: Update Active Data ---
    // This function abstracts the logic of saving to the correct store (Continuum vs Specific Month)
    const updateActiveData = (newData: WalletData) => {
        setState(prev => {
            if (prev.mode === 'CONTINUUM') {
                return { ...prev, continuum: newData };
            } else {
                const key = getControllerKey(prev.currentYear, prev.currentMonth);
                return {
                    ...prev,
                    controller: {
                        ...prev.controller,
                        [key]: newData
                    }
                };
            }
        });
    };

    // --- Calculations ---
    const totalCash = data.accounts.reduce((acc, item) => acc + item.balance, 0);
    const totalInflows = data.inflows.reduce((acc, item) => acc + item.value, 0);
    
    const totalOutflows = data.outflowCategories.reduce((acc, cat) => {
        return acc + cat.items.reduce((iAcc, item) => iAcc + item.value, 0);
    }, 0);

    const projectedBalance = totalCash + totalInflows - totalOutflows;
    const totalRadar = data.onRadar.reduce((acc, item) => acc + item.value, 0);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        const maxVal = Math.max(totalInflows, totalOutflows, 1);
        return { in: totalInflows, out: totalOutflows, max: maxVal };
    }, [totalInflows, totalOutflows]);

    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (listId: string, index: number) => {
        setDraggedItem({ listId, index });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
    };

    const handleDrop = (targetListId: string, targetIndex: number) => {
        if (!draggedItem || draggedItem.listId !== targetListId) return;

        const listKey = targetListId.split(':')[0]; 
        const catId = targetListId.split(':')[1]; 

        let newData = { ...data };

        if (listKey === 'inflows') {
            const newItems = [...newData.inflows];
            const [removed] = newItems.splice(draggedItem.index, 1);
            newItems.splice(targetIndex, 0, removed);
            newData.inflows = newItems;
        } else if (listKey === 'cat' && catId) {
            const newCategories = newData.outflowCategories.map(cat => {
                if (cat.id === catId) {
                    const newItems = [...cat.items];
                    const [removed] = newItems.splice(draggedItem.index, 1);
                    newItems.splice(targetIndex, 0, removed);
                    return { ...cat, items: newItems };
                }
                return cat;
            });
            newData.outflowCategories = newCategories;
        }
        updateActiveData(newData);
        setDraggedItem(null);
    };

    // --- CRUD Actions (Wrapped) ---

    // Accounts
    const updateAccount = (id: string, field: keyof AccountBox, value: any) => {
        const newData = { ...data, accounts: data.accounts.map(acc => acc.id === id ? { ...acc, [field]: value } : acc) };
        updateActiveData(newData);
    };
    const addAccount = () => {
        const newId = Date.now().toString();
        const newData = { ...data, accounts: [...data.accounts, { id: newId, name: 'Nova Caixa', balance: 0 }] };
        updateActiveData(newData);
    };
    const removeAccount = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta caixa?')) {
            const newData = { ...data, accounts: data.accounts.filter(a => a.id !== id) };
            updateActiveData(newData);
        }
    };

    // Generic Items
    const updateItem = (listKey: 'inflows' | 'onRadar' | 'cardLimits', id: string, field: keyof FinanceItem, value: any) => {
        const newData = { ...data, [listKey]: data[listKey].map(item => item.id === id ? { ...item, [field]: value } : item) };
        updateActiveData(newData);
    };
    const addItem = (listKey: 'inflows' | 'onRadar' | 'cardLimits', initialData?: Partial<FinanceItem>) => {
        const newId = Date.now().toString();
        const newItem: FinanceItem = { 
            id: newId, 
            name: initialData?.name || '', 
            details: initialData?.details || '', 
            date: initialData?.date || '', 
            value: initialData?.value || 0 
        };
        const newData = { ...data, [listKey]: [...data[listKey], newItem] };
        updateActiveData(newData);
        setFocusId(newId);
    };
    const removeItem = (listKey: 'inflows' | 'onRadar' | 'cardLimits', id: string) => {
        // Direct update to ensure re-render
        const newData = { ...data, [listKey]: data[listKey].filter(item => item.id !== id) };
        updateActiveData(newData);
    };

    // Outflow Categories & Items
    const addOutflowCategory = (title: string = 'Nova Sessão') => {
        const newId = Date.now().toString();
        const newData = { ...data, outflowCategories: [...data.outflowCategories, { id: newId, title, items: [] }] };
        updateActiveData(newData);
        setFocusId(newId);
    };
    const removeOutflowCategory = (catId: string) => {
        if (window.confirm('ATENÇÃO: Deseja excluir esta sessão inteira e todos os itens dentro dela?')) {
            const newData = { ...data, outflowCategories: data.outflowCategories.filter(c => c.id !== catId) };
            updateActiveData(newData);
        }
    };
    const updateCategoryTitle = (catId: string, newTitle: string) => {
        const newData = { ...data, outflowCategories: data.outflowCategories.map(c => c.id === catId ? { ...c, title: newTitle } : c) };
        updateActiveData(newData);
    };
    const addOutflowItem = (catId: string, initialData?: Partial<FinanceItem>) => {
        const newId = Date.now().toString() + Math.random().toString().slice(2,5);
        const newItem: FinanceItem = { 
            id: newId, 
            name: initialData?.name || '', 
            details: initialData?.details || '', 
            date: initialData?.date || '', 
            value: initialData?.value || 0 
        };
        const newData = {
            ...data,
            outflowCategories: data.outflowCategories.map(c => c.id === catId ? { ...c, items: [...c.items, newItem] } : c)
        };
        updateActiveData(newData);
        setFocusId(newId);
    };
    const updateOutflowItem = (catId: string, itemId: string, field: keyof FinanceItem, value: any) => {
        const newData = {
            ...data,
            outflowCategories: data.outflowCategories.map(c => c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) } : c)
        };
        updateActiveData(newData);
    };
    const removeOutflowItem = (catId: string, itemId: string) => {
        const newData = {
            ...data,
            outflowCategories: data.outflowCategories.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)
        };
        updateActiveData(newData);
    };

    // Pix Keys
    const addPixKey = (initial?: { title: string, key: string, type?: string }) => {
        const newData = { 
            ...data, 
            pixKeys: [...(data.pixKeys || []), { 
                id: Date.now().toString() + Math.random(), 
                title: initial?.title || '', 
                key: initial?.key || '',
                type: initial?.type || ''
            }] 
        };
        updateActiveData(newData);
    };
    const updatePixKey = (id: string, field: keyof PixKey, value: string) => {
        const newData = { ...data, pixKeys: data.pixKeys.map(k => k.id === id ? { ...k, [field]: value } : k) };
        updateActiveData(newData);
    };
    const removePixKey = (id: string) => {
        const newData = { ...data, pixKeys: data.pixKeys.filter(k => k.id !== id) };
        updateActiveData(newData);
    };
    const copyPix = (key: string, id: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKeyId(id);
        setTimeout(() => setCopiedKeyId(null), 2000);
    };

    // --- SMART COMMAND PARSER 2.0 (Intelligent) ---
    const handleSmartSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = smartCommand.trim();
        if (!cmd) return;

        // Parse Helper
        const extractValue = (str: string) => {
            const matches = str.match(/(\d+[.,]?\d*)/);
            if (matches) return parseFloat(matches[0].replace(',', '.'));
            return 0;
        };
        const removeValue = (str: string) => str.replace(/(\d+[.,]?\d*)/, '').trim();

        const lowerCmd = cmd.toLowerCase();
        let actionTaken = '';

        // 1. CHAVES PIX
        if (lowerCmd.startsWith('pix') || lowerCmd.startsWith('chave')) {
            const clean = cmd.replace(/^(pix|chave|chave pix)\s*/i, '');
            // Tenta separar Nome e Chave
            const parts = clean.split(' ');
            const key = parts.pop() || ''; // Assume a ultima parte é a chave
            const name = parts.join(' ') || 'Nova Chave';
            
            addPixKey({ title: name, key: key, type: 'Smart' });
            actionTaken = 'Chave Pix salva!';
        }
        // 2. LIMITES
        else if (lowerCmd.startsWith('limite')) {
            const clean = cmd.replace(/^limite\s*/i, '');
            const val = extractValue(clean);
            const name = removeValue(clean) || 'Cartão';
            
            addItem('cardLimits', { name, value: val, date: 'MENSAL' });
            actionTaken = 'Limite adicionado!';
        }
        // 3. CAIXAS (Accounts)
        else if (lowerCmd.startsWith('caixa') || lowerCmd.startsWith('minha caixa')) {
            const clean = cmd.replace(/^(caixa|minha caixa)\s*/i, '');
            const val = extractValue(clean);
            const name = removeValue(clean) || 'Nova Caixa';

            const newData = { ...data, accounts: [...data.accounts, { id: Date.now().toString(), name, balance: val }] };
            updateActiveData(newData);
            actionTaken = 'Nova Caixa criada!';
        }
        // 4. NO RADAR
        else if (lowerCmd.startsWith('radar') || lowerCmd.startsWith('no radar')) {
            const clean = cmd.replace(/^(radar|no radar)\s*/i, '');
            const val = extractValue(clean);
            const name = removeValue(clean) || 'Item';
            
            addItem('onRadar', { name, value: val, date: 'FUTURO' });
            actionTaken = 'Item adicionado ao Radar!';
        }
        // 5. ENTRADAS
        else if (lowerCmd.startsWith('entrada')) {
            const clean = cmd.replace(/^entrada\s*/i, '');
            const val = extractValue(clean);
            // Check for date pattern simple (dd mmm) at end
            const name = removeValue(clean);
            
            addItem('inflows', { name: name || 'Nova Entrada', value: val, date: 'HOJE' });
            actionTaken = 'Entrada registrada!';
        }
        // 6. SAÍDAS / DESPESAS
        else if (lowerCmd.startsWith('saida') || lowerCmd.startsWith('despesa')) {
            const clean = cmd.replace(/^(saida|despesa)\s*/i, '');
            const val = extractValue(clean);
            const name = removeValue(clean);

            // Logic Fix: Handle empty category scenario
            let catId = data.outflowCategories[0]?.id;
            
            if (!catId) {
                // Create a new category AND the item in one atomic update
                const newCatId = Date.now().toString();
                const newItem: FinanceItem = { 
                    id: Date.now().toString() + '1', 
                    name: name || 'Nova Despesa', 
                    details: 'SmartBox', 
                    date: 'HOJE', 
                    value: val 
                };
                
                const newCat = { id: newCatId, title: 'Geral', items: [newItem] };
                const newData = { ...data, outflowCategories: [newCat] }; // Replace or append
                updateActiveData(newData);
            } else {
                addOutflowItem(catId, { name: name || 'Nova Despesa', value: val, date: 'HOJE' });
            }
            actionTaken = 'Despesa lançada!';
        }
        // FALLBACK (Default behavior / Text Note)
        else {
             actionTaken = 'Comando não reconhecido. Tente: Pix, Entrada, Saida...';
        }

        setLastAction(actionTaken);
        setSmartCommand('');
        setTimeout(() => setLastAction(null), 3000);
    };

    // --- NAVIGATION LOGIC ---
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    const changeMonth = (monthIndex: number) => {
        setState(prev => ({ ...prev, currentMonth: monthIndex }));
    };
    
    const changeYear = (delta: number) => {
        setState(prev => ({ ...prev, currentYear: prev.currentYear + delta }));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4 pb-24 font-sans px-2 sm:px-0">
            
            {showReports && (
                <WalletReports 
                    data={data} 
                    onClose={() => setShowReports(false)} 
                    monthName={state.mode === 'CONTROLLER' ? `${months[state.currentMonth]} ${state.currentYear}` : 'Continuum'} 
                />
            )}

            {/* HEADER CONFIG MODES */}
            <div className="flex flex-col gap-2 px-2 py-3 mb-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">SYSTEM ARCHITECTURE</span>
                    <button className="p-1.5 text-gray-300 hover:text-black transition-colors rounded-full hover:bg-gray-100"><Settings size={14} /></button>
                </div>
                
                <div className="flex bg-gray-100/50 p-1 rounded-xl gap-1">
                    <button 
                        onClick={() => setState(prev => ({ ...prev, mode: 'CONTINUUM' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${state.mode === 'CONTINUUM' ? 'bg-white text-black shadow-apple scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Infinity size={14} strokeWidth={state.mode === 'CONTINUUM' ? 3 : 2} /> Continuum
                    </button>
                    <button 
                        onClick={() => setState(prev => ({ ...prev, mode: 'CONTROLLER' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${state.mode === 'CONTROLLER' ? 'bg-white text-black shadow-apple scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <BarChart3 size={14} strokeWidth={state.mode === 'CONTROLLER' ? 3 : 2} /> Controller
                    </button>
                </div>

                {/* CONTROLLER MONTH SELECTOR & REPORTS BUTTON */}
                {state.mode === 'CONTROLLER' && (
                    <div className="animate-in slide-in-from-top-2 pt-2 border-t border-gray-100 mt-1 flex flex-col gap-2">
                        {/* Month Nav */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeYear(-1)} className="p-1 hover:bg-gray-200 rounded-md"><ChevronLeft size={14}/></button>
                                <span className="text-sm font-black text-black tracking-widest">{state.currentYear}</span>
                                <button onClick={() => changeYear(1)} className="p-1 hover:bg-gray-200 rounded-md"><ChevronRight size={14}/></button>
                            </div>
                            
                            {/* NEW: DASHBOARD REPORT BUTTON */}
                            <button 
                                onClick={() => setShowReports(true)}
                                className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                            >
                                <LayoutGrid size={14} /> Dashboards
                            </button>
                        </div>
                        
                        {/* Month List */}
                        <div className="flex justify-between items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                            {months.map((m, idx) => (
                                <button
                                    key={m}
                                    onClick={() => changeMonth(idx)}
                                    className={`min-w-[40px] py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                        state.currentMonth === idx 
                                        ? 'bg-black text-white shadow-md' 
                                        : 'bg-transparent text-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 0) SMART COMMAND BAR */}
            <div className="sticky top-0 z-30 pt-2 pb-1 bg-apple-bg/95 backdrop-blur-md">
                <div className={`relative p-[2px] rounded-2xl shadow-sm transition-all duration-500 ${state.mode === 'CONTINUUM' ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400'}`}>
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
                            placeholder="Comandos: 'Pix [nome] [chave]', 'Entrada [nome] [valor]', 'Saida [nome] [valor]'..."
                            className="w-full pl-10 pr-10 py-2.5 font-bold italic text-sm text-white placeholder:text-white/70 placeholder:font-normal placeholder:not-italic outline-none resize-none h-[42px] focus:h-[120px] transition-all duration-300 custom-scrollbar pt-2.5 bg-transparent relative z-0"
                        />
                        <div className="absolute inset-0 bg-black/10 -z-10 pointer-events-none"></div>
                        <button type="submit" className="absolute right-2 top-2 bg-white text-black p-1.5 rounded-lg hover:scale-105 transition-transform z-10">
                            <ArrowRight size={14} />
                        </button>
                    </form>
                    {lastAction && (
                        <div className="absolute -bottom-8 left-0 w-full text-center">
                            <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-in slide-in-from-top-2 fade-in">{lastAction}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 1) HEADER & ACCOUNTS (CAIXAS) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* CAIXAS - COMPACT */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-black text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Wallet size={14} /> Minhas Caixas
                        </h3>
                        <button onClick={addAccount} className="bg-black text-white p-1 rounded-md hover:scale-110 transition-transform">
                            <Plus size={12} />
                        </button>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x">
                        {data.accounts.map(acc => (
                            <div key={acc.id} className="snap-start min-w-[150px] bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col justify-between group relative hover:border-gray-300 transition-colors">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeAccount(acc.id);
                                    }} 
                                    className="absolute top-1 right-1 text-gray-300 hover:text-red-500 transition-colors"
                                    type="button"
                                >
                                    <X size={14} />
                                </button>
                                <input 
                                    type="text" 
                                    value={acc.name} 
                                    onChange={(e) => updateAccount(acc.id, 'name', e.target.value)} 
                                    className="bg-transparent font-black text-xs text-black outline-none w-full mb-1 placeholder:text-gray-300"
                                    placeholder="Nome"
                                />
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-gray-400">R$</span>
                                    <input 
                                        type="number" 
                                        value={acc.balance === 0 ? '' : acc.balance} 
                                        onChange={(e) => updateAccount(acc.id, 'balance', parseFloat(e.target.value) || 0)} 
                                        className="bg-transparent font-black text-base text-black outline-none w-full placeholder:text-gray-200"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-end">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total Disp.</p>
                        <p className="text-xl font-black text-black tracking-tight">{formatCurrency(totalCash)}</p>
                    </div>
                </div>

                {/* CHART / SUMMARY - COMPACT */}
                <div className="bg-white rounded-2xl p-4 shadow-float border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Saldo Projetado</p>
                        <p className={`text-2xl font-black tracking-tighter ${projectedBalance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {formatCurrency(projectedBalance)}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1 font-medium">Caixa + Entradas - Saídas</p>
                    </div>

                    <div className="relative z-10 mt-2 flex gap-3 items-end">
                         {/* Visual Chart */}
                        <div className="flex gap-1 h-12 items-end flex-1">
                            <div style={{ height: `${(chartData.in / chartData.max) * 100}%` }} className="bg-emerald-100 border border-emerald-200 rounded-t-sm w-full"></div>
                            <div style={{ height: `${(chartData.out / chartData.max) * 100}%` }} className="bg-red-100 border border-red-200 rounded-t-sm w-full"></div>
                        </div>
                        {/* Numeric Outflow Summary */}
                        <div className="flex flex-col items-end justify-end pb-0">
                            <span className="text-[8px] font-bold text-red-400 uppercase">Total Saídas</span>
                            <span className="text-sm font-black text-red-600 leading-tight">{formatCurrency(totalOutflows)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FINANCIAL SUMMARY BAR - CENTERED SALDO ONLY */}
            <div className="flex justify-center">
                 <div className="bg-black text-white px-8 py-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center shadow-float min-w-[200px] relative overflow-hidden transition-all duration-500">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${state.mode === 'CONTINUUM' ? 'from-purple-500 to-orange-500' : 'from-blue-500 to-teal-500'}`}></div>
                    <span className="text-[10px] font-bold uppercase opacity-70 mb-1 flex items-center gap-1"><TrendingUp size={12}/> SALDO FINAL {state.mode === 'CONTROLLER' && `(${months[state.currentMonth]})`}</span>
                    <span className={`text-3xl font-black ${projectedBalance < 0 ? 'text-red-400' : 'text-white'}`}>{formatCurrency(projectedBalance)}</span>
                 </div>
            </div>

            {/* 2) ENTRADAS (INFLOWS) */}
            <DetailedSection 
                listId="inflows"
                title="Entradas Previstas"
                icon={<TrendingUp size={16} className="text-emerald-500" />}
                items={data.inflows}
                totalValue={totalInflows}
                onAddItem={() => addItem('inflows')}
                onRemoveItem={(id) => removeItem('inflows', id)}
                onUpdateItem={(id, field, val) => updateItem('inflows', id, field, val)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                theme="green"
                focusId={focusId}
            />

            {/* 3) SAÍDAS DINÂMICAS (OUTFLOWS) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1 pt-2 relative">
                    <h2 className="text-base font-black text-black flex items-center gap-2">
                        <TrendingDown size={18} className="text-red-500" />
                        SAÍDAS & DESPESAS
                    </h2>
                </div>
                
                {/* CENTERED ADD BUTTON */}
                <div className="flex justify-center">
                     <button 
                        onClick={() => addOutflowCategory()}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                    >
                        <Layout size={14} /> Nova Sessão
                    </button>
                </div>

                {data.outflowCategories.map(cat => (
                    <div key={cat.id} className="animate-in slide-in-from-bottom-2 duration-500">
                        <DetailedSection 
                            listId={`cat:${cat.id}`}
                            title={cat.title}
                            titleEditable
                            onTitleChange={(newTitle) => updateCategoryTitle(cat.id, newTitle)}
                            icon={<CreditCard size={16} className="text-red-400" />}
                            items={cat.items}
                            totalValue={cat.items.reduce((a, b) => a + b.value, 0)}
                            onAddItem={() => addOutflowItem(cat.id)}
                            onRemoveItem={(itemId) => removeOutflowItem(cat.id, itemId)}
                            onUpdateItem={(itemId, field, val) => updateOutflowItem(cat.id, itemId, field, val)}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            theme="red"
                            focusId={focusId}
                            catId={cat.id}
                            customHeaderAction={
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOutflowCategory(cat.id);
                                        }}
                                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                        title="Excluir Sessão"
                                        type="button"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            }
                        />
                    </div>
                ))}
            </div>

            {/* 4) NO RADAR & LIMITES (INFORMATIVOS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <DetailedSection 
                    listId="onRadar"
                    title="No Radar"
                    icon={<Target size={16} className="text-purple-500" />}
                    items={data.onRadar}
                    totalValue={totalRadar}
                    onAddItem={() => addItem('onRadar')}
                    onRemoveItem={(id) => removeItem('onRadar', id)}
                    onUpdateItem={(id, field, val) => updateItem('onRadar', id, field, val)}
                    theme="purple"
                    variant="compact"
                    focusId={focusId}
                />

                <DetailedSection 
                    listId="cardLimits"
                    title="Limites"
                    icon={<CreditCard size={16} className="text-gray-500" />}
                    items={data.cardLimits}
                    totalValue={data.cardLimits.reduce((a, b) => a + b.value, 0)}
                    onAddItem={() => addItem('cardLimits')}
                    onRemoveItem={(id) => removeItem('cardLimits', id)}
                    onUpdateItem={(id, field, val) => updateItem('cardLimits', id, field, val)}
                    theme="gray"
                    variant="compact"
                    focusId={focusId}
                />
            </div>

            {/* 5) CHAVES PIX - SMART PARSED */}
            <div className="bg-black rounded-2xl p-4 shadow-sm border border-gray-800">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800">
                     <h3 className="font-black text-xs text-white flex items-center gap-2 uppercase tracking-wide">
                        <Wallet size={14} /> Chaves PIX
                     </h3>
                     <button onClick={() => addPixKey()} className="bg-white/10 text-white p-1 rounded-md hover:bg-white hover:text-black transition-colors"><Plus size={12}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.pixKeys?.length === 0 && <p className="text-[10px] text-gray-500 italic md:col-span-2 text-center py-1">Use SmartBox: 'Pix [nome] [chave]'</p>}
                    {data.pixKeys?.map(pk => (
                        <div key={pk.id} className="bg-white/5 rounded-lg p-2 border border-white/10 flex items-center gap-2 group">
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <input 
                                        type="text" 
                                        value={pk.title} 
                                        onChange={(e) => updatePixKey(pk.id, 'title', e.target.value)}
                                        placeholder="TITULAR"
                                        className="bg-transparent text-[9px] font-bold text-gray-400 uppercase w-full outline-none mb-0.5 placeholder:text-gray-600"
                                    />
                                    {pk.type && <span className="text-[8px] text-gray-600 uppercase font-bold px-1 rounded bg-white/5">{pk.type}</span>}
                                </div>
                                <input 
                                    type="text" 
                                    value={pk.key} 
                                    onChange={(e) => updatePixKey(pk.id, 'key', e.target.value)}
                                    placeholder="Chave..."
                                    className="bg-transparent text-xs font-medium text-white w-full outline-none placeholder:text-gray-600"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => copyPix(pk.key, pk.id)} 
                                    className={`p-1.5 rounded-md transition-colors ${copiedKeyId === pk.id ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                                >
                                    {copiedKeyId === pk.id ? <Check size={12}/> : <Copy size={12}/>}
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removePixKey(pk.id);
                                    }} 
                                    className="p-1.5 rounded-md bg-white/5 text-gray-500 hover:text-red-500 transition-colors"
                                    type="button"
                                >
                                    <Trash2 size={12}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};