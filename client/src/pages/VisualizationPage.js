import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bubble } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

function VisualizationPage() {
  const [courseHistories, setCourseHistories] = useState([]);

  // Fetch course histories from the backend
  useEffect(() => {
    const fetchCourseHistories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/course-histories"
        );
        setCourseHistories(response.data);
      } catch (error) {
        console.error("Error fetching course histories:", error);
      }
    };

    fetchCourseHistories();
  }, []);

  // Process the data to calculate averages and group by semester
  const processData = () => {
    const dataMap = new Map(); // Key: semester, Value: { courseName: count }

    courseHistories.forEach((history) => {
      history.courses.forEach((course) => {
        const semesterKey = course.semester; // e.g., "2022 Fall Semester"
        const courseName = course.description;

        if (!dataMap.has(semesterKey)) {
          dataMap.set(semesterKey, {});
        }

        const semesterData = dataMap.get(semesterKey);
        if (!semesterData[courseName]) {
          semesterData[courseName] = 0;
        }
        semesterData[courseName]++;
      });
    });

    // Convert the map to an array of bubble data
    const bubbleData = [];
    dataMap.forEach((courses, semesterKey) => {
      const totalStudents = courseHistories.length;
      Object.entries(courses).forEach(([courseName, count]) => {
        const percentage = (count / totalStudents) * 100;
        bubbleData.push({
          x: semesterKey, // X-axis: Semester
          y: percentage, // Y-axis: Percentage of students
          r: percentage / 10, // Bubble size: Proportional to percentage
          label: courseName, // Bubble label: Course name
        });
      });
    });

    return bubbleData;
  };

  // Prepare data for the bubble chart
  const bubbleChartData = {
    datasets: [
      {
        label: "Course Enrollment",
        data: processData(),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div>
      <h2>Course History Visualization</h2>
      <div style={{ width: "80%", margin: "0 auto" }}>
        <Bubble
          data={bubbleChartData}
          options={{
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Semester",
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Percentage of Students",
                },
                min: 0,
                max: 100,
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const data = context.raw;
                    return `${data.label}: ${data.y.toFixed(2)}%`;
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
