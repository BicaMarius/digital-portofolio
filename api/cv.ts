import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic imports pentru a evita probleme cu ES modules pe Vercel
let db: any;
let pool: any;
let cvData: any;
let uploadToCloudinary: any;
let deleteFromCloudinary: any;
let initialized = false;
let schemaReady: Promise<void> | null = null;

async function initializeModules() {
  if (initialized) return;
  
  try {
    console.log('[CV API] Initializing modules...');
    
    const dbModule = await import('../server/db.js');
    db = dbModule.default || dbModule.db;
    pool = dbModule.pool;
    console.log('[CV API] DB module loaded:', !!db);
    
    const schemaModule = await import('../shared/schema.js');
    cvData = schemaModule.cvData;
    console.log('[CV API] Schema module loaded:', !!cvData);
    
    const cloudinaryModule = await import('../server/cloudinary.js');
    uploadToCloudinary = cloudinaryModule.uploadToCloudinary;
    deleteFromCloudinary = cloudinaryModule.deleteFromCloudinary;
    console.log('[CV API] Cloudinary module loaded');
    
    initialized = true;
    console.log('[CV API] All modules initialized successfully');
  } catch (error) {
    console.error('[CV API] Failed to initialize modules:', error);
    throw error;
  }
}async function ensureCvSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
        if (!db) {
          await initializeModules();
        }
        console.log('[CV API] Ensuring cv_data schema...');
        
        if (!pool) {
          throw new Error('Database pool not initialized');
        }

        // Create table for Cloudinary-based storage
        await pool.query(`
          CREATE TABLE IF NOT EXISTS cv_data (
            id serial PRIMARY KEY,
            file_name text NOT NULL,
            file_url text NOT NULL,
            cloudinary_public_id text NOT NULL,
            mime_type text NOT NULL DEFAULT 'application/pdf',
            uploaded_at timestamp NOT NULL DEFAULT now()
          )
        `);
        console.log('[CV API] cv_data table ready ✓');

        // Migration: add Cloudinary columns if upgrading from old schema
        try {
          await pool.query(`ALTER TABLE cv_data ADD COLUMN IF NOT EXISTS cloudinary_public_id text`);
          await pool.query(`ALTER TABLE cv_data DROP COLUMN IF EXISTS file_data`);
          console.log('[CV API] Schema migration complete ✓');
        } catch (migrationError) {
          console.log('[CV API] Schema already up to date');
        }

        console.log('[CV API] Schema ready');
      } catch (error) {
        console.error('[CV API] Schema check failed:', error);
        schemaReady = null;
        throw error;
      }
    })();
  }

  return schemaReady;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipartFormData(req: VercelRequest): Promise<{ file?: { buffer: Buffer; mimetype: string; originalname: string } }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+?)(?:;|$)/);
        
        if (!boundaryMatch) {
          console.error('No boundary found in Content-Type:', contentType);
          return resolve({});
        }

        const boundary = boundaryMatch[1].trim();
        const parts = buffer.toString('binary').split(`--${boundary}`);
        
        for (const part of parts) {
          if (part.includes('Content-Disposition') && part.includes('filename')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n]+)/i);
            
            if (filenameMatch) {
              // Find where the actual file data starts (after all headers)
              const doubleNewline = part.indexOf('\r\n\r\n');
              if (doubleNewline === -1) continue;
              
              const dataStart = doubleNewline + 4;
              const dataEnd = part.lastIndexOf('\r\n');
              
              if (dataStart >= dataEnd) continue;
              
              const fileData = part.substring(dataStart, dataEnd);
              const fileBuffer = Buffer.from(fileData, 'binary');
              
              const mimetype = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
              
              return resolve({
                file: {
                  buffer: fileBuffer,
                  mimetype,
                  originalname: filenameMatch[1],
                },
              });
            }
          }
        }
        
        console.error('No file found in multipart data');
        resolve({});
      } catch (error) {
        console.error('Error parsing multipart form data:', error);
        reject(error);
      }
    });
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('[CV API] ==========================================');
  console.log('[CV API] Handler invoked with method:', req.method);
  console.log('[CV API] Environment check:', {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV
  });

  try {
    // Initialize modules dynamically
    console.log('[CV API] Step 1: Initializing modules...');
    await initializeModules();
    console.log('[CV API] Step 1: Modules initialized ✓');
    
    console.log('[CV API] Step 2: Loading crypto and path...');
    const crypto = await import('node:crypto');
    const path = await import('node:path');
    console.log('[CV API] Step 2: Dependencies loaded ✓');

    console.log('[CV API] Step 3: Ensuring schema...');
    await ensureCvSchema();
    console.log('[CV API] Step 3: Schema ready ✓');

    if (req.method === 'GET') {
      console.log('[CV API] GET request - fetching latest CV record');
      const result = await db.select().from(cvData).limit(1);
      const cv = result[0] || null;

      if (!cv) {
        console.log('[CV API] GET request - no CV found');
        return res.json(null);
      }

      // Return CV with Cloudinary URL
      const response = {
        id: cv.id,
        fileName: cv.fileName,
        fileUrl: cv.fileUrl,
        uploadedAt: cv.uploadedAt,
      };
      
      console.log('[CV API] GET request - returning CV from Cloudinary');
      return res.json(response);
    }    if (req.method === 'POST') {
      console.log('[CV API] POST request - starting upload');
      console.log('[CV API] Content-Type:', req.headers['content-type']);
      
      const { file } = await parseMultipartFormData(req);

      if (!file) {
        console.error('[CV API] POST request - no file found in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('[CV API] File received:', { 
        name: file.originalname, 
        type: file.mimetype, 
        size: file.buffer.length 
      });

      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Accept doar fișiere PDF' });
      }

      // Check file size (Cloudinary free tier supports up to 10MB per file)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.buffer.length > maxSize) {
        return res.status(400).json({ 
          error: 'Fișierul este prea mare', 
          details: 'CV-ul trebuie să fie mai mic de 10MB' 
        });
      }

      console.log('[CV API] File size check passed:', {
        sizeBytes: file.buffer.length,
        sizeMB: (file.buffer.length / 1024 / 1024).toFixed(2)
      });

      // Delete existing CV from both Cloudinary and database
      const existing = await db.select().from(cvData).limit(1);
      const existingCV = existing[0];

      console.log('[CV API] Existing CV record:', existingCV ? { id: existingCV.id, publicId: existingCV.cloudinaryPublicId } : 'none');

      if (existingCV) {
        // Delete from Cloudinary first
        if (existingCV.cloudinaryPublicId) {
          try {
            await deleteFromCloudinary(existingCV.cloudinaryPublicId);
            console.log('[CV API] Existing CV deleted from Cloudinary');
          } catch (cloudinaryError) {
            console.error('[CV API] Failed to delete from Cloudinary:', cloudinaryError);
            // Continue anyway - file might not exist on Cloudinary
          }
        }
        
        // Delete from database
        await db.delete(cvData);
        console.log('[CV API] Existing CV deleted from database');
      }

      // Upload to Cloudinary
      console.log('[CV API] Uploading to Cloudinary...');
      const { url, publicId } = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        'portfolio-cv'
      );
      console.log('[CV API] Cloudinary upload successful:', { url, publicId });
      
      // Save metadata to database
      const result = await db.insert(cvData).values({
        fileName: file.originalname,
        fileUrl: url,
        cloudinaryPublicId: publicId,
        mimeType: file.mimetype,
      }).returning();

      const newCV = result[0];
      
      // Return CV with Cloudinary URL
      const response = {
        id: newCV.id,
        fileName: newCV.fileName,
        fileUrl: newCV.fileUrl,
        uploadedAt: newCV.uploadedAt,
      };
      
      console.log('[CV API] Upload successful, CV stored in Cloudinary');
      return res.status(201).json(response);
    }

    if (req.method === 'DELETE') {
      console.log('[CV API] DELETE request - fetching existing CV');
      const existing = await db.select().from(cvData).limit(1);
      const existingCV = existing[0];

      if (!existingCV) {
        return res.status(404).json({ error: 'CV data not found' });
      }

      // Delete from Cloudinary first
      if (existingCV.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(existingCV.cloudinaryPublicId);
          console.log('[CV API] CV deleted from Cloudinary');
        } catch (cloudinaryError) {
          console.error('[CV API] Failed to delete from Cloudinary:', cloudinaryError);
          // Continue anyway to clean up database
        }
      }

      // Delete from database
      await db.delete(cvData);
      console.log('[CV API] DELETE request - CV removed from database');
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[CV API] Error handling request:', error);
    console.error('[CV API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}
