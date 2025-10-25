import 'dotenv/config';
import db from '../server/db.js';
import { tags } from '../shared/schema.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const allTags = await db.select().from(tags);
      return res.status(200).json(allTags);
    }

    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const newTag = await db.insert(tags).values(payload).returning();
      return res.status(201).json(newTag[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in tags API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
