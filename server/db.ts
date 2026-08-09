import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

let migrationDone = false;
export async function ensureDbColumnsExist() {
  if (migrationDone) return;
  try {
    await pool.query('ALTER TABLE game_items ADD COLUMN IF NOT EXISTS full_achievement boolean DEFAULT false;');
    await pool.query('ALTER TABLE game_items ADD COLUMN IF NOT EXISTS days_spent integer;');
    await pool.query('ALTER TABLE game_items ADD COLUMN IF NOT EXISTS visited_zones text;');
    await pool.query('ALTER TABLE game_items ADD COLUMN IF NOT EXISTS media_urls text;');
    await pool.query('ALTER TABLE game_items ADD COLUMN IF NOT EXISTS deleted_at text;');
    await pool.query('ALTER TABLE film_items ADD COLUMN IF NOT EXISTS deleted_at text;');
    await pool.query('ALTER TABLE book_items ADD COLUMN IF NOT EXISTS deleted_at text;');
    await pool.query('ALTER TABLE note_items ADD COLUMN IF NOT EXISTS deleted_at text;');
    migrationDone = true;
    console.log('[DB Schema] Verified/added missing columns to Neon database.');
  } catch (err) {
    console.error('[DB Schema] Auto-migration error:', err);
  }
}

// Run auto-migration on module load
ensureDbColumnsExist().catch(console.error);

export default db;
