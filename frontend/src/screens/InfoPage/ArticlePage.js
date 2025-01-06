import React from 'react';
import { useParams } from 'react-router-dom';
import CommentSection from '../../components/CommentSection/CommentSection'; // Adjust this path if needed

const ArticlePage = () => {
  const { id } = useParams();

  // Replace with your actual articles data source
  const articles = [
    {
      id: 1,
      title: 'The Future of AI in Agriculture',
      image: '/images/ai-agriculture.jpg',
      date: 'November 25, 2024',
      author: 'John Doe',
      content: 'AI is revolutionizing agriculture with predictive analysis, automated harvesting...',
    },
    {
      id: 2,
      title: 'Sustainable Farming Practices',
      image: '/images/sustainable-farming.jpg',
      date: 'November 22, 2024',
      author: 'Jane Smith',
      content: 'Sustainable farming practices aim to reduce environmental impact...',
    },
    {
      id: 3,
      title: 'The Rise of Vertical Farming',
      image: '/images/vertical-farming.jpg',
      date: 'November 20, 2024',
      author: 'David Wilson',
      content: 'Vertical farming is growing in popularity due to its efficiency in urban areas...',
    },
  ];

  // Find the article by id
  const article = articles.find((article) => article.id === parseInt(id));

  if (!article) {
    return <h1>Article not found</h1>;
  }

  return (
    <div className="article-page">
      <h1>{article.title}</h1>
      <img src={article.image} alt={article.title} style={{ maxWidth: '100%' }} />
      <p><strong>By {article.author}</strong> | {article.date}</p>
      <div className="content">
        <p>{article.content}</p>
      </div>
      <CommentSection />
    </div>
  );
};

export default ArticlePage;
