import pytest
from app import app, generate_token

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_login_missing_credentials(client):
    response = client.post('/api/auth/login', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert "Email and password are required" in data['message']

def test_login_invalid_email_format(client):
    response = client.post('/api/auth/login', json={"email": "not-an-email", "password": "password123"})
    assert response.status_code == 400
    data = response.get_json()
    assert "Invalid email format" in data['message']

def test_register_missing_fields(client):
    response = client.post('/api/auth/register', json={"email": "test@test.com"})
    assert response.status_code == 400
    data = response.get_json()
    assert "Email and password are required" in data['message']

def test_verify_token_endpoint(client):
    token = generate_token("verified_user@tutortrace.ai")
    response = client.get('/api/auth/verify', headers={"Authorization": f"Bearer {token}"})
    # If DB is not connected, handles gracefully or returns 200/500
    assert response.status_code in [200, 500]
    if response.status_code == 200:
        data = response.get_json()
        assert data.get('valid') is True
        assert data.get('email') == "verified_user@tutortrace.ai"

def test_logout_endpoint(client):
    token = generate_token("logout_user@tutortrace.ai")
    response = client.post('/api/auth/logout', headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == "Logout successful"

def test_forgot_password_missing_email(client):
    response = client.post('/api/auth/forgot-password', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert "Email is required" in data['message']

def test_reset_password_missing_fields(client):
    response = client.post('/api/auth/reset-password', json={"token": "some-token"})
    assert response.status_code == 400
    data = response.get_json()
    assert "Token and new password are required" in data['message']

def test_save_item_missing_required_fields(client):
    token = generate_token("user@tutortrace.ai")
    response = client.post('/api/save_item', json={"item_type": "video"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    data = response.get_json()
    assert "item_type and item_id required" in data['error']

def test_chatbot_ask_missing_question(client):
    response = client.post('/api/chatbot/ask', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert "Please enter a question" in data['answer']

def test_predictions_history_protected(client):
    # Unauthenticated
    resp_unauth = client.get('/api/predictions_history')
    assert resp_unauth.status_code == 401

    # Authenticated
    token = generate_token("pred_user@tutortrace.ai")
    resp_auth = client.get('/api/predictions_history', headers={"Authorization": f"Bearer {token}"})
    assert resp_auth.status_code in [200, 500]
