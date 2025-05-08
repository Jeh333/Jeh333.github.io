//Page for submitting courses and pdf upload
import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import majors from "../data/majors.json";
import coursePrefixes from "../data/coursePrefixes.json";
import { auth } from "../firebase";
import termsList from "../data/termsList";
import "../styles/global.css";
import "../styles/FormPage.css";
import grades from "../data/grades.json"
import Spinner from "react-bootstrap/Spinner";

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_BACKEND_URL;

function FormPage() {
  const [formData, setFormData] = useState({
    term: "",
    subject: "",
    courseNumber: "",
    grade: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [major, setMajor] = useState("");
  const [majorSaved, setMajorSaved] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [showCoursePopup, setShowCoursePopup] = useState(false);
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [courseSubmitSuccess, setCourseSubmitSuccess] = useState(false);
  const [courseSubmitError, setCourseSubmitError] = useState("");
  
  //Load major from local storage
  useEffect(() => {
    const savedMajor = localStorage.getItem("selectedMajor");
    if (savedMajor) {
      setMajor(savedMajor);
    }
  }, []);
  //Preloaded semesters, prefixes and grades
  const terms = termsList;
  const subjects = coursePrefixes;

  const convertToCode = (fullTerm) => {
    const [season, year] = fullTerm.split(" ");
    const seasonMap = {
      Spring: "SP",
      Summer: "SS",
      Fall: "FS",
    };
    return `${seasonMap[season] || season}${year.slice(-2)}`;
  };
  //Submission for manual courses
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: all fields required
    if (!formData.term || !formData.subject || !formData.courseNumber || !formData.grade) {
      setShowCoursePopup(true);
      setCourseSubmitting(false);
      setCourseSubmitSuccess(false);
      setCourseSubmitError("Please fill out all fields before submitting.");
      return;
    }

    setShowCoursePopup(true);
    setCourseSubmitting(true);
    setCourseSubmitSuccess(false);
    setCourseSubmitError("");

    const newCourse = {
      programId: `${formData.subject} ${formData.courseNumber}`,
      semester: convertToCode(formData.term),
      grade: formData.grade,
    };

    try {
      const idToken = await auth.currentUser.getIdToken();
      //Check for duplicates from course history
      const res = await fetch(`${API_URL}/course-histories`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const histories = await res.json();

      const userHistory = histories.find(
        (h) => h.firebaseUid === auth.currentUser.uid
      );

      const existingCourses = userHistory?.courses || [];
      
      const alreadyExists = existingCourses.some(
        (course) =>
          course.programId === newCourse.programId &&
          course.semester === newCourse.semester
      );

      if (alreadyExists) {
        setCourseSubmitting(false);
        setCourseSubmitError("You've already added this course for that semester.");
        return;
      }
      //Submit new course entry
      const response = await fetch(`${API_URL}/submit-course-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ courses: [newCourse] }),
      });

      const data = await response.json();
      setCourseSubmitting(false);
      if (response.ok) {
        setCourseSubmitSuccess(true);
      } else {
        setCourseSubmitError(data.error || "Failed to submit course.");
      }
    } catch (error) {
      setCourseSubmitting(false);
      setCourseSubmitError("An error occurred while submitting the course.");
    }
  };
  //Handle pdf file selection
  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  //Upload pdf to backend
  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    setShowUploadPopup(true);
    setUploading(true);
    setUploadCount(null);
    setUploadError("");

    try {
      const idToken = await auth.currentUser.getIdToken();
      const fd = new FormData();
      fd.append("pdf", selectedFile);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: fd,
      });

      const data = await response.json();
      setUploading(false);
      if (response.ok) {
        setUploadCount(data.courseCount || 0);
      } else {
        setUploadError(data.error || "Unknown error");
      }
    } catch (error) {
      setUploading(false);
      setUploadError("Could not connect to server.");
    }
  };
  //Update form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  //Save major to backend
  const handleSetMajor = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/set-major`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ major }),
      });

      const data = await res.json();
      if (res.ok) {
        setMajorSaved(true);
      } else {
        console.error("Failed to set major:", data);
        alert("Failed to set major: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error setting major:", err);
      alert("An error occurred while setting the major.");
    }
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center mb-5 formpage-title">
        Submit Your Course History
      </h1>

      {/* Major Selection Section */}
      <hr className="my-5" />
      <h2 className="mb-3">Set Your Major</h2>
      <Form.Group className="mb-3">
        <Form.Label>Select Major</Form.Label>
        <Form.Select
          value={major}
          onChange={(e) => {
            setMajor(e.target.value);
            setMajorSaved(false);
            localStorage.setItem("selectedMajor", e.target.value);
          }}
        >
          <option value="">Select Your Major</option>
          {[...new Set(majors.map((m) => m.name))].map((name) => (
            <option key={name} value={name}>
              {name}
              </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Button
        variant={majorSaved ? "success" : "primary"}
        onClick={handleSetMajor}
        disabled={!major.trim()}
        style={majorSaved ? { backgroundColor: "#28a745", borderColor: "#28a745" } : {}}
      >
        {majorSaved ? "Major Saved!" : "Save Major"}
      </Button>
      <hr className="my-5" />

      {/* PDF Upload Section */}
      <div className="mb-5">
        <h2 className="mb-4">Upload Degree Audit</h2>
        <Form onSubmit={handleFileSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
            <Form.Control
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            disabled={!selectedFile || !major.trim()}
          >
            Upload PDF
          </Button>
        </Form>
      </div>

      {/* Upload Progress/Result Popup */}
      {showUploadPopup && (
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
              padding: "36px 48px 36px 48px",
              maxWidth: "600px",
              minWidth: "400px",
              zIndex: 999,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              textAlign: "center",
              wordBreak: "break-word",
              whiteSpace: "pre-line",
            }}
          >
            <button
              onClick={() => {
                if (!uploading) setShowUploadPopup(false);
              }}
              style={{
                position: "absolute",
                top: "5px",
                right: "8px",
                background: "white",
                border: "none",
                fontSize: "1.2rem",
                cursor: uploading ? "not-allowed" : "pointer",
                color: uploading ? "#ccc" : "#000",
              }}
              disabled={uploading}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>PDF Upload</h3>
            {uploading ? (
              <>
                <Spinner animation="border" role="status" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: "1.1rem", marginTop: 8 }}>
                  Uploading and parsing your courses...
                </div>
              </>
            ) : uploadError ? (
              <>
                <div style={{ color: "#dc3545", marginBottom: 12 }}>
                  Error: {uploadError}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowUploadPopup(false)}
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <div style={{ fontSize: "1.2rem", margin: "16px 0" }}>
                  {uploadCount} classes uploaded!
                </div>
                <Button
                  variant="success"
                  onClick={() => setShowUploadPopup(false)}
                >
                  OK
                </Button>
              </>
            )}
          </div>
        </>
      )}

      <hr className="my-5" />

      {/* Manual Entry Section */}
      <h2 className="mb-4">Enter Course History Manually</h2>
      <Form onSubmit={handleSubmit}>
        <h4 className="mb-3">Select from the Course List</h4>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Term</Form.Label>
              <Form.Select
                name="term"
                value={formData.term}
                onChange={handleChange}
              >
                <option value="">Select Term</option>
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Course Subject</Form.Label>
              <Form.Select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Course Number</Form.Label>
              <Form.Control
                type="text"
                name="courseNumber"
                value={formData.courseNumber}
                onChange={handleChange}
                placeholder="Enter course number"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Grade</Form.Label>
              <Form.Select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
              >
                <option value="">Select Grade</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col className="d-flex justify-content-center gap-3">
            <Button
              variant="primary"
              type="submit"
              size="lg"
              disabled={!major.trim()}
            >
              Submit
            </Button>
            <Button variant="secondary" type="reset" size="lg">
              Reset
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Course Submission Popup */}
      {showCoursePopup && (
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
              padding: "36px 48px 36px 48px",
              maxWidth: "600px",
              minWidth: "400px",
              zIndex: 999,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              textAlign: "center",
              wordBreak: "break-word",
              whiteSpace: "pre-line",
            }}
          >
            <button
              onClick={() => {
                if (!courseSubmitting) setShowCoursePopup(false);
              }}
              style={{
                position: "absolute",
                top: "5px",
                right: "8px",
                background: "white",
                border: "none",
                fontSize: "1.2rem",
                cursor: courseSubmitting ? "not-allowed" : "pointer",
                color: courseSubmitting ? "#ccc" : "#000",
              }}
              disabled={courseSubmitting}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Course Submission</h3>
            {courseSubmitting ? (
              <>
                <Spinner animation="border" role="status" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: "1.1rem", marginTop: 8 }}>
                  Submitting course…
                </div>
              </>
            ) : courseSubmitError ? (
              <>
                <div style={{ color: "#dc3545", marginBottom: 12 }}>
                  {courseSubmitError}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowCoursePopup(false)}
                >
                  Close
                </Button>
              </>
            ) : courseSubmitSuccess ? (
              <>
                <div style={{ fontSize: "1.2rem", margin: "16px 0" }}>
                  Course successfully submitted!
                </div>
                <Button
                  variant="success"
                  onClick={() => setShowCoursePopup(false)}
                >
                  OK
                </Button>
              </>
            ) : null}
          </div>
        </>
      )}
    </Container>
  );
}

export default FormPage;
