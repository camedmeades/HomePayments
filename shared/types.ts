/**
 * Types shared between the Electron main process and the React renderer.
 * Keep this file free of runtime imports so it stays usable in both contexts.
 */

export type EntityType = 'personal' | 'investment' | 'business' | 'other';

export type Entity = {
  id: string;
  name: string;
  type: EntityType;
  colour: string; // hex
  icon: string; // lucide icon name
  isArchived: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  parentCategoryId: string | null;
  colour: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  normalisedName: string;
  domain: string | null;
  defaultEntityId: string | null;
  defaultCategoryId: string | null;
  icon: string | null;
  colour: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentType = 'auto' | 'manual' | 'scheduled' | 'unknown';

export type PaymentStatus =
  | 'unpaid'
  | 'scheduled'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'disputed'
  | 'awaiting_confirmation'
  | 'informational';

export type Bill = {
  id: string;
  supplierId: string | null;
  entityId: string;
  categoryId: string;
  title: string;
  description: string | null;
  amount: number; // AUD, stored as cents in DB but exposed as decimal here
  currency: 'AUD';
  dueDate: string | null; // ISO date
  issueDate: string | null;
  receivedDate: string | null;
  scheduledPaymentDate: string | null;
  paidDate: string | null;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  confidenceScore: number; // 0–1
  sourceType: 'manual' | 'gmail' | 'pdf' | 'import';
  sourceEmailId: string | null;
  sourceAttachmentId: string | null;
  isRecurring: boolean;
  recurrencePattern: string | null;
  bpayBillerCode: string | null;
  bpayReference: string | null;
  gstAmount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type HealthReport = {
  appVersion: string;
  dbPath: string;
  dbSchemaVersion: number;
  entityCount: number;
  categoryCount: number;
  encryptionAvailable: boolean;
};
