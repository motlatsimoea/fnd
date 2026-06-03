import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import BlogPost from "../components/BlogPost/BlogPost";
import Loader from "../components/Loader";
import Message from "../components/Message";

import { fetchBlogPosts } from "../features/blog/BlogList-slice";
import { fetchFollowingFeed } from "../features/feed/FollowingFeedSlice";
import './HomeScreen.css'

const HomeScreen = () => {

  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("all");

  const { loading, error, posts } = useSelector((state) => state.BlogList);

  const followingFeed = useSelector((state) => state.followingFeed);

  const { loading: followingLoading, posts: followingPosts } = followingFeed;

  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.userInfo;


  useEffect(() => {
    dispatch(fetchBlogPosts());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "following" && isLoggedIn) {
      dispatch(fetchFollowingFeed());
    }
  }, [activeTab, dispatch, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchFollowingFeed());
    }
  }, [dispatch, isLoggedIn]);

  const displayPosts =
    activeTab === "following" ? followingPosts : posts;

  const displayLoading =
    activeTab === "following" ? followingLoading : loading;

  return (
    <div>

      {/* Feed Tabs */}
      <div className="feed-tabs">

        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All Posts
        </button>

        {isLoggedIn && (
          <button
            className={activeTab === "following" ? "active" : ""}
            onClick={() => setActiveTab("following")}
          >
            Following
          </button>
        )}

      </div>

      <main style={{ padding: "20px" }}>

        {displayLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : displayPosts.length === 0 ? (
          <Message variant="info">No posts available...</Message>
        ) : (
          displayPosts.map((post) => (
            <BlogPost
              key={post.id}
              id={`${post.id}`}
              title={post.title}
              author={post.author.username}
              date={post.time_since_posted}
              authorImage={post.authorImage}
              images={post.media}
              text={post.content}
              likes={post.like_count}
              liked={post.liked}
            />
          ))
        )}

      </main>
    </div>
  );
};

export default HomeScreen;