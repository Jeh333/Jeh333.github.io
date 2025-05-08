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

// Helper to rank semesters chronologically
const getSemesterRank = (code) => {
  if (!code) return 0;
  const season = code.slice(0, 2);
  const year = parseInt(code.slice(2), 10);
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;
  let seasonOrder = 0;
  if (season === "SP") seasonOrder = 1;
  else if (season === "SS") seasonOrder = 2;
  else if (season === "FS") seasonOrder = 3;
  else seasonOrder = 0;
  return fullYear * 10 + seasonOrder;
};

const EditPage = () => {
  const [courses, setCourses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [sortSemesterAsc, setSortSemesterAsc] = useState(true);
  const [sortPrefixAsc, setSortPrefixAsc] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

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

    const courseToUpdate = updatedCourses[index];

    // Convert semester to short code
    const convertedSemester = convertToCode(courseToUpdate.semester);

    const res = await fetch(`${API_URL}/edit-course`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        courseId: courseToUpdate._id,
        updatedData: {
          semester: convertedSemester,
          grade: courseToUpdate.grade,
        },
      }),
    });

    if (!res.ok) throw new Error("Failed to save course");

    // Optionally, you could refetch the courses here to refresh state
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
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete course. Please try again.");
    }
  };

  const handleSortBySemester = () => {
    const sorted = [...courses].sort((a, b) => {
      const rankA = getSemesterRank(a.semester);
      const rankB = getSemesterRank(b.semester);
      return sortSemesterAsc ? rankA - rankB : rankB - rankA;
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
            key={`${course._id}_${course.programId}_${course.semester}_${index}`}
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
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    style={{
                      backgroundColor: "#6c757d",
                      color: "#fff",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingIndex(index)}
                    style={{
                      backgroundColor: "#007bff",
                      color: "#fff",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setCourseToDelete(course);
                      setShowDeleteConfirm(true);
                    }}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "#fff",
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && courseToDelete && (
        <>
          {/* Dark Overlay */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 998,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              border: "2px solid black",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "400px",
              zIndex: 999,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setCourseToDelete(null);
              }}
              style={{
                position: "absolute",
                top: "5px",
                right: "8px",
                background: "white",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Confirm Delete</h3>
            <p style={{ marginBottom: "1rem", textAlign: "center" }}>
              Are you sure you want to delete {courseToDelete.programId} from {courseToDelete.semester}?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCourseToDelete(null);
                }}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(courseToDelete._id)}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EditPage;
