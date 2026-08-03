/* ═══════════════════════════════════════════════════════════
   Starlet Creative Solutions — cosmos engine
   One continuous starfield. You are the one travelling.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var shotMode = /[?&]shot/.test(location.search);   // static capture mode for QA screenshots
  if (shotMode) { reduceMotion = true; document.documentElement.classList.add("shot-mode"); }

  /* Marquees loop by scrolling to -50%, so each track needs its content twice. */
  document.querySelectorAll(".marquee-track, .ribbon-track").forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ─────────────────────────────────────────────
     0 · Client bubbles — one shared offset drives
     auto-drift AND drag, so touching them never
     interrupts the motion; it just steers it.
     ───────────────────────────────────────────── */
  function setupBubbleRow(row, dir) {
    var track = row.querySelector(".marquee-track");
    if (!track) return null;
    var offset = 0, half = 1;
    var auto = 1, autoTarget = 1;          // how much auto-drift is blended in
    var speed = 0.5 * dir;                 // px per 60fps frame
    var dragging = false, lastX = 0, vel = 0;

    function measure() { half = track.scrollWidth / 2 || 1; }
    measure();
    window.addEventListener("load", measure);
    window.addEventListener("resize", function () { setTimeout(measure, 250); });

    row.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX; vel = 0; autoTarget = 0;
      row.classList.add("dragging");
      try { row.setPointerCapture(e.pointerId); } catch (err) {}
    });
    row.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      offset -= dx; vel = -dx;             // fling momentum carries after release
    });
    function release() {
      if (!dragging) return;
      dragging = false; autoTarget = 1;
      row.classList.remove("dragging");
    }
    row.addEventListener("pointerup", release);
    row.addEventListener("pointercancel", release);
    row.addEventListener("mouseenter", function () { if (!dragging) autoTarget = 0.22; });
    row.addEventListener("mouseleave", function () { if (!dragging) autoTarget = 1; });

    return function (mult) {
      auto += (autoTarget - auto) * 0.05;  // drift eases back in, never snaps
      if (!dragging) {
        offset += speed * auto * mult + vel;
        vel *= 0.93;
        if (Math.abs(vel) < 0.01) vel = 0;
      }
      offset = ((offset % half) + half) % half;
      track.style.transform = "translateX(" + (-offset) + "px)";
    };
  }

  var bubbleRows = [];
  document.querySelectorAll(".marquee-row").forEach(function (row) {
    var f = setupBubbleRow(row, row.classList.contains("reverse") ? -1 : 1);
    if (f) bubbleRows.push(f);
  });
  if (!shotMode && bubbleRows.length) {
    var lastBT = 0;
    (function bubbleLoop(t) {
      var mult = lastBT ? Math.min((t - lastBT) / 16.7, 3) : 1;
      lastBT = t;
      var m = reduceMotion ? 0 : mult;     // reduced motion: still draggable, no drift
      bubbleRows.forEach(function (f) { f(m); });
      requestAnimationFrame(bubbleLoop);
    })(0);
  }

  /* ─────────────────────────────────────────────
     1 · THE COSMOS — one fixed canvas, whole site
     ───────────────────────────────────────────── */
  var canvas = document.getElementById("cosmos");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  var pointer = { x: 0, y: 0 };
  var pointerTarget = { x: 0, y: 0 };
  window.addEventListener("mousemove", function (e) {
    pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  var stars = [], sparks = [];
  var warp = 0, warpTarget = 0;          // 0 = drifting · 1 = full warp
  var lastScrollY = window.scrollY;
  var docAnchors = { moonY: 170, planetY: 3000 };

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildMoon();
    seed();
    var reach = document.getElementById("reach");
    if (reach) docAnchors.planetY = reach.offsetTop - 220;
  }

  function seed() {
    var area = (W * H) / (1440 * 900);
    var farN = Math.round(62 * area);
    var nearN = Math.round(26 * area);
    stars = [];
    var i;
    for (i = 0; i < farN; i++) stars.push(makeStar(0));
    for (i = 0; i < nearN; i++) stars.push(makeStar(1));
    sparks = [];
    for (i = 0; i < Math.round(7 * area); i++) {
      sparks.push({
        x: Math.random() * W, y: Math.random() * H,
        s: 5 + Math.random() * 8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.14 + Math.random() * 0.2,
        depth: Math.random() < 0.5 ? 0 : 1
      });
    }
  }

  function makeStar(depth) {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: depth ? (0.9 + Math.random() * 1.3) : (0.4 + Math.random() * 0.8),
      depth: depth,
      vx: (Math.random() - 0.5) * (depth ? 0.05 : 0.022),
      vy: -(0.008 + Math.random() * (depth ? 0.03 : 0.014)),
      phase: Math.random() * Math.PI * 2,
      tw: 0.3 + Math.random() * 0.8,
      warm: Math.random() < (depth ? 0.7 : 0.42),
      flare: null                               // occasional bright/dim event
    };
  }

  function drawSparkPath(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y - s);
    c.quadraticCurveTo(x + s * 0.12, y - s * 0.12, x + s, y);
    c.quadraticCurveTo(x + s * 0.12, y + s * 0.12, x, y + s);
    c.quadraticCurveTo(x - s * 0.12, y + s * 0.12, x - s, y);
    c.quadraticCurveTo(x - s * 0.12, y - s * 0.12, x, y - s);
    c.closePath();
  }

  /* — shooting stars — */
  var meteor = null, nextMeteorAt = 4000 + Math.random() * 6000;
  function spawnMeteor(t) {
    var fromLeft = Math.random() < 0.5;
    var ang = (35 + Math.random() * 20) * Math.PI / 180;
    meteor = {
      x: fromLeft ? Math.random() * W * 0.4 : W * 0.6 + Math.random() * W * 0.4,
      y: Math.random() * H * 0.35,
      dx: Math.cos(ang) * (fromLeft ? 1 : -1),
      dy: Math.sin(ang),
      speed: 9 + Math.random() * 4,
      born: t, life: 1150
    };
    nextMeteorAt = t + 8000 + Math.random() * 9000;
  }
  function drawMeteor(t) {
    if (!meteor) { if (t > nextMeteorAt && warp < 0.4) spawnMeteor(t); return; }
    var age = t - meteor.born;
    if (age > meteor.life) { meteor = null; return; }
    var p = age / meteor.life;
    var fade = p < 0.15 ? p / 0.15 : (1 - p) / 0.85;   // ease in, long ease out
    var x = meteor.x + meteor.dx * meteor.speed * age * 0.06;
    var y = meteor.y + meteor.dy * meteor.speed * age * 0.06;
    var tail = 130;
    var g = ctx.createLinearGradient(x, y, x - meteor.dx * tail, y - meteor.dy * tail);
    g.addColorStop(0, "rgba(255,244,219," + 0.85 * fade + ")");
    g.addColorStop(0.25, "rgba(228,196,141," + 0.4 * fade + ")");
    g.addColorStop(1, "rgba(228,196,141,0)");
    ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - meteor.dx * tail, y - meteor.dy * tail);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,248,230," + 0.9 * fade + ")";
    ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.2832); ctx.fill();
  }

  /* — the moon (crescent, top of the journey) — */
  var moonSprite = null, moonR = 0;
  function buildMoon() {
    moonR = Math.min(46, W * 0.05);
    var pad = 4, size = (moonR + pad) * 2;
    moonSprite = document.createElement("canvas");
    moonSprite.width = size * DPR; moonSprite.height = size * DPR;
    var mc = moonSprite.getContext("2d");
    mc.setTransform(DPR, 0, 0, DPR, 0, 0);
    var c = moonR + pad;
    mc.beginPath(); mc.arc(c, c, moonR, 0, 6.2832);
    mc.fillStyle = "rgba(233,219,192,.85)"; mc.fill();
    // bite erased on the sprite only — the glow underneath stays whole
    mc.globalCompositeOperation = "destination-out";
    mc.beginPath(); mc.arc(c - moonR * 0.42, c - moonR * 0.3, moonR * 0.92, 0, 6.2832); mc.fill();
  }
  function drawMoon(scrollY) {
    if (!moonSprite) return;
    var y = docAnchors.moonY - scrollY * 0.3 + pointer.y * 4;
    var x = W * 0.84 + pointer.x * 6;
    var r = moonR;
    if (y < -r * 4 || y > H + r * 4) return;
    var glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3.2);
    glow.addColorStop(0, "rgba(228,205,166,.16)");
    glow.addColorStop(1, "rgba(228,205,166,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.2832); ctx.fill();
    var half = moonSprite.width / DPR / 2;
    ctx.drawImage(moonSprite, x - half, y - half, half * 2, half * 2);
  }

  /* — a small ringed planet near the Reach constellation — */
  function drawPlanet(scrollY) {
    var y = docAnchors.planetY - scrollY * 0.78 + pointer.y * 5;
    var x = W * 0.09 + pointer.x * 8;
    if (y < -80 || y > H + 80) return;
    var r = 15;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.32);
    ctx.globalAlpha = 0.55;
    // back half of ring
    ctx.strokeStyle = "rgba(199,158,98,.8)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 2.1, r * 0.62, 0, Math.PI, 0); ctx.stroke();
    // body
    var g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.2, 0, 0, r);
    g.addColorStop(0, "#d8b57f"); g.addColorStop(1, "#7a5a30");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
    // front half of ring
    ctx.beginPath(); ctx.ellipse(0, 0, r * 2.1, r * 0.62, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
  }

  /* — the little ship (blink and you miss it) — */
  var ship = null, nextShipAt = 30000 + Math.random() * 45000;
  function drawShip(t) {
    if (!ship) {
      if (t > nextShipAt && warp < 0.3) {
        var ltr = Math.random() < 0.5;
        ship = { ltr: ltr, y0: H * (0.12 + Math.random() * 0.5), born: t, dur: 17000 };
        nextShipAt = t + 50000 + Math.random() * 70000;
      }
      return;
    }
    var p = (t - ship.born) / ship.dur;
    if (p > 1) { ship = null; return; }
    var x = ship.ltr ? -30 + (W + 60) * p : W + 30 - (W + 60) * p;
    var y = ship.y0 + Math.sin(p * Math.PI * 3) * 10;
    var dir = ship.ltr ? 1 : -1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.globalAlpha = 0.6;
    // thruster flicker
    if (Math.random() < 0.85) {
      ctx.fillStyle = "rgba(228,196,141," + (0.35 + Math.random() * 0.4) + ")";
      ctx.beginPath();
      ctx.moveTo(-9, 0); ctx.lineTo(-15 - Math.random() * 5, -1.6); ctx.lineTo(-15 - Math.random() * 5, 1.6);
      ctx.closePath(); ctx.fill();
    }
    // hull
    ctx.fillStyle = "rgba(206,222,238,.75)";
    ctx.beginPath();
    ctx.moveTo(9, 0); ctx.quadraticCurveTo(2, -4.2, -8, -2.6);
    ctx.lineTo(-8, 2.6); ctx.quadraticCurveTo(2, 4.2, 9, 0);
    ctx.closePath(); ctx.fill();
    // cockpit
    ctx.fillStyle = "rgba(199,158,98,.95)";
    ctx.beginPath(); ctx.arc(2.4, -0.4, 1.4, 0, 6.2832); ctx.fill();
    // blinking wing light
    if (Math.floor(t / 650) % 2 === 0) {
      ctx.fillStyle = "rgba(255,120,110,.85)";
      ctx.beginPath(); ctx.arc(-7.4, -2.8, 0.9, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    pointer.x += (pointerTarget.x - pointer.x) * 0.04;
    pointer.y += (pointerTarget.y - pointer.y) * 0.04;

    // warp eases up quickly, releases slowly — like a ship settling
    warp += (warpTarget - warp) * (warpTarget > warp ? 0.07 : 0.035);

    var scrollY = window.scrollY;
    var scrollDelta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    if (scrollDelta > 80) scrollDelta = 80;
    if (scrollDelta < -80) scrollDelta = -80;

    drawMoon(scrollY);
    drawPlanet(scrollY);

    var i, st;
    for (i = 0; i < stars.length; i++) {
      st = stars[i];
      var depthF = st.depth ? 1 : 0.45;

      // motion: idle drift + scroll parallax + warp thrust (upward = travelling down)
      var move = st.vy - scrollDelta * 0.22 * depthF - warp * (st.depth ? 11 : 4.6);
      st.x += st.vx;
      st.y += move;

      // wrap around
      if (st.y < -60) { st.y = H + 8; st.x = Math.random() * W; }
      if (st.y > H + 60) { st.y = -8; st.x = Math.random() * W; }
      if (st.x < -4) st.x = W + 4;
      if (st.x > W + 4) st.x = -4;

      // occasional flare: one star gently brightens or dims, then recovers
      if (!st.flare && Math.random() < 0.00012) {
        st.flare = { t: 0, dur: 1400 + Math.random() * 1400, up: Math.random() < 0.6 };
      }
      var flareMul = 1;
      if (st.flare) {
        st.flare.t += 16.7;
        var fp = st.flare.t / st.flare.dur;
        if (fp >= 1) { st.flare = null; }
        else {
          var wave = Math.sin(fp * Math.PI);
          flareMul = st.flare.up ? 1 + wave * 0.9 : 1 - wave * 0.72;
        }
      }

      var parX = pointer.x * (st.depth ? 14 : 5);
      var parY = pointer.y * (st.depth ? 9 : 3.5);
      var twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * st.tw + st.phase);
      var alpha = (st.depth ? 0.52 : 0.34) * twinkle * flareMul;
      if (alpha > 0.95) alpha = 0.95;
      var color = st.warm
        ? "rgba(228,196,141," + alpha + ")"
        : "rgba(210,225,240," + alpha * 0.82 + ")";

      // streak length: how fast this star is sweeping past you
      var streak = Math.abs(move) * 1.35;
      if (streak > 3) {
        if (streak > 70) streak = 70;
        ctx.strokeStyle = color;
        ctx.lineWidth = st.r * 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(st.x + parX, st.y + parY);
        ctx.lineTo(st.x + parX, st.y + parY + (move > 0 ? -streak : streak));
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(st.x + parX, st.y + parY, st.r * (flareMul > 1 ? 1 + (flareMul - 1) * 0.3 : 1), 0, 6.2832);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // gold 4-point sparkles — hide while warping hard
    var sparkFade = 1 - warp * 0.85;
    for (i = 0; i < sparks.length; i++) {
      st = sparks[i];
      st.y -= scrollDelta * 0.16;
      if (st.y < -30) st.y = H + 20;
      if (st.y > H + 30) st.y = -20;
      var pulse = Math.sin(t * 0.001 * st.speed * 2 + st.phase);
      var a = Math.max(0, pulse) * 0.5 * sparkFade;
      if (a < 0.02) continue;
      var sx = st.x + pointer.x * (st.depth ? 16 : 6);
      var sy = st.y + pointer.y * (st.depth ? 10 : 4);
      var size = st.s * (0.8 + 0.2 * pulse);
      ctx.fillStyle = "rgba(199,158,98," + a + ")";
      drawSparkPath(ctx, sx, sy, size);
      ctx.fill();
      ctx.fillStyle = "rgba(255,244,219," + a * 0.5 + ")";
      drawSparkPath(ctx, sx, sy, size * 0.38);
      ctx.fill();
    }

    drawMeteor(t);
    drawShip(t);
  }

  resize();
  window.addEventListener("resize", (function () {
    var timer;
    return function () { clearTimeout(timer); timer = setTimeout(resize, 180); };
  })());
  window.addEventListener("load", function () {
    var reach = document.getElementById("reach");
    if (reach) docAnchors.planetY = reach.offsetTop - 220;
  });

  if (!reduceMotion) {
    (function loop(t) { frame(t); requestAnimationFrame(loop); })(0);
  } else {
    frame(4000);
  }

  /* ─────────────────────────────────────────────
     2 · WARP TRAVEL — the next-section buttons
     ───────────────────────────────────────────── */
  var warping = false, warpRAF = null;

  function easeInOutCubic(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  function cancelWarp() {
    if (warpRAF) cancelAnimationFrame(warpRAF);
    warpRAF = null; warping = false; warpTarget = 0;
  }
  // a human touching the wheel takes back the controls
  window.addEventListener("wheel", function () { if (warping) cancelWarp(); }, { passive: true });
  window.addEventListener("touchmove", function () { if (warping) cancelWarp(); }, { passive: true });

  function warpTo(target, btn) {
    if (warping) return;
    var startY = window.scrollY;
    var endY = target.getBoundingClientRect().top + startY;
    var maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (endY > maxY) endY = maxY;
    var dist = Math.abs(endY - startY);
    if (dist < 4) return;
    if (reduceMotion) { window.scrollTo(0, endY); return; }

    warping = true;
    warpTarget = Math.min(1, 0.55 + dist / 2600);   // longer trips, harder warp
    if (btn) btn.classList.add("launching");
    var dur = Math.max(950, Math.min(2100, 550 + dist * 0.62));
    var t0 = null;

    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      window.scrollTo(0, startY + (endY - startY) * easeInOutCubic(p));
      if (p < 1 && warping) {
        warpRAF = requestAnimationFrame(step);
      } else {
        warpTarget = 0; warping = false; warpRAF = null;
        if (btn) btn.classList.remove("launching");
      }
    }
    warpRAF = requestAnimationFrame(step);
  }

  document.querySelectorAll("a[data-warp]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      warpTo(target, a.classList.contains("next-btn") ? a : null);
      history.replaceState(null, "", id);
    });
  });

  /* ─────────────────────────────────────────────
     3 · Intro star wipe + headline shimmer
     ───────────────────────────────────────────── */
  var wipe = document.getElementById("wipe");
  var shimmer = document.getElementById("heroShimmer");

  function endIntro() {
    wipe.classList.remove("intro");
    wipe.classList.add("expand");
    setTimeout(function () {
      wipe.classList.add("fade");
      if (shimmer && !reduceMotion) shimmer.classList.add("play");
    }, 480);
    setTimeout(function () {
      wipe.classList.add("gone");
      wipe.classList.remove("expand", "fade");
    }, 1000);
  }

  if (reduceMotion) {
    wipe.classList.add("gone");
  } else {
    wipe.classList.add("intro");
    if (document.readyState === "complete") {
      setTimeout(endIntro, 500);
    } else {
      window.addEventListener("load", function () { setTimeout(endIntro, 350); });
      setTimeout(endIntro, 2600);
    }
  }
  var introDone = false;
  setTimeout(function () { introDone = true; }, 1200);

  /* ─────────────────────────────────────────────
     4 · Star wipe for nav jumps
     ───────────────────────────────────────────── */
  var wiping = false;
  function starWipeTo(target) {
    if (wiping) return;
    if (reduceMotion) { target.scrollIntoView(); return; }
    cancelWarp();
    wiping = true;
    wipe.classList.remove("gone", "fade", "intro", "expand");
    void wipe.offsetWidth;
    wipe.classList.add("expand");
    setTimeout(function () {
      target.scrollIntoView({ behavior: "instant", block: "start" });
      lastScrollY = window.scrollY;          // don't streak the jump
      wipe.classList.add("fade");
    }, 560);
    setTimeout(function () {
      wipe.classList.add("gone");
      wipe.classList.remove("expand", "fade");
      wiping = false;
    }, 1030);
  }

  document.querySelectorAll("a[data-wipe]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      document.getElementById("nav").classList.remove("open");
      if (introDone) starWipeTo(target);
      else target.scrollIntoView();
      history.replaceState(null, "", id);
    });
  });

  /* ─────────────────────────────────────────────
     5 · Nav chrome + burger
     ───────────────────────────────────────────── */
  var nav = document.getElementById("nav");
  var onScroll = function () {
    nav.classList.toggle("solid", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  document.getElementById("navBurger").addEventListener("click", function () {
    nav.classList.toggle("open");
  });

  /* ─────────────────────────────────────────────
     6 · Scroll reveals
     ───────────────────────────────────────────── */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [];
      var idx = Array.prototype.indexOf.call(siblings, el);
      el.style.transitionDelay = (idx > 0 ? Math.min(idx * 70, 420) : 0) + "ms";
      el.classList.add("in");
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { revealObserver.observe(el); });

  /* ─────────────────────────────────────────────
     7 · Counters — climb, then burst on the final digit
     ───────────────────────────────────────────── */
  function formatStat(value, suffix, plus) {
    var txt;
    if (suffix === "M") {
      var m = value / 1000000;
      txt = (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10).toString();
      txt = txt.replace(/\.0$/, "") + "M";
    } else {
      txt = Math.round(value).toLocaleString("en-US");
    }
    if (plus === "before") txt = "+" + txt;
    if (plus === "after") txt = txt + "+";
    return txt;
  }

  function sparkleBurst(host) {
    var n = 14;
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.className = "burst-star";
      host.appendChild(s);
      var ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      var dist = 60 + Math.random() * 110;
      var dx = Math.cos(ang) * dist;
      var dy = Math.sin(ang) * dist * 0.8;
      var scale = 0.5 + Math.random() * 1.1;
      var dur = 800 + Math.random() * 500;
      s.animate([
        { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 1 },
        { transform: "translate(calc(-50% + " + dx * 0.55 + "px), calc(-50% + " + dy * 0.55 + "px)) scale(" + scale + ") rotate(45deg)", opacity: 1, offset: 0.4 },
        { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(0) rotate(90deg)", opacity: 0 }
      ], { duration: dur, easing: "cubic-bezier(.16,.7,.3,1)", fill: "forwards" });
      (function (el, d) { setTimeout(function () { el.remove(); }, d + 60); })(s, dur);
    }
  }

  function runCounter(el, duration, delay, onDone) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var plus = el.getAttribute("data-plus") || "";
    if (reduceMotion) {
      el.textContent = formatStat(target, suffix, plus);
      if (onDone) onDone();
      return;
    }
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = formatStat(target * eased, suffix, plus);
      if (p < 1) requestAnimationFrame(tick);
      else if (onDone) onDone();
    }
    setTimeout(function () { requestAnimationFrame(tick); }, delay);
  }

  var reachSection = document.getElementById("reach");
  var countersFired = false;
  var reachObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting || countersFired) return;
      countersFired = true;
      var small = reachSection.querySelectorAll(".stat-row .stat-value");
      small.forEach(function (el, i) { runCounter(el, 1700, 250 + i * 180); });
      var big = reachSection.querySelector(".stat-big .stat-value");
      runCounter(big, 2300, 700, function () {
        sparkleBurst(big);
      });
      reachObserver.disconnect();
    });
  }, { threshold: 0.35 });
  if (reachSection) reachObserver.observe(reachSection);

})();
