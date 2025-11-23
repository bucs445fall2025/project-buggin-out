import { useEffect, useMemo, useState } from "react";
import "../styles/MacroTracker.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function MacroTracker() {
  // saved recipes from DB
  const [saved, setSaved] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savedError, setSavedError] = useState("");

  // search within saved
  const [query, setQuery] = useState("");

  // selection + nutrition
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => saved.find((r) => r.recipeId === selectedId) || null,
    [saved, selectedId]
  );

  const [loadingMacros, setLoadingMacros] = useState(false);
  const [macros, setMacros] = useState(null);
  const [micros, setMicros] = useState(null); // optional if backend provides

  // ------------------------------------------------------------------
  // Load saved recipes for the logged-in user
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadSaved = async () => {
      setLoadingSaved(true);
      setSavedError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSavedError("You must be logged in to view saved recipes.");
          setSaved([]);
          return;
        }

        const res = await fetch(`${API_BASE}/api/recipes/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load saved");

        // Expecting [{ recipeId, title, image, ingredients: [...] }]
        setSaved(Array.isArray(data) ? data : []);
      } catch (err) {
        setSavedError(err.message || "Failed to load saved recipes");
        setSaved([]);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSaved();
  }, []);

  // ------------------------------------------------------------------
  // When selecting a recipe, fetch macros (and micros if available)
  // via backend proxy: /api/recipes/macrosByTitle?title=...
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchMacros = async () => {
      setMacros(null);
      setMicros(null);
      if (!selected) return;

      try {
        setLoadingMacros(true);
        const res = await fetch(
          `${API_BASE}/api/recipes/macrosByTitle?title=${encodeURIComponent(
            selected.title
          )}`
        );
        const data = await res.json();

        if (res.ok && data?.macros) {
          setMacros(data.macros);
          // Optional micros support if the backend sends them:
          // Accept either an array `[ {name, amount, unit}, ... ]`
          // or an object like `{ calories, fiber, sugar, sodium, ... }`
          if (Array.isArray(data.micros)) {
            setMicros(data.micros);
          } else if (data.micros && typeof data.micros === "object") {
            const entries = Object.entries(data.micros)
              .filter(([, v]) => v !== undefined && v !== null)
              .map(([k, v]) => ({
                name: prettyName(k),
                amount: typeof v === "number" ? v : v.amount ?? v.value,
                unit:
                  (typeof v === "object" && (v.unit || v.u)) ||
                  guessUnit(k) ||
                  "",
              }));
            if (entries.length) setMicros(entries);
          }
        }
      } catch (e) {
        // Silently ignore; UI will just show "No macros available"
      } finally {
        setLoadingMacros(false);
      }
    };

    fetchMacros();
  }, [selected]);

  // Filter saved by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return saved;
    return saved.filter((r) => (r.title || "").toLowerCase().includes(q));
  }, [saved, query]);

  const removeLocal = (rid) => {
    setSaved((list) => list.filter((r) => r.recipeId !== rid));
    if (selectedId === rid) setSelectedId(null);
  };

  return (
    <div className="mtkt-container">
      <div className="mtkt-shell">
        {/* LEFT: Saved list + search */}
        <aside className="mtkt-left">
          <h2 className="mtkt-title">Macro Tracker</h2>

          <form
            className="mtkt-search"
            onSubmit={(e) => {
              e.preventDefault();
              // search is client-side; nothing else to do
            }}
          >
            <input
              type="text"
              placeholder="Search saved recipes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>

          {!!savedError && (
            <div className="mtkt-error" style={{ marginTop: ".5rem" }}>
              {savedError}
            </div>
          )}

          <div className="mtkt-subtitle">Saved</div>
          {loadingSaved ? (
            <div className="mtkt-loading">Loading saved…</div>
          ) : (
            <ul className="mtkt-list">
              {filtered.map((r) => (
                <li
                  key={r.recipeId}
                  className={`mtkt-item ${
                    selectedId === r.recipeId ? "active" : ""
                  }`}
                >
                  <button
                    className="mtkt-item-main"
                    onClick={() => setSelectedId(r.recipeId)}
                    title={`Open ${r.title}`}
                  >
                    <img src={r.image} alt="" />
                    <span className="mtkt-item-name">{r.title}</span>
                  </button>
                  <button
                    className="mtkt-remove"
                    onClick={() => removeLocal(r.recipeId)}
                    title="Remove (local view only)"
                  >
                    ✕
                  </button>
                </li>
              ))}

              {!filtered.length && !savedError && (
                <li className="mtkt-empty">
                  No saved recipes match your search.
                </li>
              )}
            </ul>
          )}
        </aside>

        {/* RIGHT: Macros (and optional micros) */}
        <main className="mtkt-right">
          {!selected ? (
            <div className="mtkt-placeholder">
              <p>Select a saved recipe to view its nutrition.</p>
            </div>
          ) : (
            <div className="mtkt-card">
              <div className="mtkt-detail-head">
                <img
                  className="mtkt-detail-img"
                  src={selected.image}
                  alt=""
                />
                <h3 className="mtkt-recipe-name">{selected.title}</h3>
              </div>

              {loadingMacros ? (
                <div className="mtkt-loading">Loading macros…</div>
              ) : macros ? (
                <>
                  <div className="mtkt-macros" style={{ marginTop: ".75rem" }}>
                    <MacroTile label="Protein" value={macros.protein} unit="g" />
                    <MacroTile label="Carbs" value={macros.carbs} unit="g" />
                    <MacroTile label="Fat" value={macros.fat} unit="g" />
                  </div>

                  {/* Micronutrients (optional) */}
                  {Array.isArray(micros) && micros.length > 0 && (
                    <section
                      className="mtkt-results"
                      style={{ marginTop: "1rem" }}
                    >
                      <div className="mtkt-subtitle">Micronutrients</div>
                      <ul className="mtkt-list">
                        {micros.map((m, idx) => (
                          <li
                            key={idx}
                            className="mtkt-item"
                            style={{ gridTemplateColumns: "1fr auto" }}
                          >
                            <span className="mtkt-item-name">{m.name}</span>
                            <span style={{ color: "#444", fontWeight: 700 }}>
                              {formatAmt(m.amount)} {m.unit || ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              ) : (
                <div className="mtkt-note">No macros available.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function MacroTile({ label, value, unit }) {
  return (
    <div className="mtkt-macro-tile">
      <div className="mtkt-macro-label">{label}</div>
      <div className="mtkt-macro-value">
        {formatAmt(value)}
        <span className="mtkt-unit">{unit}</span>
      </div>
    </div>
  );
}

function formatAmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Math.round(Number(v));
}

function prettyName(k) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function guessUnit(k) {
  // crude guesses for nicer display if backend sends plain numbers
  const gramsLike = [
    "fiber",
    "sugar",
    "sugars",
    "saturatedFat",
    "saturated",
    "unsaturatedFat",
    "transFat",
    "alcohol",
  ];
  if (k.toLowerCase() === "calories" || k.toLowerCase() === "energy") return "kcal";
  if (k.toLowerCase() === "sodium" || k.toLowerCase() === "potassium") return "mg";
  if (k.toLowerCase() === "cholesterol") return "mg";
  if (gramsLike.includes(k)) return "g";
  return "";
}
