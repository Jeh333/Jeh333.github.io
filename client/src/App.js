import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FormPage from "./pages/FormPage";
import FormPage_demo from "./pages/FormPage_demo";
import AppNavbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VisualizationPage from "./pages/VisualizationPage";
import PrivateRoute from "./components/PrivateRoute";
import AccountPage from "./pages/AccountPage";

function App() {
  return (
    <Router>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/form-demo" element={<FormPage_demo />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/visualizer"
          element={<PrivateRoute element={<VisualizationPage />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
