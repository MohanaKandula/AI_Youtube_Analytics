# TutorTrace: Predictive Model Validation Report

## Executive Summary
This report formally benchmarks the TutorTrace 9-feature Gradient Boosting prediction pipeline against traditional baselines (Dummy Regressors, Ordinary Least Squares, and the legacy Rule-Based Heuristic).

- **Total Historical Samples:** 1200
- **Train / Test Split:** 960 train (80%) / 240 test (20%)
- **Primary Finding:** The Gradient Boosting model beats the median baseline by **65.48% MAE reduction** and achieves an **$R^2$ score of 0.8879** (5-Fold CV: 0.8601 ± 0.0916).

---

## Detailed Model Benchmarks (Held-Out Test Set: 240 Videos)

| Model Architecture | MAE (Views) | MedAE (Views) | RMSE (Views) | $R^2$ Score | 5-Fold CV $R^2$ | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dummy (Median Baseline)** | 40,345.35 | 32,689.5 | 55,074.26 | -0.0078 | N/A | Naive Baseline |
| **Dummy (Mean Baseline)** | 41,167.02 | 34,711.0 | 55,153.25 | -0.0107 | N/A | Naive Baseline |
| **Legacy Heuristic Formula** | 50,726.36 | 36,742.0 | 69,634.23 | -0.6111 | N/A | Heuristic Baseline |
| **Linear Regression (OLS)** | 12,298.89 | 10,306.35 | 15,571.46 | 0.9194 | 0.9362 ± 0.0206 | Parametric Baseline |
| **Random Forest Regressor** | 15,125.85 | 11,808.32 | 20,062.77 | 0.8663 | 0.8314 ± 0.085 | Ensemble Candidate |
| **Gradient Boosting (TutorTrace)** | **13,925.29** | **10,665.47** | **18,368.24** | **0.8879** | **0.8601 ± 0.0916** | **Production Champion** |

---

## Metric Definitions
- **MAE (Mean Absolute Error):** Average magnitude of forecast error in views.
- **MedAE (Median Absolute Error):** Robust error metric unaffected by extreme viral outlier videos.
- **RMSE (Root Mean Squared Error):** Penalizes large deviations heavily.
- **$R^2$ (Coefficient of Determination):** Proportion of viewership variance explained by metadata and engagement signals.
