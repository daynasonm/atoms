const scene = document.getElementById("scene");
const dateText = document.getElementById("dateText");
const timeText = document.getElementById("timeText");
const dayBtn = document.getElementById("dayBtn");
const nightBtn = document.getElementById("nightBtn");

const TZ = "America/New_York";

const atomDefs = [
  { id: "red",       src: "assets/red.png",       href: "https://example.com/red",       size: 55  },
  { id: "heytea",    src: "assets/heytea.png",    href: "https://www.instagram.com/p/DNwqxGV5ML4/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==",    size: 95  },
  { id: "fivestars", src: "assets/fivestars.png", href: "https://example.com/fivestars", size: 120 },
  { id: "green",     src: "assets/green.png",     href: "https://example.com/green",     size: 130 },
  { id: "purple",    src: "assets/purple.png",    href: "https://example.com/purple",    size: 100 },
  { id: "blue",      src: "assets/blue.png",      href: "https://example.com/blue",      size: 90  },
  { id: "pink",      src: "assets/pink.png",      href: "https://example.com/pink",      size: 150 },
];

// --- helpers ---
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function getPads() {
  const cs = getComputedStyle(document.documentElement);
  return {
    top: parseFloat(cs.getPropertyValue("--padTop")) || 90,
    bottom: parseFloat(cs.getPropertyValue("--padBottom")) || 90,
    left: parseFloat(cs.getPropertyValue("--padLeft")) || 150,
    right: parseFloat(cs.getPropertyValue("--padRight")) || 150,
  };
}

let bounds = null;
function computeBounds() {
  const p = getPads();
  bounds = {
    minX: p.left,
    maxX: window.innerWidth - p.right,
    minY: p.top,
    maxY: window.innerHeight - p.bottom,
  };
}

function formatDate(d) {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  }).formatToParts(d);

  const w = parts.find(p => p.type === "weekday")?.value ?? "";
  const m = parts.find(p => p.type === "month")?.value ?? "";
  const day = parts.find(p => p.type === "day")?.value ?? "";
  const y = parts.find(p => p.type === "year")?.value ?? "";
  return `${w} ${m} ${day} ${y}`.trim();
}

function formatTime(d) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: TZ,
    timeZoneName: "short",
  }).formatToParts(d);

  const h = parts.find(p => p.type === "hour")?.value ?? "";
  const min = parts.find(p => p.type === "minute")?.value ?? "";
  const sec = parts.find(p => p.type === "second")?.value ?? "";
  const dp = parts.find(p => p.type === "dayPeriod")?.value ?? "";
  let tz = parts.find(p => p.type === "timeZoneName")?.value ?? "ET";

  // Some browsers might return GMT-5; keep ET if not EST/EDT
  if (!/E[DS]T/.test(tz)) tz = "ET";

  return `${h}:${min}:${sec} ${dp} ${tz}`.trim();
}

// --- UI updates ---
function updateClock() {
  const now = new Date();
  dateText.textContent = formatDate(now);
  timeText.textContent = formatTime(now);
}
updateClock();
setInterval(updateClock, 1000);

// --- mode switching ---
function setMode(mode) {
  document.body.classList.toggle("dark", mode === "dark");
  document.body.classList.toggle("light", mode !== "dark");
  dayBtn.classList.toggle("active", mode !== "dark");
  nightBtn.classList.toggle("active", mode === "dark");
}
dayBtn.addEventListener("click", () => setMode("light"));
nightBtn.addEventListener("click", () => setMode("dark"));

// --- atoms creation + animation ---
computeBounds();

const atoms = atomDefs.map(def => {
  const a = document.createElement("a");
  a.className = "atom";
  a.id = `atom-${def.id}`;
  a.href = def.href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.setProperty("--size", `${def.size}px`);

  const img = document.createElement("img");
  img.src = def.src;
  img.alt = def.id;
  a.appendChild(img);

  scene.appendChild(a);

  // initial positions inside safe bounds
  const x = rand(bounds.minX, bounds.maxX - def.size);
  const y = rand(bounds.minY, bounds.maxY - def.size);

  // gentle velocities (px/sec)
  const vx = rand(-18, 18);
  const vy = rand(-18, 18);

  // slight organic drift
  return { el: a, size: def.size, x, y, vx, vy };
});

function keepInBounds(atom) {
  const maxX = bounds.maxX - atom.size;
  const maxY = bounds.maxY - atom.size;

  if (atom.x <= bounds.minX) { atom.x = bounds.minX; atom.vx *= -1; }
  if (atom.x >= maxX)        { atom.x = maxX;        atom.vx *= -1; }
  if (atom.y <= bounds.minY) { atom.y = bounds.minY; atom.vy *= -1; }
  if (atom.y >= maxY)        { atom.y = maxY;        atom.vy *= -1; }
}

let last = performance.now();
function tick(t) {
  const dt = Math.min(0.033, (t - last) / 1000); // cap dt for stability
  last = t;

  for (const a of atoms) {
    // tiny random drift to feel "alive"
    a.vx += (Math.random() - 0.5) * 6 * dt;
    a.vy += (Math.random() - 0.5) * 6 * dt;

    // clamp speed (gentle)
    a.vx = clamp(a.vx, -22, 22);
    a.vy = clamp(a.vy, -22, 22);

    a.x += a.vx * dt;
    a.y += a.vy * dt;

    keepInBounds(a);
    a.el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

window.addEventListener("resize", () => {
  computeBounds();
  for (const a of atoms) keepInBounds(a);
});
