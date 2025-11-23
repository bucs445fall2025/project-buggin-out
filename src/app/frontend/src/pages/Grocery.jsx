import React, { useEffect, useState } from "react";
import "../styles/Grocery.css";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";

export default function Grocery() {
  const [query, setQuery] = useState("");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Load saved recipes from backend
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMsg("You must be logged in to view your grocery list.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/recipes/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load saved");

        setSavedRecipes(Array.isArray(data) ? data : []);
      } catch (err) {
        setMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = savedRecipes.filter((r) =>
    (r.title || "").toLowerCase().includes(query.trim().toLowerCase())
  );

  const handleSelect = (recipe) => {
    setSelectedRecipe(recipe);
    setMsg("");
    // Reset checked state when selecting a new recipe
    const initialChecked = {};
    recipe.ingredients?.forEach((ing, i) => {
      initialChecked[i] = false;
    });
    setCheckedIngredients(initialChecked);
  };

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="grocery-container">
      <div className="grocery-card">
        <h2 className="grocery-title">Your Grocery List (Saved Recipes)</h2>

        <div className="grocery-content">
          {/* LEFT PANEL */}
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
              {loading && <p>Loading saved recipes…</p>}

              {!loading && msg && (
                <p style={{ fontSize: "0.8rem", color: "red" }}>{msg}</p>
              )}

              {!loading && filtered.length === 0 && !msg && (
                <p style={{ fontSize: "0.8rem", color: "#555" }}>
                  No saved recipes found.
                </p>
              )}

              {!loading &&
                filtered.length > 0 &&
                filtered.map((r) => (
                  <div
                    key={r.recipeId}
                    onClick={() => handleSelect(r)}
                    className={`recipe-item ${
                      selectedRecipe && selectedRecipe.recipeId === r.recipeId
                        ? "selected"
                        : ""
                    }`}
                  >
                    {r.title}
                  </div>
                ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="ingredients-panel">
            <h2>
              {selectedRecipe
                ? `Ingredients for "${selectedRecipe.title}"`
                : "Ingredients"}
            </h2>

            {!selectedRecipe && !loading && !msg && (
              <p>Select a recipe to view ingredients</p>
            )}

            {selectedRecipe && (
              <>
                {selectedRecipe.ingredients?.length === 0 && (
                  <p>No ingredients found for this recipe.</p>
                )}

                {selectedRecipe.ingredients?.length > 0 && (
                  <ul>
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checkedIngredients[i] || false}
                            onChange={() => toggleIngredient(i)}
                          />{" "}
                          {ing.name
                            ? `${ing.name}${
                                ing.measure ? ` — ${ing.measure}` : ""
                              }`
                            : `${ing.ingredient}${
                                ing.measure ? ` — ${ing.measure}` : ""
                              }`}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
