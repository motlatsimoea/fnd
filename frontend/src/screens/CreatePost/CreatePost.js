import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createPost } from "../../features/blog/BlogList-slice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import PostEditor from "../../components/editor/PostEditor";
import EmojiPicker from "emoji-picker-react";
import "./CreatePost.css";

const hashtagRegex = /#(\w+)/g;

const CreatePost = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const editorRef = useRef(null); // ✅ NEW

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------- Emoji ---------- */
  const handleEmojiClick = (emojiData) => {
    if (editorRef.current) {
      editorRef.current.insertEmoji(emojiData.emoji);
    }

    // ✅ Auto close picker
    setShowEmojiPicker(false);
  };

  /* ---------- Media Upload ---------- */
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 4));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const tags = Array.from(
      new Set(content.match(hashtagRegex)?.map((t) => t.slice(1)) || [])
    );

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    tags.forEach((tag) => formData.append("hashtag_names", tag));
    files.forEach((file) => formData.append("media_files", file));

    try {
      await dispatch(createPost(formData)).unwrap();
      toast.success("Post created!");
      navigate("/");
    } catch (err) {
      setError(err || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-wrapper">
      <form className="post-card" onSubmit={handleSubmit}>
        <h2>Create a new post</h2>

        {error && <Message variant="danger">{error}</Message>}
        {loading && <Loader />}

        <input
          className="post-title"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* ---------- Text Editor ---------- */}
        <PostEditor ref={editorRef} onChange={setContent} />

        {/* ---------- Toolbar BELOW editor ---------- */}
        <div className="editor-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            😄
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => fileInputRef.current.click()}
          >
            🖼️
          </button>

          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
          />
        </div>

        {/* ---------- Emoji Picker ---------- */}
        {showEmojiPicker && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        {/* ---------- Media Preview ---------- */}
        {files.length > 0 && (
          <div className="media-previews">
            {files.map((file, i) => (
              <div key={i} className="media-preview-item">
                {file.type.startsWith("image/") && (
                  <img src={URL.createObjectURL(file)} alt="" />
                )}
                {file.type.startsWith("video/") && (
                  <video src={URL.createObjectURL(file)} controls />
                )}
                <button
                  type="button"
                  className="remove-media-btn"
                  onClick={() => removeFile(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="post-btn">
          Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
