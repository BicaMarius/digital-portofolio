import express from 'express';
import {
  getWritings,
  createWriting,
  updateWriting,
  deleteWriting,
  searchWritings,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getSentiments,
  createSentiment,
  updateSentiment,
  deleteSentiment,
} from '../controllers/writingsController';

const router = express.Router();

// Get all writings
router.get('/', getWritings);

// Create a new writing
router.post('/', createWriting);

// Update a writing by ID
router.put('/:id', updateWriting);

// Delete a writing by ID
router.delete('/:id', deleteWriting);

// Search writings by keyword
router.get('/search', searchWritings);

// Get all tags
router.get('/tags', getTags);

// Create a new tag
router.post('/tags', createTag);

// Update a tag by ID
router.put('/tags/:id', updateTag);

// Delete a tag by ID
router.delete('/tags/:id', deleteTag);

// Get all sentiments
router.get('/sentiments', getSentiments);

// Create a new sentiment
router.post('/sentiments', createSentiment);

// Update a sentiment by ID
router.put('/sentiments/:id', updateSentiment);

// Delete a sentiment by ID
router.delete('/sentiments/:id', deleteSentiment);

export default router;