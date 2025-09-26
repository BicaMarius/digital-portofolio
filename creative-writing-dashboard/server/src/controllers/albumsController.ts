import { Request, Response } from 'express';
import Album from '../models/album';

// Get all albums
export const getAlbums = async (req: Request, res: Response) => {
    try {
        const albums = await Album.find();
        res.status(200).json(albums);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching albums', error });
    }
};

// Create a new album
export const createAlbum = async (req: Request, res: Response) => {
    const { title, color, icon } = req.body;
    try {
        const newAlbum = new Album({ title, color, icon });
        await newAlbum.save();
        res.status(201).json(newAlbum);
    } catch (error) {
        res.status(500).json({ message: 'Error creating album', error });
    }
};

// Update an album
export const updateAlbum = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, color, icon } = req.body;
    try {
        const updatedAlbum = await Album.findByIdAndUpdate(id, { title, color, icon }, { new: true });
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

// Add writings to an album
export const addWritingsToAlbum = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { writingIds } = req.body;
    try {
        const album = await Album.findById(id);
        if (album) {
            album.writings.push(...writingIds);
            await album.save();
            res.status(200).json(album);
        } else {
            res.status(404).json({ message: 'Album not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error adding writings to album', error });
    }
};

// Remove writings from an album
export const removeWritingsFromAlbum = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { writingIds } = req.body;
    try {
        const album = await Album.findById(id);
        if (album) {
            album.writings = album.writings.filter(writingId => !writingIds.includes(writingId));
            await album.save();
            res.status(200).json(album);
        } else {
            res.status(404).json({ message: 'Album not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error removing writings from album', error });
    }
};