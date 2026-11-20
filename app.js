// ============================================================================
// Poly Rental Matcher — Frontend Application (GitHub Pages)
// Follows our_team_agent/runtime/hosting-rules.md:
//   - Only public SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY live here
//   - Student Edge Function calls send apikey header only (no Authorization)
//   - All dynamic text uses textContent (never innerHTML)
// ============================================================================

const SUPABASE_URL = "https://qjfutrpwvzqlhwcgfhai.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HL_Xx2oruGMM3JPZZVyDaQ_5xRLZdwq";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Quick Demo picks 6 representative listings from our_team_agent/data/listings.csv
// (2 clean matches, 1 hidden-fee trap, 1 no-sublease trap, 1 prompt-injection scam, 1 ambiguous review case)
const QUICK_DEMO_IDS = new Set(["SLO-001", "SLO-002", "SLO-011", "SLO-015", "SLO-024", "SLO-025"]);

let activeDraft = null;
let currentSession = null;

// --- DOM Helpers (Safe: textContent only, never innerHTML) ---
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function clearEl(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function showBanner(message, type = "info") {
  const banner = document.getElementById("global-banner");
  banner.textContent = message;
  banner.className = `banner ${type}`;
}

function hideBanner() {
  const banner = document.getElementById("global-banner");
  banner.className = "banner hidden";
}

function money(val) {
  const n = Number(val || 0);
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// --- CSV Parser for selecting Quick Demo / Medium slices ---
function splitCsvLines(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines;
}

function sliceCsv(csvText, limit) {
  const lines = splitCsvLines(csvText);
  if (lines.length < 2) return csvText;
  const header = lines[0];
  const dataLines = lines.slice(1);
  if (limit === 6) {
    const picked = dataLines.filter((line) => {
      const id = line.split(",")[0].trim();
      return QUICK_DEMO_IDS.has(id);
    });
    if (picked.length > 0) return [header, ...picked].join("\n");
  }
  return [header, ...dataLines.slice(0, limit)].join("\n");
}

// --- Tab Switching ---
const tabStudent = document.getElementById("tab-student");
const tabAdmin = document.getElementById("tab-admin");
const viewStudent = document.getElementById("view-student");
const viewAdmin = document.getElementById("view-admin");

tabStudent.addEventListener("click", () => {
  tabStudent.classList.add("active");
  tabAdmin.classList.remove("active");
  viewStudent.classList.remove("hidden");
  viewAdmin.classList.add("hidden");
});

tabAdmin.addEventListener("click", async () => {
  tabAdmin.classList.add("active");
  tabStudent.classList.remove("active");
  viewAdmin.classList.remove("hidden");
  viewStudent.classList.add("hidden");
  await checkAdminSession();
});

// ==================== STUDENT FLOW (T1, T2, T7, T8, T9) ====================

async function loadSavedQualifiedMatches() {
  hideBanner();
  const { data, error } = await sb
    .from("evaluated_listings")
    .select("*")
    .eq("status", "qualified")
    .order("rank_score", { ascending: false });

  if (error) {
    showBanner(`Could not load saved matches: ${error.message}`, "error");
    return;
  }
  renderMatches(data || [], false);
  if (!data || data.length === 0) {
    showBanner("No saved qualified matches yet. Click 'Evaluate SLO Listings' to run your first search!", "info");
  } else {
    showBanner(`Loaded ${data.length} verified safe match(es) from Supabase.`, "ok");
  }
}

document.getElementById("load-saved-btn").addEventListener("click", loadSavedQualifiedMatches);

document.getElementById("criteria-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideBanner();
  const runBtn = document.getElementById("run-search-btn");
  const statsBox = document.getElementById("run-stats");
  runBtn.disabled = true;
  runBtn.textContent = "Evaluating listings...";
  statsBox.classList.add("hidden");

  try {
    const criteria = {
      max_budget: Number(document.getElementById("max-budget").value) || 2400,
      min_bedrooms: Number(document.getElementById("min-bedrooms").value) || 0,
      sublease_required: document.getElementById("sublease-required").checked,
      pets_required: document.getElementById("pets-required").checked,
      has_vehicle: document.getElementById("has-vehicle").checked,
    };
    const dryRun = document.getElementById("dry-run-toggle").checked;
    const sampleLimit = Number(document.getElementById("sample-limit").value) || 6;
    const fileInput = document.getElementById("csv-file-input");

    let csvText = "";
    if (fileInput.files && fileInput.files.length > 0) {
      csvText = await fileInput.files[0].text();
    } else {
      const resp = await fetch("our_team_agent/data/listings.csv");
      if (!resp.ok) throw new Error("Could not load sample our_team_agent/data/listings.csv");
      const fullCsv = await resp.text();
      csvText = sliceCsv(fullCsv, sampleLimit);
    }

    // Call Edge Function with publishable key on apikey header ONLY (hosting-rules.md Rule 5)
    const fnResp = await fetch(`${SUPABASE_URL}/functions/v1/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        dry_run: dryRun,
        criteria,
        csv_text: csvText,
      }),
    });

    const data = await fnResp.json();

    if (data.status === "paused") {
      showBanner("Agent is currently PAUSED by the reviewer off switch. No AI calls were made.", "warn");
      return;
    }

    if (!data.ok) {
      showBanner(`Agent stopped (${data.status}): ${(data.reasons || []).join(" ")}`, "error");
      return;
    }

    const allResults = Array.isArray(data.results) ? data.results : [];
    const qualified = allResults.filter((r) => r.status === "qualified");
    const heldCount = allResults.filter((r) => String(r.status).startsWith("held")).length;
    const discardedCount = allResults.filter((r) => String(r.status).startsWith("discarded")).length;

    renderMatches(qualified, dryRun);

    const seconds = ((data.ms || 0) / 1000).toFixed(1);
    const modelName = data.usage?.model || "none";
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    statsBox.textContent =
      `${dryRun ? "[DRY RUN — NOT SAVED] " : ""}` +
      `Evaluated ${allResults.length} listing(s) in ${seconds}s using ${modelName} (${tokens} tokens): ` +
      `${qualified.length} verified safe, ${heldCount} held for reviewer, ${discardedCount} filtered out (budget, dealbreakers, or scams).`;
    statsBox.classList.remove("hidden");

    showBanner(
      qualified.length > 0
        ? `Found ${qualified.length} verified safe match(es) within your effective budget!`
        : "No listings qualified under your criteria. Try raising your budget or relaxing a filter.",
      qualified.length > 0 ? "ok" : "warn",
    );
  } catch (err) {
    showBanner(`Error running evaluation: ${err.message}`, "error");
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "Evaluate SLO Listings";
  }
});

function renderMatches(listings, isDryRun) {
  const container = document.getElementById("matches-list");
  const countBadge = document.getElementById("match-count");
  clearEl(container);
  countBadge.textContent = `${listings.length} match${listings.length === 1 ? "" : "es"}`;

  if (listings.length === 0) {
    const empty = el("div", "card muted", "No verified safe matches to display yet.");
    container.appendChild(empty);
    return;
  }

  listings.forEach((item, idx) => {
    const card = el("article", "listing-card");

    const top = el("div", "listing-top");
    const titleEl = el("h3", "listing-title", `#${idx + 1} · ${item.title}`);
    const scorePill = el("span", "pill pill-gold", `Score: ${item.rank_score ?? "—"}`);
    top.appendChild(titleEl);
    top.appendChild(scorePill);
    card.appendChild(top);

    card.appendChild(
      el(
        "div",
        "meta-line",
        `${item.neighborhood} · ${item.bedrooms === 0 ? "Studio" : `${item.bedrooms} BR`} / ${item.bathrooms} BA · ${item.commute_minutes ?? "?"} min (${item.commute_miles ?? "?"} mi) to Cal Poly`,
      ),
    );
    card.appendChild(el("div", "meta-line", item.address));

    // Effective Cost Breakdown Box
    const costBox = el("div", "cost-box");
    costBox.appendChild(el("div", "cost-total", `${money(item.effective_monthly_cost)} / mo effective`));
    costBox.appendChild(
      el(
        "div",
        "cost-breakdown",
        `Base ${money(item.base_rent)} + Utilities ${money(item.monthly_utilities)} + Parking ${money(item.parking_expense)} + Commute ${money(item.commute_expense)}`,
      ),
    );
    card.appendChild(costBox);

    // Lease & Safety Pills
    const tags = el("div", "meta-line");
    tags.textContent = `Sublease: ${item.sublease_allowed} · Pets: ${item.pets_allowed} · Price: ${item.price_realism_label || "Realistic"}`;
    card.appendChild(tags);

    // Action Buttons
    const actions = el("div", "card-actions");

    const link = el("a", "btn btn-secondary btn-sm", "Open Listing ↗");
    link.href = item.listing_url || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    actions.appendChild(link);

    const draftBtn = el("button", "btn btn-primary btn-sm", "Draft Inquiry");
    draftBtn.type = "button";
    draftBtn.addEventListener("click", () => handleDraftInquiry(item, isDryRun, draftBtn));
    actions.appendChild(draftBtn);

    const reportBtn = el("button", "btn btn-secondary btn-sm", "Report Listing");
    reportBtn.type = "button";
    reportBtn.addEventListener("click", () => handleReportListing(item));
    actions.appendChild(reportBtn);

    card.appendChild(actions);
    container.appendChild(card);
  });
}

async function handleDraftInquiry(listing, isDryRun, btn) {
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Drafting...";

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/draft-inquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        dry_run: isDryRun,
        listing_id: listing.listing_id,
        listing: isDryRun ? listing : undefined,
        student_name: "Cal Poly Student",
        move_in_date: "September 1, 2026",
      }),
    });

    const data = await resp.json();
    if (data.status === "paused") {
      showBanner("Agent is paused — cannot draft inquiries right now.", "warn");
      return;
    }
    if (!data.ok && data.status !== "duplicate") {
      showBanner(`Could not draft inquiry: ${(data.reasons || []).join(" ")}`, "error");
      return;
    }

    activeDraft = data.draft;
    const panel = document.getElementById("inquiry-panel");
    document.getElementById("inquiry-meta").textContent =
      `To: ${activeDraft.landlord_contact} · Listing: ${activeDraft.listing_id} · Status: ${activeDraft.status}` +
      (data.status === "duplicate" ? " (Loaded existing draft — duplicate prevented)" : "");
    document.getElementById("draft-subject").value = activeDraft.subject || "";
    document.getElementById("draft-body").value = activeDraft.body || "";
    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showBanner(`Error drafting inquiry: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

document.getElementById("approve-copy-btn").addEventListener("click", async () => {
  if (!activeDraft) return;
  const subject = document.getElementById("draft-subject").value;
  const body = document.getElementById("draft-body").value;

  if (activeDraft.id) {
    await sb
      .from("inquiry_drafts")
      .update({
        subject,
        body,
        status: "approved_by_student",
        approved_at: new Date().toISOString(),
      })
      .eq("id", activeDraft.id);
  }

  try {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    showBanner("Draft approved and copied to your clipboard! Paste it into your email app when ready to send.", "ok");
  } catch {
    showBanner("Draft approved! Select and copy the text above to send from your email app.", "ok");
  }
});

document.getElementById("close-inquiry-btn").addEventListener("click", () => {
  document.getElementById("inquiry-panel").classList.add("hidden");
});

async function handleReportListing(listing) {
  const note = window.prompt(
    `Report a problem with "${listing.title}" (${listing.listing_id}):\nDescribe inaccurate fees, lease terms, or suspected fraud:`,
  );
  if (!note || !note.trim()) return;

  const { error } = await sb.from("listing_reports").insert({
    listing_id: listing.listing_id,
    reporter_note: note.trim(),
    reported_by: "student",
  });

  if (error) {
    showBanner(`Could not submit report: ${error.message}`, "error");
  } else {
    showBanner("Thank you — your report was sent to Nicolas Gonzalez's review queue.", "ok");
  }
}

// ==================== REVIEWER / ADMIN FLOW ====================

async function checkAdminSession() {
  const { data } = await sb.auth.getSession();
  currentSession = data?.session || null;
  const loginCard = document.getElementById("admin-login-card");
  const dash = document.getElementById("admin-dashboard");

  if (currentSession) {
    loginCard.classList.add("hidden");
    dash.classList.remove("hidden");
    document.getElementById("admin-user-label").textContent = `Signed in as ${currentSession.user.email}`;
    await loadAdminData();
  } else {
    loginCard.classList.remove("hidden");
    dash.classList.add("hidden");
  }
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideBanner();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showBanner(`Sign-in failed: ${error.message}`, "error");
    return;
  }
  showBanner("Signed in as reviewer.", "ok");
  await checkAdminSession();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await sb.auth.signOut();
  showBanner("Signed out.", "info");
  await checkAdminSession();
});

document.getElementById("refresh-admin-btn").addEventListener("click", loadAdminData);

async function loadAdminData() {
  await Promise.all([loadSettings(), loadHeldListings(), loadLessons(), loadReports()]);
}

async function loadSettings() {
  const container = document.getElementById("settings-list");
  clearEl(container);
  const { data, error } = await sb.from("agent_settings").select("*").order("key");
  if (error) {
    container.appendChild(el("p", "muted", `Error loading settings: ${error.message}`));
    return;
  }

  (data || []).forEach((s) => {
    const row = el("div", "admin-item");
    const top = el("div", "admin-row");
    top.appendChild(el("strong", "", `${s.label} (${s.key})`));
    top.appendChild(
      el("span", s.key === "paused" && s.value === "true" ? "pill pill-danger" : "pill", `Current: ${s.value}`),
    );
    row.appendChild(top);
    row.appendChild(el("div", "meta-line", `Last changed by ${s.updated_by}: "${s.reason}"`));

    const controls = el("div", "admin-row");
    let valInput;
    if (s.kind === "switch") {
      valInput = document.createElement("select");
      valInput.className = "inline-input";
      const optFalse = el("option", "", "false");
      optFalse.value = "false";
      const optTrue = el("option", "", "true");
      optTrue.value = "true";
      valInput.appendChild(optFalse);
      valInput.appendChild(optTrue);
      valInput.value = s.value;
    } else {
      valInput = document.createElement("input");
      valInput.type = "number";
      valInput.className = "inline-input";
      valInput.value = s.value;
    }

    const reasonInput = document.createElement("input");
    reasonInput.type = "text";
    reasonInput.className = "inline-input";
    reasonInput.placeholder = "Required reason for change...";

    const saveBtn = el("button", "btn btn-primary btn-sm", "Save");
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async () => {
      const reason = reasonInput.value.trim();
      if (!reason) {
        showBanner("A reason is required before changing any setting.", "warn");
        return;
      }
      const { error: upErr } = await sb
        .from("agent_settings")
        .update({
          value: String(valInput.value),
          reason,
          updated_by: currentSession?.user?.email || "Nicolas Gonzalez",
          updated_at: new Date().toISOString(),
        })
        .eq("key", s.key);
      if (upErr) {
        showBanner(`Update failed: ${upErr.message}`, "error");
      } else {
        showBanner(`Updated ${s.key} to "${valInput.value}".`, "ok");
        await loadSettings();
      }
    });

    controls.appendChild(valInput);
    controls.appendChild(reasonInput);
    controls.appendChild(saveBtn);
    row.appendChild(controls);
    container.appendChild(row);
  });
}

async function loadHeldListings() {
  const container = document.getElementById("held-list");
  clearEl(container);
  const { data, error } = await sb
    .from("evaluated_listings")
    .select("*")
    .in("status", ["held_fraud", "held_policy"])
    .order("updated_at", { ascending: false });

  if (error) {
    container.appendChild(el("p", "muted", `Error loading held listings: ${error.message}`));
    return;
  }
  if (!data || data.length === 0) {
    container.appendChild(el("p", "muted", "No held listings waiting for review right now."));
    return;
  }

  data.forEach((item) => {
    const box = el("div", "admin-item");
    const top = el("div", "admin-row");
    top.appendChild(el("strong", "", `${item.listing_id} — ${item.title} (${item.neighborhood})`));
    top.appendChild(el("span", "pill pill-warn", `${item.status} · Fraud: ${item.fraud_risk_score}`));
    box.appendChild(top);

    box.appendChild(
      el(
        "div",
        "meta-line",
        `Base: ${money(item.base_rent)} | Effective: ${money(item.effective_monthly_cost)} | Market Delta: ${item.market_delta_pct}%`,
      ),
    );
    box.appendChild(el("div", "", `Hold reason: ${item.hold_reason || "Flagged for manual review"}`));
    box.appendChild(el("div", "meta-line", `Agent checked: ${(item.sources_checked || []).join(" · ")}`));

    const controls = el("div", "admin-row");
    const reasonInput = document.createElement("input");
    reasonInput.type = "text";
    reasonInput.className = "inline-input";
    reasonInput.placeholder = "Decision reason (also recorded as a Lesson Learned)...";

    const resumeBtn = el("button", "btn btn-primary btn-sm", "Resume (Mark Safe)");
    resumeBtn.type = "button";
    resumeBtn.addEventListener("click", () => submitReviewDecision(item.listing_id, "resume", reasonInput.value));

    const endBtn = el("button", "btn btn-danger btn-sm", "End (Confirm Scam)");
    endBtn.type = "button";
    endBtn.addEventListener("click", () => submitReviewDecision(item.listing_id, "end", reasonInput.value));

    controls.appendChild(reasonInput);
    controls.appendChild(resumeBtn);
    controls.appendChild(endBtn);
    box.appendChild(controls);
    container.appendChild(box);
  });
}

async function submitReviewDecision(listingId, decision, reason) {
  if (!reason.trim()) {
    showBanner("Please enter a reason before recording your sign-off decision.", "warn");
    return;
  }
  const token = currentSession?.access_token;
  if (!token) {
    showBanner("Please sign in again.", "error");
    return;
  }

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/review-decision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ listing_id: listingId, decision, reason: reason.trim() }),
  });

  const data = await resp.json();
  if (!data.ok) {
    showBanner(`Decision failed: ${(data.reasons || []).join(" ")}`, "error");
    return;
  }
  showBanner((data.reasons || ["Decision recorded."]).join(" "), "ok");
  await loadAdminData();
}

async function loadLessons() {
  const container = document.getElementById("lessons-list");
  clearEl(container);
  const { data, error } = await sb.from("lessons").select("*").order("created_at", { ascending: false });
  if (error) {
    container.appendChild(el("p", "muted", `Error loading lessons: ${error.message}`));
    return;
  }
  if (!data || data.length === 0) {
    container.appendChild(el("p", "muted", "No lessons learned yet. Decisions in the review queue above create lessons automatically."));
    return;
  }

  data.forEach((lesson) => {
    const box = el("div", "admin-item");
    const row = el("div", "admin-row");
    row.appendChild(el("strong", "", `[${lesson.topic}] ${lesson.lesson}`));
    const toggleBtn = el(
      "button",
      lesson.active ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm",
      lesson.active ? "Active (Switch Off)" : "Off (Switch On)",
    );
    toggleBtn.type = "button";
    toggleBtn.addEventListener("click", async () => {
      const { error: uErr } = await sb
        .from("lessons")
        .update({ active: !lesson.active })
        .eq("id", lesson.id);
      if (uErr) showBanner(uErr.message, "error");
      else await loadLessons();
    });
    row.appendChild(toggleBtn);
    box.appendChild(row);
    box.appendChild(el("div", "meta-line", `Source: ${lesson.learned_from} (${lesson.outcome})`));
    container.appendChild(box);
  });
}

async function loadReports() {
  const container = document.getElementById("reports-list");
  clearEl(container);
  const { data, error } = await sb
    .from("listing_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    container.appendChild(el("p", "muted", `Error loading reports: ${error.message}`));
    return;
  }
  if (!data || data.length === 0) {
    container.appendChild(el("p", "muted", "No student reports submitted yet."));
    return;
  }

  data.forEach((rep) => {
    const box = el("div", "admin-item");
    const row = el("div", "admin-row");
    row.appendChild(el("strong", "", `Listing ${rep.listing_id}: "${rep.reporter_note}"`));
    if (rep.resolved) {
      row.appendChild(el("span", "pill", "Resolved"));
    } else {
      const btn = el("button", "btn btn-primary btn-sm", "Mark Resolved");
      btn.type = "button";
      btn.addEventListener("click", async () => {
        await sb
          .from("listing_reports")
          .update({
            resolved: true,
            resolved_by: currentSession?.user?.email || "Nicolas Gonzalez",
            resolved_at: new Date().toISOString(),
          })
          .eq("id", rep.id);
        await loadReports();
      });
      row.appendChild(btn);
    }
    box.appendChild(row);
    container.appendChild(box);
  });
}

// Initial load: show any previously saved qualified matches
loadSavedQualifiedMatches();
