import React, { useState } from 'react';
import Reviews from './Reviews';
import './ProductPage.css';

const ProductPage = () => {
  const product = {
    name: 'Fresh Tomatoes',
    description: 'Organic, freshly harvested tomatoes from local farms.',
    price: '$10 per kg',
    seller: { name: 'John’s Farm', profileLink: '/seller/johns-farm' },
    images: [
      '/images/tomatoes1.jpg',
      '/images/tomatoes2.jpg',
      '/images/tomatoes3.jpg',
    ],
    reviews: [
      { id: 1, user: 'Alice', rating: 5, comment: 'Great quality!' },
      { id: 2, user: 'Bob', rating: 4, comment: 'Fresh and tasty, but a bit pricey.' },
      { id: 3, user: 'Charlie', rating: 3, comment: 'Not bad, but I expected better packaging.' },
    ],
  };

  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="product-page">
      <div className="product-slider">
        <button onClick={prevImage}>&lt;</button>
        <img src={product.images[currentImage]} alt="Product" />
        <button onClick={nextImage}>&gt;</button>
      </div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">{product.price}</p>
      <p className="seller">
        Seller: <a href={product.seller.profileLink}>{product.seller.name}</a>
      </p>
      <Reviews reviews={product.reviews} />
    </div>
  );
};

export default ProductPage;
