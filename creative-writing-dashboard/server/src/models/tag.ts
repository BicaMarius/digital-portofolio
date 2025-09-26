import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  type: 'poezie' | 'povestire' | string; // Extendable for other types
  sentiment: 'iubire' | 'fericire' | 'despartire' | 'contemplativ' | string; // Extendable for other sentiments
}

const tagSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['poezie', 'povestire'], required: true },
  sentiment: { type: String, enum: ['iubire', 'fericire', 'despartire', 'contemplativ'], required: true },
}, { timestamps: true });

const Tag = mongoose.model<ITag>('Tag', tagSchema);

export default Tag;