import type { Express, Request } from "express";
import { z } from "zod";
import type { IStorage } from "./storage.js";
import {
  insertProjectSchema,
  updateProjectSchema,
  insertGalleryItemSchema,
  updateGalleryItemSchema,
  insertWritingSchema,
  updateWritingSchema,
  insertAlbumSchema,
  updateAlbumSchema,
  insertTagSchema,
  updateTagSchema,
  insertPhotoLocationSchema,
  updatePhotoLocationSchema,
  insertPhotoDeviceSchema,
  updatePhotoDeviceSchema,
} from "../shared/schema.js";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { uploadToCloudinary, deleteFromCloudinary, uploadImageToCloudinary } from "./cloudinary.js";

type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export function registerRoutes(app: Express, storage: IStorage) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.get("/api/projects/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const projects = await storage.getProjectsByCategory(category);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = insertProjectSchema.parse(req.body) as any;
      const newProject = await storage.createProject(project);
      res.status(201).json(newProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      const updates = updateProjectSchema.parse(req.body);
      const updatedProject = await storage.updateProject(id, updates);
      if (!updatedProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Gallery Items
  app.get("/api/gallery", async (req, res) => {
    try {
      const items = await storage.getGalleryItems();
      res.json(items);
    } catch (error) {
      console.error('[Routes] GET /api/gallery failed:', error);
      res.status(500).json({ error: "Failed to fetch gallery items" });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getGalleryItemById(id);
      if (!item) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gallery item" });
    }
  });

  app.get("/api/gallery/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getGalleryItemsByCategory(category);
      res.json(items);
    } catch (error) {
      console.error('[Routes] GET /api/gallery/category/:category failed:', error);
      res.status(500).json({ error: "Failed to fetch gallery items" });
    }
  });

  // Trash (soft-deleted gallery items)
  app.get("/api/gallery/trash", async (_req, res) => {
    try {
      const items = await storage.getTrashedGalleryItems();
      res.json(items);
    } catch (error) {
      console.error('[Routes] GET /api/gallery/trash failed:', error);
      res.status(500).json({ error: "Failed to fetch trashed gallery items" });
    }
  });

  app.get("/api/gallery/trash/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getTrashedGalleryItemsByCategory(category);
      res.json(items);
    } catch (error) {
      console.error('[Routes] GET /api/gallery/trash/category/:category failed:', error);
      res.status(500).json({ error: "Failed to fetch trashed gallery items" });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const item = insertGalleryItemSchema.parse(req.body) as any;
      console.log('[Routes] POST /api/gallery incoming', item);
      const newItem = await storage.createGalleryItem(item);
      console.log('[Routes] POST /api/gallery created', newItem);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('[Routes] POST /api/gallery error', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create gallery item" });
    }
  });

  app.patch("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid gallery item ID" });
      }
      const updates = updateGalleryItemSchema.parse(req.body);
      console.log('[Routes] PATCH /api/gallery/:id incoming', { id, updates });
      const updatedItem = await storage.updateGalleryItem(id, updates);
      if (!updatedItem) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      console.log('[Routes] PATCH /api/gallery/:id success', updatedItem);
      res.json(updatedItem);
    } catch (error) {
      console.error('[Routes] PATCH /api/gallery/:id error', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update gallery item" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('[Routes] DELETE /api/gallery/:id incoming', { id });
      const deleted = await storage.deleteGalleryItem(id);
      if (!deleted) {
        console.warn('[Routes] DELETE /api/gallery/:id not found', { id });
        return res.status(404).json({ error: "Gallery item not found" });
      }
      console.log('[Routes] DELETE /api/gallery/:id success', { id });
      res.status(204).send();
    } catch (error) {
      console.error('[Routes] DELETE /api/gallery/:id error', error);
      res.status(500).json({ error: "Failed to delete gallery item" });
    }
  });

  // Generic image upload (Cloudinary) for artworks/covers
  app.post("/api/upload/image", upload.single("file"), async (req, res) => {
    try {
      const file = (req as Request & { file?: UploadedFile }).file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });
      const folder = (req.body?.folder as string) || 'portfolio-art-items';
      const { url, publicId } = await uploadImageToCloudinary(file.buffer, file.originalname, folder);
      res.json({ url, publicId });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Alias endpoint specifically for album covers to match client usage
  app.post("/api/upload/cover", upload.single("file"), async (req, res) => {
    try {
      const file = (req as Request & { file?: UploadedFile }).file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });
      // Default folder for covers; can be overridden via multipart 'folder'
      const folder = (req.body?.folder as string) || 'portfolio-art-covers';
      const { url, publicId } = await uploadImageToCloudinary(file.buffer, file.originalname, folder);
      res.status(201).json({ url, publicId });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // CV Data - files stored in Cloudinary
  app.get("/api/cv", async (req, res) => {
    try {
      const cv = await storage.getCVData();
      if (!cv) {
        return res.json(null);
      }

      // Return CV with Cloudinary URL
      const response = {
        id: cv.id,
        fileName: cv.fileName,
        fileUrl: cv.fileUrl,
        uploadedAt: cv.uploadedAt,
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CV data" });
    }
  });

  app.post("/api/cv", upload.single("file"), async (req, res) => {
    try {
      const file = (req as Request & { file?: UploadedFile }).file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Accept doar fișiere PDF" });
      }

      // Check file size (Cloudinary supports up to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return res.status(400).json({ 
          error: "Fișierul este prea mare", 
          details: "CV-ul trebuie să fie mai mic de 10MB" 
        });
      }

      // Delete existing CV if any (from both Cloudinary and database)
      const existing = await storage.getCVData();
      if (existing && existing.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(existing.cloudinaryPublicId);
          console.log('[Routes] Existing CV deleted from Cloudinary');
        } catch (cloudinaryError) {
          console.error('[Routes] Failed to delete from Cloudinary:', cloudinaryError);
        }
      }
      if (existing) {
        await storage.deleteCVData();
      }

      // Upload to Cloudinary
      const { url, publicId } = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        'portfolio-cv'
      );

      // Save metadata to database
      const newCV = await storage.createCVData({
        fileName: file.originalname,
        fileUrl: url,
        cloudinaryPublicId: publicId,
        mimeType: file.mimetype,
      });

      // Return CV with Cloudinary URL
      const response = {
        id: newCV.id,
        fileName: newCV.fileName,
        fileUrl: newCV.fileUrl,
        uploadedAt: newCV.uploadedAt,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('[Routes] Failed to create CV:', error);
      res.status(500).json({ error: "Failed to create CV data" });
    }
  });

  app.delete("/api/cv", async (req, res) => {
    try {
      const existing = await storage.getCVData();
      if (!existing) {
        return res.status(404).json({ error: "CV data not found" });
      }

      // Delete from Cloudinary first
      if (existing.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(existing.cloudinaryPublicId);
          console.log('[Routes] CV deleted from Cloudinary');
        } catch (cloudinaryError) {
          console.error('[Routes] Failed to delete from Cloudinary:', cloudinaryError);
        }
      }

      // Delete from database
      await storage.deleteCVData();
      res.status(204).send();
    } catch (error) {
      console.error('[Routes] Failed to delete CV:', error);
      res.status(500).json({ error: "Failed to delete CV data" });
    }
  });

  // Writings
  app.get("/api/writings", async (req, res) => {
    try {
      const writings = await storage.getWritings();
      res.json(writings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch writings" });
    }
  });

  app.get("/api/writings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const writing = await storage.getWritingById(id);
      if (!writing) {
        return res.status(404).json({ error: "Writing not found" });
      }
      res.json(writing);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch writing" });
    }
  });

  app.post("/api/writings", async (req, res) => {
    try {
      const writing = insertWritingSchema.parse(req.body) as any;
      const newWriting = await storage.createWriting(writing);
      res.status(201).json(newWriting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create writing" });
    }
  });

  app.patch("/api/writings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid writing ID" });
      }
      const updates = updateWritingSchema.parse(req.body);
      const updatedWriting = await storage.updateWriting(id, updates);
      if (!updatedWriting) {
        return res.status(404).json({ error: "Writing not found" });
      }
      res.json(updatedWriting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update writing" });
    }
  });

  app.delete("/api/writings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWriting(id);
      if (!deleted) {
        return res.status(404).json({ error: "Writing not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete writing" });
    }
  });

  // Albums
  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      // Filter by contentType if provided
      const contentType = req.query.contentType as string | undefined;
      const filtered = contentType ? albums.filter(a => a.contentType === contentType) : albums;
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch albums" });
    }
  });

  app.get("/api/albums/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const album = await storage.getAlbumById(id);
      if (!album) {
        return res.status(404).json({ error: "Album not found" });
      }
      res.json(album);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch album" });
    }
  });

  app.post("/api/albums", async (req, res) => {
    try {
      const album = insertAlbumSchema.parse(req.body) as any;
      const newAlbum = await storage.createAlbum(album);
      res.status(201).json(newAlbum);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create album" });
    }
  });

  app.patch("/api/albums/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid album ID" });
      }
      const updates = updateAlbumSchema.parse(req.body);
      const updatedAlbum = await storage.updateAlbum(id, updates);
      if (!updatedAlbum) {
        return res.status(404).json({ error: "Album not found" });
      }
      res.json(updatedAlbum);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update album" });
    }
  });

  app.delete("/api/albums/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAlbum(id);
      if (!deleted) {
        return res.status(404).json({ error: "Album not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete album" });
    }
  });

  // Tags
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.get("/api/tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tag = await storage.getTagById(id);
      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tag" });
    }
  });

  app.post("/api/tags", async (req, res) => {
    try {
      const tag = insertTagSchema.parse(req.body) as any;
      const newTag = await storage.createTag(tag);
      res.status(201).json(newTag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  app.patch("/api/tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tag ID" });
      }
      const updates = updateTagSchema.parse(req.body);
      const updatedTag = await storage.updateTag(id, updates);
      if (!updatedTag) {
        return res.status(404).json({ error: "Tag not found" });
      }
      res.json(updatedTag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update tag" });
    }
  });

  app.delete("/api/tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTag(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tag not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tag" });
    }
  });

  // Photo Locations
  app.get("/api/photo-locations", async (req, res) => {
    try {
      const locations = await storage.getPhotoLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photo locations" });
    }
  });

  app.get("/api/photo-locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getPhotoLocationById(id);
      if (!location) {
        return res.status(404).json({ error: "Photo location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photo location" });
    }
  });

  app.post("/api/photo-locations", async (req, res) => {
    try {
      const location = insertPhotoLocationSchema.parse(req.body) as any;
      const newLocation = await storage.createPhotoLocation(location);
      res.status(201).json(newLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create photo location" });
    }
  });

  app.patch("/api/photo-locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid photo location ID" });
      }
      const updates = updatePhotoLocationSchema.parse(req.body);
      const updatedLocation = await storage.updatePhotoLocation(id, updates);
      if (!updatedLocation) {
        return res.status(404).json({ error: "Photo location not found" });
      }
      res.json(updatedLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update photo location" });
    }
  });

  app.delete("/api/photo-locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePhotoLocation(id);
      if (!deleted) {
        return res.status(404).json({ error: "Photo location not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo location" });
    }
  });

  // Photo Devices
  app.get("/api/photo-devices", async (req, res) => {
    try {
      const devices = await storage.getPhotoDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photo devices" });
    }
  });

  app.get("/api/photo-devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const device = await storage.getPhotoDeviceById(id);
      if (!device) {
        return res.status(404).json({ error: "Photo device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photo device" });
    }
  });

  app.post("/api/photo-devices", async (req, res) => {
    try {
      const device = insertPhotoDeviceSchema.parse(req.body) as any;
      const newDevice = await storage.createPhotoDevice(device);
      res.status(201).json(newDevice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create photo device" });
    }
  });

  app.patch("/api/photo-devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid photo device ID" });
      }
      const updates = updatePhotoDeviceSchema.parse(req.body);
      const updatedDevice = await storage.updatePhotoDevice(id, updates);
      if (!updatedDevice) {
        return res.status(404).json({ error: "Photo device not found" });
      }
      res.json(updatedDevice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update photo device" });
    }
  });

  app.delete("/api/photo-devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePhotoDevice(id);
      if (!deleted) {
        return res.status(404).json({ error: "Photo device not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo device" });
    }
  });
}
