import React, { useState, useEffect } from "react";

const Chat = ({ chatId, user }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatId}/`);

    ws.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    setSocket(ws);
    return () => ws.close();
  }, [chatId]);

  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.send(JSON.stringify({
        message: message,
        sender: user.id, // match server expectations
      }));
      setMessage("");
    }
  };

  return (
    <div>
      <h2>Chat with User (Chat ID: {chatId})</h2>
      <div className="chat-box">
        {messages.map((msg, i) => (
          <p key={i}>
            <strong>{msg.sender}:</strong> {msg.message}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
