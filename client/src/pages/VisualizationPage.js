import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import axios from "axios";
import { auth } from "../firebase";
import majors from "../data/majors.json";

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_BACKEND_URL;

function VisualizationPage() {
  const svgRef = useRef();
  const [histories, setHistories] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [viewMode, setViewMode] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [loggedInFirebaseUid, setLoggedInFirebaseUid] = useState("");
  const [isDataReady, setIsDataReady] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");

  // Helper function to compute a sortable rank for a semester code (like SP23)
  const getSemesterRank = (code) => {
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
  // Main graph drawing function
  const drawGraph = useCallback((userHistories, semester = "") => {
    const allCourseData = [];

    // Build a set of unique semesters for this user
    userHistories.forEach((history) => {
      const studentCourses = history.courses || [];

      // Map semesters to labels like 'Semester 1', 'Semester 2', etc.
      const semesterSet = new Set();
      studentCourses.forEach((c) => c.semester && semesterSet.add(c.semester));
      const sortedSemesters = Array.from(semesterSet).sort(
        (a, b) => getSemesterRank(a) - getSemesterRank(b)
      );

      const semesterMap = new Map();
      sortedSemesters.forEach((code, idx) => {
        semesterMap.set(code, `Semester ${idx + 1}`);
      });

      // Collect the course data, filtered by semester if specified
      studentCourses.forEach((course) => {
        if (!course.semester) return;
        const label = semesterMap.get(course.semester);
        if (!semester || label === semester) {
          allCourseData.push({
            programId: course.programId,
            normalizedSemester: label,
            grade: course.grade,
          });
        }
      });
    });

    const nodes = [];
    const links = [];
    const nodeSet = new Set();

    allCourseData.forEach((course) => {
      const { programId, normalizedSemester, grade } = course;

      // Define unique node IDs for the semester and the course-semester combination
      const semesterNodeId = normalizedSemester;
      const courseNodeId = `${programId}__${normalizedSemester}`;

      // If the semester node hasn't been added yet, add it to the nodes list
      if (!nodeSet.has(semesterNodeId)) {
        nodes.push({ id: semesterNodeId, group: "semester" });
        nodeSet.add(semesterNodeId);
      }

      // If the course node hasn't been added yet, add it to the nodes list
      if (!nodeSet.has(courseNodeId)) {
        nodes.push({
          id: courseNodeId, // unique course node ID (with semester)
          group: "course", // 'course' group for styling
          displayName: programId, // course code to display (e.g., CMP_SC 1010)
          grade: grade, // course grade (used for potential color coding)
        });
        nodeSet.add(courseNodeId);
      }

      // Add a link (edge) connecting the semester node to the course node
      links.push({ source: semesterNodeId, target: courseNodeId });
    });

    // Set the width and height of the SVG container
    const width = window.innerWidth;
    const height = window.innerHeight - 150;

    // Select the SVG element using the React ref and clear any existing content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Append a new <g> element to serve as the main container for the graph
    const container = svg.append("g");

    const zoom = d3.zoom().on("zoom", (event) => {
      container.attr("transform", event.transform);
    });

    svg.call(zoom);

    // Reset to no zoom (identity transform)
    svg.transition().duration(0).call(zoom.transform, d3.zoomIdentity);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => (d.group === "semester" ? 30 : 12))
      );

    const link = container
      .append("g")
      .attr("stroke", "#aaa")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = container
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (d.group === "semester" ? 20 : 8))
      .attr("fill", (d) => (d.group === "semester" ? "#1f77b4" : "#ff7f0e"))
      .on("click", async (event, d) => {
        if (d.group === "course") {
          const courseName = d.displayName;
          try {
            const res = await axios.get(
              `${API_URL}/courses/${encodeURIComponent(courseName)}`
            );
            const course = res.data;
            alert(
              `Course: ${courseName}\nDescription: ${
                course.description || "N/A"
              }\nCredits: ${course.Credits || "N/A"}\nPrerequisites: ${
                course.Prerequisites || "N/A"
              }`
            );
          } catch (err) {
            if (err.response && err.response.status === 404) {
              alert(
                `Course: ${courseName}\n(Additional info not found. Might be a transfer class.)`
              );
            } else {
              console.error("Unexpected error fetching course info:", err);
              alert(
                `Unexpected error occurred trying to load course information.`
              );
            }
          }
        } else {
          alert(`Semester: ${d.id}`);
        }
      })
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.1).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const label = container
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => (d.group === "course" ? d.displayName : d.id))
      .attr("font-size", 10)
      .attr("dx", 15)
      .attr("dy", ".35em");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/course-histories`);
        setHistories(res.data);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setLoggedInFirebaseUid(user.uid);
      } else {
        setLoggedInFirebaseUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loggedInFirebaseUid && histories.length > 0) {
      setIsDataReady(true);

      const semesterSet = new Set();
      histories.forEach((history) => {
        const studentCourses = history.courses || [];
        studentCourses.forEach((c) => {
          if (c.semester) semesterSet.add(c.semester);
        });
      });

      const semesterList = Array.from(semesterSet)
        .sort((a, b) => getSemesterRank(a) - getSemesterRank(b))
        .map((_, idx) => `Semester ${idx + 1}`);

      setAvailableSemesters(semesterList);
    }
  }, [loggedInFirebaseUid, histories]);

  const handleSemesterChange = (e) => {
    const semester = e.target.value;
    setSelectedSemester(semester);
    redrawFilteredGraph(semester, selectedMajor);
  };

  const handleMajorChange = (e) => {
    const major = e.target.value;
    setSelectedMajor(major);
    redrawFilteredGraph(selectedSemester, major);
  };

  const redrawFilteredGraph = (semester, major) => {
    let filtered = histories;

    if (major) {
      filtered = filtered.filter((h) => h.major === major);
    }

    if (viewMode === "single" && filtered.length > 0 && currentUserIndex >= 0) {
      drawGraph([filtered[currentUserIndex]], semester);
    } else if (
      viewMode === "current" &&
      filtered.length > 0 &&
      loggedInFirebaseUid
    ) {
      const userHistory = filtered.find(
        (history) => history.firebaseUid === loggedInFirebaseUid
      );
      if (userHistory) {
        drawGraph([userHistory], semester);
      } else {
        drawGraph([], semester);
      }
    } else if (viewMode === "all" && filtered.length > 0) {
      drawGraph(filtered, semester);
    }
  };

  const handleSingleUser = () => {
    const filtered = selectedMajor
      ? histories.filter((h) => h.major === selectedMajor)
      : histories;

    if (filtered.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filtered.length);
    setCurrentUserIndex(randomIndex);
    setViewMode("single");
    drawGraph([filtered[randomIndex]], selectedSemester);
  };

  const handleCurrentUser = () => {
    if (!isDataReady) {
      console.warn("Data not ready yet. Please wait...");
      return;
    }

    const filtered = selectedMajor
      ? histories.filter((h) => h.major === selectedMajor)
      : histories;

    const userHistory = filtered.find(
      (history) => history.firebaseUid === loggedInFirebaseUid
    );

    if (userHistory) {
      setViewMode("current");
      setCurrentUserIndex(-1);
      drawGraph([userHistory], selectedSemester);
    } else {
      console.warn("No course history found for your account.");
      alert("No course history found for your account.");
    }
  };

  const handleAllUsers = () => {
    const filtered = selectedMajor
      ? histories.filter((h) => h.major === selectedMajor)
      : histories;

    setViewMode("all");
    drawGraph(filtered, selectedSemester);
  };

  const handleNextUser = () => {
    const filtered = selectedMajor
      ? histories.filter((h) => h.major === selectedMajor)
      : histories;

    if (viewMode !== "single" || filtered.length === 0) return;
    const nextIndex = (currentUserIndex + 1) % filtered.length;
    setCurrentUserIndex(nextIndex);
    drawGraph([filtered[nextIndex]], selectedSemester);
  };

  const handlePrevUser = () => {
    const filtered = selectedMajor
      ? histories.filter((h) => h.major === selectedMajor)
      : histories;

    if (viewMode !== "single" || filtered.length === 0) return;
    const prevIndex =
      (currentUserIndex - 1 + filtered.length) % filtered.length;
    setCurrentUserIndex(prevIndex);
    drawGraph([filtered[prevIndex]], selectedSemester);
  };

  return (
    <div>
      <h2 style={{ textAlign: "center", marginTop: "1rem" }}>
        Course Visualizer
      </h2>
      {(viewMode === "single" || viewMode === "current") && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
            color: "#555",
          }}
        >
          {(() => {
            let majorToShow = "";
            if (viewMode === "single" && histories[currentUserIndex]) {
              majorToShow = histories[currentUserIndex].major || "Not set";
            } else if (viewMode === "current") {
              const currentUser = histories.find(
                (h) => h.firebaseUid === loggedInFirebaseUid
              );
              majorToShow = currentUser?.major || "Not set";
            }
            return (
              <span>
                Showing data for major: <strong>{majorToShow}</strong>
              </span>
            );
          })()}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        {/* Major Dropdown */}
        <select
          onChange={handleMajorChange}
          value={selectedMajor}
          style={{ marginBottom: "1rem", marginRight: "10px", width: "250px" }}
        >
          <option value="">All Majors</option>
          {majors.map((m) =>
            m.types.map((type) => (
              <option key={`${m.name}-${type}`} value={m.name}>
                {m.name} ({type})
              </option>
            ))
          )}
        </select>

        {/* Semester Dropdown */}
        <select
          onChange={handleSemesterChange}
          value={selectedSemester}
          style={{ marginBottom: "1rem", marginRight: "10px" }}
        >
          <option value="">All Semesters</option>
          {availableSemesters.map((semester) => (
            <option key={semester} value={semester}>
              {semester}
            </option>
          ))}
        </select>

        {/* Control Buttons */}
        <button
          onClick={handleSingleUser}
          style={{
            margin: "0 5px",
            backgroundColor: viewMode === "single" ? "#F1B82D" : "#6c757d",
            color: viewMode === "single" ? "black" : "white",
            fontWeight: viewMode === "single" ? "bold" : "",
            border: "2px solid black",
          }}
        >
          Single User
        </button>

        <button
          onClick={handleCurrentUser}
          style={{
            margin: "0 5px",
            backgroundColor: viewMode === "current" ? "#F1B82D" : "#6c757d",
            color: viewMode === "current" ? "black" : "white",
            fontWeight: viewMode === "current" ? "bold" : "",
            border: "2px solid black",
          }}
        >
          Current User
        </button>

        <button
          onClick={handleAllUsers}
          style={{
            margin: "0 5px",
            backgroundColor: viewMode === "all" ? "#F1B82D" : "#6c757d",
            color: viewMode === "all" ? "black" : "white",
            fontWeight: viewMode === "all" ? "bold" : "",
            border: "2px solid black",
          }}
        >
          All Users
        </button>

        <button
          onClick={handlePrevUser}
          style={{ margin: "0 5px" }}
          disabled={viewMode !== "single"}
        >
          &lt; Prev
        </button>
        <button
          onClick={handleNextUser}
          style={{ margin: "0 5px" }}
          disabled={viewMode !== "single"}
        >
          Next &gt;
        </button>
      </div>
      <svg
        ref={svgRef}
        style={{
          display: "block",
          margin: "0 auto",
          width: "100%",
          height: "100vh",
        }}
      ></svg>
    </div>
  );
}

export default VisualizationPage;

