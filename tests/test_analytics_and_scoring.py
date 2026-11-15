import time
import pytest
from app import sentiment_label, calculate_scores, generate_recommendations, cache_set, cache_get

def test_sentiment_label():
    assert sentiment_label(0.5) == "Positive"
    assert sentiment_label(0.21) == "Positive"
    assert sentiment_label(0.19) == "Neutral"
    assert sentiment_label(0.0) == "Neutral"
    assert sentiment_label(-0.19) == "Neutral"
    assert sentiment_label(-0.21) == "Negative"
    assert sentiment_label(-0.8) == "Negative"

def test_calculate_scores():
    title = "Machine Learning Tutorial"
    description = "Complete guide to ML algorithms in Python"
    views = 50000
    likes = 2500
    comments_count = 300
    sentiment = 0.4
    query_terms = ["machine", "learning"]

    custom_score, relevance_score, final_score = calculate_scores(
        title, description, views, likes, comments_count, sentiment, query_terms
    )

    # custom_score = (likes * 2 + comments_count * 3) * (1 + sentiment) + (views * 0.1)
    expected_custom = (2500 * 2 + 300 * 3) * (1 + 0.4) + (50000 * 0.1)
    assert round(custom_score, 2) == round(expected_custom, 2)
    # Both 'machine' and 'learning' are in title/description -> relevance_score = 2
    assert relevance_score == 2
    # final_score = custom_score + (relevance_score * 50)
    assert round(final_score, 2) == round(expected_custom + (2 * 50), 2)

def test_generate_recommendations():
    features_poor = {
        'trending_match_score': 0,
        'sentiment_score': -0.3,
        'tag_count': 2,
        'title_length': 15,
        'description_length': 40
    }
    recs = generate_recommendations(features_poor)
    assert len(recs) == 5
    assert any("trending keywords" in r for r in recs)
    assert any("sentiment negative" in r for r in recs)
    assert any("more relevant tags" in r for r in recs)

    features_optimal = {
        'trending_match_score': 4,
        'sentiment_score': 0.5,
        'tag_count': 12,
        'title_length': 55,
        'description_length': 450
    }
    recs_optimal = generate_recommendations(features_optimal)
    assert len(recs_optimal) == 0

def test_cache_set_and_get():
    key = "test_key_benchmark"
    data = {"video_count": 10, "status": "success"}

    cache_set(key, data, ttl=5)
    retrieved = cache_get(key)
    assert retrieved == data
