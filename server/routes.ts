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
  insertMusicTrackSchema,
  updateMusicTrackSchema,
  insertSpotifyFavoriteSchema,
  updateSpotifyFavoriteSchema,
  insertFilmItemSchema,
  updateFilmItemSchema,
  insertNoteItemSchema,
  updateNoteItemSchema,
  insertFilmGenreSchema,
  updateFilmGenreSchema,
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

  app.get("/api/projects/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const projects = await storage.getProjectsByCategory(category);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects/:id/soft-delete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      await storage.updateProject(id, { deletedAt: new Date() } as any);
      res.status(204).send();
    } catch (error) {
      console.error('[Routes] Soft delete error:', error);
      res.status(500).json({ error: "Failed to soft delete project" });
    }
  });

  app.post("/api/projects/:id/restore", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      await storage.updateProject(id, { deletedAt: null });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to restore project" });
    }
  });

  app.delete("/api/projects/:id/permanent", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to permanently delete project" });
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

  // ============ MUSIC TRACKS ============
  app.get("/api/music-tracks", async (_req, res) => {
    try {
      const tracks = await storage.getMusicTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch music tracks" });
    }
  });

  app.get("/api/music-tracks/trash", async (_req, res) => {
    try {
      const tracks = await storage.getTrashedMusicTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trashed music tracks" });
    }
  });

  app.get("/api/music-tracks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const track = await storage.getMusicTrackById(id);
      if (!track) {
        return res.status(404).json({ error: "Music track not found" });
      }
      res.json(track);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch music track" });
    }
  });

  app.post("/api/music-tracks", async (req, res) => {
    try {
      const track = insertMusicTrackSchema.parse(req.body) as any;
      const newTrack = await storage.createMusicTrack(track);
      res.status(201).json(newTrack);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create music track" });
    }
  });

  app.patch("/api/music-tracks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid music track ID" });
      }
      const updates = updateMusicTrackSchema.parse(req.body);
      const updatedTrack = await storage.updateMusicTrack(id, updates);
      if (!updatedTrack) {
        return res.status(404).json({ error: "Music track not found" });
      }
      res.json(updatedTrack);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update music track" });
    }
  });

  app.delete("/api/music-tracks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMusicTrack(id);
      if (!deleted) {
        return res.status(404).json({ error: "Music track not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete music track" });
    }
  });

  // ============ MUSIC ALBUMS API ============
  app.get("/api/music-albums", async (_req, res) => {
    try {
      const albums = await storage.getMusicAlbums();
      res.json(albums);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch music albums" });
    }
  });

  app.get("/api/music-albums/trash", async (_req, res) => {
    try {
      const albums = await storage.getTrashedMusicAlbums();
      res.json(albums);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trashed music albums" });
    }
  });

  app.get("/api/music-albums/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const album = await storage.getMusicAlbum(id);
      if (!album) {
        return res.status(404).json({ error: "Music album not found" });
      }
      res.json(album);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch music album" });
    }
  });

  app.post("/api/music-albums", async (req, res) => {
    try {
      const album = await storage.createMusicAlbum(req.body);
      res.status(201).json(album);
    } catch (error) {
      res.status(500).json({ error: "Failed to create music album" });
    }
  });

  app.patch("/api/music-albums/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const album = await storage.updateMusicAlbum(id, req.body);
      if (!album) {
        return res.status(404).json({ error: "Music album not found" });
      }
      res.json(album);
    } catch (error) {
      res.status(500).json({ error: "Failed to update music album" });
    }
  });

  app.delete("/api/music-albums/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMusicAlbum(id);
      if (!deleted) {
        return res.status(404).json({ error: "Music album not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete music album" });
    }
  });

  // Audio file upload endpoint
  app.post("/api/upload/audio", upload.single("file"), async (req, res) => {
    try {
      const file = (req as Request & { file?: UploadedFile }).file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });
      const folder = (req.body?.folder as string) || 'portfolio-music';
      const { url, publicId } = await uploadToCloudinary(file.buffer, file.originalname, folder);
      res.json({ url, publicId });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload audio file" });
    }
  });

  // Raw file upload endpoint (for text files like lyrics)
  app.post("/api/upload/raw", upload.single("file"), async (req, res) => {
    try {
      const file = (req as Request & { file?: UploadedFile }).file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });
      const folder = (req.body?.folder as string) || 'portfolio-raw';
      const { url, publicId } = await uploadToCloudinary(file.buffer, file.originalname, folder);
      res.json({ url, publicId });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // ============ SPOTIFY API SEARCH ============
  app.get("/api/spotify/search", async (req, res) => {
    try {
      const { searchSpotify, isSpotifyConfigured } = await import("./spotify.js");
      
      if (!isSpotifyConfigured()) {
        return res.status(503).json({ 
          error: "Spotify not configured", 
          message: "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required" 
        });
      }
      
      const type = req.query.type as 'artist' | 'album' | 'track';
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!type || !['artist', 'album', 'track'].includes(type)) {
        return res.status(400).json({ error: "Invalid type. Must be 'artist', 'album', or 'track'" });
      }
      
      if (!query?.trim()) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const results = await searchSpotify(type, query, limit);
      res.json(results);
    } catch (error) {
      console.error('[Spotify Search] Error:', error);
      res.status(500).json({ error: "Failed to search Spotify" });
    }
  });

  app.get("/api/spotify/item/:type/:id", async (req, res) => {
    try {
      const { getSpotifyItem, isSpotifyConfigured } = await import("./spotify.js");
      
      if (!isSpotifyConfigured()) {
        return res.status(503).json({ error: "Spotify not configured" });
      }
      
      const type = req.params.type as 'artist' | 'album' | 'track';
      const { id } = req.params;
      
      if (!['artist', 'album', 'track'].includes(type)) {
        return res.status(400).json({ error: "Invalid type" });
      }
      
      const item = await getSpotifyItem(type, id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error('[Spotify Item] Error:', error);
      res.status(500).json({ error: "Failed to fetch Spotify item" });
    }
  });

  app.get("/api/spotify/status", async (_req, res) => {
    try {
      const { isSpotifyConfigured } = await import("./spotify.js");
      res.json({ configured: isSpotifyConfigured() });
    } catch (error) {
      res.json({ configured: false });
    }
  });

  // Check if user is authenticated
  app.get("/api/spotify/auth/status", async (req, res) => {
    const userId = req.cookies.spotify_user_id;
    
    if (!userId) {
      return res.json({ authenticated: false });
    }

    try {
      const { db } = await import("./db.js");
      const { spotifyUserTokens } = await import("../shared/schema.js");
      const { eq } = await import("drizzle-orm");

      const tokens = await db
        .select()
        .from(spotifyUserTokens)
        .where(eq(spotifyUserTokens.userId, userId))
        .limit(1);

      res.json({ authenticated: tokens.length > 0 });
    } catch (error) {
      console.error('[Spotify Auth Status] Error:', error);
      res.json({ authenticated: false });
    }
  });

  // ============ SPOTIFY USER AUTH ============
  app.get("/api/spotify/auth/url", async (req, res) => {
    try {
      const { getAuthorizationUrl } = await import("./spotify.js");
      const state = Math.random().toString(36).substring(7);
      const url = getAuthorizationUrl(state);
      
      // Detect if we're on HTTPS (production)
      const isProduction = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
      
      // Store state in session/cookie for verification
      res.cookie('spotify_auth_state', state, { 
        httpOnly: true, 
        maxAge: 600000, // 10 min
        sameSite: 'lax', // Important for OAuth redirects!
        secure: isProduction // HTTPS in production, HTTP in development
      });
      res.json({ url, state });
    } catch (error) {
      console.error('[Spotify Auth URL] Error:', error);
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  app.get("/api/spotify/callback", async (req, res) => {
    try {
      const { exchangeCodeForToken, storeUserToken } = await import("./spotify.js");
      const code = req.query.code as string;
      const state = req.query.state as string;
      const storedState = req.cookies.spotify_auth_state;

      console.log('[Spotify Callback] State verification:', {
        receivedState: state,
        storedState: storedState,
        cookies: req.cookies
      });

      if (!code) {
        return res.status(400).send('Missing authorization code');
      }

      // Verify state to prevent CSRF
      if (state !== storedState) {
        console.error('[Spotify Callback] State mismatch!', { 
          received: state, 
          stored: storedState,
          allCookies: req.cookies
        });
        return res.status(400).send('State mismatch - possible CSRF attack');
      }

      const token = await exchangeCodeForToken(code);
      
      // Get user's Spotify ID
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${token.accessToken}` },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile');
      }

      const profile = await profileResponse.json() as { id: string };
      const userId = profile.id;

      // Store token with actual Spotify user ID
      await storeUserToken(userId, token);

      // Detect if we're on HTTPS (production)
      const isProduction = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';

      // Set cookie with userId for future requests
      res.cookie('spotify_user_id', userId, { 
        httpOnly: true, 
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        sameSite: 'lax',
        secure: isProduction // HTTPS in production
      });

      // Clear state cookie
      res.clearCookie('spotify_auth_state');

      // Redirect back to music page
      res.redirect('/#/music?auth=success');
    } catch (error) {
      console.error('[Spotify Callback] Error:', error);
      res.redirect('/#/music?auth=error');
    }
  });

  app.get("/api/spotify/me/top/artists", async (req, res) => {
    try {
      const { getUserTopArtists } = await import("./spotify.js");
      const userId = req.cookies.spotify_user_id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }

      const timeRange = (req.query.time_range as any) || 'medium_term';
      const limit = parseInt(req.query.limit as string) || 10;
      
      const artists = await getUserTopArtists(userId, timeRange, limit);
      res.json(artists);
    } catch (error: any) {
      console.error('[Spotify Top Artists] Error:', error);
      if (error.message?.includes('not authenticated')) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }
      res.status(500).json({ error: "Failed to get top artists" });
    }
  });

  app.get("/api/spotify/me/top/tracks", async (req, res) => {
    try {
      const { getUserTopTracks } = await import("./spotify.js");
      const userId = req.cookies.spotify_user_id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }

      const timeRange = (req.query.time_range as any) || 'medium_term';
      const limit = parseInt(req.query.limit as string) || 10;
      
      const tracks = await getUserTopTracks(userId, timeRange, limit);
      res.json(tracks);
    } catch (error: any) {
      console.error('[Spotify Top Tracks] Error:', error);
      if (error.message?.includes('not authenticated')) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }
      res.status(500).json({ error: "Failed to get top tracks" });
    }
  });

  app.get("/api/spotify/me/top/albums", async (req, res) => {
    try {
      const { getUserTopAlbums } = await import("./spotify.js");
      const userId = req.cookies.spotify_user_id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }

      const timeRange = (req.query.time_range as any) || 'medium_term';
      const limit = parseInt(req.query.limit as string) || 10;
      
      const albums = await getUserTopAlbums(userId, timeRange, limit);
      res.json(albums);
    } catch (error: any) {
      console.error('[Spotify Top Albums] Error:', error);
      if (error.message?.includes('not authenticated')) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }
      res.status(500).json({ error: "Failed to get top albums" });
    }
  });

  app.get("/api/spotify/me/recently-played", async (req, res) => {
    try {
      const { getRecentlyPlayed } = await import("./spotify.js");
      const userId = req.cookies.spotify_user_id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      
      const items = await getRecentlyPlayed(userId, limit);
      res.json(items);
    } catch (error: any) {
      console.error('[Spotify Recently Played] Error:', error);
      if (error.message?.includes('not authenticated')) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }
      res.status(500).json({ error: "Failed to get recently played" });
    }
  });

  app.get("/api/spotify/me/profile", async (req, res) => {
    try {
      const { getUserProfile } = await import("./spotify.js");
      const userId = req.cookies.spotify_user_id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }
      
      const profile = await getUserProfile(userId);
      res.json(profile);
    } catch (error: any) {
      console.error('[Spotify Profile] Error:', error);
      if (error.message?.includes('not authenticated')) {
        return res.status(401).json({ error: 'Not authenticated', needsAuth: true });
      }
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // ============ SPOTIFY FAVORITES ============
  app.get("/api/spotify-favorites", async (_req, res) => {
    try {
      const favorites = await storage.getSpotifyFavorites();
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spotify favorites" });
    }
  });

  app.get("/api/spotify-favorites/list/:listType", async (req, res) => {
    try {
      const { listType } = req.params;
      const favorites = await storage.getSpotifyFavoritesByListType(listType);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spotify favorites" });
    }
  });

  app.get("/api/spotify-favorites/trash", async (_req, res) => {
    try {
      const favorites = await storage.getTrashedSpotifyFavorites();
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trashed spotify favorites" });
    }
  });

  app.get("/api/spotify-favorites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const favorite = await storage.getSpotifyFavoriteById(id);
      if (!favorite) {
        return res.status(404).json({ error: "Spotify favorite not found" });
      }
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spotify favorite" });
    }
  });

  app.post("/api/spotify-favorites", async (req, res) => {
    try {
      const favorite = insertSpotifyFavoriteSchema.parse(req.body) as any;
      const newFavorite = await storage.createSpotifyFavorite(favorite);
      res.status(201).json(newFavorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create spotify favorite" });
    }
  });

  app.patch("/api/spotify-favorites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid spotify favorite ID" });
      }
      const updates = updateSpotifyFavoriteSchema.parse(req.body);
      const updatedFavorite = await storage.updateSpotifyFavorite(id, updates);
      if (!updatedFavorite) {
        return res.status(404).json({ error: "Spotify favorite not found" });
      }
      res.json(updatedFavorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update spotify favorite" });
    }
  });

  app.delete("/api/spotify-favorites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSpotifyFavorite(id);
      if (!deleted) {
        return res.status(404).json({ error: "Spotify favorite not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete spotify favorite" });
    }
  });

  // ============ FILM ITEMS ============
  app.get("/api/films", async (_req, res) => {
    try {
      const films = await storage.getFilmItems();
      res.json(films);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch films" });
    }
  });

  app.get("/api/films/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      const films = await storage.getFilmItemsByStatus(status);
      res.json(films);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch films" });
    }
  });

  app.get("/api/films/trash", async (_req, res) => {
    try {
      const films = await storage.getTrashedFilmItems();
      res.json(films);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trashed films" });
    }
  });

  app.get("/api/films/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const film = await storage.getFilmItemById(id);
      if (!film) {
        return res.status(404).json({ error: "Film not found" });
      }
      res.json(film);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch film" });
    }
  });

  app.post("/api/films", async (req, res) => {
    try {
      const film = insertFilmItemSchema.parse(req.body) as any;
      const newFilm = await storage.createFilmItem(film);
      res.status(201).json(newFilm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create film" });
    }
  });

  app.patch("/api/films/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid film ID" });
      }
      const updates = updateFilmItemSchema.parse(req.body);
      const updatedFilm = await storage.updateFilmItem(id, updates);
      if (!updatedFilm) {
        return res.status(404).json({ error: "Film not found" });
      }
      res.json(updatedFilm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update film" });
    }
  });

  app.delete("/api/films/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFilmItem(id);
      if (!deleted) {
        return res.status(404).json({ error: "Film not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete film" });
    }
  });

  // ============ NOTE ITEMS ============
  app.get("/api/notes", async (_req, res) => {
    try {
      const notes = await storage.getNoteItems();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const notes = await storage.getNoteItemsByType(type);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/trash", async (_req, res) => {
    try {
      const notes = await storage.getTrashedNoteItems();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trashed notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNoteItemById(id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const note = insertNoteItemSchema.parse(req.body) as any;
      const newNote = await storage.createNoteItem(note);
      res.status(201).json(newNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }
      const updates = updateNoteItemSchema.parse(req.body);
      const updatedNote = await storage.updateNoteItem(id, updates);
      if (!updatedNote) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(updatedNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNoteItem(id);
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ============ FILM GENRES ============

  app.get("/api/film-genres", async (_req, res) => {
    try {
      const genres = await storage.getFilmGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch film genres" });
    }
  });

  app.get("/api/film-genres/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const genre = await storage.getFilmGenreById(id);
      if (!genre) {
        return res.status(404).json({ error: "Genre not found" });
      }
      res.json(genre);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch genre" });
    }
  });

  app.post("/api/film-genres", async (req, res) => {
    try {
      const genreData = insertFilmGenreSchema.parse(req.body as Record<string, unknown>);
      const newGenre = await storage.createFilmGenre({ name: genreData.name });
      res.status(201).json(newGenre);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create genre" });
    }
  });

  app.patch("/api/film-genres/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateFilmGenreSchema.parse(req.body);
      const updatedGenre = await storage.updateFilmGenre(id, updates);
      if (!updatedGenre) {
        return res.status(404).json({ error: "Genre not found" });
      }
      res.json(updatedGenre);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update genre" });
    }
  });

  app.delete("/api/film-genres/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFilmGenre(id);
      if (!deleted) {
        return res.status(404).json({ error: "Genre not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete genre" });
    }
  });
}
