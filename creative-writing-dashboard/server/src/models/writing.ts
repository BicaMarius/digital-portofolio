import mongoose, { Document, Schema } from 'mongoose';

export interface IWriting extends Document {
  title: string;
  content: string;
  tags: string[];
  sentiment: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WritingSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  sentiment: { type: String, enum: ['love', 'happiness', 'separation', 'contemplative'], default: 'contemplative' },
  isPublished: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Writing = mongoose.model<IWriting>('Writing', WritingSchema);

export default Writing;