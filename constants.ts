

// Constants for the System

// In a real app, this comes from Firebase Auth Context
// For this version, we use a fixed ID to satisfy the "ownerId" requirement for the Data Model
export const DEFAULT_OWNER_ID = "admin_workspace_v1";

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
