// Migration script to update projects table with new fields
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db';

async function migrate() {
  console.log('🔄 Running migration: add_project_fields...');

  try {
    // Add new columns to projects table
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS hours_worked INTEGER`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS frontend_tech TEXT[] DEFAULT '{}'`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS backend_tech TEXT[] DEFAULT '{}'`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_release_date TEXT`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_updated_date TEXT`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS additional_files TEXT[] DEFAULT '{}'`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS git_url TEXT`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_url TEXT`);

    // Update existing projects with default values
    await db.execute(sql`UPDATE projects SET images = '{}' WHERE images IS NULL`);
    await db.execute(sql`UPDATE projects SET frontend_tech = '{}' WHERE frontend_tech IS NULL`);
    await db.execute(sql`UPDATE projects SET backend_tech = '{}' WHERE backend_tech IS NULL`);
    await db.execute(sql`UPDATE projects SET additional_files = '{}' WHERE additional_files IS NULL`);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log('🎉 Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to run migration:', error);
    process.exit(1);
  });
