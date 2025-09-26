import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Writing } from '../../types';

interface WritingsState {
  writings: Writing[];
  selectedWriting: Writing | null;
  tags: string[];
  sentiments: string[];
}

const initialState: WritingsState = {
  writings: [],
  selectedWriting: null,
  tags: [],
  sentiments: [],
};

const writingsSlice = createSlice({
  name: 'writings',
  initialState,
  reducers: {
    addWriting(state, action: PayloadAction<Writing>) {
      state.writings.push(action.payload);
    },
    editWriting(state, action: PayloadAction<Writing>) {
      const index = state.writings.findIndex(writing => writing.id === action.payload.id);
      if (index !== -1) {
        state.writings[index] = action.payload;
      }
    },
    deleteWriting(state, action: PayloadAction<string>) {
      state.writings = state.writings.filter(writing => writing.id !== action.payload);
    },
    setSelectedWriting(state, action: PayloadAction<Writing | null>) {
      state.selectedWriting = action.payload;
    },
    setTags(state, action: PayloadAction<string[]>) {
      state.tags = action.payload;
    },
    addTag(state, action: PayloadAction<string>) {
      if (!state.tags.includes(action.payload)) {
        state.tags.push(action.payload);
      }
    },
    editTag(state, action: PayloadAction<{ oldTag: string; newTag: string }>) {
      const index = state.tags.indexOf(action.payload.oldTag);
      if (index !== -1) {
        state.tags[index] = action.payload.newTag;
      }
    },
    deleteTag(state, action: PayloadAction<string>) {
      state.tags = state.tags.filter(tag => tag !== action.payload);
    },
    setSentiments(state, action: PayloadAction<string[]>) {
      state.sentiments = action.payload;
    },
    addSentiment(state, action: PayloadAction<string>) {
      if (!state.sentiments.includes(action.payload)) {
        state.sentiments.push(action.payload);
      }
    },
    editSentiment(state, action: PayloadAction<{ oldSentiment: string; newSentiment: string }>) {
      const index = state.sentiments.indexOf(action.payload.oldSentiment);
      if (index !== -1) {
        state.sentiments[index] = action.payload.newSentiment;
      }
    },
    deleteSentiment(state, action: PayloadAction<string>) {
      state.sentiments = state.sentiments.filter(sentiment => sentiment !== action.payload);
    },
  },
});

export const {
  addWriting,
  editWriting,
  deleteWriting,
  setSelectedWriting,
  setTags,
  addTag,
  editTag,
  deleteTag,
  setSentiments,
  addSentiment,
  editSentiment,
  deleteSentiment,
} = writingsSlice.actions;

export default writingsSlice.reducer;