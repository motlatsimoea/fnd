import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

const getErrorMessage = (error) =>
  error.response?.data?.detail ||
  error.response?.data?.message ||
  error.message ||
  "Something went wrong";

// Fetch all products
export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/api/products/");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

// Create a product
export const createProduct = createAsyncThunk(
  "products/create",
  async (formData, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/api/products/", formData);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

// Fetch single product
export const fetchProductById = createAsyncThunk(
  "products/fetchById",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/api/products/${id}/`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, formData }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/api/products/${id}/`, formData);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

// Delete product
export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/api/products/${id}/`);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

const initialState = {
  products: [],
  selectedProduct: null,
  fetchAllStatus: "idle",
  fetchOneStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
  formResetFlag: false, // used to signal ProductForm reset
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetProductForm: (state) => {
      state.formResetFlag = !state.formResetFlag;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL
      .addCase(fetchProducts.pending, (state) => {
        state.fetchAllStatus = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.fetchAllStatus = "succeeded";
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.fetchAllStatus = "failed";
        state.error = action.payload;
      })

      // FETCH ONE
      .addCase(fetchProductById.pending, (state) => {
        state.fetchOneStatus = "loading";
        state.error = null;
        state.selectedProduct = null; // clear stale data
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.fetchOneStatus = "succeeded";
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.fetchOneStatus = "failed";
        state.error = action.payload;
      })

      // CREATE
      .addCase(createProduct.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.products = [...state.products, action.payload];
        state.formResetFlag = !state.formResetFlag; // trigger form reset after success
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateProduct.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.products = state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteProduct.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.products = state.products.filter((p) => p.id !== action.payload);
        if (state.selectedProduct?.id === action.payload) {
          state.selectedProduct = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearSelectedProduct, clearError, resetProductForm } = productsSlice.actions;

export default productsSlice.reducer;
