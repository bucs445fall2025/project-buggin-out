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

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    setAvatarPreview(URL.createObjectURL(file));

    // Upload to Cloudinary
    const url = await uploadToCloudinary(file);

    // Save real Cloudinary URL for backend
    storage.setItem("profile.avatarUrl", url);
  };


  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      displayName: storage.getItem("profile.userType"),
      bio: about,
      avatarUrl: storage.getItem("profile.avatarUrl")
    };

    await fetch(`${API_BASE}/api/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setSaved(true);
    navigate("/profile");
  };


  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.secure_url; // This is the usable avatarUrl
  }


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
