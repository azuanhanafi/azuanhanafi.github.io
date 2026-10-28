// Hero dot field: icons drawn as a honeycomb of dots that spring into place,
// part around the cursor, tilt in 3D toward the pointer and morph from one
// industry to the next on click (or every few seconds on their own).
(function () {
  "use strict";

  var canvas = document.getElementById("hero-dots");
  var hero = document.getElementById("top");
  var stage = document.querySelector(".hero__stage");
  if (!canvas || !canvas.getContext || !hero || !stage) return;

  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Palette ----------
  var INK = "#231F20";
  var TEAL = "#0A282D";
  var BROWN = "#B07040";
  var PEACH = "#E5BA97";
  var GREEN = "#3DB663";
  var LIGHT = "#9FD9B2";
  var AMBIENT = [BROWN, PEACH, GREEN, INK, "#8FA3A0"];

  // Outline colour shades from deep teal at the top to green at the bottom
  var RAMP = [];
  for (var i = 0; i < 9; i++) {
    var t = Math.pow(i / 8, 0.9);
    RAMP.push("rgb(" + Math.round(10 + 51 * t) + "," + Math.round(40 + 142 * t) + "," + Math.round(45 + 54 * t) + ")");
  }
  function ramp(y) {
    return RAMP[Math.min(8, Math.max(0, Math.floor(((y - 14) / 252) * 9)))];
  }

  // ---------- Geometry helpers (shapes live in a 280 x 280 box) ----------
  function dist(x, y, a, b) {
    return Math.sqrt((x - a) * (x - a) + (y - b) * (y - b));
  }

  function inRRect(x, y, x0, y0, x1, y1, r) {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    r = r || 0;
    var cx = Math.max(x0 + r, Math.min(x, x1 - r));
    var cy = Math.max(y0 + r, Math.min(y, y1 - r));
    return dist(x, y, cx, cy) <= r;
  }

  function nearSeg(x, y, ax, ay, bx, by, w) {
    var dx = bx - ax;
    var dy = by - ay;
    var t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    return dist(x, y, ax + dx * t, ay + dy * t) <= w;
  }

  function nearPath(x, y, pts, w) {
    for (var i = 1; i < pts.length; i++) {
      if (nearSeg(x, y, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w)) return true;
    }
    return false;
  }

  function inPoly(x, y, pts) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function inEllipse(x, y, cx, cy, rx, ry) {
    var u = (x - cx) / rx;
    var v = (y - cy) / ry;
    return u * u + v * v <= 1;
  }

  // Angle of (x, y) around (cx, cy) in degrees, y pointing down
  function angle(x, y, cx, cy) {
    return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  }

  // On a ring of radius r between angles a0 and a1 (a1 may pass 180)
  function onArc(x, y, cx, cy, r, a0, a1, w) {
    var a = angle(x, y, cx, cy);
    if (a1 > 180 && a < a0) a += 360;
    if (a < a0 || a > a1) return false;
    return Math.abs(dist(x, y, cx, cy) - r) <= w;
  }

  // ---------- Shapes ----------
  // Fighter jet, top view: the right half is drawn, the left mirrors it
  function mirror(pts) {
    return pts.map(function (p) {
      return [280 - p[0], p[1]];
    });
  }
  var FUSELAGE = [[140, 8], [146, 30], [151, 66], [153, 110], [153, 206], [151, 240], [129, 240], [127, 206], [127, 110], [129, 66], [134, 30]];
  var WING_R = [[152, 128], [250, 186], [250, 200], [152, 198]];
  var STRAKE_R = [[152, 86], [164, 126], [152, 132]];
  var STAB_R = [[152, 216], [200, 244], [200, 256], [152, 250]];
  var JET = [FUSELAGE, WING_R, mirror(WING_R), STRAKE_R, mirror(STRAKE_R), STAB_R, mirror(STAB_R)];
  var CABIN = [[62, 144], [98, 90], [188, 90], [228, 144]];
  var REAR_WINDOW = [[84, 140], [108, 102], [138, 102], [138, 140]];
  var FRONT_WINDOW = [[148, 102], [182, 102], [208, 140], [148, 140]];

  // Behind-the-ear hearing device: a curved body on a wide arc, an ear hook
  // over the top, a thin tube down to the ear dome, and sound waves
  var BODY = { cx: 74, cy: 150, r: 130, a0: -40, a1: 36 };
  function bodyEnd(a) {
    var t = (a * Math.PI) / 180;
    return [BODY.cx + BODY.r * Math.cos(t), BODY.cy + BODY.r * Math.sin(t)];
  }
  function bodyWidth(a) {
    return 25 + ((a - BODY.a0) / (BODY.a1 - BODY.a0)) * 9;
  }
  var BODY_TOP = bodyEnd(BODY.a0);
  var BODY_BOTTOM = bodyEnd(BODY.a1);
  var HOOK = { cx: BODY_TOP[0] - 42, cy: BODY_TOP[1] + 2, r: 42 };
  var TUBE = [[HOOK.cx - HOOK.r, HOOK.cy], [HOOK.cx - HOOK.r - 4, HOOK.cy + 40], [HOOK.cx - HOOK.r - 6, HOOK.cy + 78]];
  var DOME = { x: HOOK.cx - HOOK.r - 6, y: HOOK.cy + 98 };
  var BUTTON = bodyEnd(-19);

  function inHearingBody(x, y) {
    var a = Math.max(BODY.a0, Math.min(BODY.a1, angle(x, y, BODY.cx, BODY.cy)));
    if (onArc(x, y, BODY.cx, BODY.cy, BODY.r, BODY.a0, BODY.a1, bodyWidth(a))) return true;
    return dist(x, y, BODY_TOP[0], BODY_TOP[1]) <= bodyWidth(BODY.a0) ||
      dist(x, y, BODY_BOTTOM[0], BODY_BOTTOM[1]) <= bodyWidth(BODY.a1);
  }

  var SHAPES = [
    {
      name: "Aerospace",
      fn: function (x, y) {
        if (inEllipse(x, y, 140, 62, 7, 19)) return LIGHT; // canopy
        if (nearSeg(x, y, 260, 160, 260, 214, 4.5) || nearSeg(x, y, 20, 160, 20, 214, 4.5)) return PEACH; // wingtip missiles
        if (nearSeg(x, y, 158, 200, 170, 246, 3.8) || nearSeg(x, y, 122, 200, 110, 246, 3.8)) return INK; // twin tails
        if (inRRect(x, y, 128, 240, 139, 262, 4) || inRRect(x, y, 141, 240, 152, 262, 4)) return BROWN; // nozzles
        for (var j = 0; j < JET.length; j++) {
          if (inPoly(x, y, JET[j])) return ramp(y);
        }
        return null;
      }
    },
    {
      name: "Medical device",
      fn: function (x, y) {
        if (dist(x, y, BUTTON[0] + 6, BUTTON[1]) <= 8) return BROWN;
        if (inRRect(x, y, BODY.cx + BODY.r - 4, 152, BODY.cx + BODY.r + 10, 188, 5)) return PEACH;
        if (inHearingBody(x, y) || onArc(x, y, HOOK.cx, HOOK.cy, HOOK.r, -180, 0, 10)) return ramp(y);
        if (nearPath(x, y, TUBE, 5)) return LIGHT;
        if (inEllipse(x, y, DOME.x, DOME.y, 15, 19)) return PEACH;
        for (var k = 0; k < 3; k++) {
          if (onArc(x, y, DOME.x, DOME.y, 30 + k * 18, 142, 218, 4)) return k === 0 ? GREEN : LIGHT;
        }
        return null;
      }
    },
    {
      name: "Automotive",
      fn: function (x, y) {
        var wa = dist(x, y, 74, 202);
        var wb = dist(x, y, 206, 202);
        if (wa <= 9 || wb <= 9) return PEACH;
        if ((wa >= 13 && wa <= 28) || (wb >= 13 && wb <= 28)) return INK;
        if (wa < 34 || wb < 34) return null;
        if (inRRect(x, y, 252, 152, 266, 166, 4)) return PEACH;
        if (inRRect(x, y, 14, 150, 26, 164, 4)) return BROWN;
        if (inPoly(x, y, REAR_WINDOW) || inPoly(x, y, FRONT_WINDOW)) return LIGHT;
        if (inRRect(x, y, 14, 140, 266, 202, 18) || inPoly(x, y, CABIN)) return ramp(y);
        if (y >= 246 && y <= 254 && x >= 20 && x <= 260 && (x - 20) % 46 < 26) return LIGHT;
        return null;
      }
    }
  ];

  // ---------- State ----------
  var W = 0;
  var H = 0;
  var L = null; // layout: cx, cy, size, sp
  var targets = []; // sampled points per shape
  var P = []; // particles
  var ambient = [];
  var ripples = [];
  var cur = 0;
  var next = 0;
  var morphing = false;
  var morphStart = 0;
  var MORPH_SPREAD = 0.6;
  var MORPH_DUR = 0.55;
  var introStart = 0;
  var lastMorph = 0;
  var lastPointer = 0;
  var scrollP = 0;
  var mouse = { x: -9999, y: -9999 };
  var view = { yaw: 0, pitch: 0, nx: 0, ny: 0, drag: 0 };
  var dragFrom = null;
  var dragged = false;
  var released = 0;
  var running = false;
  var visible = true;
  var raf = 0;

  var label = document.querySelector(".morph");
  var labelNum = label && label.querySelector(".morph__num");
  var labelName = label && label.querySelector(".morph__name");
  var labelDots = label ? Array.prototype.slice.call(label.querySelectorAll(".morph__dots button")) : [];

  function sample(fn, step, scale, cx, cy) {
    var pts = [];
    for (var y = 12, row = 0; y <= 268; y += step * 0.866, row++) {
      for (var x = 12 + (row % 2 ? step / 2 : 0); x <= 268; x += step) {
        var c = fn(x, y);
        if (c) pts.push({ x: cx + (x - 140) * scale, y: cy + (y - 140) * scale, c: c });
      }
    }
    return pts;
  }

  function dome(x, y) {
    var d = dist(x, y, L.cx, L.cy) / (L.size * 0.6);
    return Math.max(0, 1 - d * d) * L.size * 0.3 + (Math.random() - 0.5) * L.size * 0.05;
  }

  function pick(shape, i) {
    return shape[i] || shape[(i * 7919) % shape.length];
  }

  function setTargets(k) {
    var shape = targets[k];
    P.forEach(function (p, i) {
      var q = pick(shape, i);
      p.tx = q.x;
      p.ty = q.y;
      p.tz = dome(q.x, q.y);
      p.c = q.c;
      p.ta = shape[i] ? 1 : 0;
    });
  }

  function layout() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cr = canvas.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    var wide = W > 900;
    var size = Math.min(sr.width, sr.height - 56, 560);
    var oldCx = L ? L.cx : 0;
    var oldCy = L ? L.cy : 0;
    L = {
      cx: sr.left - cr.left + sr.width / 2,
      cy: sr.top - cr.top + (sr.height - 56) / 2,
      size: size,
      sp: wide ? Math.max(7.5, size / 56) : Math.max(6, size / 44)
    };
    var scale = size / 280;
    targets = SHAPES.map(function (s) {
      return sample(s.fn, L.sp / scale, scale, L.cx, L.cy);
    });

    var count = Math.max.apply(null, targets.map(function (t) { return t.length; }));
    var old = P;
    P = [];
    for (var i = 0; i < count; i++) {
      var prev = old[i];
      var a = Math.random() * Math.PI * 2;
      P.push({
        x: prev ? prev.x - oldCx + L.cx : 0,
        y: prev ? prev.y - oldCy + L.cy : 0,
        vx: 0,
        vy: 0,
        a: prev ? prev.a : 0,
        done: prev ? prev.done : false,
        e: prev ? prev.e : 0,
        r: L.sp * 0.36 * (0.85 + Math.random() * 0.3),
        // scatter direction used while the hero scrolls away
        sx: Math.cos(a) * (200 + Math.random() * 500),
        sy: Math.sin(a) * (200 + Math.random() * 500) - 120,
        // intro: start on a wider, rotated copy of the shape
        k0: 1.35 + Math.random() * 0.55,
        th0: 0.8 + Math.random() * 0.35,
        jx: 0,
        jy: 0,
        delay: 0
      });
    }
    setTargets(morphing ? next : cur);
    P.forEach(function (p) {
      var j = Math.random() * size * 0.16;
      var b = Math.random() * Math.PI * 2;
      p.jx = Math.cos(b) * j;
      p.jy = Math.sin(b) * j;
      p.delay = Math.min(1, dist(p.tx, p.ty, L.cx, L.cy) / (size * 0.62)) * 0.5 + Math.random() * 0.12;
    });

    if (!ambient.length) {
      var n = wide ? 46 : 22;
      for (var k = 0; k < n; k++) {
        ambient.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.5 + Math.random() * 4,
          c: AMBIENT[k % AMBIENT.length],
          a: 0.25 + Math.random() * 0.4
        });
      }
    }
    if (reduce) draw(performance.now());
  }

  // ---------- Label pill ----------
  function updateLabel(k, quiet) {
    if (!label) return;
    labelNum.textContent = "0" + (k + 1);
    labelName.textContent = SHAPES[k].name;
    labelDots.forEach(function (b, i) {
      b.setAttribute("aria-pressed", String(i === k));
      b.classList.toggle("is-on", i === k);
      b.style.removeProperty("--p");
    });
    if (window.anime && !reduce && !quiet) {
      window.anime.animate(labelName, { translateY: ["70%", "0%"], opacity: [0, 1], duration: 600, ease: "outExpo" });
    }
  }

  // ---------- Morph ----------
  function morphTo(k, now) {
    k = (k + SHAPES.length) % SHAPES.length;
    if (reduce) {
      cur = k;
      setTargets(k);
      updateLabel(k);
      draw(performance.now());
      return;
    }
    if (morphing || k === cur || !L) return;
    var shape = targets[k];
    next = k;
    morphing = true;
    morphStart = now;
    if (label) label.classList.add("is-busy");
    P.forEach(function (p, i) {
      var q = pick(shape, i);
      p.fx = p.tx - L.cx;
      p.fy = p.ty - L.cy;
      p.fz = p.tz;
      p.fc = p.c;
      p.fa = p.ta;
      p.nx = q.x - L.cx;
      p.ny = q.y - L.cy;
      p.nz = dome(q.x, q.y);
      p.nc = q.c;
      p.na = shape[i] ? 1 : 0;
      // sweep left to right
      p.md = Math.max(0, Math.min(1, (p.tx - L.cx) / L.size + 0.5)) * MORPH_SPREAD + Math.random() * 0.1;
    });
  }

  function finishMorph(now) {
    cur = next;
    morphing = false;
    setTargets(cur);
    lastMorph = now;
    ripples.push(now);
    if (label) label.classList.remove("is-busy");
    updateLabel(cur);
  }

  // ---------- Frame ----------
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    if (!L) return;
    var fade = 1 - scrollP * 0.85;
    var i, p;

    // Ambient dots drift across the whole hero
    for (i = 0; i < ambient.length; i++) {
      p = ambient[i];
      if (!reduce) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }
      ctx.globalAlpha = reduce ? p.a : p.a * Math.min(1, (now - introStart) / 1400);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }

    var t = now / 1000;
    var since = (now - introStart) / 1000;
    var mt = (now - morphStart) / 1000;

    // Tilt toward the pointer, plus a slow idle sway
    var yawGoal = reduce ? 0 : view.nx * 0.6 + view.drag + Math.sin(t * 0.5) * 0.22;
    var pitchGoal = reduce ? 0 : -view.ny * 0.4 + Math.sin(t * 0.37) * 0.08;
    view.yaw += (yawGoal - view.yaw) * 0.07;
    view.pitch += (pitchGoal - view.pitch) * 0.07;
    var cy = Math.cos(view.yaw);
    var sy = Math.sin(view.yaw);
    var cp = Math.cos(view.pitch);
    var sp = Math.sin(view.pitch);
    var D = L.size * 2.4;
    var R = Math.max(90, L.size * 0.24);

    ctx.lineCap = "round";
    for (i = 0; i < P.length; i++) {
      p = P[i];
      var moving = false;
      var f = 1;

      if (reduce) {
        p.x = p.tx;
        p.y = p.ty;
        p.a = p.ta;
        p.e = 1;
      } else {
        var lx = p.tx - L.cx;
        var ly = p.ty - L.cy;
        var lz = p.tz || 0;

        if (morphing) {
          var r = (mt - p.md) / MORPH_DUR;
          if (r >= 1) {
            lx = p.nx;
            ly = p.ny;
            lz = p.nz;
            p.c = p.nc;
            p.ta = p.na;
          } else if (r > 0) {
            moving = true;
            var s = r * r * (3 - 2 * r);
            var w = Math.sin(r * Math.PI);
            var dx = p.nx - p.fx;
            var dy = p.ny - p.fy;
            // travel along an arc and pop toward the viewer mid-flight
            lx = p.fx + dx * s - dy * 0.3 * w;
            ly = p.fy + dy * s + dx * 0.3 * w;
            lz = p.fz + (p.nz - p.fz) * s + L.size * 0.3 * w;
            p.c = r < 0.5 ? p.fc : p.nc;
            p.ta = r < 0.5 ? p.fa : p.na;
          }
        }

        // 3D: yaw around the vertical axis, pitch around the horizontal one
        var x1 = lx * cy + lz * sy;
        var z1 = -lx * sy + lz * cy;
        var y1 = ly * cp - z1 * sp;
        var z2 = ly * sp + z1 * cp;
        f = D / (D - z2);
        var gx = L.cx + x1 * f + p.sx * scrollP;
        var gy = L.cy + y1 * f + p.sy * scrollP;
        p.f = f;

        if (moving) {
          p.vx = gx - p.x;
          p.vy = gy - p.y;
          p.x = gx;
          p.y = gy;
          p.e = 1;
          p.a += (p.ta - p.a) * 0.18;
        } else if (p.done) {
          // spring home, part around the cursor
          p.vx += (gx - p.x) * 0.045;
          p.vy += (gy - p.y) * 0.045;
          var mx = p.x - mouse.x;
          var my = p.y - mouse.y;
          var md = mx * mx + my * my;
          if (md < R * R) {
            var d = Math.sqrt(md) + 0.01;
            var push = (1 - d / R) * 2.6;
            p.vx += (mx / d) * push;
            p.vy += (my / d) * push;
          }
          p.vx *= 0.82;
          p.vy *= 0.82;
          p.x += p.vx;
          p.y += p.vy;
          p.a += (p.ta - p.a) * 0.08;
          p.e = 1;
        } else {
          // intro: unwind from a wider, rotated copy into place
          var k = Math.max(0, Math.min(1, (since - p.delay) / 0.95));
          var e = 1 - Math.pow(1 - k, 4);
          var inv = 1 - e;
          var ox = gx - L.cx;
          var oy = gy - L.cy;
          var th = p.th0 * inv;
          var sc = 1 + (p.k0 - 1) * inv;
          var ct = Math.cos(th);
          var st = Math.sin(th);
          var nx = L.cx + (ox * ct - oy * st) * sc + p.jx * inv + Math.sin(now / 1300 + i) * 4 * inv;
          var ny = L.cy + (ox * st + oy * ct) * sc + p.jy * inv + Math.cos(now / 1100 + i * 0.7) * 4 * inv;
          p.vx = nx - p.x;
          p.vy = ny - p.y;
          p.x = nx;
          p.y = ny;
          p.e = e;
          p.a = p.ta * (0.3 + 0.7 * e);
          if (k >= 1) {
            p.done = true;
            p.vx = 0;
            p.vy = 0;
          }
        }
      }

      if (p.a < 0.02) continue;
      var depth = (p.f || 1) * (reduce ? 1 : 0.6 + 0.4 * p.e);
      ctx.globalAlpha = fade * p.a * Math.min(1, 0.45 + (depth - 0.85) * 2.2);
      var speed = p.vx * p.vx + p.vy * p.vy;
      if (!reduce && speed > 9) {
        // fast dots draw as short streaks
        var trail = moving ? 0.8 : p.done ? 2.4 : 1.1;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = p.r * 2 * depth;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * trail, p.y - p.vy * trail);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * depth, 0, 6.2832);
        ctx.fill();
      }
    }

    // Ripple rings when a shape lands
    for (i = ripples.length - 1; i >= 0; i--) {
      var q = (now - ripples[i]) / 900;
      if (q > 1) {
        ripples.splice(i, 1);
        continue;
      }
      if (q < 0) continue;
      var grow = 1 - Math.pow(1 - q, 3);
      ctx.globalAlpha = (1 - q) * 0.55 * fade;
      ctx.strokeStyle = i % 2 ? PEACH : GREEN;
      ctx.lineWidth = 1 + 2.5 * (1 - q);
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, L.size * (0.12 + grow * 0.75), 0, 6.2832);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (morphing && mt > MORPH_SPREAD + 0.1 + MORPH_DUR) finishMorph(now);
  }

  var ripplePlayed = false;
  var prevFrame = 0;
  function frame(now) {
    if (!running) return;
    var dt = prevFrame ? Math.min(now - prevFrame, 100) : 0;
    prevFrame = now;
    draw(now);
    if (!ripplePlayed && now - introStart > 1750) {
      ripplePlayed = true;
      ripples.push(now);
    }
    // Let a drag spin ease back to rest a moment after release
    if (!dragFrom && released && now - released > 1200) view.drag *= 0.94;

    // Auto-advance while idle; the timer holds while the pointer is busy,
    // a morph is running or the hero is scrolling away
    var wait = cur === 0 ? 4600 : 3800;
    if (now - lastPointer < 1500 || morphing || scrollP >= 0.15) lastMorph += dt;
    var p = morphing ? 0 : Math.max(0, Math.min(1, (now - lastMorph) / wait));
    if (labelDots[cur]) labelDots[cur].style.setProperty("--p", p.toFixed(3));
    if (p >= 1) morphTo(cur + 1, now);
    raf = requestAnimationFrame(frame);
  }

  function play() {
    if (running || reduce) return;
    running = true;
    prevFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function sync() {
    if (visible && !document.hidden) play();
    else pause();
  }

  // ---------- Input ----------
  function isControl(el) {
    return el.closest && el.closest("a, button, input, .morph");
  }

  labelDots.forEach(function (b, i) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      morphTo(i, performance.now());
    });
  });

  if (!reduce) {
    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      lastPointer = performance.now();
      if (L) {
        view.nx = Math.max(-1, Math.min(1, (mouse.x - L.cx) / (W * 0.5)));
        view.ny = Math.max(-1, Math.min(1, (mouse.y - L.cy) / (H * 0.5)));
      }
      if (dragFrom) {
        var dx = e.clientX - dragFrom.x;
        if (Math.abs(dx) > 6) dragged = true;
        view.drag = dragFrom.d + dx * 0.012;
      }
    });
    hero.addEventListener("pointerleave", function () {
      mouse.x = mouse.y = -9999;
      view.nx = view.ny = 0;
    });
    hero.addEventListener("pointerdown", function (e) {
      // drag to spin, but leave text selection in the copy alone
      if (e.pointerType === "touch" || isControl(e.target) || e.target.closest(".hero__copy")) return;
      dragFrom = { x: e.clientX, d: view.drag };
      dragged = false;
    });
    var endDrag = function () {
      if (!dragFrom) return;
      dragFrom = null;
      released = performance.now();
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    hero.addEventListener("click", function (e) {
      if (isControl(e.target)) return;
      if (dragged) {
        dragged = false;
        return;
      }
      morphTo(cur + 1, performance.now());
    });
  }

  // Scatter and fade as the hero scrolls away
  function onScroll() {
    var r = hero.getBoundingClientRect();
    var prog = Math.max(0, Math.min(1, -r.top / r.height));
    scrollP = W > 900 ? prog : Math.max(0, (prog - 0.45) / 0.55);
    if (label) label.style.opacity = String(1 - Math.min(1, scrollP * 3));
    if (reduce) draw(performance.now());
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (Math.abs(canvas.clientWidth - W) > 1 || Math.abs(canvas.clientHeight - H) > 1) layout();
    });
  }

  document.addEventListener("visibilitychange", sync);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }).observe(hero);
  }

  layout();
  updateLabel(cur, true);
  onScroll();
  introStart = performance.now();
  lastMorph = introStart + 2500;
  if (reduce) draw(introStart);
  sync();
})();
