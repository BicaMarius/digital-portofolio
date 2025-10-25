import 'dotenv/config';
import { db } from '../server/db';
import { albums } from '../shared/schema';
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
      const allAlbums = await db.select().from(albums);
      return res.status(200).json(allAlbums);
    }

    if (req.method === 'POST') {
      const newAlbum = await db.insert(albums).values(req.body).returning();
      return res.status(201).json(newAlbum[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in albums API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
