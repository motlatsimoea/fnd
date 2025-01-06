import React, { useState } from 'react';
import './Reviews.css';

const Reviews = ({ reviews: initialReviews }) => {
  // State to manage reviews
  const [reviews, setReviews] = useState(initialReviews);

  // Form states
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Handle review submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !rating || !comment) {
      alert('Please fill out all fields!');
      return;
    }

    const newReview = {
      id: reviews.length + 1,
      user: name,
      rating,
      comment,
    };

    // Add new review and reset form
    setReviews([...reviews, newReview]);
    setName('');
    setRating(0);
    setComment('');
  };

  return (
    <div className="reviews-section">
      <h3>Customer Reviews</h3>

      {/* Display Existing Reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="review-card">
          <strong>{review.user}</strong>
          <p>
            Rating: {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
          </p>
          <p>{review.comment}</p>
        </div>
      ))}

      {/* Add a New Review Form */}
      <div className="review-form">
        <h4>Write a Review</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="rating">Rating:</label>
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
            <label htmlFor="comment">Comment:</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default Reviews;
