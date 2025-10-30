import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAdmin } from './AdminContext';
import { DataContextType, Project, GalleryItem, CVData } from '@/types';
import { 
  getProjects, 
  getGalleryItems, 
  createProject,
  updateProject,
  deleteProject,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getProjectCount,
  getTotalProjectCount
} from '@/lib/backend';
import { fetchCVData, uploadCVFile, deleteCVFile } from '@/lib/cv';

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

  const normalizeCvData = useCallback((data: Awaited<ReturnType<typeof fetchCVData>>): CVData | null => {
    if (!data) {
      return null;
    }

    return {
      id: data.id.toString(),
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      uploadedAt: new Date(data.uploadedAt),
    };
  }, []);

  const loadCvData = useCallback(async () => {
    try {
      const data = await fetchCVData();
      setCvData(normalizeCvData(data));
    } catch (error) {
      console.error('Failed to fetch CV data', error);
      setCvData(null);
    }
  }, [normalizeCvData]);

  const refreshData = useCallback(() => {
    setProjects(getProjects(undefined, isAdmin));
    setGalleryItems(getGalleryItems(undefined, isAdmin));
    void loadCvData();
  }, [isAdmin, loadCvData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
  const uploadNewCV = async (file: File): Promise<CVData> => {
    try {
      const data = await uploadCVFile(file);
      const normalized = normalizeCvData(data);
      if (!normalized) {
        throw new Error('CV upload response invalid');
      }
      setCvData(normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to upload CV', error);
      throw error;
    }
  };

  const deleteExistingCV = async (): Promise<boolean> => {
    try {
      await deleteCVFile();
      setCvData(null);
      return true;
    } catch (error) {
      console.error('Failed to delete CV', error);
      return false;
    }
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
