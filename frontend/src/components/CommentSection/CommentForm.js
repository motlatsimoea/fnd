import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { useDispatch } from "react-redux";
import EmojiPicker from "emoji-picker-react";

import {
  createComment,
  updateComment,
} from "../../features/blog/Comment-slice";

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
  const emojiPickerRef = useRef(null);

  const [content, setContent] =
    useState(initialText);

  const [loading, setLoading] =
    useState(false);

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  useEffect(() => {
    setContent(initialText);
  }, [initialText]);

  /*
   * Close the emoji picker when the user
   * clicks outside of it.
   */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(
          event.target
        )
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleEmojiClick = (
    emojiData
  ) => {
    editorRef.current?.insertEmoji(
      emojiData.emoji
    );

    setShowEmojiPicker(false);
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!content) {
      return;
    }

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

        setShowEmojiPicker(false);
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
        setShowEmojiPicker(false);

        editorRef.current?.clearEditor();
      }
    } catch (error) {
      console.error(
        "COMMENT SUBMISSION ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="comment-form"
    >
      <PostEditor
        ref={editorRef}
        onChange={setContent}
        initialContent={initialText}
      />

      <div className="comment-toolbar">
        <div
          className="comment-emoji-container"
          ref={emojiPickerRef}
        >
          <button
            type="button"
            className="comment-emoji-btn"
            onClick={() =>
              setShowEmojiPicker(
                (previous) => !previous
              )
            }
            disabled={loading}
            aria-label="Choose emoji"
            title="Choose emoji"
          >
            😊
          </button>

          {showEmojiPicker && (
            <div className="comment-emoji-picker">
              <EmojiPicker
                onEmojiClick={
                  handleEmojiClick
                }
                previewConfig={{
                  showPreview: false,
                }}
                width={320}
                height={400}
              />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={
              loading || !content
            }
            className="btn-submit"
          >
            {isEditing
              ? "💬 Update"
              : "📝 Post"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-cancel"
            >
              ❌ Cancel
            </button>
          )}

          {loading && <Loader />}
        </div>
      </div>
    </form>
  );
};

export default CommentForm;