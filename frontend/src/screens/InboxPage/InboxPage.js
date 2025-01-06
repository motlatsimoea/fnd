// src/screens/InboxPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './InboxPage.css';

const InboxPage = () => {
  const chats = [
    {
      id: 1,
      username: 'JohnDoe',
      profilePicture: '/images/john.jpg',
      lastMessage: 'Hey! Are you available for a quick call?',
    },
    {
      id: 2,
      username: 'JaneSmith',
      profilePicture: '/images/jane.jpg',
      lastMessage: 'Let me know if you received the documents.',
    },
    {
      id: 3,
      username: 'FarmGuru',
      profilePicture: '/images/farmguru.jpg',
      lastMessage: 'Thanks for the update!',
    },
  ];

  return (
    <div className="inbox-page">
      <h1>Inbox</h1>
      <div className="chat-list">
        {chats.map((chat) => (
          <Link key={chat.id} to={`/chat/${chat.id}`} className="chat-item">
            <img src={chat.profilePicture} alt={chat.username} />
            <div>
              <h3>{chat.username}</h3>
              <p>{chat.lastMessage}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default InboxPage;
