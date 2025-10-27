import React, { useState, useEffect } from "react";
import "../styles/Recipes.css";

// Use the same base URL as your teammate
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to map the detailed API recipe to the simpler card structure
  const mapRecipeToCard = (recipe) => {
    // Accessing fields from your JSON structure
    const rawSummary =
      recipe.summary || "A delicious recipe with rich flavors.";

    return {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      // Strip HTML tags and truncate the summary for the card description
      description: rawSummary.replace(/<[^>]+>/g, "").substring(0, 150) + "...",
      sourceUrl: recipe.sourceUrl,
    };
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      // 1. Construct the target endpoint URL
      // We'll proxy a request for 6 random recipes, including nutrition data
      const number = 6;
      const proxyEndpoint = `${API_BASE}/api/recipes/random?number=${number}&includeNutrition=true`;

      try {
        setIsLoading(true);
        setError(null);

        // 2. Make the API call via the backend proxy
        const res = await fetch(proxyEndpoint);

        // 3. Handle non-OK response (similar to teammate's file)
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to fetch random recipes");

        // The Spoonacular API wraps the recipes in a 'recipes' array
        const apiRecipes = data?.recipes || [];

        // 4. Map the API results to the simplified card structure
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
  }, []); // Run only once on component mount

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

  // Display No Recipes Found if the array is empty after loading
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
            {/* Link the button to the sourceUrl from the API */}
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="view-recipe-button"
            >
              View Recipe
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
