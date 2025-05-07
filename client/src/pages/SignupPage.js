//Page for user creation
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import "../styles/global.css";
import "../styles/SignUpPage.css";

const API_URL = process.env.REACT_APP_API_URL;

function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  //Handles users changing input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  //Activated when user hits submit
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { email, password, confirmPassword } = formData;

    // Require umsystem.edu email
    if (!email.toLowerCase().endsWith("@umsystem.edu")) {
      setError("Only @umsystem.edu email addresses are allowed.");
      setLoading(false);
      return;
    }
    //Make sure passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;
      //Send email verification
      await sendEmailVerification(firebaseUser);
      alert(
        "A verification email has been sent. Please verify before logging in."
      );
      setLoading(false);
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to sign up.");
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <h2 className="mb-4 text-center">Create Account</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            UMSystem Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="yourname@umsystem.edu"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password:
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <div className="text-center mt-3">
        <p>
          Already have an account? Login <Link to="/login" className="text-primary">here.</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
