import { Request, Response } from 'express';
import Writing from '../models/writing';
import Tag from '../models/tag';
import Album from '../models/album';

// Get all writings
export const getAllWritings = async (req: Request, res: Response) => {
    try {
        const writings = await Writing.find().populate('tags').populate('album');
        res.status(200).json(writings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching writings', error });
    }
};

// Create a new writing
export const createWriting = async (req: Request, res: Response) => {
    const { title, content, tags, sentiment, published } = req.body;

    try {
        const newWriting = new Writing({ title, content, tags, sentiment, published });
        await newWriting.save();
        res.status(201).json(newWriting);
    } catch (error) {
        res.status(500).json({ message: 'Error creating writing', error });
    }
};

// Update a writing
export const updateWriting = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, content, tags, sentiment, published } = req.body;

    try {
        const updatedWriting = await Writing.findByIdAndUpdate(id, { title, content, tags, sentiment, published }, { new: true });
        res.status(200).json(updatedWriting);
    } catch (error) {
        res.status(500).json({ message: 'Error updating writing', error });
    }
};

// Delete a writing
export const deleteWriting = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await Writing.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting writing', error });
    }
};

// Search writings by keyword
export const searchWritings = async (req: Request, res: Response) => {
    const { keyword } = req.query;

    try {
        const writings = await Writing.find({
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { content: { $regex: keyword, $options: 'i' } }
            ]
        }).populate('tags').populate('album');
        res.status(200).json(writings);
    } catch (error) {
        res.status(500).json({ message: 'Error searching writings', error });
    }
};

// Get all tags
export const getAllTags = async (req: Request, res: Response) => {
    try {
        const tags = await Tag.find();
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tags', error });
    }
};

// Create a new tag
export const createTag = async (req: Request, res: Response) => {
    const { name } = req.body;

    try {
        const newTag = new Tag({ name });
        await newTag.save();
        res.status(201).json(newTag);
    } catch (error) {
        res.status(500).json({ message: 'Error creating tag', error });
    }
};

// Update a tag
export const updateTag = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const updatedTag = await Tag.findByIdAndUpdate(id, { name }, { new: true });
        res.status(200).json(updatedTag);
    } catch (error) {
        res.status(500).json({ message: 'Error updating tag', error });
    }
};

// Delete a tag
export const deleteTag = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await Tag.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting tag', error });
    }
};

// Get all albums
export const getAllAlbums = async (req: Request, res: Response) => {
    try {
        const albums = await Album.find().populate('writings');
        res.status(200).json(albums);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching albums', error });
    }
};

// Create a new album
export const createAlbum = async (req: Request, res: Response) => {
    const { title, writings } = req.body;

    try {
        const newAlbum = new Album({ title, writings });
        await newAlbum.save();
        res.status(201).json(newAlbum);
    } catch (error) {
        res.status(500).json({ message: 'Error creating album', error });
    }
};

// Update an album
export const updateAlbum = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, writings } = req.body;

    try {
        const updatedAlbum = await Album.findByIdAndUpdate(id, { title, writings }, { new: true });
        res.status(200).json(updatedAlbum);
    } catch (error) {
        res.status(500).json({ message: 'Error updating album', error });
    }
};

// Delete an album
export const deleteAlbum = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await Album.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting album', error });
    }
};