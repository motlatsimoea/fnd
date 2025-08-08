// src/screens/ChatPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProfileHeader from '../../components/ProfilePage/ProfileHeader';
import './ChatPage.css';

const ChatPage = ({ currentUser }) => {
  const { unique_key } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    // Fetch other participant's profile using the unique_key
    fetch(`/api/inbox/${unique_key}/participant/`)
      .then(res => res.json())
      .then(data => {
        if (data && data.user) setOtherUser(data.user);
      })
      .catch(err => console.error("Failed to fetch participant profile:", err));
  }, [unique_key]);

  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${unique_key}/`);

    ws.onopen = () => console.log('Connected to WebSocket');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          sender: data.sender === currentUser.id ? 'You' : data.sender,
          text: data.message,
        }
      ]);
    };

    ws.onerror = (error) => console.error('WebSocket Error:', error);
    ws.onclose = () => console.log('Disconnected from WebSocket');

    setSocket(ws);

    return () => ws.close();
  }, [unique_key, currentUser.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.send(JSON.stringify({
        message: newMessage,
        sender: currentUser.id
      }));
      setNewMessage('');
    }
  };

  return (
    <div className="chat-page">
      {otherUser && (
        <ProfileHeader user={otherUser} currentUser={currentUser} />
      )}

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
