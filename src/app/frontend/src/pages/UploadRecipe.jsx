import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import "../styles/UploadRecipe.css";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";

export default function UploadRecipe() {
  const { isLoggedIn } = useAuth();
  const token = localStorage.getItem("token");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", measure: "" }]);
  const [instructions, setInstructions] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ==========================================
     INGREDIENT HANDLERS
  ========================================== */
  const addIngredient = () =>
    setIngredients((prev) => [...prev, { name: "", measure: "" }]);

  const removeIngredient = (idx) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx));

  const updateIngredient = (idx, field, value) =>
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );

  /* ==========================================
     FILE & DRAG/DROP HANDLING
  ========================================== */
  const handleFile = (f) => {
    if (!f) return;

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleChangeFile = (e) => {
    const f = e.target.files?.[0];
    handleFile(f);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  /* ==========================================
     SUBMIT
  ========================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLoggedIn || !token) {
      return setError("You must be logged in to post.");
    }

    if (
      !title.trim() ||
      !category.trim() ||
      !area.trim() ||
      !instructions.trim()
    ) {
      return setError("All fields are required.");
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
      if (!res.ok) throw new Error(created.error || "Failed to create post");

      window.location.href = "/posts";
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="posts-page">
      <div className="feed-shell">
        <div className="feed-left">
          <section className="composer-card">
            <div className="composer-head">
              <div className="composer-title">Upload a Recipe</div>
              <div className="composer-sub">Share your favorite recipe!</div>
            </div>

            <form className="composer-form" onSubmit={handleSubmit}>
              <input
                className="composer-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
              />

              <input
                className="composer-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (e.g., Beef, Dessert)"
              />

              <input
                className="composer-input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area (e.g., Italian, Mexican)"
              />

              {/* INGREDIENTS */}
              <div className="ingredients-section">
                <h4>Ingredients</h4>

                {ingredients.map((ing, i) => (
                  <div className="ingredient-row" key={i}>
                    <input
                      className="composer-input ingredient-input"
                      value={ing.name}
                      onChange={(e) =>
                        updateIngredient(i, "name", e.target.value)
                      }
                      placeholder="Ingredient"
                    />

                    <input
                      className="composer-input ingredient-input"
                      value={ing.measure}
                      onChange={(e) =>
                        updateIngredient(i, "measure", e.target.value)
                      }
                      placeholder="Measure"
                    />

                    <button
                      type="button"
                      className="remove-ingredient"
                      onClick={() => removeIngredient(i)}
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

              {/* INSTRUCTIONS */}
              <textarea
                className="composer-textarea"
                rows={4}
                placeholder="Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />

              {/* FILE UPLOAD + DRAG/DROP */}
              <div className="composer-row">
                <label
                  className={`file-label ${dragActive ? "drag-active" : ""}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleChangeFile}
                    className="file-input"
                  />

                  <span className="file-cta">Upload Image</span>
                  <span className="file-name">
                    {file ? file.name : "No file selected"}
                  </span>
                </label>

                <button
                  className="btn-post"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>

              {/* PREVIEW */}
              {previewUrl && (
                <div className="image-preview-container">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="image-preview"
                    style={{
                      width: "500px",
                      height: "500px",
                      objectFit: "cover",
                      borderRadius: "14px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
                    }}
                  />
                </div>
              )}

              {error && <div className="form-error">{error}</div>}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
