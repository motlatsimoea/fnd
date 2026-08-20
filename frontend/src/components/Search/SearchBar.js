import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUser,
  FaHashtag,
  FaFileAlt
} from "react-icons/fa";

import {
  searchAll,
  clearSearchResults
} from "../../features/search/search-slice";

import "./SearchBar.css";

const SearchBar = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const searchRef = useRef(null);

  const { results, loading } = useSelector(
    (state) => state.search
  );

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // -----------------------------------
  // SEARCH
  // -----------------------------------

  useEffect(() => {

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      dispatch(clearSearchResults());
      return;
    }

    const timeout = setTimeout(() => {
      dispatch(searchAll(trimmed));
      setShowResults(true);
    }, 300);

    return () => clearTimeout(timeout);

  }, [query, dispatch]);


  // -----------------------------------
  // CLOSE WHEN CLICKING OUTSIDE
  // -----------------------------------

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }

    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);


  // -----------------------------------
  // NAVIGATION
  // -----------------------------------

  const handleUserClick = (username) => {

    setShowResults(false);
    setQuery("");

    navigate(`/profile/${username}`);
  };


  const handlePostClick = (postId) => {

    setShowResults(false);
    setQuery("");

    navigate(`/post/${postId}`);
  };


  const handleHashtagClick = (hashtag) => {

    setShowResults(false);
    setQuery("");

    navigate(
      `/hashtag/${encodeURIComponent(hashtag)}`
    );
  };


  const hasResults =
    results.users.length > 0 ||
    results.hashtags.length > 0 ||
    results.posts.length > 0;


  return (
    <div className="search-container" ref={searchRef}>

      <div className="search-input-wrapper">

        <FaSearch className="search-icon" />

        <input
          type="text"
          value={query}
          placeholder="Search users, hashtags, posts..."
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setShowResults(true);
            }
          }}
        />

        {loading && (
          <span className="search-loading">
            ...
          </span>
        )}

      </div>


      {showResults && query.trim().length >= 2 && (
        <div className="search-results">

          {!hasResults && !loading && (
            <div className="no-results">
              No results found
            </div>
          )}


          {/* USERS */}

          {results.users.length > 0 && (
            <div className="search-section">

              <div className="search-section-title">
                Users
              </div>

              {results.users.map((user) => (

                <button
                  key={user.id}
                  className="search-result"
                  onClick={() =>
                    handleUserClick(user.username)
                  }
                >

                  <div className="search-result-icon">

                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.username}
                      />
                    ) : (
                      <FaUser />
                    )}

                  </div>

                  <div className="search-result-text">

                    <strong>
                      {user.username}
                    </strong>

                    {user.name && (
                      <span>
                        {user.name}
                      </span>
                    )}

                  </div>

                </button>

              ))}

            </div>
          )}


          {/* HASHTAGS */}

          {results.hashtags.length > 0 && (
            <div className="search-section">

              <div className="search-section-title">
                Hashtags
              </div>

              {results.hashtags.map((hashtag) => (

                <button
                  key={hashtag.name}
                  className="search-result"
                  onClick={() =>
                    handleHashtagClick(hashtag.name)
                  }
                >

                  <div className="search-result-icon">
                    <FaHashtag />
                  </div>

                  <div className="search-result-text">

                    <strong>
                      #{hashtag.name}
                    </strong>

                    <span>
                      {hashtag.usage_count} posts
                    </span>

                  </div>

                </button>

              ))}

            </div>
          )}


          {/* POSTS */}

    {results.posts.length > 0 && (
      <div className="search-section">

        <div className="search-section-title">
          Posts
        </div>

        {results.posts.map((post) => (

          <button
            key={post.id}
            className="search-result"
            onClick={() => handlePostClick(post.id)}
          >

            <div className="search-result-icon">
              <FaFileAlt />
            </div>

            <div className="search-result-text">

              <strong>
                {post.title || "Untitled post"}
              </strong>

              <span>
                @{post.author?.username || "Unknown User"}
              </span>

              <p>
                {post.content_preview}
                {post.content_preview?.length >= 100 && "..."}
              </p>

            </div>

          </button>

        ))}

      </div>
    )}

        </div>
      )}

    </div>
  );
};

export default SearchBar;