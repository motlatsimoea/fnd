import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { $getSelection, $isRangeSelection, $createTextNode } from "lexical";
import { $createMentionNode } from "./MentionNode";
import axiosInstance from "../../utils/axiosInstance";
import debounce from "lodash.debounce";

export default function MentionPlugin() {
  const [editor] = useLexicalComposerContext();

  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          setShowDropdown(false);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const nodeText = anchorNode.getTextContent();

        const match = nodeText.match(/(^|\s)@(\w*)$/);

        if (!match) {
          setShowDropdown(false);
          return;
        }

        const value = match[2]; // important fix
        setQuery(value);
        setShowDropdown(true);

        const domSelection = window.getSelection();

        if (domSelection && domSelection.rangeCount > 0) {
          const rect = domSelection.getRangeAt(0).getBoundingClientRect();

          setPosition({
            top: rect.bottom + 8,
            left: rect.left,
          });
        }
      });
    });
  }, [editor]);

  const fetchUsers = useRef(
    debounce(async (q) => {
      try {
        const res = await axiosInstance.get("/users/search/", {
          params: { q: q || "" },
        });

        setSuggestions(res.data);
      } catch (err) {
        console.error("Mention search error:", err);
      }
    }, 250)
  ).current;

  useEffect(() => {
    if (showDropdown) {
      fetchUsers(query);
    }
  }, [query, showDropdown, fetchUsers]);

  const insertMention = (username) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();
      const text = anchorNode.getTextContent();

      const match = text.match(/(^|\s)@(\w*)$/);
      if (!match) return;

      const start = match.index + match[1].length;
      const end = start + `@${match[2]}`.length;

      anchorNode.spliceText(start, end - start, "");

      selection.setTextNodeRange(anchorNode, start, anchorNode, start);

      const mentionNode = $createMentionNode(`@${username}`);
      selection.insertNodes([mentionNode]);
      selection.insertNodes([$createTextNode(" ")]);
    });

    setShowDropdown(false);
    editor.focus();
  };

  if (!showDropdown || suggestions.length === 0) return null;

  return createPortal(
    <div
      className="mention-dropdown"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
      }}
    >
      {suggestions.map((user) => (
        <button
          type="button"
          key={user.username}
          className="mention-item"
          onMouseDown={(e) => {
            e.preventDefault();
            insertMention(user.username);
          }}
        >
          <span className="mention-avatar">
            {user.username[0].toUpperCase()}
          </span>

          <span className="mention-details">
            <span className="mention-username">@{user.username}</span>
          </span>
        </button>
      ))}
    </div>,
    document.body
  );
}