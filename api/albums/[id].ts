import 'dotenv/config';
import db from '../../server/db.js';
import { albums } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[api/albums/[id]] method', req.method, 'url', req.url);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const albumId = parseInt(id as string, 10);

  if (isNaN(albumId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    if (req.method === 'GET') {
      const [album] = await db.select().from(albums).where(eq(albums.id, albumId));
      if (!album) {
        return res.status(404).json({ error: 'Album not found' });
      }
      return res.status(200).json(album);
    }

  if (req.method === 'PATCH' || req.method === 'PUT') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const [updatedAlbum] = await db
        .update(albums)
        .set(payload)
        .where(eq(albums.id, albumId))
        .returning();
      
      if (!updatedAlbum) {
        return res.status(404).json({ error: 'Album not found' });
      }
      return res.status(200).json(updatedAlbum);
    }

    if (req.method === 'DELETE') {
      const [deletedAlbum] = await db
        .delete(albums)
        .where(eq(albums.id, albumId))
        .returning();
      
      if (!deletedAlbum) {
        return res.status(404).json({ error: 'Album not found' });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in album API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
