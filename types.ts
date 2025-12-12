
// --- CORE IDENTIFIERS ---
export type UserId = string;
export type WalletId = string;
export type ProjectId = string;

// --- BASE ENTITY (Security & Audit) ---
export interface BaseEntity {
    id: string;
    ownerId: UserId; // Security: Partition data by user/org
    createdAt: string; // ISO Date
    updatedAt?: string; // ISO Date
}

// --- 1. PROJECTS DOMAIN ---
export type ProjectStatus = "EM FUNCIONAMENTO" | "EM TREINAMENTO" | "EM APROVAÇÃO" | "STAND BY";

export interface Project extends BaseEntity {
    nome: string;
    cnpj: string;
    status: ProjectStatus;
    dataStart: string;
    diaMensalidade: number;
    supervisorName: string;
    supervisorContact: string;
    valorContrato: number;
    // Branding
    address?: string;
    logo?: string;
    brandColor?: string;
    website?: string;
}

// --- 2. WALLET DOMAIN ---
export interface WalletProfile extends BaseEntity {
    name: string;
    pin: string; // Hashed ideally
    balance: number; // Current calculated balance
    currency: 'BRL';
    // Settings can be a map
    settings?: {
        allowOverdraft: boolean;
        theme: 'light' | 'dark';
    };
}

// --- 3. WALLET ENTRIES (SUB-COLLECTION: wallets/{id}/entries) ---
// This enables infinite scroll history and audit trails
export type EntryType = 'INFLOW' | 'OUTFLOW';
export type EntryStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface WalletEntry extends BaseEntity {
    walletId: WalletId;
    type: EntryType;
    amount: number;
    description: string;
    category: string; // "Fixa", "Variável", "Lazer"
    date: string; // YYYY-MM-DD for sorting
    status: EntryStatus;
    tags?: string[];
}

// --- 4. PARTNERSHIPS DOMAIN ---
export interface Partner {
    id: string;
    name: string;
    value: number;
}

export interface PartnershipCard extends BaseEntity {
    companyName: string;
    totalValue: number;
    dueDay: number;
    partners: Partner[];
}

// --- 5. AI TOOLS DOMAIN ---
export interface AITool extends BaseEntity {
    name: string;
    value: number;
    dueDate: number;
    renovationCycle: 'MONTHLY' | 'YEARLY';
}

// --- 6. PLATFORMS DOMAIN ---
export interface Platform extends BaseEntity {
    name: string;
    client: string; // Associated Client/Project Name
    value: number;
    dueDate: number;
}

// --- 7. NOTIFICATIONS & ALERTS ---
export interface Notification extends BaseEntity {
    type: 'ALERT' | 'INFO' | 'SUCCESS';
    title: string;
    message: string;
    read: boolean;
    relatedEntityId?: string;
}

export interface DashboardAlert {
    id: string;
    title: string;
    message: string;
    value: number;
    level: 'red' | 'yellow';
    source: string;
}

// --- LEGACY/UI TYPES ---
export interface MeetingDraft {
  projectId: string;
  title: string;
  date: string; 
  time: string; 
  duration: number;
  participants: string;
  description: string;
}
