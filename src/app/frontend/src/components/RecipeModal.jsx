import React, { useMemo, useState } from "react";
import "../styles/RecipeModal.css";

export default function RecipeModal({
  isOpen,
  onClose,
  recipe,
  onSaveRecipe,      // <-- same handler you use on the cards
  savedRecipes = [], // <-- array of saved IDs (strings or numbers)
}) {
  if (!isOpen || !recipe) return null;

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Normalize ID comparisons (handles string vs number)
  const isAlreadySaved = useMemo(() => {
    const ids = (savedRecipes || []).map((x) => String(x));
    return ids.includes(String(recipe.id)) || justSaved;
  }, [savedRecipes, recipe.id, justSaved]);

  const handleSaveClick = async () => {
    if (isAlreadySaved || saving) return;
    try {
      setSaving(true);
      // Support async or sync onSaveRecipe
      const maybePromise = onSaveRecipe?.(recipe);
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
      setJustSaved(true);
    } catch (e) {
      console.error("Save from modal failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const ingredients = recipe.ingredients || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="recipe-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
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
              <strong>{item.ingredient || item.name}</strong>
              {(item.measure || item.unit) &&
                ` — ${item.measure || item.unit}`}
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
          onClick={handleSaveClick}
          disabled={isAlreadySaved || saving}
        >
          {isAlreadySaved ? "Saved" : saving ? "Saving…" : "Add Recipe"}
        </button>
      </div>
    </div>
  );
}
