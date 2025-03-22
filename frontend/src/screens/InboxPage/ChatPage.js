// src/screens/ChatPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ChatPage.css';

const ChatPage = () => {
  const { unique_key } = useParams();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'JohnDoe', text: 'Hey! Are you available for a quick call?' },
    { id: 2, sender: 'You', text: 'Sure, let me know the time.' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${unique_key}/`);

    ws.onopen = () => console.log('Connected to WebSocket');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, { id: prevMessages.length + 1, sender: data.sender, text: data.message }]);
    };
    
    ws.onerror = (error) => console.error('WebSocket Error:', error);
    ws.onclose = () => console.log('Disconnected from WebSocket');
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [unique_key]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = { message: newMessage, sender: 'You' };
      socket.send(JSON.stringify(messageData));
      setNewMessage('');
    }
  };

  return (
    <div className="chat-page">
      <h1>Chat with User {unique_key}</h1>
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
