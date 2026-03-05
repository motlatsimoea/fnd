import { TextNode } from "lexical";

export class MentionNode extends TextNode {
  static getType() {
    return "mention";
  }

  static clone(node) {
    return new MentionNode(node.__text, node.__key);
  }

  createDOM(config) {
    const dom = super.createDOM(config);

    // ✅ use SAME styling as hashtags
    dom.className = config.theme.hashtag;

    return dom;
  }

  static importJSON(serializedNode) {
    return new MentionNode(serializedNode.text);
  }

  exportJSON() {
    return {
      type: "mention",
      text: this.__text,
      version: 1,
    };
  }
}

export function $createMentionNode(text) {
  return new MentionNode(text);
}