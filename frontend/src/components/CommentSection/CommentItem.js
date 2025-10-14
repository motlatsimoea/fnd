import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteComment } from "../../features/blog/Comment-slice";
import CommentForm from "./CommentForm";
import { FaReply, FaEdit, FaTrash } from "react-icons/fa";
import "./CommentSection.css";

const CommentItem = ({ comment, postId, depth = 0 }) => {
  const dispatch = useDispatch();
  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  if (!existingComment) return null;

  const handleDelete = async () => {
    if (window.confirm("Delete this comment?")) {
      await dispatch(deleteComment({ postId, commentId: comment.id }));
      setShowReply(false);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="comment-item"
      style={{ marginLeft: depth * 20 }}
    >
      {/* Header */}
      <div className="comment-header">
        <div className="comment-avatar-wrapper">
          {comment.author_profile_image ? (
            <img
              src={comment.author_profile_image}
              alt={comment.author_username}
              className="comment-avatar"
            />
          ) : (
            <div className="comment-avatar-fallback">
              {comment.author_username[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="comment-user-info">
          <span className="comment-username">{comment.author_username}</span>
          <span className="comment-time">{comment.time_since_posted}</span>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="comment-toggle"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>


      {/* Body */}
      {!collapsed && (
        <div className="comment-body">
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

          {/* Buttons */}
          <div className="comment-actions">
            <button
              onClick={() => setShowReply(!showReply)}
              className="comment-btn reply-btn"
            >
              <FaReply /> Reply
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="comment-btn edit-btn"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="comment-btn delete-btn"
            >
              <FaTrash /> Delete
            </button>
          </div>

          {/* Reply Form */}
          {showReply && (
            <div className="reply-form-wrapper">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}

          {/* Replies */}
          {existingComment.replies?.length > 0 && (
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
        </div>
      )}
    </div>
  );
};

export default CommentItem;
