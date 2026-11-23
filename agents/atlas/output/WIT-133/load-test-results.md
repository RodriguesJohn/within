# Load test: public API rate limiting (WIT-133)

k6, 200 VUs, 2 min, against staging. 10 API keys, evenly spread.

| Metric | Baseline (no limiter) | With limiter | Delta |
|---|---|---|---|
| p50 latency | 21.4 ms | 23.1 ms | +1.7 ms |
| p95 latency | 38.6 ms | 41.8 ms | +3.2 ms |
| Error rate (5xx) | 0.00% | 0.00% | 0 |
| 429 responses | 0 | 18.2% | expected: load exceeds 100/min per key |

The p95 overhead is 3.2 ms, under the 5 ms target. All 429s carried `Retry-After` and `X-RateLimit-Remaining: 0`.
