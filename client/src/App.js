//Command to start: <npm start>
import React from 'react';
import './App.css';
import Login from './components/login/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<h1>Welcome to the Home Page!</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
