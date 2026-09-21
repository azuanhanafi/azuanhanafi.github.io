// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Build the email link at runtime so the address isn't sitting in the
// static HTML for scrapers/bots to harvest.
(function () {
  var link = document.getElementById("email-link");
  if (!link) return;
  var user = "azuanhanafi23";
  var domain = "gmail.com";
  link.href = "mailto:" + user + "@" + domain;
})();

// Theme toggle with localStorage persistence
(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = null;

  try {
    stored = localStorage.getItem("theme");
  } catch (e) {
    /* storage blocked — fall back to system theme */
  }

  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  }

  function current() {
    var attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  toggle.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.classList.add("theme-transition");
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      /* ignore */
    }
    window.setTimeout(function () {
      root.classList.remove("theme-transition");
    }, 460);
  });
})();

// Rotating hero title — cycles through true facets of the same role
(function () {
  var el = document.getElementById("rotating-title");
  if (!el) return;

  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMQ.matches) return;

  var variants = [
    "Configuration & Data Management Specialist",
    "Change Control & Baseline Management Specialist",
    "Configuration Status Accounting Specialist"
  ];
  var i = 0;

  setInterval(function () {
    el.classList.add("is-fading");
    setTimeout(function () {
      i = (i + 1) % variants.length;
      el.textContent = variants[i];
      el.classList.remove("is-fading");
    }, 300);
  }, 3200);
})();

// Expertise tabs — click a category to show its skill panel
(function () {
  var tabs = document.querySelectorAll(".expertise__tab");
  if (!tabs.length) return;
  var panels = document.querySelectorAll(".expertise__panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach(function (p) {
        p.classList.remove("is-active");
        p.hidden = true;
      });

      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = false;
        panel.classList.add("is-active");
      }
    });
  });
})();

// Scroll-spy — highlight the nav link for the section currently in view
(function () {
  if (!("IntersectionObserver" in window)) return;

  var navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  if (!navLinks.length) return;

  var sections = [];
  navLinks.forEach(function (link) {
    var section = document.getElementById(link.getAttribute("href").slice(1));
    if (section) sections.push({ link: link, section: section });
  });
  if (!sections.length) return;

  function setActive(link) {
    navLinks.forEach(function (l) {
      l.classList.remove("is-active");
      l.removeAttribute("aria-current");
    });
    link.classList.add("is-active");
    link.setAttribute("aria-current", "page");
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var match = sections.find(function (s) {
          return s.section === entry.target;
        });
        if (match) setActive(match.link);
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach(function (s) {
    observer.observe(s.section);
  });

  // Fallback: the last section can't always be scrolled far enough to
  // cross the observer's trigger zone, so force it active at page bottom.
  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        if (atBottom) setActive(sections[sections.length - 1].link);
        ticking = false;
      });
    },
    { passive: true }
  );
})();
