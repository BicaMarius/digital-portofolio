// Centralized type definitions for the portfolio application

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'tech' | 'art';
  subcategory: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: 'tech' | 'art';
  subcategory: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CVData {
  id: string;
  fileName: string;
  fileUrl: string;
  storagePath?: string;
  uploadedAt: Date;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  category: 'tech' | 'art' | 'creative' | 'master';
}

export interface Skill {
  name: string;
  level: number;
  category: string;
}

export interface PortfolioCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'tech' | 'art';
  projectCount: number;
  route: string;
}

export interface AdminContextType {
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export interface DataContextType {
  // Projects
  projects: Project[];
  getProjectsByCategory: (category: string) => Project[];
  createNewProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateExistingProject: (id: string, updates: Partial<Project>) => Project | null;
  deleteExistingProject: (id: string) => boolean;
  
  // Gallery
  galleryItems: GalleryItem[];
  getGalleryByCategory: (category: string) => GalleryItem[];
  createNewGalleryItem: (item: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>) => GalleryItem;
  updateExistingGalleryItem: (id: string, updates: Partial<GalleryItem>) => GalleryItem | null;
  deleteExistingGalleryItem: (id: string) => boolean;
  
  // CV
  cvData: CVData | null;
  uploadNewCV: (file: File) => Promise<CVData>;
  deleteExistingCV: () => Promise<boolean>;
  
  // Statistics
  getProjectCountByCategory: (category: string) => number;
  getTotalProjectCountByCategory: (category: string) => number;
  
  // Refresh data
  refreshData: () => void;
}
