// src/pages/ChatPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Chat from "./chat";
import { fetchMessages, fetchUserChats } from "../../features/chats/Chat-slice";

const ChatPage = () => {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.userInfo || null);
  const messages = useSelector(
    (state) => state.chats?.messages?.[chatId] || []
  );
  const chatRooms = useSelector((state) => state.chats?.chatRooms || []);
  const [chatTitle, setChatTitle] = useState("");

  useEffect(() => {
    if (!user) return;
    if (chatId) {
      dispatch(fetchMessages(chatId));
      // Ensure chatRooms are loaded to get participant names
      if (chatRooms.length === 0) {
        dispatch(fetchUserChats());
      }
    }
  }, [dispatch, chatId, user, chatRooms.length]);

  useEffect(() => {
    // Find chat in chatRooms to get other participant's username
    const chat = chatRooms.find((c) => String(c.id) === String(chatId));
    if (chat && user) {
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

  return (
    <div className="chat-page">
      <h2>Chat with {chatTitle}</h2>
      <Chat chatId={chatId} user={user} initialMessages={messages} />
    </div>
  );
};

export default ChatPage;
