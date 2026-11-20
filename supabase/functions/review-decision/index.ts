// ============================================================================
// BUS 4498 — Off-Campus Housing Matcher & Deal Evaluator (our_team_agent)
// Edge Function: review-decision (Admin Sign-Off + Trusted Lessons Learned)
//
// Verifies the signed-in reviewer's Supabase auth token, records the sign-off
// decision on evaluated_listings, and writes a trusted lesson into `lessons`.
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  let secretKey = "";
  const rawSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (rawSecretKeys) {
    try {
      const parsed = JSON.parse(rawSecretKeys);
      secretKey = parsed.default ?? Object.values(parsed)[0] ?? "";
    } catch {
      secretKey = "";
    }
  }
  if (!secretKey) {
    secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  }
  if (!url || !secretKey) return null;
  return createClient(url, secretKey, { auth: { persistSession: false } });
}

Deno.serve(async (req: Request) => {
  const startedAt = Date.now();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method === "GET") {
    return jsonResponse({
      ok: true,
      ready: !!getSupabaseAdmin(),
      message: "Reviewer sign-off function is ready.",
      statuses: ["resumed", "ended", "unauthorized", "error"],
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, status: "error", reasons: ["Method not allowed"] }, 405);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonResponse({ ok: false, status: "error", reasons: ["Server configuration missing."] }, 500);
  }

  try {
    // Verify signed-in reviewer token (hosting-rules.md Rule 5)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse({ ok: false, status: "unauthorized", reasons: ["Reviewer sign-in required."] }, 401);
    }

    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return jsonResponse({ ok: false, status: "unauthorized", reasons: ["Invalid or expired reviewer session."] }, 401);
    }

    const reviewerEmail = userData.user.email || "Nicolas Gonzalez";
    const body = await req.json();
    const listingId = String(body.listing_id || "").trim();
    const decision = String(body.decision || "").trim().toLowerCase();
    const reason = String(body.reason || "").trim();
    const lessonText = String(body.lesson_text || "").trim();

    if (!listingId || !["resume", "end"].includes(decision) || !reason) {
      return jsonResponse(
        { ok: false, status: "error", reasons: ["listing_id, decision ('resume' or 'end'), and a non-empty reason are required."] },
        400,
      );
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("evaluated_listings")
      .select("*")
      .eq("listing_id", listingId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return jsonResponse({ ok: false, status: "error", reasons: ["Listing not found."] }, 404);
    }

    const nowIso = new Date().toISOString();
    const newStatus = decision === "resume" ? "qualified" : "discarded_scam";
    const updatedFraudScore =
      decision === "resume"
        ? Math.min(Number(existing.fraud_risk_score || 0.35), 0.35)
        : Math.max(Number(existing.fraud_risk_score || 0.9), 0.9);
    const updatedRankScore =
      decision === "resume" ? Number(existing.rank_score ?? 65) : null;

    const { error: updateErr } = await supabase
      .from("evaluated_listings")
      .update({
        status: newStatus,
        fraud_risk_score: updatedFraudScore,
        rank_score: updatedRankScore,
        reviewed_by: reviewerEmail,
        reviewed_at: nowIso,
        review_decision: decision,
        review_reason: reason,
        updated_at: nowIso,
      })
      .eq("listing_id", listingId);

    if (updateErr) throw new Error(updateErr.message);

    // Record a trusted lesson learned (memory-rules.md Rules 3, 4, 5, 8)
    const outcome = decision === "end" ? "confirmed_scam" : "verified_legitimate";
    const autoLesson =
      lessonText ||
      (decision === "end"
        ? `Watch for scams similar to ${existing.title} (${existing.neighborhood}): ${reason}`
        : `Note for ${existing.neighborhood} reviews (${existing.title}): ${reason}`);
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("lessons").upsert(
      {
        lesson: autoLesson,
        topic: existing.neighborhood || "SLO Rentals",
        learned_from: listingId,
        outcome,
        active: true,
        expires_at: expiresAt,
      },
      { onConflict: "learned_from,outcome" },
    );

    return jsonResponse({
      ok: true,
      status: decision === "resume" ? "resumed" : "ended",
      reasons: [`Listing ${listingId} marked ${newStatus} by ${reviewerEmail} and lesson recorded.`],
      ms: Date.now() - startedAt,
    });
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        status: "error",
        reasons: [err instanceof Error ? err.message : "Unexpected error in review-decision."],
        ms: Date.now() - startedAt,
      },
      500,
    );
  }
});
