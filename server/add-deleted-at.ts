import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addDeletedAtColumn() {
  const client = await pool.connect();
  try {
    console.log('Adding deleted_at column to projects table...');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP');
    console.log('Column added successfully!');
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDeletedAtColumn();
