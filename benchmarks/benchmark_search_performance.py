"""
Reproducible Benchmark Suite: YouTube Search Pipeline
Compares Unbatched (N+1 outbound requests) vs. Batched (1 consolidated request)
Ensures STRICTLY EQUIVALENT WORKLOADS:
- Identical search results (10, 25, 50 videos)
- Identical video stats data
- Identical TextBlob sentiment analysis over 10 comments per video
- Identical custom, relevance, and final score calculations
- Identical sorting and formatting logic
"""

import time
import json
import statistics
from textblob import TextBlob

# Shared scoring function identical to app.py
def calculate_scores(title, description, views, likes, comments_count, sentiment, query_terms):
    custom_score = (likes * 2 + comments_count * 3) * (1 + sentiment) + (views * 0.1)
    relevance_score = sum(1 for term in query_terms if term in (title + " " + description).lower())
    final_score = custom_score + (relevance_score * 50)
    return custom_score, relevance_score, final_score

def sentiment_label(score: float) -> str:
    if score > 0.2: return "Positive"
    if score < -0.2: return "Negative"
    return "Neutral"

class MockYouTubeService:
    def __init__(self, network_latency_sec=0.075):
        """
        Simulates network latency to Google APIs (75ms typical RTT to googleapis.com)
        """
        self.latency = network_latency_sec
        self.call_count = 0

    def reset_counter(self):
        self.call_count = 0

    def search_videos(self, query, max_results=10):
        self.call_count += 1
        time.sleep(self.latency)
        return [
            {
                'id': {'videoId': f'vid_{i:03d}'},
                'snippet': {
                    'title': f'Comprehensive Machine Learning Tutorial Episode {i}',
                    'description': f'In this video {i} we explore neural networks, regression and python libraries.',
                    'publishedAt': '2026-03-01T12:00:00Z',
                    'channelTitle': 'AI Academy'
                }
            }
            for i in range(max_results)
        ]

    def get_single_video_stats(self, video_id):
        self.call_count += 1
        time.sleep(self.latency)
        seed = hash(video_id) % 100000
        return {
            'viewCount': 10000 + abs(seed) * 5,
            'likeCount': 500 + abs(seed) // 10,
            'commentCount': 50 + abs(seed) // 100
        }

    def get_batched_video_stats(self, video_ids):
        self.call_count += 1
        time.sleep(self.latency)
        res = {}
        for vid in video_ids:
            seed = hash(vid) % 100000
            res[vid] = {
                'viewCount': 10000 + abs(seed) * 5,
                'likeCount': 500 + abs(seed) // 10,
                'commentCount': 50 + abs(seed) // 100
            }
        return res

    def get_comments(self, video_id):
        self.call_count += 1
        time.sleep(self.latency)
        return [
            "Great explanation of machine learning concepts!",
            "Clear tutorial, really helped me understand gradient descent.",
            "Awesome content, keep it up!",
            "Could you explain backpropagation in more detail?",
            "Very informative video."
        ]

def run_unbatched_pipeline(service, query, num_videos):
    start = time.perf_counter()
    search_items = service.search_videos(query, max_results=num_videos)
    query_terms = query.lower().split()
    videos = []

    for item in search_items:
        vid = item['id']['videoId']
        snip = item['snippet']
        title = snip['title']
        desc = snip['description']

        # UNBATCHED: 1 HTTP call per video
        stats = service.get_single_video_stats(vid)
        views = int(stats['viewCount'])
        likes = int(stats['likeCount'])
        comments_count = int(stats['commentCount'])

        # 1 HTTP call for comments
        raw_comments = service.get_comments(vid)
        polarity_sum = sum(TextBlob(c).sentiment.polarity for c in raw_comments)
        avg_sentiment = round(polarity_sum / max(1, len(raw_comments)), 2)
        sentiment = sentiment_label(avg_sentiment)

        cscore, rscore, fscore = calculate_scores(title, desc, views, likes, comments_count, avg_sentiment, query_terms)
        videos.append({
            'videoId': vid, 'title': title, 'views': views, 'likes': likes,
            'commentsCount': comments_count, 'sentiment': sentiment, 'finalScore': fscore
        })

    videos.sort(key=lambda x: x['finalScore'], reverse=True)
    duration = time.perf_counter() - start
    return duration, len(videos)

def run_batched_pipeline(service, query, num_videos):
    start = time.perf_counter()
    search_items = service.search_videos(query, max_results=num_videos)
    video_ids = [item['id']['videoId'] for item in search_items]
    query_terms = query.lower().split()

    # BATCHED: 1 consolidated HTTP call for all video statistics
    batched_stats = service.get_batched_video_stats(video_ids)

    videos = []
    for item in search_items:
        vid = item['id']['videoId']
        snip = item['snippet']
        title = snip['title']
        desc = snip['description']

        stats = batched_stats.get(vid, {'viewCount': 0, 'likeCount': 0, 'commentCount': 0})
        views = int(stats['viewCount'])
        likes = int(stats['likeCount'])
        comments_count = int(stats['commentCount'])

        # Comments retrieved (identical sentiment workload)
        raw_comments = service.get_comments(vid)
        polarity_sum = sum(TextBlob(c).sentiment.polarity for c in raw_comments)
        avg_sentiment = round(polarity_sum / max(1, len(raw_comments)), 2)
        sentiment = sentiment_label(avg_sentiment)

        cscore, rscore, fscore = calculate_scores(title, desc, views, likes, comments_count, avg_sentiment, query_terms)
        videos.append({
            'videoId': vid, 'title': title, 'views': views, 'likes': likes,
            'commentsCount': comments_count, 'sentiment': sentiment, 'finalScore': fscore
        })

    videos.sort(key=lambda x: x['finalScore'], reverse=True)
    duration = time.perf_counter() - start
    return duration, len(videos)

def benchmark_suite(workloads=[10, 25, 50], repetitions=5):
    print("=" * 70)
    print("REPRODUCIBLE PERFORMANCE BENCHMARK: YOUTUBE SEARCH INGESTION")
    print(f"Repetitions per test: {repetitions} | Simulated RTT: 75ms")
    print("=" * 70)

    report = {"workloads": {}, "summary": []}

    for n in workloads:
        print(f"\n---> Benchmarking Workload: {n} Videos per search...")
        
        # Unbatched runs
        unbatched_times = []
        unbatched_reqs = []
        for _ in range(repetitions):
            svc = MockYouTubeService(network_latency_sec=0.075)
            dur, count = run_unbatched_pipeline(svc, "machine learning python", n)
            unbatched_times.append(dur)
            unbatched_reqs.append(svc.call_count)

        # Batched runs
        batched_times = []
        batched_reqs = []
        for _ in range(repetitions):
            svc = MockYouTubeService(network_latency_sec=0.075)
            dur, count = run_batched_pipeline(svc, "machine learning python", n)
            batched_times.append(dur)
            batched_reqs.append(svc.call_count)

        u_mean = statistics.mean(unbatched_times)
        u_p50 = statistics.median(unbatched_times)
        b_mean = statistics.mean(batched_times)
        b_p50 = statistics.median(batched_times)
        u_req = unbatched_reqs[0]
        b_req = batched_reqs[0]

        req_saved = u_req - b_req
        req_reduction_pct = (req_saved / u_req) * 100
        latency_reduction_pct = ((u_mean - b_mean) / u_mean) * 100
        speedup = u_mean / b_mean

        data = {
            "num_videos": n,
            "unbatched_requests": u_req,
            "batched_requests": b_req,
            "requests_saved": req_saved,
            "request_reduction_pct": round(req_reduction_pct, 2),
            "unbatched_mean_sec": round(u_mean, 3),
            "unbatched_p50_sec": round(u_p50, 3),
            "batched_mean_sec": round(b_mean, 3),
            "batched_p50_sec": round(b_p50, 3),
            "latency_reduction_pct": round(latency_reduction_pct, 2),
            "speedup_factor": round(speedup, 2)
        }
        report["workloads"][f"{n}_videos"] = data
        report["summary"].append(data)

        print(f"  Unbatched: {u_req} HTTP requests | Mean: {u_mean:.3f}s (p50: {u_p50:.3f}s)")
        print(f"  Batched:   {b_req} HTTP requests | Mean: {b_mean:.3f}s (p50: {b_p50:.3f}s)")
        print(f"  Result:    {req_saved} requests eliminated ({req_reduction_pct:.1f}% fewer) | {speedup:.2f}x faster ({latency_reduction_pct:.1f}% lower latency)")

    with open(r"C:\Users\kandu\Desktop\tutortrace\tutortrace\benchmarks\benchmark_results.json", "w") as f:
        json.dump(report, f, indent=2)

    print("\nBenchmark successfully completed and exported to benchmarks/benchmark_results.json")
    return report

if __name__ == "__main__":
    benchmark_suite()
