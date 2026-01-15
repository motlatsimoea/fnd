import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUserChats } from "../../features/chats/Chat-slice";

const useInboxSocket = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws/inbox/`;

    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "inbox_message") {
        // 🔥 re-fetch inbox so ordering + unread_count stays canonical
        dispatch(fetchUserChats());
      }
    };

    return () => socket.close();
  }, [dispatch]);
};

export default useInboxSocket;
