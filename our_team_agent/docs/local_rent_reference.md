# San Luis Obispo Local Rent Reference Table

This reference document establishes median market rent benchmarks for San Luis Obispo (SLO), California across primary student housing neighborhoods. Task T5 (`Screen Fraud and Price Realism`) uses these values to evaluate price realism and detect potential scam listings (e.g., "too-good-to-be-true" bait-and-switch pricing).

---

## 1. Typical Market Rents by Bedroom Count and Neighborhood

| Neighborhood | Typical Proximity to Cal Poly | Studio / Single Room | 1 Bedroom (1BR) | 2 Bedroom (2BR) | 3 Bedroom (3BR) | 4+ Bedroom (Whole House) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Foothill Boulevard Corridor** | Very Close (0.5 – 1.5 mi) | $1,350 – $1,600 | $1,800 – $2,100 | $2,600 – $3,100 | $3,600 – $4,200 | $4,800 – $5,600 |
| **North Chorro / Hathway** | Walking Distance (< 1.0 mi) | $1,300 – $1,550 | $1,750 – $2,050 | $2,500 – $3,000 | $3,500 – $4,100 | $4,600 – $5,400 |
| **Downtown SLO / Mill Street** | Moderate (1.5 – 2.5 mi) | $1,400 – $1,700 | $1,900 – $2,250 | $2,700 – $3,200 | $3,800 – $4,400 | $4,900 – $5,800 |
| **Laguna Lake / Madonna Road** | Transit / Bike (3.0 – 5.0 mi) | $1,150 – $1,400 | $1,600 – $1,900 | $2,300 – $2,700 | $3,200 – $3,800 | $4,200 – $5,000 |
| **East SLO / Johnson Ave** | Moderate (2.0 – 3.5 mi) | $1,200 – $1,450 | $1,650 – $1,950 | $2,400 – $2,800 | $3,400 – $3,900 | $4,400 – $5,200 |
| **South Higuera / Broad St** | Transit / Car (3.0 – 5.5 mi) | $1,100 – $1,350 | $1,550 – $1,850 | $2,250 – $2,650 | $3,100 – $3,700 | $4,000 – $4,800 |

---

## 2. Price Realism Evaluation Rules (Task T5)

The agent compares the listing's base asking rent against the median rent for that neighborhood and bedroom count:

$$\Delta_{\text{market}} = \frac{\text{Asking Rent} - \text{Median Neighborhood Rent}}{\text{Median Neighborhood Rent}} \times 100\%$$

### Risk Thresholds:
1. **Normal Market Range ($-20\% \le \Delta_{\text{market}} \le +25\%$):**
   * Classify as `Realistic`. Price matches expected SLO market conditions.
2. **Value / Older Construction ($-35\% \le \Delta_{\text{market}} < -20\%$):**
   * Classify as `Moderate Discount`. The agent checks if description provides a plausible rationale (e.g., "older unit", "shared bath", "compact layout").
3. **Suspicious Bait-and-Switch Pricing ($\Delta_{\text{market}} < -35\%$):**
   * Classify as `Suspicious / Too Good to Be True`.
   * *Example:* A 2-bedroom apartment on Foothill Blvd advertised for $1,100/month (median is ~$2,850/mo, a $-61\%$ deviation).
   * **Action:** Flag listing with high linguistic scrutiny. If combined with any wire transfer, urgency, or out-of-town owner claim, immediately score as High Fraud Risk (> 0.80) and discard. If no other red flags exist, route to Nicolas Gonzalez for manual verification before presenting to students.
