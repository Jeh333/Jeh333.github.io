import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import "../styles/global.css";
import "../styles/LoginPage.css";

// Choose API_URL (Render) if available, otherwise use BACKEND_URL or localhost
const API_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:5000";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1) Authenticate user with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 2) Block unverified users
      if (!firebaseUser.emailVerified) {
        await auth.signOut();
        throw new Error("Please verify your email before logging in.");
      }

      // 3) Grab the Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // 4) Send token to backend
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to log in.");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);

      alert("Login successful!");
      navigate("/");
    } catch (err) {
      console.error("Login error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

return (
  <>
    <div className="login-page">
      {/* Page header */}
      <h2 className="mb-4 text-center">Login</h2>

      {/* Display error message if login fails */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Login form */}
      <form onSubmit={handleSubmit}>
        {/* Email input field */}
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            UMSystem Email:
          </label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@umsystem.edu"
          />
        </div>

        {/* Password input field */}
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Links to signup and password reset */}
      <div className="text-center mt-3">
        <p className="mt-2">
          Forgot Password? Reset{" "}
          <Link to="/reset-password" className="text-primary">
            here.
          </Link>
        </p>
        <p>
          Don't have an account? Sign up{" "}
          <Link to="/signup" className="text-primary">
            here.
          </Link>
        </p>
      </div>
    </div>

    {/* New content styled like other pages */}
    <div className="container mt-5 text-center">
      <hr className="my-5" />
      <h2 className="mb-3">Why does the page look frozen?</h2>
      <p className="lead mb-5">
        The server may need to start if used infrequently! This can take up to a
        minute.
      </p>
    </div>
  </>
);


}

export default LoginPage;
