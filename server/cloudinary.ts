import { v2 as cloudinary } from 'cloudinary';

let initialized = false;

export function initCloudinary() {
  if (initialized) return;

  // Cloudinary SDK auto-configures from CLOUDINARY_URL environment variable
  // Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  if (process.env.CLOUDINARY_URL) {
    try {
      // Parse URL manually to extract credentials
      const url = new URL(process.env.CLOUDINARY_URL);
      const cloudName = url.hostname;
      const apiKey = url.username;
      const apiSecret = url.password;

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Invalid CLOUDINARY_URL format');
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      initialized = true;
      console.log('[Cloudinary] Initialized from CLOUDINARY_URL with cloud:', cloudName);
      return;
    } catch (error) {
      console.error('[Cloudinary] Failed to parse CLOUDINARY_URL:', error);
      throw new Error('Invalid CLOUDINARY_URL format. Expected: cloudinary://API_KEY:API_SECRET@CLOUD_NAME');
    }
  }

  // Fallback to individual variables
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    console.error('[Cloudinary] Missing credentials:', {
      hasUrl: !!process.env.CLOUDINARY_URL,
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
    });
    throw new Error('Cloudinary credentials are not configured. Check your environment variables.');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  initialized = true;
  console.log('[Cloudinary] Initialized with cloud:', process.env.CLOUDINARY_CLOUD_NAME);
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'portfolio-cv'
): Promise<{ url: string; publicId: string }> {
  initCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'raw', // Important: 'raw' for PDFs, not 'auto'
        public_id: `cv_${Date.now()}`,
        overwrite: false,
        type: 'upload', // Makes file publicly accessible
        access_mode: 'public' // Ensures public access
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(error);
        } else if (result) {
          console.log('[Cloudinary] Upload successful:', result.public_id);
          console.log('[Cloudinary] Public URL:', result.secure_url);
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  initCloudinary();

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    console.log('[Cloudinary] Delete result:', result);
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    throw error;
  }
}

export { cloudinary };
