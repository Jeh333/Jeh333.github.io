//Page for displaying statistics based on major and grades
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
import "../styles/global.css";
import "../styles/Statistics.css";
import grades from "../data/grades.json";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

//Load course prefixes for limiting data selection
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
  const [showTop10, setShowTop10] = useState(false);
  const [barColor, setBarColor] = useState("#36A2EB");
  const [noData, setNoData] = useState(false);
  const [showHelp, setShowHelp] = useState(false); // NEW: help toggle
  const [prefixSearch, setPrefixSearch] = useState("");

  //Load saved majors
  useEffect(() => {
    setAvailableMajors(majors.map((m) => m.name));
  }, []);

  //Loads previously selected major
  useEffect(() => {
    const savedMajor = localStorage.getItem("selectedMajor");
    if (savedMajor) {
      setMajor(savedMajor);
    }
  }, []);

  //Fetch statistics after button is pressed
  const handleSubmit = async () => {
    if (!major) return;

    try {
      const idToken = await auth.currentUser.getIdToken();

      const res = await fetch(
        `${API_URL}/statistics/${major}?type=${statType}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const text = await res.text();
      const data = JSON.parse(text);
      setSemesterData(data);
      setNoData(Object.keys(data).length === 0); // check for empty data
      setBarColor(statType === "distribution" ? "#36A2EB" : "#FF6384");
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  return (
    <div
      className="container mt-5 text-center"
      style={{ position: "relative" }}
    >
      <h1>Statistics by Major</h1>

      {/* Help Button */}
      <div style={{ margin: "1rem 0" }}>
        <button
          onClick={() => setShowHelp(true)}
          style={{
            backgroundColor: "#F1B82D",
            color: "black",
            border: "2px solid black",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "1rem",
            padding: "6px 18px",
            cursor: "pointer",
          }}
        >
          Help
        </button>
      </div>

      {/* Stylized Help Window */}
      {showHelp && (
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
            maxWidth: "450px",
            zIndex: 999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            textAlign: "left",
          }}
        >
          <button
            onClick={() => setShowHelp(false)}
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
          <h3 style={{ marginTop: 0, textAlign: "center" }}>Help</h3>
          <p
            style={{
              marginBottom: 12,
              textAlign: "center",
              background: "white",
            }}
          >
            The Statistics page allows you to explore major-specific course or
            grade data.
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
            <li>Select a major from the dropdown.</li>
            <li>Choose between Course Distribution or Grade Distribution.</li>
            <li>Optionally filter results by course prefix.</li>
            <li>
              Toggle "Show Only Top 10" to limit data to the 10 most common
              results.
            </li>
            <li>Click Submit to generate the chart.</li>
          </ul>
        </div>
      )}

      {/* Major dropdown */}
      <Form.Select
        className="my-4 w-50 mx-auto"
        value={major}
        onChange={(e) => {
          const selected = e.target.value;
          setMajor(selected);
          localStorage.setItem("selectedMajor", selected);
        }}
      >
        <option value="">Select a Major</option>
        {availableMajors.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Form.Select>

      {/* Stat type dropdown */}
      <Form.Select
        className="my-4 w-50 mx-auto"
        value={statType}
        onChange={(e) => setStatType(e.target.value)}
      >
        <option value="distribution">Course Distribution by Semester</option>
        <option value="grades">Grade Distribution by Course</option>
      </Form.Select>

      {/* Filter checkboxes */}
      <Form.Check
        type="checkbox"
        label="Filter by Course Prefix"
        className="mb-2 text-start w-50 mx-auto"
        checked={showPrefixFilter}
        onChange={(e) => setShowPrefixFilter(e.target.checked)}
      />

      <Form.Check
        type="checkbox"
        label="Show Only Top 10"
        className="mb-2 text-start w-50 mx-auto"
        checked={showTop10}
        onChange={(e) => setShowTop10(e.target.checked)}
      />

      {/* Prefix filters */}
      {showPrefixFilter && (
        <Form.Group className="mb-3 text-start w-50 mx-auto">
          <Form.Label>Filter by Course Prefix</Form.Label>
          <div
            className="prefix-filter-box"
            style={{
              backgroundColor: "white",
              border: "2px solid black",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              padding: "24px 20px 20px 20px",
              maxWidth: "450px",
              margin: "0 auto 16px auto",
              marginTop: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <input
              type="text"
              placeholder="Search prefixes..."
              value={prefixSearch}
              onChange={(e) => setPrefixSearch(e.target.value)}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid #ccc",
                fontSize: "1rem",
              }}
            />
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid #eee",
                borderRadius: 4,
                padding: 4,
                background: "#fafbfc",
                flex: 1,
              }}
            >
              {COURSE_PREFIXES.filter((prefix) =>
                prefix.toLowerCase().includes(prefixSearch.toLowerCase())
              ).map((prefix) => (
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
              {COURSE_PREFIXES.filter((prefix) =>
                prefix.toLowerCase().includes(prefixSearch.toLowerCase())
              ).length === 0 && (
                <div style={{ color: "#888", fontSize: "0.95rem", padding: 8 }}>
                  No prefixes found.
                </div>
              )}
            </div>
          </div>
        </Form.Group>
      )}

      <Button variant="primary" onClick={handleSubmit} className="mb-4">
        Submit
      </Button>

      {/* Show no data message */}
      {noData && (
        <div style={{ color: "#888", marginTop: "1rem", fontSize: "1.2rem" }}>
          No data found for the selected major.
        </div>
      )}

      {/* Chart rendering */}
      {statType === "distribution"
        ? Object.entries(semesterData).map(([semester, courseCounts]) => {
            let filteredEntries = Object.entries(courseCounts).filter(
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

            if (showTop10) {
              filteredEntries = filteredEntries
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            }

            if (filteredEntries.length === 0) return null;

            const labels = filteredEntries.map(([id]) => id);
            const values = filteredEntries.map(([, val]) => val);

            return (
              <div key={semester} className="mb-5">
                <h4>{semester}</h4>
                <div className="chart-container">
                  <Bar
                    data={{
                      labels,
                      datasets: [{ data: values, backgroundColor: barColor }],
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
              const labels = grades.filter((g) => g in gradeCounts);
              const values = labels.map((g) => gradeCounts[g]);

              return (
                <div key={courseId} className="mb-5">
                  <h4>{courseId}</h4>
                  <div className="chart-container">
                    <Bar
                      data={{
                        labels,
                        datasets: [{ data: values, backgroundColor: barColor }],
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
