import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./ImageModal.css";

const ImageModal = ({ images = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // ✅ Memoized navigation functions
  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]); // ✅ now properly includes dependencies

  if (images.length === 0) return null;

  return createPortal(
    <div className="imgmodal-overlay" onClick={onClose}>
      <div className="imgmodal-content" onClick={(e) => e.stopPropagation()}>
        <button className="imgmodal-close" onClick={onClose}>×</button>
        <button className="imgmodal-prev" onClick={prev}>&lt;</button>
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="imgmodal-img"
        />
        <button className="imgmodal-next" onClick={next}>&gt;</button>
      </div>
    </div>,
    document.body
  );
};

export default ImageModal;
