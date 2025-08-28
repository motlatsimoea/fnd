import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSinglePost, toggleLikePost } from '../../features/blog/BlogList-slice';
import { useParams } from 'react-router-dom';
import CommentSection from '../../components/CommentSection/CommentSection';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import ImageModal from '../../components/ImageModal';
import ImageCarouselModal from '../../components/ImageCarouselModal';
import './BlogPostPage.css';

const BlogPostPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { singlePost, loading, error } = useSelector((state) => state.BlogList);

  const [zoomImage, setZoomImage] = useState(null); // single-image zoom (profile)
  const [showGallery, setShowGallery] = useState(false); // multi-image gallery
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchSinglePost(id));
    }
  }, [dispatch, id]);

  const handleToggleLike = () => {
    if (singlePost) {
      dispatch(toggleLikePost(singlePost.id));
    }
  };

  const openGalleryAt = (index) => {
    setGalleryStartIndex(index);
    setShowGallery(true);
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!singlePost) return <Message variant="warning">No post found.</Message>;

  return (
    <div className="blog-post-page">
      <div className="blog-post">
        <div className="post-header">
          <div className="user-info">
            <img
              src={singlePost.authorImage || 'https://via.placeholder.com/50'}
              alt="User profile"
              className="user-image"
              onClick={() => singlePost.authorImage && setZoomImage(singlePost.authorImage)}
              style={{ cursor: 'pointer' }}
            />
            <div className="user-details">
              <h3 className="post-title">{singlePost.title}</h3>
              <p className="user-name">{singlePost.author.username}</p>
              <p className="post-date">{singlePost.time_since_posted}</p>
            </div>
          </div>
        </div>

        <div className="post-content">
          <p>{singlePost.content}</p>

          {singlePost.media && singlePost.media.length > 0 && (
            <div className="post-images">
              {singlePost.media.map((img, i) => (
                <img
                  key={i}
                  src={img.file}
                  alt={`Image ${i + 1}`}
                  onClick={() => openGalleryAt(i)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
          )}

          <button
            className="like-button"
            onClick={handleToggleLike}
          >
            <span
              role="img"
              aria-label="heart"
              style={{ color: singlePost.liked ? 'red' : 'darkgray', fontSize: '1.2rem' }}
            >
              ❤️
            </span>{' '}
            {singlePost.like_count || 0} Likes
          </button>

          <p className="post-summary">{singlePost.summary}</p>
        </div>
      </div>

      <CommentSection postId={id} />

      {/* Single-image zoom modal */}
      {zoomImage && <ImageModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}

      {/* Multi-image slider gallery */}
      {showGallery && (
        <ImageCarouselModal
          images={singlePost.media}
          initialIndex={galleryStartIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default BlogPostPage;
