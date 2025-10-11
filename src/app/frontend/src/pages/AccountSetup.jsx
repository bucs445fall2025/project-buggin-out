import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AccountSetup.css";

export default function AccountSetup() {
  const storage = window.sessionStorage;
  const [userType, setUserType] = useState(null); // "Student" | "Personal" | null (layout only)
  const [about, setAbout] = useState(() => storage.getItem("profile.bio") || "");
  const [avatarPreview, setAvatarPreview] = useState(
    () => storage.getItem("profile.avatarDataUrl") || ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result.toString());
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    // Persist to storage for now (backend later)
    storage.setItem("profile.bio", about.trim());
    if (avatarPreview) storage.setItem("profile.avatarDataUrl", avatarPreview);
    if (userType) storage.setItem("profile.userType", userType);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      // Optional: take user to Profile after save
      navigate("/profile");
    }, 350);
  };

  return (
    <div className="asu-container">
      <form className="asu-card" onSubmit={onSubmit}>
        <h2 className="asu-title">Set Up Your Profile</h2>

        <div className="asu-section">
          <div className="asu-label">What Kind of User Are You?</div>
          <div className="asu-pill-row">
            <button
              type="button"
              className={`asu-pill ${userType === "Student" ? "active" : ""}`}
              onClick={() => setUserType("Student")}
            >
              Student
            </button>
            <button
              type="button"
              className={`asu-pill ${userType === "Personal" ? "active" : ""}`}
              onClick={() => setUserType("Personal")}
            >
              Personal
            </button>
          </div>
        </div>

        <div className="asu-section">
          <div className="asu-label">Add an About Me</div>
          <textarea
            className="asu-textarea"
            placeholder="Write a short bio that will show on your profile…"
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
        </div>

        <div className="asu-section">
          <div className="asu-label">Add a Profile Picture</div>
          <div className="asu-uploader">
            {avatarPreview ? (
              <img className="asu-avatar-preview" src={avatarPreview} alt="Profile preview" />
            ) : (
              <div className="asu-avatar-placeholder" />
            )}
            <label className="asu-file-btn">
              Choose Image
              <input type="file" accept="image/*" onChange={onPickImage} hidden />
            </label>
          </div>
        </div>

        <button className="asu-submit" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Submit"}
        </button>

        {saved && <div className="asu-saved">Saved! Redirecting…</div>}
      </form>
    </div>
  );
}
