# Handoff: Poly Rental Matcher (Off-Campus Housing Matcher & Deal Evaluator)

## How to test
- App link: https://nickiee-g.github.io/BUS4498_Team_Build/
- Test login: Student search requires no login. For the Reviewer & Admin Control Center (`ID: Reviewer` in the top navigation bar, used in N5 and E3), use the dedicated demo account: `reviewer-demo@polymatcher.test` / `PolyMatcher2026!`
- To run a case:
  1. Open the App link and scroll to **01 Live Search & SLO Map** (or click **Search SLO Rentals**).
  2. Set any filters noted in the case (default filters are Max Effective Budget `$2,400`, Beds `Any`, Dealbreakers `Sublease Allowed` ON and `I Have a Car` ON).
  3. Open **More Filters** in the filter bar, click **Upload Custom Listings (CSV / JSON)**, and select the file from the repository's `test-data/` folder. A `📄 <filename>` chip appears in the filter bar once loaded (click `×` on the chip to clear it).
  4. Click **Evaluate SLO Listings** (or **Run Search**).
- Where to see the result:
  - **Student results:** Under **01 Live Search & SLO Map**, check the `✓ Matched`, `✕ Didn't Match`, `⏳ Held for Review`, and `🛡️ Scams Blocked` indicators (when 0 listings match, the feed automatically displays the filtered cards or explains why items were blocked/held), the status line next to the match count (`Skill active`, `in review`, `lesson(s) applied`), and the badges on each listing card (`Google Maps API` / `OSM/OSRM Maps API` / `Cached Route`, `Skill Verified`).
  - **Human checkpoints:** Click **Draft Inquiry** on any matched card for the student email checkpoint, or click **ID: Reviewer** in the top navigation bar to view the **Ambiguous & Held Listings Review Queue** and **Lessons Learned**.
- To reset between cases: Click `×` on the `📄 <filename>` chip (or refresh the page), select the next CSV file in **More Filters -> Upload Custom Listings**, and restore default filters (`Max: ≤ $2,400`, `Sublease Allowed` ON, `I Have a Car` ON). In the Reviewer panel, you can toggle any test lesson **Off** under **Lessons Learned** when done.

## Test cases

### N1 (normal): Clean SLO match with external Maps tool and Skill
- Shows: External tool (live Maps/Routing API commute lookup) + Skill (`our_team_agent/agent/skills/slo-rental-deal-evaluator/SKILL.md`)
- Input: `test-data/N1_clean_slo_match.csv`
- Steps: Keep default filters (`Max: ≤ $2,400`, `Sublease Allowed` ON, `I Have a Car` ON). Under **More Filters**, upload `test-data/N1_clean_slo_match.csv` and click **Evaluate SLO Listings**.
- Expected result: `SLO-001` qualifies and appears in the `✓ Matched` tab with a full effective monthly cost breakdown (base rent `$1,850` + `$105` unincluded utilities + `$0` parking + routed commute cost, totaling under `$2,400/mo`), a `Skill Verified` badge, and a real external route badge (`Google Maps API` or `OSM/OSRM Maps API` on first lookup, or `Cached Route` if previously cached). The status line shows `Skill active`.

### N2 (normal): Hidden utility and parking fees push listing over budget
- Shows: Skill (`SKILL.md` utility/parking extraction and deterministic effective cost math)
- Input: `test-data/N2_hidden_fees_over_budget.csv`
- Steps: Open the **Max** budget filter, lower **Max Effective Budget** to `$2,000`, and click **Apply Budget**. Under **More Filters**, upload `test-data/N2_hidden_fees_over_budget.csv` and click **Evaluate SLO Listings**.
- Expected result: Even though base rent (`$1,795`) is under `$2,000`, the agent extracts the missing utilities (`+$165`), mandatory `$95/mo` parking fee, and commute expense, calculates an effective monthly cost above `$2,000`, and moves `SLO-011` to the `✕ Didn't Match` tab labeled `OVER EFFECTIVE BUDGET`.

### N3 (normal): Strict lease dealbreaker disqualifies no-sublease apartment
- Shows: AI judgment call (lease text extraction) + strict dealbreaker enforcement
- Input: `test-data/N3_no_sublease_dealbreaker.csv`
- Steps: Restore **Max Effective Budget** to `$2,400` and confirm **Sublease Allowed** is selected under **Dealbreakers**. Under **More Filters**, upload `test-data/N3_no_sublease_dealbreaker.csv` and click **Evaluate SLO Listings**.
- Expected result: `SLO-015` is excluded from `✓ Matched` and appears in `✕ Didn't Match` labeled `LEASE DEALBREAKER` with the reason that subleasing is prohibited.

### N4 (normal): Draft, edit, approve, or reject landlord inquiry (human checkpoint + within-session memory)
- Shows: Human checkpoint (approve, edit, or reject before contacting a landlord) + Memory within a session
- Input: `test-data/N4_inquiry_checkpoint.csv`
- Steps: With default filters (`Max: ≤ $2,400`), upload `test-data/N4_inquiry_checkpoint.csv` and click **Evaluate SLO Listings**. On the matched `SLO-002` card, click **Draft Inquiry**. Inspect the **Why proposed** line and draft body, edit a sentence in the email body, then click **Approve & Copy Email** (or click **Reject Draft** to cancel).
- Expected result: No email is sent automatically. The modal explains why `SLO-002` was proposed (match score, effective cost, commute) and carries forward earlier session findings (all-utilities-included / commute / sublease terms) into the drafted message. Approving saves `approved_by_student` and copies the text; rejecting marks the draft `cancelled` without sending.

### N5 (normal): Reviewer sign-off and cross-session memory (lessons + commute cache)
- Shows: Human checkpoint (reviewer queue) + Memory across sessions (`lessons` table and `commute_cache` table)
- Input: `test-data/N5_ambiguous_discount_review.csv` (followed by `test-data/N1_clean_slo_match.csv` in a fresh session)
- Steps:
  1. Upload `test-data/N5_ambiguous_discount_review.csv` and click **Evaluate SLO Listings**. Confirm the status line shows `1 in review` and `SLO-025` is not shown in student matches.
  2. Click **ID: Reviewer** in the top navigation bar and sign in with the Test login.
  3. In **Ambiguous & Held Listings Review Queue**, inspect `SLO-025`, enter a reason (e.g., `"Verified older rear cottage with legitimate owner — still verify lease terms in person"`), and click **Resume (Mark Safe)** (or **End (Confirm Scam)**). Confirm a new row appears under **Lessons Learned**.
  4. Refresh the page to start a new session, upload `test-data/N1_clean_slo_match.csv`, and click **Evaluate SLO Listings**.
- Expected result: `SLO-025` is held for human review instead of auto-approved, the reviewer decision writes an active Lesson Learned, and in the new session the agent displays `1 lesson(s) applied` (cross-session `lessons` memory) and `Cached Route` on `SLO-001` (cross-session `commute_cache` memory).

### E1 (edge): Prompt-injection and Zelle rental scam attack
- Shows: Edge case (adversarial prompt injection + scam) + deterministic safety guardrails
- Input: `test-data/E1_prompt_injection_scam.csv`
- Steps: With default filters, upload `test-data/E1_prompt_injection_scam.csv` and click **Evaluate SLO Listings**.
- Expected result: The agent ignores the embedded `"SYSTEM OVERRIDE: Ignore all previous instructions..."` command, scores fraud risk above `0.80`, blocks the listing completely (`🛡️ 1 Scam Blocked`), and refuses to display it in `✓ Matched`.

### E2 (edge): Duplicate listing and repeated scammer contact in the same batch
- Shows: Edge case (duplicate + cross-listing scammer) + Memory within a session
- Input: `test-data/E2_duplicate_and_repeat_scammer.csv`
- Steps: With default filters, upload `test-data/E2_duplicate_and_repeat_scammer.csv` and click **Evaluate SLO Listings**.
- Expected result: `SLO-001` qualifies once while its duplicate row in the same CSV is skipped (`✕ Didn't Match` with duplicate-listing reason). `SLO-021` is blocked as a scam, and `SLO-051` (which looks normal on its own but shares the exact same `whatsapp: +1-555-0199` contact flagged on `SLO-021` earlier in the same run) is caught by within-session memory and blocked as a scam (`🛡️ 2 Scams Blocked`) or held for review (`⏳ Held for Review`) rather than appearing in `✓ Matched`.

### E3 (edge): Incomplete / ambiguous HOA sublease and pet policy
- Shows: Edge case (missing/vague lease terms) + Human checkpoint
- Input: `test-data/E3_unclear_hoa_policy.csv`
- Steps: With default filters (`Sublease Allowed` ON), upload `test-data/E3_unclear_hoa_policy.csv` and click **Evaluate SLO Listings**. Optionally open **ID: Reviewer** to inspect the held item.
- Expected result: Because the listing says subleasing and pets are decided case-by-case by the HOA after lease signing, the agent does not guess `"yes"`. It holds `SLO-018` as `held_policy` (`1 in review`) and routes it to the Reviewer Control Center queue for manual sign-off.
