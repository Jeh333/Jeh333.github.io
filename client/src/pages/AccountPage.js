import React, { useEffect, useState } from "react";
import { auth } from "../firebase"; // only auth from your config
import { onAuthStateChanged } from "firebase/auth"; // onAuthStateChanged from firebase SDK
import axios from "axios";

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_BACKEND_URL;

function AccountPage() {
  const [email, setEmail] = useState("");
  const [major, setMajor] = useState("");
  const [message, setMessage] = useState("");

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

    return () => unsubscribe(); // Clean up listener on unmount
  }, []);

  const fetchUserMajor = async (user) => {
    try {
      const idToken = await user.getIdToken();

      const res = await axios.get(`${API_URL}/get-major`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
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

  const handleChangePassword = async () => {
    try {
      await auth.sendPasswordResetEmail(email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      setMessage("Failed to send password reset email.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h2>My Account</h2>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Email:</strong> {email || "Loading..."}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Major:</strong> {major || "Loading..."}
      </div>

      <button
        onClick={handleChangePassword}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
      >
        Change Password
      </button>

      {message && (
        <div style={{ marginTop: "1rem", color: "green" }}>{message}</div>
      )}
    </div>
  );
}

export default AccountPage;
