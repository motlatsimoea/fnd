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
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>Add a Product</h2>

      {loading === "loading" && <Loader />}

      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <textarea
        name="description"
        placeholder="Product Description"
        value={formData.description}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleChange}
        step="0.01"
        min="0"
        required
      />

      <label>Thumbnail Image:</label>
      <input
        type="file"
        name="thumbnail"
        accept="image/*"
        onChange={handleThumbnailChange}
        ref={thumbnailRef}
      />
      {thumbnailPreview && (
        <img
          src={thumbnailPreview}
          alt="Thumbnail Preview"
          style={{ maxWidth: "150px", marginTop: "10px" }}
        />
      )}

      <label>Additional Images (up to 4):</label>
      <input
        type="file"
        name="additionalImages"
        multiple
        accept="image/*"
        onChange={handleAdditionalImagesChange}
        ref={additionalRef}
      />
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
          flexWrap: "wrap",
        }}
      >
        {additionalPreviews.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Additional Preview ${idx + 1}`}
            style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
          />
        ))}
      </div>

      <button type="submit" disabled={loading === "loading"}>
        {loading === "loading" ? "Submitting..." : "Submit"}
      </button>

      {error && <Message variant="danger">{error}</Message>}
      {successMessage && <Message variant="success">{successMessage}</Message>}
    </form>
  );
};

export default ProductForm;
