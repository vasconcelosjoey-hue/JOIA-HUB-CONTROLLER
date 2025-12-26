
// --- CORE IDENTIFIERS ---
export type UserId = string;
export type ProjectId = string;

// --- BASE ENTITY (Standardized) ---
export interface BaseEntity {
    id: string;
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

// --- 2. PARTNERSHIPS DOMAIN ---
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

// --- 3. AI TOOLS DOMAIN ---
export interface AITool extends BaseEntity {
    name: string;
    description?: string;
    category?: string; // Added category for charts
    value: number;
    dueDate: number;
    renovationCycle: 'MONTHLY' | 'YEARLY';
    owner?: string; // Changed from enum to string for dynamic support
    linkedProjectId?: string; // Optional link to a project or partnership
}

// --- 4. PLATFORMS DOMAIN ---
export interface Platform extends BaseEntity {
    name: string;
    description?: string;
    category?: string; // Added category for charts
    client: string; // Legacy field, now preferred linkedProjectId
    value: number;
    dueDate: number;
    owner?: string; // Changed from enum to string for dynamic support
    linkedProjectId?: string; // Optional link to a project or partnership
}

// --- 5. EXPENSES DOMAIN ---
export interface Expense extends BaseEntity {
    category: string;
    description: string;
    value: number;
    timestamp: string; // ISO Full date and time
}

// --- 6. NOTIFICATIONS & ALERTS ---
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
