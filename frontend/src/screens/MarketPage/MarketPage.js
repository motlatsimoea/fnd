import React from 'react';
import './MarketPage.css';
import { Link } from 'react-router-dom';

const MarketPage = () => {
  const products = [
    { id: 1, name: 'Fresh Tomatoes', image: '/images/tomatoes1.jpg', price: '$10/kg', link: '/product/1' },
    { id: 2, name: 'Organic Carrots', image: '/images/carrots.jpg', price: '$8/kg', link: '/product/2' },
    { id: 3, name: 'Free-Range Eggs', image: '/images/eggs.jpg', price: '$5/dozen', link: '/product/3' },
    // Add more products as needed
  ];

  return (
    <div className="market-page">
      <h1>Welcome to the Farmer's Market</h1>
      <button className="add-product-btn">
        <Link to="/add-product">Add a Product</Link>
      </button>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.price}</p>
            <Link to={product.link}>View Product</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketPage;
