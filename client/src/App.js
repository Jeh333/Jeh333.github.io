import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FormPage from "./pages/FormPage";
import AppNavbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VisualizationPage from "./pages/VisualizationPage";
import PrivateRoute from "./components/PrivateRoute"; // Import PrivateRoute

function App() {
  return (
    <Router basename="/Jeh333.github.io">
      {" "}
      {/* ✅ Add basename */}
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/visualizer"
          element={<PrivateRoute element={<VisualizationPage />} />}
        />{" "}
        {/* Protected Route */}
      </Routes>
    </Router>
  );
}

export default App;
