import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Chat from "./chat";
import {
  fetchMessages,
  fetchUserChats,
  makeSelectChatByKey,
  makeSelectMessagesByKey,
  markChatAsRead,
} from "../../features/chats/Chat-slice";
import axiosInstance from "../../utils/axiosInstance";
import "./ChatPanel.css";

const ChatPanel = ({ chatKey, onBack, onClose }) => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth?.userInfo || null);

  const selectChat = useMemo(
    () => makeSelectChatByKey(chatKey),
    [chatKey]
  );

  const selectMessages = useMemo(
    () => makeSelectMessagesByKey(chatKey),
    [chatKey]
  );

  const chat = useSelector(selectChat);
  const messages = useSelector(selectMessages);

  const [chatTitle, setChatTitle] = useState("");
  const [chatId, setChatId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserChats());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!chat) return;

    setChatId(chat.id);
    dispatch(fetchMessages({ chatId: chat.id, chatKey }));
  }, [chat, chatKey, dispatch]);

  useEffect(() => {
    if (!chatId) return;

    axiosInstance.post(`/notifications/inbox/${chatId}/mark-read/`);
  }, [chatId]);

  useEffect(() => {
    if (chatKey) {
      dispatch(markChatAsRead({ chatKey }));
    }
  }, [chatKey, dispatch]);


  useEffect(() => {
    if (!chat || !user) return;

    const others =
      chat.participants?.filter((p) => p.id !== user.id) || [];

    setOtherUser(others[0] || null);

    setChatTitle(
      others.map((u) => u.username).join(", ") || "Unknown User"
    );
  }, [chat, user]);

  if (!user) {
    return (
      <div className="chat-panel-state">
        <p>You must be logged in to view this chat.</p>
      </div>
    );
  }

  if (!chat || !chatId) {
    return (
      <div className="chat-panel-state">
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <button className="chat-back-btn" onClick={onBack}>
          ←
        </button>

        <Link
            to={`/profile/${otherUser.username}`}
            onClick={onClose}
            className="chat-header-user"
        >
            <img
                src={otherUser?.profile_picture || "/default-avatar.png"}
                alt={chatTitle}
                className="chat-header-avatar"
            />

            <h3>{chatTitle}</h3>
        </Link>

        {onClose && (
          <button className="chat-panel-close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <Chat
        chatKey={chatKey}
        user={user}
        initialMessages={messages}
      />
    </div>
  );
};

export default ChatPanel;