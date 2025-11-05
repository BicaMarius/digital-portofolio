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
