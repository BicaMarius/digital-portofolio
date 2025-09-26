import express from 'express';
import { 
  createAlbum, 
  getAlbums, 
  updateAlbum, 
  deleteAlbum, 
  addWritingToAlbum, 
  removeWritingFromAlbum 
} from '../controllers/albumsController';

const router = express.Router();

// Route to create a new album
router.post('/', createAlbum);

// Route to get all albums
router.get('/', getAlbums);

// Route to update an existing album
router.put('/:id', updateAlbum);

// Route to delete an album
router.delete('/:id', deleteAlbum);

// Route to add a writing to an album
router.post('/:albumId/writings/:writingId', addWritingToAlbum);

// Route to remove a writing from an album
router.delete('/:albumId/writings/:writingId', removeWritingFromAlbum);

export default router;