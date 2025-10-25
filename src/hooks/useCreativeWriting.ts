// Hook for Creative Writing data management with API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import type { Writing, Album, Tag } from '@shared/schema';

export function useWritings() {
  return useQuery({
    queryKey: ['writings'],
    queryFn: api.getWritings,
  });
}

export function useAlbums() {
  return useQuery({
    queryKey: ['albums'],
    queryFn: api.getAlbums,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  });
}

export function useCreateWriting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createWriting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writings'] });
    },
  });
}

export function useUpdateWriting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Writing> }) =>
      api.updateWriting(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writings'] });
    },
  });
}

export function useDeleteWriting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteWriting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writings'] });
    },
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Album> }) =>
      api.updateAlbum(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Tag> }) =>
      api.updateTag(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
