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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { name: "", measure: "" }]);
  const removeIngredient = (idx) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  const updateIngredient = (idx, field, value) =>
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );

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

      // redirect user back to feed
      window.location.href = "/posts";
    } catch (err) {
      setError(err.message);
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
                placeholder="Category"
              />
              <input
                className="composer-input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area"
              />

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

              <textarea
                className="composer-textarea"
                rows={4}
                placeholder="Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />

              <div className="composer-row">
                <label className="file-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0])}
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
