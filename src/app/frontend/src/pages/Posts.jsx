// src/pages/Posts.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../styles/Posts.css";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";

export default function Posts() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // Redirect if not logged in

  // load posts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/posts`); // ensure backend provides this
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load posts");
        setPosts(data);
      } catch (err) {
        console.error("Load posts error:", err);
        setError(err.message || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // handle file input change
  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  // submit new post — uses multipart/form-data so multer can handle file
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");

    if (!isLoggedIn || !token) {
      setError("You must be logged in to post.");
      return;
    }
    if (!content.trim() && !file) {
      setError("Post must have text or an image.");
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();
      form.append("content", content.trim());
      // multer expects the file field name the server uses
      if (file) form.append("image", file);

      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        body: form,
      });

      const created = await res.json();
      if (!res.ok) throw new Error(created?.error || "Failed to create post");

      // The server should return the created post including user and imageUrl fields.
      setPosts((p) => [created, ...p]);
      setContent("");
      setFile(null);
      // reset file input value: will use DOM; find input by id later in markup
      const fileInput = document.getElementById("post-image-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Create post error:", err);
      setError(err.message || "Failed to create post111111");
    } finally {
      setSubmitting(false);
    }
  };

  // optional: handle simple delete (requires backend endpoint /api/posts/:id DELETE)
  const handleDelete = async (postId) => {
    if (!confirm("Delete this post?")) return;
    if (!token) return setError("You must be logged in to delete posts.");
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error || "Failed to delete");
      }
      setPosts((p) => p.filter((x) => x.id !== postId));
    } catch (err) {
      console.error(err);
      setError(err.message || "Delete failed");
    }
  };

  return (
    <div className="posts-page">
      <div className="posts-container">
        <h1 className="posts-title">Feed</h1>

        <form className="post-form" onSubmit={handleSubmit}>
          <textarea
            placeholder="What's cooking? Share a tip, recipe, or photo..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="post-textarea"
            maxLength={2000}
          />

          <div className="post-form-row">
            <label className="file-label">
              <input
                id="post-image-input"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="file-input"
              />
              <span className="file-cta">Choose image</span>
              <span className="file-name">{file ? file.name : "No file selected"}</span>
            </label>

            <button
              className="btn-post"
              type="submit"
              disabled={submitting}
              aria-disabled={submitting}
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>

          {error && <div className="form-error">{error}</div>}
        </form>

        {loading ? (
          <div className="loading">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="empty">No posts yet.</div>
        ) : (
          <div className="posts-feed">
            {posts.map((p) => {
              const authorName =
                p.user?.profile?.displayName || p.user?.email || "Unknown user";
              const created = p.createdAt ? new Date(p.createdAt).toLocaleString() : "";

              return (
                <article className="post-card" key={p.id}>
                  <div className="post-header">
                    <div className="post-author">{authorName}</div>
                    <div className="post-date">{created}</div>
                  </div>

                  {p.imageUrl && (
                    <div className="post-image-wrap">
                      <img src={p.imageUrl} alt={p.content?.slice(0, 50) || "post image"} className="post-image" />
                    </div>
                  )}

                  {p.content && <p className="post-content">{p.content}</p>}

                  <div className="post-actions">
                    {/* If you implement likes/comments endpoints, hook them here */}
                    {/* Example delete button (only show if current user's id matches - server should enforce) */}
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(p.id)}
                      aria-label="Delete post"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
