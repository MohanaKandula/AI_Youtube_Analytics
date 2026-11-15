import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_cors_endpoint(client):
    response = client.get('/test-cors')
    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == 'CORS test successful'

def test_health_check_endpoint(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'ok'
    assert 'time' in data

def test_protected_routes_require_token(client):
    # Call protected endpoint without Authorization header
    response = client.get('/api/search_videos?query=react')
    assert response.status_code == 401
    data = response.get_json()
    assert "Token is missing" in data.get('message', '')

def test_protected_routes_reject_malformed_token(client):
    response = client.get('/api/search_videos?query=react', headers={"Authorization": "InvalidHeaderFormat"})
    assert response.status_code == 401
