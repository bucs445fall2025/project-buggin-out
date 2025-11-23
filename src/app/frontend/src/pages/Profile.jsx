// src/pages/Profile.jsx
import { useEffect, useState, useMemo } from "react";
import "../styles/Profile.css";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";
const TABS = ["Journey", "Saved Recipes", "Posts"];

export default function Profile() {
  const storage = window.sessionStorage;

  // UI state
  const [active, setActive] = useState(TABS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState("Loading…");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    () => storage.getItem("profile.avatarDataUrl") || ""
  );

  // Saved recipes state
  const [saved, setSaved] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savedError, setSavedError] = useState("");
  const [savedQuery, setSavedQuery] = useState("");

  // Open / close modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Handle description field
  const handleDescriptionChange = (e) => setProfileDescription(e.target.value);

  // Read local bio + avatar on mount
  useEffect(() => {
    setBio(
      localStorage.getItem("profile.bio") ||
        "Bio goes here. Keep it short—what you’re about, goals, or favorite meals."
    );
    setAvatar(localStorage.getItem("profile.avatarDataUrl") || "");
  }, []);

  // Fetch name from backend (/api/me) using JWT
  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setDisplayName("Guest");
          return;
        }
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load profile.");

        const nameFromProfile = data?.profile?.displayName?.trim();
        const fallbackFromEmail =
          (data?.email && String(data.email).split("@")[0]) || null;

        setDisplayName(nameFromProfile || fallbackFromEmail || "User");
      } catch {
        setDisplayName("User");
      }
    };
    run();
  }, []);

  // Load saved recipes for this user
  useEffect(() => {
    const load = async () => {
      setLoadingSaved(true);
      setSavedError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSaved([]);
          setSavedError("You must be logged in to see saved recipes.");
          return;
        }
        const res = await fetch(`${API_BASE}/api/recipes/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load saved");
        setSaved(Array.isArray(data) ? data : []);
      } catch (e) {
        setSavedError(e.message || "Failed to load saved recipes.");
      } finally {
        setLoadingSaved(false);
      }
    };
    load();
  }, []);

  // Save profile (keeps your current local storage behavior)
  const handleSubmit = () => {
    localStorage.setItem("profile.bio", profileDescription);
    localStorage.setItem("profile.avatarDataUrl", avatarPreview);
    setBio(profileDescription);
    setAvatar(avatarPreview);
    closeModal();
  };

  // Avatar picker
  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result.toString());
    reader.readAsDataURL(file);
  };

  // Remove a saved recipe for this user
  const removeSaved = async (recipeId) => {
    const sure = confirm("Remove this recipe from your saved list?");
    if (!sure) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/recipes/saved/${recipeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Delete failed (HTTP ${res.status})`);
      }
      // Optimistically update UI
      setSaved((list) => list.filter((r) => String(r.recipeId) !== String(recipeId)));
    } catch (e) {
      alert(e.message || "Failed to remove saved recipe.");
    }
  };

  // Filter saved list by title
  const filteredSaved = useMemo(() => {
    const q = savedQuery.trim().toLowerCase();
    if (!q) return saved;
    return saved.filter((r) => (r.title || "").toLowerCase().includes(q));
  }, [saved, savedQuery]);

  // ----- Render helpers -----
  const renderSavedTab = () => (
    <div className="pf-saved-wrap">
      <div className="pf-saved-head">
        <h3 className="pf-saved-title">Saved Recipes</h3>
        <input
          className="pf-saved-search"
          type="text"
          placeholder="Search your saved recipes…"
          value={savedQuery}
          onChange={(e) => setSavedQuery(e.target.value)}
          aria-label="Search saved recipes"
        />
      </div>

      {loadingSaved && <div className="pf-note">Loading…</div>}
      {!loadingSaved && savedError && (
        <div className="pf-error" role="alert">
          {savedError}
        </div>
      )}
      {!loadingSaved && !savedError && filteredSaved.length === 0 && (
        <div className="pf-note">You haven’t saved any recipes yet.</div>
      )}

      <div className="pf-saved-grid">
        {filteredSaved.map((r) => (
          <article key={r.recipeId} className="pf-saved-card">
            <img className="pf-saved-img" src={r.image} alt="" />
            <div className="pf-saved-body">
              <div className="pf-saved-name">{r.title}</div>
              <button
                className="pf-saved-remove"
                onClick={() => removeSaved(r.recipeId)}
                title="Remove from saved"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pf-container">
      <div className="pf-shell">
        {/* LEFT: avatar + name + bio */}
        <aside className="pf-left">
          {avatar ? (
            <img
              className="pf-avatar"
              src={avatar}
              alt="User avatar"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="pf-avatar" aria-label="User avatar" />
          )}
          <div className="pf-edit" onClick={openModal}>
            Edit Profile
          </div>
          <div className="pf-name">{displayName}</div>
          <div className="pf-bio">{bio}</div>
        </aside>

        {/* RIGHT: tabs + content */}
        <main className="pf-right">
          <div className="pf-tabs" role="tablist" aria-label="Profile sections">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                className={`pf-tab ${active === t ? "active" : ""}`}
                onClick={() => setActive(t)}
                aria-selected={active === t}
              >
                {t}
              </button>
            ))}
          </div>

          <section className="pf-content" role="tabpanel">
            {active === "Saved Recipes" ? (
              renderSavedTab()
            ) : (
              <div className="pf-content-placeholder">
                <h3>{active}</h3>
                <p>This area will display your {active.toLowerCase()}.</p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Profile</h2>

            {/* Profile Description */}
            <textarea
              className="pf-textarea"
              value={profileDescription}
              onChange={handleDescriptionChange}
              placeholder="Edit your profile description"
            />

            {/* Profile Picture */}
            <div>
              <input
                className="pf-file-input"
                type="file"
                accept="image/*"
                onChange={onPickImage}
              />
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  style={{ width: "100px", height: "100px", marginTop: "10px" }}
                />
              )}
            </div>

            {/* Submit Button */}
            <button onClick={handleSubmit}>Submit</button>

            {/* Close Modal */}
            <button onClick={closeModal} style={{ marginLeft: "10px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
