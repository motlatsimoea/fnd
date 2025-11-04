import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import "./ImageModal.css";

const normalizeImages = (arr = []) =>
  arr
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      if (item.file) return item.file;
      if (item.url) return item.url;
      return null;
    })
    .filter(Boolean);

const ImageCarouselModal = ({ images = [], initialIndex = 0, onClose }) => {
  const urls = useMemo(() => normalizeImages(images), [images]);
  const [index, setIndex] = useState(
    Number.isFinite(initialIndex) ? Math.min(Math.max(initialIndex, 0), Math.max(urls.length - 1, 0)) : 0
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % urls.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + urls.length) % urls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, urls.length]);

  if (!urls.length) return null;

  const prev = () => setIndex((i) => (i - 1 + urls.length) % urls.length);
  const next = () => setIndex((i) => (i + 1) % urls.length);

  return createPortal(
    <div className="imgmodal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="imgmodal-content" onClick={(e) => e.stopPropagation()}>
        <button className="imgmodal-close" onClick={onClose} aria-label="Close">×</button>

        <button className="imgmodal-nav imgmodal-prev" onClick={prev} aria-label="Previous">‹</button>
        <img src={urls[index]} alt={`Slide ${index + 1}`} className="imgmodal-img" />
        <button className="imgmodal-nav imgmodal-next" onClick={next} aria-label="Next">›</button>

        <div className="imgmodal-counter">{index + 1} / {urls.length}</div>
      </div>
    </div>,
    document.body
  );
};

export default ImageCarouselModal;
