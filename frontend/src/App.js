import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { startTokenRefreshTimer, refreshToken } from './features/users/auth-slice';
import { setAccessToken } from './utils/axiosInstance';

import Header from './components/Header/Header';
import Loader from './components/Loader';
import Footer from './components/Footer/Footer';

// Public screens
import HomeScreen from './screens/HomeScreen';
import BlogPostPage from './screens/BlogPostPage/BlogPostPage';
import MarketPage from './screens/MarketPage/MarketPage';
import ProductPage from './screens/ProductPage/ProductPage';
import InfoPage from './screens/InfoPage/InfoPage';
import ArticlePage from './screens/InfoPage/ArticlePage';
import RegistrationPage from './screens/RegistrationPage/RegistrationPage';
import VerifyOtpPage from './screens/RegistrationPage/VerifyOtpPage';
import LoginPage from './screens/LoginPage/LoginPage';
import ForgotPasswordPage from './screens/PassowordReset/ForgotPasswordPage';
import ResetPasswordPage from './screens/PassowordReset/ResetPasswordPage';
import ResetPasswordPhonePage from './screens/PassowordReset/ResetPasswordPhonePage';

// Protected screens
import CreatePost from './screens/CreatePost/CreatePost';
import EditPost from './screens/CreatePost/EditPost';
import EditProduct from './screens/ProductPage/EditProduct';
import AddProductForm from './screens/ProductForm/ProductForm';
import HashtagPage from './components/Hashtag/HashtagPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import InboxPage from './screens/InboxPage/InboxPage';
import ChatPage from './components/chat/ChatPage';
import Chat from './components/chat/chat';

import PrivacyPolicy from './screens/legal/PrivacyPolicy';
import TermsOfService from './screens/legal/TermsOfService';
import SettingsPage from './screens/SettingsPage/SettingsPage';
import AboutPage from './screens/AboutPage/AboutPage';

// Utils & hooks
import ProtectedRoute from './components/ProtectedRoute';
import useInboxSocket from "./components/chat/useInboxSocket";

const App = () => {
  const dispatch = useDispatch();
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Bootstrap auth on app load
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const hasSession = sessionStorage.getItem('hasSession') === 'true';
        if (!hasSession) {
          setLoadingAuth(false);
          return;
        }

        const result = await dispatch(refreshToken()).unwrap();
        const access = result?.access ?? result;
        setAccessToken(access);

        startTokenRefreshTimer(dispatch, access);
      } catch (err) {
        console.error("Bootstrap auth failed:", err);
      } finally {
        setLoadingAuth(false);
      }
    };

    bootstrapAuth();
  }, [dispatch]);

  // Connect inbox socket after auth is ready
  useInboxSocket(loadingAuth);

  if (loadingAuth) return <Loader />;

  return (
    <Router>
      <Header />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomeScreen />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-password-phone" element={<ResetPasswordPhonePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/article/:id" element={<ArticlePage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/edit-post/:id" element={<EditPost />} />
          <Route path="/hashtag/:name" element={<HashtagPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/edit-product/:id" element={<EditProduct />} />
          <Route path="/add-product" element={<AddProductForm />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/chat/:uniqueKey" element={<ChatPage />} />
          <Route path="/chat_test/:chat_id" element={<Chat />} />
        </Route>
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
      
      <Footer />
    </Router>
  );
};

export default App;
