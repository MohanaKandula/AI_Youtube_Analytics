# Automated Test Suite & Coverage Report

## 1. Summary
The automated test suite provides regression protection across authentication, security, input sanitization, caching, prediction inference, and channel analytics.

- **Test Framework:** `pytest 9.1.1` + `pytest-cov 7.1.0`
- **Total Test Count:** 32 tests
- **Pass Rate:** 100% (32 passed, 0 failed, 0 skipped)
- **Backend Statements Covered:** 631 statements (32% statement coverage across `app.py`)
- **Execution Time:** ~7.2 seconds

---

## 2. Test Suite Directory Structure

| Test File | Focus Area | Test Count | Key Invariants Tested |
| :--- | :--- | :--- | :--- |
| [`test_auth_and_security.py`](file:///C:/Users/kandu/Desktop/tutortrace/tutortrace/tests/test_auth_and_security.py) | Auth & Security | 6 tests | Email/password regex, XSS sanitization, JWT signature validity, token expiration, zero OTP leakage in responses. |
| [`test_analytics_and_scoring.py`](file:///C:/Users/kandu/Desktop/tutortrace/tutortrace/tests/test_analytics_and_scoring.py) | Analytics & Scoring | 4 tests | Sentiment labeling polarity thresholds, multi-metric scoring equations, SEO recommendations, Redis/in-memory caching. |
| [`test_prediction_pipeline.py`](file:///C:/Users/kandu/Desktop/tutortrace/tutortrace/tests/test_prediction_pipeline.py) | ML Prediction | 3 tests | Model & scaler artifact validation, inference bound checking, real-time prediction endpoint response format. |
| [`test_channel_and_seo.py`](file:///C:/Users/kandu/Desktop/tutortrace/tutortrace/tests/test_channel_and_seo.py) | Channels & SEO | 5 tests | Thumbnail file extension whitelisting, video stats aggregation, competitor analysis parameters, keyword validation. |
| [`test_user_and_auth_routes.py`](file:///C:/Users/kandu/Desktop/tutortrace/tutortrace/tests/test_user_and_auth_routes.py) | User Routes & APIs | 10 tests | Login validation, registration missing fields, token verification, logout, password reset, item saving, chatbot input. |
| [`test_api_endpoints.py`](file:///C:/Users/kandu/Desktop/tutortrace/tutortrace/tests/test_api_endpoints.py) | Endpoints & CORS | 4 tests | CORS preflight response headers, `/api/health` status, `@token_required` protection on unauthenticated requests. |

---

## 3. How to Run the Tests
```bash
# Run all tests with verbose output
python -m pytest tests/ -v

# Run with coverage report
python -m pytest tests/ --cov=app --cov-report=term
```
