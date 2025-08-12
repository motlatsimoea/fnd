import React, { useEffect } from "react";
import "./MarketPage.css";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../features/products/Product-slice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";

const MarketPage = () => {
  const dispatch = useDispatch();
  const { products, fetchAllStatus: loading, error } = useSelector(
    (state) => state.product
  );

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <div className="market-page">
      <h1>Welcome to the Farmer's Market</h1>

      <button className="add-product-btn">
        <Link to="/add-product">Add a Product</Link>
      </button>

      {/* Loader */}
      {loading === "loading" && <Loader />}

      {/* Error Message */}
      {error && <Message variant="danger">{error}</Message>}

      {/* Products */}
      <div className="product-grid">
        {products?.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <img
                src={product.thumbnail || "/images/placeholder.jpg"}
                alt={product.name || "Product Image"}
                className="product-image"
              />
              <h3>
                <Link to={`/product/${product.id}`}>{product.name}</Link>
              </h3>
              <p>${product.price}</p>
              <Link to={`/product/${product.id}`}>View Product</Link>
            </div>
          ))
        ) : (
          loading !== "loading" && !error && (
            <Message>No products available.</Message>
          )
        )}
      </div>
    </div>
  );
};

export default MarketPage;
