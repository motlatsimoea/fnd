import React, {
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
  TextNode,
  ParagraphNode,
} from "lexical";

import { HashtagNode, registerLexicalHashtag } from "@lexical/hashtag";
import MentionPlugin from "./MentionPlugin";
import { MentionNode } from "./MentionNode";

import "./PostEditor.css";

/* ---------- Hashtag Plugin ---------- */
function HashtagPluginWrapper() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerLexicalHashtag(editor);
  }, [editor]);

  return null;
}

/* ---------- Expose Editor Methods ---------- */
function EditorRefPlugin({ editorRef }) {
  const [editor] = useLexicalComposerContext();

  useImperativeHandle(editorRef, () => ({
    insertEmoji(emoji) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(emoji);
        }
      });

      editor.focus();
    },

    clearEditor() {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });

      editor.focus();
    },
  }));

  return null;
}

/* ---------- FIXED: Proper Hydration ---------- */
function InitialContentPlugin({ initialContent }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialContent) return;

    try {
      const parsed =
        typeof initialContent === "string"
          ? JSON.parse(initialContent)
          : initialContent;

      const editorState = editor.parseEditorState(parsed);

      editor.setEditorState(editorState); // ✅ correct way (NO editor.update)

    } catch (err) {
      console.error("Failed to load initial content:", err);
    }
  }, [initialContent, editor]);

  return null;
}

/* ---------- OnChange Plugin ---------- */
function MyOnChangePlugin({ onChange }) {
  return (
    <OnChangePlugin
      onChange={(editorState) => {
        const json = editorState.toJSON();
        onChange(JSON.stringify(json));
      }}
    />
  );
}

/* ---------- Theme ---------- */
const theme = {
  hashtag: "post-editor-hashtag",
};

/* ---------- Config ---------- */
const editorConfig = {
  namespace: "PostEditor",
  theme,
  nodes: [
    HashtagNode,
    MentionNode,
    TextNode,
    ParagraphNode,
  ],
  onError(error) {
    console.error(error);
  },
};

/* ---------- Main Component ---------- */
const PostEditor = forwardRef(({ onChange, initialContent }, ref) => {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="post-editor-container">

        <RichTextPlugin
          contentEditable={<ContentEditable className="post-editor-input" />}
          placeholder={
            <div className="post-editor-placeholder">
              What's on your mind?
            </div>
          }
        />

        <HistoryPlugin />
        <HashtagPluginWrapper />
        <MentionPlugin />
        <MyOnChangePlugin onChange={onChange} />
        <EditorRefPlugin editorRef={ref} />

        {/* ✅ FIXED HYDRATION */}
        <InitialContentPlugin initialContent={initialContent} />

      </div>
    </LexicalComposer>
  );
});

export default PostEditor;