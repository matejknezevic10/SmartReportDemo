
export enum ReportType {
  DAMAGE = 'DAMAGE',
  INSPECTION = 'INSPECTION',
  OFFER = 'OFFER'
}

export enum UserRole {
  TECHNICIAN = 'TECHNICIAN',
  MANAGER = 'MANAGER'
}

export interface Company {
  id: string;
  workspaceKey: string; // Eindeutiger Zugangsschlüssel (z.B. "saneo-nord")
  name: string;
  logo?: string; // Base64
  primaryColor?: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  avatar?: string;
}

export interface ReportImage {
  data: string; // Base64
  mimeType: string;
}

export interface Report {
  id: string;
  companyId: string;
  type: ReportType;
  title: string;
  customer: string;
  content: string;
  date: string;
  status: 'Draft' | 'Sent' | 'Completed';
  images?: ReportImage[];
  createdById: string; 
  createdByName: string;
  isOfflineDraft?: boolean;
  rawInput?: GenerationInput;
}

export interface Template {
  id: string;
  companyId: string;
  type: ReportType;
  name: string;
  structure: string;
  description: string;
  category?: string;
}

export interface GenerationInput {
  type: ReportType;
  keywords: string;
  customerName: string;
  additionalInfo?: string;
  images: ReportImage[];
  companyName?: string;
}
