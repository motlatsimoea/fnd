import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileHeader from './ProfileHeader';
import Tabs from './Tabs';
import ContentSection from './ContentSection';
import Sidebar from './Sidebar';
import './ProfilePage_css/ProfilePage.css';

import { fetchProfile } from '../../features/users/profile-slice';
import { fetchProducts } from '../../features/products/Product-slice';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('Posts');
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth.userInfo);
  const profile = useSelector((state) => state.profile.user);
  const products = useSelector((state) => state.product.userProducts);

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchProfile(currentUser.id));
      dispatch(fetchProducts(currentUser.id));
    }
  }, [dispatch, currentUser?.id]);

  return (
    <div className="profile-page">
      {profile && <ProfileHeader user={profile} currentUser={currentUser} />}

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
