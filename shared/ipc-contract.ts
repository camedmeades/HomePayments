/**
 * IPC contract between renderer and main process.
 *
 * All channel names live here so we never typo them, and request/response
 * shapes are validated with Zod on both sides. The renderer calls these
 * via window.api.* (set up in electron/preload.ts).
 */

import { z } from 'zod';

// ---- Channel name registry ----

export const IPC = {
  health: 'app:health',
  entities: {
    list: 'entities:list',
    create: 'entities:create',
    update: 'entities:update',
    archive: 'entities:archive',
    restore: 'entities:restore',
  },
  categories: {
    list: 'categories:list',
    create: 'categories:create',
    update: 'categories:update',
    archive: 'categories:archive',
    restore: 'categories:restore',
    merge: 'categories:merge',
  },
  suppliers: {
    list: 'suppliers:list',
    create: 'suppliers:create',
    update: 'suppliers:update',
    archive: 'suppliers:archive',
  },
} as const;

// ---- Shared atoms ----

const idSchema = z.string().uuid();
const hexColour = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Colour must be a 6-digit hex like #2563eb');

// ---- Health ----

export const HealthReportSchema = z.object({
  appVersion: z.string(),
  dbPath: z.string(),
  dbSchemaVersion: z.number().int(),
  entityCount: z.number().int(),
  categoryCount: z.number().int(),
  encryptionAvailable: z.boolean(),
});

// ---- Entity ----

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['personal', 'investment', 'business', 'other']),
  colour: z.string(),
  icon: z.string(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EntityCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  type: z.enum(['personal', 'investment', 'business', 'other']),
  colour: hexColour,
  icon: z.string().min(1).max(50),
});

export const EntityUpdateSchema = EntityCreateSchema.partial().extend({
  id: idSchema,
});

// ---- Category ----

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentCategoryId: z.string().nullable(),
  colour: z.string(),
  icon: z.string(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  parentCategoryId: z.string().uuid().nullable().optional(),
  colour: hexColour,
  icon: z.string().min(1).max(50),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial().extend({
  id: idSchema,
});

export const CategoryMergeSchema = z.object({
  sourceId: idSchema,
  targetId: idSchema,
});

// ---- Supplier ----

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  normalisedName: z.string(),
  domain: z.string().nullable(),
  defaultEntityId: z.string().nullable(),
  defaultCategoryId: z.string().nullable(),
  icon: z.string().nullable(),
  colour: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SupplierCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  domain: z.string().trim().toLowerCase().max(100).nullable().optional(),
  defaultEntityId: z.string().uuid().nullable().optional(),
  defaultCategoryId: z.string().uuid().nullable().optional(),
  colour: hexColour.nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
});

export const SupplierUpdateSchema = SupplierCreateSchema.partial().extend({
  id: idSchema,
});

// ---- Inferred input types ----

export type EntityCreateInput = z.infer<typeof EntityCreateSchema>;
export type EntityUpdateInput = z.infer<typeof EntityUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;
export type SupplierCreateInput = z.infer<typeof SupplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof SupplierUpdateSchema>;
export type CategoryMergeInput = z.infer<typeof CategoryMergeSchema>;

// ---- API surface exposed on window.api ----

export interface BillcalApi {
  health: () => Promise<z.infer<typeof HealthReportSchema>>;
  entities: {
    list: () => Promise<z.infer<typeof EntitySchema>[]>;
    create: (input: EntityCreateInput) => Promise<z.infer<typeof EntitySchema>>;
    update: (input: EntityUpdateInput) => Promise<z.infer<typeof EntitySchema>>;
    archive: (id: string) => Promise<{ id: string }>;
    restore: (id: string) => Promise<{ id: string }>;
  };
  categories: {
    list: () => Promise<z.infer<typeof CategorySchema>[]>;
    create: (input: CategoryCreateInput) => Promise<z.infer<typeof CategorySchema>>;
    update: (input: CategoryUpdateInput) => Promise<z.infer<typeof CategorySchema>>;
    archive: (id: string) => Promise<{ id: string }>;
    restore: (id: string) => Promise<{ id: string }>;
    merge: (input: CategoryMergeInput) => Promise<{ mergedInto: string }>;
  };
  suppliers: {
    list: () => Promise<z.infer<typeof SupplierSchema>[]>;
    create: (input: SupplierCreateInput) => Promise<z.infer<typeof SupplierSchema>>;
    update: (input: SupplierUpdateInput) => Promise<z.infer<typeof SupplierSchema>>;
    archive: (id: string) => Promise<{ id: string }>;
  };
}

declare global {
  interface Window {
    api: BillcalApi;
  }
}
