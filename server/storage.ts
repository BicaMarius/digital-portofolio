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
  PhotoLocation,
  InsertPhotoLocation,
  UpdatePhotoLocation,
  PhotoDevice,
  InsertPhotoDevice,
  UpdatePhotoDevice,
  MusicTrack,
  InsertMusicTrack,
  UpdateMusicTrack,
  MusicAlbum,
  InsertMusicAlbum,
  UpdateMusicAlbum,
  SpotifyFavorite,
  InsertSpotifyFavorite,
  UpdateSpotifyFavorite,
  FilmItem,
  InsertFilmItem,
  UpdateFilmItem,
  NoteItem,
  InsertNoteItem,
  UpdateNoteItem,
  FilmGenre,
  InsertFilmGenre,
  UpdateFilmGenre,
  BookItem,
  InsertBookItem,
  UpdateBookItem,
  GameItem,
  InsertGameItem,
  UpdateGameItem,
  SkillTreeNode,
  InsertSkillTreeNode,
  UpdateSkillTreeNode,
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

  // Photo Locations
  getPhotoLocations(): Promise<PhotoLocation[]>;
  getPhotoLocationById(id: number): Promise<PhotoLocation | null>;
  createPhotoLocation(location: InsertPhotoLocation): Promise<PhotoLocation>;
  updatePhotoLocation(id: number, updates: UpdatePhotoLocation): Promise<PhotoLocation | null>;
  deletePhotoLocation(id: number): Promise<boolean>;

  // Photo Devices
  getPhotoDevices(): Promise<PhotoDevice[]>;
  getPhotoDeviceById(id: number): Promise<PhotoDevice | null>;
  createPhotoDevice(device: InsertPhotoDevice): Promise<PhotoDevice>;
  updatePhotoDevice(id: number, updates: UpdatePhotoDevice): Promise<PhotoDevice | null>;
  deletePhotoDevice(id: number): Promise<boolean>;

  // Music Tracks
  getMusicTracks(): Promise<MusicTrack[]>;
  getMusicTrackById(id: number): Promise<MusicTrack | null>;
  getTrashedMusicTracks(): Promise<MusicTrack[]>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
  updateMusicTrack(id: number, updates: UpdateMusicTrack): Promise<MusicTrack | null>;
  deleteMusicTrack(id: number): Promise<boolean>;

  // Music Albums
  getMusicAlbums(): Promise<MusicAlbum[]>;
  getMusicAlbum(id: number): Promise<MusicAlbum | null>;
  getTrashedMusicAlbums(): Promise<MusicAlbum[]>;
  createMusicAlbum(album: InsertMusicAlbum): Promise<MusicAlbum>;
  updateMusicAlbum(id: number, updates: UpdateMusicAlbum): Promise<MusicAlbum | null>;
  deleteMusicAlbum(id: number): Promise<boolean>;

  // Spotify Favorites
  getSpotifyFavorites(): Promise<SpotifyFavorite[]>;
  getSpotifyFavoriteById(id: number): Promise<SpotifyFavorite | null>;
  getSpotifyFavoritesByListType(listType: string): Promise<SpotifyFavorite[]>;
  getTrashedSpotifyFavorites(): Promise<SpotifyFavorite[]>;
  createSpotifyFavorite(favorite: InsertSpotifyFavorite): Promise<SpotifyFavorite>;
  updateSpotifyFavorite(id: number, updates: UpdateSpotifyFavorite): Promise<SpotifyFavorite | null>;
  deleteSpotifyFavorite(id: number): Promise<boolean>;

  // Film Items
  getFilmItems(): Promise<FilmItem[]>;
  getFilmItemById(id: number): Promise<FilmItem | null>;
  getFilmItemsByStatus(status: string): Promise<FilmItem[]>;
  getTrashedFilmItems(): Promise<FilmItem[]>;
  createFilmItem(film: InsertFilmItem): Promise<FilmItem>;
  updateFilmItem(id: number, updates: UpdateFilmItem): Promise<FilmItem | null>;
  deleteFilmItem(id: number): Promise<boolean>;

  // Note Items
  getNoteItems(): Promise<NoteItem[]>;
  getNoteItemById(id: number): Promise<NoteItem | null>;
  getNoteItemsByType(type: string): Promise<NoteItem[]>;
  getTrashedNoteItems(): Promise<NoteItem[]>;
  createNoteItem(note: InsertNoteItem): Promise<NoteItem>;
  updateNoteItem(id: number, updates: UpdateNoteItem): Promise<NoteItem | null>;
  deleteNoteItem(id: number): Promise<boolean>;

  // Film Genres
  getFilmGenres(): Promise<FilmGenre[]>;
  getFilmGenreById(id: number): Promise<FilmGenre | null>;
  createFilmGenre(genre: InsertFilmGenre): Promise<FilmGenre>;
  updateFilmGenre(id: number, updates: UpdateFilmGenre): Promise<FilmGenre | null>;
  deleteFilmGenre(id: number): Promise<boolean>;

  // Book Items
  getBookItems(): Promise<BookItem[]>;
  getBookItemById(id: number): Promise<BookItem | null>;
  getBookItemsByStatus(status: string): Promise<BookItem[]>;
  getTrashedBookItems(): Promise<BookItem[]>;
  createBookItem(book: InsertBookItem): Promise<BookItem>;
  updateBookItem(id: number, updates: UpdateBookItem): Promise<BookItem | null>;
  deleteBookItem(id: number): Promise<boolean>;

  // Game Items
  getGameItems(): Promise<GameItem[]>;
  getGameItemById(id: number): Promise<GameItem | null>;
  getGameItemsByStatus(status: string): Promise<GameItem[]>;
  getTrashedGameItems(): Promise<GameItem[]>;
  createGameItem(game: InsertGameItem): Promise<GameItem>;
  updateGameItem(id: number, updates: UpdateGameItem): Promise<GameItem | null>;
  deleteGameItem(id: number): Promise<boolean>;

  // Skill Tree Nodes
  getSkillTreeNodes(): Promise<SkillTreeNode[]>;
  getSkillTreeNodeById(id: number): Promise<SkillTreeNode | null>;
  createSkillTreeNode(node: InsertSkillTreeNode): Promise<SkillTreeNode>;
  updateSkillTreeNode(id: number, updates: UpdateSkillTreeNode): Promise<SkillTreeNode | null>;
  deleteSkillTreeNode(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project> = new Map();
  private galleryItems: Map<number, GalleryItem> = new Map();
  private cvData: CVData | null = null;
  private writings: Map<number, Writing> = new Map();
  private albums: Map<number, Album> = new Map();
  private tags: Map<number, Tag> = new Map();
  private photoLocations: Map<number, PhotoLocation> = new Map();
  private photoDevices: Map<number, PhotoDevice> = new Map();

  private projectIdCounter = 1;
  private galleryIdCounter = 1;
  private cvIdCounter = 1;
  private writingIdCounter = 1;
  private albumIdCounter = 1;
  private tagIdCounter = 1;
  private photoLocationIdCounter = 1;
  private photoDeviceIdCounter = 1;

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
      deletedAt: null,
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

  // Photo Locations
  async getPhotoLocations(): Promise<PhotoLocation[]> {
    return Array.from(this.photoLocations.values());
  }

  async getPhotoLocationById(id: number): Promise<PhotoLocation | null> {
    return this.photoLocations.get(id) || null;
  }

  async createPhotoLocation(location: InsertPhotoLocation): Promise<PhotoLocation> {
    const newLocation: PhotoLocation = {
      id: this.photoLocationIdCounter++,
      name: location.name,
    };
    this.photoLocations.set(newLocation.id, newLocation);
    return newLocation;
  }

  async updatePhotoLocation(id: number, updates: UpdatePhotoLocation): Promise<PhotoLocation | null> {
    const location = this.photoLocations.get(id);
    if (!location) return null;

    const updatedLocation: PhotoLocation = {
      ...location,
      ...updates,
    };
    this.photoLocations.set(id, updatedLocation);
    return updatedLocation;
  }

  async deletePhotoLocation(id: number): Promise<boolean> {
    return this.photoLocations.delete(id);
  }

  // Photo Devices
  async getPhotoDevices(): Promise<PhotoDevice[]> {
    return Array.from(this.photoDevices.values());
  }

  async getPhotoDeviceById(id: number): Promise<PhotoDevice | null> {
    return this.photoDevices.get(id) || null;
  }

  async createPhotoDevice(device: InsertPhotoDevice): Promise<PhotoDevice> {
    const newDevice: PhotoDevice = {
      id: this.photoDeviceIdCounter++,
      name: device.name,
    };
    this.photoDevices.set(newDevice.id, newDevice);
    return newDevice;
  }

  async updatePhotoDevice(id: number, updates: UpdatePhotoDevice): Promise<PhotoDevice | null> {
    const device = this.photoDevices.get(id);
    if (!device) return null;

    const updatedDevice: PhotoDevice = {
      ...device,
      ...updates,
    };
    this.photoDevices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deletePhotoDevice(id: number): Promise<boolean> {
    return this.photoDevices.delete(id);
  }

  // Music Tracks - MemStorage placeholders
  private musicTracks: Map<number, MusicTrack> = new Map();
  private musicTrackIdCounter = 1;
  
  async getMusicTracks(): Promise<MusicTrack[]> {
    return Array.from(this.musicTracks.values()).filter(t => !t.deletedAt);
  }
  async getMusicTrackById(id: number): Promise<MusicTrack | null> {
    return this.musicTracks.get(id) || null;
  }
  async getTrashedMusicTracks(): Promise<MusicTrack[]> {
    return Array.from(this.musicTracks.values()).filter(t => t.deletedAt !== null);
  }
  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const newTrack: MusicTrack = {
      id: this.musicTrackIdCounter++,
      title: track.title,
      artist: track.artist,
      album: track.album ?? null,
      audioUrl: track.audioUrl,
      coverUrl: track.coverUrl ?? null,
      lyricsUrl: track.lyricsUrl ?? null,
      duration: track.duration ?? null,
      genre: track.genre ?? null,
      year: track.year ?? null,
      isPrivate: track.isPrivate ?? false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.musicTracks.set(newTrack.id, newTrack);
    return newTrack;
  }
  async updateMusicTrack(id: number, updates: UpdateMusicTrack): Promise<MusicTrack | null> {
    const track = this.musicTracks.get(id);
    if (!track) return null;
    const updated = { ...track, ...updates, updatedAt: new Date() };
    this.musicTracks.set(id, updated);
    return updated;
  }
  async deleteMusicTrack(id: number): Promise<boolean> {
    return this.musicTracks.delete(id);
  }

  // Music Albums - MemStorage placeholders
  private musicAlbums: Map<number, MusicAlbum> = new Map();
  private musicAlbumIdCounter = 1;

  async getMusicAlbums(): Promise<MusicAlbum[]> {
    return Array.from(this.musicAlbums.values()).filter(a => !a.deletedAt);
  }
  async getMusicAlbum(id: number): Promise<MusicAlbum | null> {
    return this.musicAlbums.get(id) || null;
  }
  async getTrashedMusicAlbums(): Promise<MusicAlbum[]> {
    return Array.from(this.musicAlbums.values()).filter(a => a.deletedAt !== null);
  }
  async createMusicAlbum(album: InsertMusicAlbum): Promise<MusicAlbum> {
    const newAlbum: MusicAlbum = {
      id: this.musicAlbumIdCounter++,
      name: album.name,
      description: album.description ?? null,
      coverUrl: album.coverUrl ?? null,
      color: album.color ?? null,
      year: album.year ?? null,
      trackIds: album.trackIds ?? [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.musicAlbums.set(newAlbum.id, newAlbum);
    return newAlbum;
  }
  async updateMusicAlbum(id: number, updates: UpdateMusicAlbum): Promise<MusicAlbum | null> {
    const album = this.musicAlbums.get(id);
    if (!album) return null;
    const updated = { ...album, ...updates, updatedAt: new Date() };
    this.musicAlbums.set(id, updated);
    return updated;
  }
  async deleteMusicAlbum(id: number): Promise<boolean> {
    return this.musicAlbums.delete(id);
  }

  // Spotify Favorites - MemStorage placeholders
  private spotifyFavorites: Map<number, SpotifyFavorite> = new Map();
  private spotifyFavoriteIdCounter = 1;

  async getSpotifyFavorites(): Promise<SpotifyFavorite[]> {
    return Array.from(this.spotifyFavorites.values()).filter(f => !f.deletedAt);
  }
  async getSpotifyFavoriteById(id: number): Promise<SpotifyFavorite | null> {
    return this.spotifyFavorites.get(id) || null;
  }
  async getSpotifyFavoritesByListType(listType: string): Promise<SpotifyFavorite[]> {
    return Array.from(this.spotifyFavorites.values()).filter(f => f.listType === listType && !f.deletedAt);
  }
  async getTrashedSpotifyFavorites(): Promise<SpotifyFavorite[]> {
    return Array.from(this.spotifyFavorites.values()).filter(f => f.deletedAt !== null);
  }
  async createSpotifyFavorite(favorite: InsertSpotifyFavorite): Promise<SpotifyFavorite> {
    const newFavorite: SpotifyFavorite = {
      id: this.spotifyFavoriteIdCounter++,
      spotifyId: favorite.spotifyId,
      type: favorite.type,
      name: favorite.name,
      artist: favorite.artist ?? null,
      albumName: favorite.albumName ?? null,
      imageUrl: favorite.imageUrl ?? null,
      spotifyUrl: favorite.spotifyUrl ?? null,
      previewUrl: favorite.previewUrl ?? null,
      rank: favorite.rank ?? null,
      listType: favorite.listType ?? null,
      deletedAt: null,
      createdAt: new Date(),
    };
    this.spotifyFavorites.set(newFavorite.id, newFavorite);
    return newFavorite;
  }
  async updateSpotifyFavorite(id: number, updates: UpdateSpotifyFavorite): Promise<SpotifyFavorite | null> {
    const fav = this.spotifyFavorites.get(id);
    if (!fav) return null;
    const updated = { ...fav, ...updates };
    this.spotifyFavorites.set(id, updated);
    return updated;
  }
  async deleteSpotifyFavorite(id: number): Promise<boolean> {
    return this.spotifyFavorites.delete(id);
  }

  // Film Items - MemStorage placeholders
  private filmItems: Map<number, FilmItem> = new Map();
  private filmItemIdCounter = 1;

  async getFilmItems(): Promise<FilmItem[]> {
    return Array.from(this.filmItems.values()).filter(f => !f.deletedAt);
  }
  async getFilmItemById(id: number): Promise<FilmItem | null> {
    return this.filmItems.get(id) || null;
  }
  async getFilmItemsByStatus(status: string): Promise<FilmItem[]> {
    return Array.from(this.filmItems.values()).filter(f => f.status === status && !f.deletedAt);
  }
  async getTrashedFilmItems(): Promise<FilmItem[]> {
    return Array.from(this.filmItems.values()).filter(f => f.deletedAt !== null);
  }
  async createFilmItem(film: InsertFilmItem): Promise<FilmItem> {
    const newFilm: FilmItem = {
      id: this.filmItemIdCounter++,
      title: film.title,
      director: film.director ?? null,
      year: film.year ?? null,
      posterUrl: film.posterUrl ?? null,
      tmdbId: film.tmdbId ?? null,
      status: film.status ?? "to-watch",
      rating: film.rating ?? null,
      notes: film.notes ?? null,
      watchedDate: film.watchedDate ?? null,
      genre: film.genre ?? [],
      runtime: film.runtime ?? null,
      isPrivate: film.isPrivate ?? false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.filmItems.set(newFilm.id, newFilm);
    return newFilm;
  }
  async updateFilmItem(id: number, updates: UpdateFilmItem): Promise<FilmItem | null> {
    const film = this.filmItems.get(id);
    if (!film) return null;
    const updated = { ...film, ...updates, updatedAt: new Date() };
    this.filmItems.set(id, updated);
    return updated;
  }
  async deleteFilmItem(id: number): Promise<boolean> {
    return this.filmItems.delete(id);
  }

  // Note Items - MemStorage placeholders
  private noteItems: Map<number, NoteItem> = new Map();
  private noteItemIdCounter = 1;

  async getNoteItems(): Promise<NoteItem[]> {
    return Array.from(this.noteItems.values()).filter(n => !n.deletedAt);
  }
  async getNoteItemById(id: number): Promise<NoteItem | null> {
    return this.noteItems.get(id) || null;
  }
  async getNoteItemsByType(type: string): Promise<NoteItem[]> {
    return Array.from(this.noteItems.values()).filter(n => n.type === type && !n.deletedAt);
  }
  async getTrashedNoteItems(): Promise<NoteItem[]> {
    return Array.from(this.noteItems.values()).filter(n => n.deletedAt !== null);
  }
  async createNoteItem(note: InsertNoteItem): Promise<NoteItem> {
    const newNote: NoteItem = {
      id: this.noteItemIdCounter++,
      type: note.type,
      title: note.title,
      content: note.content ?? null,
      imageUrl: note.imageUrl ?? null,
      prepTime: note.prepTime ?? null,
      cookTime: note.cookTime ?? null,
      servings: note.servings ?? null,
      difficulty: note.difficulty ?? null,
      cuisine: note.cuisine ?? null,
      author: note.author ?? null,
      source: note.source ?? null,
      completed: note.completed ?? false,
      isPrivate: note.isPrivate ?? false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.noteItems.set(newNote.id, newNote);
    return newNote;
  }
  async updateNoteItem(id: number, updates: UpdateNoteItem): Promise<NoteItem | null> {
    const note = this.noteItems.get(id);
    if (!note) return null;
    const updated = { ...note, ...updates, updatedAt: new Date() };
    this.noteItems.set(id, updated);
    return updated;
  }
  async deleteNoteItem(id: number): Promise<boolean> {
    return this.noteItems.delete(id);
  }

  // Film Genres - MemStorage placeholders
  private filmGenres: Map<number, FilmGenre> = new Map();
  private filmGenreIdCounter = 1;

  async getFilmGenres(): Promise<FilmGenre[]> {
    return Array.from(this.filmGenres.values());
  }

  async getFilmGenreById(id: number): Promise<FilmGenre | null> {
    return this.filmGenres.get(id) || null;
  }

  async createFilmGenre(genre: InsertFilmGenre): Promise<FilmGenre> {
    const newGenre: FilmGenre = {
      id: this.filmGenreIdCounter++,
      name: genre.name,
    };
    this.filmGenres.set(newGenre.id, newGenre);
    return newGenre;
  }

  async updateFilmGenre(id: number, updates: UpdateFilmGenre): Promise<FilmGenre | null> {
    const genre = this.filmGenres.get(id);
    if (!genre) return null;
    const updated = { ...genre, ...updates };
    this.filmGenres.set(id, updated);
    return updated;
  }

  async deleteFilmGenre(id: number): Promise<boolean> {
    return this.filmGenres.delete(id);
  }

  // ======== BOOK ITEMS (MemStorage stubs) ========
  private bookItemsMap: Map<number, BookItem> = new Map();
  private bookIdCounter = 1;
  async getBookItems(): Promise<BookItem[]> { return Array.from(this.bookItemsMap.values()).filter(b => !b.deletedAt); }
  async getBookItemById(id: number): Promise<BookItem | null> { return this.bookItemsMap.get(id) || null; }
  async getBookItemsByStatus(status: string): Promise<BookItem[]> { return Array.from(this.bookItemsMap.values()).filter(b => b.status === status && !b.deletedAt); }
  async getTrashedBookItems(): Promise<BookItem[]> { return Array.from(this.bookItemsMap.values()).filter(b => !!b.deletedAt); }
  async createBookItem(book: InsertBookItem): Promise<BookItem> {
    const nb = { ...book, id: this.bookIdCounter++, genre: book.genre ?? [], isPrivate: book.isPrivate ?? false, deletedAt: null, createdAt: new Date(), updatedAt: new Date() } as BookItem;
    this.bookItemsMap.set(nb.id, nb); return nb;
  }
  async updateBookItem(id: number, updates: UpdateBookItem): Promise<BookItem | null> {
    const b = this.bookItemsMap.get(id); if (!b) return null; const u = { ...b, ...updates, updatedAt: new Date() }; this.bookItemsMap.set(id, u); return u;
  }
  async deleteBookItem(id: number): Promise<boolean> { return this.bookItemsMap.delete(id); }

  // ======== GAME ITEMS (MemStorage stubs) ========
  private gameItemsMap: Map<number, GameItem> = new Map();
  private gameIdCounter = 1;
  async getGameItems(): Promise<GameItem[]> { return Array.from(this.gameItemsMap.values()).filter(g => !g.deletedAt); }
  async getGameItemById(id: number): Promise<GameItem | null> { return this.gameItemsMap.get(id) || null; }
  async getGameItemsByStatus(status: string): Promise<GameItem[]> { return Array.from(this.gameItemsMap.values()).filter(g => g.status === status && !g.deletedAt); }
  async getTrashedGameItems(): Promise<GameItem[]> { return Array.from(this.gameItemsMap.values()).filter(g => !!g.deletedAt); }
  async createGameItem(game: InsertGameItem): Promise<GameItem> {
    const ng = { ...game, id: this.gameIdCounter++, genre: game.genre ?? [], isPrivate: game.isPrivate ?? false, deletedAt: null, createdAt: new Date(), updatedAt: new Date() } as GameItem;
    this.gameItemsMap.set(ng.id, ng); return ng;
  }
  async updateGameItem(id: number, updates: UpdateGameItem): Promise<GameItem | null> {
    const g = this.gameItemsMap.get(id); if (!g) return null; const u = { ...g, ...updates, updatedAt: new Date() }; this.gameItemsMap.set(id, u); return u;
  }
  async deleteGameItem(id: number): Promise<boolean> { return this.gameItemsMap.delete(id); }

  // ======== SKILL TREE (MemStorage stubs) ========
  private skillNodesMap: Map<number, SkillTreeNode> = new Map();
  private skillNodeIdCounter = 1;
  async getSkillTreeNodes(): Promise<SkillTreeNode[]> { return Array.from(this.skillNodesMap.values()).sort((a, b) => a.nodeOrder - b.nodeOrder); }
  async getSkillTreeNodeById(id: number): Promise<SkillTreeNode | null> { return this.skillNodesMap.get(id) || null; }
  async createSkillTreeNode(node: InsertSkillTreeNode): Promise<SkillTreeNode> {
    const nn = { ...node, id: this.skillNodeIdCounter++, createdAt: new Date(), updatedAt: new Date() } as SkillTreeNode;
    this.skillNodesMap.set(nn.id, nn); return nn;
  }
  async updateSkillTreeNode(id: number, updates: UpdateSkillTreeNode): Promise<SkillTreeNode | null> {
    const n = this.skillNodesMap.get(id); if (!n) return null; const u = { ...n, ...updates, updatedAt: new Date() }; this.skillNodesMap.set(id, u); return u;
  }
  async deleteSkillTreeNode(id: number): Promise<boolean> { return this.skillNodesMap.delete(id); }
}


// Database Storage implementation using Drizzle ORM
import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";

const { projects, galleryItems, cvData, writings, albums, tags, photoLocations, photoDevices, musicTracks, musicAlbums, spotifyFavorites, filmItems, noteItems, filmGenres, bookItems, gameItems, skillTreeNodes } = schema;

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
      .where(isNotNull(galleryItems.deletedAt));
  }

  async getTrashedGalleryItemsByCategory(category: string): Promise<GalleryItem[]> {
    return await db
      .select()
      .from(galleryItems)
      .where(and(eq(galleryItems.category, category), isNotNull(galleryItems.deletedAt)));
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

  // Photo Locations
  async getPhotoLocations(): Promise<PhotoLocation[]> {
    return await db.select().from(photoLocations);
  }

  async getPhotoLocationById(id: number): Promise<PhotoLocation | null> {
    const result = await db.select().from(photoLocations).where(eq(photoLocations.id, id));
    return result[0] || null;
  }

  async createPhotoLocation(location: InsertPhotoLocation): Promise<PhotoLocation> {
    const result = await db.insert(photoLocations).values(location).returning();
    return result[0];
  }

  async updatePhotoLocation(id: number, updates: UpdatePhotoLocation): Promise<PhotoLocation | null> {
    const result = await db
      .update(photoLocations)
      .set(updates)
      .where(eq(photoLocations.id, id))
      .returning();
    return result[0] || null;
  }

  async deletePhotoLocation(id: number): Promise<boolean> {
    const result = await db.delete(photoLocations).where(eq(photoLocations.id, id)).returning();
    return result.length > 0;
  }

  // Photo Devices
  async getPhotoDevices(): Promise<PhotoDevice[]> {
    return await db.select().from(photoDevices);
  }

  async getPhotoDeviceById(id: number): Promise<PhotoDevice | null> {
    const result = await db.select().from(photoDevices).where(eq(photoDevices.id, id));
    return result[0] || null;
  }

  async createPhotoDevice(device: InsertPhotoDevice): Promise<PhotoDevice> {
    const result = await db.insert(photoDevices).values(device).returning();
    return result[0];
  }

  async updatePhotoDevice(id: number, updates: UpdatePhotoDevice): Promise<PhotoDevice | null> {
    const result = await db
      .update(photoDevices)
      .set(updates)
      .where(eq(photoDevices.id, id))
      .returning();
    return result[0] || null;
  }

  async deletePhotoDevice(id: number): Promise<boolean> {
    const result = await db.delete(photoDevices).where(eq(photoDevices.id, id)).returning();
    return result.length > 0;
  }

  // Music Tracks
  async getMusicTracks(): Promise<MusicTrack[]> {
    return await db.select().from(musicTracks).where(isNull(musicTracks.deletedAt));
  }

  async getMusicTrackById(id: number): Promise<MusicTrack | null> {
    const result = await db.select().from(musicTracks).where(eq(musicTracks.id, id));
    return result[0] || null;
  }

  async getTrashedMusicTracks(): Promise<MusicTrack[]> {
    return await db.select().from(musicTracks).where(isNotNull(musicTracks.deletedAt));
  }

  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const result = await db.insert(musicTracks).values({
      ...track,
      isPrivate: track.isPrivate ?? false,
      deletedAt: null,
    }).returning();
    return result[0];
  }

  async updateMusicTrack(id: number, updates: UpdateMusicTrack): Promise<MusicTrack | null> {
    const result = await db
      .update(musicTracks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(musicTracks.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteMusicTrack(id: number): Promise<boolean> {
    const result = await db.delete(musicTracks).where(eq(musicTracks.id, id)).returning();
    return result.length > 0;
  }

  // Music Albums
  async getMusicAlbums(): Promise<MusicAlbum[]> {
    return await db.select().from(musicAlbums).where(isNull(musicAlbums.deletedAt));
  }

  async getMusicAlbum(id: number): Promise<MusicAlbum | null> {
    const result = await db.select().from(musicAlbums).where(eq(musicAlbums.id, id));
    return result[0] || null;
  }

  async getTrashedMusicAlbums(): Promise<MusicAlbum[]> {
    return await db.select().from(musicAlbums).where(isNotNull(musicAlbums.deletedAt));
  }

  async createMusicAlbum(album: InsertMusicAlbum): Promise<MusicAlbum> {
    const result = await db.insert(musicAlbums).values({
      ...album,
      trackIds: album.trackIds ?? [],
      deletedAt: null,
    }).returning();
    return result[0];
  }

  async updateMusicAlbum(id: number, updates: UpdateMusicAlbum): Promise<MusicAlbum | null> {
    const result = await db
      .update(musicAlbums)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(musicAlbums.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteMusicAlbum(id: number): Promise<boolean> {
    const result = await db.delete(musicAlbums).where(eq(musicAlbums.id, id)).returning();
    return result.length > 0;
  }

  // Spotify Favorites
  async getSpotifyFavorites(): Promise<SpotifyFavorite[]> {
    return await db.select().from(spotifyFavorites).where(isNull(spotifyFavorites.deletedAt));
  }

  async getSpotifyFavoriteById(id: number): Promise<SpotifyFavorite | null> {
    const result = await db.select().from(spotifyFavorites).where(eq(spotifyFavorites.id, id));
    return result[0] || null;
  }

  async getSpotifyFavoritesByListType(listType: string): Promise<SpotifyFavorite[]> {
    return await db
      .select()
      .from(spotifyFavorites)
      .where(and(eq(spotifyFavorites.listType, listType), isNull(spotifyFavorites.deletedAt)));
  }

  async getTrashedSpotifyFavorites(): Promise<SpotifyFavorite[]> {
    return await db.select().from(spotifyFavorites).where(isNotNull(spotifyFavorites.deletedAt));
  }

  async createSpotifyFavorite(favorite: InsertSpotifyFavorite): Promise<SpotifyFavorite> {
    const result = await db.insert(spotifyFavorites).values({
      ...favorite,
      deletedAt: null,
    }).returning();
    return result[0];
  }

  async updateSpotifyFavorite(id: number, updates: UpdateSpotifyFavorite): Promise<SpotifyFavorite | null> {
    const result = await db
      .update(spotifyFavorites)
      .set(updates)
      .where(eq(spotifyFavorites.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteSpotifyFavorite(id: number): Promise<boolean> {
    const result = await db.delete(spotifyFavorites).where(eq(spotifyFavorites.id, id)).returning();
    return result.length > 0;
  }

  // Film Items
  async getFilmItems(): Promise<FilmItem[]> {
    return await db.select().from(filmItems).where(isNull(filmItems.deletedAt));
  }

  async getFilmItemById(id: number): Promise<FilmItem | null> {
    const result = await db.select().from(filmItems).where(eq(filmItems.id, id));
    return result[0] || null;
  }

  async getFilmItemsByStatus(status: string): Promise<FilmItem[]> {
    return await db
      .select()
      .from(filmItems)
      .where(and(eq(filmItems.status, status), isNull(filmItems.deletedAt)));
  }

  async getTrashedFilmItems(): Promise<FilmItem[]> {
    return await db.select().from(filmItems).where(isNotNull(filmItems.deletedAt));
  }

  async createFilmItem(film: InsertFilmItem): Promise<FilmItem> {
    const result = await db.insert(filmItems).values({
      ...film,
      status: film.status ?? "to-watch",
      isPrivate: film.isPrivate ?? false,
      genre: film.genre ?? [],
      deletedAt: null,
    }).returning();
    return result[0];
  }

  async updateFilmItem(id: number, updates: UpdateFilmItem): Promise<FilmItem | null> {
    const result = await db
      .update(filmItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(filmItems.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteFilmItem(id: number): Promise<boolean> {
    const result = await db.delete(filmItems).where(eq(filmItems.id, id)).returning();
    return result.length > 0;
  }

  // Note Items
  async getNoteItems(): Promise<NoteItem[]> {
    return await db.select().from(noteItems).where(isNull(noteItems.deletedAt));
  }

  async getNoteItemById(id: number): Promise<NoteItem | null> {
    const result = await db.select().from(noteItems).where(eq(noteItems.id, id));
    return result[0] || null;
  }

  async getNoteItemsByType(type: string): Promise<NoteItem[]> {
    return await db
      .select()
      .from(noteItems)
      .where(and(eq(noteItems.type, type), isNull(noteItems.deletedAt)));
  }

  async getTrashedNoteItems(): Promise<NoteItem[]> {
    return await db.select().from(noteItems).where(isNotNull(noteItems.deletedAt));
  }

  async createNoteItem(note: InsertNoteItem): Promise<NoteItem> {
    const result = await db.insert(noteItems).values({
      ...note,
      isPrivate: note.isPrivate ?? false,
      completed: note.completed ?? false,
      deletedAt: null,
    }).returning();
    return result[0];
  }

  async updateNoteItem(id: number, updates: UpdateNoteItem): Promise<NoteItem | null> {
    const result = await db
      .update(noteItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(noteItems.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteNoteItem(id: number): Promise<boolean> {
    const result = await db.delete(noteItems).where(eq(noteItems.id, id)).returning();
    return result.length > 0;
  }

  // Film Genres
  async getFilmGenres(): Promise<FilmGenre[]> {
    return await db.select().from(filmGenres).orderBy(filmGenres.name);
  }

  async getFilmGenreById(id: number): Promise<FilmGenre | null> {
    const result = await db.select().from(filmGenres).where(eq(filmGenres.id, id));
    return result[0] || null;
  }

  async createFilmGenre(genre: InsertFilmGenre): Promise<FilmGenre> {
    const result = await db.insert(filmGenres).values(genre).returning();
    return result[0];
  }

  async updateFilmGenre(id: number, updates: UpdateFilmGenre): Promise<FilmGenre | null> {
    const result = await db
      .update(filmGenres)
      .set(updates)
      .where(eq(filmGenres.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteFilmGenre(id: number): Promise<boolean> {
    const result = await db.delete(filmGenres).where(eq(filmGenres.id, id)).returning();
    return result.length > 0;
  }

  // ============ BOOK ITEMS ============
  async getBookItems(): Promise<BookItem[]> {
    return await db.select().from(bookItems).where(isNull(bookItems.deletedAt)).orderBy(bookItems.createdAt);
  }
  async getBookItemById(id: number): Promise<BookItem | null> {
    const result = await db.select().from(bookItems).where(eq(bookItems.id, id));
    return result[0] || null;
  }
  async getBookItemsByStatus(status: string): Promise<BookItem[]> {
    return await db.select().from(bookItems).where(and(eq(bookItems.status, status), isNull(bookItems.deletedAt)));
  }
  async getTrashedBookItems(): Promise<BookItem[]> {
    return await db.select().from(bookItems).where(isNotNull(bookItems.deletedAt));
  }
  async createBookItem(book: InsertBookItem): Promise<BookItem> {
    const result = await db.insert(bookItems).values({ ...book, isPrivate: book.isPrivate ?? false, deletedAt: null }).returning();
    return result[0];
  }
  async updateBookItem(id: number, updates: UpdateBookItem): Promise<BookItem | null> {
    const result = await db.update(bookItems).set({ ...updates, updatedAt: new Date() }).where(eq(bookItems.id, id)).returning();
    return result[0] || null;
  }
  async deleteBookItem(id: number): Promise<boolean> {
    const result = await db.delete(bookItems).where(eq(bookItems.id, id)).returning();
    return result.length > 0;
  }

  // ============ GAME ITEMS ============
  async getGameItems(): Promise<GameItem[]> {
    return await db.select().from(gameItems).where(isNull(gameItems.deletedAt)).orderBy(gameItems.createdAt);
  }
  async getGameItemById(id: number): Promise<GameItem | null> {
    const result = await db.select().from(gameItems).where(eq(gameItems.id, id));
    return result[0] || null;
  }
  async getGameItemsByStatus(status: string): Promise<GameItem[]> {
    return await db.select().from(gameItems).where(and(eq(gameItems.status, status), isNull(gameItems.deletedAt)));
  }
  async getTrashedGameItems(): Promise<GameItem[]> {
    return await db.select().from(gameItems).where(isNotNull(gameItems.deletedAt));
  }
  async createGameItem(game: InsertGameItem): Promise<GameItem> {
    try {
      const result = await db.insert(gameItems).values({ ...game, isPrivate: game.isPrivate ?? false, deletedAt: null }).returning();
      return result[0];
    } catch (err: any) {
      if (err?.message?.includes('column') || err?.message?.includes('does not exist')) {
        const { fullAchievement, daysSpent, visitedZones, mediaUrls, ...baseGame } = game as any;
        const extraNotesParts = [
          baseGame.notes,
          visitedZones ? `Zone: ${visitedZones}` : null,
          daysSpent ? `Zile: ${daysSpent}` : null,
          mediaUrls ? `MEDIA:::${mediaUrls}` : null
        ].filter(Boolean);

        const result = await db.insert(gameItems).values({
          ...baseGame,
          notes: extraNotesParts.join('\n'),
          isPrivate: baseGame.isPrivate ?? false,
          deletedAt: null
        }).returning();
        return result[0];
      }
      throw err;
    }
  }
  async updateGameItem(id: number, updates: UpdateGameItem): Promise<GameItem | null> {
    try {
      const result = await db.update(gameItems).set({ ...updates, updatedAt: new Date() }).where(eq(gameItems.id, id)).returning();
      return result[0] || null;
    } catch (err: any) {
      if (err?.message?.includes('column') || err?.message?.includes('does not exist')) {
        const { fullAchievement, daysSpent, visitedZones, mediaUrls, ...baseUpdates } = updates as any;
        const extraNotesParts = [
          baseUpdates.notes,
          visitedZones ? `Zone: ${visitedZones}` : null,
          daysSpent ? `Zile: ${daysSpent}` : null,
          mediaUrls ? `MEDIA:::${mediaUrls}` : null
        ].filter(Boolean);

        const result = await db.update(gameItems).set({
          ...baseUpdates,
          notes: extraNotesParts.join('\n'),
          updatedAt: new Date()
        }).where(eq(gameItems.id, id)).returning();
        return result[0] || null;
      }
      throw err;
    }
  }
  async deleteGameItem(id: number): Promise<boolean> {
    const result = await db.delete(gameItems).where(eq(gameItems.id, id)).returning();
    return result.length > 0;
  }

  // ============ SKILL TREE NODES ============
  async getSkillTreeNodes(): Promise<SkillTreeNode[]> {
    return await db.select().from(skillTreeNodes).orderBy(skillTreeNodes.nodeOrder);
  }
  async getSkillTreeNodeById(id: number): Promise<SkillTreeNode | null> {
    const result = await db.select().from(skillTreeNodes).where(eq(skillTreeNodes.id, id));
    return result[0] || null;
  }
  async createSkillTreeNode(node: InsertSkillTreeNode): Promise<SkillTreeNode> {
    const result = await db.insert(skillTreeNodes).values(node).returning();
    return result[0];
  }
  async updateSkillTreeNode(id: number, updates: UpdateSkillTreeNode): Promise<SkillTreeNode | null> {
    const result = await db.update(skillTreeNodes).set({ ...updates, updatedAt: new Date() }).where(eq(skillTreeNodes.id, id)).returning();
    return result[0] || null;
  }
  async deleteSkillTreeNode(id: number): Promise<boolean> {
    const result = await db.delete(skillTreeNodes).where(eq(skillTreeNodes.id, id)).returning();
    return result.length > 0;
  }
}
