import type { Request, Response } from 'express';
import express from 'express';
import { db } from '../server/db.js';
import multer from 'multer';
import { uploadImageToCloudinary } from '../server/cloudinary.js';
import { 
  writings, 
  projects, 
  albums, 
  tags,
  galleryItems
} from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const app = express();
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Resource configuration map
const resourceMap = {
  writings: { table: writings },
  projects: { table: projects },
  albums: { table: albums },
  tags: { table: tags },
  galleryItems: { table: galleryItems },
};

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dynamic CRUD routes for all resources
Object.entries(resourceMap).forEach(([resourceName, config]) => {
  const { table } = config;

  // GET all items
  app.get(`/api/${resourceName}`, async (_req: Request, res: Response) => {
    try {
      const items = await db.select().from(table);
      res.json(items);
    } catch (error) {
      console.error(`Error fetching ${resourceName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${resourceName}` });
    }
  });

  // GET single item by ID
  app.get(`/api/${resourceName}/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const [item] = await db
        .select()
        .from(table)
        .where(eq(table.id, id));

      if (!item) {
        return res.status(404).json({ error: `${resourceName} not found` });
      }

      res.json(item);
    } catch (error) {
      console.error(`Error fetching ${resourceName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${resourceName}` });
    }
  });

  // POST - Create new item
  app.post(`/api/${resourceName}`, async (req: Request, res: Response) => {
    try {
      const [newItem] = await db
        .insert(table)
        .values(req.body)
        .returning();

      res.status(201).json(newItem);
    } catch (error) {
      console.error(`Error creating ${resourceName}:`, error);
      res.status(500).json({ error: `Failed to create ${resourceName}` });
    }
  });

  // PATCH - Update item
  app.patch(`/api/${resourceName}/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const [updatedItem] = await db
        .update(table)
        .set(req.body)
        .where(eq(table.id, id))
        .returning();

      if (!updatedItem) {
        return res.status(404).json({ error: `${resourceName} not found` });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error(`Error updating ${resourceName}:`, error);
      res.status(500).json({ error: `Failed to update ${resourceName}` });
    }
  });

  // DELETE - Delete item
  app.delete(`/api/${resourceName}/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const [deletedItem] = await db
        .delete(table)
        .where(eq(table.id, id))
        .returning();

      if (!deletedItem) {
        return res.status(404).json({ error: `${resourceName} not found` });
      }

      res.json(deletedItem);
    } catch (error) {
      console.error(`Error deleting ${resourceName}:`, error);
      res.status(500).json({ error: `Failed to delete ${resourceName}` });
    }
  });
});

// Image upload endpoint for covers (multipart/form-data)
app.post('/api/upload/cover', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { buffer, originalname, mimetype } = req.file as Express.Multer.File;
    if (!mimetype?.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid file type. Please upload an image.' });
    }

    const { url, publicId } = await uploadImageToCloudinary(buffer, originalname, 'portfolio-art-covers');
    return res.status(201).json({ url, publicId });
  } catch (error) {
    console.error('Error uploading cover image:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Special endpoint for CV
app.get('/api/cv', async (_req: Request, res: Response) => {
  try {
    const [cvData] = await db.select().from(projects).limit(1);
    res.json(cvData || {});
  } catch (error) {
    console.error('Error fetching CV:', error);
    res.status(500).json({ error: 'Failed to fetch CV data' });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export handler for Vercel serverless
export default (req: Request, res: Response) => {
  return app(req, res);
};
