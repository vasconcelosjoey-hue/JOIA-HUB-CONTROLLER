
import React, { useMemo, useRef, useState } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { Project, AITool, Platform, PartnershipCard } from '../types';
import { formatCurrency } from '../services/utils';
import { Activity, Copy, Bot, CreditCard, LayoutGrid, Users, Wallet, DollarSign } from 'lucide-react';
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
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'tools' | 'partnerships' | 'projects'>('tools');
    const captureRef = useRef<HTMLDivElement>(null);

    const loading = loadProjects || loadTools || loadPlatforms || loadPartnerships;

    const stats = useMemo(() => {
        const totalRevenue = projects.reduce((acc, curr) => acc + (curr.valorContrato || 0), 0);
        const totalToolsCost = tools.reduce((acc, curr) => acc + (curr.value || 0), 0);
        const totalPlatformsCost = platforms.reduce((acc, curr) => acc + (curr.value || 0), 0);
        const totalExpenses = totalToolsCost + totalPlatformsCost;
        
        const partnerPayouts: Record<string, number> = {};
        partnerships.forEach(p => p.partners.forEach(pt => partnerPayouts[pt.name] = (partnerPayouts[pt.name] || 0) + pt.value));

        const ownerCosts: Record<string, number> = {};
        [...tools, ...platforms].forEach(item => ownerCosts[item.owner || 'OUTROS'] = (ownerCosts[item.owner || 'OUTROS'] || 0) + item.value);

        const statusDistribution: Record<string, number> = {};
        projects.forEach(p => statusDistribution[p.status] = (statusDistribution[p.status] || 0) + 1);

        return {
            totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses,
            ownerData: Object.entries(ownerCosts).map(([label, value]) => ({ label, value })),
            partnerData: Object.entries(partnerPayouts).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value),
            statusData: Object.entries(statusDistribution).map(([label, value]) => ({ label, value })),
            projectValues: projects.map(p => ({ label: p.nome, value: p.valorContrato })).sort((a,b) => b.value - a.value)
        };
    }, [projects, tools, platforms, partnerships]);

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

    if (loading) return <div className="p-10 text-center"><Activity className="animate-spin mx-auto" /></div>;

    const COLORS = ['#000', '#2563eb', '#f59e0b', '#dc2626', '#10b981', '#7c3aed'];

    return (
        <div className="space-y-3 max-w-5xl mx-auto pb-4 h-full flex flex-col">
            {/* COMPACT 3D Header Card */}
            <div className="bg-gradient-to-br from-black via-zinc-900 to-black text-white p-4 md:p-6 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden shrink-0">
                <div className="relative z-10 flex justify-between items-center gap-4">
                    <div className="flex-1">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Net Health Score</p>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
                            {formatCurrency(stats.netProfit)}
                        </h1>
                        <div className="flex gap-4 mt-3">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Receita</span>
                                <span className="text-base font-black text-emerald-400">+{formatCurrency(stats.totalRevenue)}</span>
                            </div>
                            <div className="w-px h-6 bg-zinc-800 self-center" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Custos</span>
                                <span className="text-base font-black text-red-400">-{formatCurrency(stats.totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleCapture} className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase border border-white/10 shrink-0">
                        <Copy size={14} /> Capturar
                    </button>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/10 blur-[60px] rounded-full" />
            </div>

            {/* Compact Sub-Aba Navigation */}
            <div className="flex p-1 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-xs mx-auto shrink-0">
                <button onClick={() => setActiveTab('tools')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'tools' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}>
                    <Bot size={12} /> IA
                </button>
                <button onClick={() => setActiveTab('partnerships')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'partnerships' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}>
                    <CreditCard size={12} /> Rateio
                </button>
                <button onClick={() => setActiveTab('projects')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'projects' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}>
                    <LayoutGrid size={12} /> Proj
                </button>
            </div>

            <div ref={captureRef} className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    {activeTab === 'tools' && (
                        <motion.div key="tools" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                            <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-apple border border-gray-100 flex flex-col items-center">
                                <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-4">Participação por Responsável</h4>
                                <div className="w-40 h-40 relative mb-4">
                                    <SimplePieChart data={stats.ownerData} colors={COLORS} />
                                    <div className="absolute inset-0 flex items-center justify-center font-black text-[9px] text-gray-300">CUSTO</div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
                                    {stats.ownerData.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-bold border-b pb-0.5 border-gray-50">
                                            <span className="flex items-center gap-1.5 truncate"><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} /> {d.label}</span>
                                            <span className="text-gray-400 shrink-0">{formatCurrency(d.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-apple border border-gray-100 flex flex-col justify-between">
                                <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">Maiores Custos</h4>
                                <SimpleBarChart data={[...tools, ...platforms].sort((a,b)=>b.value-a.value).slice(0, 10).map(i=>({label: i.name, value: i.value}))} color="#000" height="h-28" />
                                <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-zinc-400">Média p/ Item</p>
                                        <p className="text-xl font-black">{formatCurrency(stats.totalExpenses / (tools.length + platforms.length || 1))}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-zinc-400">Itens Ativos</p>
                                        <p className="text-xl font-black">{tools.length + platforms.length}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'partnerships' && (
                        <motion.div key="parts" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="h-full">
                            <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-apple border border-gray-100 h-full flex flex-col">
                                <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-4">Ranking de Repasse</h4>
                                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                    {stats.partnerData.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">{i + 1}</div>
                                                <span className="font-black text-xs uppercase tracking-tight">{p.label}</span>
                                            </div>
                                            <span className="text-base font-black text-blue-600">{formatCurrency(p.value)}</span>
                                        </div>
                                    ))}
                                    {stats.partnerData.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-gray-300 font-bold text-xs uppercase italic">Sem repasses este mês</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'projects' && (
                        <motion.div key="projs" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                            <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-apple border border-gray-100 flex flex-col items-center col-span-1">
                                <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-4">Saúde da Carteira</h4>
                                <div className="w-36 h-36 relative">
                                    <SimplePieChart data={stats.statusData} colors={['#10b981', '#3b82f6', '#f59e0b', '#dc2626']} />
                                </div>
                                <div className="mt-4 space-y-1 w-full">
                                    {stats.statusData.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                            <span className="truncate mr-2">{s.label}</span>
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-apple border border-gray-100 md:col-span-2 flex flex-col justify-between h-full">
                                <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-4">Volume por Contrato</h4>
                                <SimpleBarChart data={stats.projectValues.slice(0, 15)} color="#10b981" height="h-32" />
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="p-3 border rounded-xl bg-emerald-50 border-emerald-100">
                                        <p className="text-[8px] font-black uppercase text-emerald-600">Ticket Médio</p>
                                        <p className="text-xl font-black text-emerald-700">{formatCurrency(stats.totalRevenue / (projects.length || 1))}</p>
                                    </div>
                                    <div className="p-3 border rounded-xl bg-blue-50 border-blue-100">
                                        <p className="text-[8px] font-black uppercase text-blue-600">Projetos Ativos</p>
                                        <p className="text-xl font-black text-blue-700">{projects.length}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
