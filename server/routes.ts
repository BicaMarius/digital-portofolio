import type { Express, Request } from "express";
import { z } from "zod";
import type { IStorage } from "./storage";
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
} from "@shared/schema";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { CV_BUCKET, getSupabaseClient } from "./supabase";

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
      const project = insertProjectSchema.parse(req.body);
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
      res.status(500).json({ error: "Failed to fetch gallery items" });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const item = insertGalleryItemSchema.parse(req.body);
      const newItem = await storage.createGalleryItem(item);
      res.status(201).json(newItem);
    } catch (error) {
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
      const updatedItem = await storage.updateGalleryItem(id, updates);
      if (!updatedItem) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update gallery item" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGalleryItem(id);
      if (!deleted) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete gallery item" });
    }
  });

  // CV Data
  app.get("/api/cv", async (req, res) => {
    try {
      const cv = await storage.getCVData();
      if (!cv) {
        return res.json(null);
      }

      const { storagePath, ...payload } = cv;
      res.json(payload);
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

      const supabase = getSupabaseClient();
      const existing = await storage.getCVData();

      if (existing?.storagePath) {
        const { error: removeError } = await supabase.storage
          .from(CV_BUCKET)
          .remove([existing.storagePath]);

        if (removeError) {
          return res.status(500).json({ error: "Nu am putut șterge CV-ul existent din storage", details: removeError.message });
        }

        await storage.deleteCVData();
      }

      const extension = extname(file.originalname).toLowerCase() || ".pdf";
      const storagePath = `cv/${randomUUID()}${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(CV_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return res.status(500).json({ error: "Nu am putut încărca fișierul în Supabase", details: uploadError.message });
      }

      const { data: publicData, error: publicUrlError } = supabase.storage
        .from(CV_BUCKET)
        .getPublicUrl(storagePath);

      if (publicUrlError || !publicData?.publicUrl) {
        return res.status(500).json({ error: "Nu am putut genera URL-ul public" });
      }

      const newCV = await storage.createCVData({
        fileName: file.originalname,
        fileUrl: publicData.publicUrl,
        storagePath,
      });

      const { storagePath: _, ...payload } = newCV;
      res.status(201).json(payload);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Supabase")) {
        return res.status(500).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create CV data" });
    }
  });

  app.delete("/api/cv", async (req, res) => {
    try {
      const existing = await storage.getCVData();
      if (!existing) {
        return res.status(404).json({ error: "CV data not found" });
      }

      const supabase = getSupabaseClient();

      if (existing.storagePath) {
        const { error: removeError } = await supabase.storage
          .from(CV_BUCKET)
          .remove([existing.storagePath]);

        if (removeError) {
          return res.status(500).json({ error: "Nu am putut șterge fișierul din Supabase", details: removeError.message });
        }
      }

      await storage.deleteCVData();
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Supabase")) {
        return res.status(500).json({ error: error.message });
      }
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
      const writing = insertWritingSchema.parse(req.body);
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
      res.json(albums);
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
      const album = insertAlbumSchema.parse(req.body);
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
      const tag = insertTagSchema.parse(req.body);
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
}
