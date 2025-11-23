import React, { useState, useEffect } from "react";
import "../styles/Recipes.css";
import RecipeModal from "../components/RecipeModal.jsx";
import { useAuth } from "../components/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function RecipesPage() {
  const { isLoggedIn } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // store saved recipe IDs for the *current* user
  const [savedIds, setSavedIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("i");
  const [categories, setCategories] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRandomView, setIsRandomView] = useState(true);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load categories + random cards
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const catRes = await fetch(`${API_BASE}/api/recipes/themealdb/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.map((c) => c.strCategory).sort());
        }

        const res = await fetch(`${API_BASE}/api/recipes/themealdb/random_3`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch random recipes");

        setRecipes(data);
        setIsRandomView(true);
      } catch (err) {
        setError(err.message || "Failed to load random recipes or categories.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // NEW: preload saved IDs for the logged-in user
  useEffect(() => {
    const loadSavedIds = async () => {
      if (!isLoggedIn) {
        setSavedIds([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/recipes/saved/ids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load saved IDs");

        // data is like: [{recipeId: "52772"}, ...]
        setSavedIds(data.map((x) => String(x.recipeId)));
      } catch (e) {
        // don’t toast here; keep the page usable
        console.warn("Could not load saved IDs:", e.message);
      }
    };

    loadSavedIds();
  }, [isLoggedIn]);

  const openRecipeModal = async (mealId) => {
    try {
      const res = await fetch(`${API_BASE}/api/recipes/themealdb/details/${mealId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedRecipe(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error loading details", err);
      alert("Failed to load recipe details.");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;

    setIsSearching(true);
    setError(null);
    setRecipes([]);

    try {
      const searchEndpoint = `${API_BASE}/api/recipes/themealdb/search?query=${searchTerm}&filterType=${filterType}`;
      const res = await fetch(searchEndpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed.");

      setRecipes(data);
      setIsRandomView(false);
    } catch (err) {
      setError(
        err.message ||
          "Failed to perform search. Try underscores for ingredients (e.g., 'chicken_breast')."
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Save recipe for the *current user*
  const handleSaveRecipe = async (recipe) => {
    if (!isLoggedIn) {
      alert("You must be logged in to save recipes.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Missing token. Please log in again.");
      return;
    }
    const payload = { recipeId: String(recipe.id) };

    try {
      const res = await fetch(`${API_BASE}/api/recipes/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save the recipe.");

      // reflect immediately
      setSavedIds((prev) =>
        prev.includes(String(recipe.id)) ? prev : [...prev, String(recipe.id)]
      );
    } catch (err) {
      alert(err.message || "Failed to save the recipe.");
    }
  };

  // Optional: unsave (needs backend route below)
  const handleUnsaveRecipe = async (recipeId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/recipes/unsave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipeId: String(recipeId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to remove recipe.");

      setSavedIds((prev) => prev.filter((id) => id !== String(recipeId)));
    } catch (err) {
      alert(err.message || "Failed to remove recipe.");
    }
  };

  if (isLoading) {
    return (
      <div className="rec-container">
        <div className="recipes-container">Loading your initial random recipes... 🍽️</div>
      </div>
    );
  }

  return (
    <div className="rec-container">
      <h1>Recipes</h1>

      <div className="filter-ui-card">
        <h2>Find Your Next Meal</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <select
              value={filterType}
              onChange={(e) => {
                const newFilterType = e.target.value;
                setFilterType(newFilterType);
                if (newFilterType === "c" && categories.length > 0) {
                  setSearchTerm(categories[0]);
                } else {
                  setSearchTerm("");
                }
              }}
            >
              <option value="i">Filter by Ingredient</option>
              <option value="c">Filter by Category</option>
              <option value="s">Search by Name</option>
            </select>

            {filterType === "c" ? (
              <select
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required
              >
                {categories.length === 0 && (
                  <option value="" disabled>
                    Loading Categories...
                  </option>
                )}
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={`Enter ${
                  filterType === "i" ? "ingredient (e.g., chicken breast)" : "recipe name"
                }`}
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(filterType === "i" ? value.replace(/\s+/g, "_") : value);
                }}
                required
              />
            )}
          </div>

          <button type="submit" disabled={isSearching || !searchTerm}>
            {isSearching ? "Searching..." : "Search Recipes"}
          </button>
        </form>
        {isSearching && <p className="loading-message">Searching for recipes...</p>}
      </div>

      <hr />

      <h2>
        {isRandomView
          ? "Today's Random Picks 🎲"
          : `Search Results for "${searchTerm}" (${recipes.length} found)`}
      </h2>

      {error && <div className="error-message">Error: {error}</div>}

      {recipes.length === 0 && !isSearching ? (
        <div className="no-results">No recipes found. Try a different search term or category.</div>
      ) : (
        <div className="recipes-container">
          {recipes.map((recipe) => {
            const isSaved = savedIds.includes(String(recipe.id));
            return (
              <div key={recipe.id} className="recipe-card">
                <img src={recipe.image} alt={recipe.title} className="recipe-image" />
                <h3>{recipe.title}</h3>
                <p className="mealdb-description">{recipe.description}</p>

                <div className="recipe-actions">
                  <button className="view-recipe-button" onClick={() => openRecipeModal(recipe.id)}>
                    View Details
                  </button>

                  {!isSaved ? (
                    <button className="add-recipe-button" onClick={() => handleSaveRecipe(recipe)}>
                      Add Recipe
                    </button>
                  ) : (
                    <button
                      className="add-recipe-button saved"
                      onClick={() => handleUnsaveRecipe(recipe.id)}
                      title="Remove from saved"
                    >
                      Saved ✓ (remove)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecipeModal
        isOpen={isModalOpen}
        recipe={selectedRecipe}
        onClose={() => setIsModalOpen(false)}
        onSaveRecipe={handleSaveRecipe}
        savedRecipes={savedIds}
      />
    </div>
  );
}
