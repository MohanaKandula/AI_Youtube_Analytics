import pytest
from unittest.mock import MagicMock, patch
from app import app, generate_token, compute_video_stats, allowed_file

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_allowed_file():
    assert allowed_file("thumbnail.jpg") is True
    assert allowed_file("thumbnail.png") is True
    assert allowed_file("thumbnail.jpeg") is True
    assert allowed_file("thumbnail.gif") is True
    assert allowed_file("malicious.exe") is False
    assert allowed_file("script.py") is False
    assert allowed_file("no_extension") is False

def test_compute_video_stats_empty():
    stats, aggregates = compute_video_stats([])
    assert stats == []
    assert aggregates == {}

@patch('app.youtube')
def test_compute_video_stats_with_mock(mock_yt):
    mock_request = MagicMock()
    mock_request.execute.return_value = {
        'items': [
            {
                'id': 'vid_01',
                'snippet': {'title': 'Intro to Python', 'publishedAt': '2026-03-01T00:00:00Z'},
                'statistics': {'viewCount': '10000', 'likeCount': '500', 'commentCount': '50'}
            },
            {
                'id': 'vid_02',
                'snippet': {'title': 'Advanced Python', 'publishedAt': '2026-03-02T00:00:00Z'},
                'statistics': {'viewCount': '20000', 'likeCount': '1000', 'commentCount': '100'}
            }
        ]
    }
    mock_yt.videos.return_value.list.return_value = mock_request

    stats, aggregates = compute_video_stats(['vid_01', 'vid_02'])
    assert len(stats) == 2
    assert stats[0]['id'] == 'vid_02'  # sorted by publishedAt desc
    assert aggregates['avgLikesPerVideo'] == 750
    assert aggregates['avgCommentsPerVideo'] == 75
    assert aggregates['likesPercent'] == 5.0
    assert aggregates['commentsPercent'] == 0.5

def test_competitor_analysis_missing_param(client):
    token = generate_token("tester@tutortrace.ai")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get('/api/competitor_analysis', headers=headers)
    assert response.status_code == 400
    data = response.get_json()
    assert "Channel IDs are required" in data['error']

def test_video_seo_analysis_missing_keyword(client):
    token = generate_token("tester@tutortrace.ai")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    response = client.post('/api/video_seo_analysis', json={}, headers=headers)
    assert response.status_code == 400
    data = response.get_json()
    assert "Missing 'keyword' parameter" in data['error']
