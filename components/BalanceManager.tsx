
import React from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { Project, AITool, Platform } from '../types';
import { formatCurrency } from '../services/utils';
import { PieChart, TrendingUp, TrendingDown, Activity, AlertTriangle, ArrowRight, Lightbulb, Wallet, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';

export const BalanceManager: React.FC = () => {
    // 1. Fetch Data
    const { data: projects, loading: loadProjects } = useFirestoreCollection<Project>('projects');
    const { data: tools, loading: loadTools } = useFirestoreCollection<AITool>('ai_tools');
    const { data: platforms, loading: loadPlatforms } = useFirestoreCollection<Platform>('platforms');

    const loading = loadProjects || loadTools || loadPlatforms;

    // 2. Calculate Totals
    const totalRevenue = projects.reduce((acc, curr) => acc + (curr.valorContrato || 0), 0);
    const totalToolsCost = tools.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const totalPlatformsCost = platforms.reduce((acc, curr) => acc + (curr.value || 0), 0);
    
    const totalExpenses = totalToolsCost + totalPlatformsCost;
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 3. Determine Health Status
    let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    if (margin > 40) healthStatus = 'excellent';
    else if (margin > 20) healthStatus = 'good';
    else if (margin > 0) healthStatus = 'warning';
    else healthStatus = 'critical';

    // 4. Analysis Logic
    const avgProjectValue = projects.length > 0 ? totalRevenue / projects.length : 0;
    const lowestProjects = [...projects].sort((a, b) => a.valorContrato - b.valorContrato).slice(0, 3);
    const topExpenses = [...tools, ...platforms].sort((a, b) => b.value - a.value).slice(0, 3);

    const getStatusColor = () => {
        switch(healthStatus) {
            case 'excellent': return 'bg-emerald-500';
            case 'good': return 'bg-blue-500';
            case 'warning': return 'bg-yellow-500';
            case 'critical': return 'bg-red-500';
        }
    };

    const getStatusText = () => {
        switch(healthStatus) {
            case 'excellent': return 'Excelente';
            case 'good': return 'Saudável';
            case 'warning': return 'Atenção';
            case 'critical': return 'Crítico';
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-400 font-bold">Carregando dados financeiros...</div>;
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight flex items-center gap-2">
                        <PieChart className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
                        Balance
                    </h2>
                    <p className="text-gray-600 font-medium mt-0.5 text-sm md:text-base">Diagnóstico operacional e saúde financeira.</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-white font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg ${getStatusColor()}`}>
                    <Activity size={16} />
                    Status: {getStatusText()}
                </div>
            </div>

            {/* --- HERO: PROFIT DISPLAY --- */}
            <div className={`rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${
                healthStatus === 'critical' ? 'bg-gradient-to-br from-red-600 to-red-900' : 
                healthStatus === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                'bg-black'
            }`}>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div>
                        <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-1">Lucro Líquido Estimado</p>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tighter">
                            {formatCurrency(netProfit)}
                        </h3>
                        <div className="mt-3 inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                            <span className={`text-sm font-bold ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {margin.toFixed(1)}% de Margem
                            </span>
                            <span className="text-white/40 text-xs">Operacional</span>
                        </div>
                    </div>
                    
                    {/* Visual Bar Graph */}
                    <div className="w-full md:w-64 space-y-3 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                        <div className="flex justify-between text-xs font-bold text-white/80">
                            <span>Receita</span>
                            <span>{formatCurrency(totalRevenue)}</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        
                        <div className="flex justify-between text-xs font-bold text-white/80 mt-2">
                            <span>Despesas</span>
                            <span>{formatCurrency(totalExpenses)}</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((totalExpenses / totalRevenue) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Decorative Background */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* --- METRIC CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue */}
                <div className="bg-white p-5 rounded-2xl shadow-apple border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpRight size={40} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Wallet size={20} />
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Receita Total</span>
                    </div>
                    <p className="text-2xl font-black text-black">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs font-medium text-gray-400 mt-1">{projects.length} Contratos Ativos</p>
                </div>

                {/* Fixed Costs */}
                <div className="bg-white p-5 rounded-2xl shadow-apple border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowDownRight size={40} className="text-red-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Custo Fixo</span>
                    </div>
                    <p className="text-2xl font-black text-black">{formatCurrency(totalExpenses)}</p>
                    <p className="text-xs font-medium text-gray-400 mt-1">{tools.length + platforms.length} Recorrências Mensais</p>
                </div>

                 {/* Average Ticket */}
                 <div className="bg-white p-5 rounded-2xl shadow-apple border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target size={40} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wide">Ticket Médio</span>
                    </div>
                    <p className="text-2xl font-black text-black">{formatCurrency(avgProjectValue)}</p>
                    <p className="text-xs font-medium text-gray-400 mt-1">Por cliente</p>
                </div>
            </div>

            {/* --- INTELLIGENT ACTION PLAN --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Action Plan Text */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-float border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                        <Lightbulb className="text-yellow-500 fill-yellow-500" size={20} />
                        <h3 className="font-black text-black uppercase tracking-wide text-sm">Plano de Ação Inteligente</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {healthStatus === 'critical' && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 items-start">
                                <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="font-bold text-red-700 text-sm">Ação Imediata Necessária</h4>
                                    <p className="text-xs text-red-600 mt-1 leading-relaxed">
                                        A operação está deficitária ou com margem perigosamente baixa. 
                                        Recomenda-se auditar e cortar ferramentas não essenciais imediatamente. 
                                        Considere renegociar os contratos de menor valor listados abaixo.
                                    </p>
                                </div>
                            </div>
                        )}
                        {healthStatus === 'warning' && (
                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex gap-3 items-start">
                                <Activity className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="font-bold text-yellow-700 text-sm">Otimização de Margem</h4>
                                    <p className="text-xs text-yellow-600 mt-1 leading-relaxed">
                                        A operação é sustentável, mas qualquer imprevisto pode gerar prejuízo.
                                        Foque em aumentar o ticket médio dos clientes atuais (Upsell) antes de buscar novos clientes que gerem mais custo operacional.
                                    </p>
                                </div>
                            </div>
                        )}
                         {healthStatus === 'excellent' && (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 items-start">
                                <Target className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="font-bold text-emerald-700 text-sm">Expansão e Reservas</h4>
                                    <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                                        Excelente saúde financeira. É o momento ideal para criar um fundo de reserva de emergência (3-6 meses de custo fixo) 
                                        ou investir em automação para escalar sem aumentar custos proporcionalmente.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div>
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Contratos Abaixo da Média</h5>
                                <ul className="space-y-2">
                                    {lowestProjects.map(p => (
                                        <li key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-xs border border-gray-100">
                                            <span className="font-bold truncate max-w-[120px]">{p.nome}</span>
                                            <span className="text-red-500 font-bold">{formatCurrency(p.valorContrato)}</span>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                             <div>
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Maiores Custos</h5>
                                <ul className="space-y-2">
                                    {topExpenses.map(e => (
                                        <li key={e.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-xs border border-gray-100">
                                            <span className="font-bold truncate max-w-[120px]">{e.name}</span>
                                            <span className="text-gray-600 font-bold">{formatCurrency(e.value)}</span>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 2. Visual Breakdown */}
                <div className="bg-white rounded-2xl p-6 shadow-apple border border-gray-200 flex flex-col justify-between">
                     <div>
                        <h3 className="font-black text-black uppercase tracking-wide text-sm mb-6 flex items-center gap-2">
                            <TrendingDown size={18} /> Composição de Custos
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>Ferramentas IA</span>
                                    <span>{((totalToolsCost / totalExpenses) * 100 || 0).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${(totalToolsCost / totalExpenses) * 100}%` }}></div>
                                </div>
                                <p className="text-right text-xs font-bold text-gray-400 mt-1">{formatCurrency(totalToolsCost)}</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>Plataformas & Repasses</span>
                                    <span>{((totalPlatformsCost / totalExpenses) * 100 || 0).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full" style={{ width: `${(totalPlatformsCost / totalExpenses) * 100}%` }}></div>
                                </div>
                                <p className="text-right text-xs font-bold text-gray-400 mt-1">{formatCurrency(totalPlatformsCost)}</p>
                            </div>
                        </div>
                     </div>

                     <div className="bg-gray-50 rounded-xl p-4 mt-6 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <ArrowRight size={14} />
                            <span className="text-[10px] font-bold uppercase">Break-even Point</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-tight">
                            Você precisa de <strong>{formatCurrency(totalExpenses)}</strong> apenas para cobrir custos.
                            Tudo acima disso é lucro.
                        </p>
                     </div>
                </div>

            </div>
        </div>
    );
};
