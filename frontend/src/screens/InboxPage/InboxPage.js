// src/screens/InboxPage.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserChats } from '../../features/chats/Chat-slice'; // adjust path as needed
import { Link } from 'react-router-dom';
import './InboxPage.css';

const InboxPage = () => {
  const dispatch = useDispatch();

  const { chatRooms, loading, error } = useSelector((state) => state.chats);

  useEffect(() => {
    dispatch(fetchUserChats());
  }, [dispatch]);

  return (
    <div className="inbox-page">
      <h1>Inbox</h1>

      {loading && <p>Loading chats...</p>}
      {error && <p className="error">{error}</p>}

      <div className="chat-list">
        {chatRooms.map((chat) => {
          const otherUser = chat.participants.find((p) => p.id !== chat.current_user);
          return (
            <Link key={chat.id} to={`/chat/${chat.unique_key}`} className="chat-item">
              <img
                src={otherUser?.profile_picture || '/default-avatar.png'}
                alt={otherUser?.username}
              />
              <div>
                <h3>{otherUser?.username}</h3>
                <p>{chat.last_message || 'No messages yet.'}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default InboxPage;
