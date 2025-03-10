import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

function AppNavbar() {
  return (
    <Navbar 
      style={{ 
        backgroundColor: "#FDB719", 
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",  /* Adds depth */
        padding: "8px 20px" /* Increases navbar height */
      }} 
      variant="light" 
      expand="lg"
    >
      <Container fluid>
        <Navbar.Brand as={Link} to="/" style={{ color: "black", fontWeight: "bold", marginRight: "auto" }}>
          Mizzou Course Visualizer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto" style={{ gap: "20px", marginRight: "20px" }}>
            <Nav.Link as={Link} to="/" style={{ color: "black" }}>Home</Nav.Link>
            <Nav.Link as={Link} to="/form" style={{ color: "black" }}>Form</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
