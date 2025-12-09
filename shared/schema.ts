import { pgTable, text, serial, boolean, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  category: varchar("category", { length: 10 }).notNull(),
  subcategory: text("subcategory").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  // New fields for enhanced project details
  projectType: text("project_type"), // Tag: aplicatie, site web, platforma, joc, etc
  icon: text("icon"), // Cloudinary URL for project icon
  images: text("images").array().default([]), // Array of Cloudinary URLs for project images
  hoursWorked: integer("hours_worked"), // Number of hours worked on project
  frontendTech: text("frontend_tech").array().default([]), // Frontend technologies used
  backendTech: text("backend_tech").array().default([]), // Backend technologies used
  initialReleaseDate: text("initial_release_date"), // Date of first stable version
  lastUpdatedDate: text("last_updated_date"), // Date of last update
  additionalFiles: text("additional_files").array().default([]), // Cloudinary URLs for additional files (instructions, presentations, etc)
  gitUrl: text("git_url"), // Git repository URL
  projectUrl: text("project_url"), // Live project URL or access path
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateProjectSchema = insertProjectSchema.partial();
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type UpdateProject = Partial<InsertProject>;

// Gallery items table
export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  image: text("image").notNull(),
  category: varchar("category", { length: 10 }).notNull(),
  subcategory: text("subcategory").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  // Extended artwork metadata
  medium: text("medium"),
  description: text("description"),
  materials: text("materials").array().default([]),
  dimensions: text("dimensions"),
  date: text("date"),
  // Photography specific fields
  device: text("device"), // Camera/phone used
  location: text("location"), // Where photo was taken
  deletedAt: text("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateGalleryItemSchema = insertGalleryItemSchema.partial();
export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = typeof galleryItems.$inferInsert;
export type UpdateGalleryItem = Partial<InsertGalleryItem>;

// CV data table - files stored in Cloudinary
export const cvData = pgTable("cv_data", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Cloudinary URL
  cloudinaryPublicId: text("cloudinary_public_id").notNull(), // For deletion
  mimeType: text("mime_type").notNull().default('application/pdf'),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertCVDataSchema = createInsertSchema(cvData).omit({
  id: true,
  uploadedAt: true,
});
export type CVData = typeof cvData.$inferSelect;
export type InsertCVData = typeof cvData.$inferInsert;

// Writing pieces table
export const writings = pgTable("writings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  dateWritten: text("date_written").notNull(),
  lastModified: text("last_modified").notNull(),
  tags: text("tags").array().notNull().default([]),
  mood: text("mood").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  published: boolean("published").notNull().default(false),
  deletedAt: text("deleted_at"),
});

export const insertWritingSchema = createInsertSchema(writings).omit({
  id: true,
});
export const updateWritingSchema = insertWritingSchema.partial();
export type Writing = typeof writings.$inferSelect;
export type InsertWriting = typeof writings.$inferInsert;
export type UpdateWriting = Partial<InsertWriting>;

// Albums table
export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  itemIds: integer("item_ids").array().notNull().default([]),
  contentType: text("content_type"), // 'art' or 'writings' to scope albums by dashboard
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
});
export const updateAlbumSchema = insertAlbumSchema.partial();
export type Album = typeof albums.$inferSelect;
export type InsertAlbum = typeof albums.$inferInsert;
export type UpdateAlbum = Partial<InsertAlbum>;

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  sentiment: text("sentiment"),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});
export const updateTagSchema = insertTagSchema.partial();
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type UpdateTag = Partial<InsertTag>;

// Photo locations table
export const photoLocations = pgTable("photo_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertPhotoLocationSchema = createInsertSchema(photoLocations).omit({
  id: true,
});
export const updatePhotoLocationSchema = insertPhotoLocationSchema.partial();
export type PhotoLocation = typeof photoLocations.$inferSelect;
export type InsertPhotoLocation = typeof photoLocations.$inferInsert;
export type UpdatePhotoLocation = Partial<InsertPhotoLocation>;

// Photo devices table
export const photoDevices = pgTable("photo_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertPhotoDeviceSchema = createInsertSchema(photoDevices).omit({
  id: true,
});
export const updatePhotoDeviceSchema = insertPhotoDeviceSchema.partial();
export type PhotoDevice = typeof photoDevices.$inferSelect;
export type InsertPhotoDevice = typeof photoDevices.$inferInsert;
export type UpdatePhotoDevice = Partial<InsertPhotoDevice>;

// ============ MUSIC TABLES ============

// Music tracks table - for custom uploaded tracks
export const musicTracks = pgTable("music_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  audioUrl: text("audio_url").notNull(), // Cloudinary URL for audio file
  coverUrl: text("cover_url"), // Cloudinary URL for cover image
  lyricsUrl: text("lyrics_url"), // Cloudinary URL for lyrics file
  duration: integer("duration"), // Duration in seconds
  genre: text("genre"),
  year: text("year"),
  isPrivate: boolean("is_private").notNull().default(false),
  deletedAt: text("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMusicTrackSchema = createInsertSchema(musicTracks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMusicTrackSchema = insertMusicTrackSchema.partial();
export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = typeof musicTracks.$inferInsert;
export type UpdateMusicTrack = Partial<InsertMusicTrack>;

// Spotify favorites table - for saved Spotify items
export const spotifyFavorites = pgTable("spotify_favorites", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").notNull().unique(), // Spotify track/album/artist ID
  type: text("type").notNull(), // 'track', 'album', 'artist'
  name: text("name").notNull(),
  artist: text("artist"), // For tracks and albums
  albumName: text("album_name"), // For tracks
  imageUrl: text("image_url"),
  spotifyUrl: text("spotify_url"),
  previewUrl: text("preview_url"), // 30s preview URL from Spotify
  rank: integer("rank"), // Position in top 10 list
  listType: text("list_type"), // 'top-tracks', 'top-albums', 'top-artists', 'favorites'
  deletedAt: text("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSpotifyFavoriteSchema = createInsertSchema(spotifyFavorites).omit({
  id: true,
  createdAt: true,
});
export const updateSpotifyFavoriteSchema = insertSpotifyFavoriteSchema.partial();
export type SpotifyFavorite = typeof spotifyFavorites.$inferSelect;
export type InsertSpotifyFavorite = typeof spotifyFavorites.$inferInsert;
export type UpdateSpotifyFavorite = Partial<InsertSpotifyFavorite>;

// ============ FILMS TABLE ============

export const filmItems = pgTable("film_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  director: text("director"),
  year: text("year"),
  posterUrl: text("poster_url"), // Cloudinary URL or TMDB URL
  tmdbId: text("tmdb_id"), // TMDB movie ID for API integration
  status: text("status").notNull().default("to-watch"), // 'to-watch', 'watched'
  rating: integer("rating"), // 1-10 personal rating
  notes: text("notes"),
  watchedDate: text("watched_date"),
  genre: text("genre").array().default([]),
  runtime: integer("runtime"), // Duration in minutes
  isPrivate: boolean("is_private").notNull().default(false),
  deletedAt: text("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFilmItemSchema = createInsertSchema(filmItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateFilmItemSchema = insertFilmItemSchema.partial();
export type FilmItem = typeof filmItems.$inferSelect;
export type InsertFilmItem = typeof filmItems.$inferInsert;
export type UpdateFilmItem = Partial<InsertFilmItem>;

// ============ NOTES TABLE ============

export const noteItems = pgTable("note_items", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'recipe', 'shopping', 'quote'
  title: text("title").notNull(),
  content: text("content"), // JSON string for complex content (ingredients, steps, etc)
  imageUrl: text("image_url"), // Cloudinary URL for recipe image
  // Recipe specific fields
  prepTime: integer("prep_time"), // in minutes
  cookTime: integer("cook_time"), // in minutes
  servings: integer("servings"),
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  cuisine: text("cuisine"),
  // Quote specific fields
  author: text("author"),
  source: text("source"),
  // Shopping list specific
  completed: boolean("completed").default(false),
  isPrivate: boolean("is_private").notNull().default(false),
  deletedAt: text("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNoteItemSchema = createInsertSchema(noteItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateNoteItemSchema = insertNoteItemSchema.partial();
export type NoteItem = typeof noteItems.$inferSelect;
export type InsertNoteItem = typeof noteItems.$inferInsert;
export type UpdateNoteItem = Partial<InsertNoteItem>;
