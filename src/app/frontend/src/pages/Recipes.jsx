import React, { useState, useEffect } from "react";
import "../styles/Recipes.css";

// Use the same base URL as your teammate
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]); // Track saved recipes

  // Function to map the detailed API recipe to the simpler card structure
  const mapRecipeToCard = (recipe) => {
    const rawSummary =
      recipe.summary || "A delicious recipe with rich flavors.";

    return {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      description: rawSummary.replace(/<[^>]+>/g, "").substring(0, 150) + "...",
      sourceUrl: recipe.sourceUrl,
    };
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      const number = 6;
      const proxyEndpoint = `${API_BASE}/api/recipes/random?number=${number}&includeNutrition=true`;

      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(proxyEndpoint);
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to fetch random recipes");

        const apiRecipes = data?.recipes || [];
        const mappedRecipes = apiRecipes.map(mapRecipeToCard);

        setRecipes(mappedRecipes);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError(err.message || "Failed to load recipes.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Function to handle saving a recipe
  const handleSaveRecipe = async (recipe) => {
    try {
      const res = await fetch(`${API_BASE}/api/recipes/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipe), // Send the recipe data to the backend
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to save the recipe.");
      }

      // Update the saved recipes state
      setSavedRecipes((prev) => [...prev, recipe.id]);
      alert("Recipe saved successfully!");
    } catch (err) {
      console.error("Error saving recipe:", err);
      alert(err.message || "Failed to save the recipe.");
    }
  };

  // Conditional Rendering
  if (isLoading) {
    return (
      <div className="rec-container">
        <div className="recipes-container">Loading random recipes... ⏳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rec-container">
        <div className="recipes-container error-message">Error: {error}</div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="rec-container">
        <div className="recipes-container">No random recipes found.</div>
      </div>
    );
  }

  // Render Recipes
  return (
    <div className="rec-container">
      <h1>Recipes</h1>
      <div className="recipes-container">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-card">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="recipe-image"
            />
            <h3>{recipe.title}</h3>
            <p>{recipe.description}</p>
            <div className="recipe-actions">
              {/* Link to view the recipe */}
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="view-recipe-button"
              >
                View Recipe
              </a>
              {/* Add Recipe Button */}
              <button
                className="add-recipe-button"
                onClick={() => handleSaveRecipe(recipe)}
                disabled={savedRecipes.includes(recipe.id)} // Disable if already saved
              >
                {savedRecipes.includes(recipe.id) ? "Saved" : "Add Recipe"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
