import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchProductById,
  updateProduct,
  clearError,
} from "../../features/products/Product-slice";

import Loader from "../../components/Loader";
import Message from "../../components/Message";
import "../ProductForm/ProductForm.css";

const EditProduct = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedProduct, updateStatus, fetchOneStatus, error } =
    useSelector((state) => state.product);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    thumbnail: null,
    additionalImages: [],
  });

  // server + local previews separated (IMPORTANT FIX)
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [serverThumbnail, setServerThumbnail] = useState(null);

  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [serverImages, setServerImages] = useState([]);

  const thumbnailRef = useRef();
  const additionalRef = useRef();

  // fetch product
  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  // populate form
  useEffect(() => {
    if (!selectedProduct) return;

    setFormData({
      name: selectedProduct.name || "",
      description: selectedProduct.description || "",
      price: selectedProduct.price || "",
      thumbnail: null,
      additionalImages: [],
    });

    // server image (safe string handling)
    setServerThumbnail(selectedProduct.thumbnail || null);

    const images = Array.isArray(selectedProduct.additional_images)
      ? selectedProduct.additional_images
      : [];

    setServerImages(images);
  }, [selectedProduct]);

  // cleanup object URLs
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      additionalPreviews.forEach((u) => URL.revokeObjectURL(u));
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
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 4) {
      alert("You can only upload up to 4 additional images.");
      return;
    }

    // cleanup old previews
    additionalPreviews.forEach((url) => URL.revokeObjectURL(url));

    setFormData((prev) => ({ ...prev, additionalImages: files }));

    const previews = files.map((file) => URL.createObjectURL(file));
    setAdditionalPreviews(previews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);

    if (formData.thumbnail) {
      data.append("thumbnail", formData.thumbnail);
    }

    formData.additionalImages.forEach((file) => {
      data.append("additional_images", file);
    });

    dispatch(updateProduct({ id, formData: data }))
      .unwrap()
      .then(() => navigate(`/product/${id}`))
      .catch((err) => console.error("Update failed:", err));
  };

  if (fetchOneStatus === "loading") return <Loader />;

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Edit Product</h2>

      {updateStatus === "loading" && <Loader />}

      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
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
          value={formData.price}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
        />
      </div>

      {/* THUMBNAIL */}
      <div className="form-group">
        <label>Thumbnail</label>

        <input
          type="file"
          accept="image/*"
          onChange={handleThumbnailChange}
          ref={thumbnailRef}
        />

        {thumbnailPreview ? (
            <img
              src={thumbnailPreview}
              alt="Product thumbnail preview"
              className="preview-large"
            />
          ) : serverThumbnail ? (
            <img
              src={serverThumbnail}
              alt="Current product thumbnail"
              className="preview-large"
            />
          ) : null}
      </div>

      {/* ADDITIONAL IMAGES */}
      <div className="form-group">
        <label>Additional Images</label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleAdditionalImagesChange}
          ref={additionalRef}
        />

        <div className="preview-grid">
          {/* server images */}
          {serverImages.map((img, i) => {
            const url = typeof img === "string" ? img : img?.file;
            return url ? <img key={`server-${i}`} src={url} alt="" /> : null;
          })}

          {/* new uploads */}
          {additionalPreviews.map((url, i) => (
            <img key={`new-${i}`} src={url} alt="" />
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="submit-btn"
        disabled={updateStatus === "loading"}
      >
        {updateStatus === "loading" ? "Updating..." : "Save Changes"}
      </button>

      {error && <Message variant="danger">{error}</Message>}
    </form>
  );
};

export default EditProduct;