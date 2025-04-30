import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import termsList from "../data/termsList.json";

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_BACKEND_URL;

const EditPage = () => {
  const [courses, setCourses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const grades = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D+",
    "D",
    "D-",
    "F",
    "W",
    "N/A",
  ];

  const statuses = ["Taken", "Taking", "Transferred"];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (!user) return;

          const idToken = await user.getIdToken();
          const res = await fetch(`${API_URL}/course-histories`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (!res.ok) throw new Error("Failed to load course history");
          const data = await res.json();
          setCourses(data[0]?.courses || []);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error loading courses:", err);
      }
    };

    fetchCourses();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  const handleSave = async (index) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const updatedCourses = [...courses];

      const res = await fetch(`${API_URL}/submit-course-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ courses: updatedCourses }),
      });

      if (!res.ok) throw new Error("Failed to save course history");
      setEditingIndex(null);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const idToken = await auth.currentUser.getIdToken();

      const res = await fetch(`${API_URL}/api/user/courses/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Edit Your Courses</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {courses.map((course, index) => (
          <div
            key={course._id || index}
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              padding: "1rem",
              width: "250px",
              backgroundColor: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {editingIndex === index ? (
              <>
                <input
                  value={course.programId}
                  onChange={(e) =>
                    handleChange(index, "programId", e.target.value)
                  }
                />
                <select
                  value={course.semester}
                  onChange={(e) =>
                    handleChange(index, "semester", e.target.value)
                  }
                >
                  {termsList.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
                <select
                  value={course.grade || ""}
                  onChange={(e) => handleChange(index, "grade", e.target.value)}
                >
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                <select
                  value={course.status || ""}
                  onChange={(e) =>
                    handleChange(index, "status", e.target.value)
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <div>
                  <strong>Program ID:</strong> {course.programId}
                </div>
                <div>
                  <strong>Semester:</strong> {course.semester}
                </div>
                <div>
                  <strong>Grade:</strong> {course.grade || "-"}
                </div>
                <div>
                  <strong>Status:</strong> {course.status || "-"}
                </div>
              </>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "0.5rem",
              }}
            >
              {editingIndex === index ? (
                <button
                  onClick={() => handleSave(index)}
                  style={{
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem",
                    borderRadius: "5px",
                  }}
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setEditingIndex(index)}
                  style={{
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem",
                    borderRadius: "5px",
                  }}
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => handleDelete(course._id)}
                style={{
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem",
                  borderRadius: "5px",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditPage;
