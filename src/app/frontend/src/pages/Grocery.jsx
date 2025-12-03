import React, { useEffect, useState, useMemo } from "react";
import "../styles/Grocery.css";

// 1. Import SweetAlert2 utilities
import { showAlert, showConfirm } from "../util.js";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";

export default function Grocery() {
  const [query, setQuery] = useState("");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Load saved recipes for the logged-in user
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
        if (!res.ok)
          throw new Error(data?.error || "Failed to load saved recipes.");
        const list = Array.isArray(data) ? data : [];
        setSavedRecipes(list);
        if (list.length > 0) handleSelect(list[0]); // auto-select first
      } catch (err) {
        setMsg(err.message || "Failed to load saved recipes.");
        // Optional: You could show a generic error alert here too
        // showAlert("Load Error", err.message || "Failed to load saved recipes.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedRecipes;
    return savedRecipes.filter((r) =>
      (r.title || "").toLowerCase().includes(q)
    );
  }, [savedRecipes, query]);

  const handleSelect = (recipe) => {
    setSelectedRecipe(recipe);
    setMsg("");
    // reset checkbox state for this recipe
    const next = {};
    (recipe.ingredients || []).forEach((_, i) => (next[i] = false));
    setCheckedIngredients(next);
  };

  const toggleIngredient = (i) =>
    setCheckedIngredients((prev) => ({ ...prev, [i]: !prev[i] }));

  // Delete a recipe from saved list (same workflow as MacroTracker)
  const removeRecipe = async (rid, originalRecipe) => {
    // Optimistic update: remove locally
    setSavedRecipes((list) => list.filter((r) => r.recipeId !== rid));

    // If the deleted recipe is currently selected, clear selection
    if (selectedRecipe?.recipeId === rid) {
      setSelectedRecipe(null);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // 2. Replace alert() with showAlert() for auth error
        showAlert(
          "Authentication Required",
          "You must be logged in to delete recipes.",
          "warning"
        );
        return;
      }

      const res = await fetch(`${API_BASE}/api/recipes/saved/${rid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete recipe");

      // Optional: Show success alert
      showAlert("Deleted!", `Successfully removed recipe ${rid}.`, "success");
    } catch (err) {
      // 3. Replace alert() with showAlert() for API error
      showAlert(
        "Deletion Failed",
        err.message || "Failed to delete recipe.",
        "error"
      );

      // Restore if something failed
      setSavedRecipes((list) => {
        // use the originalRecipe passed down, or fallback to search
        const recipeToRestore =
          originalRecipe ||
          [...list, selectedRecipe].find((r) => r?.recipeId === rid);

        // Prevent duplicate restoration if the list already contains it
        if (recipeToRestore && !list.some((r) => r.recipeId === rid)) {
          return [...list, recipeToRestore];
        }
        return list;
      });
    }
  };

  const confirmDelete = async (rid) => {
    const originalRecipe = savedRecipes.find((r) => r.recipeId === rid);

    // 4. Replace window.confirm() with showConfirm()
    const isConfirmed = await showConfirm(
      "Confirm Deletion",
      "Are you sure you want to delete this recipe from your saved list? This action cannot be undone."
    );

    if (isConfirmed) {
      // Pass the original recipe object to aid in restoration if API fails
      removeRecipe(rid, originalRecipe);
    }
  };

  return (
    <div className="groc-page">
      <div className="groc-shell" data-aos="fade-up">
        {/* LEFT: Saved list + search (DB-backed only) */}
        <aside className="groc-left" aria-label="Saved recipes">
          <header className="groc-header">
            <h1 className="groc-title">Grocery List</h1>
            <p className="groc-kicker">Your saved recipes, ready to shop.</p>
          </header>

          <form className="groc-search" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved recipes"
              aria-label="Search saved recipes"
            />
            {query && (
              <button
                type="button"
                className="groc-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </form>

          <div className="groc-list" role="list">
            {loading && <div className="groc-note">Loading saved recipes…</div>}

            {!loading && msg && (
              <div className="groc-error" role="alert">
                {msg}
              </div>
            )}

            {!loading && filtered.length === 0 && !msg && (
              <div className="groc-note">No saved recipes found.</div>
            )}

            {!loading &&
              filtered.length > 0 &&
              filtered.map((r) => (
                <div
                  key={r.recipeId}
                  className={`groc-item-row ${
                    selectedRecipe && selectedRecipe.recipeId === r.recipeId
                      ? "active"
                      : ""
                  }`}
                >
                  <button
                    className="groc-item"
                    onClick={() => handleSelect(r)}
                    title={`Open ${r.title}`}
                  >
                    <img
                      className="groc-thumb"
                      src={r.image}
                      alt=""
                      loading="lazy"
                    />
                    <span className="groc-item-name">{r.title}</span>
                  </button>

                  <button
                    className="groc-delete"
                    onClick={() => confirmDelete(r.recipeId)}
                    title="Remove from saved"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </aside>

        {/* RIGHT: Ingredients checklist */}
        <main className="groc-right" aria-live="polite">
          <section className="groc-panel" data-aos="fade-up">
            <div className="groc-panel-head">
              <h2 className="groc-panel-title">
                {selectedRecipe
                  ? `Ingredients for "${selectedRecipe.title}"`
                  : "Ingredients"}
              </h2>
              {selectedRecipe && (
                <span className="groc-chip">
                  {selectedRecipe.ingredients?.length || 0} items
                </span>
              )}
            </div>

            {!selectedRecipe && !loading && !msg && (
              <div className="groc-placeholder">
                Select a saved recipe to view its ingredients.
              </div>
            )}

            {selectedRecipe && (
              <>
                {selectedRecipe.ingredients?.length === 0 && (
                  <div className="groc-note">No ingredients found.</div>
                )}

                {selectedRecipe.ingredients?.length > 0 && (
                  <ul className="groc-ingredients">
                    {selectedRecipe.ingredients.map((ing, i) => {
                      const name = ing.name || ing.ingredient || "";
                      const measure = ing.measure ? ` — ${ing.measure}` : "";
                      return (
                        <li key={i} className="groc-ingredient">
                          <label className="groc-check">
                            <input
                              type="checkbox"
                              checked={checkedIngredients[i] || false}
                              onChange={() => toggleIngredient(i)}
                            />
                            <span
                              className={`groc-check-text ${
                                checkedIngredients[i] ? "done" : ""
                              }`}
                            >
                              {name}
                              <em className="groc-measure">{measure}</em>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
