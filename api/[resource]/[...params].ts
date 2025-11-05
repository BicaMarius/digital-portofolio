import 'dotenv/config';
import db from '../../server/db.js';
import { projects, writings, albums, tags, cvData } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Resource mapping - adaugă aici orice dashboard nou!
const resourceMap: Record<string, any> = {
  projects: { table: projects },
  writings: { table: writings },
  albums: { table: albums },
  tags: { table: tags },
  cv: { table: cvData },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { resource, params = [] } = req.query;
    
    // Validate resource exists
    if (!resource || typeof resource !== 'string' || !resourceMap[resource]) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const { table } = resourceMap[resource];
    const [id] = params as string[];

    // GET /api/[resource] - Get all items
    if (req.method === 'GET' && !id) {
      const items = await db.select().from(table);
      return res.status(200).json(items);
    }

    // GET /api/[resource]/[id] - Get single item
    if (req.method === 'GET' && id) {
      const items = await db
        .select()
        .from(table)
        .where(eq(table.id, parseInt(id)));
      
      if (items.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      return res.status(200).json(items[0]);
    }

    // POST /api/[resource] - Create new item
    if (req.method === 'POST' && !id) {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const newItem = await db.insert(table).values(payload).returning();
      return res.status(201).json(newItem[0]);
    }

    // PATCH /api/[resource]/[id] - Update item
    if (req.method === 'PATCH' && id) {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      // Add updatedAt timestamp if table has this field
      const updateData = table.updatedAt 
        ? { ...payload, updatedAt: new Date() }
        : payload;
      
      const updated = await db
        .update(table)
        .set(updateData)
        .where(eq(table.id, parseInt(id)))
        .returning();
      
      if (updated.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      return res.status(200).json(updated[0]);
    }

    // DELETE /api/[resource]/[id] - Delete item
    if (req.method === 'DELETE' && id) {
      await db
        .delete(table)
        .where(eq(table.id, parseInt(id)));
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
