
import React, { useMemo, useRef, useState } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { Project, AITool, Platform, PartnershipCard, Expense } from '../types';
import { formatCurrency } from '../services/utils';
import { Activity, Copy, Bot, CreditCard, LayoutGrid, PieChart, Receipt, Calendar, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toJpeg } from 'html-to-image';
import { useToast } from '../context/ToastContext';

const SimplePieChart = ({ data, colors }: { data: { label: string, value: number }[], colors: string[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let cumulativePercent = 0;
    function getCoordinatesForPercent(percent: number) {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }
    return (
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90 drop-shadow-xl">
            <defs>
                <filter id="f3d" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="0.04" />
                    <feOffset dx="0.015" dy="0.015" result="offsetblur" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            {data.map((slice, i) => {
                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += slice.value / (total || 1);
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
                const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                return (
                    <motion.path 
                        key={i} 
                        d={pathData} 
                        fill={colors[i % colors.length]} 
                        stroke="#fff" 
                        strokeWidth="0.01" 
                        filter="url(#f3d)"
                        whileHover={{ scale: 1.05 }}
                    />
                );
            })}
            <circle r="0.55" cx="0" cy="0" fill="#fff" />
        </svg>
    );
};

const SimpleBarChart = ({ data, color, height = "h-32" }: { data: { label: string, value: number }[], color: string, height?: string }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className={`flex items-end justify-between ${height} gap-1.5 px-1 overflow-hidden`}>
            {data.map((item, i) => (
                <div key={i} className="flex-1 group relative flex flex-col items-center h-full justify-end">
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.value / max) * 100}%` }}
                        className="w-full rounded-t-md shadow-[inset_0_2px_6px_rgba(255,255,255,0.2)]"
                        style={{ background: `linear-gradient(to top, ${color}cc, ${color})` }}
                    />
                </div>
            ))}
        </div>
    );
};

export const BalanceManager: React.FC = () => {
    const { data: projects, loading: loadProjects } = useFirestoreCollection<Project>('projects');
    const { data: tools, loading: loadTools } = useFirestoreCollection<AITool>('ai_tools');
    const { data: platforms, loading: loadPlatforms } = useFirestoreCollection<Platform>('platforms');
    const { data: partnerships, loading: loadPartnerships } = useFirestoreCollection<PartnershipCard>('partnerships');
    const { data: expenses, loading: loadExpenses } = useFirestoreCollection<Expense>('expenses');
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'tools' | 'partnerships' | 'projects' | 'expenses'>('tools');
    const captureRef = useRef<HTMLDivElement>(null);

    // Filter states
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    const loading = loadProjects || loadTools || loadPlatforms || loadPartnerships || loadExpenses;

    const stats = useMemo(() => {
        // Receita
        const totalRevenue = projects.reduce((acc, curr) => acc + (Number(curr.valorContrato) || 0), 0);
        
        // Custos Fixos (Ferramentas/Plataformas)
        const totalToolsCost = tools.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
        const totalPlatformsCost = platforms.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
        
        // Custos Variáveis (Filtrados por Mês/Ano)
        const filteredExpenses = expenses.filter(exp => {
            const d = new Date(exp.timestamp);
            return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
        });
        const totalOperationalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);

        // Totais
        const totalExpenses = totalToolsCost + totalPlatformsCost + totalOperationalExpenses;
        const netProfit = totalRevenue - totalExpenses;
        
        // Agrupamento de Despesas por Categoria
        const expenseByCategory: Record<string, number> = {};
        filteredExpenses.forEach(exp => {
            expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.value;
        });

        const partnerPayouts: Record<string, number> = {};
        partnerships.forEach(p => p.partners.forEach(pt => partnerPayouts[pt.name] = (partnerPayouts[pt.name] || 0) + (Number(pt.value) || 0)));

        const ownerCosts: Record<string, number> = {};
        [...tools, ...platforms].forEach(item => {
            const ownerKey = item.owner || 'OUTROS';
            ownerCosts[ownerKey] = (ownerCosts[ownerKey] || 0) + (Number(item.value) || 0);
        });

        const statusDistribution: Record<string, number> = {};
        projects.forEach(p => statusDistribution[p.status] = (statusDistribution[p.status] || 0) + 1);

        return {
            totalRevenue, totalExpenses, netProfit, totalOperationalExpenses,
            expenseCategoryData: Object.entries(expenseByCategory).map(([label, value]) => ({ label, value })),
            topExpenses: filteredExpenses.sort((a,b) => b.value - a.value).slice(0, 10).map(e => ({ label: e.description, value: e.value })),
            ownerData: Object.entries(ownerCosts).map(([label, value]) => ({ label, value })),
            partnerData: Object.entries(partnerPayouts).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value),
            statusData: Object.entries(statusDistribution).map(([label, value]) => ({ label, value })),
            projectValues: projects.map(p => ({ label: p.nome, value: Number(p.valorContrato) || 0 })).sort((a,b) => b.value - a.value)
        };
    }, [projects, tools, platforms, partnerships, expenses, filterMonth, filterYear]);

    const handleCapture = async () => {
        if (!captureRef.current) return;
        try {
            const dataUrl = await toJpeg(captureRef.current, { quality: 1, backgroundColor: '#F5F5F7' });
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/jpeg': blob })]);
            addToast(`Dashboard copiado!`, 'success');
        } catch (err) {
            addToast('Erro ao copiar imagem.', 'error');
        }
    };

    if (loading) return <div className="p-10 text-center"><Activity className="animate-spin mx-auto text-black" /></div>;

    const COLORS = ['#000', '#2563eb', '#f59e0b', '#dc2626', '#10b981', '#7c3aed'];
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div className="space-y-4 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-black via-zinc-900 to-black text-white p-5 md:p-6 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden shrink-0">
                <div className="relative z-10 flex justify-between items-center gap-4">
                    <div className="flex-1">
                        <p className="text-white text-[9px] font-black uppercase tracking-[0.2em] mb-1">Net Health Score</p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-300">
                            {formatCurrency(stats.netProfit)}
                        </h1>
                        <div className="flex gap-6 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white uppercase tracking-wider opacity-90">Receita Ativa</span>
                                <span className="text-lg font-black text-emerald-400">+{formatCurrency(stats.totalRevenue)}</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-800 self-center" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white uppercase tracking-wider opacity-90">Custo Geral</span>
                                <span className="text-lg font-black text-red-400">-{formatCurrency(stats.totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleCapture} className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase shadow-xl shrink-0">
                        <Copy size={14} /> Capturar
                    </button>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full" />
            </div>

            {/* Full Name Tabs */}
            <div className="flex p-1 bg-white border border-gray-200 rounded-2xl shadow-sm mx-auto shrink-0 w-full overflow-x-auto custom-scrollbar no-scrollbar">
                <button 
                    onClick={() => setActiveTab('tools')} 
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 px-4 whitespace-nowrap min-w-[140px] ${activeTab === 'tools' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                >
                    <Bot size={14} /> FERRAMENTAS IA
                </button>
                <button 
                    onClick={() => setActiveTab('partnerships')} 
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 px-4 whitespace-nowrap min-w-[140px] ${activeTab === 'partnerships' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                >
                    <CreditCard size={14} /> RATEIO PARCERIAS
                </button>
                <button 
                    onClick={() => setActiveTab('projects')} 
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 px-4 whitespace-nowrap min-w-[140px] ${activeTab === 'projects' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                >
                    <LayoutGrid size={14} /> PROJETOS
                </button>
                <button 
                    onClick={() => setActiveTab('expenses')} 
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 px-4 whitespace-nowrap min-w-[140px] ${activeTab === 'expenses' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                >
                    <Receipt size={14} /> DESPESAS OPERACIONAIS
                </button>
            </div>

            <div ref={captureRef} className="flex-1 min-h-0 pb-16 md:pb-0 overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'tools' && (
                        <motion.div key="tools" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                            <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-apple border border-gray-100 flex flex-col items-center">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Rateio por Responsável</h4>
                                <div className="w-36 h-36 relative mb-6">
                                    <SimplePieChart data={stats.ownerData} colors={COLORS} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full overflow-y-auto max-h-32 custom-scrollbar">
                                    {stats.ownerData.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center text-[11px] font-bold border-b pb-1 border-gray-50">
                                            <span className="flex items-center gap-2 truncate"><div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: COLORS[i % COLORS.length] }} /> {d.label}</span>
                                            <span className="text-gray-500 font-black shrink-0">{formatCurrency(d.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-apple border border-gray-100 flex flex-col justify-between">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Análise de Intensidade (Custos Fixos)</h4>
                                <SimpleBarChart data={[...tools, ...platforms].sort((a,b)=>Number(b.value)-Number(a.value)).slice(0, 12).map(i=>({label: i.name, value: Number(i.value)}))} color="#000" height="h-24" />
                                <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Custo Médio p/ Ativo</p>
                                        <p className="text-2xl font-black text-black">{formatCurrency((stats.totalExpenses - stats.totalOperationalExpenses) / (tools.length + platforms.length || 1))}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Ativos Lançados</p>
                                        <p className="text-2xl font-black text-black">{tools.length + platforms.length}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'partnerships' && (
                        <motion.div key="parts" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="h-full">
                            <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-apple border border-gray-100 h-full flex flex-col overflow-hidden">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Ranking de Repasse HUB</h4>
                                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                    {stats.partnerData.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-md">{i + 1}</div>
                                                <span className="font-black text-sm uppercase tracking-tight text-gray-800">{p.label}</span>
                                            </div>
                                            <span className="text-lg font-black text-black">{formatCurrency(p.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'projects' && (
                        <motion.div key="projs" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                            <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-apple border border-gray-100 flex flex-col items-center col-span-1">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Distribuição Operacional</h4>
                                <div className="w-32 h-32 relative">
                                    <SimplePieChart data={stats.statusData} colors={['#10b981', '#3b82f6', '#f59e0b', '#dc2626']} />
                                </div>
                                <div className="mt-6 space-y-1.5 w-full overflow-y-auto max-h-32 custom-scrollbar pr-1">
                                    {stats.statusData.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter text-gray-600">
                                            <span className="truncate mr-4">{s.label}</span>
                                            <span className="bg-gray-100 px-2.5 py-1 rounded-lg shrink-0 text-black shadow-sm">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-apple border border-gray-100 md:col-span-2 flex flex-col justify-between h-full">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Concentração de Faturamento p/ Cliente</h4>
                                <SimpleBarChart data={stats.projectValues.slice(0, 16)} color="#10b981" height="h-24" />
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 border rounded-2xl bg-emerald-50 border-emerald-100 shadow-sm">
                                        <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Ticket Médio HUB</p>
                                        <p className="text-xl font-black text-emerald-800">{formatCurrency(stats.totalRevenue / (projects.length || 1))}</p>
                                    </div>
                                    <div className="p-4 border rounded-2xl bg-blue-50 border-blue-100 shadow-sm">
                                        <p className="text-[9px] font-black uppercase text-blue-600 mb-1">Total de Projetos</p>
                                        <p className="text-xl font-black text-blue-800">{projects.length}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'expenses' && (
                        <motion.div key="expenses" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="space-y-4 h-full flex flex-col">
                            {/* Filter Bar */}
                            <div className="flex flex-col sm:flex-row gap-2 items-center bg-white p-2 rounded-2xl border border-gray-200 shrink-0">
                                <div className="flex items-center gap-2 px-3 text-gray-400">
                                    <Filter size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Período</span>
                                </div>
                                <select 
                                    value={filterMonth} 
                                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-black transition-all"
                                >
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <select 
                                    value={filterYear} 
                                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[11px] font-black outline-none focus:ring-2 focus:ring-black transition-all"
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <div className="ml-auto pr-3 hidden sm:block">
                                    <span className="text-[10px] font-black text-zinc-300 uppercase">Custo Variável: </span>
                                    <span className="text-sm font-black text-black">{formatCurrency(stats.totalOperationalExpenses)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                                <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-apple border border-gray-100 flex flex-col items-center">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Categorias do Período</h4>
                                    {stats.expenseCategoryData.length > 0 ? (
                                        <>
                                            <div className="w-32 h-32 relative mb-6">
                                                <SimplePieChart data={stats.expenseCategoryData} colors={COLORS} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full overflow-y-auto max-h-32 custom-scrollbar">
                                                {stats.expenseCategoryData.map((d, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[10px] font-bold border-b pb-1 border-gray-50 uppercase">
                                                        <span className="flex items-center gap-2 truncate"><div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: COLORS[i % COLORS.length] }} /> {d.label}</span>
                                                        <span className="text-gray-500 font-black shrink-0">{formatCurrency(d.value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                                            <PieChart size={32} strokeWidth={1} />
                                            <p className="text-[9px] font-black uppercase italic">Sem dados neste mês</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-apple border border-gray-100 flex flex-col justify-between">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Maiores Desembolsos</h4>
                                    {stats.topExpenses.length > 0 ? (
                                        <>
                                            <SimpleBarChart data={stats.topExpenses} color="#000" height="h-24" />
                                            <div className="mt-4 space-y-2 overflow-y-auto max-h-32 custom-scrollbar">
                                                {stats.topExpenses.map((exp, i) => (
                                                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase truncate pr-4">{exp.label}</span>
                                                        <span className="text-xs font-black text-black shrink-0">{formatCurrency(exp.value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                                            <Receipt size={32} strokeWidth={1} />
                                            <p className="text-[9px] font-black uppercase italic">Sem despesas registradas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
