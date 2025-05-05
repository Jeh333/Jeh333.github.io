import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import majors from "../data/majors.json";
import coursePrefixes from "../data/coursePrefixes.json";
import { auth } from "../firebase";
import termsList from "../data/termsList";

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

  const convertToCode = (fullTerm) => {
    const [season, year] = fullTerm.split(" ");
    const seasonMap = {
      Spring: "SP",
      Summer: "SS",
      Fall: "FS",
    };
    return `${seasonMap[season] || season}${year.slice(-2)}`;
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [major, setMajor] = useState("");

  useEffect(() => {
    const savedMajor = localStorage.getItem("selectedMajor");
    if (savedMajor) {
      setMajor(savedMajor);
    }
  }, []);

  const terms = termsList;
  const subjects = coursePrefixes;

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
    "IP"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newCourse = {
      programId: `${formData.subject} ${formData.courseNumber}`,
      semester: convertToCode(formData.term),
      grade: formData.grade,
    };

    try {
      const idToken = await auth.currentUser.getIdToken();

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
        alert("You’ve already added this course for that semester.");
        return;
      }

      const response = await fetch(`${API_URL}/submit-course-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ courses: [newCourse] }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Course successfully submitted!");
      } else {
        console.error("Failed response:", data);
        alert("Failed to submit course: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("An error occurred while submitting the course.");
    }
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

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
      if (response.ok) {
        alert("Upload successful! Parsed courses: " + data.courseCount);
      } else {
        console.error("Upload failed:", data);
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to server.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

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
        alert("Major set successfully!");
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
      <h1 className="text-center mb-4" style={{ color: "black" }}>
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
      <Button variant="success" onClick={handleSetMajor}>
        Save Major
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
    </Container>
  );
}

export default FormPage;
