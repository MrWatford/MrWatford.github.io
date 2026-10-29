/* =========================================================
   STEM Project Center (science/stem-projects.html)
   1. Three big tabs: Projects, the design guide, and printable sheets.
   2. Project cards with search and filters (they all work together).
   3. Full project details in a pop-up window.
   4. Printing one project, the design guide, or the sheets.
   The projects themselves live in js/stem-projects-data.js.
   Styles reuse the Science Project Center's pc-/pd- classes.
   Nothing here saves or sends any student information.
   ========================================================= */

(function () {
  const LEVELS = { Easy: "★☆☆", Medium: "★★☆", Hard: "★★★" };

  // Turns text into safe HTML (so a "<" in a project never breaks the page)
  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function themeOf(project) { return STEM_CATEGORIES[project.themes[0]]; }
  function levelLabel(level) {
    return '<span class="level-label ' + level.toLowerCase() + '"><span class="stars" aria-hidden="true">' +
      LEVELS[level] + "</span> " + level + "</span>";
  }
  function adultBadge(p) {
    return p.adult ? '<span class="st-adult"><span aria-hidden="true">🧑‍🏫</span> Adult help</span>' : "";
  }

  /* ---------- 1. Tabs ---------- */
  const tabs = Array.from(document.querySelectorAll(".pc-tab"));
  const panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute("aria-controls")); });

  function showTab(id, moveFocus) {
    tabs.forEach(function (tab, i) {
      const on = panels[i].id === id;
      tab.setAttribute("aria-selected", on);
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on && moveFocus) tab.focus();
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      showTab(panels[i].id);
      history.replaceState(null, "", "#" + panels[i].id);
    });
    // Left/right arrow keys move between tabs
    tab.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      let next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : tabs.length - 1;
      next = (next + tabs.length) % tabs.length;
      showTab(panels[next].id, true);
      history.replaceState(null, "", "#" + panels[next].id);
    });
  });

  /* ---------- 2. Project cards, search, and filters ---------- */
  const grid = document.getElementById("pc-grid");
  const search = document.getElementById("pc-search");
  const categorySelect = document.getElementById("pc-theme");
  const count = document.getElementById("pc-count");
  const empty = document.getElementById("pc-empty");
  const form = document.getElementById("pc-filters");

  // Category menu: only categories that some project uses, with how many projects each has
  Object.keys(STEM_CATEGORIES).forEach(function (key) {
    const n = STEM_PROJECTS.filter(function (p) { return p.themes.indexOf(key) !== -1; }).length;
    if (!n) return;
    const option = document.createElement("option");
    option.value = key;
    option.textContent = STEM_CATEGORIES[key].icon + " " + STEM_CATEGORIES[key].label + " (" + n + ")";
    categorySelect.appendChild(option);
  });

  // Everything the search box looks through: title, materials, theme, and keywords
  STEM_PROJECTS.forEach(function (p) {
    p.searchText = [
      p.title, p.category, p.challenge, p.difficulty, p.supplies, p.format,
      p.keywords.join(" "),
      p.materials.join(" "),
      p.themes.map(function (t) { return STEM_CATEGORIES[t].label; }).join(" ")
    ].join(" ").toLowerCase();
  });

  grid.innerHTML = STEM_PROJECTS.map(function (p, i) {
    const theme = themeOf(p);
    return (
      '<article class="pc-card st-card ' + p.difficulty.toLowerCase() + '" data-id="' + esc(p.id) + '" aria-labelledby="card-' + esc(p.id) + '">' +
        '<div class="pc-card-top">' +
          '<span class="pc-card-icon" aria-hidden="true">' + theme.icon + "</span>" +
          '<span class="st-card-badges">' + levelLabel(p.difficulty) + adultBadge(p) + "</span>" +
        "</div>" +
        '<p class="st-num">Project ' + (i + 1) + "</p>" +
        '<h3 id="card-' + esc(p.id) + '">' + esc(p.title) + "</h3>" +
        '<p class="pc-cat"><span class="sr-only">Category: </span>' + esc(p.category) + "</p>" +
        '<p class="pc-summary"><strong>Challenge:</strong> ' + esc(p.challenge) + "</p>" +
        '<dl class="pc-meta">' +
          '<div><dt><span aria-hidden="true">⏱️</span> Building &amp; testing</dt><dd>' + esc(p.time.active) + "</dd></div>" +
          '<div><dt><span aria-hidden="true">⏳</span> Drying / waiting</dt><dd>' + esc(p.time.waiting) + "</dd></div>" +
          '<div><dt><span aria-hidden="true">🧰</span> Main materials</dt><dd>' + esc(p.supplies) + "</dd></div>" +
          '<div><dt><span aria-hidden="true">👥</span> Format</dt><dd>' + esc(p.format) + "</dd></div>" +
        "</dl>" +
        '<button type="button" class="btn pc-view" data-id="' + esc(p.id) + '" aria-haspopup="dialog">View Project<span class="sr-only">: ' + esc(p.title) + "</span></button>" +
      "</article>"
    );
  }).join("");

  const cards = Array.from(grid.querySelectorAll(".pc-card"));

  function currentLevel() { return form.querySelector('input[name="level"]:checked').value; }

  function applyFilters() {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const level = currentLevel();
    const category = categorySelect.value;
    let shown = 0;
    cards.forEach(function (card, i) {
      const p = STEM_PROJECTS[i];
      const match =
        (level === "All" || p.difficulty === level) &&
        (!category || p.themes.indexOf(category) !== -1) &&
        words.every(function (w) { return p.searchText.indexOf(w) !== -1; });
      card.hidden = !match;
      if (match) shown += 1;
    });
    count.textContent = shown === STEM_PROJECTS.length
      ? "Showing all " + STEM_PROJECTS.length + " STEM projects"
      : "Showing " + shown + " of " + STEM_PROJECTS.length + " STEM projects";
    empty.hidden = shown !== 0;
  }

  function resetFilters() {
    search.value = "";
    categorySelect.value = "";
    form.querySelector('input[name="level"][value="All"]').checked = true;
    applyFilters();
    search.focus();
  }

  search.addEventListener("input", applyFilters);
  categorySelect.addEventListener("change", applyFilters);
  form.querySelectorAll('input[name="level"]').forEach(function (r) { r.addEventListener("change", applyFilters); });
  document.getElementById("pc-reset").addEventListener("click", resetFilters);
  document.getElementById("pc-empty-reset").addEventListener("click", resetFilters);
  applyFilters();

  /* ---------- 3. Project details ---------- */
  const dialog = document.getElementById("project-dialog");
  const content = document.getElementById("pd-content");
  let openProject = null;
  let opener = null;

  function list(items, tag, cls) {
    return "<" + (tag || "ul") + (cls ? ' class="' + cls + '"' : "") + ">" +
      items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</" + (tag || "ul") + ">";
  }
  function steps(items) {
    return '<ol class="steps">' + items.map(function (s) { return "<li><span>" + esc(s) + "</span></li>"; }).join("") + "</ol>";
  }
  function head(n, text) { return '<h3><span class="pd-num">' + n + "</span> " + text + "</h3>"; }

  function dataTable(t) {
    return (
      '<div class="pd-table-wrap"><table class="pd-table">' +
        "<caption>" + esc(t.title) + "</caption>" +
        "<thead><tr>" + t.cols.map(function (c) { return '<th scope="col">' + esc(c) + "</th>"; }).join("") + "</tr></thead>" +
        "<tbody>" + t.rows.map(function (r) {
          let row = '<tr><th scope="row">' + esc(r) + "</th>";
          for (let i = 1; i < t.cols.length; i++) row += "<td></td>";
          return row + "</tr>";
        }).join("") + "</tbody>" +
      "</table></div>"
    );
  }

  const AREAS = [
    ["science", "s", "S", "Science"],
    ["technology", "t", "T", "Technology"],
    ["engineering", "e", "E", "Engineering"],
    ["math", "m", "M", "Math"]
  ];

  // Builds the full write-up for one project (used on screen and when printing)
  function detailsHTML(p) {
    const theme = themeOf(p);
    return (
      '<header class="pd-head">' +
        '<p class="pd-kicker"><span aria-hidden="true">' + theme.icon + "</span> " + esc(p.category) + "</p>" +
        '<h2 id="pd-title">' + esc(p.title) + "</h2>" +
        '<div class="pd-tags">' + levelLabel(p.difficulty) + adultBadge(p) + '<span class="tag">' + esc(theme.label) + "</span></div>" +
        '<p class="st-challenge"><strong>Challenge:</strong> ' + esc(p.challenge) + "</p>" +
        '<ul class="st-quick">' +
          "<li><strong>⏱️ Building &amp; testing:</strong> " + esc(p.time.active) + "</li>" +
          "<li><strong>⏳ Drying / waiting:</strong> " + esc(p.time.waiting) + "</li>" +
          "<li><strong>👥 Format:</strong> " + esc(p.format) + "</li>" +
          (p.adult ? "<li><strong>🧑‍🏫 Adult help:</strong> " + esc(p.adult) + "</li>" : "") +
        "</ul>" +
      "</header>" +

      '<section class="pd-question">' + head(1, "The problem") + "<p>" + esc(p.problem) + "</p></section>" +

      "<section>" + head(2, "Your mission") + "<p>" + esc(p.mission) + "</p></section>" +

      '<div class="pd-two">' +
        "<section>" + head(3, "Success criteria") + list(p.criteria, "ul", "checklist") +
          '<p class="pd-small">Any target number is a <strong>suggested challenge goal</strong>, not a guaranteed result or an official grading requirement. Your teacher may set different goals.</p></section>' +
        "<section>" + head(4, "Constraints") + list(p.constraints) + "</section>" +
      "</div>" +

      "<section>" + head(5, "Materials") + list(p.materials) +
        (p.toolNote ? '<p class="pd-small"><strong>Special tool?</strong> ' + esc(p.toolNote) + "</p>" : "") + "</section>" +

      '<section class="st-connect">' + head(6, "How STEM connects") +
        '<div class="st-connect-grid">' +
          AREAS.map(function (a) {
            return '<div class="st-area ' + a[1] + '"><span class="st-letter" aria-hidden="true">' + a[2] + "</span><div><strong>" + a[3] + "</strong><p>" + esc(p.stem[a[0]]) + "</p></div></div>";
          }).join("") +
        "</div>" +
      "</section>" +

      "<section>" + head(7, "Plan first") + list(p.plan) +
        '<p class="pd-small">Sketch at least two ideas on the <a href="#sheets">design-sketch page</a> before you build.</p></section>' +

      "<section>" + head(8, "Starter build") +
        '<p class="pd-small">This is one workable starting design. You decide how to change and improve it.</p>' + steps(p.build) + "</section>" +

      "<section>" + head(9, "Testing procedure") + steps(p.testing) + "</section>" +

      '<section class="pd-data">' + head(10, "Data table") +
        '<p class="pd-small">Fill in the blank boxes as you test. Always include units.</p>' +
        p.tables.map(dataTable).join("") +
      "</section>" +

      '<section class="st-math">' + head(11, "Math connection") +
        "<p>" + esc(p.math.intro) + "</p>" +
        list(p.math.steps, "ol") +
        (p.math.frame ? '<p class="m-frame"><span class="m-frame-label">Use your numbers</span>' + esc(p.math.frame) + "</p>" : "") +
      "</section>" +

      "<section>" + head(12, "Improve it") + "<p>Choose one change to investigate. Try to change one main feature at a time.</p>" + list(p.improve) + "</section>" +

      "<section>" + head(13, "Retest") + "<p>" + esc(p.retest) + "</p></section>" +

      "<section>" + head(14, "Reflection questions") + list(p.reflection, "ol") + "</section>" +

      '<section class="pd-extension">' + head(15, "Optional advanced extension") + "<p>" + esc(p.extension) + "</p></section>" +

      '<section class="pd-safety">' + head(16, "Safety") + list(p.safety) +
        '<p class="pd-small">Get teacher approval before you begin, and follow the STEM Project Safety rules for every project.</p></section>' +

      (p.note ? '<section class="pd-note"><h3>💡 Good to know</h3><p>' + esc(p.note) + "</p></section>" : "")
    );
  }

  function openDetails(id, trigger) {
    const p = STEM_PROJECTS.find(function (x) { return x.id === id; });
    if (!p) return;
    openProject = p;
    opener = trigger || null;
    content.innerHTML = detailsHTML(p);
    if (!dialog.open) dialog.showModal();
    content.scrollTop = 0;
    dialog.scrollTop = 0;
    document.body.classList.add("dialog-open");
    history.replaceState(null, "", "#project-" + p.id);
    document.getElementById("pd-close").focus();
  }

  dialog.addEventListener("close", function () {
    document.body.classList.remove("dialog-open");
    if (location.hash.indexOf("#project-") === 0) history.replaceState(null, "", "#projects");
    // Put keyboard focus back on the button that opened it
    const back = opener || grid.querySelector('.pc-view[data-id="' + (openProject && openProject.id) + '"]');
    if (back && !back.closest("[hidden]")) back.focus();
    openProject = null;
  });
  document.getElementById("pd-close").addEventListener("click", function () { dialog.close(); });
  // Clicking the dark area outside the window closes it
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  // The "design-sketch page" link inside a project jumps to the Sheets tab
  content.addEventListener("click", function (e) {
    const link = e.target.closest('a[href="#sheets"]');
    if (!link) return;
    e.preventDefault();
    opener = null;
    dialog.close();
    showTab("sheets");
    history.replaceState(null, "", "#sheets");
    document.getElementById("sheet-sketch").scrollIntoView();
  });

  grid.addEventListener("click", function (e) {
    const btn = e.target.closest(".pc-view");
    if (btn) openDetails(btn.dataset.id, btn);
  });

  /* ---------- 4. Printing ---------- */
  const printArea = document.getElementById("print-area");

  function printOnly(html) {
    printArea.innerHTML =
      '<p class="print-site">STEM Project Center • Mr. Watford</p>' +
      '<p class="print-name">Name: ______________________________ &nbsp; Date: ______________</p>' +
      html;
    document.body.classList.add("printing");
    window.print();
  }
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("printing");
    printArea.innerHTML = "";
  });

  function cleanCopy(id) {
    const copy = document.getElementById(id).cloneNode(true);
    copy.removeAttribute("id");
    copy.querySelectorAll("[id]").forEach(function (el) { el.removeAttribute("id"); });
    copy.querySelectorAll(".st-print-sheet").forEach(function (el) { el.remove(); });
    return copy.outerHTML;
  }

  document.getElementById("pd-print").addEventListener("click", function () {
    if (openProject) printOnly('<article class="print-project">' + detailsHTML(openProject).replace('id="pd-title"', "") + "</article>");
  });

  document.getElementById("print-guide").addEventListener("click", function () {
    printOnly('<h1 class="print-title">How to Complete a STEM Challenge</h1>' + cleanCopy("design-guide") + cleanCopy("safety"));
  });

  document.querySelectorAll(".st-print-sheet").forEach(function (btn) {
    btn.addEventListener("click", function () {
      printOnly('<div class="st-print-sheets">' + cleanCopy(btn.dataset.sheet) + "</div>");
    });
  });

  document.getElementById("print-all-sheets").addEventListener("click", function () {
    const all = Array.from(document.querySelectorAll(".st-sheet")).map(function (s) { return cleanCopy(s.id); }).join("");
    printOnly('<div class="st-print-sheets all">' + all + "</div>");
  });

  /* ---------- Start: open the tab or project named in the web address ---------- */
  function fromAddress() {
    const hash = location.hash.slice(1);
    if (hash.indexOf("project-") === 0) {
      showTab("projects");
      openDetails(hash.slice(8));
    } else if (hash === "guide" || hash === "sheets") {
      showTab(hash);
    } else {
      showTab("projects");
    }
  }
  fromAddress();
  window.addEventListener("hashchange", fromAddress);
})();
