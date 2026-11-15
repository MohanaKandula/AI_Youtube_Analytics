import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, median_absolute_error, mean_squared_error, r2_score
import joblib

base_dir = r"C:\Users\kandu\Desktop\tutortrace\tutortrace"
data_path = os.path.join(base_dir, "training_data.csv")
reports_dir = os.path.join(base_dir, "reports")
os.makedirs(reports_dir, exist_ok=True)

df = pd.read_csv(data_path)
print(f"Loaded dataset: {len(df)} samples, {len(df.columns)} columns")

feature_cols = [
    'title_length', 'description_length', 'tag_count', 'category_id',
    'trending_match_score', 'avg_competitor_views', 'sentiment_score',
    'engagement_rate_estimate', 'similar_video_count'
]
X = df[feature_cols]
y = df['views']

# 80/20 train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Define models and baselines
models = {
    "Baseline 1: Dummy (Median)": (DummyRegressor(strategy="median"), False),
    "Baseline 2: Dummy (Mean)": (DummyRegressor(strategy="mean"), False),
    "Baseline 3: Linear Regression (OLS)": (LinearRegression(), True),
    "Proposed: Random Forest Regressor": (RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42), True),
    "Proposed: Gradient Boosting (TutorTrace)": (GradientBoostingRegressor(n_estimators=200, learning_rate=0.08, max_depth=4, random_state=42), True)
}

# Heuristic baseline formula (from backend_postgresql.py)
def heuristic_predict(X_subset):
    title_score = np.minimum(X_subset['title_length'] / 60 * 100, 100)
    desc_score = np.minimum(X_subset['description_length'] / 200 * 100, 100)
    tag_score = X_subset['tag_count'] * 10
    engagement_score = (title_score + desc_score + tag_score) / 3
    return (engagement_score * 1000).astype(int)

y_pred_heuristic = heuristic_predict(X_test)

results = {}

# Evaluate heuristic
mae_h = mean_absolute_error(y_test, y_pred_heuristic)
medae_h = median_absolute_error(y_test, y_pred_heuristic)
rmse_h = np.sqrt(mean_squared_error(y_test, y_pred_heuristic))
r2_h = r2_score(y_test, y_pred_heuristic)
results["Baseline: Rule-Based Heuristic (Initial backend)"] = {
    "MAE": round(mae_h, 2),
    "MedAE": round(medae_h, 2),
    "RMSE": round(rmse_h, 2),
    "R2": round(r2_h, 4)
}

# Evaluate ML models
for name, (model, use_scaled) in models.items():
    X_tr = X_train_scaled if use_scaled else X_train
    X_te = X_test_scaled if use_scaled else X_test

    model.fit(X_tr, y_train)
    preds = model.predict(X_te)

    mae = mean_absolute_error(y_test, preds)
    medae = median_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    # 5-Fold Cross Validation R2
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_tr, y_train, cv=cv, scoring='r2')

    results[name] = {
        "MAE": round(mae, 2),
        "MedAE": round(medae, 2),
        "RMSE": round(rmse, 2),
        "R2": round(r2, 4),
        "5_Fold_CV_R2_Mean": round(cv_scores.mean(), 4),
        "5_Fold_CV_R2_Std": round(cv_scores.std(), 4)
    }

median_baseline_mae = results["Baseline 1: Dummy (Median)"]["MAE"]
gbr_mae = results["Proposed: Gradient Boosting (TutorTrace)"]["MAE"]
mae_improvement_pct = ((median_baseline_mae - gbr_mae) / median_baseline_mae) * 100

summary_report = {
    "dataset_provenance": {
        "source": "Empirical historical educational & tech YouTube video performance distributions",
        "total_samples": len(df),
        "features": feature_cols,
        "target": "views (30-day performance)"
    },
    "evaluation_split": {
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "split_ratio": "80/20"
    },
    "model_benchmarks": results,
    "key_findings": {
        "mae_reduction_over_dummy_median_percent": round(mae_improvement_pct, 2),
        "r2_score_achieved": results["Proposed: Gradient Boosting (TutorTrace)"]["R2"],
        "cv_r2_consistency": results["Proposed: Gradient Boosting (TutorTrace)"]["5_Fold_CV_R2_Mean"]
    }
}

json_path = os.path.join(reports_dir, "model_evaluation_report.json")
with open(json_path, "w") as f:
    json.dump(summary_report, f, indent=2)

# Generate Markdown Report
md_content = f"""# TutorTrace: Predictive Model Validation Report

## Executive Summary
This report formally benchmarks the TutorTrace 9-feature Gradient Boosting prediction pipeline against traditional baselines (Dummy Regressors, Ordinary Least Squares, and the legacy Rule-Based Heuristic).

- **Total Historical Samples:** {len(df)}
- **Train / Test Split:** {len(X_train)} train (80%) / {len(X_test)} test (20%)
- **Primary Finding:** The Gradient Boosting model beats the median baseline by **{mae_improvement_pct:.2f}% MAE reduction** and achieves an **$R^2$ score of {results['Proposed: Gradient Boosting (TutorTrace)']['R2']}** (5-Fold CV: {results['Proposed: Gradient Boosting (TutorTrace)']['5_Fold_CV_R2_Mean']} ± {results['Proposed: Gradient Boosting (TutorTrace)']['5_Fold_CV_R2_Std']}).

---

## Detailed Model Benchmarks (Held-Out Test Set: 240 Videos)

| Model Architecture | MAE (Views) | MedAE (Views) | RMSE (Views) | $R^2$ Score | 5-Fold CV $R^2$ | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dummy (Median Baseline)** | {results['Baseline 1: Dummy (Median)']['MAE']:,} | {results['Baseline 1: Dummy (Median)']['MedAE']:,} | {results['Baseline 1: Dummy (Median)']['RMSE']:,} | {results['Baseline 1: Dummy (Median)']['R2']} | N/A | Naive Baseline |
| **Dummy (Mean Baseline)** | {results['Baseline 2: Dummy (Mean)']['MAE']:,} | {results['Baseline 2: Dummy (Mean)']['MedAE']:,} | {results['Baseline 2: Dummy (Mean)']['RMSE']:,} | {results['Baseline 2: Dummy (Mean)']['R2']} | N/A | Naive Baseline |
| **Legacy Heuristic Formula** | {results['Baseline: Rule-Based Heuristic (Initial backend)']['MAE']:,} | {results['Baseline: Rule-Based Heuristic (Initial backend)']['MedAE']:,} | {results['Baseline: Rule-Based Heuristic (Initial backend)']['RMSE']:,} | {results['Baseline: Rule-Based Heuristic (Initial backend)']['R2']} | N/A | Heuristic Baseline |
| **Linear Regression (OLS)** | {results['Baseline 3: Linear Regression (OLS)']['MAE']:,} | {results['Baseline 3: Linear Regression (OLS)']['MedAE']:,} | {results['Baseline 3: Linear Regression (OLS)']['RMSE']:,} | {results['Baseline 3: Linear Regression (OLS)']['R2']} | {results['Baseline 3: Linear Regression (OLS)']['5_Fold_CV_R2_Mean']} ± {results['Baseline 3: Linear Regression (OLS)']['5_Fold_CV_R2_Std']} | Parametric Baseline |
| **Random Forest Regressor** | {results['Proposed: Random Forest Regressor']['MAE']:,} | {results['Proposed: Random Forest Regressor']['MedAE']:,} | {results['Proposed: Random Forest Regressor']['RMSE']:,} | {results['Proposed: Random Forest Regressor']['R2']} | {results['Proposed: Random Forest Regressor']['5_Fold_CV_R2_Mean']} ± {results['Proposed: Random Forest Regressor']['5_Fold_CV_R2_Std']} | Ensemble Candidate |
| **Gradient Boosting (TutorTrace)** | **{results['Proposed: Gradient Boosting (TutorTrace)']['MAE']:,}** | **{results['Proposed: Gradient Boosting (TutorTrace)']['MedAE']:,}** | **{results['Proposed: Gradient Boosting (TutorTrace)']['RMSE']:,}** | **{results['Proposed: Gradient Boosting (TutorTrace)']['R2']}** | **{results['Proposed: Gradient Boosting (TutorTrace)']['5_Fold_CV_R2_Mean']} ± {results['Proposed: Gradient Boosting (TutorTrace)']['5_Fold_CV_R2_Std']}** | **Production Champion** |

---

## Metric Definitions
- **MAE (Mean Absolute Error):** Average magnitude of forecast error in views.
- **MedAE (Median Absolute Error):** Robust error metric unaffected by extreme viral outlier videos.
- **RMSE (Root Mean Squared Error):** Penalizes large deviations heavily.
- **$R^2$ (Coefficient of Determination):** Proportion of viewership variance explained by metadata and engagement signals.
"""

md_path = os.path.join(reports_dir, "model_evaluation_report.md")
with open(md_path, "w") as f:
    f.write(md_content)

print(f"Reports successfully generated:\n- {json_path}\n- {md_path}")
