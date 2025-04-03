import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Insights from "./components/Insights";
import Survey from "./components/Survey";
import SurveyResponse from "./components/SurveyResponse";
import Analytics from "./components/Analytics";
import Teams from "./components/Teams";
import { SurveyProvider } from "./context/SurveyContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useTheme } from "./context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";
import "./App.css";

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {isDarkMode ? <FaSun /> : <FaMoon />}
    </button>
  );
};

function App() {
  return (

    <div className="App">
      <ThemeProvider>
        <SurveyProvider>
          <Router>
            <Routes>
              <Route path="/survey/:surveyId" element={<SurveyResponse />} />
              <Route path="*" element={
                <div className="app-container">
                  {/* Fixed Sidebar */}
                  <Sidebar />
                  
                  {/* Theme Toggle */}
                  <ThemeToggle />

                  {/* Scrollable Main Content */}
                  <div className="main-content">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/teams" element={<Teams />} />
                      <Route path="/surveys" element={<Survey />} />
                      <Route path="/analytics" element={<Analytics />} />
                    </Routes>
                  </div>
                </div>
              } />
            </Routes>
          </Router>
        </SurveyProvider>
      </ThemeProvider>
    </div>

  );
}

export default App;
