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
} from "@shared/schema";

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
      ...project,
      id: this.projectIdCounter++,
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
      ...item,
      id: this.galleryIdCounter++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.galleryItems.set(newItem.id, newItem);
    return newItem;
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
      ...cv,
      id: this.cvIdCounter++,
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
      ...writing,
      id: this.writingIdCounter++,
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
      ...album,
      id: this.albumIdCounter++,
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
      ...tag,
      id: this.tagIdCounter++,
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
