import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchReviews, createReview, clearReviewError } from '../../features/products/review-slice';
import './Reviews.css';

const Reviews = ({ productId }) => {
  const dispatch = useDispatch();
  const reviews = useSelector((state) => state.reviews.reviewsByProduct[productId] || []);
  const { createStatus, error } = useSelector((state) => state.reviews);

  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (productId) {
      dispatch(fetchReviews(productId));
    }
  }, [dispatch, productId]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) {
      dispatch(clearReviewError());
    }
  }, [name, rating, comment, dispatch, error]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const isFormValid = () => {
    return name.trim() !== '' && rating > 0 && comment.trim() !== '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Please fill out all fields!');
      return;
    }
    try {
      await dispatch(createReview({ productId, reviewData: { author: name, rating, content: comment } })).unwrap();
      setName('');
      setRating(0);
      setComment('');
      setSuccessMessage('Review submitted successfully!');
    } catch {
      alert('Error submitting review!');
    }
  };

  return (
    <div className="reviews-section">
      <h3>Customer Reviews</h3>

      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first!</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="review-card">
            <strong>{review.author}</strong>
            <p>
              Rating: {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </p>
            <p>{review.content}</p>
          </div>
        ))
      )}

      <div className="review-form">
        <h4>Write a Review</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createStatus === 'loading'}
            />
          </div>
          <div className="form-group">
            <label>Rating:</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= rating ? 'star filled' : 'star'}
                  onClick={() => setRating(star)}
                  style={{ cursor: createStatus === 'loading' ? 'default' : 'pointer' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Comment:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              required
              disabled={createStatus === 'loading'}
            />
          </div>
          <button type="submit" disabled={!isFormValid() || createStatus === 'loading'}>
            {createStatus === 'loading' ? 'Submitting...' : 'Submit Review'}
          </button>
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
        </form>
      </div>
    </div>
  );
};

export default Reviews;
