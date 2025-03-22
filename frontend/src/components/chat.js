import React, { useState, useEffect } from "react";

const Chat = ({ chatId, user }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Connect to WebSocket server
     
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/chat/2/");

    ws.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message received:", data);

      if (data.message) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    setSocket(ws);

    return () => {
      ws.close(); // Close socket when component unmounts
    };
  }, [chatId]);

  const sendMessage = () => {
    if (socket && message.trim() !== "") {
      socket.send(JSON.stringify({
        message: message,
        sender: user.username, // Sending user info
      }));
      setMessage("");
    }
  };

  return (
    <div>
      <h2>Chat Room {chatId}</h2>
      <div>
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.sender}:</strong> {msg.message}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
