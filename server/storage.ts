import type {
  Project,
  InsertProject,
  UpdateProject,
  GalleryItem,
  InsertGalleryItem,
  UpdateGalleryItem,
  CVData,
  InsertCVData,
  Writing,
  InsertWriting,
  UpdateWriting,
  Album,
  InsertAlbum,
  UpdateAlbum,
  Tag,
  InsertTag,
  UpdateTag,
} from "../shared/schema.js";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | null>;
  getProjectsByCategory(category: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: UpdateProject): Promise<Project | null>;
  deleteProject(id: number): Promise<boolean>;

  // Gallery Items
  getGalleryItems(): Promise<GalleryItem[]>;
  getGalleryItemById(id: number): Promise<GalleryItem | null>;
  getGalleryItemsByCategory(category: string): Promise<GalleryItem[]>;
  getTrashedGalleryItems(): Promise<GalleryItem[]>;
  getTrashedGalleryItemsByCategory(category: string): Promise<GalleryItem[]>;
  createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: number, updates: UpdateGalleryItem): Promise<GalleryItem | null>;
  deleteGalleryItem(id: number): Promise<boolean>;

  // CV Data
  getCVData(): Promise<CVData | null>;
  createCVData(cv: InsertCVData): Promise<CVData>;
  deleteCVData(): Promise<boolean>;

  // Writings
  getWritings(): Promise<Writing[]>;
  getWritingById(id: number): Promise<Writing | null>;
  createWriting(writing: InsertWriting): Promise<Writing>;
  updateWriting(id: number, updates: UpdateWriting): Promise<Writing | null>;
  deleteWriting(id: number): Promise<boolean>;

  // Albums
  getAlbums(): Promise<Album[]>;
  getAlbumById(id: number): Promise<Album | null>;
  createAlbum(album: InsertAlbum): Promise<Album>;
  updateAlbum(id: number, updates: UpdateAlbum): Promise<Album | null>;
  deleteAlbum(id: number): Promise<boolean>;

  // Tags
  getTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | null>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, updates: UpdateTag): Promise<Tag | null>;
  deleteTag(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project> = new Map();
  private galleryItems: Map<number, GalleryItem> = new Map();
  private cvData: CVData | null = null;
  private writings: Map<number, Writing> = new Map();
  private albums: Map<number, Album> = new Map();
  private tags: Map<number, Tag> = new Map();

  private projectIdCounter = 1;
  private galleryIdCounter = 1;
  private cvIdCounter = 1;
  private writingIdCounter = 1;
  private albumIdCounter = 1;
  private tagIdCounter = 1;

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectById(id: number): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async getProjectsByCategory(category: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.category === category
    );
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: this.projectIdCounter++,
      title: project.title,
      description: project.description,
      image: project.image,
      category: project.category,
      subcategory: project.subcategory,
      isPrivate: project.isPrivate ?? false,
      tags: project.tags ?? [],
      projectType: project.projectType ?? null,
      icon: project.icon ?? null,
      images: project.images ?? [],
      hoursWorked: project.hoursWorked ?? null,
      frontendTech: project.frontendTech ?? [],
      backendTech: project.backendTech ?? [],
      initialReleaseDate: project.initialReleaseDate ?? null,
      lastUpdatedDate: project.lastUpdatedDate ?? null,
      additionalFiles: project.additionalFiles ?? [],
      gitUrl: project.gitUrl ?? null,
      projectUrl: project.projectUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(newProject.id, newProject);
    return newProject;
  }

  async updateProject(
    id: number,
    updates: UpdateProject
  ): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project) return null;

    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Gallery Items
  async getGalleryItems(): Promise<GalleryItem[]> {
    return Array.from(this.galleryItems.values());
  }

  async getGalleryItemById(id: number): Promise<GalleryItem | null> {
    return this.galleryItems.get(id) || null;
  }

  async getGalleryItemsByCategory(category: string): Promise<GalleryItem[]> {
    return Array.from(this.galleryItems.values()).filter(
      (item) => item.category === category
    );
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const newItem: GalleryItem = {
      id: this.galleryIdCounter++,
      title: item.title,
      image: item.image,
      category: item.category,
      subcategory: item.subcategory,
      isPrivate: item.isPrivate ?? false,
      medium: item.medium ?? null,
      description: item.description ?? null,
      materials: item.materials ?? [],
      device: item.device ?? null,
      location: item.location ?? null,
      dimensions: item.dimensions ?? null,
      date: item.date ?? null,
      deletedAt: item.deletedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.galleryItems.set(newItem.id, newItem);
    return newItem;
  }

  async getTrashedGalleryItems(): Promise<GalleryItem[]> {
    return Array.from(this.galleryItems.values()).filter(item => item.deletedAt !== null);
  }

  async getTrashedGalleryItemsByCategory(category: string): Promise<GalleryItem[]> {
    return Array.from(this.galleryItems.values()).filter(item => item.category === category && item.deletedAt !== null);
  }

  async updateGalleryItem(
    id: number,
    updates: UpdateGalleryItem
  ): Promise<GalleryItem | null> {
    const item = this.galleryItems.get(id);
    if (!item) return null;

    const updatedItem: GalleryItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    this.galleryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteGalleryItem(id: number): Promise<boolean> {
    return this.galleryItems.delete(id);
  }

  // CV Data
  async getCVData(): Promise<CVData | null> {
    return this.cvData;
  }

  async createCVData(cv: InsertCVData): Promise<CVData> {
    const newCV: CVData = {
      id: this.cvIdCounter++,
      fileName: cv.fileName,
      fileUrl: cv.fileUrl,
      cloudinaryPublicId: cv.cloudinaryPublicId,
      mimeType: cv.mimeType ?? 'application/pdf',
      uploadedAt: new Date(),
    };
    this.cvData = newCV;
    return newCV;
  }

  async deleteCVData(): Promise<boolean> {
    if (!this.cvData) return false;
    this.cvData = null;
    return true;
  }

  // Writings
  async getWritings(): Promise<Writing[]> {
    return Array.from(this.writings.values());
  }

  async getWritingById(id: number): Promise<Writing | null> {
    return this.writings.get(id) || null;
  }

  async createWriting(writing: InsertWriting): Promise<Writing> {
    const newWriting: Writing = {
      id: this.writingIdCounter++,
      title: writing.title,
      type: writing.type,
      content: writing.content,
      excerpt: writing.excerpt,
      wordCount: writing.wordCount ?? 0,
      dateWritten: writing.dateWritten,
      lastModified: writing.lastModified,
      tags: writing.tags ?? [],
      mood: writing.mood,
      isPrivate: writing.isPrivate ?? false,
      published: writing.published ?? false,
      deletedAt: writing.deletedAt ?? null,
    };
    this.writings.set(newWriting.id, newWriting);
    return newWriting;
  }

  async updateWriting(
    id: number,
    updates: UpdateWriting
  ): Promise<Writing | null> {
    const writing = this.writings.get(id);
    if (!writing) return null;

    const updatedWriting: Writing = {
      ...writing,
      ...updates,
    };
    this.writings.set(id, updatedWriting);
    return updatedWriting;
  }

  async deleteWriting(id: number): Promise<boolean> {
    return this.writings.delete(id);
  }

  // Albums
  async getAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async getAlbumById(id: number): Promise<Album | null> {
    return this.albums.get(id) || null;
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const newAlbum: Album = {
      id: this.albumIdCounter++,
      name: album.name,
      color: album.color ?? null,
      icon: album.icon ?? null,
      itemIds: album.itemIds ?? [],
      contentType: album.contentType ?? null,
    };
    this.albums.set(newAlbum.id, newAlbum);
    return newAlbum;
  }

  async updateAlbum(
    id: number,
    updates: UpdateAlbum
  ): Promise<Album | null> {
    const album = this.albums.get(id);
    if (!album) return null;

    const updatedAlbum: Album = {
      ...album,
      ...updates,
    };
    this.albums.set(id, updatedAlbum);
    return updatedAlbum;
  }

  async deleteAlbum(id: number): Promise<boolean> {
    return this.albums.delete(id);
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagById(id: number): Promise<Tag | null> {
    return this.tags.get(id) || null;
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const newTag: Tag = {
      id: this.tagIdCounter++,
      name: tag.name,
      type: tag.type,
      sentiment: tag.sentiment ?? null,
    };
    this.tags.set(newTag.id, newTag);
    return newTag;
  }

  async updateTag(id: number, updates: UpdateTag): Promise<Tag | null> {
    const tag = this.tags.get(id);
    if (!tag) return null;

    const updatedTag: Tag = {
      ...tag,
      ...updates,
    };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteTag(id: number): Promise<boolean> {
    return this.tags.delete(id);
  }
}

// Database Storage implementation using Drizzle ORM
import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { and, eq, isNull, sql } from "drizzle-orm";

const { projects, galleryItems, cvData, writings, albums, tags } = schema;

export class DbStorage implements IStorage {
  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProjectById(id: number): Promise<Project | null> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0] || null;
  }

  async getProjectsByCategory(category: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.category, category));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const base: InsertProject = {
      ...project,
      isPrivate: project.isPrivate ?? false,
      tags: project.tags ?? [],
      projectType: project.projectType ?? null,
      icon: project.icon ?? null,
      images: project.images ?? [],
      hoursWorked: project.hoursWorked ?? null,
      frontendTech: project.frontendTech ?? [],
      backendTech: project.backendTech ?? [],
      initialReleaseDate: project.initialReleaseDate ?? null,
      lastUpdatedDate: project.lastUpdatedDate ?? null,
      additionalFiles: project.additionalFiles ?? [],
      gitUrl: project.gitUrl ?? null,
      projectUrl: project.projectUrl ?? null,
    };
    const result = await db.insert(projects).values(base).returning();
    return result[0];
  }

  async updateProject(id: number, updates: UpdateProject): Promise<Project | null> {
    const result = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Gallery Items
  async getGalleryItems(): Promise<GalleryItem[]> {
    // Exclude soft-deleted items
    return await db.select().from(galleryItems).where(isNull(galleryItems.deletedAt));
  }

  async getGalleryItemById(id: number): Promise<GalleryItem | null> {
    const result = await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.id, id));
    return result[0] || null;
  }

  async getGalleryItemsByCategory(category: string): Promise<GalleryItem[]> {
    // Exclude soft-deleted items for category
    return await db
      .select()
      .from(galleryItems)
      .where(and(eq(galleryItems.category, category), isNull(galleryItems.deletedAt)));
  }

  async getTrashedGalleryItems(): Promise<GalleryItem[]> {
    return await db
      .select()
      .from(galleryItems)
      .where(sql`"deleted_at" IS NOT NULL`);
  }

  async getTrashedGalleryItemsByCategory(category: string): Promise<GalleryItem[]> {
    return await db
      .select()
      .from(galleryItems)
      .where(and(eq(galleryItems.category, category), sql`"deleted_at" IS NOT NULL`));
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const base: InsertGalleryItem = {
      ...item,
      isPrivate: item.isPrivate ?? false,
      medium: item.medium ?? null,
      description: item.description ?? null,
      materials: item.materials ?? [],
      dimensions: item.dimensions ?? null,
      date: item.date ?? null,
      device: item.device ?? null,
      location: item.location ?? null,
      deletedAt: item.deletedAt ?? null,
    };
    const result = await db.insert(galleryItems).values(base).returning();
    return result[0];
  }

  async updateGalleryItem(id: number, updates: UpdateGalleryItem): Promise<GalleryItem | null> {
    const sanitizedUpdates: UpdateGalleryItem = { ...updates };

    if ("device" in sanitizedUpdates) {
      sanitizedUpdates.device = sanitizedUpdates.device ?? null;
    }

    if ("location" in sanitizedUpdates) {
      sanitizedUpdates.location = sanitizedUpdates.location ?? null;
    }

    const result = await db
      .update(galleryItems)
      .set({ ...sanitizedUpdates, updatedAt: new Date() })
      .where(eq(galleryItems.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteGalleryItem(id: number): Promise<boolean> {
    const result = await db.delete(galleryItems).where(eq(galleryItems.id, id)).returning();
    return result.length > 0;
  }

  // CV Data
  async getCVData(): Promise<CVData | null> {
    const result = await db.select().from(cvData).limit(1);
    return result[0] || null;
  }

  async createCVData(cv: InsertCVData): Promise<CVData> {
    // Delete existing CV first
    await db.delete(cvData);
    const result = await db.insert(cvData).values(cv).returning();
    return result[0];
  }

  async deleteCVData(): Promise<boolean> {
    const result = await db.delete(cvData).returning();
    return result.length > 0;
  }

  // Writings
  async getWritings(): Promise<Writing[]> {
    return await db.select().from(writings);
  }

  async getWritingById(id: number): Promise<Writing | null> {
    const result = await db.select().from(writings).where(eq(writings.id, id));
    return result[0] || null;
  }

  async createWriting(writing: InsertWriting): Promise<Writing> {
    const result = await db.insert(writings).values(writing).returning();
    return result[0];
  }

  async updateWriting(id: number, updates: UpdateWriting): Promise<Writing | null> {
    const result = await db
      .update(writings)
      .set(updates)
      .where(eq(writings.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteWriting(id: number): Promise<boolean> {
    const result = await db.delete(writings).where(eq(writings.id, id)).returning();
    return result.length > 0;
  }

  // Albums
  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums);
  }

  async getAlbumById(id: number): Promise<Album | null> {
    const result = await db.select().from(albums).where(eq(albums.id, id));
    return result[0] || null;
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const result = await db.insert(albums).values(album).returning();
    return result[0];
  }

  async updateAlbum(id: number, updates: UpdateAlbum): Promise<Album | null> {
    const result = await db
      .update(albums)
      .set(updates)
      .where(eq(albums.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteAlbum(id: number): Promise<boolean> {
    const result = await db.delete(albums).where(eq(albums.id, id)).returning();
    return result.length > 0;
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTagById(id: number): Promise<Tag | null> {
    const result = await db.select().from(tags).where(eq(tags.id, id));
    return result[0] || null;
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const result = await db.insert(tags).values(tag).returning();
    return result[0];
  }

  async updateTag(id: number, updates: UpdateTag): Promise<Tag | null> {
    const result = await db
      .update(tags)
      .set(updates)
      .where(eq(tags.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteTag(id: number): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id)).returning();
    return result.length > 0;
  }
}
