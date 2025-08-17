import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteComment } from '../../features/blog/Comment-slice';
import CommentForm from './CommentForm';

const CommentItem = ({ comment, postId, depth = 0 }) => {
  const dispatch = useDispatch();
  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // ⬇️ Check if comment still exists in store
  const existingComment = useSelector((state) => {
    const findComment = (tree, id) => {
      for (let node of tree) {
        if (node.id === id) return node;
        if (node.replies) {
          const found = findComment(node.replies, id);
          if (found) return found;
        }
      }
      return null;
    };
    return findComment(state.comments.items, comment.id);
  });

  if (!existingComment) {
    return null; // ⬅️ If deleted, don't render
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this comment?')) {
      await dispatch(deleteComment({ postId, commentId: comment.id }));
      setShowReply(false);   // reset reply state
      setIsEditing(false);   // reset edit state
    }
  };

  return (
    <div className="comment-item" style={{ marginLeft: depth * 20 }}>
      <div className="comment-header">
        <strong>{comment.author}</strong>
        <span className="comment-date">
          {new Date(comment.created_at).toLocaleString()}
        </span>
        <button onClick={() => setCollapsed(!collapsed)} className="collapse-btn">
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {!collapsed && (
        <>
          {!isEditing ? (
            <p className="comment-content">{comment.content}</p>
          ) : (
            <CommentForm
              postId={postId}
              parentId={comment.id}
              initialText={comment.content}
              isEditing
              onCancel={() => setIsEditing(false)}
            />
          )}

          <div className="comment-actions">
            <button onClick={() => setShowReply(!showReply)}>Reply</button>
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
          </div>

          {showReply && (
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCancel={() => setShowReply(false)}
            />
          )}

          {existingComment.replies && existingComment.replies.length > 0 && (
            <div className="comment-replies">
              {existingComment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentItem;
