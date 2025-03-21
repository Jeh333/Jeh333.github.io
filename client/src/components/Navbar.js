import React, { useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function AppNavbar() {
  // This should eventually come from your authentication context/state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleProtectedLink = (e, path) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

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
             
            {/* Protected Route with login prompt */}
            <Nav.Link 
              onClick={(e) => handleProtectedLink(e, '/dashboard')} 
              style={{ color: "black" }}
            >
              MyHome
            </Nav.Link>

            {/* Unprotected Form link */}
            <Nav.Link as={Link} to="/form" style={{ color: "black" }}>
              MyForm
            </Nav.Link>

            <Nav.Link as={Link} to="/about" style={{ color: "black" }}>About</Nav.Link>
            <Nav.Link as={Link} to="/contact" style={{ color: "black" }}>Contact</Nav.Link>


            <NavDropdown 
              title={isLoggedIn ? "My Account" : "Account"} 
              id="account-nav-dropdown" 
              style={{ color: "black" }}
            >
              {isLoggedIn ? (
                <>
                  <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/settings">Settings</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={() => setIsLoggedIn(false)}>Logout</NavDropdown.Item>
                </>
              ) : (
                <>
                  <NavDropdown.Item as={Link} to="/login">Login</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/signup">Sign Up</NavDropdown.Item>
                </>
              )}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
