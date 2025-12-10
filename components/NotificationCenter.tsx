import React, { useEffect, useState } from 'react';
import { X, AlertCircle, AlertTriangle, Bell, Calendar } from 'lucide-react';
import { formatCurrency } from '../services/utils';

export interface AlertItem {
    id: string;
    title: string;
    message: string;
    value: number;
    level: 'red' | 'yellow';
    source: string;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: AlertItem[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, alerts }) => {
    const [visibleToasts, setVisibleToasts] = useState<AlertItem[]>([]);

    // Ao montar ou receber novos alertas, mostra os toasts por um tempo limitado
    useEffect(() => {
        if (alerts.length > 0) {
            // Mostra apenas os 2 mais urgentes como toast para não poluir
            const urgentAlerts = alerts.slice(0, 2);
            setVisibleToasts(urgentAlerts);

            // Auto-dismiss dos toasts após 5 segundos
            const timer = setTimeout(() => {
                setVisibleToasts([]);
            }, 6000);

            return () => clearTimeout(timer);
        }
    }, [alerts.length]); // Re-run apenas se a quantidade mudar significativamente

    const removeToast = (id: string) => {
        setVisibleToasts(prev => prev.filter(t => t.id !== id));
    };

    // --- RENDER TOASTS (Overlay Temporário) ---
    // Aparece no topo, centralizado no mobile, direita no desktop
    const renderToasts = () => (
        <div className="fixed top-4 left-0 w-full flex flex-col items-center pointer-events-none z-[100] px-4 gap-2 sm:items-end sm:right-4 sm:left-auto sm:w-auto">
            {visibleToasts.map((alert) => (
                <div 
                    key={`toast-${alert.id}`}
                    className={`pointer-events-auto w-full max-w-sm rounded-2xl p-4 shadow-float border flex items-start gap-3 animate-in slide-in-from-top-5 duration-500 ${
                        alert.level === 'red' 
                        ? 'bg-red-500/95 border-red-600 text-white backdrop-blur-md' 
                        : 'bg-yellow-400/95 border-yellow-500 text-black backdrop-blur-md'
                    }`}
                >
                     <div className={`p-1.5 rounded-full shrink-0 ${alert.level === 'red' ? 'bg-white/20 text-white' : 'bg-white/40 text-black'}`}>
                        {alert.level === 'red' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide mb-0.5">
                            {alert.level === 'red' ? 'Vence Hoje' : 'Vence Amanhã'}
                        </p>
                        <p className="text-sm font-bold truncate">{alert.title}</p>
                        <p className={`text-xs mt-1 ${alert.level === 'red' ? 'text-white/80' : 'text-black/70'}`}>
                            {alert.message}
                        </p>
                    </div>
                    <button onClick={() => removeToast(alert.id)} className="opacity-70 hover:opacity-100 p-1">
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );

    // --- RENDER MODAL (Lista Completa) ---
    // Aberto pelo botão de sino no Hub
    const renderModal = () => {
        if (!isOpen) return null;

        const redAlerts = alerts.filter(a => a.level === 'red');
        const yellowAlerts = alerts.filter(a => a.level === 'yellow');
        const sortedAlerts = [...redAlerts, ...yellowAlerts];

        return (
            <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-[2rem]">
                        <div className="flex items-center gap-3">
                            <div className="bg-black text-white p-2.5 rounded-xl">
                                <Bell size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-black">Notificações</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{alerts.length} Alertas Ativos</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors">
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {sortedAlerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                                <Bell size={48} strokeWidth={1} className="mb-2 opacity-20" />
                                <p className="font-bold text-sm">Tudo tranquilo por aqui.</p>
                            </div>
                        ) : (
                            sortedAlerts.map(alert => (
                                <div 
                                    key={alert.id} 
                                    className={`relative p-4 rounded-2xl border-l-4 shadow-sm flex items-start gap-4 transition-transform active:scale-[0.98] ${
                                        alert.level === 'red' 
                                        ? 'bg-red-50 border-red-500' 
                                        : 'bg-yellow-50 border-yellow-400'
                                    }`}
                                >
                                    <div className={`p-2 rounded-full shrink-0 mt-1 ${alert.level === 'red' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 inline-block ${alert.level === 'red' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                                {alert.level === 'red' ? 'VENCE HOJE' : 'AMANHÃ'}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">{alert.source}</span>
                                        </div>
                                        <h4 className="font-black text-gray-800 text-lg leading-tight">{alert.title}</h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-gray-500 font-medium line-clamp-1">{alert.message}</p>
                                            <p className="font-black text-black text-base">{formatCurrency(alert.value)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[2rem] sm:rounded-b-[2rem]">
                        <button onClick={onClose} className="w-full py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-100">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {renderToasts()}
            {renderModal()}
        </>
    );
};