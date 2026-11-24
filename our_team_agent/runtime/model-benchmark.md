# Model Comparison & Efficiency Benchmark (BUS 4498 Demo Prep)

Measured live against the deployed `agent` Edge Function (`dry_run: true`, strict no-fallback mode) across all **8 rubric test cases** (`test-data/N1`–`N5` and `E1`–`E3`, totaling 11 listing evaluations per full suite run).

## 1. Model Comparison Table (Demo Question 4)

| Model | Test Cases Passed | Avg Seconds / Case | Est. Cost / Case | Total Cost (All 8 Cases) | Input Tokens | Output Tokens |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`gemini-3.5-flash-lite`** | **8 / 8 (100%)** | **2.77 s** | **\$0.000334** | **\$0.002669** | 18,964 | 1,932 |
| **`gemini-3.8-flash`** (default) | **8 / 8 (100%)** | **11.75 s** | **\$0.000504** | **\$0.004033** | 18,964 | 1,981 |
| **`gemini-3.1-pro-preview`** | **8 / 8 (100%)** | **12.35 s** | **\$0.004194** | **\$0.033555** | 18,964 | 1,970 |

*Pricing basis (per 1M tokens): `gemini-3.5-flash-lite` (\$0.10 in / \$0.40 out), `gemini-3.8-flash` (\$0.15 in / \$0.60 out), `gemini-3.1-pro-preview` (\$1.25 in / \$5.00 out).*

### Why We Chose Flash Over Pro
- **100% pass rate on all three models** because deterministic rules (effective monthly cost math, dealbreaker checks, prompt-injection regex, and T6 ranking) live in code rather than relying on the LLM for arithmetic.
- **`gemini-3.8-flash`** (default) delivers 8/8 accuracy at **\$0.000504/case**—**8.3× cheaper** than `gemini-3.1-pro-preview` (\$0.004194/case)—keeping a full 50-listing search well under \$0.03 against our \$15/month cap.
- **`gemini-3.5-flash-lite`** is an even faster option (**2.77 s/case**, 4.2× faster, \$0.000334/case) that also scored 8/8, making it ideal for high-volume batch runs.
- **What `gemini-3.1-pro-preview` does better (debate prep):** Richer reasoning on ambiguous/adversarial prose, but its 8.3×–12.5× higher cost and slower latency did not improve pass rate on structured lease extraction.

## 2. Efficiency vs. Manual Work (Demo Question 5)

| Metric | By Hand (Cal Poly Student) | Poly Rental Matcher (`gemini-3.8-flash`) | Poly Rental Matcher (`gemini-3.5-flash-lite`) |
| :--- | :---: | :---: | :---: |
| **Time per case** | ~10 min (600 s) | **11.75 s** (~51× faster) | **2.77 s** (~216× faster) |
| **Cost per case** | ~\$3.33 (at \$20/hr student time) | **\$0.000504** | **\$0.000334** |
| **50-listing apartment search** | ~8.3 hours | ~35–45 s (parallel chunks of 6) | ~12–15 s |
