import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BlogPost from '../components/BlogPost/BlogPost';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { fetchBlogPosts } from '../features/blog/BlogList-slice';

const HomeScreen = () => {
  const dispatch = useDispatch();

  const blogList = useSelector((state) => state.BlogList);
  const { loading, error, posts } = blogList;

  useEffect(() => {
    dispatch(fetchBlogPosts());
  }, [dispatch]);

  return (
    <div>
      <main style={{ padding: '20px' }}>
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : posts.length === 0 ? (
          <Message variant="info">No blog posts available...</Message>
        ) : (
          posts.map((post) => (
            <BlogPost
              key={post.id}
              id={post.id}
              title={post.title}
              author={post.author.username}
              date={post.time_since_posted}
              authorImage={post.authorImage}
              images={post.media}
              text={post.content}
              likes={post.likes_count}
            />
          ))
        )}
      </main>
    </div>
  );
};

export default HomeScreen;
