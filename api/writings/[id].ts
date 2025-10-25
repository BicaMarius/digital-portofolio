import 'dotenv/config';
import { db } from '../../server/db';
import { writings } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const writingId = parseInt(id as string, 10);

  if (isNaN(writingId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    if (req.method === 'GET') {
      const [writing] = await db.select().from(writings).where(eq(writings.id, writingId));
      if (!writing) {
        return res.status(404).json({ error: 'Writing not found' });
      }
      return res.status(200).json(writing);
    }

    if (req.method === 'PATCH') {
      const [updatedWriting] = await db
        .update(writings)
        .set(req.body)
        .where(eq(writings.id, writingId))
        .returning();
      
      if (!updatedWriting) {
        return res.status(404).json({ error: 'Writing not found' });
      }
      return res.status(200).json(updatedWriting);
    }

    if (req.method === 'DELETE') {
      const [deletedWriting] = await db
        .delete(writings)
        .where(eq(writings.id, writingId))
        .returning();
      
      if (!deletedWriting) {
        return res.status(404).json({ error: 'Writing not found' });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in writing API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
