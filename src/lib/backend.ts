// Simple backend simulation for portfolio data
import { Project, GalleryItem, CVData } from '@/types';

// Mock data storage
let projects: Project[] = [
  {
    id: '1',
    title: 'E-Commerce Platform',
    description: 'Platformă de e-commerce completă cu React, Node.js și MongoDB',
    image: '/placeholder.svg',
    category: 'tech',
    subcategory: 'web-development',
    isPrivate: false,
    tags: ['React', 'Node.js', 'MongoDB', 'E-commerce'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'AI Chatbot',
    description: 'Chatbot inteligent pentru suport clienți',
    image: '/placeholder.svg',
    category: 'tech',
    subcategory: 'ai-ml',
    isPrivate: true,
    tags: ['AI', 'Python', 'NLP', 'Machine Learning'],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  },
  {
    id: '3',
    title: 'Digital Art Collection',
    description: 'Colecție de artă digitală creată în Photoshop',
    image: '/placeholder.svg',
    category: 'art',
    subcategory: 'digital-art',
    isPrivate: false,
    tags: ['Digital Art', 'Photoshop', 'Creative'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

let galleryItems: GalleryItem[] = [
  {
    id: '1',
    title: 'Landscape Photography',
    image: '/placeholder.svg',
    category: 'art',
    subcategory: 'photography',
    isPrivate: false,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: '2',
    title: 'Private Artwork',
    image: '/placeholder.svg',
    category: 'art',
    subcategory: 'traditional-art',
    isPrivate: true,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05')
  }
];

let cvData: CVData | null = null;

// Project operations
export const getProjects = (category?: string, isAdmin: boolean = false): Project[] => {
  let filteredProjects = projects;
  
  if (category) {
    filteredProjects = projects.filter(p => p.subcategory === category);
  }
  
  if (!isAdmin) {
    filteredProjects = filteredProjects.filter(p => !p.isPrivate);
  }
  
  return filteredProjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getProject = (id: string, isAdmin: boolean = false): Project | null => {
  const project = projects.find(p => p.id === id);
  if (!project) return null;
  if (!isAdmin && project.isPrivate) return null;
  return project;
};

export const createProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
  const newProject: Project = {
    ...project,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  projects.push(newProject);
  return newProject;
};

export const updateProject = (id: string, updates: Partial<Project>): Project | null => {
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date()
  };
  return projects[index];
};

export const deleteProject = (id: string): boolean => {
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  projects.splice(index, 1);
  return true;
};

// Gallery operations
export const getGalleryItems = (category?: string, isAdmin: boolean = false): GalleryItem[] => {
  let filteredItems = galleryItems;
  
  if (category) {
    filteredItems = galleryItems.filter(g => g.subcategory === category);
  }
  
  if (!isAdmin) {
    filteredItems = filteredItems.filter(g => !g.isPrivate);
  }
  
  return filteredItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getGalleryItem = (id: string, isAdmin: boolean = false): GalleryItem | null => {
  const item = galleryItems.find(g => g.id === id);
  if (!item) return null;
  if (!isAdmin && item.isPrivate) return null;
  return item;
};

export const createGalleryItem = (item: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>): GalleryItem => {
  const newItem: GalleryItem = {
    ...item,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  galleryItems.push(newItem);
  return newItem;
};

export const updateGalleryItem = (id: string, updates: Partial<GalleryItem>): GalleryItem | null => {
  const index = galleryItems.findIndex(g => g.id === id);
  if (index === -1) return null;
  
  galleryItems[index] = {
    ...galleryItems[index],
    ...updates,
    updatedAt: new Date()
  };
  return galleryItems[index];
};

export const deleteGalleryItem = (id: string): boolean => {
  const index = galleryItems.findIndex(g => g.id === id);
  if (index === -1) return false;
  
  galleryItems.splice(index, 1);
  return true;
};

// CV operations
export const getCV = (): CVData | null => {
  return cvData;
};

export const uploadCV = (fileName: string, fileUrl: string): CVData => {
  cvData = {
    id: Date.now().toString(),
    fileName,
    fileUrl,
    uploadedAt: new Date()
  };
  return cvData;
};

export const deleteCV = (): boolean => {
  cvData = null;
  return true;
};

// Statistics
export const getProjectCount = (category?: string): number => {
  if (category) {
    return projects.filter(p => p.subcategory === category && !p.isPrivate).length;
  }
  return projects.filter(p => !p.isPrivate).length;
};

export const getTotalProjectCount = (category?: string): number => {
  if (category) {
    return projects.filter(p => p.subcategory === category).length;
  }
  return projects.length;
};
