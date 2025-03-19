import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Used for navigation after successful signup

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9]+@umsystem\.edu$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear email error when user types
    if (name === "email") {
      setEmailError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate email format
    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid @umsystem.edu email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.email.split("@")[0], // Extract 'pawprint' from email as name
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and userId in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId); // ✅ Store userId

        console.log("Stored userId:", localStorage.getItem("userId")); // Debugging

        alert("Signup successful!");
        navigate("/visualizer"); // Redirect to visualization page
      } else {
        setError(data.error || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h2 className="mb-4">Create Account</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`form-control ${emailError ? "is-invalid" : ""}`}
            value={formData.email}
            onChange={handleChange}
            placeholder="pawprint@umsystem.edu"
            required
          />
          {emailError && <div className="invalid-feedback">{emailError}</div>}
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
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
