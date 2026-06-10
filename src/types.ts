export type SystemType = 'workstation' | 'admin' | 'server';
export type CentreId = 'calicut' | 'cochin';
export type SystemStatus = 'operational' | 'maintenance' | 'fault' | 'away';

export const EXAM_LIST = ['CMA US', 'PEARSON VIEW', 'PSI', 'CELPIP', 'ITTS'] as const;
export type ExamName = typeof EXAM_LIST[number];

export interface CentreInfo {
  id: CentreId;
  name: string;
  code: string;
  /** ID prefix: Calicut (legacy, none) → W01/ADM/SRV, Cochin C → CW01/CADM/CSRV */
  prefix: string;
  accent: string;
  accentSoft: string;
}

export const CENTRES: CentreInfo[] = [
  { id: 'calicut', name: 'Calicut', code: 'CLT', prefix: '', accent: '#0B7B5E', accentSoft: '#E2F2ED' },
  { id: 'cochin', name: 'Cochin', code: 'COK', prefix: 'C', accent: '#2E45C8', accentSoft: '#E7EAFB' },
];

export const STATUS_META: Record<SystemStatus, { label: string; color: string }> = {
  operational: { label: 'Operational', color: '#0B9E6E' },
  maintenance: { label: 'Maintenance', color: '#D98E04' },
  fault: { label: 'Fault', color: '#D43A2F' },
  away: { label: 'Off-site', color: '#64748B' },
};

/** Issue & movement log */
export type LogKind = 'fault' | 'software' | 'maintenance' | 'transfer' | 'note';

export const LOG_KIND_META: Record<LogKind, { label: string; color: string; autoStatus?: SystemStatus }> = {
  fault: { label: 'Hardware Fault', color: '#D43A2F', autoStatus: 'fault' },
  software: { label: 'Software Issue', color: '#D98E04', autoStatus: 'maintenance' },
  maintenance: { label: 'Sent for Service', color: '#64748B', autoStatus: 'away' },
  transfer: { label: 'Centre Transfer', color: '#2E45C8' },
  note: { label: 'Note', color: '#0B7B5E' },
};

export interface SystemLog {
  at: string;
  kind: LogKind;
  text: string;
  resolved?: boolean;
}

export interface Workstation {
  id: string;
  name: string;
  type: SystemType;
  /** Missing on legacy documents — treat as 'calicut' */
  centre?: CentreId;
  status?: SystemStatus;
  notes?: string;
  os?: string;
  logs?: SystemLog[];
  brandCpu: string;
  brandMonitor: string;
  processor: string;
  ram: string;
  hdd: string;
  cameraAligned: string;
  exams: ExamName[];
  lastAuditAt: string;
}

export const centreOf = (ws: Workstation): CentreId => ws.centre ?? 'calicut';
export const statusOf = (ws: Workstation): SystemStatus => ws.status ?? 'operational';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
