// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import "../styles/Profile.css";

const TABS = ["Journey", "Saved Recipes", "Posts"];

export default function Profile() {
  const [active, setActive] = useState(TABS[0]);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    setBio(
      localStorage.getItem("profile.bio") ||
        "Bio goes here. Keep it short—what you’re about, goals, or favorite meals."
    );
    setAvatar(localStorage.getItem("profile.avatarDataUrl") || "");
  }, []);

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
    </div>
  );
}
