-- ============================================================================
-- BUS 4498 — Off-Campus Housing Matcher & Deal Evaluator (our_team_agent)
-- Migration 001: Initial Schema, Constraints, and Row-Level Security (RLS)
--
-- Follows:
--   - our_team_agent/runtime/hosting-rules.md
--   - our_team_agent/runtime/memory-rules.md
--   - our_team_agent/runtime/permission-rules.md
--
-- How to run:
--   Paste this entire file into Supabase -> SQL Editor -> New Query -> Run.
-- ============================================================================

-- 1. EVALUATED LISTINGS ("What happened")
-- One row per rental listing evaluated by the agent.
-- Enforces:
--   - Unique listing_id and listing_url (never recommend the same listing twice)
--   - Database CHECK rule refusing to mark high-fraud (> 0.80) listings as qualified
CREATE TABLE IF NOT EXISTS public.evaluated_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  listing_url TEXT NOT NULL,
  title TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT NOT NULL,
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms NUMERIC(3,1) NOT NULL CHECK (bathrooms > 0),
  base_rent NUMERIC(10,2) NOT NULL CHECK (base_rent > 0),
  monthly_utilities NUMERIC(10,2) NOT NULL DEFAULT 0,
  parking_expense NUMERIC(10,2) NOT NULL DEFAULT 0,
  commute_expense NUMERIC(10,2) NOT NULL DEFAULT 0,
  effective_monthly_cost NUMERIC(10,2) NOT NULL CHECK (effective_monthly_cost >= base_rent),
  commute_minutes NUMERIC(5,1),
  commute_miles NUMERIC(5,2),
  sublease_allowed TEXT NOT NULL DEFAULT 'unknown' CHECK (sublease_allowed IN ('yes', 'no', 'unknown')),
  pets_allowed TEXT NOT NULL DEFAULT 'unknown' CHECK (pets_allowed IN ('yes', 'no', 'unknown')),
  amenities JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_realism_label TEXT NOT NULL DEFAULT 'Realistic',
  market_delta_pct NUMERIC(6,2),
  fraud_risk_score NUMERIC(4,3) NOT NULL DEFAULT 0 CHECK (fraud_risk_score >= 0 AND fraud_risk_score <= 1),
  fraud_reasons TEXT[] NOT NULL DEFAULT '{}'::text[],
  rank_score NUMERIC(5,2),
  status TEXT NOT NULL CHECK (
    status IN (
      'qualified',
      'held_fraud',
      'held_policy',
      'discarded_raw',
      'discarded_budget',
      'discarded_dealbreaker',
      'discarded_scam',
      'retired'
    )
  ),
  hold_reason TEXT,
  sources_checked TEXT[] NOT NULL DEFAULT '{}'::text[],
  contact_name TEXT,
  contact_method TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT CHECK (review_decision IS NULL OR review_decision IN ('resume', 'retry', 'end')),
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Never recommend the same listing twice
  CONSTRAINT uq_evaluated_listings_listing_id UNIQUE (listing_id),
  CONSTRAINT uq_evaluated_listings_listing_url UNIQUE (listing_url),

  -- NEVER #4 (database rule): High fraud risk (> 0.80) can NEVER be marked qualified
  CONSTRAINT chk_no_high_fraud_qualified CHECK (
    NOT (status = 'qualified' AND fraud_risk_score > 0.80)
  )
);

ALTER TABLE public.evaluated_listings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.evaluated_listings FROM anon, authenticated;

-- Students (anon) can ONLY read qualified, safe listings (no fraud audit internals)
GRANT SELECT (
  id, listing_id, listing_url, title, neighborhood, address,
  bedrooms, bathrooms, base_rent, monthly_utilities, parking_expense,
  commute_expense, effective_monthly_cost, commute_minutes, commute_miles,
  sublease_allowed, pets_allowed, amenities, price_realism_label,
  rank_score, status, contact_name, contact_method, created_at
) ON TABLE public.evaluated_listings TO anon;

-- Signed-in reviewer (authenticated) can read all rows/columns and record sign-off decisions
GRANT SELECT ON TABLE public.evaluated_listings TO authenticated;
GRANT UPDATE (status, reviewed_by, reviewed_at, review_decision, review_reason, updated_at)
  ON TABLE public.evaluated_listings TO authenticated;

DROP POLICY IF EXISTS "Students read qualified listings only" ON public.evaluated_listings;
CREATE POLICY "Students read qualified listings only"
  ON public.evaluated_listings
  FOR SELECT
  TO anon
  USING (status = 'qualified' AND fraud_risk_score <= 0.80);

DROP POLICY IF EXISTS "Reviewer reads all evaluated listings" ON public.evaluated_listings;
CREATE POLICY "Reviewer reads all evaluated listings"
  ON public.evaluated_listings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Reviewer signs off on held listings" ON public.evaluated_listings;
CREATE POLICY "Reviewer signs off on held listings"
  ON public.evaluated_listings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 2. COMMUTE CACHE ("What happened")
-- Maps normalized SLO addresses to travel time and distance so Google Maps is never queried twice.
CREATE TABLE IF NOT EXISTS public.commute_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_address TEXT NOT NULL,
  raw_address TEXT NOT NULL,
  commute_minutes NUMERIC(5,1) NOT NULL CHECK (commute_minutes >= 0),
  commute_miles NUMERIC(5,2) NOT NULL CHECK (commute_miles >= 0),
  source TEXT NOT NULL DEFAULT 'google_maps_routes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_commute_cache_normalized_address UNIQUE (normalized_address)
);

ALTER TABLE public.commute_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.commute_cache FROM anon, authenticated;
GRANT SELECT ON TABLE public.commute_cache TO authenticated;

DROP POLICY IF EXISTS "Reviewer reads commute cache" ON public.commute_cache;
CREATE POLICY "Reviewer reads commute cache"
  ON public.commute_cache
  FOR SELECT
  TO authenticated
  USING (true);


-- 3. AGENT SETTINGS (Permissions, limits, and the Paused off switch)
-- One row per switch or limit a signed-in reviewer can change, with a required reason.
CREATE TABLE IF NOT EXISTS public.agent_settings (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('switch', 'number', 'text')),
  value TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.agent_settings FROM anon, authenticated;
GRANT SELECT ON TABLE public.agent_settings TO authenticated;
GRANT UPDATE (value, reason, updated_by, updated_at) ON TABLE public.agent_settings TO authenticated;

DROP POLICY IF EXISTS "Reviewer reads agent settings" ON public.agent_settings;
CREATE POLICY "Reviewer reads agent settings"
  ON public.agent_settings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Reviewer updates agent settings" ON public.agent_settings;
CREATE POLICY "Reviewer updates agent settings"
  ON public.agent_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (length(trim(reason)) > 0);

-- Seed default settings from our_team_agent/runtime/permissions-plan.md
INSERT INTO public.agent_settings (key, label, kind, value, reason, updated_by)
VALUES
  ('paused', 'Agent Paused (Off Switch)', 'switch', 'false', 'Initial setup: agent active', 'Nicolas Gonzalez'),
  ('require_manual_signoff', 'Require Manual Sign-Off for Ambiguous Listings & Drafts', 'switch', 'true', 'Initial setup per permissions-plan.md', 'Nicolas Gonzalez'),
  ('batch_limit', 'Max Listings Evaluated Per Search Run', 'number', '30', 'Initial setup per permissions-plan.md', 'Nicolas Gonzalez'),
  ('max_commute_minutes', 'Max One-Way Commute Minutes to Cal Poly', 'number', '30', 'Initial setup per permissions-plan.md', 'Nicolas Gonzalez'),
  ('monthly_api_budget_usd', 'Monthly API Spending Cap (USD)', 'number', '15', 'Initial setup per permissions-plan.md', 'Nicolas Gonzalez')
ON CONFLICT (key) DO NOTHING;


-- 4. LESSONS LEARNED ("Lessons it learns")
-- Written by the agent only from trusted reviewer outcomes; reviewer can read all and toggle active on/off.
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson TEXT NOT NULL,
  topic TEXT NOT NULL,
  learned_from TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('confirmed_scam', 'verified_legitimate', 'rejected', 'corrected', 'check_failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,

  -- One lesson per trusted outcome
  CONSTRAINT uq_lessons_source_outcome UNIQUE (learned_from, outcome)
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lessons FROM anon, authenticated;
GRANT SELECT ON TABLE public.lessons TO authenticated;
GRANT UPDATE (active) ON TABLE public.lessons TO authenticated;

DROP POLICY IF EXISTS "Reviewer reads lessons" ON public.lessons;
CREATE POLICY "Reviewer reads lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Reviewer toggles lesson active switch" ON public.lessons;
CREATE POLICY "Reviewer toggles lesson active switch"
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 5. INQUIRY DRAFTS ("Ask first" — never sent automatically)
-- Stores drafted landlord inquiry emails for student review/copy.
CREATE TABLE IF NOT EXISTS public.inquiry_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL REFERENCES public.evaluated_listings(listing_id) ON DELETE RESTRICT,
  landlord_contact TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved_by_student', 'cancelled')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Never create duplicate inquiry drafts for the same listing and landlord
  CONSTRAINT uq_inquiry_drafts_listing_landlord UNIQUE (listing_id, landlord_contact)
);

ALTER TABLE public.inquiry_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.inquiry_drafts FROM anon, authenticated;
GRANT SELECT ON TABLE public.inquiry_drafts TO anon, authenticated;
GRANT UPDATE (subject, body, status, approved_at) ON TABLE public.inquiry_drafts TO anon, authenticated;

DROP POLICY IF EXISTS "Students and reviewers view inquiry drafts" ON public.inquiry_drafts;
CREATE POLICY "Students and reviewers view inquiry drafts"
  ON public.inquiry_drafts
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Students edit or approve inquiry drafts" ON public.inquiry_drafts;
CREATE POLICY "Students edit or approve inquiry drafts"
  ON public.inquiry_drafts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 6. LISTING REPORTS ("How mistakes are reported")
-- Students can report inaccurate costs or suspected fraud; only signed-in reviewers can read/resolve reports.
CREATE TABLE IF NOT EXISTS public.listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  reporter_note TEXT NOT NULL CHECK (length(trim(reporter_note)) > 0),
  reported_by TEXT NOT NULL DEFAULT 'student',
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.listing_reports FROM anon, authenticated;
GRANT INSERT (listing_id, reporter_note, reported_by) ON TABLE public.listing_reports TO anon, authenticated;
GRANT SELECT ON TABLE public.listing_reports TO authenticated;
GRANT UPDATE (resolved, resolved_by, resolved_at) ON TABLE public.listing_reports TO authenticated;

DROP POLICY IF EXISTS "Anyone can submit a listing report" ON public.listing_reports;
CREATE POLICY "Anyone can submit a listing report"
  ON public.listing_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(trim(reporter_note)) > 0);

DROP POLICY IF EXISTS "Reviewer reads listing reports" ON public.listing_reports;
CREATE POLICY "Reviewer reads listing reports"
  ON public.listing_reports
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Reviewer resolves listing reports" ON public.listing_reports;
CREATE POLICY "Reviewer resolves listing reports"
  ON public.listing_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 7. API USAGE LOG (Tracks monthly spend against the $15 budget cap)
CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  dry_run BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_usage_log FROM anon, authenticated;
GRANT SELECT ON TABLE public.api_usage_log TO authenticated;

DROP POLICY IF EXISTS "Reviewer reads API usage log" ON public.api_usage_log;
CREATE POLICY "Reviewer reads API usage log"
  ON public.api_usage_log
  FOR SELECT
  TO authenticated
  USING (true);
