import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChats } from "../../features/chats/Chat-slice";

const useInboxSocket = (loadingAuth) => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.access);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log("[InboxSocket] effect fired", {
      loadingAuth,
      hasAccessToken: !!accessToken,
      existingSocket: !!socketRef.current,
    });

    // ❌ Don’t connect until auth is ready
    if (loadingAuth) {
      console.log("[InboxSocket] ⏳ waiting for auth bootstrap");
      return;
    }

    if (!accessToken) {
      console.log("[InboxSocket] ❌ no access token, not connecting");
      return;
    }

    // ❌ Prevent duplicate sockets
    if (socketRef.current) {
      console.log("[InboxSocket] ⚠️ socket already exists");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const backendHost =
      process.env.NODE_ENV === "development"
        ? "localhost:8000"
        : window.location.host;

    const wsUrl = `${protocol}://${backendHost}/ws/inbox/?token=${accessToken}`;
    console.log("[InboxSocket] 🔌 connecting to", wsUrl);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[InboxSocket] ✅ connected");
    };

    socket.onmessage = (event) => {
      console.log("[InboxSocket] 📩 message received:", event.data);

      const data = JSON.parse(event.data);

      if (data.event === "inbox_message") {
        console.log("[InboxSocket] 🔔 inbox_message event → refetch chats");
        dispatch(fetchUserChats());
      }
    };

    socket.onerror = (e) => {
      console.error("[InboxSocket] ❌ socket error", e);
    };

    socket.onclose = (e) => {
      console.log("[InboxSocket] 🔌 socket closed", {
        code: e.code,
        reason: e.reason,
      });
      socketRef.current = null;
    };

    return () => {
      console.log("[InboxSocket] 🧹 cleanup – closing socket");
      socket.close();
      socketRef.current = null;
    };
  }, [dispatch, accessToken, loadingAuth]);
};

export default useInboxSocket;
