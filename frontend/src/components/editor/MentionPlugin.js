import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState, useRef } from "react";
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
  const dropdownRef = useRef(null);

  // ---------------- Listen for @ mentions ----------------
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          setShowDropdown(false);
          return;
        }

        const nodeText = selection.anchor.getNode().getTextContent();
        const match = nodeText.match(/(^|\s)@(\w*)$/);

        if (match) {
          const value = match[1];
          setQuery(value);
          setShowDropdown(true);

          // Position dropdown near cursor
          const domSelection = window.getSelection();
          if (domSelection.rangeCount > 0) {
            const rect = domSelection.getRangeAt(0).getBoundingClientRect();

            setPosition({
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
            });
          }
        } else {
          setShowDropdown(false);
        }
      });
    });
  }, [editor]);

  // ---------------- Fetch users (debounced) ----------------
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


  // ---------------- Insert mention ----------------
  const insertMention = (username) => {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const anchorNode = selection.anchor.getNode();
    const text = anchorNode.getTextContent();

    // Find the "@query" part at the end
    const match = text.match(/@(\w*)$/);
    if (!match) return;

    const start = match.index;
    const end = start + match[0].length;

    // Remove "@query"
    anchorNode.spliceText(start, end - start, "");

    // Move cursor to correct position
    selection.setTextNodeRange(anchorNode, start, anchorNode, start);

    // Insert mention node
    const mentionNode = $createMentionNode(`@${username}`);
    selection.insertNodes([mentionNode]);
    selection.insertNodes([$createTextNode(" ")]);
  });

  setShowDropdown(false);
};

  if (!showDropdown || suggestions.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="mention-dropdown"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
    >
      {suggestions.map((user) => (
        <div
          key={user.username}
          className="mention-item"
          onClick={() => insertMention(user.username)}
        >
          {user.username}
        </div>
      ))}
    </div>
  );
}