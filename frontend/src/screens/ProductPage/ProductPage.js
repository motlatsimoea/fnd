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
import { FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      ].filter(Boolean)
    : [];

  useEffect(() => {
    if (id) dispatch(fetchProductById(id));

    return () => {
      dispatch(clearError());
    };
  }, [dispatch, id]);

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteProduct(product.id)).unwrap();
      setShowDeleteModal(false);
      navigate("/market");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading === "loading") return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!product) return <p>Product not found.</p>;

  const isOwner = userInfo && userInfo.username === product.seller;

  return (
    <>
      <div className="product-page">
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

        <div className="product-info">

      <div className="product-header">
        <div>
          <h1>{product.name}</h1>

          <p className="price">
            R{product.price}
          </p>

          <p className="seller">
            Sold by{" "}
            <Link to={`/profile/${product.seller}`}>
              {product.seller || "Unknown Seller"}
            </Link>
          </p>

        </div>

        {isOwner && (
          <div className="product-actions">

            <button
              className="product-action-link edit-link"
              onClick={() => navigate(`/edit-product/${product.id}`)}
            >
              <FaEdit />
              <span>Edit</span>
            </button>

            <button
              className="product-action-link delete-link"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteStatus === "loading"}
            >
              <FaTrash />
              <span>
                {deleteStatus === "loading"
                  ? "Deleting..."
                  : "Delete"}
              </span>
            </button>

          </div>
        )}

      </div>

      <div className="product-description">
        <h3>Description</h3>
        <p>{product.description}</p>
      </div>

    </div>

    <div className="reviews-section">
      {product.id && <Reviews productId={product.id} />}
    </div>

        {modalOpen && (
          <ImageModal
            images={images}
            initialIndex={currentImage}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>

      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
           
            <h3>
              Delete Product?
            </h3>

            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteStatus === "loading"}
              >
                Cancel
              </button>

              <button
                className="modal-delete"
                onClick={confirmDelete}
                disabled={deleteStatus === "loading"}
              >
                {deleteStatus === "loading" ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductPage;