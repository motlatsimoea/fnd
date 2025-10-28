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

  const { selectedProduct, updateStatus, fetchOneStatus, error } = useSelector(
    (state) => state.product
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    thumbnail: null,
    additionalImages: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);

  const thumbnailRef = useRef();
  const additionalRef = useRef();

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name || "",
        description: selectedProduct.description || "",
        price: selectedProduct.price || "",
        thumbnail: null,
        additionalImages: [],
      });
      setThumbnailPreview(selectedProduct.thumbnail || null);
      setAdditionalPreviews(selectedProduct.additional_images || []);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) dispatch(clearError());
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, thumbnail: file }));
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailPreview(selectedProduct?.thumbnail || null);
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      alert("You can only upload up to 4 additional images.");
      return;
    }
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
    if (formData.thumbnail) data.append("thumbnail", formData.thumbnail);
    formData.additionalImages.forEach((file) =>
      data.append("additional_images", file)
    );

    dispatch(updateProduct({ id, formData: data }))
      .unwrap()
      .then(() => navigate(`/product/${id}`))
      .catch((err) => console.error("Update failed:", err));
  };

  if (fetchOneStatus === "loading") return <Loader />;

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>Edit Product</h2>

      {updateStatus === "loading" && <Loader />}

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
      <div className="image-previews">
        {additionalPreviews.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Additional Preview ${idx + 1}`}
            style={{
              maxWidth: "100px",
              maxHeight: "100px",
              objectFit: "cover",
              margin: "5px",
            }}
          />
        ))}
      </div>

      <button type="submit" disabled={updateStatus === "loading"}>
        {updateStatus === "loading" ? "Updating..." : "Save Changes"}
      </button>

      {error && <Message variant="danger">{error}</Message>}
    </form>
  );
};

export default EditProduct;
