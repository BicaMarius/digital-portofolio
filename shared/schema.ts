import { pgTable, text, serial, boolean, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateProjectSchema = insertProjectSchema.partial();
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Project = typeof projects.$inferSelect;

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
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type UpdateGalleryItem = z.infer<typeof updateGalleryItemSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;

// CV data table
export const cvData = pgTable("cv_data", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertCVDataSchema = createInsertSchema(cvData).omit({
  id: true,
  uploadedAt: true,
});
export type InsertCVData = z.infer<typeof insertCVDataSchema>;
export type CVData = typeof cvData.$inferSelect;

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
export type InsertWriting = z.infer<typeof insertWritingSchema>;
export type UpdateWriting = z.infer<typeof updateWritingSchema>;
export type Writing = typeof writings.$inferSelect;

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
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type UpdateAlbum = z.infer<typeof updateAlbumSchema>;
export type Album = typeof albums.$inferSelect;

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
export type InsertTag = z.infer<typeof insertTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
export type Tag = typeof tags.$inferSelect;
