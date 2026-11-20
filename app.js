// ============================================================================
// Poly Rental Matcher — Rosa Alba Motion Craft × Cal Poly SLO Housing App
// Follows our_team_agent/runtime/hosting-rules.md:
//   - Only public SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY live here
//   - Student Edge Function calls send apikey header only (no Authorization)
//   - All dynamic user/listing text uses textContent (never innerHTML)
// ============================================================================

const SUPABASE_URL = "https://qjfutrpwvzqlhwcgfhai.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HL_Xx2oruGMM3JPZZVyDaQ_5xRLZdwq";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = window.matchMedia("(pointer: fine)").matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ==================== SPRING PHYSICS ENGINE (Shared rAF + Lenis) ====================
const CFG = {
  smooth: { k: 64, d: 22 },
  snappy: { k: 175, d: 26 },
  tilt: { k: 170, d: 26 },
  par: { k: 90, d: 34, m: 1.4 },
  bump: { k: 240, d: 13 },
  roll: { k: 120, d: 24 },
};

const liveSprings = new Set();
class Spring {
  constructor(x = 0, c = CFG.smooth, on = null) {
    this.x = this.t = x;
    this.v = 0;
    this.c = c;
    this.w = 0;
    this.on = on;
    this.eps = 1e-3;
  }
  to(t, c, w = 0) {
    this.t = t;
    if (c) this.c = c;
    this.w = w;
    if (RM) {
      this.x = t;
      this.v = 0;
      if (this.on) this.on(t);
      return this;
    }
    liveSprings.add(this);
    return this;
  }
  kick(v) {
    if (RM) return;
    this.v += v;
    liveSprings.add(this);
  }
  set(x) {
    this.x = this.t = x;
    this.v = 0;
    if (this.on) this.on(x);
  }
  step(dt) {
    if (this.w > 0) {
      this.w -= dt;
      if (this.w > 0) return true;
      dt = -this.w;
      this.w = 0;
    }
    const { k, d, m = 1 } = this.c;
    const n = Math.max(1, Math.ceil(dt * 120));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = (-k * (this.x - this.t) - d * this.v) / m;
      this.v += a * h;
      this.x += this.v * h;
    }
    if (Math.abs(this.v) < this.eps && Math.abs(this.x - this.t) < this.eps * 0.5) {
      this.x = this.t;
      this.v = 0;
      if (this.on) this.on(this.x);
      return false;
    }
    if (this.on) this.on(this.x);
    return true;
  }
}

let lenis = null;
if (!RM && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
}

const frameSubs = new Set();
let lastFrame = performance.now();
let elapsedT = 0;
function tick(now) {
  const dt = Math.min(0.064, (now - lastFrame) / 1000);
  lastFrame = now;
  elapsedT += dt;
  if (lenis) lenis.raf(now);
  for (const s of liveSprings) {
    if (!s.step(dt)) liveSprings.delete(s);
  }
  for (const fn of frameSubs) {
    try { fn(elapsedT, dt); } catch { frameSubs.delete(fn); }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Smooth anchor navigation
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    showStudentView();
    if (lenis) lenis.scrollTo(target, { duration: 1.35, offset: -12 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

// ==================== FLOATING GLASS NAV TONE ====================
const glassNav = document.getElementById("glass-nav");
const themedSections = [...document.querySelectorAll("[data-theme]")];
const heroEl = document.getElementById("top");

frameSubs.add(() => {
  const adminOpen = !document.getElementById("view-admin").classList.contains("hidden");
  if (adminOpen) {
    glassNav.classList.add("light");
    return;
  }
  const probeY = 48;
  let theme = "light";
  for (const s of themedSections) {
    if (s.classList.contains("hidden")) continue;
    const r = s.getBoundingClientRect();
    if (r.top <= probeY && r.bottom > probeY) {
      theme = s.dataset.theme || "light";
      break;
    }
  }
  const hr = heroEl.getBoundingClientRect();
  if (hr.bottom > probeY) {
    theme = hr.bottom - window.innerHeight * 0.35 > 0 ? "dark" : "light";
  }
  glassNav.classList.toggle("light", theme === "light");
});

// ==================== HERO WORDMARK, 3D LEAN, BREEZE RIPPLE & CLOCK ====================
const heroStage = document.getElementById("hero-stage");
const heroBg = document.getElementById("hero-bg");
const heroSunGlow = document.getElementById("hero-sun-glow");
const heroMark = document.getElementById("hero-mark");
const heroFoot = document.getElementById("hero-foot");

const markLetters = [];
heroMark.querySelectorAll(".ln").forEach((ln) => {
  const txt = ln.textContent;
  ln.textContent = "";
  [...txt].forEach((ch) => {
    const li = document.createElement("span");
    li.className = "li";
    li.textContent = ch;
    ln.appendChild(li);
    const o = {
      li,
      rx: new Spring(0, CFG.tilt),
      ry: new Spring(0, CFG.tilt),
      ty: new Spring(0, CFG.tilt),
      bump: new Spring(0, CFG.bump),
      cx: 0,
      cy: 0,
    };
    const apply = () => {
      li.style.transform = `translate3d(0,${o.ty.x + o.bump.x}px,0) rotateX(${o.rx.x}deg) rotateY(${o.ry.x}deg)`;
    };
    o.rx.on = o.ry.on = o.ty.on = o.bump.on = apply;
    markLetters.push(o);
  });
});

function fitHeroAndFooterMarks() {
  const W = window.innerWidth;
  heroMark.style.fontSize = "100px";
  const totalW = [...heroMark.children].reduce((sum, c) => sum + c.getBoundingClientRect().width, 0) || 600;
  const target = W * (W < 760 ? 0.9 : 0.84);
  heroMark.style.fontSize = `${(100 * target) / totalW}px`;
  markLetters.forEach((o) => {
    const r = o.li.getBoundingClientRect();
    o.cx = r.left + r.width / 2;
    o.cy = r.top + r.height / 2;
  });

  const fm = document.getElementById("foot-mark");
  if (fm) {
    fm.style.fontSize = "100px";
    const fw = fm.scrollWidth || 600;
    fm.style.fontSize = `${(100 * W * 0.9) / fw}px`;
  }
}

const parX = new Spring(0, CFG.par);
const parY = new Spring(0, CFG.par);

if (FINE && !RM) {
  window.addEventListener("pointermove", (e) => {
    const r = heroStage.getBoundingClientRect();
    if (e.clientY > r.bottom || e.clientY < r.top) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    parX.to(Math.tanh(nx * 1.1));
    parY.to(Math.tanh(ny * 1.1));
    heroSunGlow.style.setProperty("--lx", `${(e.clientX / window.innerWidth) * 100}%`);
    heroSunGlow.style.setProperty("--ly", `${(e.clientY / window.innerHeight) * 100}%`);

    for (const o of markLetters) {
      const dx = e.clientX - o.cx;
      const dy = e.clientY - (o.cy || window.innerHeight * 0.25);
      const inf = Math.exp(-(dx * dx) / (2 * 240 * 240)) * Math.exp(-(dy * dy) / (2 * 340 * 340));
      o.ry.to(Math.tanh(dx / 250) * 16 * inf);
      o.rx.to(-Math.tanh(dy / 250) * 10 * inf);
      o.ty.to(-inf * 14);
    }
  }, { passive: true });
}

// Click the sky: coastal SLO breeze ripple across the letters
heroStage.addEventListener("pointerdown", (e) => {
  if (e.target.closest("a, button")) return;
  markLetters.forEach((o) => {
    const d = Math.abs(e.clientX - o.cx);
    o.bump.v = 0;
    o.bump.w = d / 1400;
    o.bump.kick(-850 * Math.exp(-d / 520));
  });
  const windEl = document.getElementById("hud-wind");
  windEl.textContent = `${15 + Math.round(Math.random() * 8)} kn`;
  clearTimeout(windEl._t);
  windEl._t = setTimeout(() => { windEl.textContent = "11 kn"; }, 2400);
});

// Hero scroll push + parallax
frameSubs.add(() => {
  const r = heroEl.getBoundingClientRect();
  if (r.bottom <= 0) return;
  const span = Math.max(1, heroEl.offsetHeight - window.innerHeight);
  const q = clamp(-r.top / span, 0, 1);
  heroBg.style.transform = `translate3d(${-parX.x * 16}px,${-parY.x * 10}px,0) scale(${1.04 + q * 0.08})`;
  heroMark.style.transform = `translate3d(${-parX.x * 8}px,${-parY.x * 5 - q * 48}px,0) scale(${1 + q * 0.06})`;
  heroFoot.style.transform = `translate3d(0,${-q * 34}px,0)`;
});

// Live San Luis Obispo Pacific Clock
const hudClock = document.getElementById("hud-clock");
function tickClock() {
  try {
    hudClock.textContent = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Los_Angeles",
    }).format(new Date());
  } catch {
    hudClock.textContent = "SLO";
  }
}
tickClock();
setInterval(tickClock, 15000);

// ==================== SCROLL-LINKED MARQUEE ====================
const marqWords = [
  "Walk to Dexter Lawn",
  "True Monthly Cost",
  "Verified Safe Listings",
  "1-Mile $0 Commute Zone",
  "Sublease-Friendly Filters",
  "You Approve Every Message",
];
const marqTrack = document.getElementById("marq-track");
const COPIES = 4;
for (let c = 0; c < COPIES; c++) {
  const set = document.createElement("div");
  set.className = "marq-set";
  marqWords.forEach((w) => {
    const span = document.createElement("span");
    span.className = "marq-it";
    span.textContent = w;
    set.appendChild(span);
  });
  marqTrack.appendChild(set);
}
const mqSpring = new Spring(0, { k: 90, d: 34 });
mqSpring.eps = 0.001;
frameSubs.add((t) => {
  mqSpring.to(window.scrollY * 0.0045 + (RM ? 0 : t * 0.55));
  const one = 100 / COPIES;
  const m = ((mqSpring.x % one) + one) % one;
  marqTrack.style.transform = `translate3d(${-m}%,0,0)`;
});

// ==================== 02 SPRING SEGMENTED RENTER GUIDE ====================
const RULE_TABS = [
  {
    when: "Standard SLO Utility & Transit Estimates",
    where: "Updated for 2026",
    note: "Asking rent rarely tells the whole story. We add realistic local estimates for missing utilities, parking, and commuting so you can compare apartments apples-to-apples.",
    items: [
      ["Utilities not included (Studio or 1BR)", "+$165 / mo"],
      ["Utilities not included (2BR or larger)", "+$270 / mo"],
      ["Street permit ($15) or off-site parking if needed", "+$15 to $100"],
      ["Commute to Cal Poly (free within 1 mile)", "$0.65 / roundtrip mi"],
    ],
  },
  {
    when: "Typical San Luis Obispo Neighborhood Rents",
    where: "Local Market Guide",
    note: "Every listing is compared against typical local rents for its neighborhood and bedroom count so you can spot a genuine deal—and avoid bait-and-switch pricing.",
    items: [
      ["Foothill Blvd Corridor (1BR / 2BR typical)", "$1,950 / $2,850"],
      ["North Chorro & Hathway (Walking distance)", "$1,900 / $2,750"],
      ["Downtown SLO & Mill Street (1BR / 2BR)", "$2,075 / $2,950"],
      ["Laguna Lake & South Higuera (Transit zone)", "$1,700 – $2,500"],
    ],
  },
  {
    when: "Student Renter Protection",
    where: "Always On",
    note: "We screen every rental before it appears in your feed so you never waste time on fake listings, hidden lease traps, or pushy deposit scams.",
    items: [
      ["Wire, Zelle, or deposit-before-tour scams", "Filtered Out"],
      ["Unusually cheap bait-and-switch listings", "Manually Reviewed"],
      ["Landlord inquiry emails", "Drafted for Your Approval"],
      ["Spot an error or red flag on any listing", "1-Click Report"],
    ],
  },
];

const rulesList = document.getElementById("rules-list");
const rulesBtns = [...document.querySelectorAll("#rules-seg button")];
const rulesThumb = document.getElementById("rules-thumb");
const thX = new Spring(0, { k: 260, d: 28 });
const thW = new Spring(0, { k: 260, d: 28 });
thX.eps = thW.eps = 0.05;
const applyThumb = () => {
  rulesThumb.style.transform = `translateX(${thX.x}px)`;
  rulesThumb.style.width = `${thW.x}px`;
};
thX.on = thW.on = applyThumb;

let activeRuleTab = 0;
function placeRuleThumb(i, snap) {
  const b = rulesBtns[i];
  if (!b) return;
  if (snap) { thX.set(b.offsetLeft); thW.set(b.offsetWidth); }
  else { thX.to(b.offsetLeft); thW.to(b.offsetWidth); }
}

function renderRuleTab(i, animate) {
  const tab = RULE_TABS[i];
  document.getElementById("rules-when").textContent = tab.when;
  document.getElementById("rules-where").textContent = tab.where;
  document.getElementById("rules-note").textContent = tab.note;
  clearEl(rulesList);
  tab.items.forEach(([label, val], k) => {
    const li = document.createElement("li");
    li.appendChild(el("span", "", label));
    li.appendChild(el("span", "p", val));
    if (animate && !RM) {
      li.style.opacity = "0";
      const sp = new Spring(0, CFG.snappy, (x) => {
        li.style.opacity = String(Math.min(1, x * 1.3));
        li.style.transform = `translate3d(0,${(1 - x) * 14}px,0)`;
      });
      sp.to(1, CFG.snappy, 0.04 + k * 0.05);
    }
    rulesList.appendChild(li);
  });
}

rulesBtns.forEach((b, i) => {
  b.addEventListener("click", () => {
    if (i === activeRuleTab) return;
    activeRuleTab = i;
    rulesBtns.forEach((btn, k) => btn.setAttribute("aria-selected", String(k === i)));
    placeRuleThumb(i, false);
    renderRuleTab(i, true);
  });
});

renderRuleTab(0, false);

// Editorial Photo Clip-Wipe on scroll
const rulesPhoto = document.getElementById("rules-photo");
if ("IntersectionObserver" in window && rulesPhoto) {
  const photoObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      photoObs.disconnect();
      const img = rulesPhoto.querySelector("img");
      const sp = new Spring(0, { k: 28, d: 12 }, (x) => {
        rulesPhoto.style.clipPath = `inset(0 0 ${(1 - x) * 100}% 0 round 14px)`;
        img.style.transform = `scale(${1.15 - 0.15 * x})`;
      });
      sp.to(1);
    });
  }, { threshold: 0.15 });
  photoObs.observe(rulesPhoto.parentElement);
} else if (rulesPhoto) {
  rulesPhoto.style.clipPath = "inset(0 0 0% 0 round 14px)";
}

// ==================== 03 SPRING FAQ ACCORDION ====================
document.querySelectorAll(".qa").forEach((q) => {
  const btn = q.querySelector("button");
  const ans = q.querySelector(".ans");
  const pl = q.querySelector(".pl");
  const sp = new Spring(0, CFG.snappy, (x) => {
    ans.style.height = `${x * ans.scrollHeight}px`;
    pl.style.transform = `rotate(${x * 45}deg)`;
  });
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    sp.to(open ? 1 : 0);
  });
});

// ==================== TILT + SPOTLIGHT HELPER FOR RENTAL CARDS ====================
function attachCardTilt(card) {
  if (!FINE || RM) return;
  const surf = card.querySelector(".rental-surf");
  const spot = card.querySelector(".card-spot");
  if (!surf) return;
  const rx = new Spring(0, CFG.tilt);
  const ry = new Spring(0, CFG.tilt);
  const apply = () => { surf.style.transform = `rotateX(${rx.x}deg) rotateY(${ry.x}deg)`; };
  rx.on = ry.on = apply;
  card.addEventListener("pointermove", (e) => {
    const r = surf.getBoundingClientRect();
    const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    rx.to(-ny * 3.8);
    ry.to(nx * 3.8);
    if (spot) {
      spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
      spot.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  });
  card.addEventListener("pointerleave", () => { rx.to(0); ry.to(0); });
}

// ==================== APP STATE, MAP & SUPABASE BACKEND ====================
const QUICK_DEMO_IDS = new Set(["SLO-001", "SLO-002", "SLO-011", "SLO-015", "SLO-024", "SLO-025"]);
const CAL_POLY_COORDS = [35.3050, -120.6625];
const NEIGHBORHOOD_COORDS = {
  "Foothill Boulevard Corridor": [35.2935, -120.6745],
  "North Chorro / Hathway": [35.2975, -120.6660],
  "Downtown SLO / Mill Street": [35.2828, -120.6596],
  "Laguna Lake / Madonna Road": [35.2640, -120.6880],
  "East SLO / Johnson Ave": [35.2760, -120.6435],
  "South Higuera / Broad St": [35.2570, -120.6635],
};

const uiState = {
  minBudget: 0,
  maxBudget: 2400,
  minBedrooms: 0,
  exactBedrooms: false,
  minBathrooms: 0,
  subleaseRequired: true,
  petsRequired: false,
  hasVehicle: true,
  allowLongCommute: false,
  selectedAmenities: new Set(),
  neighborhood: "",
  searchText: "",
  sortBy: "rank",
  isDryRunResults: false,
};

let allLoadedMatches = [];
let allFilteredOut = [];
let activeResultTab = "matched";
let activeDraft = null;
let currentSession = null;
let sloMap = null;
let walkCircle = null;
let bikeCircle = null;
let showWalkZone = true;
let showBikeZone = false;
const markerByListingId = new Map();

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}
function clearEl(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function money(val) { return `$${Math.round(Number(val || 0)).toLocaleString("en-US")}`; }

let bannerTimer = null;
function showBanner(message, type = "info") {
  const banner = document.getElementById("global-banner");
  banner.textContent = message;
  banner.className = `banner ${type}`;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => banner.classList.add("hidden"), 5500);
}

function getListingCoords(item) {
  const base = NEIGHBORHOOD_COORDS[item.neighborhood] || [35.2828, -120.6596];
  let hash = 0;
  const key = String(item.listing_id || item.address || "SLO");
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 1000;
  return [base[0] + ((hash % 20) - 10) * 0.00075, base[1] + ((Math.floor(hash / 20) % 20) - 10) * 0.00095];
}

function initMap() {
  if (!window.L || sloMap) return;
  sloMap = L.map("slo-map", { zoomControl: true, scrollWheelZoom: false }).setView([35.2865, -120.665], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(sloMap);

  const campusEl = el("div", "campus-pin", "🎓 Cal Poly SLO");
  L.marker(CAL_POLY_COORDS, {
    icon: L.divIcon({ className: "", html: campusEl.outerHTML, iconSize: [115, 24], iconAnchor: [57, 12] }),
    zIndexOffset: 500,
  }).addTo(sloMap);

  walkCircle = L.circle(CAL_POLY_COORDS, {
    radius: 1609, color: "#154734", weight: 2, dashArray: "6, 5", fillColor: "#154734", fillOpacity: 0.08,
  }).addTo(sloMap);

  bikeCircle = L.circle(CAL_POLY_COORDS, {
    radius: 3218, color: "#c8963e", weight: 1.8, dashArray: "5, 5", fillColor: "#c8963e", fillOpacity: 0.05,
  });

  const coordsDisplay = document.getElementById("coords-display");
  sloMap.on("move", () => {
    const c = sloMap.getCenter();
    coordsDisplay.textContent = `${c.lat.toFixed(3)}°N ${Math.abs(c.lng).toFixed(3)}°W`;
  });
}

function updateMapMarkers(listings) {
  if (!sloMap) return;
  markerByListingId.forEach((m) => sloMap.removeLayer(m));
  markerByListingId.clear();
  const bounds = [CAL_POLY_COORDS];

  listings.forEach((item) => {
    const coords = getListingCoords(item);
    bounds.push(coords);
    const isFail = item.status !== "qualified";
    const pinDiv = el("div", isFail ? "price-pin pin-fail" : "price-pin", money(item.effective_monthly_cost));
    pinDiv.dataset.listingId = item.listing_id;

    const marker = L.marker(coords, {
      icon: L.divIcon({ className: "", html: pinDiv.outerHTML, iconSize: [68, 24], iconAnchor: [34, 12] }),
    }).addTo(sloMap);

    const pop = el("div", "");
    pop.appendChild(el("strong", "", item.title));
    pop.appendChild(document.createElement("br"));
    pop.appendChild(el("span", "", `${money(item.effective_monthly_cost)}/mo effective · Score ${item.rank_score ?? "—"}`));
    pop.appendChild(document.createElement("br"));
    pop.appendChild(el("span", "muted", `${item.commute_minutes ?? "?"} min to Cal Poly · ${item.neighborhood}`));
    marker.bindPopup(pop);

    marker.on("click", () => {
      const card = document.querySelector(`.rental-card[data-listing-id="${CSS.escape(item.listing_id)}"]`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        card.classList.add("highlighted");
        setTimeout(() => card.classList.remove("highlighted"), 1600);
      }
    });
    markerByListingId.set(item.listing_id, marker);
  });

  if (bounds.length > 1) sloMap.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
}

function highlightPin(listingId, active) {
  const pinEl = document.querySelector(`.price-pin[data-listing-id="${CSS.escape(listingId)}"]`);
  if (pinEl) pinEl.classList.toggle("highlighted", active);
}

function pinpointOnMap(item) {
  const marker = markerByListingId.get(item.listing_id);
  if (sloMap && marker) {
    sloMap.setView(marker.getLatLng(), 15, { animate: true });
    marker.openPopup();
    highlightPin(item.listing_id, true);
    setTimeout(() => highlightPin(item.listing_id, false), 1800);
  }
}

document.getElementById("btn-center-calpoly").addEventListener("click", () => {
  if (sloMap) sloMap.setView(CAL_POLY_COORDS, 14);
});
document.getElementById("btn-toggle-walkzone").addEventListener("click", (e) => {
  showWalkZone = !showWalkZone;
  e.currentTarget.classList.toggle("active", showWalkZone);
  if (sloMap && walkCircle) { showWalkZone ? walkCircle.addTo(sloMap) : sloMap.removeLayer(walkCircle); }
});
document.getElementById("btn-toggle-bikezone").addEventListener("click", (e) => {
  showBikeZone = !showBikeZone;
  e.currentTarget.classList.toggle("active", showBikeZone);
  if (sloMap && bikeCircle) { showBikeZone ? bikeCircle.addTo(sloMap) : sloMap.removeLayer(bikeCircle); }
});

// ==================== MORPHING MEGA-MENU INTEGRATION ====================
function closeAllPopovers() {
  const mm = document.getElementById("filter-mega-menu");
  if (mm && mm.__vsMm) mm.__vsMm.close();
}
document.querySelectorAll(".popover-apply").forEach((btn) => {
  btn.addEventListener("click", () => { closeAllPopovers(); updatePillLabels(); applyLocalFiltersAndRender(); });
});

const HIST_HEIGHTS = [12, 22, 35, 58, 82, 95, 76, 62, 70, 48, 38, 28, 20, 14, 10];
function renderHistogram() {
  const box = document.getElementById("price-histogram");
  clearEl(box);
  HIST_HEIGHTS.forEach((h, idx) => {
    const bar = el("div", "hist-bar");
    bar.style.height = `${h}%`;
    const bucket = 1000 + idx * 300;
    if (bucket <= uiState.maxBudget && bucket >= uiState.minBudget) bar.classList.add("in-range");
    box.appendChild(bar);
  });
}

const budgetSlider = document.getElementById("budget-slider");
const maxBudgetInput = document.getElementById("max-budget");
const minBudgetInput = document.getElementById("min-budget");
const sliderValLabel = document.getElementById("slider-val-label");

function syncBudgetUI(val) {
  uiState.maxBudget = val;
  maxBudgetInput.value = val;
  budgetSlider.value = Math.min(5500, Math.max(1000, val));
  sliderValLabel.textContent = `${money(val)}/mo`;
  renderHistogram();
  updatePillLabels();
}
budgetSlider.addEventListener("input", () => syncBudgetUI(Number(budgetSlider.value)));
maxBudgetInput.addEventListener("input", () => syncBudgetUI(Number(maxBudgetInput.value) || 2400));
minBudgetInput.addEventListener("input", () => { uiState.minBudget = Number(minBudgetInput.value) || 0; renderHistogram(); });

document.querySelectorAll("#beds-seg .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#beds-seg .seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    uiState.minBedrooms = Number(btn.dataset.beds);
    updatePillLabels();
  });
});
document.getElementById("exact-beds").addEventListener("change", (e) => { uiState.exactBedrooms = e.target.checked; updatePillLabels(); });
document.querySelectorAll("#baths-seg .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#baths-seg .seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    uiState.minBathrooms = Number(btn.dataset.baths);
    updatePillLabels();
  });
});

function bindTile(id, key) {
  const tile = document.getElementById(id);
  tile.addEventListener("click", () => { uiState[key] = !uiState[key]; tile.classList.toggle("selected", uiState[key]); updatePillLabels(); });
}
bindTile("tile-sublease", "subleaseRequired");
bindTile("tile-pets", "petsRequired");
bindTile("tile-vehicle", "hasVehicle");
bindTile("tile-commute", "allowLongCommute");

document.querySelectorAll("#amenity-chips .chip-toggle").forEach((chip) => {
  chip.addEventListener("click", () => {
    const k = chip.dataset.amenity;
    if (uiState.selectedAmenities.has(k)) { uiState.selectedAmenities.delete(k); chip.classList.remove("selected"); }
    else { uiState.selectedAmenities.add(k); chip.classList.add("selected"); }
    applyLocalFiltersAndRender();
  });
});

const searchInput = document.getElementById("search-text");
const clearSearchBtn = document.getElementById("clear-search-btn");
searchInput.addEventListener("input", () => {
  uiState.searchText = searchInput.value.trim().toLowerCase();
  clearSearchBtn.classList.toggle("hidden", !uiState.searchText);
  applyLocalFiltersAndRender();
});
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = ""; uiState.searchText = ""; clearSearchBtn.classList.add("hidden"); applyLocalFiltersAndRender();
});
document.getElementById("sort-select").addEventListener("change", (e) => { uiState.sortBy = e.target.value; applyLocalFiltersAndRender(); });
document.getElementById("neighborhood-select").addEventListener("change", (e) => { uiState.neighborhood = e.target.value; applyLocalFiltersAndRender(); });

function updatePillLabels() {
  document.getElementById("label-dd-price").textContent = `≤ ${money(uiState.maxBudget)}`;
  const bedStr = uiState.minBedrooms === 0 ? "Any" : `${uiState.minBedrooms}${uiState.exactBedrooms ? "" : "+"} Bed`;
  const bathStr = uiState.minBathrooms === 0 ? "" : ` · ${uiState.minBathrooms}+ Ba`;
  document.getElementById("label-dd-beds").textContent = `${bedStr}${bathStr}`;
  const activeRules = [uiState.subleaseRequired, uiState.petsRequired, uiState.hasVehicle].filter(Boolean).length;
  document.getElementById("label-dd-rules").textContent = `(${activeRules} active)`;
}

// ==================== LEASE SPLIT CALCULATOR (Rolling Spring Numbers) ====================
let calcTermMonths = 9;
const leaseModal = document.getElementById("lease-modal");
const calcTotalInput = document.getElementById("calc-total-rent");
const calcRoommatesRange = document.getElementById("calc-roommates-range");

const perStudentSpring = new Spring(1200, CFG.roll, (x) => {
  document.getElementById("calc-per-student").textContent = money(x);
});
const termTotalSpring = new Spring(10800, CFG.roll, (x) => {
  document.getElementById("calc-term-total").textContent = money(x);
});
perStudentSpring.eps = termTotalSpring.eps = 0.5;

function updateLeaseCalc() {
  const total = Number(calcTotalInput.value) || 3600;
  const ppl = Number(calcRoommatesRange.value) || 3;
  const perMonth = Math.round(total / ppl);
  document.getElementById("calc-roommates-label").textContent = `${ppl} Student${ppl === 1 ? "" : "s"}`;
  perStudentSpring.to(perMonth);
  termTotalSpring.to(perMonth * calcTermMonths);
}

function openLeaseCalc() { updateLeaseCalc(); leaseModal.classList.remove("hidden"); }
document.getElementById("open-calculator-btn").addEventListener("click", openLeaseCalc);
document.getElementById("open-calc-hero").addEventListener("click", openLeaseCalc);
document.getElementById("close-lease-modal").addEventListener("click", () => leaseModal.classList.add("hidden"));
calcTotalInput.addEventListener("input", updateLeaseCalc);
calcRoommatesRange.addEventListener("input", updateLeaseCalc);

document.getElementById("term-9-btn").addEventListener("click", (e) => {
  calcTermMonths = 9; e.currentTarget.classList.add("active"); document.getElementById("term-12-btn").classList.remove("active"); updateLeaseCalc();
});
document.getElementById("term-12-btn").addEventListener("click", (e) => {
  calcTermMonths = 12; e.currentTarget.classList.add("active"); document.getElementById("term-9-btn").classList.remove("active"); updateLeaseCalc();
});
document.getElementById("apply-calc-budget").addEventListener("click", () => {
  const perMonth = Math.round((Number(calcTotalInput.value) || 3600) / (Number(calcRoommatesRange.value) || 3));
  syncBudgetUI(perMonth);
  leaseModal.classList.add("hidden");
  showBanner(`Updated Max Effective Budget filter to ${money(perMonth)}/mo per student.`, "info");
});

// ==================== VIEW SWITCHING (Student <-> Reviewer) ====================
const studentExp = document.getElementById("student-experience");
const viewAdmin = document.getElementById("view-admin");

function showStudentView() {
  studentExp.classList.remove("hidden");
  viewAdmin.classList.add("hidden");
  if (sloMap) setTimeout(() => sloMap.invalidateSize(), 120);
}

document.getElementById("tab-admin").addEventListener("click", async () => {
  closeAllPopovers();
  studentExp.classList.add("hidden");
  viewAdmin.classList.remove("hidden");
  window.scrollTo(0, 0);
  await checkAdminSession();
});
document.getElementById("back-to-student-btn").addEventListener("click", showStudentView);

document.getElementById("load-saved-nav").addEventListener("click", async () => {
  showStudentView();
  document.getElementById("search").scrollIntoView({ behavior: "smooth" });
  await loadSavedQualifiedMatches();
});

// ==================== STUDENT EVALUATION FLOW ====================
function sliceCsv(csvText, limit) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return csvText;
  const header = lines[0];
  const dataLines = lines.slice(1);
  if (limit === 6) {
    const picked = dataLines.filter((line) => QUICK_DEMO_IDS.has(line.split(",")[0].trim()));
    if (picked.length > 0) return [header, ...picked].join("\n");
  }
  return [header, ...dataLines.slice(0, limit)].join("\n");
}

async function loadSavedQualifiedMatches() {
  const { data, error } = await sb
    .from("evaluated_listings")
    .select("*")
    .eq("status", "qualified")
    .order("rank_score", { ascending: false });

  if (error) { showBanner(`Could not load saved matches: ${error.message}`, "error"); return; }
  allLoadedMatches = data || [];
  uiState.isDryRunResults = false;
  document.getElementById("saved-count-pill").textContent = String(allLoadedMatches.length);
  applyLocalFiltersAndRender();
}

async function runEvaluation() {
  showStudentView();
  closeAllPopovers();
  const searchSec = document.getElementById("search");
  if (lenis) lenis.scrollTo(searchSec, { duration: 1.0, offset: -10 });
  else searchSec.scrollIntoView({ behavior: "smooth" });

  const runBtn = document.getElementById("run-search-btn");
  const navBtn = document.getElementById("nav-eval-btn");
  const runLabel = document.getElementById("run-btn-label");
  const statsInline = document.getElementById("run-stats");
  runBtn.disabled = navBtn.disabled = true;
  runLabel.textContent = "Evaluating SLO Units...";
  statsInline.classList.add("hidden");

  try {
    const criteria = {
      max_budget: uiState.maxBudget,
      min_bedrooms: uiState.minBedrooms,
      max_bedrooms: uiState.exactBedrooms && uiState.minBedrooms > 0 ? uiState.minBedrooms : undefined,
      sublease_required: uiState.subleaseRequired,
      pets_required: uiState.petsRequired,
      has_vehicle: uiState.hasVehicle,
      allow_long_commute: uiState.allowLongCommute,
    };
    const dryRun = false;
    const fileInput = document.getElementById("csv-file-input");

    let csvText = "";
    if (fileInput.files && fileInput.files.length > 0) csvText = await fileInput.files[0].text();
    else {
      const resp = await fetch("our_team_agent/data/listings.csv");
      if (!resp.ok) throw new Error("Could not load our_team_agent/data/listings.csv");
      csvText = await resp.text();
    }

    const fnResp = await fetch(`${SUPABASE_URL}/functions/v1/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ dry_run: dryRun, criteria, csv_text: csvText }),
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
    const safeFiltered = allResults.filter((r) =>
      ["discarded_budget", "discarded_dealbreaker", "discarded_raw"].includes(r.status),
    );
    const scamsBlocked = allResults.filter((r) => r.status === "discarded_scam").length;
    const heldCount = allResults.filter((r) => String(r.status).startsWith("held")).length;

    allLoadedMatches = qualified;
    allFilteredOut = safeFiltered;
    activeResultTab = "matched";
    uiState.isDryRunResults = dryRun;
    if (!dryRun) document.getElementById("saved-count-pill").textContent = String(qualified.length);

    // Update Matched vs. Didn't Match result switcher tabs
    const rtabs = document.getElementById("result-tabs");
    const rtabMatched = document.getElementById("rtab-matched");
    const rtabFiltered = document.getElementById("rtab-filtered");
    const rtabScams = document.getElementById("rtab-scams");
    rtabMatched.textContent = `✓ Matched (${qualified.length})`;
    rtabFiltered.textContent = `✕ Didn't Match (${safeFiltered.length})`;
    rtabMatched.classList.add("active");
    rtabFiltered.classList.remove("active");
    if (scamsBlocked > 0) {
      rtabScams.textContent = `🛡️ ${scamsBlocked} Scam${scamsBlocked === 1 ? "" : "s"} Blocked`;
      rtabScams.classList.remove("hidden");
    } else {
      rtabScams.classList.add("hidden");
    }
    rtabs.classList.remove("hidden");

    applyLocalFiltersAndRender();

    const sec = ((data.ms || 0) / 1000).toFixed(1);
    statsInline.textContent = `· ${allResults.length} checked in ${sec}s${heldCount ? ` (${heldCount} in review)` : ""}`;
    statsInline.classList.remove("hidden");

    showBanner(
      qualified.length > 0
        ? `Found ${qualified.length} verified safe match(es) within your ${money(uiState.maxBudget)} effective budget!`
        : "No listings qualified under your criteria. Try raising your budget or relaxing a filter.",
      qualified.length > 0 ? "ok" : "warn",
    );
  } catch (err) {
    showBanner(`Error running evaluation: ${err.message}`, "error");
  } finally {
    runBtn.disabled = navBtn.disabled = false;
    runLabel.textContent = "Evaluate SLO Listings";
  }
}

document.getElementById("run-search-btn").addEventListener("click", runEvaluation);
document.getElementById("nav-eval-btn").addEventListener("click", runEvaluation);
document.getElementById("mega-eval-btn").addEventListener("click", runEvaluation);

document.getElementById("rtab-matched").addEventListener("click", () => {
  activeResultTab = "matched";
  document.getElementById("rtab-matched").classList.add("active");
  document.getElementById("rtab-filtered").classList.remove("active");
  applyLocalFiltersAndRender();
});

document.getElementById("rtab-filtered").addEventListener("click", () => {
  activeResultTab = "filtered";
  document.getElementById("rtab-filtered").classList.add("active");
  document.getElementById("rtab-matched").classList.remove("active");
  applyLocalFiltersAndRender();
});

function applyLocalFiltersAndRender() {
  const sourceList = activeResultTab === "filtered" ? allFilteredOut : allLoadedMatches;
  let list = sourceList.filter((item) => {
    if (activeResultTab === "matched") {
      if (uiState.minBudget > 0 && Number(item.effective_monthly_cost) < uiState.minBudget) return false;
      if (uiState.minBathrooms > 0 && Number(item.bathrooms) < uiState.minBathrooms) return false;
    }
    if (uiState.neighborhood && item.neighborhood !== uiState.neighborhood) return false;
    if (uiState.searchText) {
      const hay = `${item.title} ${item.neighborhood} ${item.address}`.toLowerCase();
      if (!hay.includes(uiState.searchText)) return false;
    }
    if (activeResultTab === "matched" && uiState.selectedAmenities.size > 0) {
      const am = item.amenities || {};
      for (const reqKey of uiState.selectedAmenities) if (!am[reqKey]) return false;
    }
    return true;
  });

  list = [...list].sort((a, b) => {
    if (uiState.sortBy === "effective_asc") return Number(a.effective_monthly_cost) - Number(b.effective_monthly_cost);
    if (uiState.sortBy === "commute_asc") return Number(a.commute_minutes || 99) - Number(b.commute_minutes || 99);
    if (uiState.sortBy === "base_asc") return Number(a.base_rent) - Number(b.base_rent);
    return Number(b.rank_score ?? -1) - Number(a.rank_score ?? -1);
  });

  renderMatches(list);
  updateMapMarkers(list);
}

function renderMatches(listings) {
  const container = document.getElementById("matches-list");
  const isFilteredView = activeResultTab === "filtered";
  document.getElementById("match-count").textContent = isFilteredView
    ? `${listings.length} listing${listings.length === 1 ? "" : "s"} didn't match your criteria`
    : `${listings.length} verified active match${listings.length === 1 ? "" : "es"}`;
  clearEl(container);

  if (listings.length === 0) {
    container.appendChild(
      el(
        "div",
        "admin-card muted",
        isFilteredView
          ? "No filtered-out listings in this view."
          : "No verified safe matches yet. Click 'Evaluate SLO Listings' above to run your search!",
      ),
    );
    return;
  }

  listings.forEach((item, idx) => {
    const isFail = item.status !== "qualified";
    const card = el("article", isFail ? "rental-card is-filtered" : "rental-card");
    card.dataset.listingId = item.listing_id;

    const surf = el("div", "rental-surf");
    surf.appendChild(el("span", "card-spot"));

    card.addEventListener("mouseenter", () => highlightPin(item.listing_id, true));
    card.addEventListener("mouseleave", () => highlightPin(item.listing_id, false));

    const top = el("div", "card-top");
    const left = el("div", "");
    const matchRow = el("div", "match-row");
    if (isFail) {
      const failTag =
        item.status === "discarded_budget"
          ? "✕ OVER EFFECTIVE BUDGET"
          : item.status === "discarded_dealbreaker"
          ? "✕ LEASE DEALBREAKER"
          : "✕ OUTSIDE BASE CRITERIA";
      matchRow.appendChild(el("span", "crit-pill crit-fail", failTag));
    } else {
      matchRow.appendChild(
        el(
          "span",
          idx === 0 ? "match-badge top-match" : "match-badge",
          idx === 0 ? `★ ${Math.round(Number(item.rank_score || 0))} TOP MATCH` : `✓ ${Math.round(Number(item.rank_score || 0))} MATCH`,
        ),
      );
    }
    matchRow.appendChild(el("span", "dist-tag", `${item.commute_miles ?? "—"} mi · ${item.neighborhood}`));
    left.appendChild(matchRow);
    left.appendChild(el("h3", "card-title", item.title));
    left.appendChild(el("p", "card-address", item.address));

    const right = el("div", "price-block");
    right.appendChild(el("span", "price-big", money(item.effective_monthly_cost)));
    right.appendChild(el("span", "price-sub", isFail && item.status === "discarded_raw" ? "base / mo" : "effective / mo"));
    top.appendChild(left);
    top.appendChild(right);
    surf.appendChild(top);

    // Clear Visual Criteria Scorecard (Green ✓ vs Red ✕ vs Amber —)
    if (isFail) {
      surf.appendChild(el("div", "fail-banner", `✕ ${item.hold_reason || "Did not meet your selected criteria."}`));
    } else {
      const critStrip = el("div", "criteria-strip");
      const underBy = Math.round(uiState.maxBudget - Number(item.effective_monthly_cost || 0));
      critStrip.appendChild(
        el("span", "crit-pill crit-pass", underBy >= 0 ? `✓ ${money(underBy)} Under Budget` : "✓ Budget Verified"),
      );
      if (item.commute_minutes !== null && item.commute_minutes !== undefined) {
        critStrip.appendChild(
          el("span", "crit-pill crit-pass", `✓ ${item.commute_minutes} min Commute`),
        );
      }
      if (item.sublease_allowed === "yes") {
        critStrip.appendChild(el("span", "crit-pill crit-pass", "✓ Sublease Allowed"));
      } else if (item.sublease_allowed === "no") {
        critStrip.appendChild(el("span", "crit-pill crit-neutral", "— No Subleasing (not required)"));
      }
      if (item.pets_allowed === "yes") {
        critStrip.appendChild(el("span", "crit-pill crit-pass", "✓ Pets OK"));
      }
      surf.appendChild(critStrip);
    }

    const specs = el("div", "specs-grid");
    const s1 = el("div", ""); s1.appendChild(el("span", "spec-label", "LAYOUT")); s1.appendChild(document.createTextNode(`${item.bedrooms === 0 ? "Studio" : `${item.bedrooms} Bed`} · ${item.bathrooms} Ba`));
    const s2 = el("div", ""); s2.appendChild(el("span", "spec-label", "COMMUTE")); s2.appendChild(document.createTextNode(item.commute_minutes ? `~${item.commute_minutes} min` : "—"));
    const s3 = el("div", ""); s3.appendChild(el("span", "spec-label", "SUBLEASE")); s3.appendChild(document.createTextNode(item.sublease_allowed === "yes" ? "Allowed" : (item.sublease_allowed || "—")));
    specs.appendChild(s1); specs.appendChild(s2); specs.appendChild(s3);
    surf.appendChild(specs);

    if (item.status !== "discarded_raw") {
      surf.appendChild(el("div", "cost-line", `Base ${money(item.base_rent)} + Utils ${money(item.monthly_utilities)} + Parking ${money(item.parking_expense)} + Commute ${money(item.commute_expense)}`));
    }

    if (!isFail) {
      const chips = el("div", "chip-row");
      const am = item.amenities || {};
      if (am.in_unit_laundry) chips.appendChild(el("span", "card-chip", "In-Unit W/D"));
      if (am.off_street_parking) chips.appendChild(el("span", "card-chip", "Off-Street Parking"));
      if (am.ac) chips.appendChild(el("span", "card-chip", "A/C"));
      if (am.dishwasher) chips.appendChild(el("span", "card-chip", "Dishwasher"));
      if (am.patio) chips.appendChild(el("span", "card-chip", "Patio"));
      if (item.price_realism_label) chips.appendChild(el("span", "card-chip green", item.price_realism_label));
      surf.appendChild(chips);
    }

    const bottom = el("div", "card-bottom");
    bottom.appendChild(el("span", "mono-muted", `ID #${item.listing_id}`));

    const actions = el("div", "card-actions");
    const pinBtn = el("button", "btn btn-secondary btn-mono", "Pinpoint");
    pinBtn.type = "button";
    pinBtn.addEventListener("click", () => pinpointOnMap(item));
    actions.appendChild(pinBtn);

    if (!isFail) {
      const link = el("a", "btn btn-secondary btn-mono", "Listing ↗");
      link.href = item.listing_url || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      actions.appendChild(link);

      const draftBtn = el("button", "btn btn-primary", "Draft Inquiry");
      draftBtn.type = "button";
      draftBtn.addEventListener("click", () => handleDraftInquiry(item, uiState.isDryRunResults, draftBtn));
      actions.appendChild(draftBtn);

      const reportBtn = el("button", "btn btn-secondary", "🚩");
      reportBtn.type = "button";
      reportBtn.title = "Report inaccurate cost or suspected scam";
      reportBtn.addEventListener("click", () => handleReportListing(item));
      actions.appendChild(reportBtn);
    }

    bottom.appendChild(actions);
    surf.appendChild(bottom);
    card.appendChild(surf);
    attachCardTilt(card);
    container.appendChild(card);
  });
}

// ==================== DRAFT INQUIRY MODAL ====================
async function handleDraftInquiry(listing, isDryRun, btn) {
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Drafting...";
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/draft-inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({
        dry_run: isDryRun,
        listing_id: listing.listing_id,
        listing: isDryRun ? listing : undefined,
        student_name: "Cal Poly Student",
        move_in_date: "September 1, 2026",
      }),
    });
    const data = await resp.json();
    if (data.status === "paused") { showBanner("Agent is paused — cannot draft inquiries right now.", "warn"); return; }
    if (!data.ok && data.status !== "duplicate") { showBanner(`Could not draft inquiry: ${(data.reasons || []).join(" ")}`, "error"); return; }
    activeDraft = data.draft;
    document.getElementById("inquiry-meta").textContent =
      `To: ${activeDraft.landlord_contact} · Listing: ${activeDraft.listing_id} · Status: ${activeDraft.status}` +
      (data.status === "duplicate" ? " (Existing draft loaded)" : "");
    document.getElementById("draft-subject").value = activeDraft.subject || "";
    document.getElementById("draft-body").value = activeDraft.body || "";
    document.getElementById("inquiry-modal").classList.remove("hidden");
  } catch (err) {
    showBanner(`Error drafting inquiry: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

function closeInquiryModal() { document.getElementById("inquiry-modal").classList.add("hidden"); }
document.getElementById("close-inquiry-btn").addEventListener("click", closeInquiryModal);
document.getElementById("cancel-inquiry-btn").addEventListener("click", closeInquiryModal);

document.getElementById("approve-copy-btn").addEventListener("click", async () => {
  if (!activeDraft) return;
  const subject = document.getElementById("draft-subject").value;
  const body = document.getElementById("draft-body").value;
  if (activeDraft.id) {
    await sb.from("inquiry_drafts").update({ subject, body, status: "approved_by_student", approved_at: new Date().toISOString() }).eq("id", activeDraft.id);
  }
  try {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    showBanner("Draft approved and copied to your clipboard!", "ok");
  } catch {
    showBanner("Draft approved! Copy the text above into your email app.", "ok");
  }
  closeInquiryModal();
});

async function handleReportListing(listing) {
  const note = window.prompt(`Report a problem with "${listing.title}" (${listing.listing_id}):`);
  if (!note || !note.trim()) return;
  const { error } = await sb.from("listing_reports").insert({ listing_id: listing.listing_id, reporter_note: note.trim(), reported_by: "student" });
  if (error) showBanner(`Could not submit report: ${error.message}`, "error");
  else showBanner("Thank you — your report was sent to Nicolas Gonzalez's review queue.", "ok");
}

// ==================== REVIEWER / ADMIN CONTROL CENTER ====================
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
  const { error } = await sb.auth.signInWithPassword({
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value,
  });
  if (error) { showBanner(`Sign-in failed: ${error.message}`, "error"); return; }
  showBanner("Signed in as reviewer.", "ok");
  await checkAdminSession();
});
document.getElementById("logout-btn").addEventListener("click", async () => { await sb.auth.signOut(); showBanner("Signed out.", "info"); await checkAdminSession(); });
document.getElementById("refresh-admin-btn").addEventListener("click", loadAdminData);

async function loadAdminData() { await Promise.all([loadSettings(), loadHeldListings(), loadLessons(), loadReports()]); }

async function loadSettings() {
  const container = document.getElementById("settings-list");
  clearEl(container);
  const { data, error } = await sb.from("agent_settings").select("*").order("key");
  if (error) { container.appendChild(el("p", "muted", error.message)); return; }

  const chip = document.getElementById("nav-status-chip");
  const pausedRow = (data || []).find((r) => r.key === "paused");
  if (pausedRow && pausedRow.value === "true") { chip.textContent = "PAUSED"; chip.classList.remove("hidden"); }
  else chip.classList.add("hidden");

  (data || []).forEach((s) => {
    const row = el("div", "admin-item");
    const top = el("div", "admin-row");
    top.appendChild(el("strong", "", `${s.label} (${s.key})`));
    top.appendChild(el("span", s.key === "paused" && s.value === "true" ? "pill pill-danger" : "pill", `Current: ${s.value}`));
    row.appendChild(top);
    row.appendChild(el("div", "meta-line", `Last changed by ${s.updated_by}: "${s.reason}"`));

    const controls = el("div", "admin-row");
    let valInput;
    if (s.kind === "switch") {
      valInput = document.createElement("select");
      valInput.className = "inline-input";
      const o1 = el("option", "", "false"); o1.value = "false";
      const o2 = el("option", "", "true"); o2.value = "true";
      valInput.appendChild(o1); valInput.appendChild(o2);
      valInput.value = s.value;
    } else {
      valInput = document.createElement("input");
      valInput.type = "number"; valInput.className = "inline-input"; valInput.value = s.value;
    }
    const reasonInput = document.createElement("input");
    reasonInput.type = "text"; reasonInput.className = "inline-input"; reasonInput.placeholder = "Required reason for change...";
    const saveBtn = el("button", "btn btn-primary", "Save");
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async () => {
      const reason = reasonInput.value.trim();
      if (!reason) { showBanner("A reason is required before changing any setting.", "warn"); return; }
      const { error: upErr } = await sb.from("agent_settings").update({
        value: String(valInput.value), reason, updated_by: currentSession?.user?.email || "Nicolas Gonzalez", updated_at: new Date().toISOString(),
      }).eq("key", s.key);
      if (upErr) showBanner(`Update failed: ${upErr.message}`, "error");
      else { showBanner(`Updated ${s.key} to "${valInput.value}".`, "ok"); await loadSettings(); }
    });
    controls.appendChild(valInput); controls.appendChild(reasonInput); controls.appendChild(saveBtn);
    row.appendChild(controls);
    container.appendChild(row);
  });
}

async function loadHeldListings() {
  const container = document.getElementById("held-list");
  clearEl(container);
  const { data, error } = await sb.from("evaluated_listings").select("*").in("status", ["held_fraud", "held_policy"]).order("updated_at", { ascending: false });
  if (error) { container.appendChild(el("p", "muted", error.message)); return; }
  if (!data || data.length === 0) { container.appendChild(el("p", "muted", "No held listings waiting for review right now.")); return; }

  data.forEach((item) => {
    const box = el("div", "admin-item");
    const top = el("div", "admin-row");
    top.appendChild(el("strong", "", `${item.listing_id} — ${item.title} (${item.neighborhood})`));
    top.appendChild(el("span", "pill pill-warn", `${item.status} · Fraud: ${item.fraud_risk_score}`));
    box.appendChild(top);
    box.appendChild(el("div", "meta-line", `Base: ${money(item.base_rent)} | Effective: ${money(item.effective_monthly_cost)} | Market Delta: ${item.market_delta_pct}%`));
    box.appendChild(el("div", "", `Hold reason: ${item.hold_reason || "Flagged for manual review"}`));
    box.appendChild(el("div", "meta-line", `Agent checked: ${(item.sources_checked || []).join(" · ")}`));

    const controls = el("div", "admin-row");
    const reasonInput = document.createElement("input");
    reasonInput.type = "text"; reasonInput.className = "inline-input"; reasonInput.placeholder = "Decision reason (recorded as a Lesson Learned)...";
    const resumeBtn = el("button", "btn btn-primary", "Resume (Mark Safe)"); resumeBtn.type = "button";
    resumeBtn.addEventListener("click", () => submitReviewDecision(item.listing_id, "resume", reasonInput.value));
    const endBtn = el("button", "btn btn-danger", "End (Confirm Scam)"); endBtn.type = "button";
    endBtn.addEventListener("click", () => submitReviewDecision(item.listing_id, "end", reasonInput.value));
    controls.appendChild(reasonInput); controls.appendChild(resumeBtn); controls.appendChild(endBtn);
    box.appendChild(controls);
    container.appendChild(box);
  });
}

async function submitReviewDecision(listingId, decision, reason) {
  if (!reason.trim()) { showBanner("Please enter a reason before recording your sign-off decision.", "warn"); return; }
  const token = currentSession?.access_token;
  if (!token) { showBanner("Please sign in again.", "error"); return; }
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/review-decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ listing_id: listingId, decision, reason: reason.trim() }),
  });
  const data = await resp.json();
  if (!data.ok) { showBanner(`Decision failed: ${(data.reasons || []).join(" ")}`, "error"); return; }
  showBanner((data.reasons || ["Decision recorded."]).join(" "), "ok");
  await loadAdminData();
}

async function loadLessons() {
  const container = document.getElementById("lessons-list");
  clearEl(container);
  const { data, error } = await sb.from("lessons").select("*").order("created_at", { ascending: false });
  if (error) { container.appendChild(el("p", "muted", error.message)); return; }
  if (!data || data.length === 0) { container.appendChild(el("p", "muted", "No lessons learned yet.")); return; }
  data.forEach((lesson) => {
    const box = el("div", "admin-item");
    const row = el("div", "admin-row");
    row.appendChild(el("strong", "", `[${lesson.topic}] ${lesson.lesson}`));
    const toggleBtn = el("button", lesson.active ? "btn btn-secondary" : "btn btn-primary", lesson.active ? "Active (Switch Off)" : "Off (Switch On)");
    toggleBtn.type = "button";
    toggleBtn.addEventListener("click", async () => {
      const { error: uErr } = await sb.from("lessons").update({ active: !lesson.active }).eq("id", lesson.id);
      if (uErr) showBanner(uErr.message, "error"); else await loadLessons();
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
  const { data, error } = await sb.from("listing_reports").select("*").order("created_at", { ascending: false });
  if (error) { container.appendChild(el("p", "muted", error.message)); return; }
  if (!data || data.length === 0) { container.appendChild(el("p", "muted", "No student reports submitted yet.")); return; }
  data.forEach((rep) => {
    const box = el("div", "admin-item");
    const row = el("div", "admin-row");
    row.appendChild(el("strong", "", `Listing ${rep.listing_id}: "${rep.reporter_note}"`));
    if (rep.resolved) row.appendChild(el("span", "pill", "Resolved"));
    else {
      const btn = el("button", "btn btn-primary", "Mark Resolved"); btn.type = "button";
      btn.addEventListener("click", async () => {
        await sb.from("listing_reports").update({ resolved: true, resolved_by: currentSession?.user?.email || "Nicolas Gonzalez", resolved_at: new Date().toISOString() }).eq("id", rep.id);
        await loadReports();
      });
      row.appendChild(btn);
    }
    box.appendChild(row);
    container.appendChild(box);
  });
}

// ==================== BOOT ====================
initMap();
renderHistogram();
updatePillLabels();
loadSavedQualifiedMatches();
document.fonts.ready.then(() => {
  fitHeroAndFooterMarks();
  placeRuleThumb(activeRuleTab, true);
});
window.addEventListener("resize", () => {
  fitHeroAndFooterMarks();
  placeRuleThumb(activeRuleTab, true);
}, { passive: true });
