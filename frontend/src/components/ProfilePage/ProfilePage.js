import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileHeader from './ProfileHeader';
import Tabs from './Tabs';
import ContentSection from './ContentSection';
import Sidebar from './Sidebar';
import './ProfilePage_css/ProfilePage.css'; // Optional if you have layout styles

import { fetchProfile } from '../../features/users/profile-slice';
import { fetchProducts } from '../../redux/products/product-slice';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('Posts');
  const dispatch = useDispatch();

  // Auth data from store (e.g., current user ID)
  const userId = useSelector((state) => state.auth.userId);

  // Profile and products from store
  const profile = useSelector((state) => state.profile.user);
  const products = useSelector((state) => state.product.userProducts);

  useEffect(() => {
    if (userId) {
      dispatch(fetchProfile(userId));
      dispatch(fetchProducts(userId));
    }
  }, [dispatch, userId]);

  return (
    <div className="profile-page">
      {profile && <ProfileHeader user={profile} />}

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        <div className="content">
          <ContentSection activeTab={activeTab} data={{ profile, products }} />
        </div>
        <Sidebar />
      </div>
    </div>
  );
};

export default ProfilePage;
