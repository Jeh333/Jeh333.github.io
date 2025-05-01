import { HashRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FormPage from "./pages/FormPage";
import AppNavbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VisualizationPage from "./pages/VisualizationPage";
import PrivateRoute from "./components/PrivateRoute";
import AccountPage from "./pages/AccountPage";
import Statistics from "./pages/Statistics.js";
import EditPage from "./pages/EditPage.js";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <Router>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route
          path="/visualizer"
          element={<PrivateRoute element={<VisualizationPage />} />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </Router>
  );
}

export default App;
