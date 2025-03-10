import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Container className="mt-4">
        <Outlet />  {/* This is where the page content will render */}
      </Container>
      <footer className="bg-dark text-white text-center py-3 mt-4">
        &copy; {new Date().getFullYear()} WebApp
      </footer>
    </div>
  );
}

export default Layout;
