import { DecoratorNode } from "lexical";
import React from "react";

export class ImageNode extends DecoratorNode {
  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__key);
  }

  // Required default for Lexical JSON
  static importJSON(serializedNode) {
    return new ImageNode(serializedNode.src || "");
  }

  exportJSON() {
    return {
      type: "image",
      src: this.__src,
      version: 1,
    };
  }

  constructor(src = "", key) {
    super(key);
    this.__src = src;
  }

  createDOM() {
    const div = document.createElement("div");
    return div;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <img
        src={this.__src}
        alt=""
        style={{ maxWidth: "100%", borderRadius: "8px", margin: "6px 0" }}
      />
    );
  }
}
