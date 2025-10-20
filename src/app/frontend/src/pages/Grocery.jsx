import React, { useState } from "react";
import "../styles/Grocery.css";


export default function Grocery() {
    const [query, setQuery] = useState("");
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const recipes = [
        { name: "Recipe 1", ingredients: ["Watermelon", "Mango", "Apple"] },
        { name: "Recipe 2", ingredients: ["Rice", "Avocado", "Soy Sauce"] },
        { name: "Recipe 3", ingredients: ["Beef", "Chicken", "Pork"] },
        { name: "Recipe 4", ingredients: ["Noodles", "Water", "Tomato"] },
    ];

    const filtered = recipes.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="grocery-container">
        <div className="grocery-card">
            <h2 className="grocery-title">Browse ingredients for your recipe!</h2>
            <div className="grocery-content">
                <div className="left-panel">
                    <div className="input-wrapper">
                    <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for your recipe"
                    />
                    {query && (
                    <button className="clear-btn" onClick={() => setQuery("")}>
                        ✕
                    </button>
                    )}
                </div>
                <div className="recipe-list">
                    {filtered.map((r) => (
                    <div
                        key={r.name}
                        onClick={() => setSelectedRecipe(r)}
                        className={`recipe-item ${
                        selectedRecipe?.name === r.name ? "selected" : ""
                        }`}
                    >
                        {r.name}
                    </div>
                    ))}
                    </div>
                </div>
                <div className="ingredients-panel">
                    <h2>Ingredients</h2>
                    {selectedRecipe ? (
                        <ul>
                        {selectedRecipe.ingredients.map((i) => (
                            <li key={i}>{i}</li>
                        ))}
                        </ul>
                    ) : (
                        <p>Select a recipe to view ingredients</p>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}
