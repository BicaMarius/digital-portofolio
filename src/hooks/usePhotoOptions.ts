// Hook for Photo Options (Locations and Devices) management with API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import type { PhotoLocation, PhotoDevice } from '@shared/schema';

// ============ PHOTO LOCATIONS ============

export function usePhotoLocations() {
  return useQuery({
    queryKey: ['photoLocations'],
    queryFn: api.getPhotoLocations,
  });
}

export function useCreatePhotoLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createPhotoLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoLocations'] });
    },
  });
}

export function useUpdatePhotoLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<PhotoLocation> }) =>
      api.updatePhotoLocation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoLocations'] });
    },
  });
}

export function useDeletePhotoLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deletePhotoLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoLocations'] });
    },
  });
}

// ============ PHOTO DEVICES ============

export function usePhotoDevices() {
  return useQuery({
    queryKey: ['photoDevices'],
    queryFn: api.getPhotoDevices,
  });
}

export function useCreatePhotoDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createPhotoDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoDevices'] });
    },
  });
}

export function useUpdatePhotoDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<PhotoDevice> }) =>
      api.updatePhotoDevice(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoDevices'] });
    },
  });
}

export function useDeletePhotoDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deletePhotoDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoDevices'] });
    },
  });
}
