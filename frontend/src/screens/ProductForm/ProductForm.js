import React, { useState } from 'react';
import './ProductForm.css';

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    seller: '',
    profileImage: '',
    additionalImages: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, additionalImages: files });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Product added:', formData);
  };

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>Add a Product</h2>
      <input type="text" name="name" placeholder="Product Name" onChange={handleChange} />
      <textarea name="description" placeholder="Product Description" onChange={handleChange}></textarea>
      <input type="text" name="price" placeholder="Price" onChange={handleChange} />
      <input type="text" name="seller" placeholder="Seller Name" onChange={handleChange} />
      <label>Profile Image:</label>
      <input type="file" name="profileImage" onChange={handleChange} />
      <label>Additional Images:</label>
      <input type="file" name="additionalImages" multiple onChange={handleImageChange} />
      <button type="submit">Submit</button>
    </form>
  );
};

export default ProductForm;
