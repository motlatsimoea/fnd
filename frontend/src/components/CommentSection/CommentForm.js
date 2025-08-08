import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createComment, editComment } from '../../features/blog/Comment-slice';
import Loader from '../Loader';

const CommentForm = ({ postId, parentId = null, initialText = '', onCancel, isEditing = false }) => {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await dispatch(editComment({ postId, commentId: parentId, text })).unwrap();
        onCancel?.();
      } else {
        await dispatch(createComment({ postId, text, parent: parentId })).unwrap();
        setText('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        disabled={loading}
      />
      <div className="form-actions">
        <button type="submit" disabled={loading || !text.trim()}>
          {isEditing ? 'Update' : 'Post'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={loading}>Cancel</button>
        )}
        {loading && <Loader />}
      </div>
    </form>
  );
};

export default CommentForm;