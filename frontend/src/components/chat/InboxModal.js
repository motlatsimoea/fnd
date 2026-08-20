import React, {
  useEffect,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  FaTrash,
} from "react-icons/fa";

import { toast } from "react-toastify";

import {
  deleteChat,
  fetchUserChats,
} from "../../features/chats/Chat-slice";

import ChatPanel from "./ChatPanel";
import "./InboxModal.css";

const InboxModal = ({ onClose }) => {
  const dispatch = useDispatch();

  const [
    selectedChatKey,
    setSelectedChatKey,
  ] = useState(null);

  const [
    chatToDelete,
    setChatToDelete,
  ] = useState(null);

  const {
    chatRooms = [],
    loading,
    error,
    deletingChatId,
    deleteError,
  } = useSelector(
    (state) => state.chats
  );

  const userId = useSelector(
    (state) =>
      state.auth.userInfo?.id
  );

  useEffect(() => {
    dispatch(fetchUserChats());
  }, [dispatch]);

  const renderError = (
    currentError
  ) => {
    if (!currentError) {
      return null;
    }

    if (
      typeof currentError ===
      "string"
    ) {
      return currentError;
    }

    if (
      typeof currentError ===
      "object"
    ) {
      return (
        currentError.detail ||
        currentError.error ||
        JSON.stringify(
          currentError
        )
      );
    }

    return String(currentError);
  };

  const getOtherUsers = (chat) => {
    return (
      chat.participants?.filter(
        (participant) =>
          String(participant.id) !==
          String(userId)
      ) || []
    );
  };

  const getChatDisplayName = (
    chat
  ) => {
    const otherUsers =
      getOtherUsers(chat);

    if (
      otherUsers.length === 0
    ) {
      return "this user";
    }

    return otherUsers
      .map((user) => user.username)
      .join(", ");
  };

  const openDeleteModal = (
    event,
    chat
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setChatToDelete(chat);
  };

  const closeDeleteModal = () => {
    if (deletingChatId) {
      return;
    }

    setChatToDelete(null);
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete) {
      return;
    }

    try {
      await dispatch(
        deleteChat({
          chatId: chatToDelete.id,
          chatKey:
            chatToDelete.unique_key,
        })
      ).unwrap();

      toast.success(
        `Chat with ${getChatDisplayName(
          chatToDelete
        )} deleted.`
      );

      if (
        selectedChatKey ===
        chatToDelete.unique_key
      ) {
        setSelectedChatKey(null);
      }

      setChatToDelete(null);
    } catch (requestError) {
      const message =
        typeof requestError ===
        "string"
          ? requestError
          : requestError?.detail ||
            requestError?.error ||
            "Failed to delete chat.";

      toast.error(message);
    }
  };

  const sortedChats = [
    ...chatRooms,
  ].sort((a, b) => {
    if (
      a.unread_count > 0 &&
      b.unread_count === 0
    ) {
      return -1;
    }

    if (
      a.unread_count === 0 &&
      b.unread_count > 0
    ) {
      return 1;
    }

    return (
      new Date(b.updated_at) -
      new Date(a.updated_at)
    );
  });

  if (selectedChatKey) {
    return (
      <div className="inbox-modal inbox-chat-view">
        <ChatPanel
          chatKey={selectedChatKey}
          onBack={() =>
            setSelectedChatKey(null)
          }
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <>
      <div className="inbox-modal">
        <div className="modal-header">
          <h3>Messages</h3>

          <button
            type="button"
            onClick={onClose}
            className="close-btn"
            aria-label="Close inbox"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="modal-state">
            Loading chats...
          </p>
        )}

        {error && (
          <p className="modal-error">
            {renderError(error)}
          </p>
        )}

        {deleteError && (
          <p className="modal-error">
            {renderError(deleteError)}
          </p>
        )}

        <ul className="chat-list">
          {sortedChats.length > 0 ? (
            sortedChats.map((chat) => {
              const otherUsers =
                getOtherUsers(chat);

              const isUnread =
                chat.unread_count > 0;

              const isDeleting =
                String(
                  deletingChatId
                ) === String(chat.id);

              return (
                <li
                  key={chat.id}
                  className={`chat-item ${
                    isUnread
                      ? "chat-unread"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="chat-item-button"
                    onClick={() =>
                      setSelectedChatKey(
                        chat.unique_key
                      )
                    }
                    disabled={isDeleting}
                  >
                    <div className="avatar-wrapper">
                      {otherUsers.map(
                        (user) => (
                          <img
                            key={user.id}
                            src={
                              user.profile_picture ||
                               "/default_profile.png"
                            }
                            alt={
                              user.username
                            }
                            className="chat-avatar"
                          />
                        )
                      )}
                    </div>

                    <div className="chat-info">
                      <div className="chat-top">
                        <span className="chat-username">
                          {otherUsers
                            .map(
                              (user) =>
                                user.username
                            )
                            .join(", ") ||
                            "Unknown user"}
                        </span>

                        {isUnread && (
                          <span className="chat-unread-badge">
                            {
                              chat.unread_count
                            }
                          </span>
                        )}
                      </div>

                      <span className="chat-preview-message">
                        {chat
                          .last_message
                          ?.text ||
                          "No messages yet"}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="delete-chat-btn"
                    onClick={(event) =>
                      openDeleteModal(
                        event,
                        chat
                      )
                    }
                    disabled={isDeleting}
                    aria-label={`Delete chat with ${getChatDisplayName(
                      chat
                    )}`}
                    title="Delete chat"
                  >
                    <FaTrash />
                  </button>
                </li>
              );
            })
          ) : (
            !loading && (
              <li className="modal-state">
                No chats yet.
              </li>
            )
          )}
        </ul>
      </div>

      {chatToDelete && (
        <div
          className="delete-chat-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >
          <div
            className="delete-chat-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-title"
          >
            <h3 id="delete-chat-title">
              Delete chat?
            </h3>

            <p>
              Are you sure you want to
              delete your chat with{" "}
              <strong>
                {getChatDisplayName(
                  chatToDelete
                )}
              </strong>
              ?
            </p>

            <p className="delete-chat-warning">
              This action cannot be
              undone.
            </p>

            <div className="delete-chat-actions">
              <button
                type="button"
                className="delete-chat-cancel-btn"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  Boolean(
                    deletingChatId
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-chat-confirm-btn"
                onClick={
                  handleDeleteChat
                }
                disabled={
                  Boolean(
                    deletingChatId
                  )
                }
              >
                {deletingChatId
                  ? "Deleting..."
                  : "Delete chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InboxModal;