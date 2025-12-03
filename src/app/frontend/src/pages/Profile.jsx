// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import "../styles/Profile.css";

// 1. IMPORT SweetAlert2 utilities
import { showAlert, showConfirm } from "../util.js";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";
const TABS = ["Saved Recipes", "Posts"];

export default function Profile() {
  const storage = window.sessionStorage;

  // Tabs / modal
  const [active, setActive] = useState(TABS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Profile basics
  const [displayName, setDisplayName] = useState("Login to view");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
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

  // My posts state
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");

  // Modal open/close
  const openModal = () => {
    // Set the modal's editing state to the current profile data
    setProfileDescription(bio);
    setAvatarPreview(avatar);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_CLOUD
      }/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    return data.secure_url;
  }

  // Load display name from backend
  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load profile.");

        const profile = data.profile || {}; // Added safety

        const nameFromProfile = profile.displayName?.trim();
        const fallbackFromEmail =
          (data?.email && String(data.email).split("@")[0]) || null;
        const finalDisplayName = nameFromProfile || fallbackFromEmail || "User";

        setDisplayName(finalDisplayName);

        // Use backend data for bio and avatar, set placeholders if null
        setBio(
          profile.bio ||
            "Bio goes here. Keep it short—what you’re about, goals, or favorite meals."
        );
        setAvatar(profile.avatarUrl || "");

        // Set the edit modal's description state to the current bio
        setProfileDescription(profile.bio || "");

        // Set the edit modal's avatar preview state to the current avatar
        setAvatarPreview(profile.avatarUrl || "");
        // ---------------------------------
      } catch {
        setDisplayName("User");
      }
    };
    run();
  }, []);

  // Load saved recipes
  useEffect(() => {
    const loadSaved = async () => {
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
    loadSaved();
  }, []);

  // Load my posts
  useEffect(() => {
    const loadMine = async () => {
      setLoadingPosts(true);
      setPostsError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMyPosts([]);
          setPostsError("You must be logged in to see your posts.");
          return;
        }
        const res = await fetch(`${API_BASE}/api/posts/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load posts");
        setMyPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        setPostsError(e.message || "Failed to load your posts.");
      } finally {
        setLoadingPosts(false);
      }
    };
    loadMine();
  }, []);

  // ------------------------------------------------------------------
  // 2. UPDATED handleSubmit
  // ------------------------------------------------------------------
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      let uploadedUrl = avatar; // Keep existing avatar if unchanged

      // upload only if user picked a new file
      if (avatarFile) uploadedUrl = await uploadToCloudinary(avatarFile);

      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          bio: profileDescription,
          avatarUrl: uploadedUrl, // send Cloudinary URL to backend
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profile update failed");

      setBio(data.bio);
      setDisplayName(data.displayName);
      setAvatar(data.avatarUrl);

      closeModal();

      // SUCCESS ALERT
      showAlert("Success!", "Your profile has been updated.", "success");
    } catch (err) {
      // ERROR ALERT
      showAlert(
        "Update Failed",
        err.message || "Failed to update profile.",
        "error"
      );
    }
  };

  // avatar picker
  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file); // Store actual file for Cloudinary upload

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result.toString());
    reader.readAsDataURL(file);
  };

  // ------------------------------------------------------------------
  // 3. UPDATED removeSaved (using showConfirm and showAlert)
  // ------------------------------------------------------------------
  const removeSaved = async (recipeId) => {
    const sure = await showConfirm(
      "Remove Recipe?",
      "Remove this recipe from your saved list?"
    );
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
      setSaved((list) =>
        list.filter((r) => String(r.recipeId) !== String(recipeId))
      );
      showAlert(
        "Removed",
        "Recipe successfully removed from saved list.",
        "success"
      );
    } catch (e) {
      showAlert(
        "Error",
        e.message || "Failed to remove saved recipe.",
        "error"
      );
    }
  };

  // ------------------------------------------------------------------
  // 4. UPDATED removePost (using showConfirm and showAlert)
  // ------------------------------------------------------------------
  const removePost = async (postId) => {
    const sure = await showConfirm(
      "Delete Post?",
      "Are you sure you want to permanently delete this post?"
    );
    if (!sure) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Delete failed (HTTP ${res.status})`);
      }
      setMyPosts((list) => list.filter((p) => p.id !== postId));
      showAlert(
        "Deleted",
        "Your post has been successfully deleted.",
        "success"
      );
    } catch (e) {
      showAlert("Error", e.message || "Failed to delete post.", "error");
    }
  };

  // Filter saved list
  const filteredSaved = useMemo(() => {
    const q = savedQuery.trim().toLowerCase();
    if (!q) return saved;
    return saved.filter((r) => (r.title || "").toLowerCase().includes(q));
  }, [saved, savedQuery]);

  // ------- Render helpers -------
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

      {loadingSaved && <div className="pf-note">Loading...</div>}
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
          <article
            key={r.recipeId}
            className="pf-saved-card"
            data-aos="fade-up"
          >
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

  const renderPostsTab = () => (
    <div className="pf-posts-wrap">
      <h3 className="pf-posts-title">Your Posts</h3>

      {loadingPosts && <div className="pf-note">Loading...</div>}
      {!loadingPosts && postsError && (
        <div className="pf-error" role="alert">
          {postsError}
        </div>
      )}
      {!loadingPosts && !postsError && myPosts.length === 0 && (
        <div className="pf-note">You haven’t posted anything yet.</div>
      )}

      <div className="pf-posts-grid">
        {myPosts.map((p) => {
          const created = p.createdAt
            ? new Date(p.createdAt).toLocaleString()
            : "";
          return (
            <article key={p.id} className="pf-post-card">
              {p.imageUrl && (
                <div className="pf-post-imgwrap">
                  <img src={p.imageUrl} alt="" className="pf-post-img" />
                </div>
              )}
              {p.content && <p className="pf-post-text">{p.content}</p>}
              <div className="pf-post-foot">
                <span className="pf-post-date">{created}</span>
                <button
                  className="pf-post-delete"
                  onClick={() => removePost(p.id)}
                  title="Delete post"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="pf-container">
      <div className="pf-shell" data-aos="fade-up">
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
          <div className="pf-bio">Biography: {bio}</div>
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
            {active === "Saved Recipes" ? renderSavedTab() : renderPostsTab()}
          </section>
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Profile</h2>
            <div>
              Username:
              <input
                className="pf-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Username"
              />{" "}
            </div>
            Profile Description:
            <textarea
              className="pf-textarea"
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
              placeholder="Edit your profile description"
            />
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
            <button className="submit-btn" onClick={handleSubmit}>
              Submit
            </button>
            <button className="cancel-btn" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
