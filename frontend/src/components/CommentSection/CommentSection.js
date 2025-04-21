import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchComments,
  createComment,
  editComment,
  deleteComment
} from '../../features/blog/Comment-slice';

const CommentForm = ({ postId, parentId = null, initialText = '', onCancel, onSubmitSuccess }) => {
  const dispatch = useDispatch();
  const [text, setText] = useState(initialText);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
  
    try {
      if (initialText) {
        await dispatch(editComment({ postId, commentId: parentId, text })).unwrap();
      } else {
        await dispatch(createComment({ postId, text, parent: parentId })).unwrap();
      }
  
      setText('');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      console.error('Error submitting comment:', err);
      // Optional: show error feedback to user
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        className="w-full border rounded p-2"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your comment..."
      />
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">
          {initialText ? 'Update' : 'Post'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-300 rounded">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

const CommentItem = ({ comment, postId }) => {
  const dispatch = useDispatch();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleDelete = () => {
    dispatch(deleteComment({ postId, commentId: comment.id }));
  };

  return (
    <div className="mb-4 ml-4 border-l pl-4">
      <div className="flex justify-between">
        <p className="font-medium">{comment.author?.username}</p>
        <small className="text-gray-500">{new Date(comment.created_at).toLocaleString()}</small>
      </div>
      {!editing ? (
        <p className="mt-1">{comment.text}</p>
      ) : (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          initialText={comment.text}
          onCancel={() => setEditing(false)}
          onSubmitSuccess={() => setEditing(false)}
        />
      )}

      {!editing && (
        <div className="text-sm mt-1 flex gap-2 text-blue-600 cursor-pointer">
          <span onClick={() => setReplying(!replying)}>Reply</span>
          <span onClick={() => setEditing(true)}>Edit</span>
          <span onClick={handleDelete}>Delete</span>
        </div>
      )}

      {replying && (
        <div className="mt-2">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onCancel={() => setReplying(false)}
            onSubmitSuccess={() => setReplying(false)}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection = ({ postId }) => {
  const dispatch = useDispatch();
  const { items: comments, loading, error } = useSelector((state) => state.comments);

  useEffect(() => {
    if (postId) {
      dispatch(fetchComments(postId));
    }
  }, [dispatch, postId]);

  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>

      <CommentForm postId={postId} />

      {loading && <p>Loading comments...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {comments.length === 0 && !loading && <p className="text-gray-500">No comments yet.</p>}

      <div className="mt-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
