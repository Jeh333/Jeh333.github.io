import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

function VisualizationPage() {
  const svgRef = useRef();

  useEffect(() => {
    const fetchDataAndRender = async () => {
      try {
        const res = await axios.get(`${API_URL}/course-histories`);
        const histories = res.data;

        const nodes = [];
        const links = [];
        const nodeSet = new Set();

        histories.forEach((history) => {
          history.courses.forEach((course) => {
            const semester = course.semester;
            const courseId = course.programId;
            const uniqueCourseId = `${courseId} (${semester})`;

            if (!nodeSet.has(semester)) {
              nodes.push({ id: semester, group: "semester" });
              nodeSet.add(semester);
            }

            if (!nodeSet.has(uniqueCourseId)) {
              nodes.push({
                id: uniqueCourseId,
                group: "course",
                grade: course.grade,
              });
              nodeSet.add(uniqueCourseId);
            }

            links.push({ source: semester, target: uniqueCourseId });
          });
        });

        drawGraph(nodes, links);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    const drawGraph = (nodes, links) => {
      const width = window.innerWidth;
      const height = window.innerHeight * 0.75;

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      svg.selectAll("*").remove(); // Clear previous graph

      // Container for zoom and pan
      const container = svg.append("g");

      // Enable zoom and pan
      svg.call(
        d3.zoom().on("zoom", (event) => {
          container.attr("transform", event.transform);
        })
      );

      // Simulation setup
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(100)
        )
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));

      // Draw links
      const link = container
        .append("g")
        .attr("stroke", "#aaa")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.5);

      // Draw nodes
      const node = container
        .append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 8)
        .attr("fill", (d) => (d.group === "semester" ? "#1f77b4" : "#ff7f0e"))
        .on("click", (event, d) => {
          if (d.group === "course") {
            alert(`${d.id}\nGrade: ${d.grade}`);
          } else {
            alert(`Semester: ${d.id}`);
          }
        })
        .call(
          d3
            .drag()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
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

      // Add labels
      const label = container
        .append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text((d) => d.id)
        .attr("font-size", 10)
        .attr("dx", 10)
        .attr("dy", ".35em");

      // Tick update
      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        label.attr("x", (d) => d.x).attr("y", (d) => d.y);
      });
    };

    fetchDataAndRender();
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "center", marginTop: "1rem" }}>
        Course Visualizer
      </h2>
      <svg ref={svgRef} style={{ display: "block", margin: "0 auto" }}></svg>
    </div>
  );
}

export default VisualizationPage;
