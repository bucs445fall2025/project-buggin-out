// src/pages/Profile.jsx
import { useEffect, useState } from "react";
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

        {/* RIGHT: tabs + content (layout) */}
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
            <div className="pf-content-placeholder">
              <h3>{active}</h3>
              <p>This area will display your {active.toLowerCase()}.</p>
            </div>
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
