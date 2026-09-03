// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

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

  function render() {
    toggle.firstElementChild.textContent = current() === "dark" ? "☀️" : "🌙";
  }

  toggle.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      /* ignore */
    }
    render();
  });

  render();
})();
