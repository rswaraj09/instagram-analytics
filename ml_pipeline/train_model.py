"""
Train Machine Learning Models on top_insta_influencers_data.csv
Parses raw dataset, cleans metrics, trains regression models, and exports trained model artifacts.
"""

import csv
import json
import math
import os
import random
import sys
from typing import Dict, List, Tuple

# Attempt UTF-8 reconfiguration for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def safe_print(msg: str):
    """Safely print text containing Unicode characters on legacy Windows terminals."""
    try:
        print(msg)
    except UnicodeEncodeError:
        # Fallback for terminals that do not support unicode checkmarks
        clean_msg = msg.replace("✓", "[OK]")
        print(clean_msg)

def parse_suffix_number(val_str: str) -> float:
    """Converts strings like '475.8m', '29.0b', '3.3k', '1.39%' to floating point numbers."""
    if not val_str or str(val_str).strip().lower() in ["", "nan", "null", "none"]:
        return 0.0
    
    clean_str = str(val_str).strip().replace("%", "").lower()
    if clean_str in ["nan", "null", "none"]:
        return 0.0

    multiplier = 1.0

    if clean_str.endswith("k"):
        multiplier = 1e3
        clean_str = clean_str[:-1]
    elif clean_str.endswith("m"):
        multiplier = 1e6
        clean_str = clean_str[:-1]
    elif clean_str.endswith("b"):
        multiplier = 1e9
        clean_str = clean_str[:-1]

    try:
        res = float(clean_str) * multiplier
        return 0.0 if math.isnan(res) or math.isinf(res) else res
    except ValueError:
        return 0.0

def load_and_preprocess_dataset(csv_path: str = None) -> List[Dict[str, float]]:
    """Reads top_insta_influencers_data.csv and returns cleaned numeric features."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        csv_path,
        os.path.join(base_dir, "..", "Dataset", "top_insta_influencers_data.csv"),
        os.path.join(base_dir, "Dataset", "top_insta_influencers_data.csv"),
        "../Dataset/top_insta_influencers_data.csv",
        "./Dataset/top_insta_influencers_data.csv",
        "Dataset/top_insta_influencers_data.csv"
    ]
    possible_paths = [p for p in possible_paths if p]
    actual_path = None
    for p in possible_paths:
        if os.path.exists(p):
            actual_path = p
            break

    if not actual_path:
        raise FileNotFoundError(f"Dataset top_insta_influencers_data.csv not found in any of {possible_paths}")

    dataset = []
    with open(actual_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            parsed_row = {
                "rank": parse_suffix_number(row.get("rank", "0")),
                "channel_info": row.get("channel_info", ""),
                "influence_score": parse_suffix_number(row.get("influence_score", "0")),
                "posts": parse_suffix_number(row.get("posts", "0")),
                "followers": parse_suffix_number(row.get("followers", "0")),
                "avg_likes": parse_suffix_number(row.get("avg_likes", "0")),
                "eng_rate_60_day": parse_suffix_number(row.get("60_day_eng_rate", "0")),
                "new_post_avg_like": parse_suffix_number(row.get("new_post_avg_like", "0")),
                "total_likes": parse_suffix_number(row.get("total_likes", "0")),
                "country": row.get("country", "")
            }
            dataset.append(parsed_row)

    safe_print(f"✓ Loaded {len(dataset)} influencer rows from CSV.")
    return dataset

try:
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

class InfluencerRidgeModel:
    """Robust Ridge Regression Model for Influencer Impact Scoring."""
    def __init__(self, feature_names: List[str]):
        self.feature_names = feature_names
        self.weights = [0.0] * len(feature_names)
        self.bias = 0.0
        self.mean_x = [0.0] * len(feature_names)
        self.std_x = [1.0] * len(feature_names)
        self.mean_y = 0.0
        self.std_y = 1.0
        if HAS_SKLEARN:
            self.scaler = StandardScaler()
            self.model = Ridge(alpha=20.0)

    def fit(self, X: List[List[float]], y: List[float]):
        n = len(X)
        num_features = len(self.feature_names)

        if HAS_SKLEARN:
            X_scaled = self.scaler.fit_transform(X)
            self.model.fit(X_scaled, y)
            self.weights = list(self.model.coef_)
            self.bias = float(self.model.intercept_)
            self.mean_x = list(self.scaler.mean_)
            self.std_x = list(self.scaler.scale_)
            self.mean_y = float(sum(y) / len(y))
            self.std_y = 1.0
        else:
            # Custom fallback normalization and ridge fit calculation
            for j in range(num_features):
                col = [X[i][j] for i in range(n)]
                self.mean_x[j] = sum(col) / n
                var = sum((x - self.mean_x[j]) ** 2 for x in col) / n
                self.std_x[j] = math.sqrt(var) if var > 1e-9 else 1.0

            self.mean_y = sum(y) / n
            self.bias = self.mean_y

            # Standalone gradient descent update for fallback
            lr = 0.01
            X_norm = [
                [(X[i][j] - self.mean_x[j]) / self.std_x[j] for j in range(num_features)]
                for i in range(n)
            ]
            weights = [0.0] * num_features
            bias = self.mean_y
            for _ in range(500):
                w_grads = [0.0] * num_features
                b_grad = 0.0
                for i in range(n):
                    pred = sum(weights[j] * X_norm[i][j] for j in range(num_features)) + bias
                    err = pred - y[i]
                    for j in range(num_features):
                        w_grads[j] += err * X_norm[i][j]
                    b_grad += err
                for j in range(num_features):
                    weights[j] -= lr * (w_grads[j] / n + 0.1 * weights[j])
                bias -= lr * (b_grad / n)

            self.weights = weights
            self.bias = bias

    def predict(self, X_sample: List[List[float]]) -> List[float]:
        num_features = len(self.feature_names)
        if HAS_SKLEARN:
            X_scaled = self.scaler.transform(X_sample)
            preds = self.model.predict(X_scaled)
            return [float(p) for p in preds]
        else:
            preds = []
            for x in X_sample:
                x_norm = [(x[j] - self.mean_x[j]) / self.std_x[j] for j in range(num_features)]
                pred = sum(self.weights[j] * x_norm[j] for j in range(num_features)) + self.bias
                preds.append(pred)
            return preds

def train_and_save_models(csv_path: str = None, output_dir: str = None):
    """Main training routine: cleans data, fits models, evaluates metrics, and exports weights."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if output_dir is None:
        output_dir = os.path.join(base_dir, "models_artifacts")

    os.makedirs(output_dir, exist_ok=True)
    dataset = load_and_preprocess_dataset(csv_path)

    # Feature matrix X with log scaling & engineered interactions
    feature_keys = [
        "log_followers",
        "log_posts",
        "log_avg_likes",
        "eng_rate_60_day",
        "log_new_post_avg_like",
        "log_total_likes",
        "follower_likes_interaction"
    ]
    
    X = []
    for row in dataset:
        f_log = math.log1p(row["followers"])
        p_log = math.log1p(row["posts"])
        al_log = math.log1p(row["avg_likes"])
        eng = row["eng_rate_60_day"]
        nl_log = math.log1p(row["new_post_avg_like"])
        tl_log = math.log1p(row["total_likes"])
        
        X.append([
            f_log,
            p_log,
            al_log,
            eng,
            nl_log,
            tl_log,
            f_log * al_log
        ])

    # Target y: influence_score
    y = [row["influence_score"] for row in dataset]

    # Train / Test split
    combined = list(zip(X, y))
    random.seed(42)
    random.shuffle(combined)
    split_idx = int(len(combined) * 0.8)
    train_data = combined[:split_idx]
    test_data = combined[split_idx:]

    X_train, y_train = zip(*train_data)
    X_test, y_test = zip(*test_data)

    model = InfluencerRidgeModel(feature_keys)
    model.fit(list(X_train), list(y_train))

    # Evaluate model metrics
    predictions = model.predict(list(X_test))
    mae = sum(abs(p - actual) for p, actual in zip(predictions, y_test)) / len(y_test)
    rmse = math.sqrt(sum((p - actual) ** 2 for p, actual in zip(predictions, y_test)) / len(y_test))

    mean_y_test = sum(y_test) / len(y_test)
    ss_tot = sum((actual - mean_y_test) ** 2 for actual in y_test)
    ss_res = sum((actual - p) ** 2 for p, actual in zip(predictions, y_test))
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

    safe_print("==========================================")
    safe_print("      TRAINED MODEL EVALUATION RESULTS    ")
    safe_print("==========================================")
    safe_print(f"✓ Train Samples: {len(X_train)} | Test Samples: {len(X_test)}")
    safe_print(f"✓ Mean Absolute Error (MAE): {mae:.4f}")
    safe_print(f"✓ Root Mean Squared Error (RMSE): {rmse:.4f}")
    safe_print(f"✓ R² Score: {r2:.4f}")

    # Export model artifact
    model_artifact = {
        "feature_names": model.feature_names,
        "weights": [round(w, 4) for w in model.weights],
        "bias": round(model.bias, 4),
        "mean_x": [round(m, 4) for m in model.mean_x],
        "std_x": [round(s, 4) for s in model.std_x],
        "mean_y": round(model.mean_y, 4),
        "std_y": round(model.std_y, 4),
        "metrics": {"mae": round(mae, 4), "rmse": round(rmse, 4), "r2": round(r2, 4)}
    }

    artifact_path = os.path.normpath(os.path.join(output_dir, "influencer_influence_model.json"))
    with open(artifact_path, "w", encoding="utf-8") as f:
        json.dump(model_artifact, f, indent=2)

    safe_print(f"✓ Model successfully saved to {artifact_path}")
    safe_print("==========================================")

if __name__ == "__main__":
    train_and_save_models()

