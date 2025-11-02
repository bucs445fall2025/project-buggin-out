// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import "../styles/Profile.css";

const TABS = ["Journey", "Saved Recipes", "Posts"];

export default function Profile() {
  const storage = window.sessionStorage;
  const [active, setActive] = useState(TABS[0]);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileDescription, setProfileDescription] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    () => storage.getItem("profile.avatarDataUrl") || ""
  );

  // Open the modal
  const openModal = () => setIsModalOpen(true);

  // Close the modal
  const closeModal = () => setIsModalOpen(false);

  // Handle profile description change
  const handleDescriptionChange = (e) => {
    setProfileDescription(e.target.value);
  };

  // Handle form submission
  const handleSubmit = () => {
    // Save the profile description and avatar (you can add API calls here)
    localStorage.setItem("profile.bio", profileDescription);
    localStorage.setItem("profile.avatarDataUrl", avatarPreview);

    setBio(profileDescription);
    setAvatar(avatarPreview);

    // Close the modal after success
    closeModal();
  };

  useEffect(() => {
    setBio(
      localStorage.getItem("profile.bio") ||
        "Bio goes here. Keep it short—what you’re about, goals, or favorite meals."
    );
    setAvatar(localStorage.getItem("profile.avatarDataUrl") || "");
  }, []);

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
              style={{ objectFit: "cover" }} /* keeps image nicely cropped */
            />
          ) : (
            <div className="pf-avatar" aria-label="User avatar" />
          )}
          <div className="pf-edit" onClick={openModal}>
            Edit Profile
          </div>
          <div className="pf-name">Johnny Chan</div>
          <div className="pf-bio">{bio}</div>
        </aside>

        {/* RIGHT: tab bar + content area (layout-only) */}
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
                onChange={(e) => {
                  onPickImage(e);
                }}
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
