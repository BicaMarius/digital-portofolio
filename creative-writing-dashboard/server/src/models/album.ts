import mongoose, { Schema, Document } from 'mongoose';

interface IAlbum extends Document {
  title: string;
  color: string;
  icon: string;
  writings: mongoose.Types.ObjectId[];
}

const AlbumSchema: Schema = new Schema({
  title: { type: String, required: true, unique: true },
  color: { type: String, default: '#FFFFFF' },
  icon: { type: String, default: 'default-icon' },
  writings: [{ type: mongoose.Types.ObjectId, ref: 'Writing' }],
}, { timestamps: true });

const Album = mongoose.model<IAlbum>('Album', AlbumSchema);

export default Album;