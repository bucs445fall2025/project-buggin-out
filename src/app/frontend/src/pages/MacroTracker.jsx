import { useEffect, useMemo, useState } from "react";
import "../styles/MacroTracker.css";

// 1. Import SweetAlert2 utilities
import { showAlert, showConfirm } from "../util.js";

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
          // You could use showAlert here, but setting savedError might be better for the UI flow
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
        // Optional: Show a standalone error alert
        // showAlert("Load Error", err.message || "Failed to load saved recipes", "error");
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSaved();
  }, []);

  // ------------------------------------------------------------------
  // When selecting a recipe, fetch macros (and micros if available)
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

  const removeRecipe = async (rid) => {
    // Keep a reference to the recipe we are attempting to delete for restoration
    const recipeToRestore = saved.find((r) => r.recipeId === rid);

    // Optimistically remove the recipe from the local state
    setSaved((list) => list.filter((r) => r.recipeId !== rid));
    if (selectedId === rid) setSelectedId(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // 2. Replace alert() with showAlert() for auth error
        showAlert(
          "Authentication Required",
          "You must be logged in to delete recipes.",
          "warning"
        );
        return;
      }

      const res = await fetch(`${API_BASE}/api/recipes/saved/${rid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to delete the recipe.");
      }

      // Success feedback
      showAlert("Deleted!", `Successfully removed recipe ${rid}.`, "success");
    } catch (err) {
      console.error("Error deleting recipe:", err);
      // 3. Replace alert() with showAlert() for API error
      showAlert(
        "Deletion Failed",
        err.message || "Failed to delete the recipe.",
        "error"
      );

      // Restore the recipe to the local state if the delete fails
      if (recipeToRestore) {
        setSaved((list) => [...list, recipeToRestore]);
        // If the item was selected before failure, re-select it
        if (selectedId === rid) setSelectedId(rid);
      }
    }
  };

  const confirmDelete = async (rid) => {
    // 4. Replace window.confirm() with showConfirm()
    const isConfirmed = await showConfirm(
      "Confirm Deletion",
      "Are you sure you want to delete this recipe? It will be removed from your saved list."
    );

    if (isConfirmed) {
      removeRecipe(rid);
    }
  };

  // ------------------------------------------------------------------
  // NEW: Search submission handler
  // ------------------------------------------------------------------
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      showAlert(
        "Missing Input",
        "Please type something to search your saved recipes.",
        "warning"
      );
      return;
    }
    // Search is client-side, so no further action is required here,
    // as the filtered list updates automatically via the `useMemo` hook.
  };

  return (
    <div className="mtkt-container">
      <div className="mtkt-shell" data-aos="zoom-in-up">
        {/* LEFT: Saved list + search */}
        <aside className="mtkt-left">
          <h2 className="mtkt-title">Macro Tracker</h2>

          <form
            className="mtkt-search"
            // 2. Update onSubmit to use the new handler
            onSubmit={handleSearchSubmit}
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
                    onClick={() => confirmDelete(r.recipeId)}
                    title="Remove from saved"
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
                <img className="mtkt-detail-img" src={selected.image} alt="" />
                <h3 className="mtkt-recipe-name">{selected.title}</h3>
              </div>

              {loadingMacros ? (
                <div className="mtkt-loading">Loading macros…</div>
              ) : macros ? (
                <>
                  <div className="mtkt-macros" style={{ marginTop: ".75rem" }}>
                    <MacroTile
                      label="Protein"
                      value={macros.protein}
                      unit="g"
                    />
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
  if (k.toLowerCase() === "calories" || k.toLowerCase() === "energy")
    return "kcal";
  if (k.toLowerCase() === "sodium" || k.toLowerCase() === "potassium")
    return "mg";
  if (k.toLowerCase() === "cholesterol") return "mg";
  if (gramsLike.includes(k)) return "g";
  return "";
}
