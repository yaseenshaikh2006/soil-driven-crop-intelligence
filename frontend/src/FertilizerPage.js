import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import cropBg from "./crop-bg.jpg";

function FertilizerPage() {
  const [formData, setFormData] = useState({
    N: "",
    P: "",
    K: "",
    temperature: "",
    humidity: "",
    ph: "",
    rainfall: ""
  });

  const [fertilizerResult, setFertilizerResult] = useState(null);
  const [fertilizerLoading, setFertilizerLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const getFertilizer = async () => {
    setFertilizerLoading(true);
    setFertilizerResult(null);
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:5000/fertilizer", {
        N: Number(formData.N || 0),
        P: Number(formData.P || 0),
        K: Number(formData.K || 0),
        ph: Number(formData.ph || 7),
        temperature: Number(formData.temperature || 0),
        humidity: Number(formData.humidity || 0),
        rainfall: Number(formData.rainfall || 0)
      });

      setFertilizerResult(res.data);
    } catch (err) {
      setError("Fertilizer endpoint not reachable or returned error.");
    } finally {
      setFertilizerLoading(false);
    }
  };

  const getStatusIndicator = (nutrient, value) => {
    const numValue = Number(value);
    if (nutrient === "ph") {
      if (numValue >= 6 && numValue <= 7.5) return { status: "optimal", label: "Optimal pH ✅" };
      if (numValue >= 5.5 && numValue < 6) return { status: "warning", label: "Slightly Acidic ⚠️" };
      if (numValue > 7.5) return { status: "warning", label: "Slightly Alkaline ⚠️" };
      return { status: "alert", label: "Outside Range 🔴" };
    }
    if (nutrient === "humidity") {
      if (numValue >= 40 && numValue <= 70) return { status: "optimal", label: "Ideal Humidity ✅" };
      return { status: "warning", label: "Check Humidity ⚠️" };
    }
    return null;
  };

  const soilFields = [
    { name: "N", label: "Nitrogen (N)", unit: "mg/kg", icon: "🌾" },
    { name: "P", label: "Phosphorus (P)", unit: "mg/kg", icon: "🔵" },
    { name: "K", label: "Potassium (K)", unit: "mg/kg", icon: "💛" },
    { name: "ph", label: "pH Level", unit: "pH", icon: "📊" }
  ];

  const envFields = [
    { name: "temperature", label: "Temperature", unit: "°C", icon: "🌡️" },
    { name: "humidity", label: "Humidity", unit: "%", icon: "💧" },
    { name: "rainfall", label: "Rainfall", unit: "mm", icon: "🌧️" }
  ];

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Recommended Fertilizer</h2>

            {/* Soil Parameters Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">🧪</span>
                Soil Parameters
              </div>
              <div className="form-grid">
                {soilFields.map((field) => (
                  <div key={field.name} className="form-group">
                    <label htmlFor={field.name} className="form-label">
                      <span className="input-icon">{field.icon}</span>
                      {field.label}
                    </label>
                    <div className="input-wrapper">
                      <input
                        id={field.name}
                        name={field.name}
                        type="number"
                        placeholder="Enter value"
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="form-input"
                      />
                      <span className="input-unit">{field.unit}</span>
                    </div>
                    {formData[field.name] && getStatusIndicator(field.name, formData[field.name]) && (
                      <span className={`status-indicator ${getStatusIndicator(field.name, formData[field.name]).status}`}>
                        {getStatusIndicator(field.name, formData[field.name]).label}
                      </span>
                    )}
                    {formData[field.name] && ["N", "P", "K"].includes(field.name) && (
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${Math.min(Number(formData[field.name]) / 100 * 100, 100)}%`}}></div>
                        </div>
                        <span className="progress-value">{formData[field.name]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental Parameters Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">🌍</span>
                Environmental Parameters
              </div>
              <div className="form-grid full">
                {envFields.map((field) => (
                  <div key={field.name} className="form-group">
                    <label htmlFor={field.name} className="form-label">
                      <span className="input-icon">{field.icon}</span>
                      {field.label}
                    </label>
                    <div className="input-wrapper">
                      <input
                        id={field.name}
                        name={field.name}
                        type="number"
                        placeholder="Enter value"
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="form-input"
                      />
                      <span className="input-unit">{field.unit}</span>
                    </div>
                    {formData[field.name] && getStatusIndicator(field.name, formData[field.name]) && (
                      <span className={`status-indicator ${getStatusIndicator(field.name, formData[field.name]).status}`}>
                        {getStatusIndicator(field.name, formData[field.name]).label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-row">
              {(() => {
                const hasNPK = formData.N !== "" || formData.P !== "" || formData.K !== "";
                const disabled = fertilizerLoading || !hasNPK;
                return (
                  <button
                    onClick={getFertilizer}
                    className="fertilizer-button"
                    disabled={disabled}
                    title={disabled ? 'Provide N, P or K to enable fertilizer recommendation' : 'Get fertilizer recommendation'}
                    aria-busy={fertilizerLoading}
                  >
                    {fertilizerLoading ? 'Calculating...' : 'Get Fertilizer Recommendation'}
                  </button>
                );
              })()}
            </div>
          </div>

          {fertilizerResult && (
            <div className="result-card" style={{
              backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(232, 245, 233, 0.88) 100%), url(${cropBg})`,
              backgroundSize: 'auto, cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            }}>
              <div className="result-header">
                <h3 className="result-title fertilizer">Fertilizer Recommendation</h3>
              </div>
              <div className="result-content">
                <h4 style={{marginBottom: 16, color: "#2d7a3e", fontSize: "1.2rem"}}>
                  Crop: <span style={{fontWeight: 700}}>{fertilizerResult.crop || '—'}</span>
                </h4>

                {/* Baseline vs Current Soil */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25}}>
                  <div className="info-box" style={{background: "#e8f5e9", padding: 16, borderRadius: 12}}>
                    <strong style={{color: "#2d7a3e", display: "flex", alignItems: "center", gap: 8, marginBottom: 12}}>
                      📈 Baseline Requirements (kg/ha)
                    </strong>
                    <ul style={{listStyle: "none", padding: 0, margin: 0}}>
                      {Object.entries(fertilizerResult.requirements_baseline_kg_per_ha || {}).map(([k, v]) => (
                        <li key={k} style={{padding: 6, display: "flex", justifyContent: "space-between", borderBottom: "1px solid #c8e6c9"}}>
                          <span style={{fontWeight: 500}}>{k}</span>
                          <span style={{fontWeight: 700, color: "#2d7a3e"}}>{v} kg/ha</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="info-box" style={{background: "#f0f9ff", padding: 16, borderRadius: 12}}>
                    <strong style={{color: "#2d7a3e", display: "flex", alignItems: "center", gap: 8, marginBottom: 12}}>
                      💧 Current Soil (Measured)
                    </strong>
                    <ul style={{listStyle: "none", padding: 0, margin: 0}}>
                      {Object.entries(fertilizerResult.current_soil || {}).map(([k, v]) => (
                        <li key={k} style={{padding: 6, display: "flex", justifyContent: "space-between", borderBottom: "1px solid #b3e5fc"}}>
                          <span style={{fontWeight: 500}}>{k}</span>
                          <span style={{fontWeight: 700, color: "#0277bd"}}>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested Additions */}
                <div className="fertilizer-table">
                  <strong style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#2d7a3e", fontSize: "1.1rem"}}>
                    🌿 Suggested Fertilizer Additions
                  </strong>
                  <div className="nutrient-rows">
                    {Object.entries(fertilizerResult.suggested_additions || {}).map(([nutrient, info]) => (
                      <div className="nutrient-row" key={nutrient}>
                        <div className="nutrient-col"><strong>{nutrient}</strong></div>
                        <div className="nutrient-col">
                          {info.required_nutrient_kg_per_ha ? `${info.required_nutrient_kg_per_ha} kg/ha` : info.message}
                        </div>
                        <div className="nutrient-col">
                          {info.fertilizer ? `${info.fertilizer} — ${info.fertilizer_kg_per_ha} kg/ha` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* pH Advice */}
                {fertilizerResult.ph_advice && (
                  <div className="ph-advice">
                    {fertilizerResult.ph_advice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FertilizerPage;

