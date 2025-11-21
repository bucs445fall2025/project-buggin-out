import React from "react";
import "../styles/RecipeModal.css";

export default function RecipeModal({
  isOpen,
  onClose,
  recipe,
  onSaveRecipe,
  savedRecipes = [],
}) {
  if (!isOpen || !recipe) return null;

  const ingredients = recipe.ingredients || [];
  const isSaved = savedRecipes.includes(recipe.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="recipe-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          X
        </button>

        <h2>{recipe.title}</h2>

        <img src={recipe.image} alt={recipe.title} className="modal-image" />

        <p>
          <strong>Category:</strong> {recipe.category}
        </p>
        <p>
          <strong>Area:</strong> {recipe.area}
        </p>

        {/* INGREDIENT LIST */}
        <h3>Ingredients</h3>
        <ul className="ingredient-list">
          {ingredients.map((item, idx) => (
            <li key={idx}>
              <strong>{item.ingredient}</strong>
              {item.measure && ` — ${item.measure}`}
            </li>
          ))}
        </ul>

        {/* INSTRUCTIONS */}
        <h3>Instructions</h3>
        <p>{recipe.instructions}</p>

        {recipe.youtube && (
          <p>
            <a href={recipe.youtube} target="_blank" rel="noopener noreferrer">
              Watch on YouTube
            </a>
          </p>
        )}
        {/* ADD RECIPE BUTTON */}
        <button
          className="add-recipe-btn"
          onClick={() => onSaveRecipe(recipe)}
          disabled={isSaved}
        >
          {isSaved ? "Saved" : "Add Recipe"}
        </button>
      </div>
    </div>
  );
}
