import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import {
  receiveNewMessage,
  mergeMessages,
  updateMessageId,
} from "../../features/chats/Chat-slice";
import "./chat.css";

const Chat = ({ chatKey, user, initialMessages }) => {
  const [message, setMessage] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  const messages = useSelector((state) => state.chats.messages[chatKey] || []);
  const accessToken = useSelector((state) => state.auth.access);

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  // Queues per chatKey
  const messageQueues = useRef({});
  const pushToQueue = useCallback((key, payload) => {
    messageQueues.current[key] = messageQueues.current[key] || [];
    messageQueues.current[key].push(payload);
  }, []);

  // Seen message IDs per chat
  const seenIds = useRef({});
  const markSeen = useCallback((chatId, id) => {
    if (!seenIds.current[chatId]) seenIds.current[chatId] = new Set();
    if (seenIds.current[chatId].has(id)) return false;
    seenIds.current[chatId].add(id);
    return true;
  }, []);

  const flushQueueFor = useCallback(
    (ws, key) => {
      const q = messageQueues.current[key] || [];
      while (q.length && ws.readyState === WebSocket.OPEN) {
        const payload = q.shift();
        ws.send(JSON.stringify(payload));
      }
      if (!q.length) delete messageQueues.current[key];
    },
    []
  );

  useEffect(() => {
    if (initialMessages?.length > 0) {
      dispatch(mergeMessages({ chatId: chatKey, messages: initialMessages }));
      initialMessages.forEach((m) => markSeen(chatKey, m.id));
    }
  }, [chatKey, initialMessages, dispatch, markSeen]);

  const createWebSocket = useCallback(() => {
    if (!chatKey || !accessToken) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const backendHost =
      process.env.NODE_ENV === "development"
        ? "localhost:8000"
        : window.location.host;

    const url = `${protocol}://${backendHost}/ws/chat/${chatKey}/?token=${accessToken}`;
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setWsConnected(true);
      flushQueueFor(ws, chatKey);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.message) return;

      if (data.temp_id) {
        dispatch(
          updateMessageId({
            chatId: chatKey,
            tempId: data.temp_id,
            newMessage: data,
          })
        );
        markSeen(chatKey, data.id);
      } else {
        if (!data.id) data.id = `temp-${Date.now()}`;
        if (markSeen(chatKey, data.id)) {
          dispatch(receiveNewMessage({ chatId: chatKey, message: data }));
        }
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      socketRef.current = null;

      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
        reconnectAttempts.current += 1;
        setTimeout(createWebSocket, delay);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };
  }, [chatKey, accessToken, dispatch, flushQueueFor, markSeen]);

  useEffect(() => {
    createWebSocket();
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
      setWsConnected(false);
      reconnectAttempts.current = 0;
    };
  }, [chatKey, accessToken, createWebSocket]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      message,
      sender_info: { id: user.id, username: user.username },
      timestamp: new Date().toISOString(),
      sending: true,
    };

    dispatch(receiveNewMessage({ chatId: chatKey, message: newMessage }));

    const payload = { message, temp_id: tempId };
    if (wsConnected && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      pushToQueue(chatKey, payload);
    }

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg) => {
          const isMe = msg.sender_info?.id === user.id;
          return (
            <div key={msg.id} className={`chat-message ${isMe ? "me" : "other"}`}>
              <p>
                {msg.message}{" "}
                {msg.sending && <span className="sending">…sending</span>}
              </p>
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
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>
          {wsConnected ? "Send" : "Queue (offline)"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
