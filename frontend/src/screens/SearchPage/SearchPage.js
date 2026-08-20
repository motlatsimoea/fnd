import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaUser, FaHashtag, FaSearch } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import BlogPost from "../../components/BlogPost/BlogPost";
import "./SearchPage.css";

const SearchPage = () => {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q") || "";

  const [results, setResults] = useState({
    users: [],
    hashtags: [],
    posts: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {

    const performSearch = async () => {

      if (!query.trim()) {
        setResults({
          users: [],
          hashtags: [],
          posts: [],
        });
        return;
      }

      try {

        setLoading(true);
        setError("");

        const response = await axiosInstance.get(
          `/search/?q=${encodeURIComponent(query)}`
        );

        setResults(response.data);

      } catch (err) {

        console.error("Search failed:", err);

        setError(
          "Something went wrong while searching."
        );

      } finally {

        setLoading(false);

      }
    };

    performSearch();

  }, [query]);


  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };


  const handleHashtagClick = (name) => {
    navigate(
      `/hashtag/${encodeURIComponent(name)}`
    );
  };


  const handlePostClick = (id) => {
    // Change this if your actual post route is different
    navigate(`/post/${id}`);
  };


  return (
    <div className="search-page">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="search-page-header">

        <FaSearch />

        <h2>
          Search results for{" "}
          <span>"{query}"</span>
        </h2>

      </div>


      {/* ========================= */}
      {/* LOADING */}
      {/* ========================= */}

      {loading && (
        <div className="search-page-message">
          Searching...
        </div>
      )}


      {/* ========================= */}
      {/* ERROR */}
      {/* ========================= */}

      {error && (
        <div className="search-page-error">
          {error}
        </div>
      )}


      {!loading && !error && (

        <>

          {/* ========================= */}
          {/* USERS */}
          {/* ========================= */}

          {results.users.length > 0 && (

            <section className="search-results-section">

              <h3>
                <FaUser />
                People
              </h3>

              <div className="search-users-list">

                {results.users.map((user) => (

                  <button
                    key={user.id}
                    className="search-user-card"
                    onClick={() =>
                      handleUserClick(
                        user.username
                      )
                    }
                  >

                    <div className="search-user-avatar">

                      {user.profile_picture ? (

                        <img
                          src={user.profile_picture}
                          alt={user.username}
                        />

                      ) : (

                        <img
                          src="/default_profile.png"
                          alt=""
                        />

                      )}

                    </div>

                    <div className="search-user-info">

                      <strong>
                        {user.username}
                      </strong>

                      {(user.first_name ||
                        user.last_name) && (

                        <span>
                          {user.first_name}{" "}
                          {user.last_name}
                        </span>

                      )}

                    </div>

                  </button>

                ))}

              </div>

            </section>

          )}


          {/* ========================= */}
          {/* HASHTAGS */}
          {/* ========================= */}

          {results.hashtags.length > 0 && (

            <section className="search-results-section">

              <h3>
                <FaHashtag />
                Hashtags
              </h3>

              <div className="search-hashtags-list">

                {results.hashtags.map((hashtag) => (

                  <button
                    key={hashtag.name}
                    className="search-hashtag-card"
                    onClick={() =>
                      handleHashtagClick(
                        hashtag.name
                      )
                    }
                  >

                    <div>

                      <strong>
                        #{hashtag.name}
                      </strong>

                      <span>
                        {hashtag.usage_count}{" "}
                        {hashtag.usage_count === 1
                          ? "post"
                          : "posts"}
                      </span>

                    </div>

                  </button>

                ))}

              </div>

            </section>

          )}


          {/* ========================= */}
          {/* POSTS */}
          {/* ========================= */}

          {results.posts.length > 0 && (

            <section className="search-results-section">

              <h3>
                Posts
              </h3>

              <div className="search-posts">

                {results.posts.map((post) => (

                  <div
                    key={post.id}
                    className="search-post-wrapper"
                    onClick={() =>
                      handlePostClick(post.id)
                    }
                  >

                    <BlogPost
                      id={post.id}
                      title={post.title}
                      author={post.author.username}
                      date={post.time_since_posted}
                      authorImage={post.authorImage}
                      images={post.media}
                      text={post.content}
                      likes={post.like_count}
                      liked={post.is_liked}
                    />

                  </div>

                ))}

              </div>

            </section>

          )}


          {/* ========================= */}
          {/* NO RESULTS */}
          {/* ========================= */}

          {results.users.length === 0 &&
            results.hashtags.length === 0 &&
            results.posts.length === 0 && (

              <div className="no-search-results">

                <FaSearch />

                <h3>
                  No results found
                </h3>

                <p>
                  We couldn't find anything
                  matching "{query}".
                </p>

              </div>

            )}

        </>

      )}

    </div>
  );
};

export default SearchPage;