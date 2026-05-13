/**
 * Database schema (SQLite via Drizzle).
 *
 * Conventions:
 *  - IDs are TEXT (UUID v4) for stable references across exports/imports.
 *  - Timestamps are TEXT (ISO 8601) for human-readable DB inspection.
 *  - Money is stored as INTEGER (cents) to avoid float drift.
 *  - "Encrypted" columns hold base64 ciphertext from electron/lib/crypto.ts.
 *
 * Run `npm run db:generate` after editing this file to produce a migration.
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// ---- Entities (Personal / Investment / Business / ...) ----

export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['personal', 'investment', 'business', 'other'] }).notNull(),
  colour: text('colour').notNull().default('#737373'),
  icon: text('icon').notNull().default('Home'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ---- Categories ----

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    parentCategoryId: text('parent_category_id'),
    colour: text('colour').notNull().default('#737373'),
    icon: text('icon').notNull().default('Tag'),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    parentIdx: index('categories_parent_idx').on(t.parentCategoryId),
  }),
);

// ---- Suppliers ----

export const suppliers = sqliteTable(
  'suppliers',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    normalisedName: text('normalised_name').notNull(),
    domain: text('domain'),
    defaultEntityId: text('default_entity_id'),
    defaultCategoryId: text('default_category_id'),
    icon: text('icon'),
    colour: text('colour'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    normalisedIdx: index('suppliers_normalised_idx').on(t.normalisedName),
    domainIdx: index('suppliers_domain_idx').on(t.domain),
  }),
);

// ---- Bills ----

export const bills = sqliteTable(
  'bills',
  {
    id: text('id').primaryKey(),
    supplierId: text('supplier_id'),
    entityId: text('entity_id').notNull(),
    categoryId: text('category_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    // amount stored in cents. amountEnc holds an encrypted copy of the
    // dollar string for at-rest protection. We keep both so the DB is
    // still queryable for sums while the encrypted column protects
    // disclosure if the file is leaked.
    amountCents: integer('amount_cents').notNull(),
    amountEnc: text('amount_enc'),
    currency: text('currency').notNull().default('AUD'),
    dueDate: text('due_date'),
    issueDate: text('issue_date'),
    receivedDate: text('received_date'),
    scheduledPaymentDate: text('scheduled_payment_date'),
    paidDate: text('paid_date'),
    paymentType: text('payment_type', {
      enum: ['auto', 'manual', 'scheduled', 'unknown'],
    })
      .notNull()
      .default('unknown'),
    paymentStatus: text('payment_status', {
      enum: [
        'unpaid',
        'scheduled',
        'paid',
        'overdue',
        'cancelled',
        'disputed',
        'awaiting_confirmation',
        'informational',
      ],
    })
      .notNull()
      .default('unpaid'),
    confidenceScore: real('confidence_score').notNull().default(1.0),
    sourceType: text('source_type', { enum: ['manual', 'gmail', 'pdf', 'import'] })
      .notNull()
      .default('manual'),
    sourceEmailId: text('source_email_id'),
    sourceAttachmentId: text('source_attachment_id'),
    isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
    recurrencePattern: text('recurrence_pattern'),
    bpayBillerCode: text('bpay_biller_code'),
    bpayReference: text('bpay_reference'),
    gstAmountCents: integer('gst_amount_cents'),
    notesEnc: text('notes_enc'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    archivedAt: text('archived_at'),
  },
  (t) => ({
    dueIdx: index('bills_due_idx').on(t.dueDate),
    statusDueIdx: index('bills_status_due_idx').on(t.paymentStatus, t.dueDate),
    entityIdx: index('bills_entity_idx').on(t.entityId),
    categoryIdx: index('bills_category_idx').on(t.categoryId),
    supplierIdx: index('bills_supplier_idx').on(t.supplierId),
  }),
);

// ---- Email sources (Gmail message references) ----

export const emailSources = sqliteTable(
  'email_sources',
  {
    id: text('id').primaryKey(),
    gmailMessageId: text('gmail_message_id').notNull().unique(),
    gmailThreadId: text('gmail_thread_id'),
    subjectEnc: text('subject_enc'),
    fromEmail: text('from_email'),
    fromName: text('from_name'),
    receivedAt: text('received_at').notNull(),
    snippetEnc: text('snippet_enc'),
    classification: text('classification', {
      enum: [
        'new_bill',
        'reminder',
        'overdue',
        'receipt',
        'statement',
        'renewal',
        'non_bill',
        'uncertain',
      ],
    }).notNull(),
    confidenceScore: real('confidence_score').notNull().default(0),
    hasAttachment: integer('has_attachment', { mode: 'boolean' }).notNull().default(false),
    sourceUrl: text('source_url'),
    processedAt: text('processed_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    processedIdx: index('email_sources_processed_idx').on(t.processedAt),
  }),
);

// ---- Attachments ----

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  emailSourceId: text('email_source_id').notNull(),
  gmailAttachmentId: text('gmail_attachment_id'),
  filename: text('filename').notNull(),
  mimeType: text('mime_type'),
  extractedTextEnc: text('extracted_text_enc'),
  localPath: text('local_path'),
  createdAt: text('created_at').notNull(),
});

// ---- Payment events (timeline) ----

export const paymentEvents = sqliteTable(
  'payment_events',
  {
    id: text('id').primaryKey(),
    billId: text('bill_id').notNull(),
    eventType: text('event_type', {
      enum: [
        'bill_created',
        'reminder_received',
        'scheduled_payment_set',
        'marked_paid',
        'receipt_detected',
        'overdue_notice_received',
        'manually_updated',
        'duplicate_merged',
      ],
    }).notNull(),
    eventDate: text('event_date').notNull(),
    amountCents: integer('amount_cents'),
    notes: text('notes'),
    sourceEmailId: text('source_email_id'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    billDateIdx: index('payment_events_bill_date_idx').on(t.billId, t.eventDate),
  }),
);

// ---- Rules engine ----

export const rules = sqliteTable('rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  conditionType: text('condition_type').notNull(),
  conditionValue: text('condition_value').notNull(),
  actionType: text('action_type').notNull(),
  actionValue: text('action_value').notNull(),
  priority: integer('priority').notNull().default(100),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ---- Insights ----

export const insights = sqliteTable('insights', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity', { enum: ['info', 'suggestion', 'warning', 'critical'] }).notNull(),
  relatedBillId: text('related_bill_id'),
  relatedSupplierId: text('related_supplier_id'),
  relatedCategoryId: text('related_category_id'),
  relatedEntityId: text('related_entity_id'),
  generatedAt: text('generated_at').notNull(),
  dismissedAt: text('dismissed_at'),
});

// ---- Audit log ----

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  source: text('source').notNull(),
  createdAt: text('created_at').notNull(),
});

// ---- App settings (key/value) ----

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ---- Sync cursor (per-source, for resumable Gmail sync) ----

export const syncCursor = sqliteTable('sync_cursor', {
  source: text('source').primaryKey(), // e.g. 'gmail'
  cursorValue: text('cursor_value'),
  lastRunAt: text('last_run_at'),
  lastSuccessAt: text('last_success_at'),
  lastError: text('last_error'),
});
