
import { useMemo } from 'react';
import { useFirestoreCollection } from './useFirestore';
import { getAlertLevel } from '../services/utils';
import { PartnershipCard, DashboardAlert, AITool, Platform } from '../types';

export function useNotifications() {
    // Fetch data from monitored collections
    const { data: partnerships } = useFirestoreCollection<PartnershipCard>('partnerships');
    const { data: aiTools } = useFirestoreCollection<AITool>('ai_tools');
    const { data: platforms } = useFirestoreCollection<Platform>('platforms');

    const alerts = useMemo(() => {
        const items: DashboardAlert[] = [];

        // 1. Check Partnerships (dueDay)
        partnerships.forEach(p => {
            const level = getAlertLevel(p.dueDay);
            if (level) {
                items.push({
                    id: `partner-${p.id}`,
                    title: p.companyName,
                    message: level === 'red' ? 'Pagamento vence hoje!' : 'Pagamento vence amanhã.',
                    value: p.totalValue,
                    level,
                    source: 'Parceria'
                });
            }
        });

        // 2. Check AI Tools (dueDate)
        aiTools.forEach(t => {
            const level = getAlertLevel(t.dueDate);
            if (level) {
                items.push({
                    id: `tool-${t.id}`,
                    title: t.name,
                    message: level === 'red' ? 'Renovação hoje.' : 'Renovação amanhã.',
                    value: t.value,
                    level,
                    source: 'AI Tool'
                });
            }
        });

        // 3. Check Platforms (dueDate)
        platforms.forEach(p => {
            const level = getAlertLevel(p.dueDate);
            if (level) {
                items.push({
                    id: `plat-${p.id}`,
                    title: p.name,
                    message: `Mensalidade: ${p.client}`,
                    value: p.value,
                    level,
                    source: 'Plataforma'
                });
            }
        });

        // Sort: RED priority, then highest Value
        return items.sort((a, b) => {
            if (a.level === 'red' && b.level !== 'red') return -1;
            if (a.level !== 'red' && b.level === 'red') return 1;
            return b.value - a.value;
        });

    }, [partnerships, aiTools, platforms]);

    return { 
        alerts, 
        hasRedAlerts: alerts.some(a => a.level === 'red'),
        count: alerts.length 
    };
}
