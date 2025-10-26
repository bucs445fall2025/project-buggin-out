import { useState } from "react";
import "../styles/SignUp.css";

// If you set VITE_API_BASE in frontend/.env.local it will be used;
// otherwise it will default to http://localhost:3001 (change if your backend is on a different port)
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3001";

export default function SignUp() {
  const [username, setUsername]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // basic validation
    if (!username.trim() || !email.trim() || !password || !confirm) {
      setMessage("Please fill out all fields.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send username as displayName to match the backend
        body: JSON.stringify({ email, password, displayName: username }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");

      // store the JWT so the user is considered logged in
      localStorage.setItem("token", data.token);
      setMessage("Account created! You are now logged in.");
      // optional redirect:
      // window.location.href = "/profile";
    } catch (err) {
      setMessage(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={onSubmit}>
        <h2 className="form-title">Create Account</h2>

        <div className="form-group">
          <label htmlFor="username" className="sr-only">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            name="confirm-password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button className="register-button" type="submit" disabled={loading}>
          {loading ? "Registering…" : "Register"}
        </button>

        {message && (
          <div className="form-message" style={{ marginTop: 12, color: "#333" }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
