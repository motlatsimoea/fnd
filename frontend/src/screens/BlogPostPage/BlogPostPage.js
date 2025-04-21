import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSinglePost } from '../../features/blog/BlogList-slice';
import { useParams } from 'react-router-dom';
import CommentSection from '../../components/CommentSection/CommentSection';
import './BlogPostPage.css';

const BlogPostPage = () => {
  const { id } = useParams(); // Get the post ID from the URL
  const dispatch = useDispatch();

  const { singlePost, loading, error } = useSelector((state) => state.blogs);

  useEffect(() => {
    if (id) {
      dispatch(fetchSinglePost(id));
    }
  }, [dispatch, id]);

  if (loading) return <p>Loading post...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!singlePost) return <p>No post found.</p>;

  return (
    <div className="blog-post-page">
      <div className="blog-post">
        <div className="post-header">
          <div className="user-info">
            <img
              src={singlePost.authorImage || 'https://via.placeholder.com/50'}
              alt="User profile"
              className="user-image"
            />
            <div className="user-details">
              <h3 className="post-title">{singlePost.title}</h3>
              <p className="user-name">{singlePost.authorName}</p>
              <p className="post-date">{new Date(singlePost.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="post-content">
          <p>{singlePost.content}</p>

          {singlePost.images && (
            <div className="post-images">
              {singlePost.images.map((img, i) => (
                <img key={i} src={img} alt={`Image ${i + 1}`} />
              ))}
            </div>
          )}

          <button className="like-button">
            <span role="img" aria-label="heart">❤️</span> {singlePost.likes || 0} Likes
          </button>

          <p className="post-summary">{singlePost.summary}</p>
        </div>
      </div>

      <CommentSection postId={id} />
    </div>
  );
};

export default BlogPostPage;
