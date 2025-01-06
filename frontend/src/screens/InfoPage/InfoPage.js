import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Assuming you are using React Router for navigation
import './InfoPage.css';

const InfoPage = () => {
  const articles = [
    {
      id: 1,
      title: 'The Future of AI in Agriculture',
      image: '/images/ai-agriculture.jpg',
      date: 'November 25, 2024',
      author: 'John Doe',
      content: 'Content of the article will be here...',
    },
    {
      id: 2,
      title: 'Sustainable Farming Practices',
      image: '/images/sustainable-farming.jpg',
      date: 'November 22, 2024',
      author: 'Jane Smith',
      content: 'Content of the article will be here...',
    },
    {
      id: 3,
      title: 'The Rise of Vertical Farming',
      image: '/images/vertical-farming.jpg',
      date: 'November 20, 2024',
      author: 'David Wilson',
      content: 'Content of the article will be here...',
    },
    // Add more articles here
  ];

  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="info-page">
      <h1>Welcome to the Library</h1>
      <input
        type="text"
        placeholder="Search Articles"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-box"
      />
      <div className="article-grid">
        {filteredArticles.map((article) => (
          <div key={article.id} className="article-card">
            <img src={article.image} alt={article.title} />
            <h2>
              <Link to={`/article/${article.id}`}>{article.title}</Link>
            </h2>
            <p>{article.date} | {article.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoPage;
