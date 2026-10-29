(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;

  function each(selector, fn, scope) {
    Array.prototype.forEach.call((scope || doc).querySelectorAll(selector), fn);
  }

  function all(selector, scope) {
    return Array.prototype.slice.call((scope || doc).querySelectorAll(selector));
  }

  // Footer year
  each("[data-year]", function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Email links - address is assembled at runtime to deter simple scrapers
  var user = "azuanhanafi23";
  var domain = "gmail.com";
  each("[data-email]", function (a) {
    a.href = "mailto:" + user + "@" + domain;
  });

  // Kuala Lumpur clock
  var clocks = doc.querySelectorAll("[data-clock]");
  if (clocks.length && window.Intl) {
    var clockFmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    var tickClock = function () {
      var now = clockFmt.format(new Date());
      Array.prototype.forEach.call(clocks, function (c) {
        c.textContent = now;
      });
    };
    tickClock();
    setInterval(tickClock, 15000);
  }

  // Last updated (from the page's Last-Modified header)
  each("[data-updated]", function (el) {
    var d = new Date(doc.lastModified);
    if (isNaN(d.getTime())) return;
    el.textContent = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    el.setAttribute("datetime", d.toISOString().slice(0, 10));
  });

  // ---------- Header: hide on the way down, show on the way up ----------
  var header = doc.querySelector(".site-header");
  var lastY = window.scrollY;
  function onHeaderScroll() {
    var y = window.scrollY;
    var hide = y > 400 && y > lastY + 4 && !header.classList.contains("is-open");
    if (hide) header.classList.add("is-hidden");
    else if (y < lastY - 4 || y <= 400) header.classList.remove("is-hidden");
    lastY = y;
  }
  window.addEventListener("scroll", onHeaderScroll, { passive: true });
  header.addEventListener("focusin", function () {
    header.classList.remove("is-hidden");
  });

  // ---------- Mobile menu ----------
  var toggle = doc.querySelector(".nav__toggle");
  var menu = doc.getElementById("nav-menu");

  function setMenu(open, returnFocus) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (!open && returnFocus) toggle.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) setMenu(false, true);
    });
    doc.addEventListener("click", function (e) {
      if (header.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  // ---------- Nav: a white pill slides under the hovered or current link ----------
  var navLinks = all(".nav__links a");
  var pill = doc.querySelector(".nav__pill");
  function movePill(a) {
    if (!pill) return;
    if (!a) {
      pill.classList.remove("is-on");
      return;
    }
    pill.style.width = a.offsetWidth + "px";
    pill.style.transform = "translateX(" + a.offsetLeft + "px)";
    pill.classList.add("is-on");
  }
  function currentLink() {
    return doc.querySelector(".nav__links a.is-active");
  }
  navLinks.forEach(function (a) {
    a.addEventListener("pointerenter", function () {
      movePill(a);
    });
    a.addEventListener("focus", function () {
      movePill(a);
    });
  });
  if (menu) {
    menu.addEventListener("pointerleave", function () {
      movePill(currentLink());
    });
  }

  // ---------- Experience tabs ----------
  var tabs = all(".xp__tab");
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = doc.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      selectTab(tab);
    });
    tab.addEventListener("keydown", function (e) {
      var k = e.key;
      var next = null;
      if (k === "ArrowDown" || k === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (k === "ArrowUp" || k === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === "Home") next = tabs[0];
      else if (k === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });

  // ---------- Capabilities accordion (one card open at a time) ----------
  var accItems = all(".acc__item");
  accItems.forEach(function (item) {
    var btn = item.querySelector(".acc__btn");
    btn.addEventListener("click", function () {
      if (item.classList.contains("is-open")) return;
      accItems.forEach(function (other) {
        var open = other === item;
        other.classList.toggle("is-open", open);
        var b = other.querySelector(".acc__btn");
        b.setAttribute("aria-expanded", String(open));
        doc.getElementById(b.getAttribute("aria-controls")).hidden = !open;
      });
    });
  });

  // ---------- Project dialogs ----------
  each("[data-open]", function (btn) {
    var dialog = doc.getElementById(btn.getAttribute("data-open"));
    if (!dialog || typeof dialog.showModal !== "function") return;
    btn.addEventListener("click", function () {
      dialog.showModal();
    });
  });
  each("dialog.modal", function (dialog) {
    // A click on the backdrop lands on the dialog element itself
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
    each("[data-close]", function (b) {
      b.addEventListener("click", function () {
        dialog.close();
      });
    }, dialog);
  });

  // ---------- Statement: words light up as the paragraph scrolls through ----------
  var statement = doc.querySelector("[data-words]");
  var words = [];
  if (statement) {
    var walker = doc.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(function (node) {
      var frag = doc.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(doc.createTextNode(" "));
        } else {
          var w = doc.createElement("span");
          w.className = "w";
          w.textContent = part;
          frag.appendChild(w);
          words.push(w);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  function lightWords() {
    if (!words.length) return;
    var r = statement.getBoundingClientRect();
    var vh = window.innerHeight;
    var start = vh * 0.85;
    var end = vh * 0.35;
    var p = Math.max(0, Math.min(1, (start - r.top) / (start - end + r.height * 0.6)));
    var lit = Math.round(p * words.length);
    words.forEach(function (w, i) {
      w.classList.toggle("is-lit", i < lit);
    });
  }

  // ---------- Back to top ----------
  var toTop = doc.querySelector(".to-top");
  var ring = doc.querySelector(".to-top__fg");
  function onTopScroll() {
    if (!toTop) return;
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    ring.style.strokeDashoffset = String(138.2 * (1 - p));
    toTop.classList.toggle("is-shown", window.scrollY > 500);
  }
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
      var main = doc.getElementById("main");
      if (main) main.focus({ preventScroll: true });
    });
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        lightWords();
        onTopScroll();
        scrubSections();
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", function () {
    lightWords();
    scrubSections();
  });
  lightWords();
  onTopScroll();

  // ---------- Pointer spotlight on cards ----------
  var spotTargets = ".kit__card, .edu, .cert, .xp__stage, .proj:not(.proj--soon)";
  each(spotTargets, function (el) {
    el.classList.add("spot");
  });
  doc.addEventListener(
    "pointermove",
    function (e) {
      var el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    },
    { passive: true }
  );

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------- Cards tilt and drift toward the cursor ----------
  // [cards, inner layer that shifts the other way, max tilt Y, max tilt X]
  var TILT = [
    [".proj:not(.proj--soon)", ".proj__shot, .flow", 12, 10],
    [".kit__card", ".kit__icon", 9, 7]
  ];
  if (finePointer) {
    TILT.forEach(function (set) {
      each(set[0], function (card) {
        tilt(card, card.querySelector(set[1]), set[2], set[3]);
      });
    });
  }

  function tilt(card, inner, maxY, maxX) {
    var now = { rx: 0, ry: 0, x: 0, y: 0, lift: 0 };
    var goal = { rx: 0, ry: 0, x: 0, y: 0, lift: 0 };
    var raf = 0;
    card.classList.add("is-tilt");

    var step = function () {
      var moving = false;
      Object.keys(now).forEach(function (k) {
        now[k] += (goal[k] - now[k]) * 0.12;
        if (Math.abs(goal[k] - now[k]) > 0.01) moving = true;
      });
      card.style.transform =
        "perspective(1000px) translate3d(" + now.x.toFixed(2) + "px," + (now.y + now.lift).toFixed(2) + "px,0)" +
        " rotateX(" + now.rx.toFixed(2) + "deg) rotateY(" + now.ry.toFixed(2) + "deg)";
      // the inner layer drifts the other way for a little depth
      if (inner) inner.style.transform = "translate3d(" + (-now.ry * 1.2).toFixed(2) + "px," + (now.rx * 1.2).toFixed(2) + "px,0)";
      raf = moving ? requestAnimationFrame(step) : 0;
    };
    var kick = function () {
      if (!raf) raf = requestAnimationFrame(step);
    };

    card.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      goal.ry = px * maxY;
      goal.rx = -py * maxX;
      goal.x = px * 12;
      goal.y = py * 10;
      goal.lift = -6;
      kick();
    });
    card.addEventListener("pointerleave", function () {
      goal.rx = goal.ry = goal.x = goal.y = goal.lift = 0;
      kick();
    });
  }

  // ---------- Dark surfaces: green light follows the pointer ----------
  if (finePointer) {
    each("[data-glow]", function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--gx", e.clientX - r.left + "px");
        el.style.setProperty("--gy", e.clientY - r.top + "px");
        el.classList.add("is-lit");
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("is-lit");
      });
    });
  }

  // ---------- Contact ring: drifts toward the pointer, its dot turns to face it ----------
  var orb = doc.querySelector(".cta__orb");
  var orbDot = doc.querySelector(".cta__orb-dot");
  var ctaCard = doc.querySelector(".cta");
  if (orb && ctaCard && finePointer) {
    var oNow = { x: 0, y: 0, a: 145 };
    var oGoal = { x: 0, y: 0, a: 145 };
    var oRaf = 0;
    var orbStep = function () {
      oNow.x += (oGoal.x - oNow.x) * 0.08;
      oNow.y += (oGoal.y - oNow.y) * 0.08;
      // turn the short way round the ring
      var da = ((oGoal.a - oNow.a + 540) % 360) - 180;
      oNow.a += da * 0.1;
      orb.style.transform = "translate3d(" + oNow.x.toFixed(2) + "px," + oNow.y.toFixed(2) + "px,0)";
      orbDot.style.setProperty("--a", oNow.a.toFixed(2) + "deg");
      var busy = Math.abs(oGoal.x - oNow.x) > 0.05 || Math.abs(oGoal.y - oNow.y) > 0.05 || Math.abs(da) > 0.05;
      oRaf = busy ? requestAnimationFrame(orbStep) : 0;
    };
    ctaCard.addEventListener("pointermove", function (e) {
      var r = orb.getBoundingClientRect();
      var cx = r.left + r.width / 2 - oNow.x;
      var cy = r.top + r.height / 2 - oNow.y;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      oGoal.x = Math.max(-48, Math.min(48, dx * 0.06));
      oGoal.y = Math.max(-48, Math.min(48, dy * 0.06));
      oGoal.a = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (!oRaf) oRaf = requestAnimationFrame(orbStep);
    });
    ctaCard.addEventListener("pointerleave", function () {
      oGoal.x = oGoal.y = 0;
      if (!oRaf) oRaf = requestAnimationFrame(orbStep);
    });
  }

  // ---------- Scroll-driven: band widens, contact card scales in, steps line fills ----------
  var band = doc.querySelector(".band");
  var scaleIn = doc.querySelector("[data-scale-in]");
  var stepsBox = doc.querySelector(".steps");
  var stepsFill = doc.querySelector(".steps__line i");
  var stepItems = all(".step");
  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }
  function scrubSections() {
    var vh = window.innerHeight;
    if (band) {
      var p = clamp01((vh - band.getBoundingClientRect().top) / (vh * 0.7));
      var side = (1 - p) * (window.innerWidth > 760 ? 5 : 3);
      band.style.clipPath = "inset(0% " + side.toFixed(2) + "% round " + (56 * (1 - p)).toFixed(1) + "px)";
    }
    if (scaleIn) {
      var q = clamp01((vh - scaleIn.getBoundingClientRect().top) / (vh * 0.65));
      scaleIn.style.transform = "scale(" + (0.86 + 0.14 * q).toFixed(4) + ")";
      scaleIn.style.borderRadius = (80 - 44 * q).toFixed(1) + "px";
    }
    if (stepsFill) {
      var r = stepsBox.getBoundingClientRect();
      var f = clamp01((vh * 0.75 - r.top) / (r.height + vh * 0.2));
      stepsFill.style.transform = "scaleX(" + f.toFixed(3) + ")";
      stepItems.forEach(function (el, i) {
        el.classList.toggle("is-on", f >= i / Math.max(stepItems.length - 1, 1) - 0.001);
      });
    }
  }
  scrubSections();

  // ---------- Custom cursor (mouse and pen only) ----------
  if (finePointer) {
    var cursor = doc.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    var cursorLabel = doc.createElement("span");
    cursor.appendChild(cursorLabel);
    var cursorDot = doc.createElement("div");
    cursorDot.className = "cursor-dot";
    cursorDot.setAttribute("aria-hidden", "true");
    doc.body.appendChild(cursor);
    doc.body.appendChild(cursorDot);

    var trail = ["#3DB663", "#E5BA97", "#B07040", "#0A282D"].map(function (c, i) {
      var el = doc.createElement("div");
      var size = 7 - i;
      el.className = "trail";
      el.setAttribute("aria-hidden", "true");
      el.style.width = el.style.height = size + "px";
      el.style.margin = -size / 2 + "px 0 0 " + -size / 2 + "px";
      el.style.background = c;
      doc.body.appendChild(el);
      return { el: el, x: 0, y: 0, k: 0.3 - i * 0.05 };
    });

    var target = { x: 0, y: 0 };
    var ringPos = { x: 0, y: 0 };
    var dotPos = { x: 0, y: 0 };
    var live = false;
    var loop = 0;

    var place = function (el, x, y) {
      el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    };

    var step = function () {
      ringPos.x += (target.x - ringPos.x) * 0.18;
      ringPos.y += (target.y - ringPos.y) * 0.18;
      dotPos.x += (target.x - dotPos.x) * 0.6;
      dotPos.y += (target.y - dotPos.y) * 0.6;
      place(cursor, ringPos.x, ringPos.y);
      place(cursorDot, dotPos.x, dotPos.y);
      var settled = Math.abs(target.x - ringPos.x) < 0.1 && Math.abs(target.y - ringPos.y) < 0.1;
      trail.forEach(function (t) {
        t.x += (target.x - t.x) * t.k;
        t.y += (target.y - t.y) * t.k;
        place(t.el, t.x, t.y);
        if (Math.abs(target.x - t.x) > 0.1 || Math.abs(target.y - t.y) > 0.1) settled = false;
      });
      loop = settled ? 0 : requestAnimationFrame(step);
    };

    var setLive = function (on) {
      live = on;
      [cursor, cursorDot].concat(trail.map(function (t) { return t.el; })).forEach(function (el) {
        el.classList.toggle("is-live", on);
      });
    };

    window.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType === "touch") return;
        target.x = e.clientX;
        target.y = e.clientY;
        if (!live) {
          ringPos.x = dotPos.x = target.x;
          ringPos.y = dotPos.y = target.y;
          trail.forEach(function (t) {
            t.x = target.x;
            t.y = target.y;
          });
          setLive(true);
        }
        if (!loop) loop = requestAnimationFrame(step);
      },
      { passive: true }
    );
    root.addEventListener("pointerleave", function () {
      setLive(false);
    });

    doc.addEventListener("pointerover", function (e) {
      var t = e.target;
      if (!t.closest) return;
      var hit = t.closest("[data-cursor], a, button, [role='tab'], summary, label");
      var dark = !!t.closest(".band, .cta, .footer");
      cursor.classList.toggle("on-dark", dark);
      cursorDot.classList.toggle("on-dark", dark);
      if (!hit) {
        cursor.classList.remove("is-hover", "has-label");
        return;
      }
      var text = hit.getAttribute("data-cursor");
      if (text) {
        cursorLabel.textContent = text;
        cursor.classList.add("has-label");
        cursor.classList.remove("is-hover");
      } else {
        cursor.classList.add("is-hover");
        cursor.classList.remove("has-label");
      }
    });
  }

  // ---------- Text: titles rise line by line, leads follow, eyebrows scramble ----------
  var anime = window.anime;
  if (anime && anime.splitText && anime.scrambleText && "IntersectionObserver" in window) {
    var textObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          textObserver.unobserve(entry.target);
          if (entry.target.__reveal) entry.target.__reveal();
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );

    var TITLE = {
      lines: { wrap: "clip", class: "ln" },
      hidden: { translateY: "110%" },
      show: { translateY: ["110%", "0%"], duration: 1100, delay: anime.stagger(110), ease: "outExpo" }
    };
    var LEAD = {
      lines: { class: "ln" },
      hidden: { opacity: 0, translateY: "0.6em" },
      show: { opacity: [0, 1], translateY: ["0.6em", "0em"], duration: 900, delay: anime.stagger(80, { start: 200 }), ease: "outQuart" }
    };

    var splitReveal = function (el, preset) {
      var seen = false;
      var done = false;
      var splitter = anime.splitText(el, { lines: preset.lines });
      var play = function (lines) {
        done = true;
        anime.animate(lines, preset.show);
      };
      // Runs after every split, including re-splits when the width changes
      splitter.addEffect(function (self) {
        el.classList.add("is-split");
        if (done) return;
        if (seen) play(self.lines);
        else anime.utils.set(self.lines, preset.hidden);
      });
      el.__reveal = function () {
        seen = true;
        if (!done && splitter.ready && splitter.lines.length) play(splitter.lines);
      };
      textObserver.observe(el);
    };

    each(".hero__title, .section .title, .cta__title", function (el) {
      splitReveal(el, TITLE);
    });
    each(".hero__lede, .section__lead:not(.section__lead--note), .section__lead--note > span, .cta__lead", function (el) {
      splitReveal(el, LEAD);
    });

    each(".eyebrow", function (eyebrow) {
      if (eyebrow.closest("dialog")) return;
      var dots = eyebrow.querySelector(".eyebrow__dots");
      var label = eyebrow.textContent.trim();
      // Screen readers get the real label; the scramble runs on a visual copy
      Array.prototype.slice.call(eyebrow.childNodes).forEach(function (n) {
        if (n !== dots) eyebrow.removeChild(n);
      });
      var sr = doc.createElement("span");
      sr.className = "sr-only";
      sr.textContent = label;
      var shown = doc.createElement("span");
      shown.setAttribute("aria-hidden", "true");
      shown.textContent = label;
      eyebrow.appendChild(sr);
      eyebrow.appendChild(shown);
      eyebrow.__reveal = function () {
        anime.animate(shown, {
          textContent: anime.scrambleText({ chars: "A-Z0-9", revealRate: 45, settleDuration: 420, cursor: "_" })
        });
      };
      textObserver.observe(eyebrow);
    });

    // Footer headline: every word scrambles into place inside a box locked
    // to its final width, so the big lines never reflow mid-scramble
    var big = doc.querySelector(".footer__big");
    if (big) {
      var bigWords = [];
      var bigWalker = doc.createTreeWalker(big, NodeFilter.SHOW_TEXT);
      var bigNodes = [];
      while (bigWalker.nextNode()) bigNodes.push(bigWalker.currentNode);
      bigNodes.forEach(function (node) {
        var frag = doc.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(doc.createTextNode(" "));
            return;
          }
          var w = doc.createElement("span");
          w.className = "sw";
          w.textContent = part;
          frag.appendChild(w);
          bigWords.push(w);
        });
        node.parentNode.replaceChild(frag, node);
      });

      var bigBusy = false;
      var lockWidths = function () {
        if (bigBusy) return;
        bigWords.forEach(function (w) {
          w.style.width = "";
        });
        bigWords.forEach(function (w) {
          w.style.width = w.getBoundingClientRect().width + "px";
        });
      };
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(lockWidths);
      else lockWidths();
      window.addEventListener("resize", lockWidths);

      var scrambleBig = function () {
        if (bigBusy) return;
        bigBusy = true;
        bigWords.forEach(function (w, i) {
          anime.animate(w, {
            textContent: anime.scrambleText({ chars: "a-z", delay: i * 90, revealRate: 28, settleDuration: 500 }),
            onComplete: i === bigWords.length - 1 ? function () { bigBusy = false; } : undefined
          });
        });
      };
      big.__reveal = scrambleBig;
      big.addEventListener("pointerenter", scrambleBig);
      textObserver.observe(big);
    }
  } else {
    each(".hero__title, .hero__lede", function (el) {
      el.classList.add("is-split");
    });
  }

  // ---------- Reveal on scroll ----------
  if (!("IntersectionObserver" in window)) {
    each("[data-reveal]", function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    each("[data-reveal]", function (el) {
      revealer.observe(el);
    });
  }

  // ---------- Scroll-spy for the nav ----------
  if ("IntersectionObserver" in window) {
    var spyTargets = navLinks
      .map(function (a) {
        return doc.querySelector(a.getAttribute("href"));
      })
      .filter(Boolean);

    var setActive = function (id) {
      navLinks.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      if (!menu || !menu.matches(":hover")) movePill(currentLink());
    };

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    spyTargets.forEach(function (t) {
      spy.observe(t);
    });

    window.addEventListener(
      "scroll",
      function () {
        // Back in the hero, nothing is current
        if (spyTargets[0] && spyTargets[0].getBoundingClientRect().top > window.innerHeight * 0.5) setActive("");
      },
      { passive: true }
    );
    window.addEventListener("resize", function () {
      movePill(currentLink());
    });
  }
})();
