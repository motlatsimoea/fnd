import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { createComment, updateComment } from "../../features/blog/Comment-slice";
import Loader from "../Loader";
import PostEditor from "../editor/PostEditor";
import "./CommentSection.css";

const CommentForm = ({
  postId,
  parentId = null,
  commentId = null,
  initialText = "",
  onCancel,
  isEditing = false,
}) => {
  const dispatch = useDispatch();
  const editorRef = useRef(null);

  const [content, setContent] = useState(initialText);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setContent(initialText);
  }, [initialText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content) return;

    setLoading(true);

    try {
      if (isEditing) {
        await dispatch(
          updateComment({
            postId,
            commentId,
            text: content,
          })
        ).unwrap();

        onCancel?.();
      } else {
        await dispatch(
          createComment({
            postId,
            text: content,
            parent: parentId,
          })
        ).unwrap();

        setContent("");
        editorRef.current?.clearEditor();
      }
    } catch (err) {
      console.error("COMMENT UPDATE ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <PostEditor 
        ref={editorRef} 
        onChange={setContent} 
        initialContent={initialText} 
      />

      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
        >
          {isEditing ? "💬 Update" : "📝 Post"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
          >
            ❌ Cancel
          </button>
        )}

        {loading && <Loader />}
      </div>
    </form>
  );
};

export default CommentForm;