# Permissions and boundaries plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant builds it following `runtime/permission-rules.md`. Where this plan and our task specifications disagree, this plan wins.

- Agent: Automates off-campus housing searches for Cal Poly students by evaluating rental listings against true effective monthly cost, commute time, and lease dealbreakers, while screening for scams and drafting landlord inquiries. (`our_team_agent`)
- Owner, who answers for this agent: Nicolas Gonzalez
- Written on: November 8, 2026

## 1. May (on its own)

| # | Action |
|---|---|
| 1 | Read and parse rental listing data from CSV or JSON files |
| 2 | Look up cached commute times and calculate travel distance to Cal Poly campus |
| 3 | Calculate effective monthly cost using rent, parking, utility estimates, and commute expense |
| 4 | Check listing text against lease dealbreakers (e.g., strict sublease bans) |
| 5 | Compare listing rent against the SLO local rent reference table to evaluate price realism |
| 6 | Rank verified, non-fraudulent listings deterministically using weighted preferences |
| 7 | Draft a personalized landlord inquiry email for top-ranked listings |

## 2. May, with a limit

| # | What | The limit | Kind | Who can change it |
|---|---|---|---|---|
| 1 | Publish on its own | Every draft email and ambiguous listing waits for manual sign-off | A switch a reviewer can flip in the app | A signed-in reviewer, in the app, with a reason |
| 2 | Batch evaluation limit | 30 listings evaluated per search run | A number a reviewer can change in the app | A signed-in reviewer, in the app, with a reason |
| 3 | Commute travel time | 30 minutes maximum travel time to Cal Poly campus; further out waits for student override | A number a reviewer can change in the app | A signed-in reviewer, in the app, with a reason |
| 4 | Monthly API budget | $15 monthly spending cap across model and maps APIs | A number a reviewer can change in the app | A signed-in reviewer, in the app, with a reason |
| 5 | AI models | GPT-6 Sol for T4/T5 extraction and fraud; GPT-6 Luna for T8 email drafting | Fixed: only the builders change it | Only the builders, by changing the code |

## 3. Ask first (hold for a person)

| # | When | What the agent does instead |
|---|---|---|
| 1 | Fraud risk score is ambiguous (between 0.40 and 0.80) or linguistic anomalies are detected | The listing is held for manual review by Nicolas Gonzalez with options to Resume, Retry, or End |
| 2 | A listing text has unclear sublease or pet policies that might violate dealbreakers | The listing is flagged and held for student clarification |
| 3 | A personalized landlord inquiry email is drafted | The email displays on screen for the student to review and approve before sending |

## 4. Never

| # | Never | Where it is enforced |
|---|---|---|
| 1 | Recommend a property that exceeds the student's maximum effective monthly budget | Code |
| 2 | Recommend a property that violates a strict lease dealbreaker (such as a sublease ban) | Code |
| 3 | Automatically send an email inquiry to a landlord without student approval | Code |
| 4 | Recommend or contact any listing flagged as a confirmed scam or high fraud risk (> 0.80) | Code and a database rule |
| 5 | Re-query the Google Maps Routes API for an address already stored in the commute cache | Code |
| 6 | Act or call any AI model while paused | Code |

## 5. Who signs off

| Decision | Who | How |
|---|---|---|
| Every listing flagged with ambiguous fraud risk | Nicolas Gonzalez | Review in admin queue with options to Resume (mark safe), Retry (re-evaluate), or End (discard) |
| Drafted landlord inquiry email | The student user | One-click approval or edit on the review dashboard |
| Changing system switches or budget limits | Nicolas Gonzalez | The Permissions settings tab with an audit reason logged |

## The off switch

Nicolas Gonzalez can toggle the Paused switch in the settings tab with a reason. When paused, the agent immediately halts execution, calls no AI models, and answers with status "paused".

## How mistakes are reported

Students can click "Report Listing" on any property card to flag inaccurate costs or suspected fraud; Nicolas Gonzalez reviews all reported items in the audit queue.

## Rules we keep

- Every permission starts off. The agent may do only what this plan lists under *May* and *May, with a limit*.
- Writing a permission down does not enforce it. Every limit and every *Never* is enforced in code or in a database rule, never in instructions alone.
- A limit a person may change is a setting with an owner and a reason, which the code reads on every run.
- Asking means holding, not guessing: the record waits with a plain reason that names what is missing.
- A sign-off is a click in the app, recorded with who and when. A chat message is not a sign-off.
- Test mode never acts: with `dry_run`, the agent decides but saves nothing.
