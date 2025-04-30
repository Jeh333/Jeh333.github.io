import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function AppNavbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <Navbar
      style={{
        backgroundColor: "#FDB719",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
        padding: "8px 20px",
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
            <Nav.Link as={Link} to="/visualizer" style={{ color: "black" }}>
              Visualizer
            </Nav.Link>
            <Nav.Link as={Link} to="/statistics" style={{ color: "black" }}>
              Statistics
            </Nav.Link>
            <Nav.Link as={Link} to="/edit" style={{ color: "black" }}>
              Edit
            </Nav.Link>

            {token ? (
              <>
                <Nav.Link as={Link} to="/account" style={{ color: "black" }}>
                  Account
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
