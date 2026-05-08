export type SystemType = 'workstation' | 'admin' | 'server';

export const EXAM_LIST = ['CMA US', 'PEARSON VIEW', 'PSI', 'CELPIP', 'ITTS'] as const;
export type ExamName = typeof EXAM_LIST[number];

export interface Workstation {
  id: string;
  name: string;
  type: SystemType;
  brandCpu: string;
  brandMonitor: string;
  processor: string;
  ram: string;
  hdd: string;
  cameraAligned: string;
  exams: ExamName[];
  lastAuditAt: string;
}

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
