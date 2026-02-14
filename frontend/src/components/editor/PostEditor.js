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
  $getRoot,
  $getSelection,
  $isRangeSelection,
  TextNode,
  ParagraphNode,
} from "lexical";

import { HashtagNode, registerLexicalHashtag } from "@lexical/hashtag";

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

      // Keep focus in editor
      editor.focus();
    },
  }));

  return null;
}

/* ---------- OnChange Plugin ---------- */
function MyOnChangePlugin({ onChange }) {
  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          const root = $getRoot();
          onChange(root.getTextContent());
        });
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
  nodes: [HashtagNode, TextNode, ParagraphNode],
  onError(error) {
    console.error(error);
  },
};

/* ---------- Main Component ---------- */
const PostEditor = forwardRef(({ onChange }, ref) => {
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
        <MyOnChangePlugin onChange={onChange} />
        <EditorRefPlugin editorRef={ref} />
      </div>
    </LexicalComposer>
  );
});

export default PostEditor;
