import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import cropBg from "./crop-bg.jpg";
import { useTranslation } from "react-i18next";

function CropPage() {
  const { t } = useTranslation();
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
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // Prevent pH from going above 14
    if (name === "ph") {
      const numValue = Number(value);
      if (numValue > 14) value = "14";
      if (numValue < 0) value = "0";
    }

    setFormData({
      ...formData,
      [name]: value
    });
    setError("");
  };

  const predictCrop = async () => {
    if (!Object.values(formData).every(val => val !== "")) {
      setError(t("Please fill in all fields"));
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
      setError(t("Backend not connected or invalid data!"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'pdf', 'png', 'jpg', 'jpeg'].includes(fileExt)) {
      setError(t("Please upload a CSV, PDF, or Image file."));
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploading(true);
    setError("");
    setUploadSuccess("");

    try {
      const res = await axios.post("http://127.0.0.1:5000/extract", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const extracted = res.data.data;
      
      // Update formData with extracted values (only values that are not null)
      setFormData(prev => {
        const newData = { ...prev };
        Object.keys(extracted).forEach(key => {
          if (extracted[key] !== null && newData[key] !== undefined) {
             newData[key] = extracted[key];
          }
        });
        return newData;
      });

      setUploadSuccess(t("Data extracted successfully! You can manually fill in any missing fields."));
      e.target.value = null; // Reset input
    } catch (err) {
      setError(err.response?.data?.error || t("Failed to extract data from file."));
    } finally {
      setUploading(false);
    }
  };

  const getStatusIndicator = (nutrient, value) => {
    const numValue = Number(value);
    if (nutrient === "ph") {
      if (numValue >= 6 && numValue <= 7.5) return { status: "optimal", label: t("Optimal pH ✅") };
      if (numValue >= 5.5 && numValue < 6) return { status: "warning", label: t("Slightly Acidic ⚠️") };
      if (numValue > 7.5) return { status: "warning", label: t("Slightly Alkaline ⚠️") };
      return { status: "alert", label: t("Outside Range🔴") };
    }
    if (nutrient === "humidity") {
      if (numValue >= 40 && numValue <= 70) return { status: "optimal", label: t("Ideal Humidity ✅") };
      return { status: "warning", label: t("Check Humidity ⚠️") };
    }
    return null;
  };

  const soilFields = [
    { name: "N", label: t("Nitrogen (N)"), unit: "mg/kg", icon: "🌾" },
    { name: "P", label: t("Phosphorus (P)"), unit: "mg/kg", icon: "🔵" },
    { name: "K", label: t("Potassium (K)"), unit: "mg/kg", icon: "💛" },
    { name: "ph", label: t("pH Level"), unit: "pH", icon: "📊" }
  ];

  const envFields = [
    { name: "temperature", label: t("Temperature"), unit: "°C", icon: "🌡️" },
    { name: "humidity", label: t("Humidity"), unit: "%", icon: "💧" },
    { name: "rainfall", label: t("Rainfall"), unit: "mm", icon: "🌧️" }
  ];

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">{t("Recommended Crop")}</h2>

            {/* Upload Section */}
            <div className="upload-section">
              <div className="upload-card">
                <div className="upload-icon-container">
                  <span className="upload-icon">📄</span>
                </div>
                <div className="upload-content">
                  <h3 className="upload-title">{t("Auto-fill via Document Scan")}</h3>
                  <p className="upload-subtitle">{t("Upload a CSV, report PDF, or image to extract data.")}</p>
                  
                  <label className="upload-btn">
                    <input 
                      type="file" 
                      accept=".csv,.pdf,.png,.jpg,.jpeg" 
                      onChange={handleFileUpload} 
                      style={{display: 'none'}} 
                      disabled={uploading}
                    />
                    {uploading ? (
                      <span className="uploading-text"><span className="spinner"></span>{t("Extracting data...")}</span>
                    ) : (
                      <span className="upload-text">{t("Choose File")}</span>
                    )}
                  </label>
                </div>
              </div>
              
              {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
              {error && <div className="error-message">{error}</div>}
            </div>

            {/* Soil Parameters Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">🧪</span>
                {t("Soil Parameters")}
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
                        placeholder={t("Enter value")}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="form-input"
                        min={field.name === "ph" ? "0" : undefined}
                        max={field.name === "ph" ? "14" : undefined}
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
                {t("Environmental Parameters")}
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
                        placeholder={t("Enter value")}
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

            <div className="button-row">
              <button
                onClick={predictCrop}
                className="predict-button"
                disabled={loading}
              >
                {loading ? t("Analyzing...") : t("Get Crop Recommendation")}
              </button>
            </div>
          </div>

          {result && (
            <div className="result-card" style={{
              backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(232, 245, 233, 0.88) 100%), url(${cropBg})`,
              backgroundSize: 'auto, cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            }}>
              <div className="result-header">
                <h3 className="result-title crop">{t("Recommended Crop")}</h3>
              </div>
              <div className="result-content">
                <div className="crop-name">{result}</div>
                <p className="result-description">
                  {t("Based on your soil nutrients and environmental conditions, this crop is recommended for optimal yield and maximum profitability.")}
                </p>

                {/* Suitability Percentage */}
                <div className="suitability-section">
                  <div className="suitability-title">{t("Crop Suitability Score")}</div>
                  <div className="suitability-bar">
                    <div className="suitability-fill" style={{width: "85%"}}></div>
                  </div>
                  <div style={{fontSize: "0.9rem", color: "#555", marginTop: "8px", display: "flex", justifyContent: "space-between"}}>
                    <span>{t("Strong match")}</span>
                    <span style={{fontWeight: 700, color: "#2d7a3e"}}>85%</span>
                  </div>
                </div>

                {probs && (
                  <div className="probs">
                    <h4>{t("Prediction Probabilities")}</h4>
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

