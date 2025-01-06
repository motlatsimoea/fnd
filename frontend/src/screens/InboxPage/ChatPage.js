// src/screens/ChatPage.js
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './ChatPage.css';

const ChatPage = () => {
  const { chatId } = useParams();

  // Mock data for a single conversation
  const [messages, setMessages] = useState([
    { id: 1, sender: 'JohnDoe', text: 'Hey! Are you available for a quick call?' },
    { id: 2, sender: 'You', text: 'Sure, let me know the time.' },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, { id: messages.length + 1, sender: 'You', text: newMessage }]);
      setNewMessage('');
    }
  };

  return (
    <div className="chat-page">
      <h1>Chat with User {chatId}</h1>
      <div className="chat-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === 'You' ? 'sent' : 'received'}`}
          >
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatPage;
