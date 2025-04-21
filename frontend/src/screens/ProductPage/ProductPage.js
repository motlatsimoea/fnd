import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../../features/products/Product-slice'; // update path as needed
import Reviews from './Reviews';
import './ProductPage.css';

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedProduct: product, loading, error } = useSelector((state) => state.products);

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % (product?.additional_images?.length || 1));
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + (product?.additional_images?.length || 1)) % (product?.additional_images?.length || 1));
  };

  if (loading) return <p>Loading product...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div className="product-page">
      <div className="product-slider">
        <button onClick={prevImage}>&lt;</button>
        <img
          src={product.additional_images?.[currentImage] || product.profile_image || '/images/placeholder.jpg'}
          alt="Product"
        />
        <button onClick={nextImage}>&gt;</button>
      </div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">${product.price}</p>
      <p className="seller">
        Seller: <a href={`/seller/${product.seller}`}>{product.seller_name || 'Unknown Seller'}</a>
      </p>
      <Reviews reviews={product.reviews || []} />
    </div>
  );
};

export default ProductPage;
