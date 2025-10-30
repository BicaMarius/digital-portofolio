import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic imports pentru a evita probleme cu ES modules pe Vercel
let db: any;
let pool: any;
let cvData: any;
let getSupabaseClient: any;
let CV_BUCKET: string;
let initialized = false;
let schemaReady: Promise<void> | null = null;

async function initializeModules() {
  if (initialized) return;
  
  try {
    console.log('Initializing modules...');
    
  const dbModule = await import('../server/db.js');
  db = dbModule.default || dbModule.db;
  pool = dbModule.pool;
  console.log('DB module loaded:', !!db, 'has execute:', typeof db?.execute === 'function');
  console.log('Pool loaded:', !!pool, 'has query:', typeof pool?.query === 'function');
    
    const schemaModule = await import('../shared/schema.js');
    cvData = schemaModule.cvData;
    console.log('Schema module loaded:', !!cvData);
    
    const supabaseModule = await import('../server/supabase.js');
    getSupabaseClient = supabaseModule.getSupabaseClient;
    CV_BUCKET = supabaseModule.CV_BUCKET || 'portfolio-cv';
    console.log('Supabase module loaded:', !!getSupabaseClient, 'Bucket:', CV_BUCKET);
    
    initialized = true;
    console.log('All modules initialized successfully');
  } catch (error) {
    console.error('Failed to initialize modules:', error);
    throw error;
  }
}

async function ensureCvSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
        if (!db) {
          await initializeModules();
        }
        console.log('[CV API] Ensuring cv_data schema...');
        const { sql } = await import('drizzle-orm');

        const runStatement = async (statement: any, label: string) => {
          try {
            if (typeof db?.execute === 'function') {
              await db.execute(statement);
            } else if (typeof pool?.query === 'function') {
              const { sql: text, params } = statement;
              await pool.query(text, params);
            } else {
              throw new Error('No available executor to run SQL statements');
            }
            console.log(`[CV API] ${label} ✓`);
          } catch (err) {
            console.error(`[CV API] ${label} failed:`, err);
            throw err;
          }
        };

        await runStatement(
          sql`
            CREATE TABLE IF NOT EXISTS "cv_data" (
              "id" serial PRIMARY KEY,
              "file_name" text NOT NULL,
              "file_url" text NOT NULL,
              "storage_path" text,
              "uploaded_at" timestamp NOT NULL DEFAULT now()
            )
          `,
          'Ensure cv_data table'
        );

        await runStatement(
          sql`ALTER TABLE "cv_data" ADD COLUMN IF NOT EXISTS "storage_path" text`,
          'Ensure storage_path column'
        );

        await runStatement(
          sql`UPDATE "cv_data" SET "storage_path" = '' WHERE "storage_path" IS NULL`,
          'Backfill empty storage_path'
        );

        console.log('[CV API] cv_data schema ready');
      } catch (error) {
        console.error('Failed to ensure cv_data schema:', error);
        // Reset so future calls can retry
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

  // Initialize modules dynamically
  console.log('[CV API] Handler invoked with method:', req.method);
  await initializeModules();
  
  const crypto = await import('node:crypto');
  const path = await import('node:path');

  try {
    await ensureCvSchema();

    if (req.method === 'GET') {
      console.log('[CV API] GET request - fetching latest CV record');
      const result = await db.select().from(cvData).limit(1);
      const cv = result[0] || null;
      
      if (!cv) {
        console.log('[CV API] GET request - no CV found');
        return res.json(null);
      }

      const { storagePath, ...payload } = cv;
      console.log('[CV API] GET request - returning CV payload');
      return res.json(payload);
    }

    if (req.method === 'POST') {
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

      const supabase = getSupabaseClient();
      const existing = await db.select().from(cvData).limit(1);
      const existingCV = existing[0];

      console.log('[CV API] Existing CV record:', existingCV ? { id: existingCV.id, storagePath: existingCV.storagePath } : 'none');

      if (existingCV?.storagePath) {
        const { error: removeError } = await supabase.storage
          .from(CV_BUCKET)
          .remove([existingCV.storagePath]);

        if (removeError) {
          console.error('[CV API] Failed to remove existing CV from storage:', removeError);
        }

        await db.delete(cvData);
        console.log('[CV API] Existing CV record removed from database');
      }

      const extension = path.extname(file.originalname).toLowerCase() || '.pdf';
      const storagePath = `cv/${crypto.randomUUID()}${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(CV_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[CV API] Supabase upload error:', uploadError);
        return res.status(500).json({ error: 'Nu am putut încărca fișierul în Supabase', details: uploadError.message });
      }

      const { data: publicData } = supabase.storage
        .from(CV_BUCKET)
        .getPublicUrl(storagePath);

      if (!publicData?.publicUrl) {
        return res.status(500).json({ error: 'Nu am putut genera URL-ul public' });
      }

      const result = await db.insert(cvData).values({
        fileName: file.originalname,
        fileUrl: publicData.publicUrl,
        storagePath,
      }).returning();

      const newCV = result[0];
      const { storagePath: _, ...payload } = newCV;
      console.log('[CV API] Upload successful, returning payload');
      return res.status(201).json(payload);
    }

    if (req.method === 'DELETE') {
      console.log('[CV API] DELETE request - fetching existing CV');
      const existing = await db.select().from(cvData).limit(1);
      const existingCV = existing[0];

      if (!existingCV) {
        return res.status(404).json({ error: 'CV data not found' });
      }

      const supabase = getSupabaseClient();

      if (existingCV.storagePath) {
        const { error: removeError } = await supabase.storage
          .from(CV_BUCKET)
          .remove([existingCV.storagePath]);

        if (removeError) {
          console.error('[CV API] Failed to remove CV from storage:', removeError);
        }
      }

      await db.delete(cvData);
      console.log('[CV API] DELETE request - CV removed');
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
