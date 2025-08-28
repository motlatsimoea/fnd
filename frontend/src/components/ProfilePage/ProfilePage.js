import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchProfile, updateProfile } from "../../features/users/profile-slice";
import ProfileHeader from "./ProfileHeader";
import ContentSection from "./ContentSection";
import Sidebar from "./Sidebar";
import "./ProfilePage_css/ProfilePage.css";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { username: routeUsername } = useParams(); // <-- get username from URL
  const { profile, loading: profileLoading, error } = useSelector(
    (state) => state.profile
  );
  const currentUser = useSelector((state) => state.auth.userInfo);
  const authLoading = useSelector((state) => state.auth.loading);

  const [activeTab, setActiveTab] = useState("posts");

  // Fetch profile on load or when routeUsername changes
  useEffect(() => {
    if (currentUser) {
      const userToFetch = routeUsername || currentUser.username;
      dispatch(fetchProfile(userToFetch));
    }
  }, [dispatch, routeUsername, currentUser]);

  // Handler to save profile edits
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
      {/* Main content 2/3 */}
      <div className="profile-main">
        <ProfileHeader
          user={profile}
          currentUser={currentUser}
          onSaveProfile={handleSaveProfile} // pass handler
        />

        <div className="tabs">
          <button
            className={activeTab === "posts" ? "active" : ""}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
          <button
            className={activeTab === "liked" ? "active" : ""}
            onClick={() => setActiveTab("liked")}
          >
            Liked Posts
          </button>
        </div>

        <ContentSection activeTab={activeTab} profile={profile} />
      </div>

      {/* Sidebar 1/3 */}
      <div className="profile-sidebar">
        <Sidebar />
      </div>
    </div>
  );
};

export default ProfilePage;
