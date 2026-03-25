import React from "react";
import "./App.css";
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import CropPage from "./CropPage";
import FertilizerPage from "./FertilizerPage";
import { useTranslation } from "react-i18next";

function App() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const languages = ['en', 'hi', 'mr'];
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const currentIndex = languages.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex]);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <h1 className="app-title">🌱 {t("Crop Intelligence System")}</h1>
            <p className="app-subtitle">{t("Optimize your farming with AI-powered recommendations")}</p>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <nav style={{display: 'flex', gap: 12}}>
              <Link to="/crop" className={`nav-link ${location.pathname === '/crop' ? 'active' : ''}`}>{t("Recommended Crop")}</Link>
              <Link to="/fertilizer" className={`nav-link ${location.pathname === '/fertilizer' ? 'active' : ''}`}>{t("Recommended Fertilizer")}</Link>
            </nav>
            <button onClick={toggleLanguage} className="language-toggle">
              {currentLang.toUpperCase()}
            </button>
          </div>
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

