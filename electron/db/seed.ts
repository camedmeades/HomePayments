import { v4 as uuid } from 'uuid';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';
import { log } from '../lib/logger.js';

type DB = BetterSQLite3Database<typeof schema>;

const DEFAULT_ENTITIES: Array<{
  name: string;
  type: 'personal' | 'investment' | 'business' | 'other';
  colour: string;
  icon: string;
}> = [
  { name: 'Personal', type: 'personal', colour: '#2563eb', icon: 'Home' },
  { name: 'Investment', type: 'investment', colour: '#9333ea', icon: 'TrendingUp' },
  { name: 'Business', type: 'business', colour: '#d97706', icon: 'Briefcase' },
];

const DEFAULT_CATEGORIES: Array<{ name: string; colour: string; icon: string }> = [
  { name: 'Electricity', colour: '#eab308', icon: 'Zap' },
  { name: 'Gas', colour: '#f97316', icon: 'Flame' },
  { name: 'Water', colour: '#0ea5e9', icon: 'Droplet' },
  { name: 'Internet', colour: '#6366f1', icon: 'Wifi' },
  { name: 'Mobile', colour: '#8b5cf6', icon: 'Smartphone' },
  { name: 'Council rates', colour: '#65a30d', icon: 'Landmark' },
  { name: 'Strata / body corporate', colour: '#0d9488', icon: 'Building' },
  { name: 'Mortgage', colour: '#dc2626', icon: 'Banknote' },
  { name: 'Rent', colour: '#e11d48', icon: 'Key' },
  { name: 'Car insurance', colour: '#1d4ed8', icon: 'Car' },
  { name: 'Home insurance', colour: '#0369a1', icon: 'ShieldCheck' },
  { name: 'Health insurance', colour: '#059669', icon: 'HeartPulse' },
  { name: 'Subscriptions', colour: '#a855f7', icon: 'Repeat' },
  { name: 'Tax', colour: '#475569', icon: 'Receipt' },
  { name: 'Repairs & maintenance', colour: '#92400e', icon: 'Wrench' },
  { name: 'Medical', colour: '#be185d', icon: 'Stethoscope' },
  { name: 'School fees', colour: '#2563eb', icon: 'GraduationCap' },
  { name: 'Business software', colour: '#0891b2', icon: 'Cloud' },
  { name: 'Accounting', colour: '#7c3aed', icon: 'Calculator' },
  { name: 'Professional services', colour: '#525252', icon: 'BookOpen' },
];

export function seedDefaults(db: DB): void {
  const now = new Date().toISOString();

  // Only seed entities if none exist (idempotent across launches).
  const existingEntities = db.select({ n: sql<number>`count(*)` }).from(schema.entities).all();
  if ((existingEntities[0]?.n ?? 0) === 0) {
    log.info('Seeding default entities');
    for (const e of DEFAULT_ENTITIES) {
      db.insert(schema.entities)
        .values({
          id: uuid(),
          name: e.name,
          type: e.type,
          colour: e.colour,
          icon: e.icon,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  }

  const existingCategories = db
    .select({ n: sql<number>`count(*)` })
    .from(schema.categories)
    .all();
  if ((existingCategories[0]?.n ?? 0) === 0) {
    log.info('Seeding default categories');
    for (const c of DEFAULT_CATEGORIES) {
      db.insert(schema.categories)
        .values({
          id: uuid(),
          name: c.name,
          parentCategoryId: null,
          colour: c.colour,
          icon: c.icon,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  }
}
