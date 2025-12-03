import React, { useState, useEffect } from "react";
import "../styles/Posts.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Post detail modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Likes
  const [likeCounts, setLikeCounts] = useState({});
  const [isLiking, setIsLiking] = useState({});

  // Comments
  const [comments, setComments] = useState([]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const [newComment, setNewComment] = useState("");

  // Load posts
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/posts`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch posts");

        setPosts(data);

        // Initialize like counts
        const likesMap = {};
        data.forEach((p) => {
          likesMap[p.id] = p.likes || 0;
        });
        setLikeCounts(likesMap);
      } catch (err) {
        setError(err.message || "Could not load posts");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Open post modal
  const openPostModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  // Like a post
  const handleLike = async (postId) => {
    if (isLiking[postId]) return;

    setIsLiking((prev) => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error liking post");

      setLikeCounts((prev) => ({
        ...prev,
        [postId]: data.likes,
      }));
    } catch (err) {
      console.error("Like failed:", err);
    } finally {
      setIsLiking((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Load comments for a post
  const openCommentsModal = async (postId) => {
    setIsCommentsModalOpen(true);
    setCommentPostId(postId);
    setNewComment("");

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error loading comments");
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setComments([]);
    }
  };
  const token = localStorage.getItem("token");
  // Post a new comment
  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/posts/${commentPostId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: newComment }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error posting comment");

      setComments((prev) => [...prev, data]);
      setNewComment("");
    } catch (err) {
      console.error("Comment failed:", err);
    }
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

                {/* Like Button */}
                <button
                  className="like-btn"
                  onClick={() => handleLike(post.id)}
                  disabled={isLiking[post.id]}
                >
                  ❤️ {likeCounts[post.id] || 0}
                </button>

                {/* Comments Button */}
                <button
                  className="comment-btn"
                  onClick={() => openCommentsModal(post.id)}
                >
                  💬 Comments
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Details Modal */}
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
              <img src={selectedPost.imageUrl} className="modal-img" />
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

      {/* Comments Modal */}
      {isCommentsModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsCommentsModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setIsCommentsModalOpen(false)}
            >
              ✕
            </button>

            <h2>Comments</h2>

            <div className="comments-list">
              {comments.length === 0 && (
                <p className="no-comments">No comments yet.</p>
              )}

              {comments.map((c) => {
                const userDisplayName =
                  c.user?.profile?.displayName || c.user?.email || "Anonymous";
                const userAvatarUrl = c.user?.profile?.avatarUrl; // Avatar URL is now available

                return (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      {/* Profile Picture/Avatar */}
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={userDisplayName}
                          className="comment-avatar"
                        />
                      ) : (
                        <div className="default-avatar">
                          {userDisplayName.charAt(0)}
                        </div>
                      )}
                      {/* User Display Name */}
                      <span className="comment-user">{userDisplayName}</span>
                    </div>

                    {/* Comment Body */}
                    <p className="comment-body-text">{c.body}</p>

                    {/* Date/Time */}
                    <span className="comment-date">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="comment-input-row">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button onClick={submitComment} className="submit-comment-btn">
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
