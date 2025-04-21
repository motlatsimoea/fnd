import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";

// Fetch all products
export const fetchProducts = createAsyncThunk("products/fetchAll", async () => {
  const response = await axios.get("/products/");
  return response.data;
});

// Create a product
export const createProduct = createAsyncThunk("products/create", async (data) => {
  const response = await axios.post("/products/", data);
  return response.data;
});

// Fetch single product
export const fetchProductById = createAsyncThunk("products/fetchById", async (id) => {
  const response = await axios.get(`/products/${id}/`);
  return response.data;
});

// Update product
export const updateProduct = createAsyncThunk("products/update", async ({ id, data }) => {
  const response = await axios.put(`/products/${id}/`, data);
  return response.data;
});

// Delete product
export const deleteProduct = createAsyncThunk("products/delete", async (id) => {
  await axios.delete(`/products/${id}/`);
  return id;
});

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedProduct: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.selectedProduct = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
      });
  }
});

export default productsSlice.reducer;
