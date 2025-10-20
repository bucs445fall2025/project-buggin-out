import { useEffect, useMemo, useState } from "react";
import "../styles/MacroTracker.css";

const SAVED_KEY = "saved-recipes"; // [{id,title,image, macros?}]
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function MacroTracker() {
  // search box + results
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  // saved recipes (left column)
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    } catch {
      return [];
    }
  });

  // selected saved recipe to show macros
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => saved.find((r) => r.id === selectedId) || null,
    [saved, selectedId]
  );
  const [loadingMacros, setLoadingMacros] = useState(false);

  // persist saved
  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  // search handler (backend proxy)
  const doSearch = async (e) => {
    e?.preventDefault();
    setError("");
    setSearching(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/recipes/search?query=${encodeURIComponent(query || "pasta")}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setResults(data?.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // add to saved (no duplicates)
  const saveRecipe = (r) => {
    setSaved((list) => {
      if (list.some((x) => x.id === r.id)) return list;
      const entry = {
        id: r.id,
        title: r.title,
        image: r.image,
        // try to seed macros if present from search response
        macros: pickMacrosFromResult(r),
      };
      return [entry, ...list];
    });
  };

  // load macros for selected (cache them on save array)
  const ensureMacros = async (recipeId) => {
    const idx = saved.findIndex((r) => r.id === recipeId);
    if (idx < 0) return;
    if (saved[idx].macros && hasAllMacros(saved[idx].macros)) return; // already cached

    setLoadingMacros(true);
    try {
      const res = await fetch(`${API_BASE}/api/recipes/${recipeId}/macros`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load macros");
      setSaved((list) => {
        const copy = [...list];
        const i = copy.findIndex((r) => r.id === recipeId);
        if (i >= 0) {
          copy[i] = { ...copy[i], macros: data.macros };
        }
        return copy;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMacros(false);
    }
  };

  // when selecting, fetch macros if needed
  useEffect(() => {
    if (selectedId) ensureMacros(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const removeSaved = (id) => {
    setSaved((list) => list.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="mtkt-container">
      <div className="mtkt-shell">
        {/* LEFT: Saved list */}
        <aside className="mtkt-left">
          <h2 className="mtkt-title">Macro Tracker</h2>

          <form className="mtkt-search" onSubmit={doSearch}>
            <input
              type="text"
              placeholder="Find recipes (e.g., chicken pasta)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn" type="submit" disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          {error && <div className="mtkt-error">{error}</div>}

          <div className="mtkt-subtitle">Saved</div>
          <ul className="mtkt-list">
            {saved.map((r) => (
              <li
                key={r.id}
                className={`mtkt-item ${selectedId === r.id ? "active" : ""}`}
              >
                <button
                  className="mtkt-item-main"
                  onClick={() => setSelectedId(r.id)}
                  title={`Open ${r.title}`}
                >
                  <img src={r.image} alt="" />
                  <span className="mtkt-item-name">{r.title}</span>
                </button>
                <button className="mtkt-remove" onClick={() => removeSaved(r.id)} title="Remove">
                  ✕
                </button>
              </li>
            ))}
            {saved.length === 0 && (
              <li className="mtkt-empty">No saved recipes yet. Search on top and click “Save”.</li>
            )}
          </ul>
        </aside>

        {/* RIGHT: details */}
        <main className="mtkt-right">
          {!selected ? (
            <div className="mtkt-placeholder">
              <p>Select a saved recipe to view its macros.</p>
            </div>
          ) : (
            <div className="mtkt-card">
              <div className="mtkt-detail-head">
                <img className="mtkt-detail-img" src={selected.image} alt="" />
                <h3 className="mtkt-recipe-name">{selected.title}</h3>
              </div>

              {loadingMacros ? (
                <div className="mtkt-loading">Loading macros…</div>
              ) : selected.macros && hasAllMacros(selected.macros) ? (
                <div className="mtkt-macros">
                  <MacroTile label="Protein" value={selected.macros.protein} unit="g" />
                  <MacroTile label="Carbs"   value={selected.macros.carbs}   unit="g" />
                  <MacroTile label="Fat"     value={selected.macros.fat}     unit="g" />
                </div>
              ) : (
                <div className="mtkt-note">No macro data yet for this recipe.</div>
              )}
            </div>
          )}

          {/* Search results grid with Save buttons */}
          <section className="mtkt-results">
            <div className="mtkt-subtitle">Results</div>
            {searching && <div className="mtkt-loading">Searching…</div>}
            {!searching && results.length === 0 && (
              <div className="mtkt-note">Try a search to see recipes.</div>
            )}
            <div className="mtkt-grid">
              {results.map((r) => (
                <article key={r.id} className="mtkt-card-sm">
                  <img src={r.image} alt="" />
                  <div className="mtkt-card-sm-body">
                    <div className="mtkt-card-title">{r.title}</div>
                    {renderMacroPillsFromResult(r)}
                    <button
                      className="btn btn-save"
                      onClick={() => saveRecipe(r)}
                      disabled={saved.some((x) => x.id === r.id)}
                      title="Save to Macro Tracker"
                    >
                      {saved.some((x) => x.id === r.id) ? "Saved" : "Save"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
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

// Helpers to read macros from complexSearch (if addRecipeNutrition=true)
function pickMacrosFromResult(r) {
  const n = r?.nutrition?.nutrients || [];
  const get = (name) => Math.round(n.find((x) => x.name === name)?.amount || 0);
  const m = { protein: get("Protein"), carbs: get("Carbohydrates"), fat: get("Fat") };
  return hasAllMacros(m) ? m : null;
}
function hasAllMacros(m) {
  return m && [m.protein, m.carbs, m.fat].every((x) => typeof x === "number");
}
function renderMacroPillsFromResult(r) {
  const m = pickMacrosFromResult(r);
  if (!m) return <div className="mtkt-microtext">No macros in preview</div>;
  return (
    <div className="mtkt-pills">
      <span className="pill">P {m.protein}g</span>
      <span className="pill">C {m.carbs}g</span>
      <span className="pill">F {m.fat}g</span>
    </div>
  );
}
