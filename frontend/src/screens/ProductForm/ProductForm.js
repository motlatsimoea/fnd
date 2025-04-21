import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct } from '../../features/products/Product-slice'; 
import './ProductForm.css';

const ProductForm = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.access);
  const { loading, error } = useSelector((state) => state.products);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    profileImage: null,
    additionalImages: [],
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileImage') {
      setFormData((prev) => ({ ...prev, profileImage: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, additionalImages: files }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    if (formData.profileImage) {
      data.append('profile_image', formData.profileImage);
    }
    formData.additionalImages.forEach((file) => {
      data.append('additional_images', file);
    });

    dispatch(createProduct({ formData: data, token: accessToken }));
  };

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>Add a Product</h2>
      <input type="text" name="name" placeholder="Product Name" onChange={handleChange} required />
      <textarea name="description" placeholder="Product Description" onChange={handleChange} required></textarea>
      <input type="number" name="price" placeholder="Price" onChange={handleChange} required />
      
      <label>Profile Image:</label>
      <input type="file" name="profileImage" accept="image/*" onChange={handleChange} />

      <label>Additional Images:</label>
      <input type="file" name="additionalImages" multiple accept="image/*" onChange={handleImageChange} />

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>

      {error && <p className="error-message">{error}</p>}
    </form>
  );
};

export default ProductForm;
