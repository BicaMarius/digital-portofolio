import express from 'express';
import { getTags, createTag, updateTag, deleteTag } from '../controllers/tagsController';

const router = express.Router();

// Route to get all tags
router.get('/', getTags);

// Route to create a new tag
router.post('/', createTag);

// Route to update an existing tag
router.put('/:id', updateTag);

// Route to delete a tag
router.delete('/:id', deleteTag);

export default router;