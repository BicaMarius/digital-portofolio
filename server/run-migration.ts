import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  try {
    console.log('Running migration: 20251212_spotify_user_tokens.sql');
    
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS spotify_user_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        scope TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_spotify_user_id ON spotify_user_tokens(user_id)
    `;
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
