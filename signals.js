// Background signal traces: short pulses that run along the lines of the
// "+" grid (the grid's crosses sit at 64 + 128k px, matching .bg__grid).
(function () {
  "use strict";

  var canvas = document.getElementById("signal-canvas");
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var ctx = canvas.getContext("2d");
  var CELL = 128;
  var OFFSET = 64;
  var FADE = 700;
  var TEAL = "74, 222, 196";
  var GOLD = "245, 200, 75";

  var w = 0;
  var h = 0;
  var traces = [];
  var raf = 0;
  var last = 0;
  var running = false;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function count() {
    return w < 720 ? 3 : 6;
  }

  function spawn(initial) {
    var cols = Math.max(1, Math.ceil(w / CELL));
    var rows = Math.max(1, Math.ceil(h / CELL));
    var cells = 2 + Math.floor(Math.random() * 3);
    return {
      x: OFFSET + CELL * Math.floor(Math.random() * cols),
      y: OFFSET + CELL * Math.floor(Math.random() * rows),
      horizontal: Math.random() < 0.5,
      dir: Math.random() < 0.5 ? 1 : -1,
      length: cells * CELL,
      tail: 80 + Math.random() * 70,
      duration: 1600 + cells * 650,
      t: 0,
      wait: (initial ? 0 : 600) + Math.random() * 2600,
      color: Math.random() < 0.18 ? GOLD : TEAL
    };
  }

  function point(tr, d) {
    return tr.horizontal ? [tr.x + tr.dir * d, tr.y] : [tr.x, tr.y + tr.dir * d];
  }

  function draw(tr) {
    var p = Math.min(tr.t / tr.duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    var head = eased * tr.length;
    var tail = Math.max(0, head - tr.tail);
    var alpha = tr.t > tr.duration ? Math.max(0, 1 - (tr.t - tr.duration) / FADE) : Math.min(1, tr.t / 200);
    if (alpha <= 0 || head <= 0) return;

    var a = point(tr, tail);
    var b = point(tr, head);
    var grad = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    grad.addColorStop(0, "rgba(" + tr.color + ", 0)");
    grad.addColorStop(1, "rgba(" + tr.color + ", " + 0.55 * alpha + ")");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();

    ctx.fillStyle = "rgba(" + tr.color + ", " + 0.85 * alpha + ")";
    ctx.beginPath();
    ctx.arc(b[0], b[1], 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now) {
    var dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    ctx.clearRect(0, 0, w, h);

    while (traces.length < count()) traces.push(spawn(false));
    if (traces.length > count()) traces.length = count();

    for (var i = 0; i < traces.length; i++) {
      var tr = traces[i];
      if (tr.wait > 0) {
        tr.wait -= dt;
        continue;
      }
      tr.t += dt;
      if (tr.t > tr.duration + FADE) {
        traces[i] = spawn(false);
        continue;
      }
      draw(tr);
    }
    raf = requestAnimationFrame(frame);
  }

  function play() {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
    else play();
  });

  resize();
  for (var i = 0; i < count(); i++) traces.push(spawn(true));
  play();
})();
