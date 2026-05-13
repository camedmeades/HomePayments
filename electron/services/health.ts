import { app } from 'electron';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';
import { paths } from '../lib/paths.js';
import { isEncryptionAvailable } from '../lib/crypto.js';
import type { HealthReport } from '@shared/types.js';

export function getHealthReport(schemaVersion: number): HealthReport {
  const db = getDb();
  const entityCount =
    db.select({ n: sql<number>`count(*)` }).from(schema.entities).all()[0]?.n ?? 0;
  const categoryCount =
    db.select({ n: sql<number>`count(*)` }).from(schema.categories).all()[0]?.n ?? 0;

  return {
    appVersion: app.getVersion(),
    dbPath: paths.dbFile(),
    dbSchemaVersion: schemaVersion,
    entityCount,
    categoryCount,
    encryptionAvailable: isEncryptionAvailable(),
  };
}
