def extract_text(node):
    """
    Recursively extract plain text from Lexical JSON
    WITHOUT adding artificial spacing.
    """
    if isinstance(node, dict):
        text = node.get("text", "")
        children = node.get("children", [])
        return text + "".join(extract_text(child) for child in children)

    elif isinstance(node, list):
        return "".join(extract_text(child) for child in node)

    return ""