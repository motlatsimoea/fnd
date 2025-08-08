import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSinglePost } from '../../features/blog/BlogList-slice';
import { useParams } from 'react-router-dom';
import CommentSection from '../../components/CommentSection/CommentSection';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import './BlogPostPage.css';

const BlogPostPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { singlePost, loading, error } = useSelector((state) => state.BlogList);

  useEffect(() => {
    if (id) {
      dispatch(fetchSinglePost(id));
    }
  }, [dispatch, id]);

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
                <img key={i} src={img.file} alt={`Image ${i + 1}`} />
              ))}
            </div>
          )}

          <button className="like-button">
            <span role="img" aria-label="heart">❤️</span> {singlePost.likes_count || 0} Likes
          </button>

          <p className="post-summary">{singlePost.summary}</p>
        </div>
      </div>

      <CommentSection postId={id} />
    </div>
  );
};

export default BlogPostPage;
