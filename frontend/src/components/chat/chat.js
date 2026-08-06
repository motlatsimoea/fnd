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
  const [wsConnected, setWsConnected] =
    useState(false);

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

  const messageQueues = useRef({});

  const pushToQueue = useCallback(
    (key, payload) => {
      messageQueues.current[key] =
        messageQueues.current[key] || [];

      messageQueues.current[key].push(
        payload
      );
    },
    []
  );

  const hasMergedInitial = useRef(false);
  const seenIds = useRef({});

  const markSeen = useCallback(
    (chatId, id) => {
      if (!seenIds.current[chatId]) {
        seenIds.current[chatId] =
          new Set();
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
        delete messageQueues.current[
          key
        ];
      }
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "end",
      }
    );
  }, [messages]);

  /*
   * Reset merged-message tracking when
   * moving to another chat.
   */
  useEffect(() => {
    hasMergedInitial.current = false;
  }, [chatKey]);

  /*
   * Close the emoji picker when clicking
   * outside of it.
   */
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

  const createWebSocket = useCallback(
    () => {
      if (!chatKey || !accessToken) {
        console.log(
          "[ChatWS] Missing connection data",
          {
            chatKey,
            accessToken:
              Boolean(accessToken),
          }
        );

        return;
      }

      if (
        socketRef.current &&
        socketRef.current.readyState < 2
      ) {
        console.log(
          "[ChatWS] Socket already active"
        );

        return;
      }

      const protocol =
        window.location.protocol ===
        "https:"
          ? "wss"
          : "ws";

      const backendHost =
        process.env.NODE_ENV ===
        "development"
          ? "localhost:8000"
          : window.location.host;

      const wsUrl =
        `${protocol}://${backendHost}` +
        `/ws/chat/${chatKey}/` +
        `?token=${accessToken}`;

      const ws = new WebSocket(wsUrl);

      socketRef.current = ws;

      ws.onopen = () => {
        console.log(
          "[ChatWS] Connected"
        );

        reconnectAttempts.current = 0;
        setWsConnected(true);

        flushQueueFor(ws, chatKey);
      };

      ws.onmessage = (event) => {
        let data;

        try {
          data = JSON.parse(event.data);
        } catch (parseError) {
          console.error(
            "Invalid WebSocket message:",
            parseError
          );

          return;
        }

        if (!data.message) {
          return;
        }

        if (data.temp_id) {
          dispatch(
            updateMessageId({
              chatKey,
              tempId: data.temp_id,
              newMessage: data,
            })
          );

          if (data.id) {
            markSeen(
              chatKey,
              data.id
            );
          }

          return;
        }

        if (!data.id) {
          data.id =
            `temp-${Date.now()}`;
        }

        if (
          markSeen(chatKey, data.id)
        ) {
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
          "[ChatWS] Closed",
          {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          }
        );

        setWsConnected(false);
        socketRef.current = null;

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

          setTimeout(
            createWebSocket,
            delay
          );
        }
      };

      ws.onerror = (socketError) => {
        console.error(
          "WebSocket error:",
          socketError
        );

        ws.close();
      };
    },
    [
      chatKey,
      accessToken,
      dispatch,
      flushQueueFor,
      markSeen,
    ]
  );

  useEffect(() => {
    createWebSocket();

    return () => {
      socketRef.current?.close();
      socketRef.current = null;

      setWsConnected(false);
      reconnectAttempts.current = 0;
    };
  }, [
    chatKey,
    accessToken,
    createWebSocket,
  ]);

  const handleEmojiClick = (
    emojiData
  ) => {
    const emoji = emojiData.emoji;
    const input = inputRef.current;

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
      message.slice(0, selectionStart) +
      emoji +
      message.slice(selectionEnd);

    setMessage(updatedMessage);

    /*
     * Restore the cursor immediately after
     * the inserted emoji.
     */
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
      message: trimmedMessage,
      sender_info: {
        id: user.id,
        username: user.username,
      },
      timestamp:
        new Date().toISOString(),
      sending: true,
    };

    dispatch(
      receiveNewMessage({
        chatKey,
        message: newMessage,
      })
    );

    const payload = {
      message: trimmedMessage,
      temp_id: tempId,
    };

    if (
      wsConnected &&
      socketRef.current?.readyState ===
        WebSocket.OPEN
    ) {
      socketRef.current.send(
        JSON.stringify(payload)
      );
    } else {
      pushToQueue(
        chatKey,
        payload
      );
    }

    setMessage("");
    setShowEmojiPicker(false);

    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

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

        <div ref={messagesEndRef} />
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