from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import math

app = Flask(__name__)
CORS(app)

# Load model and label encoder
with open("crop_model.pkl", "rb") as f:
    model, label_encoder = pickle.load(f)

@app.route("/")
def home():
    return "Crop Intelligence API is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        # Ensure numeric inputs and consistent ordering
        vals = [
            float(data.get("N", 0)), float(data.get("P", 0)), float(data.get("K", 0)),
            float(data.get("temperature", 0)), float(data.get("humidity", 0)),
            float(data.get("ph", 0)), float(data.get("rainfall", 0))
        ]

        features = np.array(vals, dtype=float).reshape(1, -1)

        # Make prediction
        prediction = model.predict(features)
        predicted_label = label_encoder.inverse_transform([prediction[0]])[0]

        # If available, also return prediction probabilities for debugging
        proba_map = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(features)[0]
            try:
                classes = model.classes_
                decoded = label_encoder.inverse_transform(classes)
                proba_map = {str(decoded[i]): float(probs[i]) for i in range(len(probs))}
            except Exception:
                proba_map = None

        # Log for debugging (visible in server console)
        app.logger.debug("Input features: %s", vals)
        app.logger.debug("Predicted: %s", predicted_label)
        if proba_map:
            app.logger.debug("Probabilities: %s", proba_map)

        resp = {"crop": str(predicted_label)}
        if proba_map:
            resp["probs"] = proba_map

        return jsonify(resp)
    except Exception as e:
        app.logger.exception("Prediction error")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 400


def _compute_fertilizer_amount(deficit, fraction):
    # deficit is kg/ha of nutrient needed; fraction is nutrient fraction in fertilizer
    if deficit <= 0:
        return 0.0
    return round(deficit / fraction, 2)


def recommend_fertilizer_for_crop(crop_name, soil):
    # Baseline nutrient requirements (kg/ha) for common crops (approximate)
    # These are rough defaults; override per-crop when available
    base_reqs = {
        "rice": {"N": 100, "P": 40, "K": 40},
        "wheat": {"N": 120, "P": 40, "K": 40},
        "maize": {"N": 140, "P": 60, "K": 60},
        "cotton": {"N": 80, "P": 40, "K": 40},
        "sugarcane": {"N": 160, "P": 60, "K": 120},
        "millet": {"N": 40, "P": 20, "K": 20},
        "lentil": {"N": 20, "P": 20, "K": 20},
        "potato": {"N": 160, "P": 80, "K": 120}
    }

    crop_key = str(crop_name).strip().lower() if crop_name else None
    req = base_reqs.get(crop_key, {"N": 100, "P": 40, "K": 40})

    current_N = float(soil.get("N", 0))
    current_P = float(soil.get("P", 0))
    current_K = float(soil.get("K", 0))

    need_N = max(req["N"] - current_N, 0)
    need_P = max(req["P"] - current_P, 0)
    need_K = max(req["K"] - current_K, 0)

    # Typical fertilizer nutrient fractions (approximate)
    # Urea ~46% N, DAP ~18% P (as P2O5 basis - rough), MOP ~60% K
    # We'll present common fertilizer examples and approximate kg/ha to apply
    sug = {}
    if need_N > 0:
        urea_kg = _compute_fertilizer_amount(need_N, 0.46)
        sug["N"] = {"required_nutrient_kg_per_ha": need_N, "fertilizer": "Urea (46% N)", "fertilizer_kg_per_ha": urea_kg}
    else:
        sug["N"] = {"required_nutrient_kg_per_ha": 0, "message": "No additional N required"}

    if need_P > 0:
        dap_kg = _compute_fertilizer_amount(need_P, 0.18)
        sug["P"] = {"required_nutrient_kg_per_ha": need_P, "fertilizer": "DAP (approx. 18% P)", "fertilizer_kg_per_ha": dap_kg}
    else:
        sug["P"] = {"required_nutrient_kg_per_ha": 0, "message": "No additional P required"}

    if need_K > 0:
        mop_kg = _compute_fertilizer_amount(need_K, 0.6)
        sug["K"] = {"required_nutrient_kg_per_ha": need_K, "fertilizer": "MOP (approx. 60% K)", "fertilizer_kg_per_ha": mop_kg}
    else:
        sug["K"] = {"required_nutrient_kg_per_ha": 0, "message": "No additional K required"}

    # pH advice
    ph = float(soil.get("ph", 7)) if soil.get("ph") is not None else 7.0
    ph_advice = None
    if ph < 5.5:
        ph_advice = "Soil strongly acidic - consider liming to raise pH before fertilizer application."
    elif ph < 6.5:
        ph_advice = "Slightly acidic - monitor pH; some crops prefer this range."
    elif ph > 7.8:
        ph_advice = "Alkaline soil - availability of P may be reduced; consider acidifying amendments if needed."

    return {
        "crop": crop_name,
        "requirements_baseline_kg_per_ha": req,
        "current_soil": {"N": current_N, "P": current_P, "K": current_K, "ph": ph},
        "suggested_additions": sug,
        "ph_advice": ph_advice
    }


@app.route("/fertilizer", methods=["POST"])
def fertilizer():
    try:
        data = request.json or {}

        # If crop not provided, attempt to predict using existing model
        crop = data.get("crop")

        # Gather soil inputs (N, P, K, ph)
        soil = {
            "N": float(data.get("N", 0)),
            "P": float(data.get("P", 0)),
            "K": float(data.get("K", 0)),
            "ph": float(data.get("ph", 7))
        }

        if not crop:
            # Try to use the loaded model to predict crop from available features
            try:
                vals = [soil["N"], soil["P"], soil["K"], float(data.get("temperature", 0)), float(data.get("humidity", 0)), float(soil["ph"]), float(data.get("rainfall", 0))]
                features = np.array(vals, dtype=float).reshape(1, -1)
                pred = model.predict(features)
                crop = label_encoder.inverse_transform([pred[0]])[0]
            except Exception:
                crop = None

        rec = recommend_fertilizer_for_crop(crop, soil)
        return jsonify(rec)
    except Exception as e:
        app.logger.exception("Fertilizer recommendation error")
        return jsonify({"error": "Fertilizer recommendation failed", "details": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)

