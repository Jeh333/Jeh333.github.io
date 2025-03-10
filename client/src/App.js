import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FormPage from "./pages/FormPage";
import AppNavbar from "./components/Navbar"; 

function App() {
  return (
    <Router>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />  {/* Home now shows HomePage instead of form */}
        <Route path="/form" element={<FormPage />} />  {/* Form is now linked to /form */}
      </Routes>
    </Router>
  );
}

export default App;

