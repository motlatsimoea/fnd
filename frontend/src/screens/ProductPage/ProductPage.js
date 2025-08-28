import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById } from "../../features/products/Product-slice";
import Reviews from "./Reviews";
import ImageModal from "../../components/ImageModal"; // ✅ import modal
import "./ProductPage.css";

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    selectedProduct: product,
    fetchOneStatus: loading,
    error,
  } = useSelector((state) => state.product);

  const [currentImage, setCurrentImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Compose an array of image URLs
  const images = product
    ? product.additional_images?.length > 0
      ? product.additional_images.map((img) => img.file || img)
      : product.thumbnail
      ? [product.thumbnail.file || product.thumbnail]
      : []
    : [];

  useEffect(() => {
    if (id) dispatch(fetchProductById(id));
  }, [dispatch, id]);

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading === "loading") return <p>Loading product...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div className="product-page">
      {images.length > 0 ? (
        <div className="product-slider">
          <button onClick={prevImage}>&lt;</button>
          <img
            src={images[currentImage]}
            alt={`Product image ${currentImage + 1}`}
            className="product-image"
            style={{ cursor: "pointer" }}
            onClick={() => setModalOpen(true)} // open modal on click
          />
          <button onClick={nextImage}>&gt;</button>
        </div>
      ) : (
        <img
          src="/images/placeholder.jpg"
          alt="No product images available"
          className="product-image"
        />
      )}

      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">${product.price}</p>
      <p className="seller">
        Seller:{" "}
        <Link to={`/seller/${product.seller}`}>
          {product.seller || "Unknown Seller"}
        </Link>
      </p>

      {/* Pass productId to Reviews so API calls work */}
      {product.id && <Reviews productId={product.id} />}

      {/* ✅ Image modal */}
      {modalOpen && (
        <ImageModal
          images={images} // pass the full array for slider
          initialIndex={currentImage} // start at currently displayed image
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductPage;
