import React, { useState } from "react";
import "./App.css";
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import CropPage from "./CropPage";
import FertilizerPage from "./FertilizerPage";
import { useTranslation } from "react-i18next";

function App() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const languageOptions = [
    { code: 'en', name: 'English', icon: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', icon: '🇮🇳' },
    { code: 'mr', name: 'मराठी', icon: '🇮🇳' }
  ];

  const currentLanguage = languageOptions.find(lang => lang.code === i18n.language) || languageOptions[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setShowLanguageMenu(false);
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
            
            <div className="language-selector" style={{position: 'relative'}}>
              <button 
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="language-toggle"
                title="Select Language"
              >
                <span className="language-icon">{currentLanguage.icon}</span>
                <span className="language-name">{currentLanguage.code.toUpperCase()}</span>
              </button>
              
              {showLanguageMenu && (
                <div className="language-dropdown">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
                    >
                      <span className="lang-icon">{lang.icon}</span>
                      <span className="lang-name">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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

