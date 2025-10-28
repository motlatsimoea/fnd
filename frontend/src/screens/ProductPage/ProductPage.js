import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductById,
  deleteProduct,
  clearError,
} from "../../features/products/Product-slice";
import Reviews from "./Reviews";
import ImageModal from "../../components/ImageModal";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { FaArrowLeft } from "react-icons/fa"; // ✅ Back arrow icon
import "./ProductPage.css";

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    selectedProduct: product,
    fetchOneStatus: loading,
    deleteStatus,
    error,
  } = useSelector((state) => state.product);

  const { userInfo } = useSelector((state) => state.auth || {});

  const [currentImage, setCurrentImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // ✅ Compose image URLs safely
  const images = product
    ? [
        ...(product.thumbnail
          ? [
              typeof product.thumbnail === "string"
                ? product.thumbnail
                : product.thumbnail.file ||
                  product.thumbnail.image ||
                  product.thumbnail.url ||
                  "",
            ]
          : []),
        ...(product.additional_images?.length
          ? product.additional_images.map((img) =>
              typeof img === "string"
                ? img
                : img.file || img.image || img.url || ""
            )
          : []),
      ]
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(product.id)).unwrap();
        navigate("/market");
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  if (loading === "loading") return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!product) return <p>Product not found.</p>;

  const isOwner = userInfo && userInfo.username === product.seller;

  return (
    <div className="product-page">
      {/* ✅ Back button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      {images.length > 0 ? (
        <div className="product-slider">
          <button onClick={prevImage} aria-label="Previous image">
            &lt;
          </button>
          <img
            src={images[currentImage]}
            alt={`${product.name} ${currentImage + 1}`}
            className="product-image"
            style={{ cursor: "pointer" }}
            onClick={() => setModalOpen(true)}
          />
          <button onClick={nextImage} aria-label="Next image">
            &gt;
          </button>
        </div>
      ) : (
        <img
          src="/images/placeholder.jpg"
          alt="No product available"
          className="product-image"
        />
      )}

      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">R{product.price}</p>
      <p className="seller">
        Seller:{" "}
        <Link to={`/profile/${product.seller}`}>
          {product.seller || "Unknown Seller"}
        </Link>
      </p>

      {/* ✅ Owner-only actions */}
      {isOwner && (
        <div className="product-actions">
          <button
            className="edit-btn"
            onClick={() => navigate(`/edit-product/${product.id}`)}
          >
            ✏️ Edit
          </button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            disabled={deleteStatus === "loading"}
          >
            {deleteStatus === "loading" ? "Deleting..." : "🗑️ Delete"}
          </button>
        </div>
      )}

      {product.id && <Reviews productId={product.id} />}

      {modalOpen && (
        <ImageModal
          images={images}
          initialIndex={currentImage}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductPage;
