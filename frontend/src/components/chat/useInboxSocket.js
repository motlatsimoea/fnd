import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  receiveNewMessage,
  incrementUnreadCount,
  fetchUserChats,
} from "../../features/chats/Chat-slice";

const useInboxSocket = (loadingAuth) => {
  const dispatch = useDispatch();

  const accessToken = useSelector(
    (state) => state.auth.access
  );

  const socketRef = useRef(null);

  useEffect(() => {
    if (loadingAuth || !accessToken) {
      return;
    }

    const WS_BASE_URL =
      process.env.REACT_APP_WS_URL;
      console.log(process.env.REACT_APP_WS_URL)

    if (!WS_BASE_URL) {
      console.error(
        "[InboxSocket] REACT_APP_WS_URL is not configured"
      );
      return;
    }

    const wsUrl =
      `${WS_BASE_URL}/ws/inbox/` +
      `?token=${encodeURIComponent(accessToken)}`;

    console.log(
      "[InboxSocket] Connecting to:",
      `${WS_BASE_URL}/ws/inbox/`
    );

    const socket =
      new WebSocket(wsUrl);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(
        "[InboxSocket] ✅ connected"
      );
    };

    socket.onmessage = (event) => {
      try {
        const data =
          JSON.parse(event.data);

        console.log(
          "[InboxSocket] 📩 received:",
          data
        );

        if (
          data.type === "new_message"
        ) {
          const {
            chat_key,
            message,
          } = data;

          dispatch(
            receiveNewMessage({
              chatKey: chat_key,
              message,
            })
          );

          dispatch(
            incrementUnreadCount({
              chatKey: chat_key,
            })
          );

          dispatch(
            fetchUserChats()
          );
        }
      } catch (error) {
        console.error(
          "[InboxSocket] Failed to parse message:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "[InboxSocket] ❌ error:",
        error
      );
    };

    socket.onclose = (event) => {
      console.log(
        "[InboxSocket] 🔌 closed:",
        event.code,
        event.reason
      );

      if (
        socketRef.current === socket
      ) {
        socketRef.current = null;
      }
    };

    return () => {
      socket.close();

      if (
        socketRef.current === socket
      ) {
        socketRef.current = null;
      }
    };
  }, [
    accessToken,
    loadingAuth,
    dispatch,
  ]);

  return socketRef;
};

export default useInboxSocket;