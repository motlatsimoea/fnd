export const getLexicalText = (content) => {
  if (!content) return "";

  try {
    const lexicalData =
      typeof content === "string"
        ? JSON.parse(content)
        : content;

    const extractText = (node) => {
      if (!node) return "";

      if (node.type === "text") {
        return node.text || "";
      }

      if (node.children) {
        return node.children
          .map(extractText)
          .join(" ");
      }

      return "";
    };

    return extractText(lexicalData.root || lexicalData)
      .replace(/\s+/g, " ")
      .trim();

  } catch (error) {
    console.error("Failed to extract Lexical text:", error);
    return "";
  }
};