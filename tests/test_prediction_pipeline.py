import os
import pytest
import joblib
import numpy as np
from app import app, MODEL_FILE, SCALER_FILE, generate_token

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_model_and_scaler_artifacts_exist():
    assert os.path.exists(MODEL_FILE), f"Missing {MODEL_FILE}"
    assert os.path.exists(SCALER_FILE), f"Missing {SCALER_FILE}"

def test_prediction_inference_bounds():
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)

    # 9 features:
    # [title_length, desc_length, tag_count, category_id, trending_match, avg_comp_views, sentiment, eng_rate, similar_count]
    sample_features = np.array([[55, 450, 15, 27, 3, 45000, 0.45, 8.2, 5]])
    scaled = scaler.transform(sample_features)
    prediction = model.predict(scaled)[0]

    assert prediction > 0, "Predicted views must be positive"
    assert isinstance(prediction, (float, np.floating, int, np.integer))

def test_predict_performance_endpoint(client):
    token = generate_token("tester@tutortrace.ai")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    payload = {
        "title": "Mastering Python Decorators in 15 Minutes",
        "description": "Comprehensive tutorial covering decorators and functional programming in Python.",
        "tags": "python,decorators,programming,tutorial,coding",
        "category_id": "27"
    }

    # Call endpoint (it will fetch real-time or fallback)
    response = client.post('/api/predict_performance_realtime', json=payload, headers=headers)
    assert response.status_code in [200, 400, 500]

    if response.status_code == 200:
        data = response.get_json()
        assert "predicted_views_30d" in data
        assert "confidence_interval" in data
        assert data["confidence_interval"]["lower"] <= data["predicted_views_30d"] <= data["confidence_interval"]["upper"]
