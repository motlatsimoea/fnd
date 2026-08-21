import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { formatDistanceToNow } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import EmojiPicker from "emoji-picker-react";

import {
  receiveNewMessage,
  mergeMessages,
  updateMessageId,
} from "../../features/chats/Chat-slice";

import "./chat.css";

const Chat = ({
  chatKey,
  user,
  initialMessages,
}) => {

  const [message, setMessage] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  const dispatch = useDispatch();

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const messages = useSelector(
    (state) =>
      state.chats.messages[chatKey] || []
  );

  const accessToken = useSelector(
    (state) => state.auth.access
  );

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const reconnectTimeoutRef = useRef(null);

  const messageQueues = useRef({});

  /* -----------------------------------------
     MESSAGE QUEUE
  ----------------------------------------- */

  const pushToQueue = useCallback(
    (key, payload) => {

      messageQueues.current[key] =
        messageQueues.current[key] || [];

      messageQueues.current[key].push(payload);
    },
    []
  );

  const flushQueueFor = useCallback(
    (ws, key) => {

      const queue =
        messageQueues.current[key] || [];

      while (
        queue.length &&
        ws.readyState === WebSocket.OPEN
      ) {

        const payload = queue.shift();

        ws.send(
          JSON.stringify(payload)
        );
      }

      if (!queue.length) {
        delete messageQueues.current[key];
      }
    },
    []
  );

  /* -----------------------------------------
     INITIAL MESSAGES
  ----------------------------------------- */

  const hasMergedInitial = useRef(false);

  const seenIds = useRef({});

  const markSeen = useCallback(
    (chatId, id) => {

      if (!seenIds.current[chatId]) {
        seenIds.current[chatId] = new Set();
      }

      if (
        seenIds.current[chatId].has(id)
      ) {
        return false;
      }

      seenIds.current[chatId].add(id);

      return true;
    },
    []
  );

  useEffect(() => {

    if (!initialMessages?.length) {
      return;
    }

    if (hasMergedInitial.current) {
      return;
    }

    dispatch(
      mergeMessages({
        chatKey,
        messages: initialMessages.map(
          (currentMessage) => ({
            ...currentMessage,
            message:
              currentMessage.message ??
              currentMessage.content,
          })
        ),
      })
    );

    initialMessages.forEach(
      (currentMessage) =>
        markSeen(
          chatKey,
          currentMessage.id
        )
    );

    hasMergedInitial.current = true;

  }, [
    chatKey,
    initialMessages,
    dispatch,
    markSeen,
  ]);

  /* -----------------------------------------
     RESET WHEN CHANGING CHAT
  ----------------------------------------- */

  useEffect(() => {

    hasMergedInitial.current = false;

  }, [chatKey]);

  /* -----------------------------------------
     AUTO SCROLL
  ----------------------------------------- */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

  }, [messages]);

  /* -----------------------------------------
     CLOSE EMOJI PICKER
  ----------------------------------------- */

  useEffect(() => {

    const handleOutsideClick = (event) => {

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(
          event.target
        )
      ) {
        setShowEmojiPicker(false);
      }

    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);

  /* -----------------------------------------
     CREATE WEBSOCKET
  ----------------------------------------- */

  const createWebSocket = useCallback(() => {
      if (!chatKey || !accessToken) {
        console.log("[ChatWS] Missing connection data", {
          chatKey,
          accessToken: Boolean(accessToken),
        });

        return;
      }

      // Prevent duplicate connections
      if (
        socketRef.current &&
        socketRef.current.readyState < 2
      ) {
        console.log("[ChatWS] Socket already active");
        return;
      }

      const WS_BASE_URL =
        process.env.REACT_APP_WS_URL;

      if (!WS_BASE_URL) {
        console.error(
          "[ChatWS] REACT_APP_WS_URL is not configured"
        );
        return;
      }

      const wsUrl =
        `${WS_BASE_URL}/ws/chat/${chatKey}/` +
        `?token=${encodeURIComponent(accessToken)}`;

      console.log(
        "[ChatWS] Connecting to:",
        `${WS_BASE_URL}/ws/chat/${chatKey}/`
      );

      const ws = new WebSocket(wsUrl);

      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[ChatWS] ✅ connected");

        reconnectAttempts.current = 0;
        setWsConnected(true);

        flushQueueFor(ws, chatKey);
      };

      ws.onmessage = (event) => {
        let data;

        try {
          data = JSON.parse(event.data);
        } catch (error) {
          console.error(
            "[ChatWS] Invalid WebSocket message:",
            error
          );
          return;
        }

        console.log(
          "[ChatWS] 📩 received:",
          data
        );

        if (!data.message) {
          return;
        }

        // Server acknowledgement of our temporary message
        if (data.temp_id) {
          dispatch(
            updateMessageId({
              chatKey,
              tempId: data.temp_id,
              newMessage: data,
            })
          );

          if (data.id) {
            markSeen(chatKey, data.id);
          }

          return;
        }

        if (!data.id) {
          data.id = `temp-${Date.now()}`;
        }

        if (markSeen(chatKey, data.id)) {
          dispatch(
            receiveNewMessage({
              chatKey,
              message: data,
            })
          );
        }
      };

      ws.onclose = (event) => {
        console.log(
          "[ChatWS] 🔌 closed",
          {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          }
        );

        setWsConnected(false);

        if (socketRef.current === ws) {
          socketRef.current = null;
        }

        if (
          reconnectAttempts.current <
          maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 *
              2 **
                reconnectAttempts.current,
            30000
          );

          reconnectAttempts.current += 1;

          console.log(
            `[ChatWS] Reconnecting in ${delay}ms...`
          );

          reconnectTimeoutRef.current =
            setTimeout(
              createWebSocket,
              delay
            );
        }
      };

      ws.onerror = (error) => {
        console.error(
          "[ChatWS] ❌ error:",
          error
        );

        ws.close();
      };
    }, [
      chatKey,
      accessToken,
      dispatch,
      flushQueueFor,
      markSeen,
    ]);

  /* -----------------------------------------
     CONNECT / DISCONNECT
  ----------------------------------------- */

  useEffect(() => {

    if (!chatKey || !accessToken) {
      return;
    }

    createWebSocket();

    return () => {

      /*
       * Cancel pending reconnect
       */

      if (
        reconnectTimeoutRef.current
      ) {

        clearTimeout(
          reconnectTimeoutRef.current
        );

        reconnectTimeoutRef.current =
          null;
      }

      /*
       * Close existing socket
       */

      if (
        socketRef.current
      ) {

        socketRef.current.close();

        socketRef.current = null;
      }

      setWsConnected(false);

      reconnectAttempts.current = 0;
    };

  }, [
    chatKey,
    accessToken,
    createWebSocket,
  ]);

  /* -----------------------------------------
     EMOJI
  ----------------------------------------- */

  const handleEmojiClick = (
    emojiData
  ) => {

    const emoji =
      emojiData.emoji;

    const input =
      inputRef.current;

    if (!input) {

      setMessage(
        (previousMessage) =>
          previousMessage + emoji
      );

      return;
    }

    const selectionStart =
      input.selectionStart ??
      message.length;

    const selectionEnd =
      input.selectionEnd ??
      message.length;

    const updatedMessage =
      message.slice(
        0,
        selectionStart
      ) +
      emoji +
      message.slice(
        selectionEnd
      );

    setMessage(
      updatedMessage
    );

    requestAnimationFrame(() => {

      const newCursorPosition =
        selectionStart +
        emoji.length;

      input.focus();

      input.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );

    });
  };

  /* -----------------------------------------
     SEND MESSAGE
  ----------------------------------------- */

  const sendMessage = () => {

    const trimmedMessage =
      message.trim();

    if (!trimmedMessage) {
      return;
    }

    const tempId =
      `temp-${Date.now()}`;

    const newMessage = {

      id: tempId,

      message:
        trimmedMessage,

      sender_info: {

        id: user.id,

        username:
          user.username,

      },

      timestamp:
        new Date().toISOString(),

      sending: true,

    };

    /*
     * Show immediately in Redux.
     */

    dispatch(
      receiveNewMessage({
        chatKey,
        message: newMessage,
      })
    );

    const payload = {

      message:
        trimmedMessage,

      temp_id:
        tempId,

    };

    /*
     * Send immediately if connected.
     */

    if (
      wsConnected &&
      socketRef.current?.readyState ===
        WebSocket.OPEN
    ) {

      socketRef.current.send(
        JSON.stringify(payload)
      );

    } else {

      /*
       * Otherwise queue it.
       */

      pushToQueue(
        chatKey,
        payload
      );
    }

    setMessage("");

    setShowEmojiPicker(
      false
    );

    inputRef.current?.focus();
  };

  /* -----------------------------------------
     ENTER KEY
  ----------------------------------------- */

  const handleKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing
    ) {

      event.preventDefault();

      sendMessage();
    }
  };

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */

  return (

    <div className="chat-container">

      <div className="chat-box">

        {messages.map(
          (currentMessage) => {

            const isMe =
              String(
                currentMessage
                  .sender_info?.id
              ) ===
              String(user.id);

            return (

              <div
                key={
                  currentMessage.id
                }
                className={`chat-message ${
                  isMe
                    ? "me"
                    : "other"
                }`}
              >

                <p>

                  {
                    currentMessage.message
                  }{" "}

                  {currentMessage.sending && (

                    <span className="sending">
                      …sending
                    </span>

                  )}

                </p>

                <span className="timestamp">

                  {formatDistanceToNow(
                    new Date(
                      currentMessage.timestamp
                    ),
                    {
                      addSuffix: true,
                    }
                  )}

                </span>

              </div>

            );

          }
        )}

        <div
          ref={messagesEndRef}
        />

      </div>

      <div className="chat-input-wrapper">

        <div className="chat-input">

          <div
            className="chat-emoji-container"
            ref={emojiPickerRef}
          >

            <button
              type="button"
              className="chat-emoji-btn"
              onClick={() =>
                setShowEmojiPicker(
                  (previous) =>
                    !previous
                )
              }
              aria-label="Choose emoji"
              title="Choose emoji"
            >
              😊
            </button>

            {showEmojiPicker && (

              <div className="chat-emoji-picker">

                <EmojiPicker
                  onEmojiClick={
                    handleEmojiClick
                  }
                  searchDisabled={false}
                  previewConfig={{
                    showPreview: false,
                  }}
                  width={320}
                  height={400}
                />

              </div>

            )}

          </div>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder="Type your message..."
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={
              !message.trim()
            }
          >
            {wsConnected
              ? "Send"
              : "Queue"}
          </button>

        </div>

      </div>

    </div>

  );
};

export default Chat;