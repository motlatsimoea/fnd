import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import BlogSection from './screens/BlogSection';
import BlogPostPage from './screens/BlogPostPage/BlogPostPage';
import CreatePost from './screens/CreatePost/CreatePost';

import MarketPage from './screens/MarketPage/MarketPage';
import ProductPage from './screens/ProductPage/ProductPage';
import AddProductForm from './screens/ProductForm/ProductForm';
import InfoPage from './screens/InfoPage/InfoPage';
import ArticlePage from './screens/InfoPage/ArticlePage';
import RegistrationPage from './screens/RegistrationPage/RegistrationPage';

import InboxPage from './screens/InboxPage/InboxPage';
import ChatPage from './screens/InboxPage/ChatPage';

import LoginPage from './screens/LoginPage/LoginPage';

import ProfilePage from './components/ProfilePage/ProfilePage';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Registration Page Route */}
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />

        {/* Login Page Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Blog Routes */}
        <Route path="/" element={<BlogSection />} /> {/* Main blog section */}
        <Route path="/create-post" element={<CreatePost />} /> {/* Main blog section */}
        <Route path="/blog/:id" element={<BlogPostPage />} /> {/* Specific blog post */}

        {/* Market Place Routes */}
        <Route path="/market" element={<MarketPage />} /> {/* Main market page */}
        <Route path="/product/:id" element={<ProductPage />} /> {/* Specific product page */}
        <Route path="/add-product" element={<AddProductForm />} /> {/* Add product form */}

        {/* Information Page Routes */}
        <Route path="/info" element={<InfoPage />} /> {/* Main information page */}
        <Route path="/article/:id" element={<ArticlePage />} /> {/* Specific article page */}

        {/* Inbox Page Routes */}
        <Route path="/inbox" element={<InboxPage />} /> {/* Main inbox page */}
        <Route path="/chat/:chatId" element={<ChatPage />} /> {/* Specific chat page */}
      </Routes>
    </Router>
  );
}

export default App;
