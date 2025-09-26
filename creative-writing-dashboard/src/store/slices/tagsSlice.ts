import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Tag {
  id: string;
  name: string;
}

interface TagsState {
  tags: Tag[];
}

const initialState: TagsState = {
  tags: [],
};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    addTag(state, action: PayloadAction<Tag>) {
      state.tags.push(action.payload);
    },
    editTag(state, action: PayloadAction<Tag>) {
      const index = state.tags.findIndex(tag => tag.id === action.payload.id);
      if (index !== -1) {
        state.tags[index] = action.payload;
      }
    },
    deleteTag(state, action: PayloadAction<string>) {
      state.tags = state.tags.filter(tag => tag.id !== action.payload);
    },
    setTags(state, action: PayloadAction<Tag[]>) {
      state.tags = action.payload;
    },
  },
});

export const { addTag, editTag, deleteTag, setTags } = tagsSlice.actions;

export default tagsSlice.reducer;