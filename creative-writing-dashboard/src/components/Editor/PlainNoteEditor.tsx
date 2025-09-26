import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addWriting, editWriting, deleteWriting } from '../../../store/slices/writingsSlice';
import { useWordCount } from '../../../hooks/useWordCount';
import { WordCount } from '../WordCount';

const PlainNoteEditor = ({ writingId, onClose }) => {
  const dispatch = useDispatch();
  const writing = useSelector((state) => state.writings.find((w) => w.id === writingId));
  const [content, setContent] = useState(writing ? writing.content : '');
  const [title, setTitle] = useState(writing ? writing.title : '');
  const [isPublished, setIsPublished] = useState(writing ? writing.isPublished : false);
  const wordCount = useWordCount(content);

  useEffect(() => {
    if (writing) {
      setContent(writing.content);
      setTitle(writing.title);
      setIsPublished(writing.isPublished);
    }
  }, [writing]);

  const handleSave = () => {
    if (writing) {
      dispatch(editWriting({ ...writing, content, title, isPublished }));
    } else {
      dispatch(addWriting({ content, title, isPublished }));
    }
    onClose();
  };

  const handleDelete = () => {
    if (writing) {
      dispatch(deleteWriting(writing.id));
      onClose();
    }
  };

  return (
    <div className="p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="border p-2 w-full mb-4"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note here..."
        className="border p-2 w-full h-64 mb-4"
      />
      <div className="flex justify-between items-center">
        <WordCount count={wordCount} />
        <div>
          <label className="mr-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={() => setIsPublished(!isPublished)}
            />
            Published
          </label>
          <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">
            Save
          </button>
          {writing && (
            <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded ml-2">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlainNoteEditor;