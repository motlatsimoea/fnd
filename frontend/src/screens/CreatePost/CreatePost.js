import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPost } from '../features/blogs/blogSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import './CreatePost.css';

const CreatePost = () => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    files.forEach((file) => formData.append('media_files', file));

    try {
      await dispatch(createPost(formData)).unwrap();
      setTitle('');
      setContent('');
      setFiles([]);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const renderFilePreviews = () =>
    files.map((file, index) => {
      const fileType = file.type;
      const key = `${file.name}-${index}`;

      if (fileType.startsWith('image/')) {
        return (
          <img
            key={key}
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="file-preview"
          />
        );
      } else if (fileType.startsWith('video/')) {
        return (
          <video key={key} controls className="file-preview">
            <source src={URL.createObjectURL(file)} type={fileType} />
            Your browser does not support the video tag.
          </video>
        );
      } else {
        return <p key={key} className="file-name">File Selected: {file.name}</p>;
      }
    });

  return (
    <div className="create-post-page">
      <h1>Create a New Post</h1>

      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}

      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            rows="8"
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="file">Upload Images or Videos (max 4)</label>
          <input
            type="file"
            id="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
          />
          <div className="file-previews">{renderFilePreviews()}</div>
        </div>
        <button type="submit" className="submit-button">
          Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
