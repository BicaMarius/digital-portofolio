import 'dotenv/config';
import db from '../server/db.js';
import { writings } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { id, updates } = body as { id: number; updates: Record<string, unknown> };
    const [updated] = await db.update(writings).set(updates).where(eq(writings.id, id)).returning();
    if (!updated) return res.status(404).json({ error: 'Writing not found' });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error in writings-update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
