import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paths } from '../lib/paths.js';
import { log } from '../lib/logger.js';
import * as schema from './schema.js';
import { seedDefaults } from './seed.js';

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;
let _sqlite: Database.Database | null = null;

export function getDb(): DB {
  if (!_db) throw new Error('Database not initialised — call initDb() first');
  return _db;
}

export function initDb(): { db: DB; schemaVersion: number } {
  const file = paths.dbFile();
  log.info('Opening database at', file);

  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');

  _sqlite = sqlite;
  _db = drizzle(sqlite, { schema });

  // Locate migration folder. In dev, electron-vite serves from the project
  // root; in packaged builds we resolve relative to this module.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(here, '../../electron/db/migrations');

  try {
    migrate(_db, { migrationsFolder });
    log.info('Migrations applied');
  } catch (err) {
    log.error('Migration failed:', err);
    throw err;
  }

  // Seed defaults if the DB is empty.
  seedDefaults(_db);

  // Track schema version in settings so we can show it on the dashboard.
  const version = readSchemaVersion(sqlite);
  return { db: _db, schemaVersion: version };
}

function readSchemaVersion(sqlite: Database.Database): number {
  try {
    const row = sqlite
      .prepare(
        "SELECT count(*) as n FROM sqlite_master WHERE type='table' AND name LIKE '__drizzle%'",
      )
      .get() as { n: number };
    if (row.n === 0) return 0;
    const v = sqlite
      .prepare('SELECT MAX(id) as id FROM __drizzle_migrations')
      .get() as { id: number | null };
    return v.id ?? 0;
  } catch {
    return 0;
  }
}

export function closeDb(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
  }
}
