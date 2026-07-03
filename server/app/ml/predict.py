import pandas as pd
import numpy as np
import joblib
import os
import sys
import json
import argparse

# Model path definition (flash_flood_predictor.joblib is local to app/ml/models/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(SCRIPT_DIR, 'models', 'flash_flood_predictor.joblib')

_MODEL_CACHE = None
_FEATURES_CACHE = None

def load_predictor(model_path=None):
    """
    Loads the trained model and associated feature metadata.
    """
    global _MODEL_CACHE, _FEATURES_CACHE
    if _MODEL_CACHE is None or _FEATURES_CACHE is None:
        if model_path is None:
            model_path = DEFAULT_MODEL_PATH
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file '{model_path}' not found!"
            )
        print(f"[ML Predictor] Loading model from: {model_path}", file=sys.stderr)
        model_data = joblib.load(model_path)
        _MODEL_CACHE = model_data['model']
        _FEATURES_CACHE = model_data['features']
    return _MODEL_CACHE, _FEATURES_CACHE

def get_threat_level(prob):
    """
    Classifies the flood probability into a threat level:
    - Low: 0-25
    - Moderate: 26-50
    - High: 51-75
    - Critical: 76-100
    """
    if prob <= 25.0:
        return "Low"
    elif prob <= 50.0:
        return "Moderate"
    elif prob <= 75.0:
        return "High"
    else:
        return "Critical"

def predict_batch_features(feature_list, model_path=None):
    """
    Performs predictions on a list of feature dictionaries.
    Each dict should contain 'station_id' and the required feature key-value pairs.
    """
    if not feature_list:
        return []
        
    model, features = load_predictor(model_path)
    
    # Extract station_ids
    station_ids = [item.get('station_id') for item in feature_list]
    
    # Convert list of dicts to DataFrame and select feature columns in exact model order
    X = pd.DataFrame(feature_list)[features]
    
    # Predict and clamp probabilities to [0, 100]
    preds = model.predict(X)
    
    results = []
    for station_id, pred in zip(station_ids, preds):
        prob = round(float(np.clip(pred, 0.0, 100.0)), 1)
        results.append({
            "station_id": station_id,
            "probability": prob,
            "threat_level": get_threat_level(prob)
        })
        
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict Flash Flood Probability using Trained XGBoost Model.")
    parser.add_argument('--mode', type=str, choices=['batch-features'], default='batch-features')
    parser.add_argument('--model', type=str, default=None)
    
    args = parser.parse_args()
    
    if args.mode == 'batch-features':
        try:
            input_data = sys.stdin.read()
            if not input_data.strip():
                print(json.dumps([]))
                sys.exit(0)
            feature_list = json.loads(input_data)
            results = predict_batch_features(feature_list, args.model)
            print(json.dumps(results))
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)
