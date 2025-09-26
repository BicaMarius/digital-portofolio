import React, { useState, useEffect } from 'react';
import { Editor } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { useDispatch } from 'react-redux';
import { addWriting, editWriting } from '../../store/slices/writingsSlice';
import { useWordCount } from '../../hooks/useWordCount';

const RichTextEditor = ({ writing, onClose }) => {
  const [editorState, setEditorState] = useState(Editor.createEmpty());
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [sentiment, setSentiment] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const dispatch = useDispatch();
  const wordCount = useWordCount(editorState);

  useEffect(() => {
    if (writing) {
      setEditorState(Editor.createWithContent(writing.content));
      setTitle(writing.title);
      setTags(writing.tags);
      setSentiment(writing.sentiment);
      setIsPublished(writing.isPublished);
    }
  }, [writing]);

  const handleSave = () => {
    const newWriting = {
      title,
      content: editorState.getCurrentContent(),
      tags,
      sentiment,
      isPublished,
    };

    if (writing) {
      dispatch(editWriting({ id: writing.id, writing: newWriting }));
    } else {
      dispatch(addWriting(newWriting));
    }

    onClose();
  };

  return (
    <div className="rich-text-editor">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="title-input"
      />
      <div className="editor-container">
        <Editor
          editorState={editorState}
          onEditorStateChange={setEditorState}
          placeholder="Start writing..."
        />
      </div>
      <div className="editor-controls">
        <label>
          Tags:
          <input
            type="text"
            value={tags.join(', ')}
            onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
            placeholder="Add tags"
          />
        </label>
        <label>
          Sentiment:
          <select value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
            <option value="">Select sentiment</option>
            <option value="love">Love</option>
            <option value="happiness">Happiness</option>
            <option value="sadness">Sadness</option>
            <option value="contemplative">Contemplative</option>
          </select>
        </label>
        <label>
          Published:
          <input
            type="checkbox"
            checked={isPublished}
            onChange={() => setIsPublished(!isPublished)}
          />
        </label>
        <div className="word-count">Word Count: {wordCount}</div>
      </div>
      <button onClick={handleSave} className="save-button">Save</button>
      <button onClick={onClose} className="cancel-button">Cancel</button>
    </div>
  );
};

export default RichTextEditor;