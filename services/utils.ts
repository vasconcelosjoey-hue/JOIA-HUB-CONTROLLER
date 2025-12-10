export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'EM FUNCIONAMENTO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'EM TREINAMENTO': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'EM APROVAÇÃO': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'STAND BY': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600';
  }
};

// --- Timezone Logic (Brasília UTC-3) ---

export const getBrasiliaDate = (): Date => {
    // Cria uma data baseada na string de localidade forçada para SP
    const now = new Date();
    const brasiliaString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    return new Date(brasiliaString);
};

export const getTodayDay = () => getBrasiliaDate().getDate();

// Retorna o estado do alerta baseado no dia de vencimento (recorrência mensal)
export const getAlertLevel = (dueDay: number): 'red' | 'yellow' | null => {
    const today = getBrasiliaDate();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Data de vencimento neste mês
    const dueDateThisMonth = new Date(currentYear, currentMonth, dueDay);
    
    // Tratamento para fim de mês (ex: dia 31 em mês de 30 dias)
    // Se o dia ajustado for diferente do dueDay, significa que o mês não tem esse dia
    // Nesse caso, assumimos o último dia do mês como vencimento
    if (dueDateThisMonth.getDate() !== dueDay) {
         dueDateThisMonth.setDate(0); // Último dia do mês anterior (ajuste automático do Date)
    }

    // Comparação simples de dias
    if (currentDay === dueDay) return 'red';

    // Checagem de "Amanhã" (Yellow)
    // Cria data de amanhã
    const tomorrow = new Date(today);
    tomorrow.setDate(currentDay + 1);
    
    if (tomorrow.getDate() === dueDay) return 'yellow';

    return null;
};

export const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export const isUpcoming = (day: number) => {
    // Deprecated in favor of getAlertLevel, but kept for compatibility if needed
    const level = getAlertLevel(day);
    return level !== null;
};

// Function to extract dominant color from an image URL/Base64
export const extractDominantColor = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve('#000000');

            // Resize to small size for faster processing
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            const imageData = ctx.getImageData(0, 0, 50, 50).data;
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < imageData.length; i += 4) {
                const alpha = imageData[i + 3];
                if (alpha < 128) continue; // Skip transparent pixels

                const cr = imageData[i];
                const cg = imageData[i + 1];
                const cb = imageData[i + 2];

                // Filter out nearly white and nearly black pixels to find the "Color"
                const brightness = (cr + cg + cb) / 3;
                if (brightness > 230 || brightness < 20) continue;

                r += cr;
                g += cg;
                b += cb;
                count++;
            }

            if (count === 0) {
                resolve('#000000'); 
                return;
            }

            const finalR = Math.round(r / count);
            const finalG = Math.round(g / count);
            const finalB = Math.round(b / count);

            const toHex = (c: number) => {
                const hex = c.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };

            resolve(`#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`);
        };

        img.onerror = () => {
            resolve('#000000');
        };
    });
};