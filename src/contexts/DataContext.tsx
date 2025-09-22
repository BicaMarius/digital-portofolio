import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { DataContextType, Project, GalleryItem, CVData } from '@/types';
import { 
  getProjects, 
  getGalleryItems, 
  getCV,
  createProject,
  updateProject,
  deleteProject,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  uploadCV,
  deleteCV,
  getProjectCount,
  getTotalProjectCount
} from '@/lib/backend';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { isAdmin } = useAdmin();
  const [projects, setProjects] = useState<Project[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [cvData, setCvData] = useState<CVData | null>(null);

  const refreshData = () => {
    setProjects(getProjects(undefined, isAdmin));
    setGalleryItems(getGalleryItems(undefined, isAdmin));
    setCvData(getCV());
  };

  useEffect(() => {
    refreshData();
  }, [isAdmin]);

  // Project operations
  const getProjectsByCategory = (category: string): Project[] => {
    return getProjects(category, isAdmin);
  };

  const createNewProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const newProject = createProject(project);
    refreshData();
    return newProject;
  };

  const updateExistingProject = (id: string, updates: Partial<Project>): Project | null => {
    const updatedProject = updateProject(id, updates);
    refreshData();
    return updatedProject;
  };

  const deleteExistingProject = (id: string): boolean => {
    const success = deleteProject(id);
    refreshData();
    return success;
  };

  // Gallery operations
  const getGalleryByCategory = (category: string): GalleryItem[] => {
    return getGalleryItems(category, isAdmin);
  };

  const createNewGalleryItem = (item: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>): GalleryItem => {
    const newItem = createGalleryItem(item);
    refreshData();
    return newItem;
  };

  const updateExistingGalleryItem = (id: string, updates: Partial<GalleryItem>): GalleryItem | null => {
    const updatedItem = updateGalleryItem(id, updates);
    refreshData();
    return updatedItem;
  };

  const deleteExistingGalleryItem = (id: string): boolean => {
    const success = deleteGalleryItem(id);
    refreshData();
    return success;
  };

  // CV operations
  const uploadNewCV = (fileName: string, fileUrl: string): CVData => {
    const newCV = uploadCV(fileName, fileUrl);
    setCvData(newCV);
    return newCV;
  };

  const deleteExistingCV = (): boolean => {
    const success = deleteCV();
    setCvData(null);
    return success;
  };

  // Statistics
  const getProjectCountByCategory = (category: string): number => {
    return getProjectCount(category);
  };

  const getTotalProjectCountByCategory = (category: string): number => {
    return getTotalProjectCount(category);
  };

  const value: DataContextType = {
    projects,
    getProjectsByCategory,
    createNewProject,
    updateExistingProject,
    deleteExistingProject,
    galleryItems,
    getGalleryByCategory,
    createNewGalleryItem,
    updateExistingGalleryItem,
    deleteExistingGalleryItem,
    cvData,
    uploadNewCV,
    deleteExistingCV,
    getProjectCountByCategory,
    getTotalProjectCountByCategory,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
