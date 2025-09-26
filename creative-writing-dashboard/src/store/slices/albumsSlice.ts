import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Album {
  id: string;
  title: string;
  color: string;
  icon: string;
  writings: string[]; // Array of writing IDs
}

interface AlbumsState {
  albums: Album[];
}

const initialState: AlbumsState = {
  albums: [],
};

const albumsSlice = createSlice({
  name: 'albums',
  initialState,
  reducers: {
    addAlbum: (state, action: PayloadAction<Album>) => {
      state.albums.push(action.payload);
    },
    editAlbum: (state, action: PayloadAction<Album>) => {
      const index = state.albums.findIndex(album => album.id === action.payload.id);
      if (index !== -1) {
        state.albums[index] = action.payload;
      }
    },
    deleteAlbum: (state, action: PayloadAction<string>) => {
      state.albums = state.albums.filter(album => album.id !== action.payload);
    },
    addWritingToAlbum: (state, action: PayloadAction<{ albumId: string; writingId: string }>) => {
      const album = state.albums.find(album => album.id === action.payload.albumId);
      if (album && !album.writings.includes(action.payload.writingId)) {
        album.writings.push(action.payload.writingId);
      }
    },
    removeWritingFromAlbum: (state, action: PayloadAction<{ albumId: string; writingId: string }>) => {
      const album = state.albums.find(album => album.id === action.payload.albumId);
      if (album) {
        album.writings = album.writings.filter(id => id !== action.payload.writingId);
      }
    },
    reorderAlbums: (state, action: PayloadAction<{ sourceIndex: number; destinationIndex: number }>) => {
      const [movedAlbum] = state.albums.splice(action.payload.sourceIndex, 1);
      state.albums.splice(action.payload.destinationIndex, 0, movedAlbum);
    },
  },
});

export const { addAlbum, editAlbum, deleteAlbum, addWritingToAlbum, removeWritingFromAlbum, reorderAlbums } = albumsSlice.actions;

export default albumsSlice.reducer;