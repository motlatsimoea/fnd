import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchReviews, createReview } from '../../features/products/review-slice';
import './Reviews.css';

const Reviews = ({ productId }) => {
  const dispatch = useDispatch();
  const reviews = useSelector(
    (state) => state.reviews.reviewsByProduct[productId] || []
  );
  const { createStatus, error } = useSelector((state) => state.reviews);

  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (productId) {
      dispatch(fetchReviews(productId));
    }
  }, [dispatch, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !rating || !comment) {
      alert('Please fill out all fields!');
      return;
    }
    try {
      await dispatch(
        createReview({
          productId,
          reviewData: { user: name, rating, comment },
        })
      ).unwrap();
      setName('');
      setRating(0);
      setComment('');
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
            <strong>{review.user}</strong>
            <p>
              Rating: {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </p>
            <p>{review.comment}</p>
          </div>
        ))
      )}

      <div className="review-form">
        <h4>Write a Review</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Rating:</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= rating ? 'star filled' : 'star'}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Comment:</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="4" required />
          </div>
          <button type="submit" disabled={createStatus === 'loading'}>
            {createStatus === 'loading' ? 'Submitting...' : 'Submit Review'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Reviews;
