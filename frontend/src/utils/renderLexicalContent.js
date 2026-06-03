import React from "react";
import { Link } from "react-router-dom";

export const renderLexicalContent = (content) => {
  if (!content) return null;

  let parsed;

  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    return <span>{content}</span>;
  }

  const renderNode = (node, key) => {
    if (!node) return null;

    if (node.type === "text") {
      return node.text;
    }

    if (node.type === "hashtag") {
      const tag = node.text.replace("#", "");
      return (
        <Link
          key={key}
          to={`/hashtag/${tag}`}
          className="clickable-hashtag"
        >
          {node.text}
        </Link>
      );
    }

    if (node.type === "mention") {
      const username = node.text.replace("@", "");
      return (
        <Link
          key={key}
          to={`/profile/${username}`}
          className="clickable-mention"
        >
          {node.text}
        </Link>
      );
    }

    if (node.children) {
      return node.children.map((child, i) =>
        renderNode(child, `${key}-${i}`)
      );
    }

    return null;
  };

  return parsed.root?.children?.map((node, i) => (
    <p key={i}>
      {node.children?.map((child, j) =>
        renderNode(child, `node-${i}-${j}`)
      )}
    </p>
  ));
};