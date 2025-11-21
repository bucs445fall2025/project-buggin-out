import React from "react";
import "../styles/RecipeModal.css";

export default function RecipeModal({ isOpen, onClose, recipe }) {
  if (!isOpen || !recipe) return null;

  // Ingredients come pre-formatted from backend
  const ingredients = recipe.ingredients || [];

  return (
    <div className="modal-overlay">
      <div className="recipe-modal-content">
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
      </div>
    </div>
  );
}
