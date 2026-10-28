// Hero: headline letter rolls + the change request approval pipeline.
// The HTML already shows a finished pipeline, so without JS (or with reduced
// motion) the hero stays a complete, static picture.
(function () {
  "use strict";

  var pipe = document.querySelector("[data-pipeline]");
  if (!pipe) return;

  var rail = pipe.querySelector(".rail");
  var fill = pipe.querySelector(".rail__fill");
  var nodes = pipe.querySelectorAll(".stage__node");
  var centers = [];

  // Fit the rail between the first and last stage nodes
  function measure() {
    var box = rail.parentNode.getBoundingClientRect();
    var mids = Array.prototype.map.call(nodes, function (n) {
      var r = n.getBoundingClientRect();
      return r.top + r.height / 2 - box.top;
    });
    var top = mids[0];
    var span = mids[mids.length - 1] - top;
    rail.style.top = top + "px";
    rail.style.bottom = "auto";
    rail.style.height = span + "px";
    centers = mids.map(function (m) {
      return span > 0 ? (m - top) / span : 0;
    });
  }

  measure();
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  var anime = window.anime;
  if (!anime || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ---------- Letter roll ----------
  function setChars(el, text) {
    el.textContent = "";
    text.split("").forEach(function (c) {
      var s = document.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? " " : c;
      el.appendChild(s);
    });
    el.setAttribute("data-text", text);
  }

  function roll(el, text) {
    if (el.getAttribute("data-text") === text) return;
    el.setAttribute("data-text", text);
    anime.animate(el.querySelectorAll(".ch"), {
      translateY: ["0%", "-110%"],
      duration: 320,
      delay: anime.stagger(22),
      ease: "inQuad",
      onComplete: function () {
        if (el.getAttribute("data-text") !== text) return; // a newer roll took over
        setChars(el, text);
        anime.animate(el.querySelectorAll(".ch"), {
          translateY: ["110%", "0%"],
          duration: 650,
          delay: anime.stagger(28),
          ease: "outExpo"
        });
      }
    });
  }

  var industry = document.querySelector('[data-roll="industry"]');
  var word = document.querySelector('[data-roll="word"]');
  [industry, word].forEach(function (el) {
    setChars(el, el.textContent.trim());
  });

  // ---------- Pipeline ----------
  var F = {};
  Array.prototype.forEach.call(pipe.querySelectorAll("[data-f]"), function (el) {
    F[el.getAttribute("data-f")] = el;
  });
  var stages = pipe.querySelectorAll(".stage");
  var chips = pipe.querySelectorAll(".chip");
  var ticket = pipe.querySelector(".ticket");
  var flow = pipe.querySelector(".flow");
  setChars(F.version, F.version.textContent.trim());

  // Illustrative change requests, one per industry
  var CYCLES = [
    { industry: "Aerospace", id: "CR-0142", title: "Flight control software", std: "DO‑178C", from: "v2.3", to: "v2.4", ci: 3 },
    { industry: "Medical device", id: "CR-0217", title: "Device firmware", std: "IEC 60601", from: "v5.1", to: "v5.2", ci: 2 },
    { industry: "Automotive", id: "ECN-0388", title: "Brake line harness drawing", std: "IATF 16949", from: "Rev C", to: "Rev D", ci: 4 }
  ];

  function setStage(i, state) {
    stages[i].classList.toggle("is-active", state === "active");
    stages[i].classList.toggle("is-done", state === "done");
  }

  function progress(i) {
    fill.style.transform = "scaleY(" + (centers[i] || 0) + ")";
  }

  function status(text, state) {
    F.status.textContent = text;
    F.status.setAttribute("data-state", state || "");
  }

  function approve(k) {
    chips[k].classList.add("is-approved");
    F.approvals.textContent = k + 1 + "/" + chips.length + " approved";
  }

  function reset(c) {
    Array.prototype.forEach.call(stages, function (s) {
      s.classList.remove("is-active", "is-done");
    });
    Array.prototype.forEach.call(chips, function (ch) {
      ch.classList.remove("is-approved");
    });
    F.id.textContent = c.id;
    F.title.textContent = c.title;
    F.industry.textContent = c.industry;
    F.std.textContent = c.std;
    F.raised.textContent = "Logged against baseline " + c.from;
    F.ci.textContent = c.ci + " configuration items affected";
    F.approvals.textContent = "0/" + chips.length + " approved";
    F.delta.textContent = c.from + " → " + c.to;
    setChars(F.version, c.from);
    measure();
    fill.style.transition = "none";
    fill.style.transform = "scaleY(0)";
    void fill.offsetHeight; // commit the jump before re-enabling the transition
    fill.style.transition = "";
  }

  function enter() {
    anime.animate([ticket, flow], {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 700,
      delay: anime.stagger(90),
      ease: "outExpo"
    });
  }

  function exit() {
    anime.animate([ticket, flow], {
      opacity: [1, 0],
      translateY: [0, -8],
      duration: 450,
      delay: anime.stagger(60),
      ease: "inQuad"
    });
  }

  // [time in ms, action(cycle, cycleIndex)]
  var STEPS = [
    [0, function (c, n) {
      reset(c);
      enter();
      if (n > 0) {
        roll(industry, c.industry);
        roll(word, "Change");
      }
      setStage(0, "active");
      status("Raised");
    }],
    [900, function () { setStage(0, "done"); progress(1); }],
    [1300, function () { setStage(1, "active"); status("Assessing"); }],
    [2300, function () { setStage(1, "done"); progress(2); }],
    [2600, function () { setStage(2, "active"); status("In review"); }],
    [3050, function () { approve(0); }],
    [3450, function () { approve(1); }],
    [3850, function () { approve(2); }],
    [4250, function () { setStage(2, "done"); status("Approved"); progress(3); }],
    [4500, function (c) { setStage(3, "active"); roll(F.version, c.to); roll(word, "Baseline"); }],
    [5500, function () { setStage(3, "done"); progress(4); }],
    [5900, function () { setStage(4, "done"); status("Released", "released"); }],
    [6100, function () { roll(word, "Release"); }],
    [8400, function () { exit(); }],
    [9000, null]
  ];

  // A small pausable clock drives the steps
  var t = 0;
  var last = 0;
  var step = 0;
  var cycle = 0;
  var raf = 0;
  var running = false;

  function tick(now) {
    if (last) t += Math.min(now - last, 100);
    last = now;
    while (step < STEPS.length && t >= STEPS[step][0]) {
      if (STEPS[step][1]) STEPS[step][1](CYCLES[cycle % CYCLES.length], cycle);
      step++;
    }
    if (step >= STEPS.length) {
      step = 0;
      t = 0;
      cycle++;
    }
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }

  var onScreen = true;
  function sync() {
    if (onScreen && !document.hidden) play();
    else pause();
  }

  document.addEventListener("visibilitychange", sync);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      sync();
    }).observe(document.getElementById("top"));
  }
  sync();
})();
