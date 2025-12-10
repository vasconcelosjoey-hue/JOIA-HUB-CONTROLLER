
export type User = "Joey" | "Joedge" | "Spencer";

export interface UserProfile {
    id: string;
    name: User;
    email: string;
    pin?: string; // Changed from faceHash to pin
    accessLevel: 'admin' | 'viewer';
}

export type ProjectStatus = "EM FUNCIONAMENTO" | "EM TREINAMENTO" | "EM APROVAÇÃO" | "STAND BY";

export interface Project {
  id: string;
  nome: string; // Nome do Cliente/Empresa
  cnpj: string;
  status: ProjectStatus;
  dataStart: string; // ISO Date (Início do Contrato)
  diaMensalidade: number;
  supervisorName: string;
  supervisorContact: string;
  observacoes?: string;
  valorContrato: number; 
  // New Fields
  address?: string;
  logo?: string; // URL or Base64
  brandColor?: string; // Hex code
  website?: string;
}

export interface RateioMensal {
  projetoId: string;
  valorMensalTotal: number;
  joeyMensal: number;
  joedgeMensal: number;
  spencerMensal: number;
}

export type VencimentoTipo = "IA" | "Tráfego" | "Plataforma" | "Site" | "Ferramenta";
export type VencimentoRenovacao = "Mensal" | "Trimestral" | "Anual";

export interface Vencimento {
  id: string;
  projetoId: string; // Can be 'GLOBAL' for general tools not tied to a specific project
  tipo: VencimentoTipo;
  descricao: string;
  valor: number;
  diaVencimento: number;
  renovacao: VencimentoRenovacao;
  responsavelPagamento: User | "Projeto";
}

export interface MeetingDraft {
  projectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  participants: string; // comma separated emails
  description: string;
}

export interface DashboardMetrics {
  totalMensalProjetos: number;
  respJoey: number;
  respJoedge: number;
  respSpencer: number;
}

// Partnership Types
export interface Partner {
    id: string;
    name: string;
    value: number;
}

export interface PartnershipCard {
    id: string;
    companyName: string;
    totalValue: number;
    partners: Partner[];
    dueDay: number;
}