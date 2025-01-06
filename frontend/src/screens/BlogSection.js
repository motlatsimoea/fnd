import React from 'react';
import BlogPost from '../components/BlogPost/BlogPost';

const BlogSection = () => {
  const dummyPosts = [
    {
      title: 'Kissing ass: Tips for Success',
      author: 'John Doe',
      date: 'November 22, 2024',
      authorImage: 'https://via.placeholder.com/50',
      images: [
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
      ],
      text: 'Sustainable farming is critical to ensure food security and environmental health...',
      likes: 15,
    },
    {
      title: 'How to Grow Tomatoes at Home',
      author: 'Jane Smith',
      date: 'November 20, 2024',
      authorImage: 'https://via.placeholder.com/50',
      images: [
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
      ],
      text: 'Growing tomatoes is both fun and rewarding. Follow these steps to get started...',
      likes: 25,
    },
  ];

  return (
    <div className="blog-section">
      {dummyPosts.map((post, index) => (
        <BlogPost
          key={index}
          title={post.title}
          author={post.author}
          date={post.date}
          authorImage={post.authorImage}
          images={post.images}
          text={post.text}
          likes={post.likes}
        />
      ))}
    </div>
  );
};

export default BlogSection;

