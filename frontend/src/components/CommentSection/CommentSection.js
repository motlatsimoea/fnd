import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComments } from '../../features/blog/Comment-slice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentSection = ({ postId }) => {
  const dispatch = useDispatch();
  const { items: comments, loading, error } = useSelector((state) => state.comments);

  useEffect(() => {
    if (postId) {
      dispatch(fetchComments(postId));
    }
  }, [dispatch, postId]);

  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>

      <CommentForm postId={postId} />

      {loading && <Loader />}
      {error && <Message variant="danger">Error: {error}</Message>}
      {comments.length === 0 && !loading && <p className="text-gray-500">No comments yet.</p>}

      <div className="mt-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
