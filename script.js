/* =========================================================
   MENTAL RYTHM — script.js
   Vanilla JS only. Talks to an existing FastAPI backend.
   ========================================================= */

const API_URL = "https://mental-rythm.onrender.com/predict";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* =========================================================
   1. STARFIELD BACKGROUND
   ========================================================= */
function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width, height, stars, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function buildStars() {
    const count = Math.min(260, Math.floor((width * height) / 6500));
    stars = new Array(count).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.3 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.25,
      twinkleSpeed: Math.random() * 0.6 + 0.2,
      driftX: (Math.random() - 0.5) * 0.012,
      driftY: (Math.random() - 0.5) * 0.008 + 0.006,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(235, 238, 255, ${s.baseAlpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let t = 0;
  function tick() {
    t += 0.016;
    ctx.clearRect(0, 0, width, height);
    stars.forEach((s) => {
      s.x += s.driftX;
      s.y += s.driftY;
      if (s.x < -5) s.x = width + 5;
      if (s.x > width + 5) s.x = -5;
      if (s.y > height + 5) {
        s.y = -5;
        s.x = Math.random() * width;
      }
      const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.phase);
      const alpha = s.baseAlpha * (0.55 + 0.45 * twinkle);
      ctx.beginPath();
      ctx.fillStyle = `rgba(235, 238, 255, ${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();

  if (prefersReducedMotion) {
    drawStatic();
  } else {
    requestAnimationFrame(tick);
  }
}

/* =========================================================
   2. NEURAL ORB VISUAL
   ========================================================= */
function initNeuralOrb() {
  const canvas = document.getElementById("neuralOrb");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const size = 420;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = size / 2;
  const cy = size / 2;
  const orbitR = size * 0.32;

  const nodeCount = 9;
  const nodes = new Array(nodeCount).fill(0).map((_, i) => ({
    angle: (Math.PI * 2 * i) / nodeCount,
    speed: 0.09 + (i % 3) * 0.02,
    radius: orbitR * (0.7 + Math.random() * 0.3),
    size: Math.random() * 1.6 + 1.6,
    wobble: Math.random() * Math.PI * 2,
  }));

  function drawFrame(t) {
    ctx.clearRect(0, 0, size, size);

    // central glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbitR * 1.15);
    glow.addColorStop(0, "rgba(139, 123, 245, 0.35)");
    glow.addColorStop(0.5, "rgba(79, 216, 224, 0.10)");
    glow.addColorStop(1, "rgba(79, 216, 224, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // central point
    const pulse = 1 + 0.06 * Math.sin(t * 0.9);
    const coreR = 7 * pulse;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
    core.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    core.addColorStop(0.4, "rgba(180, 170, 250, 0.55)");
    core.addColorStop(1, "rgba(180, 170, 250, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
    ctx.fill();

    // compute node positions
    const positions = nodes.map((n) => {
      const angle = n.angle + t * n.speed;
      const wob = Math.sin(t * 0.5 + n.wobble) * 6;
      const r = n.radius + wob;
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r * 0.82,
        size: n.size,
      };
    });

    // connecting lines (nearby nodes + to center occasionally)
    ctx.lineWidth = 0.6;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.28;
          ctx.strokeStyle = `rgba(139, 160, 245, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(positions[i].x, positions[i].y);
          ctx.lineTo(positions[j].x, positions[j].y);
          ctx.stroke();
        }
      }
      const dxc = positions[i].x - cx;
      const dyc = positions[i].y - cy;
      const distC = Math.sqrt(dxc * dxc + dyc * dyc);
      ctx.strokeStyle = `rgba(79, 216, 224, ${0.14})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(positions[i].x, positions[i].y);
      ctx.stroke();
      void distC;
    }

    // nodes
    positions.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = "rgba(220, 225, 255, 0.85)";
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (prefersReducedMotion) {
    drawFrame(0);
    return;
  }

  let start = null;
  function loop(ts) {
    if (!start) start = ts;
    const t = (ts - start) / 1000;
    drawFrame(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* =========================================================
   3. SCROLL REVEAL
   ========================================================= */
function initRevealObserver() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

/* =========================================================
   4. FORM: field config, data collection, validation
   ========================================================= */
const NUMERIC_FIELDS = {
  age: { min: 10, max: 100 },
  avg_daily_usage_hours: { min: 0, max: 24 },
  daily_unlocks: { min: 0, max: 1000 },
  study_hours: { min: 0, max: 24 },
  physical_activity_hours: { min: 0, max: 24 },
  sleep_hours_per_night: { min: 0, max: 24 },
};

const SELECT_FIELDS = [
  "gender",
  "academic_level",
  "most_used_platform",
  "purpose_of_use",
  "stress_level",
];

const ERROR_ID = {
  age: "age-error",
  gender: "gender-error",
  country: "country-error",
  academic_level: "academic-error",
  most_used_platform: "platform-error",
  purpose_of_use: "purpose-error",
  avg_daily_usage_hours: "usage-error",
  daily_unlocks: "unlocks-error",
  study_hours: "study-error",
  physical_activity_hours: "activity-error",
  sleep_hours_per_night: "sleep-error",
  stress_level: "stress-error",
};

function getFormData(form) {
  const data = {};
  const fields = [
    "age",
    "gender",
    "country",
    "academic_level",
    "most_used_platform",
    "purpose_of_use",
    "avg_daily_usage_hours",
    "daily_unlocks",
    "study_hours",
    "physical_activity_hours",
    "sleep_hours_per_night",
    "stress_level",
  ];
  fields.forEach((name) => {
    const el = form.elements[name];
    data[name] = el ? el.value.trim() : "";
  });
  return data;
}

function setFieldError(name, message) {
  const errorEl = document.getElementById(ERROR_ID[name]);
  const fieldEl = errorEl ? errorEl.closest(".field") : null;
  if (!errorEl || !fieldEl) return;
  errorEl.textContent = message;
  fieldEl.classList.add("has-error");
}

function clearFieldError(name) {
  const errorEl = document.getElementById(ERROR_ID[name]);
  const fieldEl = errorEl ? errorEl.closest(".field") : null;
  if (!errorEl || !fieldEl) return;
  errorEl.textContent = "";
  fieldEl.classList.remove("has-error");
}

function clearAllErrors() {
  Object.keys(ERROR_ID).forEach(clearFieldError);
}

function validateForm(raw) {
  clearAllErrors();
  let isValid = true;
  const errors = {};

  if (!raw.country) {
    errors.country = "Please enter your country.";
  }

  SELECT_FIELDS.forEach((name) => {
    if (!raw[name]) {
      errors[name] = "Please make a selection.";
    }
  });

  Object.entries(NUMERIC_FIELDS).forEach(([name, range]) => {
    const value = raw[name];
    if (value === "" || value === null || value === undefined) {
      errors[name] = "This field is required.";
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      errors[name] = "Please enter a valid number.";
    } else if (num < range.min || num > range.max) {
      errors[name] = `Must be between ${range.min} and ${range.max}.`;
    }
  });

  Object.entries(errors).forEach(([name, message]) => {
    setFieldError(name, message);
    isValid = false;
  });

  return isValid;
}

function buildPayload(raw) {
  return {
    age: Number(raw.age),
    gender: raw.gender,
    country: raw.country,
    academic_level: raw.academic_level,
    most_used_platform: raw.most_used_platform,
    purpose_of_use: raw.purpose_of_use,
    avg_daily_usage_hours: Number(raw.avg_daily_usage_hours),
    daily_unlocks: Number(raw.daily_unlocks),
    study_hours: Number(raw.study_hours),
    physical_activity_hours: Number(raw.physical_activity_hours),
    sleep_hours_per_night: Number(raw.sleep_hours_per_night),
    stress_level: raw.stress_level,
  };
}

/* =========================================================
   5. LOADING / RESULT / ERROR UI
   ========================================================= */
const submitBtn = () => document.getElementById("submit-btn");
const syncStatus = () => document.getElementById("sync-status");
const errorBanner = () => document.getElementById("error-banner");
const resultCard = () => document.getElementById("result-card");
const predictForm = () => document.getElementById("predict-form");

const SYNC_MESSAGES = [
  "Synchronizing patterns...",
  "Reading your digital rhythm...",
  "Weighing lifestyle signals...",
];

let syncInterval = null;

function showLoading() {
  const btn = submitBtn();
  btn.classList.add("is-loading");
  btn.disabled = true;

  let i = 0;
  const statusEl = syncStatus();
  statusEl.textContent = SYNC_MESSAGES[0];
  syncInterval = setInterval(() => {
    i = (i + 1) % SYNC_MESSAGES.length;
    statusEl.textContent = SYNC_MESSAGES[i];
  }, 1400);

  hideError();
  hideResult();
}

function hideLoading() {
  const btn = submitBtn();
  btn.classList.remove("is-loading");
  btn.disabled = false;
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  syncStatus().textContent = "";
}

function showError(message) {
  const banner = errorBanner();
  banner.textContent = message;
  banner.hidden = false;
}

function hideError() {
  const banner = errorBanner();
  banner.hidden = true;
  banner.textContent = "";
}

function animateScore(target) {
  const el = document.getElementById("score-value");
  const duration = prefersReducedMotion ? 1 : 1100;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    el.textContent = current.toFixed(2);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = target.toFixed(2);
    }
  }
  requestAnimationFrame(frame);
}

function showResult(score) {
  const card = resultCard();
  card.hidden = false;
  animateScore(score);
  card.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "center",
  });
}

function hideResult() {
  resultCard().hidden = true;
}

function resetForm() {
  const form = predictForm();
  form.reset();
  clearAllErrors();
  hideError();
  hideResult();
  form.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

/* =========================================================
   6. API CALL
   ========================================================= */
async function predictMentalHealth(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error(
        "We couldn't process those inputs. Please check the highlighted fields."
      );
    }
    if (response.status >= 500) {
      throw new Error(
        "The prediction service is currently unavailable. Please make sure the FastAPI server is running."
      );
    }
    throw new Error(
      "Something went wrong while analyzing your rhythm. Please try again."
    );
  }

  const data = await response.json();
  if (
    !data ||
    typeof data.predicted_mental_health_score !== "number"
  ) {
    throw new Error(
      "The prediction service returned an unexpected response."
    );
  }
  return data.predicted_mental_health_score;
}

/* =========================================================
   7. WIRING
   ========================================================= */
function initForm() {
  const form = predictForm();
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const raw = getFormData(form);

    if (!validateForm(raw)) {
      const firstError = form.querySelector(".field.has-error input, .field.has-error select");
      if (firstError) firstError.focus();
      return;
    }

    const payload = buildPayload(raw);
    showLoading();

    try {
      const score = await predictMentalHealth(payload);
      hideLoading();
      showResult(score);
    } catch (err) {
      hideLoading();
      showError(
        err instanceof Error
          ? err.message
          : "The prediction service is currently unavailable. Please make sure the FastAPI server is running."
      );
    }
  });

  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetForm);
  }

  // Clear a field's error as soon as the user edits it
  Object.keys(ERROR_ID).forEach((name) => {
    const el = form.elements[name];
    if (!el) return;
    el.addEventListener("input", () => clearFieldError(name));
    el.addEventListener("change", () => clearFieldError(name));
  });
}

/* =========================================================
   8. INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initStarfield();
  initNeuralOrb();
  initRevealObserver();
  initForm();
});
