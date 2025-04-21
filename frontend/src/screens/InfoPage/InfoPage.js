import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const InfoPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(`/api/articles/?q=${searchTerm}`);
        const data = await response.json();
        setArticles(data.results || data); // in case of pagination
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
    };

    fetchArticles();
  }, [searchTerm]);

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
        {articles.map((article) => (
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
