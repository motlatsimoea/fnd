import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
import { createPost } from "../../features/blog/BlogList-slice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import PostEditor from "../../components/editor/PostEditor";
import EmojiPicker from "emoji-picker-react";
import "./CreatePost.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "video/mp4"];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 4;
const DRAFT_KEY = "createPostDraft";

const CreatePost = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  /** ---------- AUTO DRAFT RESTORE ---------- */
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setTitle(parsed.title || "");
        setContent(parsed.content || "");
      } catch {}
    }
  }, []);

  /** ---------- AUTO DRAFT SAVE ---------- */
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }));
  }, [title, content]);

  /** ---------- EMOJI ---------- */
  const handleEmojiClick = (emojiData) => {
    if (editorRef.current) editorRef.current.insertEmoji(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  /** ---------- IMAGE COMPRESSION ---------- */
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    try {
      return await imageCompression(file, options);
    } catch {
      return file; // fallback
    }
  };

  /** ---------- FILE UPLOAD HANDLER ---------- */
  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const processedFiles = [];

    for (let file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.type}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024 && file.type.startsWith("image/")) {
        toast.info(`Compressing ${file.name}...`);
        file = await compressImage(file);
      }
      processedFiles.push(file);
    }

    setFiles((prev) => [...prev, ...processedFiles].slice(0, MAX_FILES));
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /** ---------- DRAG & DROP ---------- */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFileUpload({ target: { files: droppedFiles } });
  };

  /** ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title || !content) {
      setError("Title and content are required.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    files.forEach((file) => formData.append("media_files", file));

    try {
      await dispatch(createPost(formData)).unwrap();
      toast.success("Post created!");
      localStorage.removeItem(DRAFT_KEY);
      navigate("/");
    } catch (err) {
      setError(err || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-wrapper">
      <form
        className={`post-card ${isDragging ? "dragging" : ""}`}
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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

        <PostEditor ref={editorRef} onChange={setContent} />

        {/* Toolbar */}
        <div className="editor-toolbar">
          <button type="button" className="toolbar-btn" onClick={() => setShowEmojiPicker((p) => !p)}>😄</button>
          <button type="button" className="toolbar-btn" onClick={() => fileInputRef.current.click()}>🖼️</button>
          <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" multiple onChange={handleFileUpload} />
        </div>

        {showEmojiPicker && <div className="emoji-picker-wrapper"><EmojiPicker onEmojiClick={handleEmojiClick} /></div>}

        {/* Media Preview */}
        {files.length > 0 && (
          <div className="media-previews">
            {files.map((file, i) => (
              <div key={i} className="media-preview-item">
                {file.type.startsWith("image/") && <img src={URL.createObjectURL(file)} alt="" />}
                {file.type.startsWith("video/") && <video src={URL.createObjectURL(file)} controls />}
                <button type="button" className="remove-media-btn" onClick={() => removeFile(i)}>×</button>
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