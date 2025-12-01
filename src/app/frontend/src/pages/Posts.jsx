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

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", measure: "" }]);
  const [instructions, setInstructions] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  // UI state
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const token = localStorage.getItem("token");

  const getInitials = (nameOrEmail = "") => {
    const base = String(nameOrEmail || "")
      .replace(/@.*/, "")
      .trim();
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

  // Add a new ingredient
  const addIngredient = () => {
    setIngredients((prev) => [...prev, { name: "", measure: "" }]);
  };

  // Remove an ingredient
  const removeIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Update an ingredient
  const updateIngredient = (index, field, value) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  // Create a post
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");

    if (!isLoggedIn || !token) {
      setError("You must be logged in to post.");
      return;
    }
    if (
      !title.trim() ||
      !category.trim() ||
      !area.trim() ||
      !instructions.trim()
    ) {
      setError("All fields are required.");
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();
      form.append("title", title.trim());
      form.append("category", category.trim());
      form.append("area", area.trim());
      form.append("instructions", instructions.trim());
      form.append("ingredients", JSON.stringify(ingredients));
      form.append("content", content.trim());
      if (file) form.append("image", file);

      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const created = await res.json();
      if (!res.ok) throw new Error(created?.error || "Failed to create post");

      setPosts((p) => [created, ...p]);
      setTitle("");
      setCategory("");
      setArea("");
      setIngredients([{ name: "", measure: "" }]);
      setInstructions("");
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

  return (
    <div className="posts-page">
      <div className="feed-shell">
        <div className="feed-left">
          <section className="composer-card">
            <div className="composer-head">
              <div className="composer-title">Create a Recipe</div>
              <div className="composer-sub">Share your favorite recipe!</div>
            </div>

            <form className="composer-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="composer-input"
              />
              <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="composer-input"
              />
              <input
                type="text"
                placeholder="Area (e.g., Italian, Mexican)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="composer-input"
              />

              <div className="ingredients-section">
                <h4>Ingredients</h4>
                {ingredients.map((ing, index) => (
                  <div key={index} className="ingredient-row">
                    <input
                      type="text"
                      placeholder="Ingredient"
                      value={ing.name}
                      onChange={(e) =>
                        updateIngredient(index, "name", e.target.value)
                      }
                      className="composer-input ingredient-input"
                    />
                    <input
                      type="text"
                      placeholder="Measure"
                      value={ing.measure}
                      onChange={(e) =>
                        updateIngredient(index, "measure", e.target.value)
                      }
                      className="composer-input ingredient-input"
                    />
                    <button
                      type="button"
                      className="remove-ingredient"
                      onClick={() => removeIngredient(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-ingredient"
                  onClick={addIngredient}
                >
                  + Add Ingredient
                </button>
              </div>

              <textarea
                placeholder="Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="composer-textarea"
                rows={4}
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
        </div>
      </div>
    </div>
  );
}
