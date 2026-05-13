import { v4 as uuid } from 'uuid';
import { eq, asc, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';
import type { Category } from '@shared/types.js';
import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
  CategoryMergeSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
  type CategoryMergeInput,
} from '@shared/ipc-contract.js';
import { writeAudit } from './audit.js';

export function listCategories(includeArchived = false): Category[] {
  const db = getDb();
  const rows = includeArchived
    ? db.select().from(schema.categories).orderBy(asc(schema.categories.name)).all()
    : db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.isArchived, false))
        .orderBy(asc(schema.categories.name))
        .all();
  return rows.map(toCategory);
}

export function createCategory(input: CategoryCreateInput): Category {
  const parsed = CategoryCreateSchema.parse(input);
  const db = getDb();
  const now = new Date().toISOString();
  const id = uuid();

  const existing = db
    .select()
    .from(schema.categories)
    .where(
      and(eq(schema.categories.isArchived, false), eq(schema.categories.name, parsed.name)),
    )
    .all();
  if (existing.length > 0) {
    throw new Error(`A category named "${parsed.name}" already exists`);
  }

  db.insert(schema.categories)
    .values({
      id,
      name: parsed.name,
      parentCategoryId: parsed.parentCategoryId ?? null,
      colour: parsed.colour,
      icon: parsed.icon,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  writeAudit('category', id, 'created', null, JSON.stringify(parsed));

  const created = db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, id))
    .get();
  if (!created) throw new Error('Category vanished after insert');
  return toCategory(created);
}

export function updateCategory(input: CategoryUpdateInput): Category {
  const parsed = CategoryUpdateSchema.parse(input);
  const db = getDb();
  const now = new Date().toISOString();

  const current = db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, parsed.id))
    .get();
  if (!current) throw new Error('Category not found');

  const updates: Partial<typeof schema.categories.$inferInsert> = { updatedAt: now };
  if (parsed.name !== undefined) updates.name = parsed.name;
  if (parsed.parentCategoryId !== undefined) updates.parentCategoryId = parsed.parentCategoryId;
  if (parsed.colour !== undefined) updates.colour = parsed.colour;
  if (parsed.icon !== undefined) updates.icon = parsed.icon;

  db.update(schema.categories)
    .set(updates)
    .where(eq(schema.categories.id, parsed.id))
    .run();
  writeAudit('category', parsed.id, 'updated', JSON.stringify(current), JSON.stringify(updates));

  const after = db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, parsed.id))
    .get();
  if (!after) throw new Error('Category vanished after update');
  return toCategory(after);
}

export function archiveCategory(id: string): { id: string } {
  const db = getDb();
  const now = new Date().toISOString();

  const inUse = db
    .select({ id: schema.bills.id })
    .from(schema.bills)
    .where(eq(schema.bills.categoryId, id))
    .limit(1)
    .all();
  if (inUse.length > 0) {
    throw new Error(
      'Cannot archive: this category is still attached to one or more bills. ' +
        'Reassign or merge into another category first.',
    );
  }

  db.update(schema.categories)
    .set({ isArchived: true, updatedAt: now })
    .where(eq(schema.categories.id, id))
    .run();
  writeAudit('category', id, 'archived', null, null);
  return { id };
}

export function restoreCategory(id: string): { id: string } {
  const db = getDb();
  const now = new Date().toISOString();
  db.update(schema.categories)
    .set({ isArchived: false, updatedAt: now })
    .where(eq(schema.categories.id, id))
    .run();
  writeAudit('category', id, 'restored', null, null);
  return { id };
}

/**
 * Merge: reassign all bills and suppliers from source → target, then archive
 * the source category. Wrapped in a transaction so a partial failure leaves
 * the database in a consistent state.
 */
export function mergeCategory(input: CategoryMergeInput): { mergedInto: string } {
  const parsed = CategoryMergeSchema.parse(input);
  if (parsed.sourceId === parsed.targetId) {
    throw new Error('Cannot merge a category into itself');
  }
  const db = getDb();
  const now = new Date().toISOString();

  const target = db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, parsed.targetId))
    .get();
  if (!target) throw new Error('Target category not found');
  if (target.isArchived) throw new Error('Cannot merge into an archived category');

  // Drizzle's better-sqlite3 driver provides a sync transaction helper.
  // We do everything in one go so a crash mid-merge cannot leave dangling refs.
  const tx = db.transaction((trx) => {
    trx
      .update(schema.bills)
      .set({ categoryId: parsed.targetId, updatedAt: now })
      .where(eq(schema.bills.categoryId, parsed.sourceId))
      .run();
    trx
      .update(schema.suppliers)
      .set({ defaultCategoryId: parsed.targetId, updatedAt: now })
      .where(eq(schema.suppliers.defaultCategoryId, parsed.sourceId))
      .run();
    trx
      .update(schema.categories)
      .set({ isArchived: true, updatedAt: now })
      .where(eq(schema.categories.id, parsed.sourceId))
      .run();
  });
  tx();

  writeAudit(
    'category',
    parsed.sourceId,
    'merged_into',
    null,
    JSON.stringify({ targetId: parsed.targetId }),
  );
  return { mergedInto: parsed.targetId };
}

function toCategory(r: typeof schema.categories.$inferSelect): Category {
  return {
    id: r.id,
    name: r.name,
    parentCategoryId: r.parentCategoryId,
    colour: r.colour,
    icon: r.icon,
    isArchived: r.isArchived,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
