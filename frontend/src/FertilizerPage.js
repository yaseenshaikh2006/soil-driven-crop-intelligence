import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function FertilizerPage() {
  const [formData, setFormData] = useState({
    crop: "",
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

  const getFertilizer = async () => {
    setFertilizerLoading(true);
    setFertilizerResult(null);
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:5000/fertilizer", {
        crop: formData.crop.trim() || undefined,
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'pdf', 'png', 'jpg', 'jpeg'].includes(fileExt)) {
      setError("Please upload a CSV, PDF, or Image file.");
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

      setUploadSuccess("Data extracted successfully! You can manually fill in any missing fields.");
      e.target.value = null; // Reset input
    } catch (err) {
      setError(err.response?.data?.error || "Failed to extract data from file.");
    } finally {
      setUploading(false);
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

            {/* Upload Section */}
            <div className="upload-section">
              <div className="upload-card">
                <div className="upload-icon-container">
                  <span className="upload-icon">📄</span>
                </div>
                <div className="upload-content">
                  <h3 className="upload-title">Auto-fill via Document Scan</h3>
                  <p className="upload-subtitle">Upload a CSV, report PDF, or image to extract data.</p>
                  
                  <label className="upload-btn">
                    <input 
                      type="file" 
                      accept=".csv,.pdf,.png,.jpg,.jpeg" 
                      onChange={handleFileUpload} 
                      style={{display: 'none'}} 
                      disabled={uploading}
                    />
                    {uploading ? (
                      <span className="uploading-text"><span className="spinner"></span>Extracting data...</span>
                    ) : (
                      <span className="upload-text">Choose File</span>
                    )}
                  </label>
                </div>
              </div>
              
              {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
              {error && <div className="error-message">{error}</div>}
            </div>

            {/* Crop Intent Section */}
            <div className="form-section" style={{marginBottom: "20px"}}>
              <div className="section-header">
                <span className="section-icon">🌱</span>
                Target Crop
              </div>
              <div className="form-group" style={{maxWidth: "100%"}}>
                <label htmlFor="crop" className="form-label">
                  What crop do you want to grow?
                </label>
                <input
                  id="crop"
                  name="crop"
                  type="text"
                  placeholder="e.g. Rice, Wheat, Cotton (Optional)"
                  value={formData.crop}
                  onChange={handleChange}
                  className="form-input"
                  style={{width: "100%", padding: "12px", background: "#f8f9fa", border: "1px solid #e2e8f0"}}
                />
              </div>
            </div>

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
            <div className="result-card">
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

