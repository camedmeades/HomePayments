import { v4 as uuid } from 'uuid';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';

/**
 * Append-only audit log. Every CRUD mutation should pass through here so we
 * have a record of changes for debugging, dispute resolution, and
 * regulatory comfort.
 */
export function writeAudit(
  entityType: 'entity' | 'category' | 'supplier' | 'bill' | 'rule',
  entityId: string,
  action: string,
  oldValue: string | null,
  newValue: string | null,
  source: 'user' | 'gmail' | 'system' = 'user',
): void {
  const db = getDb();
  db.insert(schema.auditLog)
    .values({
      id: uuid(),
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
      source,
      createdAt: new Date().toISOString(),
    })
    .run();
}
