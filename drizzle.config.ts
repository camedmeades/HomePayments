import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './electron/db/schema.ts',
  out: './electron/db/migrations',
  // We don't have a runtime DB URL at generate-time — drizzle-kit only needs schema.
  dbCredentials: {
    url: 'file:./.dev.db',
  },
  strict: true,
  verbose: true,
});
