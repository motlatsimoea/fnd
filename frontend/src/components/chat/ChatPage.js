// src/pages/ChatPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Chat from "./chat";
import { fetchMessages, fetchUserChats } from "../../features/chats/Chat-slice";

const ChatPage = () => {
  const { chatId } = useParams(); // numeric from URL
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.userInfo || null);
  const messages = useSelector((state) => state.chats?.messages?.[chatId] || []);
  const chatRooms = useSelector((state) => state.chats?.chatRooms || []);

  const [chatTitle, setChatTitle] = useState("");
  const [chatKey, setChatKey] = useState(null); // 🔑 store unique_key for websocket

  useEffect(() => {
    if (!user) return;
    if (chatId) {
      dispatch(fetchMessages(chatId));

      if (chatRooms.length === 0) {
        dispatch(fetchUserChats());
      }
    }
  }, [dispatch, chatId, user, chatRooms.length]);

  useEffect(() => {
    const chat = chatRooms.find((c) => String(c.id) === String(chatId));
    if (chat && user) {
      // get WebSocket key
      setChatKey(chat.unique_key);

      // show participant names
      const otherUsers = chat.participants?.filter((p) => p.id !== user.id) || [];
      setChatTitle(otherUsers.map((u) => u.username).join(", ") || "Unknown User");
    }
  }, [chatId, chatRooms, user]);

  if (!user) {
    return (
      <div className="chat-page">
        <p>You must be logged in to view this chat.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  if (!chatKey) {
    return <p>Loading chat...</p>;
  }

  return (
    <div className="chat-page">
      <h2>Chat with {chatTitle}</h2>
      {/* 🔥 Pass unique_key, not chatId */}
      <Chat chatKey={chatKey} user={user} initialMessages={messages} />
    </div>
  );
};

export default ChatPage;
