import 'dotenv/config';
import db from '../server/db.js';
import { cvData } from '../shared/schema.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient, CV_BUCKET } from '../server/supabase.js';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipartFormData(req: VercelRequest): Promise<{ file?: { buffer: Buffer; mimetype: string; originalname: string } }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        
        if (!boundary) {
          return resolve({});
        }

        const parts = buffer.toString('binary').split(`--${boundary}`);
        
        for (const part of parts) {
          if (part.includes('Content-Disposition') && part.includes('filename')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);
            
            if (filenameMatch && contentTypeMatch) {
              const headerEnd = part.indexOf('\r\n\r\n') + 4;
              const dataStart = part.indexOf('\r\n\r\n', part.indexOf('Content-Type')) + 4;
              const dataEnd = part.lastIndexOf('\r\n');
              
              const fileBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
              
              return resolve({
                file: {
                  buffer: fileBuffer,
                  mimetype: contentTypeMatch[1].trim(),
                  originalname: filenameMatch[1],
                },
              });
            }
          }
        }
        
        resolve({});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
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

  try {
    if (req.method === 'GET') {
      const result = await db.select().from(cvData).limit(1);
      const cv = result[0] || null;
      
      if (!cv) {
        return res.json(null);
      }

      const { storagePath, ...payload } = cv;
      return res.json(payload);
    }

    if (req.method === 'POST') {
      const { file } = await parseMultipartFormData(req);

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Accept doar fișiere PDF' });
      }

      const supabase = getSupabaseClient();
      const existing = await db.select().from(cvData).limit(1);
      const existingCV = existing[0];

      if (existingCV?.storagePath) {
        const { error: removeError } = await supabase.storage
          .from(CV_BUCKET)
          .remove([existingCV.storagePath]);

        if (removeError) {
          console.error('Failed to remove existing CV from storage:', removeError);
        }

        await db.delete(cvData);
      }

      const extension = extname(file.originalname).toLowerCase() || '.pdf';
      const storagePath = `cv/${randomUUID()}${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(CV_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
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
      return res.status(201).json(payload);
    }

    if (req.method === 'DELETE') {
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
          console.error('Failed to remove CV from storage:', removeError);
        }
      }

      await db.delete(cvData);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('CV API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
