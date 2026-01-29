export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type ConsultationStatus = 
  | 'SCHEDULED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type PrescriptionStatus = 'ISSUED' | 'USED' | 'EXPIRED' | 'CANCELLED';

export type AnvisaStatus = 
  | 'PENDING' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'EXPIRED';

export type ImportStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'IN_TRANSIT' 
  | 'IN_CUSTOMS' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'PAID' 
  | 'FAILED' 
  | 'REFUNDED' 
  | 'CANCELLED';

export interface Pathology {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId?: string;
  scheduledAt: Date;
  status: ConsultationStatus;
  meetingLink?: string;
  anamnesis?: any;
  notes?: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  prescriptionData: any;
  pdfUrl?: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: PrescriptionStatus;
}
