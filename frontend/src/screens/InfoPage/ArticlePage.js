import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CommentSection from '../../components/CommentSection/CommentSection';

const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${id}/`);
        if (!response.ok) {
          throw new Error('Article not found');
        }
        const data = await response.json();
        setArticle(data);
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) return <p>Loading article...</p>;
  if (notFound || !article) return <h1>Article not found</h1>;

  return (
    <div className="article-page">
      <h1>{article.title}</h1>
      {article.image && (
        <img src={article.image} alt={article.title} style={{ maxWidth: '100%' }} />
      )}
      <p><strong>By {article.author}</strong> | {article.date}</p>
      <div className="content">
        <p>{article.content}</p>
      </div>
      <CommentSection articleId={id} />
    </div>
  );
};

export default ArticlePage;
