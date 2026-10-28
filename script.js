(function () {
  "use strict";

  var doc = document;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function each(selector, fn, scope) {
    Array.prototype.forEach.call((scope || doc).querySelectorAll(selector), fn);
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

  // Tenure in the current role, counted in whole months like a CV ("Apr - Oct" = 7MO)
  each("[data-since]", function (el) {
    var parts = el.getAttribute("data-since").split("-");
    var now = new Date();
    var months = (now.getFullYear() - Number(parts[0])) * 12 + (now.getMonth() + 1 - Number(parts[1])) + 1;
    if (!(months > 0)) return;
    var y = Math.floor(months / 12);
    var m = months % 12;
    el.textContent = [y ? y + "Y" : "", m ? m + "MO" : ""].join(" ").trim();
  });

  // Last updated (from the page's Last-Modified header)
  each("[data-updated]", function (el) {
    var d = new Date(doc.lastModified);
    if (isNaN(d.getTime())) return;
    el.textContent = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    el.setAttribute("datetime", d.toISOString().slice(0, 10));
  });

  // Header: solid background once the page scrolls
  var header = doc.querySelector(".site-header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  var toggle = doc.querySelector(".nav__toggle");
  var toggleLabel = doc.querySelector(".nav__toggle-label");
  var menu = doc.getElementById("nav-menu");

  function setMenu(open, returnFocus) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggleLabel.textContent = open ? "Close" : "Menu";
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

  // Project dialogs
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

  if (!("IntersectionObserver" in window)) {
    each("[data-reveal]", function (el) {
      el.classList.add("is-in");
    });
    return;
  }

  // Reveal on scroll
  if (reduceMotion) {
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

  // Highlight the current item in a list of in-page links
  function spy(links, rootMargin, fallbackToLast) {
    var targets = links
      .map(function (a) {
        return doc.querySelector(a.getAttribute("href"));
      })
      .filter(Boolean);
    if (!targets.length) return;

    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: rootMargin, threshold: 0 }
    );
    targets.forEach(function (t) {
      observer.observe(t);
    });

    window.addEventListener(
      "scroll",
      function () {
        // Above the first target nothing is current
        if (targets[0].getBoundingClientRect().top > window.innerHeight * 0.5) setActive("");
        // The last section can't always reach the observer band
        if (fallbackToLast) {
          var atBottom = window.innerHeight + window.scrollY >= doc.documentElement.scrollHeight - 2;
          if (atBottom) setActive(targets[targets.length - 1].id);
        }
      },
      { passive: true }
    );
  }

  spy(Array.prototype.slice.call(doc.querySelectorAll(".nav__links a[href^='#']")), "-40% 0px -55% 0px", true);
  spy(Array.prototype.slice.call(doc.querySelectorAll(".xp__index a[href^='#']")), "-30% 0px -60% 0px", false);
})();
