import React, { useState, useEffect } from "react";
import "../styles/Posts.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// Helper function to format date
const formatDate = (dateString) => {
  const options = { month: "short", day: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

// Helper function to get default avatar initial
const getDefaultAvatar = (displayName, email) => {
  const name = displayName || email || "?";
  return name.charAt(0).toUpperCase();
};

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEW STATE: Store the current logged-in user's ID
  const [currentUser, setCurrentUser] = useState(null);

  // Post detail modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Likes & Comments Count State
  const [postActivity, setPostActivity] = useState({});

  // Comments Modal State
  const [comments, setComments] = useState([]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const token = localStorage.getItem("token");

  // Load posts and current user ID
  useEffect(() => {
    const loadUserData = async () => {
      if (!token) return null;
      try {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          // Assuming user.id is the integer ID from Prisma
          return user.id;
        }
      } catch (e) {
        console.error("Failed to fetch current user:", e);
      }
      return null;
    };

    const loadPosts = async (currentUserId) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/posts`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch posts");

        setPosts(data);

        // Initialize activity map (likes, comments, and CORRECT isLiked status)
        const activityMap = {};
        data.forEach((p) => {
          // Check if the current user's ID exists in the post's likes array
          const isLiked = currentUserId
            ? p.likes?.some((like) => like.userId === currentUserId)
            : false;

          activityMap[p.id] = {
            likes: p.likes?.length || 0,
            comments: p.comments?.length || 0,
            isLiked: isLiked, // Correctly initialized status
          };
        });
        setPostActivity(activityMap);
      } catch (err) {
        setError(err.message || "Could not load posts");
      } finally {
        setIsLoading(false);
      }
    };

    // Main execution function
    const load = async () => {
      const userId = await loadUserData();
      setCurrentUser(userId); // Store the user ID
      loadPosts(userId); // Pass ID to loadPosts
    };

    load();
  }, [token]);

  // Open post modal (for viewing details)
  const openPostModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  // Like a post
  const handleLike = async (postId) => {
    if (!currentUser) {
      // User must be logged in to like posts
      return console.warn("User must be logged in to like posts.");
    }

    const isLiking = postActivity[postId]?.isLiking;
    if (isLiking) return;

    // Optimistically update the UI
    const currentlyLiked = postActivity[postId]?.isLiked;
    setPostActivity((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isLiking: true,
        isLiked: !currentlyLiked,
        likes: currentlyLiked ? prev[postId].likes - 1 : prev[postId].likes + 1,
      },
    }));

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // If request fails, revert the optimistic update
        setPostActivity((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isLiked: currentlyLiked,
            likes: currentlyLiked ? prev[postId].likes : prev[postId].likes - 2, // Revert count correctly
          },
        }));
        throw new Error("Error liking post");
      }
    } catch (err) {
      console.error("Like failed:", err);
      // Reverting happens inside the catch block above
    } finally {
      setPostActivity((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLiking: false,
        },
      }));
    }
  };

  // Load comments for a post
  const openCommentsModal = async (postId) => {
    setIsCommentsModalOpen(true);
    setCommentPostId(postId);
    setNewComment("");
    setComments([]); // Clear previous comments

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

  // Post a new comment
  const submitComment = async () => {
    if (!newComment.trim()) return;
    if (!token) return console.error("Authentication required to comment.");

    const commentBody = newComment.trim();
    setNewComment(""); // Clear input immediately

    // Optimistic update: Construct a temporary comment object
    const tempComment = {
      id: Date.now(),
      body: commentBody,
      createdAt: new Date().toISOString(),
      userId: currentUser,
      user: {
        id: currentUser,
        // Placeholder data for optimistic display
        email: "...",
        profile: {
          displayName: "You",
          avatarUrl: null,
        },
      },
    };
    setComments((prev) => [...prev, tempComment]);

    // Update comment count
    setPostActivity((prev) => ({
      ...prev,
      [commentPostId]: {
        ...prev[commentPostId],
        comments: (prev[commentPostId]?.comments || 0) + 1,
      },
    }));

    try {
      const res = await fetch(
        `${API_BASE}/api/posts/${commentPostId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: commentBody }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error posting comment");

      // Replace temporary comment with actual comment data from backend
      setComments((prev) =>
        prev.map((c) => (c.id === tempComment.id ? data : c))
      );
    } catch (err) {
      console.error("Comment failed:", err);
      // Revert optimistic updates on failure
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      setPostActivity((prev) => ({
        ...prev,
        [commentPostId]: {
          ...prev[commentPostId],
          comments: (prev[commentPostId]?.comments || 1) - 1,
        },
      }));
      setNewComment(commentBody); // Restore comment to input
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
          {posts.map((post) => {
            const activity = postActivity[post.id] || {
              likes: 0,
              comments: 0,
              isLiked: false,
            };
            const userDisplayName =
              post.user?.profile?.displayName || post.user?.email;
            const userAvatarUrl = post.user?.profile?.avatarUrl;

            return (
              <div className="post-card" key={post.id}>
                {/* Date Flag */}
                <span className="post-date-flag">
                  {formatDate(post.createdAt)}
                </span>

                {/* Title and Content Snippet */}
                <h3 className="post-title-header">{post.title}</h3>
                <p className="post-snippet-content">
                  {post.content || post.instructions?.slice(0, 50)}...
                </p>

                {/* Post Image */}
                {post.imageUrl && (
                  <div
                    className="post-image-wrapper"
                    onClick={() => openPostModal(post)}
                  >
                    <img
                      src={post.imageUrl}
                      className="post-img"
                      alt={post.title}
                    />
                  </div>
                )}

                {/* Post Footer: User Info and Actions */}
                <div className="post-footer">
                  {/* User Info */}
                  <div className="post-user-info">
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt={userDisplayName}
                        className="post-user-avatar"
                      />
                    ) : (
                      <div className="post-default-avatar">
                        {getDefaultAvatar(userDisplayName, post.user?.email)}
                      </div>
                    )}
                    <span className="post-username">{userDisplayName}</span>
                  </div>

                  {/* Actions/Counts */}
                  <div className="post-actions-counts">
                    {/* Comments Button/Count */}
                    <button
                      className="post-action-btn"
                      onClick={() => openCommentsModal(post.id)}
                    >
                      💬 {activity.comments}
                    </button>

                    {/* Like Button/Count */}
                    <button
                      className={`post-action-btn like-btn ${
                        activity.isLiked ? "liked" : ""
                      }`}
                      onClick={() => handleLike(post.id)}
                      disabled={activity.isLiking || !currentUser}
                    >
                      ❤️ {activity.likes}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Details Modal (Kept simple, as it wasn't the main focus) */}
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
                alt={selectedPost.title}
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

      {/* Comments Modal (Updated to match style) */}
      {isCommentsModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsCommentsModalOpen(false)}
        >
          <div
            className="modal-content comments-modal"
            onClick={(e) => e.stopPropagation()}
          >
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
                const userAvatarUrl = c.user?.profile?.avatarUrl;

                return (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      {/* Avatar */}
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={userDisplayName}
                          className="comment-avatar"
                        />
                      ) : (
                        <div className="default-avatar">
                          {getDefaultAvatar(userDisplayName, c.user?.email)}
                        </div>
                      )}
                      {/* User Display Name */}
                      <span className="comment-user">
                        **{userDisplayName}**
                      </span>
                    </div>

                    {/* Comment Body */}
                    <p className="comment-body-text">{c.body}</p>

                    {/* Date/Time (Moved to the end) */}
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
              <button
                onClick={submitComment}
                className="submit-comment-btn"
                disabled={!newComment.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
