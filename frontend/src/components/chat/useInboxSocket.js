import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  receiveNewMessage,
  incrementUnreadCount,
  fetchUserChats,
} from "../../features/chats/Chat-slice";

const useInboxSocket = (loadingAuth) => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.access);
  const socketRef = useRef(null);

  useEffect(() => {
    if (loadingAuth || !accessToken) return;

    const wsProtocol =
      window.location.protocol === "https:" ? "wss" : "ws";

    const socket = new WebSocket(
      `${wsProtocol}://localhost:8000/ws/inbox/?token=${accessToken}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[InboxSocket] ✅ connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[InboxSocket] 📩 message received:", data);

      if (data.type === "new_message") {
        const { chat_key, message } = data;

        // 1️⃣ Store message in Redux
        dispatch(
          receiveNewMessage({
            chatKey: chat_key,
            message,
          })
        );

        // 2️⃣ Update unread counter immediately
        dispatch(
          incrementUnreadCount({
            chatKey: chat_key,
          })
        );

        // 3️⃣ Optional safety: refetch chat rooms
        dispatch(fetchUserChats());
      }
    };

    socket.onerror = (err) => {
      console.error("[InboxSocket] ❌ error", err);
    };

    socket.onclose = (event) => {
      console.log(
        "[InboxSocket] 🔌 closed",
        event.code,
        event.reason
      );
    };

    return () => {
      socket.close();
    };
  }, [accessToken, loadingAuth, dispatch]);

  return socketRef;
};

export default useInboxSocket;