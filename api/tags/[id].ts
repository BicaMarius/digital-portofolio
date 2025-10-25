import 'dotenv/config';
import db from '../../server/db.js';
import { tags } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const tagId = parseInt(id as string, 10);

  if (isNaN(tagId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    if (req.method === 'GET') {
      const [tag] = await db.select().from(tags).where(eq(tags.id, tagId));
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      return res.status(200).json(tag);
    }

    if (req.method === 'PATCH') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const [updatedTag] = await db
        .update(tags)
        .set(payload)
        .where(eq(tags.id, tagId))
        .returning();
      
      if (!updatedTag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      return res.status(200).json(updatedTag);
    }

    if (req.method === 'DELETE') {
      const [deletedTag] = await db
        .delete(tags)
        .where(eq(tags.id, tagId))
        .returning();
      
      if (!deletedTag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in tag API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
