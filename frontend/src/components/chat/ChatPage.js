// src/pages/ChatPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Chat from "./chat";
import {
  fetchMessages,
  fetchUserChats,
  makeSelectChatByKey,
  makeSelectMessagesByKey,
  markChatAsRead
} from "../../features/chats/Chat-slice";
import axiosInstance from "../../utils/axiosInstance";

const ChatPage = () => {
  const { uniqueKey } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.userInfo || null);

  // ✅ Memoized selectors (critical)
  const selectChat = useMemo(
    () => makeSelectChatByKey(uniqueKey),
    [uniqueKey]
  );

  const selectMessages = useMemo(
    () => makeSelectMessagesByKey(uniqueKey),
    [uniqueKey]
  );

  const chat = useSelector(selectChat);
  const messages = useSelector(selectMessages);

  const [chatTitle, setChatTitle] = useState("");
  const [chatId, setChatId] = useState(null);

  /* ---------------- MARK READ ---------------- */

  useEffect(() => {
    if (!chatId) return;
    axiosInstance.post(`/notifications/inbox/${chatId}/mark-read/`);
  }, [chatId]);

  /* ---------------- LOAD INBOXES ---------------- */

  useEffect(() => {
    if (user) {
      dispatch(fetchUserChats());
    }
  }, [dispatch, user]);

  /* ---------------- RESOLVE CHAT + FETCH MESSAGES ---------------- */

  useEffect(() => {
    if (!chat) return;

    setChatId(chat.id);
    dispatch(fetchMessages({ chatId: chat.id, chatKey: uniqueKey }));
  }, [chat, uniqueKey, dispatch]);

  /* ---------------- CHAT TITLE ---------------- */

  useEffect(() => {
    if (!chat || !user) return;

    const others =
      chat.participants?.filter((p) => p.id !== user.id) || [];

    setChatTitle(
      others.map((u) => u.username).join(", ") || "Unknown User"
    );
  }, [chat, user]);


  /* ---------------- REMOVE HIGHLIGHT FROM READ ---------------- */

  useEffect(() => {
    if (uniqueKey) {
      dispatch(markChatAsRead({ chatKey: uniqueKey }));
    }
  }, [uniqueKey, dispatch]);

  /* ---------------- GUARDS ---------------- */

  if (!user) {
    return (
      <div className="chat-page">
        <p>You must be logged in to view this chat.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  if (!uniqueKey || !chatId) {
    return <p>Loading chat...</p>;
  }

  return (
    <div className="chat-page">
      <h2>Chat with {chatTitle}</h2>
      <Chat
        chatKey={uniqueKey}
        user={user}
        initialMessages={messages}
      />
    </div>
  );
};

export default ChatPage;
