import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchSinglePost, 
  toggleLikePost, 
  deletePost 
} from "../../features/blog/BlogList-slice";
import { useParams, useNavigate } from "react-router-dom";
import CommentSection from "../../components/CommentSection/CommentSection";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import ImageModal from "../../components/ImageModal";
import ImageCarouselModal from "../../components/ImageCarouselModal";
import { FaArrowLeft, FaHeart } from "react-icons/fa";
import { renderLexicalContent } from "../../utils/renderLexicalContent";
import "./BlogPostPage.css";

const BlogPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { singlePost, loading, error } = useSelector((state) => state.BlogList);
  const userInfo = useSelector((state) => state.auth.userInfo);

  const [zoomImage, setZoomImage] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchSinglePost(id));
    }
  }, [dispatch, id]);

  const handleToggleLike = () => {
    if (singlePost) dispatch(toggleLikePost(singlePost.id));
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      await dispatch(deletePost(singlePost.id)).unwrap();

      setShowDeleteModal(false);
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openGalleryAt = (index) => {
    setGalleryStartIndex(index);
    setShowGallery(true);
  };

  const isOwner =
    userInfo?.username === singlePost?.author?.username;

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!singlePost) return <Message variant="warning">No post found.</Message>;

  return (
  <>
    <div className="blog-post-page">

      <button className="back-arrow" onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </button>

      <div className="blog-post-card">

        <div className="post-header">

          <img
            src={singlePost.authorImage || "https://via.placeholder.com/50"}
            alt={singlePost.author.username}
            className="user-image"
            onClick={() =>
              singlePost.authorImage && setZoomImage(singlePost.authorImage)
            }
          />

          <div className="user-details">
            <h2 className="post-title">{singlePost.title}</h2>
            <p className="user-name">@{singlePost.author.username}</p>
            <p className="post-date">{singlePost.time_since_posted}</p>

            {isOwner && (
              <div className="post-actions">
                <button
                  className="edit-btn"
                  onClick={() => navigate(`/edit-post/${singlePost.id}`)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="post-content">

          {renderLexicalContent(singlePost.content)}

          {singlePost.media?.length > 0 && (
            <div className="post-images">
              {singlePost.media.map((img, i) => (
                <img
                  key={i}
                  src={img.file}
                  alt={`Slide ${i}`}
                  onClick={() => openGalleryAt(i)}
                />
              ))}
            </div>
          )}

          <button
            className={`like-button ${singlePost.liked ? "liked" : ""}`}
            onClick={handleToggleLike}
          >
            <FaHeart className="like-icon" />
            <span className="like-count">
              {singlePost.like_count || 0}
            </span>
          </button>

        </div>
      </div>

      <CommentSection postId={id} />

      {zoomImage && (
        <ImageModal
          imageUrl={zoomImage}
          onClose={() => setZoomImage(null)}
        />
      )}

      {showGallery && (
        <ImageCarouselModal
          images={singlePost.media}
          initialIndex={galleryStartIndex}
          onClose={() => setShowGallery(false)}
        />
      )}

    </div>

    {showDeleteModal && (
      <div className="modal-overlay">
        <div className="modal-card">

          <h3>
            delete this Post?
          </h3>

          <div className="modal-actions">

            <button
              className="modal-cancel"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button
              className="modal-delete"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>

          </div>

        </div>
      </div>
    )}
  </>
);
};
export default BlogPostPage;