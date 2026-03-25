import React from "react";
import "./App.css";
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import CropPage from "./CropPage";
import FertilizerPage from "./FertilizerPage";

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <h1 className="app-title">🌱 Crop Intelligence System</h1>
            <p className="app-subtitle">Optimize your farming with AI-powered recommendations</p>
          </div>

          <nav style={{display: 'flex', gap: 12}}>
            <Link to="/crop" className={`nav-link ${location.pathname === '/crop' ? 'active' : ''}`}>Recommended Crop</Link>
            <Link to="/fertilizer" className={`nav-link ${location.pathname === '/fertilizer' ? 'active' : ''}`}>Recommended Fertilizer</Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/crop" replace />} />
        <Route path="/crop" element={<CropPage />} />
        <Route path="/fertilizer" element={<FertilizerPage />} />
      </Routes>
    </div>
  );
}

export default App;

