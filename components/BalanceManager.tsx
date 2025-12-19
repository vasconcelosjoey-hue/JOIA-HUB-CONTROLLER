
import React, { useMemo, useRef } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { Project, AITool, Platform, PartnershipCard } from '../types';
import { formatCurrency } from '../services/utils';
import { PieChart as PieIcon, TrendingUp, TrendingDown, Activity, Download, Copy, Share2, Wallet, Users, LayoutGrid, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toJpeg } from 'html-to-image';
import { useToast } from '../context/ToastContext';

// Simple SVG Pie Chart Component
const SimplePieChart = ({ data, colors }: { data: { label: string, value: number }[], colors: string[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let cumulativePercent = 0;

    function getCoordinatesForPercent(percent: number) {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

    return (
        <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
            {data.map((slice, i) => {
                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += slice.value / total;
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
                const pathData = [
                    `M ${startX} ${startY}`,
                    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                    `L 0 0`,
                ].join(' ');
                return <path key={i} d={pathData} fill={colors[i % colors.length]} stroke="#fff" strokeWidth="0.01" />;
            })}
            <circle r="0.6" cx="0" cy="0" fill="#fff" />
        </svg>
    );
};

// Simple SVG Bar Chart Component
const SimpleBarChart = ({ data, color }: { data: { label: string, value: number }[], color: string }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end justify-between h-32 gap-1 px-2">
            {data.map((item, i) => (
                <div key={i} className="flex-1 group relative flex flex-col items-center">
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.value / max) * 100}%` }}
                        className="w-full rounded-t-sm"
                        style={{ backgroundColor: color }}
                    />
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[8px] px-1 py-0.5 rounded whitespace-nowrap z-10">
                        {formatCurrency(item.value)}
                    </div>
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

    const sectionsRefs = {
        tools: useRef<HTMLDivElement>(null),
        partnerships: useRef<HTMLDivElement>(null),
        projects: useRef<HTMLDivElement>(null)
    };

    const loading = loadProjects || loadTools || loadPlatforms || loadPartnerships;

    // --- DATA AGGREGATION ---
    const stats = useMemo(() => {
        const totalRevenue = projects.reduce((acc, curr) => acc + (curr.valorContrato || 0), 0);
        const totalToolsCost = tools.reduce((acc, curr) => acc + (curr.value || 0), 0);
        const totalPlatformsCost = platforms.reduce((acc, curr) => acc + (curr.value || 0), 0);
        const totalExpenses = totalToolsCost + totalPlatformsCost;
        
        // Payouts for partnerships
        const partnerPayouts: Record<string, number> = {};
        partnerships.forEach(p => {
            p.partners.forEach(partner => {
                partnerPayouts[partner.name] = (partnerPayouts[partner.name] || 0) + partner.value;
            });
        });

        const ownerCosts: Record<string, number> = {};
        [...tools, ...platforms].forEach(item => {
            const owner = item.owner || 'OUTROS';
            ownerCosts[owner] = (ownerCosts[owner] || 0) + item.value;
        });

        const catCosts: Record<string, number> = {};
        [...tools, ...platforms].forEach(item => {
            const cat = item.category || (item.description && item.description.length < 15 ? item.description : 'GERAL');
            catCosts[cat] = (catCosts[cat] || 0) + item.value;
        });

        const statusDistribution: Record<string, number> = {};
        projects.forEach(p => {
            statusDistribution[p.status] = (statusDistribution[p.status] || 0) + 1;
        });

        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            ownerData: Object.entries(ownerCosts).map(([label, value]) => ({ label, value })),
            catData: Object.entries(catCosts).map(([label, value]) => ({ label, value })),
            partnerData: Object.entries(partnerPayouts).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value),
            statusData: Object.entries(statusDistribution).map(([label, value]) => ({ label, value })),
            projectValues: projects.map(p => ({ label: p.nome, value: p.valorContrato })).sort((a,b) => b.value - a.value)
        };
    }, [projects, tools, platforms, partnerships]);

    const copySectionAsImage = async (ref: React.RefObject<HTMLDivElement>, name: string) => {
        if (!ref.current) return;
        try {
            const dataUrl = await toJpeg(ref.current, { quality: 0.95, backgroundColor: '#F5F5F7' });
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/jpeg': blob })
            ]);
            addToast(`Dashboard de ${name} copiado como imagem!`, 'success');
        } catch (err) {
            console.error(err);
            addToast('Erro ao capturar dashboard.', 'error');
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader /></div>;

    const COLORS = ['#000000', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto">
            
            {/* --- TOP HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-black text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="z-10">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Health Monitor</p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter flex items-center gap-4">
                        {formatCurrency(stats.netProfit)}
                        <span className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full animate-pulse">LIVE BALANCE</span>
                    </h1>
                    <div className="flex items-center gap-6 mt-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase">Receita</span>
                            <span className="text-lg font-black text-emerald-400">+{formatCurrency(stats.totalRevenue)}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-800" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase">Custos</span>
                            <span className="text-lg font-black text-red-400">-{formatCurrency(stats.totalExpenses)}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-800" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase">Margem</span>
                            <span className="text-lg font-black text-blue-400">{((stats.netProfit / (stats.totalRevenue || 1)) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block w-48 h-48 opacity-20 z-0 absolute right-10 top-1/2 -translate-y-1/2">
                   <Users size={200} />
                </div>
            </div>

            {/* --- 1. FERRAMENTAS & CUSTOS --- */}
            <div ref={sectionsRefs.tools} className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 space-y-8 group">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-black text-white rounded-2xl">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Custos Operacionais</h2>
                            <p className="text-gray-400 text-sm font-bold">Distribuição de mensalidades e ferramentas IA</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => copySectionAsImage(sectionsRefs.tools, 'Despesas')}
                        className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase"
                    >
                        <Copy size={16} /> Capturar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Pie: Owners */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Por Responsável</h4>
                        <div className="h-48 flex items-center justify-center relative">
                            <SimplePieChart data={stats.ownerData} colors={COLORS} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-black bg-white/80 backdrop-blur px-2 py-1 rounded shadow-sm uppercase">Owners</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {stats.ownerData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="truncate">{d.label}</span>
                                    <span className="ml-auto text-gray-400">{((d.value / stats.totalExpenses) * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pie: Categories */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Por Categoria</h4>
                        <div className="h-48 flex items-center justify-center relative">
                            <SimplePieChart data={stats.catData} colors={COLORS.slice().reverse()} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-black bg-white/80 backdrop-blur px-2 py-1 rounded shadow-sm uppercase">Categorias</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {stats.catData.slice(0, 6).map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.slice().reverse()[i % COLORS.length] }} />
                                    <span className="truncate">{d.label}</span>
                                    <span className="ml-auto text-gray-400">{((d.value / stats.totalExpenses) * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bar: Top Costs */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Distribuição de Valor</h4>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 h-48 flex flex-col justify-end">
                            <SimpleBarChart data={[...tools, ...platforms].sort((a,b)=>b.value-a.value).slice(0, 10).map(t=>({ label: t.name, value: t.value }))} color="#000" />
                        </div>
                        <div className="space-y-2 mt-2">
                             <p className="text-[10px] font-bold text-gray-400 uppercase">Top 3 Maiores Custos</p>
                             {[...tools, ...platforms].sort((a,b)=>b.value-a.value).slice(0, 3).map((item, i) => (
                                 <div key={i} className="flex justify-between items-center text-xs font-black">
                                     <span className="uppercase text-gray-600 truncate max-w-[140px]">{item.name}</span>
                                     <span>{formatCurrency(item.value)}</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 2. PARCERIAS & REPASSES --- */}
            <div ref={sectionsRefs.partnerships} className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 space-y-8 group">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Divisão de Lucros</h2>
                            <p className="text-gray-400 text-sm font-bold">Rateio entre sócios e parceiros estratégicos</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => copySectionAsImage(sectionsRefs.partnerships, 'Parcerias')}
                        className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase"
                    >
                        <Copy size={16} /> Capturar
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Partners Ranking */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ranking de Repasse</h4>
                        <div className="space-y-3">
                            {stats.partnerData.map((p, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">
                                            {i + 1}
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-wide">{p.label}</span>
                                    </div>
                                    <span className="font-black text-lg text-blue-600">{formatCurrency(p.value)}</span>
                                </motion.div>
                            ))}
                            {stats.partnerData.length === 0 && (
                                <p className="text-center py-10 text-gray-400 font-bold text-sm">Sem parcerias registradas.</p>
                            )}
                        </div>
                    </div>

                    {/* Chart: Partner Share */}
                    <div className="flex flex-col justify-center items-center bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-8">Participação no Rateio</h4>
                        <div className="w-full max-w-[280px] aspect-square relative">
                            <SimplePieChart data={stats.partnerData.length > 0 ? stats.partnerData : [{ label: 'Nenhum', value: 1 }]} colors={['#3b82f6', '#1e40af', '#60a5fa', '#93c5fd']} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <Users size={32} className="text-blue-600 opacity-20 mb-1" />
                                <span className="text-[10px] font-black text-blue-600 uppercase">Atores</span>
                            </div>
                        </div>
                        <p className="mt-8 text-xs font-bold text-gray-400 text-center uppercase tracking-widest leading-relaxed">
                            Total rateado este mês:<br/>
                            <span className="text-black text-lg font-black">{formatCurrency(stats.partnerData.reduce((a,b)=>a+b.value, 0))}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- 3. SAÚDE DA CARTEIRA (PROJETOS) --- */}
            <div ref={sectionsRefs.projects} className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 space-y-8 group">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                            <LayoutGrid size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Saúde da Carteira</h2>
                            <p className="text-gray-400 text-sm font-bold">Desempenho de projetos e status operacional</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => copySectionAsImage(sectionsRefs.projects, 'Projetos')}
                        className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase"
                    >
                        <Copy size={16} /> Capturar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Project Status Bubble */}
                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col justify-center items-center gap-6">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Status da Operação</h4>
                        <div className="flex flex-wrap justify-center gap-3">
                            {stats.statusData.map((s, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 min-w-[80px]">
                                    <span className="text-2xl font-black text-black">{s.value}</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase text-center">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Revenue Projects */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Volume por Contrato (Top 15)</h4>
                        <div className="h-48 bg-black rounded-2xl p-6 flex items-end">
                            <SimpleBarChart data={stats.projectValues.slice(0, 15)} color="#10b981" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                             <div className="p-4 border border-gray-100 rounded-xl">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Média de Contrato</p>
                                <p className="text-lg font-black">{formatCurrency(stats.totalRevenue / (projects.length || 1))}</p>
                             </div>
                             <div className="p-4 border border-gray-100 rounded-xl">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Ativos Totais</p>
                                <p className="text-lg font-black">{projects.length}</p>
                             </div>
                             <div className="p-4 border border-gray-100 rounded-xl bg-emerald-50 border-emerald-100">
                                <p className="text-[8px] font-black text-emerald-600 uppercase">Potencial Líquido</p>
                                <p className="text-lg font-black text-emerald-700">{formatCurrency(stats.netProfit)}</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER INSIGHT --- */}
            <div className="text-center space-y-2 pb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Dados integrados via Cloud Firestore</span>
                </div>
            </div>
        </div>
    );
};

const Loader = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Activity size={32} className="animate-pulse text-black" />
        <p className="text-[10px] font-black uppercase tracking-widest">Calculando Métricas...</p>
    </div>
);
