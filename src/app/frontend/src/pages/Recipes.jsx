import React, { useState, useEffect } from "react";
import "../styles/Recipes.css";
// import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);

  // --- New Filter UI State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("i"); // 'i', 'c', or 's'
  const [categories, setCategories] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRandomView, setIsRandomView] = useState(true);

  // 1. Initial Fetch: Get Categories and 3 Random Recipes
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch categories
        const catRes = await fetch(
          `${API_BASE}/api/recipes/themealdb/categories`
        );
        let categoryNames = [];
        if (catRes.ok) {
          const catData = await catRes.json();
          categoryNames = catData.map((c) => c.strCategory).sort();
          setCategories(categoryNames);
        }

        // Fetch 3 random meals
        const randomEndpoint = `${API_BASE}/api/recipes/themealdb/random_3`;
        const res = await fetch(randomEndpoint);
        const data = await res.json();

        if (!res.ok)
          throw new Error(data?.error || "Failed to fetch random recipes");

        setRecipes(data);
        setIsRandomView(true);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError(err.message || "Failed to load random recipes or categories.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Filter/Search Submission Handler
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
      console.error("Error searching recipes:", err);
      setError(
        err.message ||
          "Failed to perform search. Try using an underscore for ingredients (e.g., 'chicken_breast')."
      );
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Save Recipe Handler (re-used logic)
  const handleSaveRecipe = async (recipe) => {
    const payload = { recipeId: recipe.id };

    try {
      // NOTE: You must replace YOUR_JWT_TOKEN with the actual token
      // e.g., const token = localStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/api/recipes/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to save the recipe.");
      }

      setSavedRecipes((prev) => [...prev, recipe.id]);
      alert("Recipe saved successfully!");
    } catch (err) {
      console.error("Error saving recipe:", err);
      alert(
        err.message ||
          "Failed to save the recipe. (Auth Token required to save)"
      );
    }
  };

  // --- Conditional Rendering and JSX remains the same ---
  if (isLoading) {
    return (
      <div className="rec-container">
        <div className="recipes-container">
          Loading your initial random recipes... 🍽️
        </div>
      </div>
    );
  }

  return (
    <div className="rec-container">
      <h1>Recipes</h1>

      {/* --- FILTER UI SECTION --- */}
      <div className="filter-ui-card">
        <h2>Find Your Next Meal</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            {/* Filter Type Dropdown */}
            <select
              value={filterType}
              onChange={(e) => {
                const newFilterType = e.target.value;
                setFilterType(newFilterType);

                // --- FIX APPLIED HERE ---
                if (newFilterType === "c" && categories.length > 0) {
                  // Initialize category search term to the first category
                  setSearchTerm(categories[0]);
                } else {
                  setSearchTerm(""); // Reset for ingredient/name search
                }
              }}
            >
              <option value="i">Filter by Ingredient</option>
              <option value="c">Filter by Category</option>
              <option value="s">Search by Name</option>
            </select>

            {/* Search Input / Category Dropdown (Conditional Rendering) */}
            {filterType === "c" ? (
              <select
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required
              >
                {/* Only add placeholder if no categories are loaded */}
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
                  filterType === "i"
                    ? "ingredient (e.g., chicken breast)"
                    : "recipe name"
                }`}
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  // Automatically replace spaces with underscores for ingredients
                  setSearchTerm(
                    filterType === "i" ? value.replace(/\s+/g, "_") : value
                  );
                }}
                required
              />
            )}
          </div>

          <button type="submit" disabled={isSearching || !searchTerm}>
            {isSearching ? "Searching..." : "Search Recipes"}
          </button>
        </form>
        {isSearching && (
          <p className="loading-message">Searching for recipes...</p>
        )}
      </div>
      {/* --------------------------- */}

      <hr />

      {/* --- RECIPE RESULTS SECTION --- */}
      <h2>
        {isRandomView
          ? "Today's Random Picks 🎲"
          : `Search Results for "${searchTerm}" (${recipes.length} found)`}
      </h2>

      {error && <div className="error-message">Error: {error}</div>}

      {recipes.length === 0 && !isSearching ? (
        <div className="no-results">
          No recipes found. Try a different search term or category.
        </div>
      ) : (
        <div className="recipes-container">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="recipe-image"
              />
              <h3>{recipe.title}</h3>
              <p className="mealdb-description">{recipe.description}</p>
              <div className="recipe-actions">
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-recipe-button"
                >
                  View Details
                </a>
                <button
                  className="add-recipe-button"
                  onClick={() => handleSaveRecipe(recipe)}
                  disabled={savedRecipes.includes(recipe.id)}
                >
                  {savedRecipes.includes(recipe.id) ? "Saved" : "Add Recipe"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
