// Hook for Art Options (Dimensions, Materials, Techniques) management
// Using localStorage for persistence (can be migrated to API later)
import { useState, useEffect, useCallback } from 'react';

export interface ArtOption {
  id: string;
  name: string;
}

// Default predefined options
const DEFAULT_DIMENSIONS: ArtOption[] = [
  { id: 'a5', name: 'A5 (148×210 mm)' },
  { id: 'a4', name: 'A4 (210×297 mm)' },
  { id: 'a3', name: 'A3 (297×420 mm)' },
  { id: 'a2', name: 'A2 (420×594 mm)' },
  { id: 'a1', name: 'A1 (594×841 mm)' },
  { id: '20x30', name: '20×30 cm' },
  { id: '30x40', name: '30×40 cm' },
  { id: '40x50', name: '40×50 cm' },
  { id: '50x70', name: '50×70 cm' },
  { id: 'square-20', name: '20×20 cm (pătrat)' },
  { id: 'square-30', name: '30×30 cm (pătrat)' },
  { id: 'custom', name: 'Dimensiune personalizată' },
];

const DEFAULT_MATERIALS: ArtOption[] = [
  { id: 'graphite', name: 'Creion grafit' },
  { id: 'charcoal', name: 'Cărbune' },
  { id: 'colored-pencils', name: 'Creioane colorate' },
  { id: 'pastel', name: 'Pasteluri' },
  { id: 'oil-pastel', name: 'Pasteluri uleioase' },
  { id: 'watercolor', name: 'Acuarelă' },
  { id: 'gouache', name: 'Guașe' },
  { id: 'acrylic', name: 'Acrilic' },
  { id: 'oil', name: 'Ulei' },
  { id: 'ink', name: 'Tuș' },
  { id: 'marker', name: 'Markere' },
  { id: 'mixed-media', name: 'Tehnică mixtă' },
  { id: 'digital', name: 'Digital' },
];

const DEFAULT_TECHNIQUES: ArtOption[] = [
  { id: 'sketch', name: 'Schiță' },
  { id: 'study', name: 'Studiu' },
  { id: 'line-art', name: 'Line art' },
  { id: 'hatching', name: 'Hașurare' },
  { id: 'crosshatching', name: 'Hașurare încrucișată' },
  { id: 'stippling', name: 'Punctilism' },
  { id: 'blending', name: 'Estompare' },
  { id: 'wash', name: 'Spălat (wash)' },
  { id: 'wet-on-wet', name: 'Ud pe ud' },
  { id: 'dry-brush', name: 'Pensulă uscată' },
  { id: 'impasto', name: 'Impasto' },
  { id: 'glazing', name: 'Glazură' },
  { id: 'realistic', name: 'Realist' },
  { id: 'stylized', name: 'Stilizat' },
  { id: 'abstract', name: 'Abstract' },
];

const STORAGE_KEYS = {
  dimensions: 'art-options-dimensions',
  materials: 'art-options-materials',
  techniques: 'art-options-techniques',
};

function loadFromStorage(key: string, defaults: ArtOption[]): ArtOption[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
  }
  return defaults;
}

function saveToStorage(key: string, data: ArtOption[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

// ============ DIMENSIONS ============

export function useArtDimensions() {
  const [dimensions, setDimensions] = useState<ArtOption[]>(() => 
    loadFromStorage(STORAGE_KEYS.dimensions, DEFAULT_DIMENSIONS)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.dimensions, dimensions);
  }, [dimensions]);

  const addDimension = useCallback(async (name: string) => {
    const id = `custom-${Date.now()}`;
    setDimensions(prev => [...prev, { id, name }]);
  }, []);

  const updateDimension = useCallback(async (oldName: string, newName: string) => {
    setDimensions(prev => prev.map(d => d.name === oldName ? { ...d, name: newName } : d));
  }, []);

  const deleteDimension = useCallback(async (name: string) => {
    setDimensions(prev => prev.filter(d => d.name !== name));
  }, []);

  const resetToDefaults = useCallback(() => {
    setDimensions(DEFAULT_DIMENSIONS);
  }, []);

  return {
    dimensions,
    addDimension,
    updateDimension,
    deleteDimension,
    resetToDefaults,
  };
}

// ============ MATERIALS ============

export function useArtMaterials() {
  const [materials, setMaterials] = useState<ArtOption[]>(() => 
    loadFromStorage(STORAGE_KEYS.materials, DEFAULT_MATERIALS)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.materials, materials);
  }, [materials]);

  const addMaterial = useCallback(async (name: string) => {
    const id = `custom-${Date.now()}`;
    setMaterials(prev => [...prev, { id, name }]);
  }, []);

  const updateMaterial = useCallback(async (oldName: string, newName: string) => {
    setMaterials(prev => prev.map(m => m.name === oldName ? { ...m, name: newName } : m));
  }, []);

  const deleteMaterial = useCallback(async (name: string) => {
    setMaterials(prev => prev.filter(m => m.name !== name));
  }, []);

  const resetToDefaults = useCallback(() => {
    setMaterials(DEFAULT_MATERIALS);
  }, []);

  return {
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    resetToDefaults,
  };
}

// ============ TECHNIQUES ============

export function useArtTechniques() {
  const [techniques, setTechniques] = useState<ArtOption[]>(() => 
    loadFromStorage(STORAGE_KEYS.techniques, DEFAULT_TECHNIQUES)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.techniques, techniques);
  }, [techniques]);

  const addTechnique = useCallback(async (name: string) => {
    const id = `custom-${Date.now()}`;
    setTechniques(prev => [...prev, { id, name }]);
  }, []);

  const updateTechnique = useCallback(async (oldName: string, newName: string) => {
    setTechniques(prev => prev.map(t => t.name === oldName ? { ...t, name: newName } : t));
  }, []);

  const deleteTechnique = useCallback(async (name: string) => {
    setTechniques(prev => prev.filter(t => t.name !== name));
  }, []);

  const resetToDefaults = useCallback(() => {
    setTechniques(DEFAULT_TECHNIQUES);
  }, []);

  return {
    techniques,
    addTechnique,
    updateTechnique,
    deleteTechnique,
    resetToDefaults,
  };
}

// Combined hook for all art options
export function useArtOptions() {
  const dimensionsHook = useArtDimensions();
  const materialsHook = useArtMaterials();
  const techniquesHook = useArtTechniques();

  return {
    dimensions: dimensionsHook,
    materials: materialsHook,
    techniques: techniquesHook,
  };
}
