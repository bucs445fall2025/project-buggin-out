// src/pages/Posts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/AuthContext";
import "../styles/Posts.css";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";

export default function Posts() {
  const { isLoggedIn } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [me, setMe] = useState(null); // { id, email, ... } for like detection

  // form state
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  // UI state
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const token = localStorage.getItem("token");

  const getInitials = (nameOrEmail = "") => {
    const base = String(nameOrEmail || "").replace(/@.*/, "").trim();
    const parts = base.split(/[.\s_]+/).filter(Boolean);
    if (parts.length === 0) return base.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const timeAgo = (iso) => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    const now = Date.now();
    const s = Math.max(1, Math.floor((now - then) / 1000));
    const intervals = [
      ["y", 31536000],
      ["mo", 2592000],
      ["w", 604800],
      ["d", 86400],
      ["h", 3600],
      ["m", 60],
      ["s", 1],
    ];
    for (const [label, sec] of intervals) {
      const v = Math.floor(s / sec);
      if (v >= 1) return `${v}${label}`;
    }
    return "now";
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Load "me" (so we can tell if I liked a post)
  useEffect(() => {
    const loadMe = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setMe(data);
      } catch {
        // ignore
      }
    };
    loadMe();
  }, [token]);

  // Load posts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/posts`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load posts");
        setPosts(data);
      } catch (err) {
        setError(err.message || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onFileChange = (e) => setFile(e.target.files?.[0] || null);

  // Create a post
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
      if (file) form.append("image", file);

      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const created = await res.json();
      if (!res.ok) throw new Error(created?.error || "Failed to create post");

      // Ensure likes array is present for new post
      const normalized = { ...created, likes: created.likes || [] };

      setPosts((p) => [normalized, ...p]);
      setContent("");
      setFile(null);
      const fileInput = document.getElementById("post-image-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

    // Like/unlike toggle with optimistic UI then authoritative reconcile
  const toggleLike = async (postId) => {
    if (!isLoggedIn || !token || !me?.id) {
      setError("You must be logged in to like posts.");
      return;
    }

    // optimistic flip
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasLiked = (p.likes || []).some((lk) => lk.userId === me.id);
        return hasLiked
          ? { ...p, likes: (p.likes || []).filter((lk) => lk.userId !== me.id) }
          : { ...p, likes: [...(p.likes || []), { userId: me.id, postId }] };
      })
    );

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to toggle like");

      // Authoritative reconcile — replace likes with what the server returns
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: Array.isArray(data.likes) ? data.likes : [] } : p
        )
      );
    } catch (err) {
      // revert optimistic if server failed
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const hasLiked = (p.likes || []).some((lk) => lk.userId === me.id);
          // We don't know the true server state, so just invert back
          return hasLiked
            ? { ...p, likes: (p.likes || []).filter((lk) => lk.userId !== me.id) }
            : { ...p, likes: [...(p.likes || []), { userId: me.id, postId }] };
        })
      );
      setError(err.message || "Failed to toggle like");
    }
  };


  const skeletons = useMemo(() => Array.from({ length: 4 }), []);

  return (
    <div className="posts-page">
      <div className="feed-shell">
        <div className="feed-left">
          <section className="composer-card">
            <div className="composer-head">
              <div className="composer-title">Create a post</div>
              <div className="composer-sub">What’s cooking today?</div>
            </div>

            <form className="composer-form" onSubmit={handleSubmit}>
              <textarea
                placeholder="Write a caption, tip, or quick update..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="composer-textarea"
                maxLength={2000}
              />
              <div className="composer-row">
                <label className="file-label">
                  <input
                    id="post-image-input"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="file-input"
                  />
                  <span className="file-cta">Upload image</span>
                  <span className="file-name">
                    {file ? file.name : "No file selected"}
                  </span>
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
          </section>

          {loading ? (
            <div className="feed-list">
              {skeletons.map((_, i) => (
                <article className="post-card skeleton" key={i}>
                  <div className="post-header">
                    <div className="avatar skeleton-box" />
                    <div className="ph-lines">
                      <div className="ph-line skeleton-box" />
                      <div className="ph-line short skeleton-box" />
                    </div>
                  </div>
                  <div className="post-image-wrap skeleton-box" />
                  <div className="post-content skeleton-box" />
                </article>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="empty">No posts yet.</div>
          ) : (
            <div className="feed-list">
              {posts.map((p) => {
                const authorName =
                  p.user?.profile?.displayName || p.user?.email || "Unknown user";
                const initials = getInitials(
                  p.user?.profile?.displayName || p.user?.email || "U"
                );
                const created = p.createdAt ? timeAgo(p.createdAt) : "";
                const likeCount = Array.isArray(p.likes) ? p.likes.length : 0;
                const iLiked = me?.id
                  ? (p.likes || []).some((lk) => lk.userId === me.id)
                  : false;
                const isExpanded = expandedIds.has(p.id);
                const text = p.content || "";

                return (
                  <article className="post-card" key={p.id}>
                    <header className="post-header">
                      <div className="post-header-left">
                        <div className="avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div className="post-meta">
                          <div className="post-author">{authorName}</div>
                          <div className="post-date">{created}</div>
                        </div>
                      </div>
                    </header>

                    {p.imageUrl && (
                      <div className="post-image-wrap">
                        <img
                          src={p.imageUrl}
                          alt={text.slice(0, 80) || "post image"}
                          className="post-image"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="post-actions">
                      <button
                        className={`act-btn ${iLiked ? "liked" : ""}`}
                        type="button"
                        aria-label={iLiked ? "Unlike" : "Like"}
                        onClick={() => toggleLike(p.id)}
                      >
                        <span className="act-icon" aria-hidden="true">
                          {iLiked ? "❤" : "♡"}
                        </span>
                        <span className="act-label">
                          {likeCount > 0 ? likeCount : "Like"}
                        </span>
                      </button>
                    </div>

                    {text && (
                      <div className="post-caption">
                        <p className={`caption-text ${isExpanded ? "expanded" : ""}`}>
                          {text}
                        </p>
                        {text.length > 220 && (
                          <button
                            type="button"
                            className="caption-toggle"
                            onClick={() => toggleExpand(p.id)}
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
