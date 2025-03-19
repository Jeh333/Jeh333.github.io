import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function AppNavbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // Check if user is logged in

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from storage
    localStorage.removeItem("userId");
    navigate("/login"); // Redirect to login page
  };

  return (
    <Navbar
      style={{
        backgroundColor: "#FDB719", // Mizzou Gold
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)", // Adds depth
        padding: "8px 20px", // Increases navbar height
      }}
      variant="light"
      expand="lg"
    >
      <Container fluid>
        <Navbar.Brand
          as={Link}
          to="/"
          style={{
            color: "black",
            fontWeight: "bold",
            marginRight: "auto",
          }}
        >
          Mizzou Course Visualizer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto" style={{ gap: "20px", marginRight: "20px" }}>
            <Nav.Link as={Link} to="/" style={{ color: "black" }}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/form" style={{ color: "black" }}>
              Form
            </Nav.Link>

            {/* Show these links only when user is logged in */}
            {token ? (
              <>
                <Nav.Link as={Link} to="/visualizer" style={{ color: "black" }}>
                  Visualizer
                </Nav.Link>
                <Button variant="dark" onClick={handleLogout} size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" style={{ color: "black" }}>
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/signup" style={{ color: "black" }}>
                  Sign Up
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
