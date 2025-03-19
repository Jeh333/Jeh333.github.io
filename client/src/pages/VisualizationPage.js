import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Bubble } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

function VisualizationPage() {
  const [courseHistories, setCourseHistories] = useState([]);
  const [semesterIndexMap, setSemesterIndexMap] = useState(new Map());
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Fetch course histories from the backend
  useEffect(() => {
    const fetchCourseHistories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/course-histories"
        );
        setCourseHistories(response.data);

        // Extract unique semesters & assign numerical x-axis values
        const semesters = [
          ...new Set(
            response.data.flatMap((history) =>
              history.courses.map((c) => c.semester)
            )
          ),
        ].sort();
        const semesterMap = new Map(semesters.map((sem, i) => [sem, i + 1]));
        setSemesterIndexMap(semesterMap);
      } catch (error) {
        console.error("Error fetching course histories:", error);
      }
    };

    fetchCourseHistories();
  }, []);

  // Helper function to generate random colors
  const getRandomColor = useMemo(() => {
    const colorCache = new Map();
    return (key) => {
      if (!colorCache.has(key)) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colorCache.set(key, `rgba(${r}, ${g}, ${b}, 0.6)`);
      }
      return colorCache.get(key);
    };
  }, []);

  // Process data for visualization
  const processData = useMemo(() => {
    if (!selectedSemester) {
      // Show semesters as large bubbles initially
      const semesterCounts = new Map();
      const totalStudents = courseHistories.length;

      courseHistories.forEach((history) => {
        history.courses.forEach((course) => {
          const semesterKey = course.semester;
          if (!semesterCounts.has(semesterKey)) {
            semesterCounts.set(semesterKey, 0);
          }
          semesterCounts.set(semesterKey, semesterCounts.get(semesterKey) + 1);
        });
      });

      return [...semesterCounts.entries()].map(([semester, count]) => ({
        x: semesterIndexMap.get(semester) || Math.random() * 10 + 20, // Spread out for visibility
        y: Math.random() * 40 + 30, // Center vertically
        r: (count / totalStudents) * 40 + 20, // ✅ Increase bubble size
        label: semester,
        semester, // Store semester for interaction
        backgroundColor: getRandomColor(semester),
      }));
    }

    // If a semester is selected, show courses in that semester
    const courseCounts = new Map();
    const totalStudents = courseHistories.length;

    courseHistories.forEach((history) => {
      history.courses.forEach((course) => {
        if (course.semester === selectedSemester) {
          if (!courseCounts.has(course.description)) {
            courseCounts.set(course.description, 0);
          }
          courseCounts.set(
            course.description,
            courseCounts.get(course.description) + 1
          );
        }
      });
    });

    return [...courseCounts.entries()].map(([course, count]) => ({
      x: Math.random() * 10 + 45, // Spread courses randomly in X-axis
      y: Math.random() * 20 + 40, // Spread courses randomly in Y-axis
      r: (count / totalStudents) * 20 + 5, // Scale bubble size
      label: course,
      backgroundColor: getRandomColor(course),
    }));
  }, [courseHistories, selectedSemester, semesterIndexMap, getRandomColor]);

  return (
    <div>
      <h2>Course History Visualization</h2>
      <div style={{ width: "100vw", height: "80vh", margin: "0 auto" }}>
        <Bubble
          data={{
            datasets: [
              {
                label: selectedSemester
                  ? `Courses in ${selectedSemester}`
                  : "Semesters",
                data: processData,
                backgroundColor: processData.map((d) => d.backgroundColor),
              },
            ],
          }}
          options={{
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const clickedData = processData[index];

                if (!selectedSemester) {
                  // Clicked a semester, drill down to courses
                  setSelectedSemester(clickedData.semester);
                } else {
                  // Clicked a course, reset view
                  setSelectedSemester(null);
                }
              }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 0, // Prevents transition lag
            },
            scales: {
              x: {
                display: false, // ✅ Hide X-axis
              },
              y: {
                display: false, // ✅ Hide Y-axis
              },
            },
            plugins: {
              legend: {
                display: false, // ✅ Hide legend
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const data = context.raw;
                    return `${data.label}`;
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default VisualizationPage;
