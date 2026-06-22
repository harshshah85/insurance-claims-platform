/* Life & DI Claims Platform — shared client behaviour
   - dark/light theme toggle (persisted)
   - auto "on this page" section list
   - auto prev/next pager from the reading order
   No per-page markup needed beyond including this script. */
(function () {
  "use strict";

  // Reading order (matches the index card order). [file, label]
  var ORDER = [
    ["Architecture-Diagrams-L1-L2.html",        "L1 & L2 Architecture Diagrams"],
    ["Event-Streaming-Architecture.html",       "Event Streaming Architecture"],
    ["Claims-Domain-Model.html",                "Claims Domain Model"],
    ["Claims-Decisioning-and-Fraud.html",       "Claims Decisioning & Fraud"],
    ["AI-Agentic-Decisioning.html",             "AI-Assisted & Agentic Decisioning"],
    ["Security-and-Regulatory-Compliance.html", "Security & Regulatory Compliance"],
    ["Correspondence-and-Money-Movement.html",  "Correspondence & Money Movement"],
    ["Observability-Monitoring.html",           "Observability & Monitoring"],
    ["FinOps-Cost-Model.html",                  "FinOps & Cost Architecture"],
    ["Claims-Onboarding-Workflow.html",         "Claims Onboarding Workflow"],
    ["Event-Driven-Decision-Records.html",      "Event-Driven Decision Records"]
  ];

  function themeToggle() {
    var btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle dark mode");
    var icon = function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.textContent = dark ? "☀︎" : "☾";   // sun / moon
      btn.title = dark ? "Switch to light" : "Switch to dark";
    };
    icon();
    btn.addEventListener("click", function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      var next = dark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      icon();
    });
    var bar = document.querySelector(".topbar .topbar-inner");
    if (bar) { bar.appendChild(btn); } else { btn.classList.add("floating"); document.body.appendChild(btn); }
  }

  function docNav() {
    var main = document.querySelector(".doc-main");
    if (!main) return;
    var here = (location.pathname.split("/").pop() || "").toLowerCase();

    // --- on this page ---
    var heads = Array.prototype.filter.call(main.querySelectorAll("h1"), function (h) {
      return !h.closest(".doc-cover");
    });
    if (heads.length >= 2) {
      var nav = document.createElement("nav");
      nav.className = "on-this-page";
      var ul = document.createElement("ul");
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "sec-" + (i + 1);
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent.trim();
        li.appendChild(a);
        ul.appendChild(li);
      });
      nav.innerHTML = '<span class="otp-label">On this page</span>';
      nav.appendChild(ul);
      var cover = main.querySelector(".doc-cover");
      var anchor = cover;
      if (cover && cover.nextElementSibling && cover.nextElementSibling.classList.contains("note")) {
        anchor = cover.nextElementSibling;   // place after the intro note
      }
      if (anchor) anchor.insertAdjacentElement("afterend", nav);
      else main.insertBefore(nav, main.firstChild);
    }

    // --- prev / next ---
    var idx = -1;
    for (var k = 0; k < ORDER.length; k++) { if (ORDER[k][0].toLowerCase() === here) { idx = k; break; } }
    if (idx === -1) return;
    var prev = idx > 0 ? ORDER[idx - 1] : null;
    var next = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
    var pager = document.createElement("nav");
    pager.className = "doc-pager";
    pager.innerHTML =
      (prev ? '<a class="pg prev" href="' + prev[0] + '"><span>← Previous</span><b>' + prev[1] + "</b></a>"
            : '<span class="pg placeholder"></span>') +
      (next ? '<a class="pg next" href="' + next[0] + '"><span>Next →</span><b>' + next[1] + "</b></a>"
            : '<span class="pg placeholder"></span>');
    main.insertAdjacentElement("afterend", pager);
  }

  document.addEventListener("DOMContentLoaded", function () {
    themeToggle();
    docNav();
  });
})();
