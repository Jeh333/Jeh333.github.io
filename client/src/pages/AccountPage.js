import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import "../styles/global.css";
import "../styles/AccountPage.css";

// Determine backend API URL based on environment (production or development)
const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_BACKEND_URL;

// Define the AccountPage component
function AccountPage() {
  // Local state to store user's email, major, and status message
  const [email, setEmail] = useState("");
  const [major, setMajor] = useState("");
  const [message, setMessage] = useState("");

  // useEffect runs on mount to subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email);
        fetchUserMajor(user);
      } else {
        setEmail("");
        setMajor("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Function to retrieve user's major from backend API
  const fetchUserMajor = async (user) => {
    try {
      const idToken = await user.getIdToken();
      const res = await axios.get(`${API_URL}/get-major`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.data && res.data.major) {
        setMajor(res.data.major);
      } else {
        setMajor("No major set yet");
      }
    } catch (err) {
      console.error("Error fetching major:", err);
      setMajor("Unable to load major"); 
    }
  };

  // Function to send password reset email via Firebase
  const handleChangePassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      setMessage("Failed to send password reset email.");
    }
  };

  // Render account page UI
  return (
    <div className="account-page">
      <h2>My Account</h2>

      <div className="account-section">
        <strong>Email:</strong> {email || "Loading..."}
      </div>

      <div className="account-section">
        <strong>Major:</strong> {major || "Loading..."}
      </div>

      <button onClick={handleChangePassword} className="account-button">
        Change Password
      </button>

      {message && <div className="account-message">{message}</div>}
    </div>
  );
}

export default AccountPage;
