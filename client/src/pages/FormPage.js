import React, { useState } from "react";
import axios from "axios";

function FormPage() {
  const [courseInput, setCourseInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get userId and token from localStorage
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      alert("You must be logged in to submit course history.");
      return;
    }

    // Split input into lines, removing empty lines
    const lines = courseInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert("Please enter your course history.");
      return;
    }

    const courses = [];

    for (let i = 0; i < lines.length; i += 6) {
      const course = {
        programId: lines[i] || "",
        description: lines[i + 1] || "",
        semester: lines[i + 2] || "",
        grade: lines[i + 3] || "",
        credits: parseFloat(lines[i + 4]) || 0,
        status: lines[i + 5] || "",
      };

      // Validate course structure
      if (
        !course.programId ||
        !course.description ||
        !course.semester ||
        !course.grade ||
        !course.credits ||
        !course.status
      ) {
        alert(
          `Invalid input format detected. Please ensure all fields are present for each course.`
        );
        return;
      }

      courses.push(course);
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/submit-course-history",
        { userId, courses },
        { headers: { Authorization: `Bearer ${token}` } } // Include JWT token
      );

      alert(response.data.message);
      setCourseInput(""); // Clear form on success
    } catch (error) {
      console.error("Error submitting course history:", error);
      alert(error.response?.data?.error || "Error submitting course history.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Submit Your Course History</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <textarea
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
            rows={20}
            cols={50}
            placeholder={`Paste your course history here (6 lines per course):\nExample:\nANTHRO 1300\nMULTICULTURALISM\n2022 Fall Semester\nA\n3.00\nTaken`}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default FormPage;
