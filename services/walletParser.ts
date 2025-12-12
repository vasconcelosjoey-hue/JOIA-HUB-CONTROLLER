
import { getBrasiliaDate } from './utils';
import { WalletEntry } from '../types';

export type CommandType = 'TRANSACTION' | 'PIX_KEY' | 'UNKNOWN';

export interface ParsedTransaction {
    intent: 'INFLOW' | 'OUTFLOW';
    amount: number;
    description: string;
    category: string;
    date: string; // ISO String
}

export interface ParsedPixKey {
    name: string;
    key: string;
}

export interface ParseResult {
    type: CommandType;
    data?: ParsedTransaction | ParsedPixKey;
    error?: string;
}

// --- KEYWORDS ---
const KEYWORDS = {
    INFLOW: ['entrada', 'ganho', 'recebi', 'deposito', 'venda', 'lucro'],
    OUTFLOW: ['saida', 'gasto', 'paguei', 'compra', 'pagamento', 'despesa', 'uber', 'ifood', 'assinatura'],
    PIX: ['pix', 'chave']
};

export const parseWalletCommand = (command: string): ParseResult => {
    const cleanCmd = command.trim();
    const lowerCmd = cleanCmd.toLowerCase();

    if (!cleanCmd) return { type: 'UNKNOWN', error: 'Comando vazio.' };

    // 1. Detect Intent
    let intent: 'INFLOW' | 'OUTFLOW' | 'PIX_SAVE' | null = null;

    if (KEYWORDS.INFLOW.some(k => lowerCmd.startsWith(k))) intent = 'INFLOW';
    else if (KEYWORDS.OUTFLOW.some(k => lowerCmd.startsWith(k))) intent = 'OUTFLOW';
    else if (KEYWORDS.PIX.some(k => lowerCmd.startsWith(k))) {
        // Pix is special. Check if it has a value later.
        // If it has value -> Outflow (Transfer). If not -> Save Key.
        intent = 'PIX_SAVE'; // Provisional
    }

    // 2. Extract Value (Supports: 5000, 5000.00, 5.000,00, R$ 500)
    // Regex looks for numbers that might have dots as thousand separators or commas as decimals
    const valueMatch = cleanCmd.match(/R?\$?\s?(\d{1,3}(\.?\d{3})*(\,\d{1,2})?|\d+(\.\d{1,2})?)/);
    let amount = 0;

    if (valueMatch) {
        // Normalize to JS Float (remove dots, replace comma with dot)
        let valStr = valueMatch[1];
        if (valStr.includes(',') && valStr.includes('.')) {
            valStr = valStr.replace(/\./g, '').replace(',', '.');
        } else if (valStr.includes(',')) {
            valStr = valStr.replace(',', '.');
        }
        amount = parseFloat(valStr);
    }

    // 3. Logic Branching

    // CASE A: PIX (Ambiguous)
    if (intent === 'PIX_SAVE') {
        if (amount > 0) {
            intent = 'OUTFLOW'; // It's a payment
        } else {
            // It's likely a Key Save: "Pix Joey 123456"
            // Remove "Pix" keyword
            const raw = cleanCmd.replace(/^(pix|chave|chave pix)\s*/i, '').trim();
            const parts = raw.split(' ');
            
            if (parts.length < 2) {
                return { type: 'UNKNOWN', error: 'Formato de Pix inválido. Use: "Pix [Nome] [Chave]"' };
            }

            const key = parts.pop() || ''; // Last part is usually the key
            const name = parts.join(' ');

            return {
                type: 'PIX_KEY',
                data: { name, key } as ParsedPixKey
            };
        }
    }

    // CASE B: TRANSACTION (Inflow/Outflow)
    if (intent === 'INFLOW' || intent === 'OUTFLOW') {
        if (amount <= 0) {
            return { type: 'UNKNOWN', error: 'Valor não identificado ou inválido.' };
        }

        // Extract Description & Category
        // Remove the value string from the command
        let restOfText = cleanCmd.replace(valueMatch![0], '');
        
        // Remove the intent keyword (first word usually)
        const firstWord = restOfText.trim().split(' ')[0];
        const allKeywords = [...KEYWORDS.INFLOW, ...KEYWORDS.OUTFLOW, ...KEYWORDS.PIX];
        
        if (allKeywords.some(k => firstWord.toLowerCase().startsWith(k))) {
            restOfText = restOfText.replace(new RegExp(`^${firstWord}\\s*`, 'i'), '');
        }

        // Check for Category syntax " em [Category]"
        let category = intent === 'INFLOW' ? 'Entradas' : 'Geral';
        let description = restOfText.trim();

        if (lowerCmd.includes(' em ')) {
            const parts = description.split(/\s+em\s+/i);
            if (parts.length > 1) {
                description = parts[0].trim();
                const catRaw = parts[1].trim();
                category = catRaw.charAt(0).toUpperCase() + catRaw.slice(1);
            }
        } else if (intent === 'OUTFLOW') {
             // Auto-categorize based on keywords if no explicit category
             if (lowerCmd.includes('uber') || lowerCmd.includes('99')) category = 'Transporte';
             if (lowerCmd.includes('ifood') || lowerCmd.includes('mercado')) category = 'Alimentação';
             if (lowerCmd.includes('netflix') || lowerCmd.includes('spotify')) category = 'Lazer';
        }

        if (!description) description = intent === 'INFLOW' ? 'Nova Entrada' : 'Nova Despesa';

        return {
            type: 'TRANSACTION',
            data: {
                intent,
                amount,
                description,
                category,
                date: getBrasiliaDate().toISOString()
            } as ParsedTransaction
        };
    }

    return { type: 'UNKNOWN', error: 'Comando não reconhecido. Tente: "Entrada 500 Venda", "Saida 20 Uber"...' };
};
