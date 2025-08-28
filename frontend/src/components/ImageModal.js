import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ImageModal.css";

const ImageModal = ({ imageUrl, alt = "image", onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!imageUrl) return null;

  return createPortal(
    <div className="imgmodal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="imgmodal-content" onClick={(e) => e.stopPropagation()}>
        <button className="imgmodal-close" onClick={onClose} aria-label="Close">×</button>
        <img src={imageUrl} alt={alt} className="imgmodal-img" />
      </div>
    </div>,
    document.body
  );
};

export default ImageModal;
