import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { startTokenRefreshTimer, refreshToken } from './features/users/auth-slice';
import { setAccessToken } from './utils/axiosInstance';

import Header from './components/Header/Header';
import HomeScreen from './screens/HomeScreen';
import BlogPostPage from './screens/BlogPostPage/BlogPostPage';
import CreatePost from './screens/CreatePost/CreatePost';
import MarketPage from './screens/MarketPage/MarketPage';
import ProductPage from './screens/ProductPage/ProductPage';
import AddProductForm from './screens/ProductForm/ProductForm';
import InfoPage from './screens/InfoPage/InfoPage';
import ArticlePage from './screens/InfoPage/ArticlePage';
import RegistrationPage from './screens/RegistrationPage/RegistrationPage';

import InboxPage from './screens/InboxPage/InboxPage';
import ChatPage from './components/chat/ChatPage';
import Chat from './components/chat/chat';

import LoginPage from './screens/LoginPage/LoginPage';
import ProfilePage from './components/ProfilePage/ProfilePage';

import Loader from './components/Loader';


const App = () => {
  const dispatch = useDispatch();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
  const bootstrapAuth = async () => {
    try {
      const hasSession = sessionStorage.getItem('hasSession') === 'true';

      if (!hasSession) {
        setLoadingAuth(false);
        return;
      }

      // Refresh token and automatically populate userInfo
      const result = await dispatch(refreshToken()).unwrap();
      console.log("refresh result:", result); // { access, user }

      const access = result?.access ?? result;
      setAccessToken(access);

      // Start auto-refresh timer
      startTokenRefreshTimer(dispatch, access);
    } catch (err) {
      console.error("Bootstrap auth failed:", err);
    } finally {
      setLoadingAuth(false);
    }
  };

  bootstrapAuth();
}, [dispatch]);
  

  if (loadingAuth) return <Loader />;

  return (
    <Router>
      <Header />
      <Routes>
        {/* Registration Page Route */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />

        {/* Login Page Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Blog Routes */}
        <Route path="/" element={<HomeScreen />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/blog/:id" element={<BlogPostPage />} />

        {/* Market Place Routes */}
        <Route path="/market" element={<MarketPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/add-product" element={<AddProductForm />} />

        {/* Information Page Routes */}
        <Route path="/info" element={<InfoPage />} />
        <Route path="/article/:id" element={<ArticlePage />} />

        {/* Inbox Page Routes */}
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path="/chat_test/:chat_id" element={<Chat />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
};

export default App;
