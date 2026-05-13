import { v4 as uuid } from 'uuid';
import { eq, asc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';
import type { Supplier } from '@shared/types.js';
import {
  SupplierCreateSchema,
  SupplierUpdateSchema,
  type SupplierCreateInput,
  type SupplierUpdateInput,
} from '@shared/ipc-contract.js';
import { writeAudit } from './audit.js';

export function listSuppliers(): Supplier[] {
  const db = getDb();
  return db
    .select()
    .from(schema.suppliers)
    .orderBy(asc(schema.suppliers.name))
    .all()
    .map(toSupplier);
}

export function createSupplier(input: SupplierCreateInput): Supplier {
  const parsed = SupplierCreateSchema.parse(input);
  const db = getDb();
  const now = new Date().toISOString();
  const id = uuid();
  const normalised = normalise(parsed.name);

  // Reject duplicates on normalised name.
  const existing = db
    .select()
    .from(schema.suppliers)
    .where(eq(schema.suppliers.normalisedName, normalised))
    .all();
  if (existing.length > 0) {
    throw new Error(`A supplier matching "${parsed.name}" already exists`);
  }

  db.insert(schema.suppliers)
    .values({
      id,
      name: parsed.name,
      normalisedName: normalised,
      domain: parsed.domain ?? null,
      defaultEntityId: parsed.defaultEntityId ?? null,
      defaultCategoryId: parsed.defaultCategoryId ?? null,
      icon: parsed.icon ?? null,
      colour: parsed.colour ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  writeAudit('supplier', id, 'created', null, JSON.stringify(parsed));

  const created = db
    .select()
    .from(schema.suppliers)
    .where(eq(schema.suppliers.id, id))
    .get();
  if (!created) throw new Error('Supplier vanished after insert');
  return toSupplier(created);
}

export function updateSupplier(input: SupplierUpdateInput): Supplier {
  const parsed = SupplierUpdateSchema.parse(input);
  const db = getDb();
  const now = new Date().toISOString();

  const current = db
    .select()
    .from(schema.suppliers)
    .where(eq(schema.suppliers.id, parsed.id))
    .get();
  if (!current) throw new Error('Supplier not found');

  const updates: Partial<typeof schema.suppliers.$inferInsert> = { updatedAt: now };
  if (parsed.name !== undefined) {
    updates.name = parsed.name;
    updates.normalisedName = normalise(parsed.name);
  }
  if (parsed.domain !== undefined) updates.domain = parsed.domain;
  if (parsed.defaultEntityId !== undefined) updates.defaultEntityId = parsed.defaultEntityId;
  if (parsed.defaultCategoryId !== undefined)
    updates.defaultCategoryId = parsed.defaultCategoryId;
  if (parsed.colour !== undefined) updates.colour = parsed.colour;
  if (parsed.icon !== undefined) updates.icon = parsed.icon;

  db.update(schema.suppliers)
    .set(updates)
    .where(eq(schema.suppliers.id, parsed.id))
    .run();
  writeAudit('supplier', parsed.id, 'updated', JSON.stringify(current), JSON.stringify(updates));

  const after = db
    .select()
    .from(schema.suppliers)
    .where(eq(schema.suppliers.id, parsed.id))
    .get();
  if (!after) throw new Error('Supplier vanished after update');
  return toSupplier(after);
}

export function archiveSupplier(id: string): { id: string } {
  // Suppliers don't have an isArchived column yet. Until we add that
  // properly, "archiving" a supplier simply deletes it. We refuse to
  // delete if any bills reference it.
  const db = getDb();
  const inUse = db
    .select({ id: schema.bills.id })
    .from(schema.bills)
    .where(eq(schema.bills.supplierId, id))
    .limit(1)
    .all();
  if (inUse.length > 0) {
    throw new Error(
      'Cannot remove: this supplier is still attached to one or more bills.',
    );
  }
  db.delete(schema.suppliers).where(eq(schema.suppliers.id, id)).run();
  writeAudit('supplier', id, 'deleted', null, null);
  return { id };
}

/**
 * Normalise a supplier name for duplicate detection. Lowercase, strip
 * punctuation, collapse whitespace, drop common business suffixes.
 */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(pty|ltd|limited|inc|corp|corporation|co|llc|gmbh|ag)\b\.?/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSupplier(r: typeof schema.suppliers.$inferSelect): Supplier {
  return {
    id: r.id,
    name: r.name,
    normalisedName: r.normalisedName,
    domain: r.domain,
    defaultEntityId: r.defaultEntityId,
    defaultCategoryId: r.defaultCategoryId,
    icon: r.icon,
    colour: r.colour,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
