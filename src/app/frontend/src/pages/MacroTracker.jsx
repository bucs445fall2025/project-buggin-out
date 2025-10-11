// src/pages/MacroTracker.jsx
import { useMemo, useState } from "react";
import "../styles/MacroTracker.css";

// TEMP MOCK DATA (replace later with real saved recipes)
const MOCK_SAVED_RECIPES = [
  { id: 1, name: "Grilled Chicken & Rice", macros: { protein: 42, carbs: 55, fat: 8 } },
  { id: 2, name: "Overnight Oats",         macros: { protein: 18, carbs: 62, fat: 9 } },
  { id: 3, name: "Salmon & Quinoa",        macros: { protein: 38, carbs: 44, fat: 14 } },
  { id: 4, name: "Turkey Chili",           macros: { protein: 32, carbs: 28, fat: 7 } },
  { id: 5, name: "Greek Yogurt Parfait",   macros: { protein: 20, carbs: 35, fat: 5 } },
];

export default function MacroTracker() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_SAVED_RECIPES;
    return MOCK_SAVED_RECIPES.filter(r => r.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="mtkt-container">
      <div className="mtkt-shell">
        {/* LEFT: search + saved recipes list */}
        <aside className="mtkt-left">
          <h2 className="mtkt-title">Macro Tracker</h2>

          <div className="mtkt-search">
            <input
              type="text"
              placeholder="Search your saved recipes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <ul className="mtkt-list">
            {filtered.map((r) => (
              <li
                key={r.id}
                className={`mtkt-item ${selected?.id === r.id ? "active" : ""}`}
                onClick={() => setSelected(r)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" ? setSelected(r) : null)}
                aria-label={`Open macros for ${r.name}`}
              >
                <span className="mtkt-item-name">{r.name}</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="mtkt-empty">No saved recipes match “{query}”.</li>
            )}
          </ul>
        </aside>

        {/* RIGHT: macro detail for the selected recipe */}
        <main className="mtkt-right">
          {!selected ? (
            <div className="mtkt-placeholder">
              <p>Select a recipe on the left to view its macros.</p>
            </div>
          ) : (
            <div className="mtkt-card">
              <h3 className="mtkt-recipe-name">{selected.name}</h3>
              <div className="mtkt-macros">
                <MacroTile label="Protein" value={selected.macros.protein} unit="g" />
                <MacroTile label="Carbs"   value={selected.macros.carbs}   unit="g" />
                <MacroTile label="Fat"     value={selected.macros.fat}     unit="g" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MacroTile({ label, value, unit }) {
  return (
    <div className="mtkt-macro-tile">
      <div className="mtkt-macro-label">{label}</div>
      <div className="mtkt-macro-value">
        {value}
        <span className="mtkt-unit">{unit}</span>
      </div>
    </div>
  );
}
