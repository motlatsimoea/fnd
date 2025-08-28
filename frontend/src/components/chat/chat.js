import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import './chat.css'

const Chat = ({ chatId, user, initialMessages = [] }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatId}/`);

    ws.onopen = () => console.log("WebSocket Connected");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        setMessages((prev) => [...prev, data]);
      }
    };
    ws.onclose = () => console.log("WebSocket Disconnected");

    setSocket(ws);
    return () => ws.close();
  }, [chatId]);

  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.send(JSON.stringify({ message, sender: user.id }));
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, i) => {
          const isMe = msg.sender_info?.id === user.id;
          return (
            <div
              key={i}
              className={`chat-message ${isMe ? "me" : "other"}`}
            >
              <p>{msg.message}</p>
              <span className="timestamp">
                {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
