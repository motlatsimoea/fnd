import React, { useEffect } from 'react';
import './MarketPage.css';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../features/products/Product-slice';

const MarketPage = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <div className="market-page">
      <h1>Welcome to the Farmer's Market</h1>

      <button className="add-product-btn">
        <Link to="/add-product">Add a Product</Link>
      </button>

      {loading && <p>Loading products...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="product-grid">
        {products?.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <img
                src={product.profile_image || '/images/placeholder.jpg'}
                alt={product.name}
              />
              <h3>{product.name}</h3>
              <p>${product.price}</p>
              <Link to={`/product/${product.id}`}>View Product</Link>
            </div>
          ))
        ) : (
          !loading && <p>No products available.</p>
        )}
      </div>
    </div>
  );
};

export default MarketPage;
