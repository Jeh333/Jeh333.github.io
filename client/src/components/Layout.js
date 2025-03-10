import { Navbar, Nav, Container } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="/">WebApp</Navbar.Brand>
          <Nav className="ml-auto">
            <LinkContainer to="/login">
              <Nav.Link>Login</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/account">
              <Nav.Link>Account</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/form">
              <Nav.Link>Form</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/compare">
              <Nav.Link>Compare</Nav.Link>
            </LinkContainer>
          </Nav>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Outlet />
      </Container>
      <footer className="bg-dark text-white text-center py-3 mt-4">
        &copy; {new Date().getFullYear()} WebApp
      </footer>
    </div>
  );
}

export default Layout;
