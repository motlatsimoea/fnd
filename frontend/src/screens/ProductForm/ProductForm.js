import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createProduct,
  resetProductForm,
  clearError,
} from "../../features/products/Product-slice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import "./ProductForm.css";

const ProductForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    createStatus: loading,
    error,
    formResetFlag,
    successMessage,
  } = useSelector((state) => state.product);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    thumbnail: null,
    additionalImages: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);

  // Refs for file inputs
  const thumbnailRef = useRef();
  const additionalRef = useRef();

  // Reset form & previews after successful creation
  useEffect(() => {
    if (successMessage || formResetFlag) {
      setFormData({
        name: "",
        description: "",
        price: "",
        thumbnail: null,
        additionalImages: [],
      });
      setThumbnailPreview(null);
      setAdditionalPreviews([]);

      if (thumbnailRef.current) thumbnailRef.current.value = "";
      if (additionalRef.current) additionalRef.current.value = "";

      const timeout = setTimeout(() => {
        dispatch(resetProductForm());
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [successMessage, formResetFlag, dispatch]);

  // Cleanup preview URLs on unmount or when previews change
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      additionalPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [thumbnailPreview, additionalPreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) dispatch(clearError());
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, thumbnail: file }));

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);

    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailPreview(null);
    }

    if (error) dispatch(clearError());
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 4) {
      alert("You can only upload up to 4 additional images.");
      return;
    }

    // Clean up old previews
    additionalPreviews.forEach((url) => URL.revokeObjectURL(url));

    setFormData((prev) => ({ ...prev, additionalImages: files }));

    const previews = files.map((file) => URL.createObjectURL(file));
    setAdditionalPreviews(previews);

    if (error) dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    if (formData.thumbnail) data.append("thumbnail", formData.thumbnail);
    formData.additionalImages.forEach((file) =>
      data.append("additional_images", file)
    );

    dispatch(createProduct(data))
      .unwrap()
      .then((newProduct) => {
        navigate(`/product/${newProduct.id}`); // Redirect to new product page
      })
      .catch((err) => {
        console.error("Product creation failed:", err);
      });
  };


  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Create Product</h2>

      {loading === "loading" && <Loader />}

      <div className="form-group">
        <label>Product</label>
        <input
          type="text"
          name="name"
          placeholder="e.g. Chickens..."
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          placeholder="Describe your product..."
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Price</label>
        <input
          type="number"
          name="price"
          placeholder="0.00"
          value={formData.price}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
        />
      </div>

      {/* Thumbnail */}
      <div className="form-group">
        <label>Thumbnail</label>
        <div className="file-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            ref={thumbnailRef}
          />
          <span>Click to upload thumbnail</span>
        </div>

        {thumbnailPreview && (
          <img
            src={thumbnailPreview}
            alt="Thumbnail Preview"
            className="preview-large"
          />
        )}
      </div>

      {/* Additional Images */}
      <div className="form-group">
        <label>Additional Images (max 4)</label>
        <div className="file-upload">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleAdditionalImagesChange}
            ref={additionalRef}
          />
          <span>Upload more images</span>
        </div>

        <div className="preview-grid">
          {additionalPreviews.map((url, idx) => (
            <img key={idx} src={url} alt="" />
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="submit-btn"
        disabled={loading === "loading"}
      >
        {loading === "loading" ? "Creating..." : "Create Product"}
      </button>

      {error && <Message variant="danger">{error}</Message>}
      {successMessage && <Message variant="success">{successMessage}</Message>}
    </form>
  );
};

export default ProductForm;
