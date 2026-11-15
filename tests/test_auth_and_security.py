import pytest
import jwt
from datetime import datetime, timedelta, timezone
from app import app, validate_email, validate_password, sanitize_input, generate_token, verify_token

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_validate_email():
    assert validate_email("user@example.com") is True
    assert validate_email("first.last@company.org") is True
    assert validate_email("invalid-email") is False
    assert validate_email("missing@domain") is False
    assert validate_email("@no-user.com") is False

def test_validate_password():
    valid, msg = validate_password("strongpassword123")
    assert valid is True
    assert msg == ""

    valid, msg = validate_password("123")
    assert valid is False
    assert "at least 6 characters" in msg

def test_sanitize_input():
    # XSS script tag removal
    assert sanitize_input("<script>alert('xss')</script>Hello") == "alert('xss')Hello"
    # HTML tag strip
    assert sanitize_input("<b>Bold</b> <i>Italic</i>") == "Bold Italic"
    # Non-printable characters
    assert sanitize_input("Clean\x00Text\x1f") == "CleanText"
    # Empty string
    assert sanitize_input("") == ""

def test_jwt_token_generation_and_verification():
    email = "testuser@tutortrace.ai"
    token = generate_token(email)
    assert token is not None
    assert isinstance(token, str)

    # Valid token verification
    verified_email = verify_token(token)
    assert verified_email == email

def test_jwt_invalid_and_expired_tokens():
    # Tampered token
    tampered_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature"
    assert verify_token(tampered_token) is None

    # Expired token
    payload = {
        'email': "expired@tutortrace.ai",
        'exp': datetime.now(timezone.utc) - timedelta(hours=1),
        'iat': datetime.now(timezone.utc) - timedelta(hours=2)
    }
    expired_token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    assert verify_token(expired_token) is None

def test_no_otp_leakage_in_api_response(client):
    """Security test: Ensure OTP code is never leaked in the response payload"""
    response = client.post('/api/auth/send-otp', json={
        'email': 'security_audit@tutortrace.ai',
        'password': 'Password123!',
        'full_name': 'Security Auditor'
    })
    # If DB is offline, returns 500 without leaking OTP; if mock/online, returns 200/409
    data = response.get_json() or {}
    assert "dev_otp" not in data, "CRITICAL: dev_otp is leaked in API response!"
