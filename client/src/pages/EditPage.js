//Page for editing and deleting pages
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import termsList from "../data/termsList.json";
import "../styles/global.css";
import "../styles/EditPage.css";
import grades from "../data/grades.json";

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_BACKEND_URL;

//Convert full term to code
const convertToCode = (fullTerm) => {
  const [season, year] = fullTerm.split(" ");
  const seasonMap = {
    Spring: "SP",
    Summer: "SS",
    Fall: "FS",
  };
  return `${seasonMap[season] || season}${year.slice(-2)}`;
};

const EditPage = () => {
  const [courses, setCourses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [sortSemesterAsc, setSortSemesterAsc] = useState(true);
  const [sortPrefixAsc, setSortPrefixAsc] = useState(true);



  //load user course history
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
          const userHistory = data.find((h) => h.firebaseUid === user.uid);
          if (userHistory) {
            setCourses(userHistory.courses || []);
          } else {
            setCourses([]);
          }
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error loading courses:", err);
      }
    };

    fetchCourses();
  }, []);

  //Handle field change
  const handleChange = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  //save updated course
  const handleSave = async (index) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const updatedCourses = [...courses];

      // Convert semester to short code
      updatedCourses[index].semester = convertToCode(
        updatedCourses[index].semester
      );

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

  //delete course by id
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

  const handleSortBySemester = () => {
    const sorted = [...courses].sort((a, b) => {
      const semA = a.semester || "";
      const semB = b.semester || "";
      return sortSemesterAsc ? semA.localeCompare(semB) : semB.localeCompare(semA);
    });
    setCourses(sorted);
    setSortSemesterAsc(!sortSemesterAsc);
  };

  const handleSortByPrefix = () => {
    const sorted = [...courses].sort((a, b) => {
      const prefixA = (a.programId || "").split(" ")[0].toUpperCase();
      const prefixB = (b.programId || "").split(" ")[0].toUpperCase();
      return sortPrefixAsc ? prefixA.localeCompare(prefixB) : prefixB.localeCompare(prefixA);
    });
    setCourses(sorted);
    setSortPrefixAsc(!sortPrefixAsc);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2 className="text-center">Edit Your Courses</h2>

      {/* Sort buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", margin: "1rem 0" }}>
        <button
          onClick={handleSortBySemester}
          style={{
            backgroundColor: "#F1B82D",
            color: "black",
            border: "2px solid black",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "1rem",
            padding: "6px 18px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
          }}          
        >
          Sort by Semester {sortSemesterAsc ? "▲" : "▼"}
        </button>
        <button
          onClick={handleSortByPrefix}
          style={{
            backgroundColor: "#F1B82D",
            color: "black",
            border: "2px solid black",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "1rem",
            padding: "6px 18px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
          }}          
        >
          Sort by Prefix {sortPrefixAsc ? "▲" : "▼"}
        </button>
      </div>

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
                <div>
                  <strong>Course:</strong> {course.programId}
                </div>
                <select
                  value={course.semester || ""}
                  onChange={(e) =>
                    handleChange(index, "semester", e.target.value)
                  }
                >
                  <option value="">Select Semester</option>
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
              </>
            ) : (
              <>
                <div>
                  <strong>Course:</strong> {course.programId}
                </div>
                <div>
                  <strong>Semester:</strong> {course.semester}
                </div>
                <div>
                  <strong>Grade:</strong> {course.grade || "-"}
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
                <>
                  <button
                    onClick={() => handleSave(index)}
                    style={{
                      backgroundColor: "#007bff",
                      color: "#fff",
                      border: "none",
                      padding: "0.5rem",
                      borderRadius: "5px",
                      marginRight: "5px",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    style={{
                      backgroundColor: "#6c757d",
                      color: "#fff",
                      border: "none",
                      padding: "0.5rem",
                      borderRadius: "5px",
                    }}
                  >
                    Cancel
                  </button>
                </>
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
