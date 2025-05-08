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

  // State to hold all course history data from the server
  const [histories, setHistories] = useState([]);

  // Index of the currently selected user (for single user mode)
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // Current view mode: 'all', 'single', or 'current'
  const [viewMode, setViewMode] = useState("all");

  // Currently selected semester label (e.g., 'Semester 1')
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");

  // List of available semester labels (populated dynamically)
  const [availableSemesters, setAvailableSemesters] = useState([]);

  // Firebase UID of the currently logged-in user
  const [loggedInFirebaseUid, setLoggedInFirebaseUid] = useState("");

  // Flag if data is fully loaded and ready
  const [isDataReady, setIsDataReady] = useState(false);

  // Currently selected major from the dropdown filter
  const [selectedMajor, setSelectedMajor] = useState("");

  // List of users filtered for single user mode
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showTop10, setShowTop10] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
  const drawGraph = useCallback((userHistories, semester = "", showTop10 = false) => {
    let allCourseData = [];
  
    // Build a set of unique semesters for this user
    userHistories.forEach((history) => {
      if (!history || !history.courses) return;
      const studentCourses = history.courses;
  
      // Map semesters to labels like 'Semester 1', 'Semester 2', etc.
      const semesterSet = new Set();
      studentCourses.forEach((c) => c.semester && semesterSet.add(c.semester));
      const sortedSemesters = Array.from(semesterSet).sort(
        (a, b) => getSemesterRank(a) - getSemesterRank(b)
      );
  
       // Collect the course data, filtered by semester if specified
      const semesterMap = new Map();
      const reverseSemesterMap = new Map();
      sortedSemesters.forEach((code, idx) => {
        const label = `Semester ${idx + 1}`;
        semesterMap.set(code, label);
        reverseSemesterMap.set(label, code);
      });
  
      studentCourses.forEach((course) => {
        if (!course.semester) return;
        const label = semesterMap.get(course.semester);
        if (!semester || label === semester) {
          allCourseData.push({
            programId: course.programId,
            normalizedSemester: label,
            rawSemesterCode: course.semester,
            grade: course.grade,
          });
        }
      });
    });
  
    if (showTop10) {
      if (semester) {
        const courseCounts = {};
        allCourseData.forEach((course) => {
          if (course.normalizedSemester === semester) {
            courseCounts[course.programId] = (courseCounts[course.programId] || 0) + 1;
          }
        });
        const topCourses = Object.entries(courseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id]) => id);
        allCourseData = allCourseData.filter(
          (course) => course.normalizedSemester !== semester || topCourses.includes(course.programId)
        );
      } else {
        const semesterToCourses = {};
        allCourseData.forEach((course) => {
          if (!semesterToCourses[course.normalizedSemester]) {
            semesterToCourses[course.normalizedSemester] = [];
          }
          semesterToCourses[course.normalizedSemester].push(course);
        });
  
        const semesterToTopCourses = {};
        Object.entries(semesterToCourses).forEach(([sem, courses]) => {
          const courseCounts = {};
          courses.forEach((course) => {
            courseCounts[course.programId] = (courseCounts[course.programId] || 0) + 1;
          });
          const topCourses = Object.entries(courseCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id]) => id);
          semesterToTopCourses[sem] = new Set(topCourses);
        });
  
        allCourseData = allCourseData.filter(
          (course) =>
            semesterToTopCourses[course.normalizedSemester] &&
            semesterToTopCourses[course.normalizedSemester].has(course.programId)
        );
      }
    }
  
    const nodes = [];
    const links = [];
    const nodeSet = new Set();
  
    allCourseData.forEach((course) => {
      const { programId, normalizedSemester, grade } = course;
      const semesterNodeId = normalizedSemester;
      const courseNodeId = `${programId}__${normalizedSemester}`;
  
      if (!nodeSet.has(semesterNodeId)) {
        const firstCourse = allCourseData.find(
          (c) => c.normalizedSemester === semesterNodeId
        );
        const rawCode = firstCourse ? firstCourse.rawSemesterCode : "Unknown";
  
        nodes.push({
          id: semesterNodeId,
          group: "semester",
          rawSemesterCode: rawCode,
        });
        nodeSet.add(semesterNodeId);
      }
  
      if (!nodeSet.has(courseNodeId)) {
        nodes.push({
          id: courseNodeId,
          group: "course",
          displayName: programId,
          grade: grade,
        });
        nodeSet.add(courseNodeId);
      }
  
      links.push({ source: semesterNodeId, target: courseNodeId });
    });
  
    const width = window.innerWidth;
    const height = window.innerHeight - 150;
  
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
  
    const container = svg.append("g");
  
    const zoom = d3.zoom().on("zoom", (event) => {
      container.attr("transform", event.transform);
    });
  
    svg.call(zoom);
    svg.transition().duration(0).call(zoom.transform, d3.zoomIdentity);
  
    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(100).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => (d.group === "semester" ? 45 : 12)))
   
    const link = container
      .append("g")
      .attr("stroke", "#aaa")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);
    
      //scale up the nodes when hovered over
    const node = container
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (d.group === "semester" ? 20 : 8))
      .attr("fill", (d) => (d.group === "semester" ? "#1f77b4" : "#ff7f0e"))
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill", d.group === "semester" ? "#3399ff" : "#ff9933")
          .attr("r", d.group === "semester" ? 30 : 14);
  
        d.scale = 1.5;
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill", d.group === "semester" ? "#1f77b4" : "#ff7f0e")
          .attr("r", d.group === "semester" ? 20 : 8);
  
        d.scale = 1;
      })
      .on("click", async (event, d) => {
        if (d.group === "course") {
          const courseName = d.displayName;
          try {
            const res = await axios.get(`${API_URL}/courses/${encodeURIComponent(courseName)}`);
            const course = res.data;
            alert(`Course: ${courseName}\nDescription: ${course.description || "N/A"}\nCredits: ${course.Credits || "N/A"}\nPrerequisites: ${course.Prerequisites || "N/A"}`);
          } catch (err) {
            if (err.response && err.response.status === 404) {
              alert(`Course: ${courseName}\n(Additional info not found. Might be a transfer class.)`);
            } else {
              console.error("Unexpected error fetching course info:", err);
              alert(`Unexpected error occurred trying to load course information.`);
            }
          }
        } else if (d.group === "semester") {
          const rawSemester = d.rawSemesterCode || "Unknown";
          alert(`Semester label: ${d.id}\nDatabase code: ${rawSemester}`);
        }
      })
      .call(
        d3.drag()
          .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.1).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );
  
    // LABEL GROUPS WITH BUBBLE BACKGROUND
    const labelGroups = container
      .append("g")
      .selectAll("g.label-group")
      .data(nodes)
      .join("g")
      .attr("class", "label-group");
  
    // Initialize scale property for each node
    nodes.forEach((d) => { d.scale = 1; });
  
    labelGroups.each(function (d) {
      const group = d3.select(this);
  
      const text = group
        .append("text")
        .text(d.group === "course" ? d.displayName : d.id)
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle");
  
      const bbox = text.node().getBBox();
      const paddingX = 4, paddingY = 2;
  
      group.insert("rect", "text")
        .attr("x", bbox.x - paddingX)
        .attr("y", bbox.y - paddingY)
        .attr("width", bbox.width + 2 * paddingX)
        .attr("height", bbox.height + 2 * paddingY)
        .attr("rx", 4).attr("ry", 4)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);
    });
  
    // LABEL POSITION ABOVE NODE
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
  
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  
      labelGroups.attr("transform", (d) => {
        const offsetY = d.group === "semester" ? -35 : -20;
        return `translate(${d.x}, ${d.y + offsetY}) scale(${d.scale || 1})`;
      });
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

    let maxSemesters = 0;

    histories.forEach((history) => {
      const studentCourses = history.courses || [];
      const userSemesterSet = new Set();
      studentCourses.forEach((c) => {
        if (c.semester) userSemesterSet.add(c.semester);
      });
      if (userSemesterSet.size > maxSemesters) {
        maxSemesters = userSemesterSet.size;
      }
    });

    const semesterList = Array.from(
      { length: maxSemesters },
      (_, idx) => `Semester ${idx + 1}`
    );

    setAvailableSemesters(semesterList);
  }
}, [loggedInFirebaseUid, histories]);


  const handleSemesterChange = (e) => {
    const semester = e.target.value;
    setSelectedSemester(semester);
    redrawFilteredGraph(semester, selectedMajor, showTop10);
  };

const redrawFilteredGraph = (semester, major, showTop10Override = showTop10) => {
  let filtered = histories;

  // Only filter by major when in single user mode
  if ((viewMode === "single" || viewMode === "all") && major) {
    filtered = filtered.filter((h) => h.major === major);
  }

  if (!filtered || filtered.length === 0) {
    console.warn(
      "No matching histories found for the selected major/semester."
    );
    drawGraph([], semester, showTop10Override);
    return;
  }

  if (viewMode === "single" && currentUserIndex >= 0) {
    drawGraph([filtered[currentUserIndex]], semester, showTop10Override);
  } else if (viewMode === "current" && loggedInFirebaseUid) {
    const userHistory = histories.find(
      (history) => history.firebaseUid === loggedInFirebaseUid
    );
    if (userHistory) {
      drawGraph([userHistory], semester, showTop10Override);
    } else {
      drawGraph([], semester, showTop10Override);
    }
  } else if (viewMode === "all") {
    drawGraph(filtered, semester, showTop10Override);
  }
};


  const handleMajorChange = (e) => {
    const major = e.target.value;
    setSelectedMajor(major);
    redrawFilteredGraph(selectedSemester, major, showTop10);
  };
const handleSingleUser = () => {
  const filtered = selectedMajor
    ? histories.filter((h) => h.major === selectedMajor)
    : histories;

  if (filtered.length === 0) return;

  setFilteredUsers(filtered); 

  const randomIndex = Math.floor(Math.random() * filtered.length);
  setCurrentUserIndex(randomIndex);
  setViewMode("single");
  drawGraph([filtered[randomIndex]], selectedSemester, showTop10);
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
      drawGraph([userHistory], selectedSemester, showTop10);
    } else {
      console.warn("No course history found for your account.");
      alert("No course history found for your account.");
    }
  };


const handleNextUser = () => {
  if (viewMode !== "single" || filteredUsers.length === 0) return;

  const nextIndex = (currentUserIndex + 1) % filteredUsers.length;
  setCurrentUserIndex(nextIndex);
  drawGraph([filteredUsers[nextIndex]], selectedSemester, showTop10);
};



const handlePrevUser = () => {
  if (viewMode !== "single" || filteredUsers.length === 0) return;

  const prevIndex =
    (currentUserIndex - 1 + filteredUsers.length) % filteredUsers.length;
  setCurrentUserIndex(prevIndex);
  drawGraph([filteredUsers[prevIndex]], selectedSemester, showTop10);
};

const handleAllUsers = () => {
  setViewMode("all");
  setCurrentUserIndex(-1);
  redrawFilteredGraph(selectedSemester, selectedMajor, showTop10);
};

return (
  <>
    <div
      style={{
        textAlign: "center",
        marginBottom: "0.5rem",
        fontSize: "0.9rem",
        color: "#555",
        minHeight: "1.5rem", // reserve space even if empty
      }}
    >
      {(viewMode === "single" || viewMode === "current") &&
        (() => {
          let majorToShow = "";
          if (viewMode === "single" && filteredUsers[currentUserIndex]) {
            majorToShow = filteredUsers[currentUserIndex].major || "Not set";
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

    {/* Dropdowns row */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginBottom: "1rem",
      }}
    >
      <select
        onChange={handleMajorChange}
        value={selectedMajor}
        style={{ width: "250px" }}
      >
        <option value="">Select Major</option>
        {majors.map((m) => (
          <option key={m.name} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>

      <select
        onChange={handleSemesterChange}
        value={selectedSemester}
        style={{ width: "250px" }}
      >
        {availableSemesters.map((semester) => (
          <option key={semester} value={semester}>
            {semester}
          </option>
        ))}
        <option value="">All Semesters</option>
      </select>
    </div>

    {/* Buttons row */}
    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
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
        Random User
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
          opacity: selectedMajor ? 1 : 0.5,
          cursor: selectedMajor ? "pointer" : "not-allowed",
        }}
        disabled={!selectedMajor}
        title={!selectedMajor ? "Please select a major to use All Users view" : undefined}
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

    <div
      style={{
        width: "95vw", // 95% of the viewport width, leaves room for scrollbars/margins
        height: "60vh", // slightly less tall if you want room for buttons/headers
        margin: "0 auto", // centers it
        display: "block",
        backgroundColor: "#f8f9fa",
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.2)",
        borderRadius: "8px",
        position: "relative", // <-- add for absolute positioning inside
      }}
    >
      {/* Show message if no user data to display */}
      {isDataReady && (
        (() => {
          let filtered = histories;
          if ((viewMode === "single" || viewMode === "all") && selectedMajor) {
            filtered = filtered.filter((h) => h.major === selectedMajor);
          }
          if (viewMode === "single" && filteredUsers.length > 0) {
            filtered = filteredUsers;
          }
          if (
            !filtered ||
            filtered.length === 0 ||
            (viewMode === "single" && filteredUsers.length === 0)
          ) {
            return (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "#888",
                fontSize: "1.5rem",
                zIndex: 10,
                textAlign: "center",
              }}>
                No user data to display
              </div>
            );
          }
          return null;
        })()
      )}
      {/* Top 10 toggle in top left */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 2,
          display: "flex",
          gap: "8px"
        }}
      >
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

        <button
          onClick={() => {
            setShowTop10((prev) => {
              const newVal = !prev;
              redrawFilteredGraph(selectedSemester, selectedMajor, newVal);
              return newVal;
            });
          }}
          style={{
            backgroundColor: showTop10 ? "#F1B82D" : "#111",
            color: showTop10 ? "black" : "#F1B82D",
            border: "2px solid #F1B82D",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "1rem",
            padding: "6px 18px",
            cursor: "pointer",
            boxShadow: showTop10 ? "0 0 10px #F1B82D" : "0 2px 8px rgba(0,0,0,0.07)",
            transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
          }}
          title={
            showTop10
              ? "Showing only the top 10 most common courses in the selected semester."
              : "Click to show only the top 10 most common courses in the selected semester."
          }
        >
          Top 10 Courses {showTop10 ? "(ON)" : "(OFF)"}
        </button>
      </div>

      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      ></svg>

      {showHelp && (
        <div
          style={{
            position: "absolute",
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
          <div style={{ background: "white" }}>
            <p style={{ marginTop: 0, marginBottom: 12, background:"white", textAlign:"center" }}>
              The visualizer page provides a visual representation of the classes you and other students have taken in a given semester.
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: 0 }}>
              <li>The "Select Major" menu allows you to select the major you would like to view data for.</li>
              <li>The "Select Semester" menu allows you to view data from a specific semester or all semesters.</li>
              <li>The "Random User" button will select a random anonymous user's data to view from the selected major and semester.</li>
              <li>The "Prev" and "Next" buttons allow you to toggle between different random users.</li>
              <li>The "All Users" button will show all data for the selected major and semester.</li>
              <li>The "Current User" button will show your data for the selected semester.</li>
              <li>The "Top 10 Courses" filter button in the top left of the chart will display only the ten most popular courses for each displayed semester.</li>
              <li>Zoom in or out in the chart to navigate to different semester nodes.</li>
              <li>Clicking on a node will provide you with semester or course details.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  </>
);

}

export default VisualizationPage;

