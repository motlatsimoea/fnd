import React, { useState } from 'react';
import './CreatePost.css';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Post Title:', title);
    console.log('Post Content:', content);
    console.log('Uploaded File:', file);
  };

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]); // Save the uploaded file
  };

  const renderFilePreview = () => {
    if (!file) return null;

    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      return <img src={URL.createObjectURL(file)} alt="Preview" className="file-preview" />;
    } else if (fileType.startsWith('video/')) {
      return (
        <video controls className="file-preview">
          <source src={URL.createObjectURL(file)} type={fileType} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return <p className="file-name">File Selected: {file.name}</p>;
    }
  };

  return (
    <div className="create-post-page">
      <h1>Create a New Post</h1>
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
          <label htmlFor="file">Upload Image, Video, or Document</label>
          <input
            type="file"
            id="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
          />
          {renderFilePreview()}
        </div>
        <button type="submit" className="submit-button">
          Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
