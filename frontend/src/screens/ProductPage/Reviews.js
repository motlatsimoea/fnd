import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchReviews,
  createReview,
  updateReview,
  deleteReview,
  clearReviewError,
} from "../../features/products/review-slice";
import "./Reviews.css";

const Reviews = ({ productId }) => {
  const dispatch = useDispatch();
  const reviews = useSelector(
    (state) => state.reviews.reviewsByProduct[productId] || []
  );
  const { createStatus, updateStatus, deleteStatus, error } = useSelector(
    (state) => state.reviews
  );
  const { userInfo } = useSelector((state) => state.auth);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (productId) dispatch(fetchReviews(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    if (error) dispatch(clearReviewError());
  }, [rating, comment, dispatch, error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const isFormValid = () => rating >= 1 && rating <= 5 && comment.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid())
      return alert("Please provide a valid rating (1-5) and comment!");

    const payload = { rating: Number(rating), content: comment.trim(), parent: null };

    try {
      if (editingId) {
        await dispatch(
          updateReview({ productId, reviewId: editingId, updatedData: payload })
        ).unwrap();
        setEditingId(null);
        setSuccessMessage("Review updated successfully!");
      } else {
        await dispatch(
          createReview({ productId, reviewData: payload })
        ).unwrap();
        setSuccessMessage("Review submitted successfully!");
      }

      setRating(0);
      setComment("");
      await dispatch(fetchReviews(productId));
      document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Error submitting review.");
    }
  };

  const handleEdit = (review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.content);
    document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      await dispatch(deleteReview({ productId, reviewId })).unwrap();
      await dispatch(fetchReviews(productId));
      document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="reviews-section" id="reviews-section">
      <h3>Customer Reviews</h3>

      {userInfo && (
        <div className="review-form modern-form">
          <h4>{editingId ? "Edit Review" : "Write a Review"}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating:</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= rating ? "star filled" : "star"}
                    onClick={() => setRating(star)}
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
                disabled={createStatus === "loading" || updateStatus === "loading"}
              />
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={!isFormValid() || createStatus === "loading" || updateStatus === "loading"}
            >
              {editingId
                ? "Update Review"
                : createStatus === "loading"
                ? "Submitting..."
                : "Submit Review"}
            </button>

            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first!</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <img
                src={review.profile_image || "/default-avatar.png"}
                alt={review.author?.username || "User"}
                className="review-avatar"
              />
              <div className="review-user-info">
                <Link to={`/profile/${review.author.username}`} className="review-author">
                  {review.author?.username || "Anonymous"}
                </Link>
                <span className="review-date">
                  {review.created_at ? formatDate(review.created_at) : ""}
                </span>
              </div>
            </div>

            <div className="review-body">
              <div className="review-stars">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>
              <p className="review-content">{review.content}</p>
            </div>

            {userInfo && review.author?.id === userInfo.id && (
              <div className="review-actions">
                <button className="btn-edit" onClick={() => handleEdit(review)}>
                  ✏️ Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(review.id)}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Reviews;
