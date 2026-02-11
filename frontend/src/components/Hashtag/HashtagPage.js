import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BlogPost from '../BlogPost/BlogPost';

const HashtagPage = () => {
  const { name } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axios.get(`/api/posts/?hashtag=${name}`)
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  }, [name]);

  return (
    <div>
      <h2>#{name}</h2>
      {posts.map(post => (
        <BlogPost
          key={post.id}
          id={post.id}
          title={post.title}
          author={post.author.username}
          date={post.time_since_posted}
          authorImage={post.authorImage}
          images={post.media}        
          text={post.content}
          likes={post.like_count}
          liked={post.is_liked}
        />
      ))}
    </div>
  );
};

export default HashtagPage;
