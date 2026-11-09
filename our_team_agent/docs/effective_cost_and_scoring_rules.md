# Effective Cost and Scoring Rules

This reference document defines the exact mathematical formulas, fee conversions, lease dealbreaker criteria, and scoring weights used by the Cal Poly Off-Campus Housing Matcher system.

---

## 1. Effective Monthly Cost Formula

The "effective monthly cost" represents the true all-inclusive monthly expenditure a student will incur for a rental property, preventing surprises from unadvertised fees or commute costs.

$$\text{Effective Monthly Cost} = \text{Base Asking Rent} + \text{Monthly Utilities} + \text{Parking Expense} + \text{Commute Expense}$$

### A. Utility Normalization Rules
If utilities are not explicitly included in the base rent, the following standard monthly estimates for San Luis Obispo are added based on bedroom count:

| Utility Type | Included in Rent? | Estimated Addition (Studio/1BR) | Estimated Addition (2BR+) |
| :--- | :--- | :--- | :--- |
| **Water / Sewer** | If missing / not included | +$35/month | +$60/month |
| **Trash** | If missing / not included | +$25/month | +$40/month |
| **Electricity & Gas** | If missing / not included | +$65/month | +$110/month |
| **Internet / WiFi** | If missing / not included | +$40/month | +$60/month |

### B. Parking Expense Rules
* If parking is listed as "included" or "free off-street parking": **+$0/month**.
* If parking is listed with a separate monthly fee: **+Fee amount** (e.g., +$50/month).
* If property has "street parking only" requiring a City of SLO residential permit: **+$15/month**.
* If no parking is available and the student indicated they have a vehicle: **+$100/month** (off-site parking allowance).

### C. Commute Expense Formula
Commute distance to Cal Poly campus (1 Grand Avenue, San Luis Obispo, CA 93407) is converted into an estimated monthly transit expense:

$$\text{Monthly Commute Expense} = (\text{Roundtrip Miles to Campus}) \times \$0.65/\text{mile} \times 20\text{ transit days/month}$$

* *Example:* A property 2.5 miles from campus = 5 miles roundtrip $\times \$0.65 \times 20 = \$65.00/\text{month}$.
* **Bicycle / Walking Zone:** If listing is within 1.0 mile of campus ($\le 15\text{ min}$ walk / $\le 5\text{ min}$ bike): **+$0/month**.

---

## 2. Strict Lease Dealbreakers

Any listing that violates an active student dealbreaker is dropped immediately during the Post-T4 Hard Check and will **never** be presented to the student:

1. **Sublease Prohibition:**
   * If student sets `sublease_required = true`, any listing whose text contains clauses such as *"no subleasing"*, *"subletting strictly prohibited"*, or *"re-assignment not allowed"* is disqualified.
2. **Effective Budget Exceeded:**
   * Any listing where $\text{Effective Monthly Cost} > \text{Student Max Budget}$ is disqualified immediately.
3. **Excessive Commute:**
   * Any listing with a one-way commute time $> 30\text{ minutes}$ to campus during peak morning hours (8:00 AM – 9:00 AM) is disqualified unless explicitly overridden by the student.
4. **Pet Policy Violation:**
   * If student requires pets allowed, any listing stating *"no pets allowed"* or containing weight limits exceeded by the student's pet is disqualified.

---

## 3. T6 Deterministic Weighted Scoring Algorithm

For all listings that pass T4 and T5, T6 computes a normalized composite score out of **100 points**:

$$\text{Final Score} = (0.40 \times S_{\text{cost}}) + (0.30 \times S_{\text{commute}}) + (0.30 \times S_{\text{amenities}})$$

### A. Cost Fit Score ($S_{\text{cost}}$, Weight: 40%)
Evaluates how far below the student's maximum budget the effective cost lands:
$$S_{\text{cost}} = \max\left(0, 100 \times \left(1 - \frac{\text{Effective Cost} - \text{Min Feasible Rent}}{\text{Max Budget} - \text{Min Feasible Rent}}\right)\right)$$

### B. Commute Proximity Score ($S_{\text{commute}}$, Weight: 30%)
Linear decay from 0 minutes (100 points) to 30 minutes (0 points):
$$S_{\text{commute}} = \max\left(0, 100 \times \left(1 - \frac{\text{Commute Minutes}}{30}\right)\right)$$

### C. Amenities & Quality Score ($S_{\text{amenities}}$, Weight: 30%)
Calculated based on requested vs. present amenities:
* In-unit washer/dryer: +30 points
* Off-street dedicated parking: +25 points
* Dishwasher: +15 points
* Air conditioning: +15 points
* Private patio / outdoor space: +15 points
*(Normalized to a maximum of 100 points)*
