import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function CropPage() {
  const [formData, setFormData] = useState({
    N: "",
    P: "",
    K: "",
    temperature: "",
    humidity: "",
    ph: "",
    rainfall: ""
  });

  const [result, setResult] = useState("");
  const [probs, setProbs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const predictCrop = async () => {
    if (!Object.values(formData).every(val => val !== "")) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setProbs(null);
    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", {
        N: Number(formData.N),
        P: Number(formData.P),
        K: Number(formData.K),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        ph: Number(formData.ph),
        rainfall: Number(formData.rainfall)
      });

      setResult(res.data.crop);
      setProbs(res.data.probs || null);
    } catch (error) {
      setError("Backend not connected or invalid data!");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndicator = (nutrient, value) => {
    const numValue = Number(value);
    if (nutrient === "ph") {
      if (numValue >= 6 && numValue <= 7.5) return { status: "optimal", label: "Optimal pH ✅" };
      if (numValue >= 5.5 && numValue < 6) return { status: "warning", label: "Slightly Acidic ⚠️" };
      if (numValue > 7.5) return { status: "warning", label: "Slightly Alkaline ⚠️" };
      return { status: "alert", label: "Outside Range🔴" };
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
            <h2 className="form-title">Recommended Crop</h2>

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
              <button
                onClick={predictCrop}
                className="predict-button"
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Get Crop Recommendation"}
              </button>
            </div>
          </div>

          {result && (
            <div className="result-card">
              <div className="result-header">
                <h3 className="result-title crop">Recommended Crop</h3>
              </div>
              <div className="result-content">
                <div className="crop-name">{result}</div>
                <p className="result-description">
                  Based on your soil nutrients and environmental conditions, this crop is recommended for optimal yield and maximum profitability.
                </p>

                {/* Suitability Percentage */}
                <div className="suitability-section">
                  <div className="suitability-title">Crop Suitability Score</div>
                  <div className="suitability-bar">
                    <div className="suitability-fill" style={{width: "85%"}}></div>
                  </div>
                  <div style={{fontSize: "0.9rem", color: "#555", marginTop: "8px", display: "flex", justifyContent: "space-between"}}>
                    <span>Strong match</span>
                    <span style={{fontWeight: 700, color: "#2d7a3e"}}>85%</span>
                  </div>
                </div>

                {probs && (
                  <div className="probs">
                    <h4>Prediction Probabilities</h4>
                    <ul>
                      {Object.entries(probs).map(([cropName, p]) => (
                        <li key={cropName}>
                          <span>{cropName}</span>
                          <strong>{(p * 100).toFixed(1)}%</strong>
                        </li>
                      ))}
                    </ul>
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

export default CropPage;

