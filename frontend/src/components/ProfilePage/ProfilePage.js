import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchProfile, updateProfile } from "../../features/users/profile-slice";
import ProfileHeader from "./ProfileHeader";
import ContentSection from "./ContentSection";
import Sidebar from "./Sidebar";
import Tabs from "./Tabs";
import "./ProfilePage_css/ProfilePage.css";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { username: routeUsername } = useParams();
  const { profile, loading: profileLoading, error } = useSelector(
    (state) => state.profile
  );
  const currentUser = useSelector((state) => state.auth.userInfo);
  const authLoading = useSelector((state) => state.auth.loading);

  const [activeTab, setActiveTab] = useState("posts");

  const tabList = [
    { key: "posts", label: "Posts" },
    { key: "products", label: "Products" },
    { key: "liked", label: "Liked Posts" },
  ];

  useEffect(() => {
    if (currentUser) {
      const userToFetch = routeUsername || currentUser.username;
      dispatch(fetchProfile(userToFetch));
    }
  }, [dispatch, routeUsername, currentUser]);

  const handleSaveProfile = (formData) => {
    if (!profile) return;
    const usernameToUpdate = profile.user?.username || profile.username;
    dispatch(updateProfile({ username: usernameToUpdate, formData }));
  };

  const isLoading = profileLoading || authLoading;

  if (isLoading) return <p>Loading profile...</p>;
  if (error) return <p>Error: {typeof error === "string" ? error : JSON.stringify(error)}</p>;
  if (!profile || !currentUser) return <p>No profile found.</p>;

  return (
    <div className="profile-page-grid">
      <div className="profile-main">
        <ProfileHeader
          user={profile}
          currentUser={currentUser}
          onSaveProfile={handleSaveProfile}
        />

        {/* Reusable Tabs */}
        <Tabs tabs={tabList} activeTab={activeTab} setActiveTab={setActiveTab} />

        <ContentSection activeTab={activeTab} profile={profile} />
      </div>

      <div className="profile-sidebar">
        <Sidebar />
      </div>
    </div>
  );
};

export default ProfilePage;
