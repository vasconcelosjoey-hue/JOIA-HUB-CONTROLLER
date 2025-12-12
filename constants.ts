
// Constants for the System

// Single Global ID for app-wide settings (e.g. Google Calendar Auth state)
export const GLOBAL_SETTINGS_ID = "global_app_settings";

export const DEFAULT_CURRENCY = "BRL";

export const PROJECT_STATUS_OPTIONS = [
    "EM FUNCIONAMENTO",
    "EM TREINAMENTO",
    "EM APROVAÇÃO",
    "STAND BY"
];

// Fallback/Legacy constant for general monthly bills if not in DB
export const VENCIMENTOS = [
    { descricao: "Servidores AWS", valor: 150.00, diaVencimento: 5 },
    { descricao: "Google Workspace", valor: 60.00, diaVencimento: 10 },
    { descricao: "Licenças Adobe", valor: 200.00, diaVencimento: 15 },
    { descricao: "Vercel Hosting", valor: 100.00, diaVencimento: 20 }
];
