import React, { useState, useEffect } from "react";
import "../styles/Posts.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Placeholder for future modal, non-breaking
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/posts`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch posts");

        setPosts(data);
      } catch (err) {
        setError(err.message || "Could not load posts");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const openPostModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  return (
    <div className="posts-page">
      <h1>Community Posts</h1>

      {/* Create Post Button */}
      <div className="create-post-header">
        <a href="/upload" className="create-post-btn">
          + Create Recipe Post
        </a>
      </div>

      {/* Loading */}
      {isLoading && <div className="loading">Loading posts…</div>}

      {/* Error */}
      {error && <div className="error-message">Error: {error}</div>}

      {/* No Posts */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="no-results">No posts yet.</div>
      )}

      {/* Posts Grid */}
      {!isLoading && posts.length > 0 && (
        <div className="posts-container">
          {posts.map((post) => (
            <div className="post-card" key={post.id}>
              <h3>{post.title}</h3>

              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  className="post-img"
                  alt={post.title}
                />
              )}

              <p className="post-snippet">
                {post.instructions?.slice(0, 180)}...
              </p>

              <div className="post-actions">
                <button
                  className="view-post-button"
                  onClick={() => openPostModal(post)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple placeholder modal (no extra files needed) */}
      {isModalOpen && selectedPost && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>

            <h2>{selectedPost.title}</h2>

            {selectedPost.imageUrl && (
              <img
                src={selectedPost.imageUrl}
                className="modal-img"
              />
            )}

            {selectedPost.ingredients && (
              <div className="modal-section">
                <h3>Ingredients</h3>
                <ul className="ingredients-list">
                  {selectedPost.ingredients.map((item, idx) => (
                    <li key={idx}>
                      {item.measure} {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-section">
              <h3>Instructions</h3>
              <p className="modal-body">{selectedPost.instructions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
