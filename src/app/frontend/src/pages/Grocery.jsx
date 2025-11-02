import React, { useEffect, useState } from "react";
import "../styles/Grocery.css";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";
const SAVED_KEY = "saved-recipes";

export default function Grocery() {
  const [query, setQuery] = useState("");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // load the SAME saved recipes MacroTracker uses
  useEffect(() => {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSavedRecipes(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSavedRecipes([]);
      }
    } else {
      // fallback just so UI isn't empty
      setSavedRecipes([]);
    }
  }, []);

  const filtered = savedRecipes.filter((r) =>
    (r.title || "")
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  const handleSelect = async (recipe) => {
    setSelectedRecipe(recipe);
    setIngredients([]);
    setMsg("");

    if (!recipe?.id) {
      setMsg("This saved recipe has no Spoonacular ID.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/recipes/${recipe.id}/ingredients`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch ingredients");
      setIngredients(data.ingredients || []);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grocery-container">
      <div className="grocery-card">
        <h2 className="grocery-title">Browse ingredients for your saved recipes</h2>
        <div className="grocery-content">
          {/* LEFT SIDE: search + list */}
          <div className="left-panel">
            <div className="input-wrapper">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search saved recipes"
              />
              {query && (
                <button className="clear-btn" onClick={() => setQuery("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="recipe-list">
              {filtered.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#555" }}>
                  No saved recipes found. Save some in Macro Tracker first.
                </p>
              ) : (
                filtered.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className={`recipe-item ${
                      selectedRecipe && selectedRecipe.id === r.id
                        ? "selected"
                        : ""
                    }`}
                  >
                    {r.title}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDE: ingredients */}
          <div className="ingredients-panel">
            <h2>
              {selectedRecipe
                ? `Ingredients for "${selectedRecipe.title}"`
                : "Ingredients"}
            </h2>

            {loading && <p>Loading ingredients…</p>}

            {!loading && msg && <p style={{ color: "red" }}>{msg}</p>}

            {!loading &&
              !msg &&
              selectedRecipe &&
              ingredients.length === 0 && (
                <p>No ingredients returned for this recipe.</p>
              )}

            {!loading && ingredients.length > 0 && (
              <ul>
                {ingredients.map((ing) => (
                  <li key={ing.id || ing.name}>
                    {ing.name}
                    {ing.amount
                      ? ` — ${ing.amount} ${ing.unit || ""}`.trim()
                      : ""}
                  </li>
                ))}
              </ul>
            )}

            {!selectedRecipe && !loading && !msg && (
              <p>Select a recipe to view ingredients</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
