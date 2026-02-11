import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createPost } from '../../features/blog/BlogList-slice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

import { FaImage, FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

import './CreatePost.css';

const hashtagRegex = /#(\w+)/g;

const CreatePost = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [cursorPos, setCursorPos] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------- Hashtag highlight ---------------- */

  const highlightedContent = content.replace(
    hashtagRegex,
    '<span class="hashtag">#$1</span>'
  ).replace(/\n/g, '<br />');

  /* ---------------- Detect active hashtag ---------------- */

  useEffect(() => {
    const textUpToCursor = content.slice(0, cursorPos);
    const match = textUpToCursor.match(/#(\w*)$/);

    if (match && match[1].length > 0) {
      fetch(`/api/hashtags/?q=${match[1]}`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [content, cursorPos]);

  const insertHashtag = (tag) => {
    const before = content.slice(0, cursorPos).replace(/#\w*$/, '');
    const after = content.slice(cursorPos);
    const newText = `${before}#${tag} ${after}`;

    setContent(newText);
    setSuggestions([]);

    setTimeout(() => {
      textareaRef.current.focus();
    }, 0);
  };

  /* ---------------- Media logic ---------------- */

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 4));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  /* ---------------- Submit ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const tags = Array.from(
      new Set(content.match(hashtagRegex)?.map(t => t.slice(1)) || [])
    );

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    tags.forEach(tag => {
                    formData.append('hashtag_names', tag);
                  });
    files.forEach((file) => formData.append('media_files', file));

    try {
      await dispatch(createPost(formData)).unwrap();
      toast.success('Post created!');
      navigate('/');
    } catch (err) {
      setError(err || 'Something went wrong.');
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

        {/* Editor */}
        <div className="editor-wrapper">
          <div
            className="highlight-layer"
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
          />
          <textarea
            ref={textareaRef}
            className="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={(e) => setCursorPos(e.target.selectionStart)}
            placeholder="What's on your mind?"
            rows="5"
            required
          />
        </div>

        {/* Hashtag suggestions */}
        {suggestions.length > 0 && (
          <ul className="hashtag-suggestions">
            {suggestions.map(tag => (
              <li key={tag.id} onClick={() => insertHashtag(tag.name)}>
                #{tag.name}
              </li>
            ))}
          </ul>
        )}

        {/* Media previews */}
        {files.length > 0 && (
          <div className="media-previews">
            {files.map((file, i) => (
              <div key={i} className="media-preview-item">
                {file.type.startsWith('image/') && (
                  <img src={URL.createObjectURL(file)} alt="" />
                )}
                {file.type.startsWith('video/') && (
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

        <div className="post-toolbar">
          <div className="toolbar-left">
            <button type="button" onClick={() => fileInputRef.current.click()}>
              <FaImage />
            </button>
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <FaSmile />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
            />
          </div>

          <button type="submit" className="post-btn">Post</button>
        </div>

        {showEmojiPicker && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;
