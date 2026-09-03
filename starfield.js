// Subtle constellation background — drifting particles linked by faint lines.
// Respects prefers-reduced-motion, pauses when the tab is hidden, follows the theme.
(function () {
  var canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var w = 0, h = 0, particles = [], raf = null;
  var LINK_DIST = 130;
  var DOT_ALPHA = 0.3;
  var LINE_ALPHA = 0.1;

  function themeRGB() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t !== "dark" && t !== "light") t = darkMQ.matches ? "dark" : "light";
    return t === "dark" ? "255, 255, 255" : "40, 55, 80";
  }
  var rgb = themeRGB();

  function build() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.round((w * h) / 22000);
    count = Math.max(22, Math.min(85, count));

    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.3 + 0.6
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + rgb + ", " + DOT_ALPHA + ")";
      ctx.fill();

      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x, dy = p.y - q.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = "rgba(" + rgb + ", " + (LINE_ALPHA * (1 - d / LINK_DIST)).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function start() {
    stop();
    if (reduceMQ.matches) {
      draw(); // single static frame
    } else {
      loop();
    }
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      build();
      start();
    }, 150);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  function onThemeChange() {
    rgb = themeRGB();
    if (reduceMQ.matches) draw();
  }
  new MutationObserver(onThemeChange).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });
  addMQListener(darkMQ, onThemeChange);
  addMQListener(reduceMQ, start);

  function addMQListener(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  build();
  start();
})();
