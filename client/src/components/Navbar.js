import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function AppNavbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <Navbar className="navbar-custom" variant="light" expand="lg">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">
          Mizzou Course Visualizer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto navbar-nav-custom">
            <Nav.Link as={Link} to="/" className="nav-link-custom">
              Home
            </Nav.Link>

            {token ? (
              <>
                <Nav.Link as={Link} to="/form" className="nav-link-custom">
                  Form
                </Nav.Link>
                <Nav.Link as={Link} to="/visualizer" className="nav-link-custom">
                  Visualizer
                </Nav.Link>
                <Nav.Link as={Link} to="/statistics" className="nav-link-custom">
                  Statistics
                </Nav.Link>
                <Nav.Link as={Link} to="/edit" className="nav-link-custom">
                  Edit
                </Nav.Link>
                <Nav.Link as={Link} to="/account" className="nav-link-custom">
                  Account
                </Nav.Link>
                <Button
                  variant="dark"
                  onClick={handleLogout}
                  size="sm"
                  className="navbar-button"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="nav-link-custom">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/signup" className="nav-link-custom">
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
