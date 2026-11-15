# Reproducible Performance Benchmarks

## 1. Objective
This benchmark evaluates the performance delta between the legacy **Unbatched** (N+1 query pattern) and the optimized **Batched** YouTube data ingestion pipelines under strictly equivalent workloads.

## 2. Workload Definition
For every tested workload size ($N \in \{10, 25, 50\}$ videos), both pipelines execute the identical processing sequence:
1. Search lookup simulation.
2. Video metadata retrieval (views, likes, comments).
3. Live sentiment analysis over 5 comments per video using `TextBlob`.
4. Custom, relevance, and final engagement score calculations (`calculate_scores`).
5. Descending score sorting and response construction.

Network latency is simulated at 75ms roundtrip time (RTT), matching average latency to `https://www.googleapis.com`.

---

## 3. How to Run
Execute the benchmark script directly from the project root:
```bash
python benchmarks/benchmark_search_performance.py
```
Results are displayed on stdout and exported to `benchmarks/benchmark_results.json`.

---

## 4. Benchmark Results Summary

| Workload Size | Unbatched HTTP Calls | Batched HTTP Calls | Calls Eliminated | Unbatched Mean (p50) | Batched Mean (p50) | Speedup Factor | Latency Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **10 Videos** | 21 calls | 12 calls | **9 calls saved** (42.9%) | 1.646s (1.629s) | 0.949s (0.947s) | **1.73x** | **42.3%** |
| **25 Videos** | 51 calls | 27 calls | **24 calls saved** (47.1%) | 3.951s (3.949s) | 2.144s (2.143s) | **1.84x** | **45.7%** |
| **50 Videos** | 101 calls | 52 calls | **49 calls saved** (48.5%) | 7.806s (7.799s) | 4.114s (4.108s) | **1.90x** | **47.3%** |

*(Note: When sentiment caching is enabled via Redis, batched calls drop to exactly 2 requests total, achieving over 90% latency reduction).*
