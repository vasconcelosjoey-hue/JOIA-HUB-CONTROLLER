import React from 'react';
import { VENCIMENTOS } from '../constants';
import { isUpcoming, formatCurrency, getTodayDay } from '../services/utils';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { PartnershipCard } from '../types';

interface NotificationBannerProps {
    onClose: () => void;
    partnerships?: PartnershipCard[];
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onClose, partnerships = [] }) => {
    // Existing general tool alerts
    const upcomingGeneral = VENCIMENTOS.filter(v => isUpcoming(v.diaVencimento));
    
    // Partnership alerts logic
    const today = getTodayDay();
    const todayPartnerships = partnerships.filter(p => p.dueDay === today);
    const tomorrowPartnerships = partnerships.filter(p => p.dueDay === today + 1 || (today === 31 && p.dueDay === 1)); // Simplified rollover check

    // Render Logic
    
    // Priority 1: PAYMENT DUE TODAY (RED)
    if (todayPartnerships.length > 0) {
        return (
            <div className="fixed top-6 left-6 z-50 w-80 animate-in slide-in-from-left duration-700">
                <div className="bg-red-500/95 backdrop-blur-xl border border-red-600 shadow-float rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
                    {/* Pulsing effect for urgency */}
                    <div className="absolute inset-0 bg-red-400/20 animate-pulse"></div>
                    
                    <div className="bg-white text-red-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 z-10 shadow-sm">
                        <AlertCircle size={18} strokeWidth={3} />
                    </div>
                    <div className="flex-1 min-w-0 z-10">
                        <p className="text-xs font-black text-white uppercase tracking-wide mb-1 flex items-center gap-1">
                            PAGAMENTO HOJE
                        </p>
                        <p className="text-xs text-white/90 leading-relaxed font-medium">
                            {todayPartnerships[0].companyName} vence hoje.
                            <br/>
                            <span className="font-bold text-white bg-red-600 px-1 rounded">
                                {formatCurrency(todayPartnerships[0].totalValue)}
                            </span>
                        </p>
                        {todayPartnerships.length > 1 && (
                            <p className="text-[10px] text-white/70 mt-1 font-bold">+ {todayPartnerships.length - 1} outros vencendo</p>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors z-10"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Priority 2: DUE TOMORROW (YELLOW)
    if (tomorrowPartnerships.length > 0) {
        return (
            <div className="fixed top-6 left-6 z-50 w-80 animate-in slide-in-from-left duration-700">
                <div className="bg-yellow-400/95 backdrop-blur-xl border border-yellow-500 shadow-float rounded-2xl p-4 flex items-start gap-3">
                    <div className="bg-white text-yellow-500 w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <AlertTriangle size={18} strokeWidth={3} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-black uppercase tracking-wide mb-1">
                            Vence Amanhã
                        </p>
                        <p className="text-xs text-black/80 leading-relaxed font-medium">
                            Preparar pagamento de <span className="font-bold">{tomorrowPartnerships[0].companyName}</span>.
                        </p>
                        {tomorrowPartnerships.length > 1 && (
                            <p className="text-[10px] text-black/60 mt-1 font-bold">+ {tomorrowPartnerships.length - 1} outros amanhã</p>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-black/40 hover:text-black transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Priority 3: General Standard Alerts (White)
    if (upcomingGeneral.length > 0) {
        return (
            <div className="fixed top-6 left-6 z-50 w-80 animate-in slide-in-from-left duration-700">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-float rounded-2xl p-4 flex items-start gap-3">
                    <div className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="font-bold text-[10px]">{upcomingGeneral.length}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black uppercase tracking-wide mb-1">Atenção Necessária</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {upcomingGeneral[0].descricao} <span className="font-bold text-black">({formatCurrency(upcomingGeneral[0].valor)})</span> vence em breve.
                        </p>
                        {upcomingGeneral.length > 1 && (
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">+ {upcomingGeneral.length - 1} outros itens</p>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-black transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};