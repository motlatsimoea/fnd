// src/pages/ChatPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Chat from "./chat";
import { fetchMessages, fetchUserChats } from "../../features/chats/Chat-slice";

const ChatPage = () => {
  const { uniqueKey } = useParams(); // 🔄 CHANGED: unique_key from URL
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.userInfo || null);
  const chatRooms = useSelector((state) => state.chats.chatRooms || []);
  const messages = useSelector(
    (state) => state.chats.messages[uniqueKey] || [] // 🔄 CHANGED
  );

  const [chatTitle, setChatTitle] = useState("");
  const [chatId, setChatId] = useState(null); // ✅ NEW: numeric ID for REST

  // Load inboxes
  useEffect(() => {
    if (user && chatRooms.length === 0) {
      dispatch(fetchUserChats());
    }
  }, [dispatch, user, chatRooms.length]);

  // Resolve chat + fetch messages
  useEffect(() => {
    if (!uniqueKey || chatRooms.length === 0) return;

    const chat = chatRooms.find((c) => c.unique_key === uniqueKey);
    if (!chat) return;

    setChatId(chat.id); // ✅ NEW
    dispatch(fetchMessages({ chatId: chat.id, chatKey: uniqueKey })); // 🔄 CHANGED
  }, [uniqueKey, chatRooms, dispatch]);

  // Chat title
  useEffect(() => {
    const chat = chatRooms.find((c) => c.unique_key === uniqueKey);
    if (!chat || !user) return;

    const others = chat.participants?.filter((p) => p.id !== user.id) || [];
    setChatTitle(others.map((u) => u.username).join(", ") || "Unknown User");
  }, [uniqueKey, chatRooms, user]);

  if (!user) {
    return (
      <div className="chat-page">
        <p>You must be logged in to view this chat.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  if (!uniqueKey || !chatId) return <p>Loading chat...</p>;

  return (
    <div className="chat-page">
      <h2>Chat with {chatTitle}</h2>
      <Chat
        chatKey={uniqueKey} // 🔑 WebSocket + Redux key
        user={user}
        initialMessages={messages}
      />
    </div>
  );
};

export default ChatPage;
