import { useEffect } from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  prependNotification,
} from "../../features/notifications/notice-slice";

const useNotificationsSocket = () => {
  const dispatch = useDispatch();

  const userInfo = useSelector(
    (state) => state.auth.userInfo
  );

  const accessToken = useSelector(
    (state) => state.auth.access
  );

  useEffect(() => {
    if (!userInfo || !accessToken) {
      return;
    }

    const WS_BASE_URL =
      process.env.REACT_APP_WS_URL;

    if (!WS_BASE_URL) {
      console.error(
        "[NotificationsSocket] REACT_APP_WS_URL is not configured"
      );
      return;
    }

    const wsUrl =
      `${WS_BASE_URL}/ws/notifications/` +
      `?token=${encodeURIComponent(accessToken)}`;

    console.log(
      "[NotificationsSocket] Connecting to:",
      `${WS_BASE_URL}/ws/notifications/`
    );

    const socket =
      new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(
        "[NotificationsSocket] ✅ connected"
      );
    };

    socket.onmessage = (event) => {
      try {
        const data =
          JSON.parse(event.data);

        console.log(
          "[NotificationsSocket] 📩 received:",
          data
        );

        if (
          data?.event === "notification"
        ) {
          dispatch(
            prependNotification(data)
          );
        }
      } catch (error) {
        console.error(
          "[NotificationsSocket] Failed to parse message:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "[NotificationsSocket] ❌ error:",
        error
      );
    };

    socket.onclose = (event) => {
      console.log(
        "[NotificationsSocket] 🔌 closed:",
        event.code,
        event.reason
      );
    };

    return () => {
      socket.close();
    };
  }, [
    dispatch,
    userInfo,
    accessToken,
  ]);
};

export default useNotificationsSocket;