import { v4 as uuid } from 'uuid';
import { eq, asc, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';
import type { Entity } from '@shared/types.js';
import type {
  EntityCreateInput,
  EntityUpdateInput,
} from '@shared/ipc-contract.js';
import {
  EntityCreateSchema,
  EntityUpdateSchema,
} from '@shared/ipc-contract.js';
import { writeAudit } from './audit.js';

export function listEntities(includeArchived = false): Entity[] {
  const db = getDb();
  const rows = includeArchived
    ? db.select().from(schema.entities).orderBy(asc(schema.entities.name)).all()
    : db
        .select()
        .from(schema.entities)
        .where(eq(schema.entities.isArchived, false))
        .orderBy(asc(schema.entities.name))
        .all();
  return rows.map(toEntity);
}

export function createEntity(input: EntityCreateInput): Entity {
  const parsed = EntityCreateSchema.parse(input);
  const db = getDb();
  const now = new Date().toISOString();
  const id = uuid();

  // Reject duplicate names (case-insensitive, against active entities).
  const existing = db
    .select()
    .from(schema.entities)
    .where(
      and(eq(schema.entities.isArchived, false), eq(schema.entities.name, parsed.name)),
    )
    .all();
  if (existing.length > 0) {
    throw new Error(`An entity named "${parsed.name}" already exists`);
  }

  db.insert(schema.entities)
    .values({
      id,
      name: parsed.name,
      type: parsed.type,
      colour: parsed.colour,
      icon: parsed.icon,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  writeAudit('entity', id, 'created', null, JSON.stringify(parsed));

  const created = db
    .select()
    .from(schema.entities)
    .where(eq(schema.entities.id, id))
    .get();
  if (!created) throw new Error('Entity vanished after insert');
  return toEntity(created);
}

export function updateEntity(input: EntityUpdateInput): Entity {
  const parsed = EntityUpdateSchema.parse(input);
  const db = getDb();
  const now = new Date().toISOString();

  const current = db
    .select()
    .from(schema.entities)
    .where(eq(schema.entities.id, parsed.id))
    .get();
  if (!current) throw new Error('Entity not found');

  const updates: Partial<typeof schema.entities.$inferInsert> = { updatedAt: now };
  if (parsed.name !== undefined) updates.name = parsed.name;
  if (parsed.type !== undefined) updates.type = parsed.type;
  if (parsed.colour !== undefined) updates.colour = parsed.colour;
  if (parsed.icon !== undefined) updates.icon = parsed.icon;

  db.update(schema.entities).set(updates).where(eq(schema.entities.id, parsed.id)).run();
  writeAudit(
    'entity',
    parsed.id,
    'updated',
    JSON.stringify(current),
    JSON.stringify(updates),
  );

  const after = db
    .select()
    .from(schema.entities)
    .where(eq(schema.entities.id, parsed.id))
    .get();
  if (!after) throw new Error('Entity vanished after update');
  return toEntity(after);
}

export function archiveEntity(id: string): { id: string } {
  const db = getDb();
  const now = new Date().toISOString();

  // Refuse if active bills still reference this entity.
  const inUse = db
    .select({ id: schema.bills.id })
    .from(schema.bills)
    .where(eq(schema.bills.entityId, id))
    .limit(1)
    .all();
  if (inUse.length > 0) {
    throw new Error(
      'Cannot archive: this entity is still attached to one or more bills. ' +
        'Reassign or archive the bills first.',
    );
  }

  db.update(schema.entities)
    .set({ isArchived: true, updatedAt: now })
    .where(eq(schema.entities.id, id))
    .run();
  writeAudit('entity', id, 'archived', null, null);
  return { id };
}

export function restoreEntity(id: string): { id: string } {
  const db = getDb();
  const now = new Date().toISOString();
  db.update(schema.entities)
    .set({ isArchived: false, updatedAt: now })
    .where(eq(schema.entities.id, id))
    .run();
  writeAudit('entity', id, 'restored', null, null);
  return { id };
}

function toEntity(r: typeof schema.entities.$inferSelect): Entity {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    colour: r.colour,
    icon: r.icon,
    isArchived: r.isArchived,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
