import { useCallback, useEffect, useState } from 'react';

export interface DigitalArtOption {
  id: string;
  name: string;
}

const STORAGE_KEYS = {
  software: 'digital-art-options-software',
  dimensions: 'digital-art-options-dimensions',
};

const DEFAULT_SOFTWARE: DigitalArtOption[] = [
  { id: 'photoshop', name: 'Adobe Photoshop' },
  { id: 'illustrator', name: 'Adobe Illustrator' },
  { id: 'lightroom', name: 'Adobe Lightroom' },
  { id: 'procreate', name: 'Procreate' },
  { id: 'krita', name: 'Krita' },
  { id: 'blender', name: 'Blender' },
  { id: 'figma', name: 'Figma' },
];

const DEFAULT_DIMENSIONS: DigitalArtOption[] = [
  { id: 'a5', name: 'A5 (148 x 210 mm)' },
  { id: 'a4', name: 'A4 (210 x 297 mm)' },
  { id: 'a3', name: 'A3 (297 x 420 mm)' },
  { id: 'a2', name: 'A2 (420 x 594 mm)' },
  { id: 'letter', name: 'Letter (8.5 x 11 in)' },
  { id: 'legal', name: 'Legal (8.5 x 14 in)' },
  { id: 'tabloid', name: 'Tabloid (11 x 17 in)' },
];

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

function loadOptionsFromStorage(key: string, defaults: DigitalArtOption[]): DigitalArtOption[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as DigitalArtOption[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaults;
    return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string');
  } catch {
    return defaults;
  }
}

function saveOptionsToStorage(key: string, options: DigitalArtOption[]) {
  try {
    localStorage.setItem(key, JSON.stringify(options));
  } catch {
    // Ignore storage errors.
  }
}

function useDigitalArtOptionList(storageKey: string, defaults: DigitalArtOption[]) {
  const [options, setOptions] = useState<DigitalArtOption[]>(() => loadOptionsFromStorage(storageKey, defaults));

  useEffect(() => {
    saveOptionsToStorage(storageKey, options);
  }, [options, storageKey]);

  const addOption = useCallback(async (name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) return;
    setOptions((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === normalized.toLowerCase())) return prev;
      return [...prev, { id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: normalized }];
    });
  }, []);

  const updateOption = useCallback(async (id: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) return;
    setOptions((prev) => prev.map((item) => (item.id === id ? { ...item, name: normalized } : item)));
  }, []);

  const deleteOption = useCallback(async (id: string) => {
    setOptions((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    options,
    addOption,
    updateOption,
    deleteOption,
  };
}

export function useDigitalArtSoftwareOptions() {
  return useDigitalArtOptionList(STORAGE_KEYS.software, DEFAULT_SOFTWARE);
}

export function useDigitalArtDimensionOptions() {
  return useDigitalArtOptionList(STORAGE_KEYS.dimensions, DEFAULT_DIMENSIONS);
}
