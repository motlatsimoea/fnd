import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchSinglePost, updatePost } from "../../features/blog/BlogList-slice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import PostEditor from "../../components/editor/PostEditor";
import "./CreatePost.css";

const EditPost = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const editorRef = useRef(null);

  const { singlePost, loading, error } = useSelector(
    (state) => state.BlogList
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 🔥 NEW
  const [existingMedia, setExistingMedia] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    dispatch(fetchSinglePost(id));
  }, [dispatch, id]);

  // ✅ Prefill everything
  useEffect(() => {
    if (singlePost) {
      setTitle(singlePost.title);
      setContent(singlePost.content);

      if (singlePost.media) {
        setExistingMedia(singlePost.media);
      }
    }
  }, [singlePost]);

  const handleFileUpload = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected].slice(0, 4));
  };

  const removeNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", title);
    formData.append("content", content);

    // 🔥 KEEP existing media IDs
    existingMedia.forEach((media) => {
      formData.append("existing_media_ids[]", media.id);
    });

    // 🔥 NEW uploads
    files.forEach((file) => {
      formData.append("media_files", file);
    });

    try {
      await dispatch(updatePost({ postId: id, postData: formData })).unwrap();
      navigate(`/blog/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!singlePost) return null;

  return (
    <div className="edit-post-wrapper">
      <form className="post-card" onSubmit={handleSubmit}>
        <h2>Edit Post</h2>

        <input
          className="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* ✅ IMPORTANT */}
        <PostEditor
          ref={editorRef}
          initialContent={singlePost.content}
          onChange={setContent}
        />

        {/* 🔥 EXISTING MEDIA */}
        {existingMedia.length > 0 && (
          <div className="media-previews">
            {existingMedia.map((img, i) => (
              <div key={i} className="media-preview-item">
                <img src={img.file} alt="" />
                <button
                  type="button"
                  className="remove-media-btn"
                  onClick={() => removeExistingImage(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 🔥 NEW FILES */}
        <input type="file" multiple onChange={handleFileUpload} />

        {files.length > 0 && (
          <div className="media-previews">
            {files.map((file, i) => (
              <div key={i} className="media-preview-item">
                <img src={URL.createObjectURL(file)} alt="" />
                <button
                  type="button"
                  className="remove-media-btn"
                  onClick={() => removeNewFile(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="post-btn">
          Update Post
        </button>
      </form>
    </div>
  );
};

export default EditPost;