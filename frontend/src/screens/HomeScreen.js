import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import BlogPost from '../components/BlogPost/BlogPost';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { fetchBlogPosts } from '../features/blogs/blogSlice';

const HomeScreen = () => {
  const dispatch = useDispatch();

  const blogList = useSelector((state) => state.blogs);
  const { loading, error, posts } = blogList;

  useEffect(() => {
    dispatch(fetchBlogPosts());
  }, [dispatch]);

  return (
    <div>
      <Header />
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
              title={post.title}
              author={post.author}
              date={post.date}
              authorImage={post.authorImage}
              images={post.images}
              text={post.text}
              likes={post.likes}
            />
          ))
        )}
      </main>
    </div>
  );
};

export default HomeScreen;
