import React, { useEffect, useState } from "react";
import coursePrefixes from "../data/coursePrefixes.json";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Form, Button } from "react-bootstrap";
import majors from "../data/majors.json";
import { auth } from "../firebase";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const COURSE_PREFIXES = coursePrefixes;

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_BACKEND_URL;

function Statistics() {
  const [major, setMajor] = useState("");
  const [availableMajors, setAvailableMajors] = useState([]);
  const [semesterData, setSemesterData] = useState({});
  const [statType, setStatType] = useState("distribution");
  const [selectedPrefixes, setSelectedPrefixes] = useState([]);
  const [showPrefixFilter, setShowPrefixFilter] = useState(false);

  useEffect(() => {
    setAvailableMajors(majors.map((m) => m.name));
  }, []);

  const handleSubmit = async () => {
    if (!major) return;

    try {
      const idToken = await auth.currentUser.getIdToken(); // 🔐 Secure token

      const res = await fetch(
        `${API_URL}/statistics/${major}?type=${statType}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const text = await res.text(); // defensive parsing
      const data = JSON.parse(text);
      setSemesterData(data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  return (
    <div className="container mt-5 text-center">
      <h1>Statistics by Major</h1>

      <Form.Select
        className="my-4 w-50 mx-auto"
        value={major}
        onChange={(e) => setMajor(e.target.value)}
      >
        <option value="">Select a Major</option>
        {availableMajors.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Form.Select>

      <Form.Select
        className="my-4 w-50 mx-auto"
        value={statType}
        onChange={(e) => setStatType(e.target.value)}
      >
        <option value="distribution">Course Distribution by Semester</option>
        <option value="grades">Grade Distribution by Course</option>
      </Form.Select>

      <Form.Check
        type="checkbox"
        label="Filter by Course Prefix"
        className="mb-2 text-start w-50 mx-auto"
        checked={showPrefixFilter}
        onChange={(e) => setShowPrefixFilter(e.target.checked)}
      />

      {showPrefixFilter && (
        <Form.Group className="mb-3 text-start w-50 mx-auto">
          <Form.Label>Filter by Course Prefix</Form.Label>
          <div
            style={{
              maxHeight: "200px",
              overflowY: "scroll",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            {COURSE_PREFIXES.map((prefix) => (
              <Form.Check
                key={prefix}
                type="checkbox"
                label={prefix}
                checked={selectedPrefixes.includes(prefix)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...selectedPrefixes, prefix]
                    : selectedPrefixes.filter((p) => p !== prefix);
                  setSelectedPrefixes(updated);
                }}
              />
            ))}
          </div>
        </Form.Group>
      )}

      <Button variant="primary" onClick={handleSubmit} className="mb-4">
        Submit
      </Button>

      {statType === "distribution"
        ? Object.entries(semesterData).map(([semester, courseCounts]) => {
            const filteredEntries = Object.entries(courseCounts).filter(
              ([id]) => {
                const prefix = id
                  .substring(0, id.lastIndexOf(" "))
                  .replace(/[_ ]/g, "")
                  .toUpperCase();
                const normalized = selectedPrefixes.map((p) =>
                  p.replace(/[_ ]/g, "").toUpperCase()
                );
                return (
                  selectedPrefixes.length === 0 || normalized.includes(prefix)
                );
              }
            );

            if (filteredEntries.length === 0) return null;

            const labels = filteredEntries.map(([id]) => id);
            const values = filteredEntries.map(([, val]) => val);

            return (
              <div key={semester} className="mb-5">
                <h4>{semester}</h4>
                <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                  <Bar
                    data={{
                      labels,
                      datasets: [{ data: values, backgroundColor: "#36A2EB" }],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { title: { display: true, text: "Course" } },
                        y: {
                          title: {
                            display: true,
                            text: "Percentage of Students",
                          },
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            );
          })
        : Object.entries(semesterData)
            .filter(([courseId]) => {
              const prefix = courseId
                .substring(0, courseId.lastIndexOf(" "))
                .replace(/[_ ]/g, "")
                .toUpperCase();
              const normalized = selectedPrefixes.map((p) =>
                p.replace(/[_ ]/g, "").toUpperCase()
              );
              return (
                selectedPrefixes.length === 0 || normalized.includes(prefix)
              );
            })
            .map(([courseId, gradeCounts]) => {
              const labels = Object.keys(gradeCounts);
              const values = Object.values(gradeCounts);

              return (
                <div key={courseId} className="mb-5">
                  <h4>{courseId}</h4>
                  <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <Bar
                      data={{
                        labels,
                        datasets: [
                          { data: values, backgroundColor: "#FF6384" },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { title: { display: true, text: "Grade" } },
                          y: {
                            title: {
                              display: true,
                              text: "Percentage of Students",
                            },
                            beginAtZero: true,
                            max: 100,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              );
            })}
    </div>
  );
}

export default Statistics;
