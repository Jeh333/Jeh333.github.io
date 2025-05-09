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

  // Index of the currently selected user
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // Current view mode: all, single, or current
  const [viewMode, setViewMode] = useState("all");

  // Currently selected semester label
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");

  // List of available semester labels (populated dynamically)
  const [availableSemesters, setAvailableSemesters] = useState([]);

  // Firebase UID of the currently logged-in user
  const [loggedInFirebaseUid, setLoggedInFirebaseUid] = useState("");

  // Flag if data is fully loaded and ready
  const [isDataReady, setIsDataReady] = useState(false);

  // Currently selected major from the dropdown filter
  const [selectedMajor, setSelectedMajor] = useState("");
  const [isGraphGenerated, setIsGraphGenerated] = useState(false);

  // List of users filtered for single user mode
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showTop10, setShowTop10] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseModalInfo, setCourseModalInfo] = useState(null);

  // Helper function to compute a sortable rank for a semester code
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
  const drawGraph = useCallback(
    (userHistories, semester = "", showTop10 = false) => {
      let allCourseData = [];

      // Build a set of unique semesters for this user
      userHistories.forEach((history) => {
        if (!history || !history.courses) return;
        const studentCourses = history.courses;

        // Map semesters to labels like Semester 1, Semester 2, etc...
        const semesterSet = new Set();
        studentCourses.forEach(
          (c) => c.semester && semesterSet.add(c.semester)
        );
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
        // Collect all course data for the selected user
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
      //filter to include only the most common 10 courses
      if (showTop10) {
        if (semester) {
          const courseCounts = {};
          allCourseData.forEach((course) => {
            if (course.normalizedSemester === semester) {
              courseCounts[course.programId] =
                (courseCounts[course.programId] || 0) + 1;
            }
          });
          const topCourses = Object.entries(courseCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id]) => id);
          allCourseData = allCourseData.filter(
            (course) =>
              course.normalizedSemester !== semester ||
              topCourses.includes(course.programId)
          );
        } else {
          // For all semesters
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
              courseCounts[course.programId] =
                (courseCounts[course.programId] || 0) + 1;
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
              semesterToTopCourses[course.normalizedSemester].has(
                course.programId
              )
          );
        }
      }
      // Initialize D3 graph nodes and links
      const nodes = [];
      const links = [];
      const nodeSet = new Set();

      allCourseData.forEach((course) => {
        const { programId, normalizedSemester, grade } = course;
        const semesterNodeId = normalizedSemester;
        const courseNodeId = `${programId}__${normalizedSemester}`;
        // Add semester node
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
        // Add course node
        if (!nodeSet.has(courseNodeId)) {
          nodes.push({
            id: courseNodeId,
            group: "course",
            displayName: programId,
            grade: grade,
          });
          nodeSet.add(courseNodeId);
        }
        // Link semester node to course node
        links.push({ source: semesterNodeId, target: courseNodeId });
      });

      // Set graph dimensions
      const width = window.innerWidth;
      const height = window.innerHeight - 150;

      // Clear previous SVG content
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Container group for zoom
      const container = svg.append("g");

      // Enable zooming and panning
      const zoom = d3.zoom().on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

      svg.call(zoom);
      svg.transition().duration(0).call(zoom.transform, d3.zoomIdentity);

      // Initialize the D3 force simulation
      // Needed to keep nodes from stacking easily
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
          d3.forceCollide().radius((d) => (d.group === "semester" ? 60 : 12))
        );
      // Draw graph links
      const link = container
        .append("g")
        .attr("stroke", "#aaa")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.5);

      //Draw graph nodes
      const node = container
        .append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", (d) => (d.group === "semester" ? 20 : 8)) //Semester radius
        .attr("fill", (d) => (d.group === "semester" ? "#1f77b4" : "#ff7f0e")) //node type colors
        .on("mouseover", function (event, d) {
          //On hover change node for emphasis
          d3.select(this)
            .transition()
            .duration(150)
            .attr("fill", d.group === "semester" ? "#3399ff" : "#ff9933")
            .attr("r", d.group === "semester" ? 30 : 14);

          //Scale label tied to node
          d.scale = 1.5;
          labelGroups
            .filter((t) => t.id === d.id)
            .attr("transform", (dd) => {
              const offsetY = dd.group === "semester" ? -35 : -20;
              return `translate(${dd.x}, ${dd.y + offsetY}) scale(${
                dd.scale || 1
              })`;
            });
        })
        // On hover out, restore node size and color
        .on("mouseout", function (event, d) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr("fill", d.group === "semester" ? "#1f77b4" : "#ff7f0e")
            .attr("r", d.group === "semester" ? 20 : 8);
          // Reset label scale
          d.scale = 1;
          labelGroups
            .filter((t) => t.id === d.id)
            .attr("transform", (dd) => {
              const offsetY = dd.group === "semester" ? -35 : -20;
              return `translate(${dd.x}, ${dd.y + offsetY}) scale(${
                dd.scale || 1
              })`;
            });
        })
        .on("click", async function (event, d) {
          if (d.group === "course") {
            const courseName = d.displayName;
            try {
              const res = await axios.get(
                `${API_URL}/courses/${encodeURIComponent(courseName)}`
              );
              const course = res.data;
              setCourseModalInfo({
                title: courseName,
                description: course.description || "N/A",
                credits: course.Credits || "N/A",
                prerequisites: course.Prerequisites || "N/A",
              });
              setShowCourseModal(true);
            } catch (err) {
              if (err.response && err.response.status === 404) {
                setCourseModalInfo({
                  title: courseName,
                  description:
                    "(Additional info not found. Might be a transfer class.)",
                  credits: "N/A",
                  prerequisites: "N/A",
                });
                setShowCourseModal(true);
              } else {
                setCourseModalInfo({
                  title: courseName,
                  description:
                    "Unexpected error occurred trying to load course information.",
                  credits: "N/A",
                  prerequisites: "N/A",
                });
                setShowCourseModal(true);
              }
            }
          } else if (d.group === "semester") {
            // Show raw semester details
            const rawSemester = d.rawSemesterCode || "Unknown";
            setCourseModalInfo({
              title: `Semester Info`,
              description: `Relative: ${d.id}\nActual: ${rawSemester}`,
              credits: "",
              prerequisites: "",
            });
            setShowCourseModal(true);
          }
        })
        .call(
          d3
            .drag()
            .on("start", (event, d) => {
              // On drag start, activate simulation and fix node position
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

      // label groups with bubble backgrounds
      const labelGroups = container
        .append("g")
        .selectAll("g.label-group")
        .data(nodes)
        .join("g")
        .attr("class", "label-group");

      // Initialize scale property for each node
      nodes.forEach((d) => {
        d.scale = 1;
      });

      labelGroups.each(function (d) {
        const group = d3.select(this);
        // Add text labels
        const text = group
          .append("text")
          .text(d.group === "course" ? d.displayName : d.id)
          .attr("font-size", 10)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle");
        //Add background layer
        const bbox = text.node().getBBox();
        const paddingX = 4,
          paddingY = 2;
        //Text Background
        group
          .insert("rect", "text")
          .attr("x", bbox.x - paddingX)
          .attr("y", bbox.y - paddingY)
          .attr("width", bbox.width + 2 * paddingX)
          .attr("height", bbox.height + 2 * paddingY)
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr("stroke-width", 0.5);
      });

      // label position above node
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
    },
    []
  );
  // fetch all course history data from the server
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
  // Listen for Firebase authentication
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

  // Handle dropdown change when semester is selected
  const handleSemesterChange = (e) => {
    const semester = e.target.value;
    setSelectedSemester(semester);
  };
  // Redraw the graph based on selected semester, major, and top 10 toggle
  const redrawFilteredGraph = (
    semester,
    major,
    showTop10Override = showTop10
  ) => {
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
  // Navigate to the previous semester
  const handlePrevSemester = () => {
    if (!availableSemesters || availableSemesters.length === 0) return;

    const currentIndex = availableSemesters.indexOf(selectedSemester);
    const prevIndex =
      (currentIndex - 1 + availableSemesters.length) %
      availableSemesters.length;
    const prevSemester = availableSemesters[prevIndex];

    setSelectedSemester(prevSemester);
    redrawFilteredGraph(prevSemester, selectedMajor, showTop10);
  };
  // Navigate to the next semester
  const handleNextSemester = () => {
    if (!availableSemesters || availableSemesters.length === 0) return;

    const currentIndex = availableSemesters.indexOf(selectedSemester);
    const nextIndex = (currentIndex + 1) % availableSemesters.length;
    const nextSemester = availableSemesters[nextIndex];

    setSelectedSemester(nextSemester);
    redrawFilteredGraph(nextSemester, selectedMajor, showTop10);
  };
  // Handle major selection change and reset the view to all
  const handleMajorChange = (e) => {
    const major = e.target.value;
    setSelectedMajor(major);
    setViewMode("all");

    // After updating, check if there is user data for the selected major
    setTimeout(() => {
      let filtered = histories;
      if (major) {
        filtered = histories.filter((h) => h.major === major);
      }
      if (!filtered || filtered.length === 0) {
        // Clear the SVG graph
        if (svgRef.current) {
          while (svgRef.current.firstChild) {
            svgRef.current.removeChild(svgRef.current.firstChild);
          }
        }
        // Close any open course modals
        setShowCourseModal(false);
        setCourseModalInfo(null);
      }
    }, 0);
  };

  // Select and display a random user course data
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
    setIsGraphGenerated(true);
  };
  //Dsiplay the current logged-in user course data
  const handleCurrentUser = () => {
    if (!isDataReady) {
      console.warn("Data not ready yet. Please wait...");
      return;
    }

    setSelectedMajor(""); // Reset major dropdown
    const userHistory = histories.find(
      (history) => history.firebaseUid === loggedInFirebaseUid
    );
    if (userHistory) {
      setViewMode("current");
      setCurrentUserIndex(-1);
      drawGraph([userHistory], selectedSemester, showTop10);
      setIsGraphGenerated(true);
    } else {
      console.warn("No course history found for your account.");
      setCourseModalInfo({
        title: "No Course History",
        description: "No course history found for your account.",
        credits: "",
        prerequisites: "",
      });
      setShowCourseModal(true);
    }
  };
  // Switch to the next random user
  const handleNextUser = () => {
    if (viewMode !== "single" || filteredUsers.length === 0) return;

    const nextIndex = (currentUserIndex + 1) % filteredUsers.length;
    setCurrentUserIndex(nextIndex);
    drawGraph([filteredUsers[nextIndex]], selectedSemester, showTop10);
    setIsGraphGenerated(true);
  };
  // Switch to the previous random user
  const handlePrevUser = () => {
    if (viewMode !== "single" || filteredUsers.length === 0) return;

    const prevIndex =
      (currentUserIndex - 1 + filteredUsers.length) % filteredUsers.length;
    setCurrentUserIndex(prevIndex);
    drawGraph([filteredUsers[prevIndex]], selectedSemester, showTop10);
  };
  //Switch to showing all users
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
          title={
            !selectedMajor
              ? "Please select a major to use All Users view"
              : undefined
          }
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
        {/* Show message if no major is selected and not in current user mode */}
        {viewMode === "all" && !selectedMajor && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#888",
              fontSize: "1.5rem",
              zIndex: 10,
              textAlign: "center",
            }}
          >
            Get started: select a major or "Current User".
          </div>
        )}
        {/* Show message if no user data to display */}
        {isDataReady &&
          (() => {
            let filtered = histories;
            if (
              (viewMode === "single" || viewMode === "all") &&
              selectedMajor
            ) {
              filtered = filtered.filter((h) => h.major === selectedMajor);
            }
            if (viewMode === "single" && filteredUsers.length > 0) {
              filtered = filteredUsers;
            }
            // If no major is selected and not in current user mode, don't show anything else
            if (!selectedMajor && viewMode !== "current") {
              return null;
            }
            if (
              !filtered ||
              filtered.length === 0 ||
              (viewMode === "single" && filteredUsers.length === 0)
            ) {
              return (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#888",
                    fontSize: "1.5rem",
                    zIndex: 10,
                    textAlign: "center",
                  }}
                >
                  No user data to display
                </div>
              );
            }
            return null;
          })()}
        {/* Top 10 toggle and semester navigation*/}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            maxWidth: "95vw", 
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
              fontSize: "clamp(0.7rem, 2vw, 1rem)", 
              padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)", 
              cursor: "pointer",
              flex: "1 1 auto", 
              minWidth: "100px", 
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
              fontSize: "clamp(0.7rem, 2vw, 1rem)",
              padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)",
              cursor: "pointer",
              flex: "1 1 auto",
              minWidth: "100px",
              boxShadow: showTop10
                ? "0 0 10px #F1B82D"
                : "0 2px 8px rgba(0,0,0,0.07)",
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

          {/* Previous Semester Button */}
          <button
            onClick={handlePrevSemester}
            disabled={!isGraphGenerated}
            style={{
              backgroundColor: "#F1B82D",
              color: "black",
              border: "2px solid black",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "clamp(0.7rem, 2vw, 1rem)",
              padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)",
              cursor: isGraphGenerated ? "pointer" : "not-allowed",
              opacity: isGraphGenerated ? 1 : 0.5,
              flex: "1 1 auto",
              minWidth: "100px",
            }}
          >
            &lt; Semester
          </button>

          {/* Next Semester Button */}
          <button
            onClick={handleNextSemester}
            disabled={!isGraphGenerated}
            style={{
              backgroundColor: "#F1B82D",
              color: "black",
              border: "2px solid black",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "clamp(0.7rem, 2vw, 1rem)",
              padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)",
              cursor: isGraphGenerated ? "pointer" : "not-allowed",
              opacity: isGraphGenerated ? 1 : 0.5,
              flex: "1 1 auto",
              minWidth: "100px",
            }}
          >
            Semester &gt;
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
              width: "clamp(300px, 90vw, 500px)",
              maxHeight: "90vh",
              overflowY: "auto",
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
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 12,
                  background: "white",
                  textAlign: "center",
                }}
              >
                The visualizer page provides a visual representation of the
                classes you and other students have taken in a given semester.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: 0 }}>
                <li>
                  The "Select Major" menu allows you to select the major you
                  would like to view data for.
                </li>
                <li>
                  The "Select Semester" menu allows you to view data from a
                  specific semester or all semesters.
                </li>
                <li>
                  The "Random User" button will select a random anonymous user's
                  data to view from the selected major and semester.
                </li>
                <li>
                  The "Prev" and "Next" buttons allow you to toggle between
                  different random users.
                </li>
                <li>
                  The "All Users" button will show all data for the selected
                  major and semester.
                </li>
                <li>
                  The "Current User" button will show your data for the selected
                  semester.
                </li>
                <li>
                  The "Top 10 Courses" filter button in the top left of the
                  chart will display only the ten most popular courses for each
                  displayed semester.
                </li>
                <li>
                  Use the "&lt; Semester" and "Semester &gt;" buttons to move
                  backward or forward through semesters.
                </li>
                <li>
                  Zoom in or out in the chart to navigate to different semester
                  nodes.
                </li>
                <li>
                  Clicking on a node will provide you with semester or course
                  details.
                </li>
              </ul>
            </div>
          </div>
        )}

        {showCourseModal && courseModalInfo && (
          <>
            {/* Full-screen background overlay for outside clicks */}
            <div
              onClick={() => setShowCourseModal(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0,0,0,0.3)",
                zIndex: 998,
              }}
            ></div>

            {/* Modal*/}
            <div
              onClick={(e) => e.stopPropagation()} 
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "white",
                border: "2px solid black",
                borderRadius:
                  courseModalInfo.title === "Semester Info" ? "12px" : "8px",
                padding:
                  courseModalInfo.title === "Semester Info" ? "40px" : "24px",
                width:
                  courseModalInfo.title === "Semester Info"
                    ? "clamp(320px, 90vw, 700px)"
                    : "clamp(300px, 90vw, 500px)",
                maxHeight: "90vh",
                overflowY: "auto",
                zIndex: 999,
                boxShadow:
                  courseModalInfo.title === "Semester Info"
                    ? "0 4px 16px rgba(0,0,0,0.35)"
                    : "0 4px 12px rgba(0,0,0,0.3)",
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              <button
                onClick={() => setShowCourseModal(false)}
                style={{
                  position: "absolute",
                  top:
                    courseModalInfo.title === "Semester Info" ? "10px" : "5px",
                  right:
                    courseModalInfo.title === "Semester Info" ? "16px" : "8px",
                  background: "white",
                  border: "none",
                  fontSize:
                    courseModalInfo.title === "Semester Info"
                      ? "1.5rem"
                      : "1.2rem",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
              <h3
                style={{
                  marginTop: 0,
                  textAlign: "center",
                  fontSize:
                    courseModalInfo.title === "Semester Info"
                      ? "2.1rem"
                      : "1.3rem",
                  fontWeight: 700,
                  marginBottom:
                    courseModalInfo.title === "Semester Info" ? 18 : 12,
                }}
              >
                {courseModalInfo.title}
              </h3>
              <div
                style={{
                  marginBottom:
                    courseModalInfo.title === "Semester Info" ? 18 : 12,
                  whiteSpace: "pre-line",
                  fontSize:
                    courseModalInfo.title === "Semester Info"
                      ? "1.25rem"
                      : "1rem",
                }}
              >
                {courseModalInfo.description}
              </div>
              {courseModalInfo.credits && (
                <div
                  style={{
                    marginBottom:
                      courseModalInfo.title === "Semester Info" ? 10 : 6,
                    fontSize:
                      courseModalInfo.title === "Semester Info"
                        ? "1.1rem"
                        : "1rem",
                  }}
                >
                  <strong>Credits:</strong> {courseModalInfo.credits}
                </div>
              )}
              {courseModalInfo.prerequisites && (
                <div
                  style={{
                    marginBottom:
                      courseModalInfo.title === "Semester Info" ? 10 : 6,
                    fontSize:
                      courseModalInfo.title === "Semester Info"
                        ? "1.1rem"
                        : "1rem",
                  }}
                >
                  <strong>Prerequisites:</strong>{" "}
                  {courseModalInfo.prerequisites}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default VisualizationPage;
