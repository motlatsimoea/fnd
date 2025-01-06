import React, { useState } from 'react';
import './CommentSection.css';

const CommentSection = () => {
  const [comments, setComments] = useState([
    {
      id: 1,
      username: 'JaneDoe',
      profilePicture: 'https://via.placeholder.com/50', // Profile Picture URL
      date: 'November 22, 2024',
      content: 'This is a great blog post! I totally agree with your points on sustainable farming.',
      replies: [
        {
          id: 1,
          username: 'JohnDoe',
          profilePicture: 'https://via.placeholder.com/50', // Profile Picture URL
          content: 'Thanks! I appreciate your thoughts on this topic.',
        },
      ],
    },
    {
      id: 2,
      username: 'MarkSmith',
      profilePicture: 'https://via.placeholder.com/50', // Profile Picture URL
      date: 'November 21, 2024',
      content: 'Interesting read! I would love to see more posts on farming techniques.',
      replies: [],
    },
  ]);

  const [newComment, setNewComment] = useState('');
  const [newReply, setNewReply] = useState('');

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleReplyChange = (e) => {
    setNewReply(e.target.value);
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        username: 'NewUser',
        profilePicture: 'https://via.placeholder.com/50', // Placeholder Profile Picture
        date: new Date().toLocaleDateString(),
        content: newComment,
        replies: [],
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
    }
  };

  const handleSubmitReply = (commentId) => {
    if (newReply.trim()) {
      const updatedComments = comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [
                ...comment.replies,
                {
                  id: comment.replies.length + 1,
                  username: 'NewUser',
                  profilePicture: 'https://via.placeholder.com/50', // Placeholder Profile Picture
                  content: newReply,
                },
              ],
            }
          : comment
      );
      setComments(updatedComments);
      setNewReply('');
    }
  };

  return (
    <div className="comment-section">
      <h3>Comments</h3>
      
      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={handleCommentChange}
          rows="4"
          className="comment-input"
        ></textarea>
        <button type="submit" className="comment-submit">
          Post Comment
        </button>
      </form>

      {/* Display Comments */}
      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <img
                src={comment.profilePicture}
                alt={`${comment.username}'s profile`}
                className="profile-picture"
              />
              <div>
                <strong>{comment.username}</strong> <span>| {comment.date}</span>
              </div>
            </div>
            <p className="comment-content">{comment.content}</p>
            
            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="replies">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="reply">
                    <img
                      src={reply.profilePicture}
                      alt={`${reply.username}'s profile`}
                      className="profile-picture-reply"
                    />
                    <div>
                      <strong>{reply.username}</strong>: {reply.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitReply(comment.id);
              }}
              className="reply-form"
            >
              <input
                type="text"
                placeholder="Reply..."
                value={newReply}
                onChange={handleReplyChange}
                className="reply-input"
              />
              <button type="submit" className="reply-submit">
                Reply
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
