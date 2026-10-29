/* =========================================================
   Middle School Science Project Center (science/project-center.html)
   1. Two big tabs: Project Ideas and the Scientific Method.
   2. Project cards with search and filters.
   3. Full project details in a pop-up window.
   4. Printing one project, or the scientific-method guide.
   The projects themselves live in js/project-center-data.js.
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
  function themeOf(project) { return PROJECT_THEMES[project.themes[0]]; }
  function levelLabel(level) {
    return '<span class="level-label ' + level.toLowerCase() + '"><span class="stars" aria-hidden="true">' +
      LEVELS[level] + "</span> " + level + "</span>";
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
  const themeSelect = document.getElementById("pc-theme");
  const count = document.getElementById("pc-count");
  const empty = document.getElementById("pc-empty");
  const form = document.getElementById("pc-filters");

  // Theme menu: only themes that some project uses, with how many projects each has
  Object.keys(PROJECT_THEMES).forEach(function (key) {
    const n = PROJECTS.filter(function (p) { return p.themes.indexOf(key) !== -1; }).length;
    if (!n) return;
    const option = document.createElement("option");
    option.value = key;
    option.textContent = PROJECT_THEMES[key].icon + " " + PROJECT_THEMES[key].label + " (" + n + ")";
    themeSelect.appendChild(option);
  });

  // Everything the search box looks through for each project
  PROJECTS.forEach(function (p) {
    p.searchText = [
      p.title, p.category, p.summary, p.question, p.difficulty,
      p.keywords.join(" "),
      p.themes.map(function (t) { return PROJECT_THEMES[t].label; }).join(" ")
    ].join(" ").toLowerCase();
  });

  grid.innerHTML = PROJECTS.map(function (p) {
    const theme = themeOf(p);
    return (
      '<article class="pc-card ' + p.difficulty.toLowerCase() + '" data-id="' + esc(p.id) + '" aria-labelledby="card-' + esc(p.id) + '">' +
        '<div class="pc-card-top">' +
          '<span class="pc-card-icon" aria-hidden="true">' + theme.icon + "</span>" +
          levelLabel(p.difficulty) +
        "</div>" +
        '<h3 id="card-' + esc(p.id) + '">' + esc(p.title) + "</h3>" +
        '<p class="pc-cat"><span class="sr-only">Category: </span>' + esc(p.category) + "</p>" +
        '<p class="pc-summary">' + esc(p.summary) + "</p>" +
        '<dl class="pc-meta">' +
          '<div><dt><span aria-hidden="true">⏱️</span> Active work</dt><dd>' + esc(p.time.active) + "</dd></div>" +
          '<div><dt><span aria-hidden="true">⏳</span> Waiting / growing</dt><dd>' + esc(p.time.waiting) + "</dd></div>" +
          '<div><dt><span aria-hidden="true">🧰</span> Basic supplies</dt><dd>' + esc(p.supplies) + "</dd></div>" +
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
    const theme = themeSelect.value;
    let shown = 0;
    cards.forEach(function (card, i) {
      const p = PROJECTS[i];
      const match =
        (level === "All" || p.difficulty === level) &&
        (!theme || p.themes.indexOf(theme) !== -1) &&
        words.every(function (w) { return p.searchText.indexOf(w) !== -1; });
      card.hidden = !match;
      if (match) shown += 1;
    });
    count.textContent = shown === PROJECTS.length
      ? "Showing all " + PROJECTS.length + " projects"
      : "Showing " + shown + " of " + PROJECTS.length + " projects";
    empty.hidden = shown !== 0;
  }

  function resetFilters() {
    search.value = "";
    themeSelect.value = "";
    form.querySelector('input[name="level"][value="All"]').checked = true;
    applyFilters();
    search.focus();
  }

  search.addEventListener("input", applyFilters);
  themeSelect.addEventListener("change", applyFilters);
  form.querySelectorAll('input[name="level"]').forEach(function (r) { r.addEventListener("change", applyFilters); });
  document.getElementById("pc-reset").addEventListener("click", resetFilters);
  document.getElementById("pc-empty-reset").addEventListener("click", resetFilters);
  applyFilters();

  /* ---------- 3. Project details ---------- */
  const dialog = document.getElementById("project-dialog");
  const content = document.getElementById("pd-content");
  let openProject = null;
  let opener = null;

  function list(items, tag) {
    return "<" + (tag || "ul") + ">" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</" + (tag || "ul") + ">";
  }

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

  // Builds the full write-up for one project (used on screen and when printing)
  function detailsHTML(p) {
    const theme = themeOf(p);
    return (
      '<header class="pd-head">' +
        '<p class="pd-kicker"><span aria-hidden="true">' + theme.icon + "</span> " + esc(p.category) + "</p>" +
        '<h2 id="pd-title">' + esc(p.title) + "</h2>" +
        '<div class="pd-tags">' + levelLabel(p.difficulty) + '<span class="tag">' + esc(theme.label) + "</span></div>" +
      "</header>" +

      '<section class="pd-question"><h3><span class="pd-num">1</span> Project question</h3><p>' + esc(p.question) + "</p></section>" +

      '<section><h3><span class="pd-num">2</span> What you are investigating</h3><p>' + esc(p.investigating) + "</p></section>" +

      '<div class="pd-two">' +
        '<section><h3><span class="pd-num">3</span> Materials</h3>' + list(p.materials) + "</section>" +
        '<section><h3><span class="pd-num">4</span> Estimated time</h3>' +
          '<ul class="pd-time"><li><strong>Active work:</strong> ' + esc(p.time.active) + "</li>" +
          "<li><strong>Waiting or growing:</strong> " + esc(p.time.waiting) + "</li></ul>" +
          '<p class="pd-small">Leave extra time for planning, graphing, and writing your conclusion.</p>' +
        "</section>" +
      "</div>" +

      '<section class="pd-safety"><h3><span class="pd-num">5</span> Safety and adult help</h3>' + list(p.safety) +
        '<p class="pd-small">Get teacher approval before you begin, and follow the Science Project Safety rules for every project.</p></section>' +

      '<section class="pd-vars"><h3>Plan a fair test</h3>' +
        '<dl>' +
          '<div><dt><span class="pd-num">6</span> Independent variable <small>(what you change)</small></dt><dd>' + esc(p.independent) + "</dd></div>" +
          '<div><dt><span class="pd-num">7</span> Dependent variable <small>(what you measure)</small></dt><dd>' + esc(p.dependent) + "</dd></div>" +
          '<div><dt><span class="pd-num">8</span> Controlled variables <small>(what you keep the same)</small></dt><dd>' + list(p.controlled) + "</dd></div>" +
          '<div><dt><span class="pd-num">9</span> Comparison or control group</dt><dd>' + esc(p.comparison) + "</dd></div>" +
          '<div><dt>🔁 Trials and samples</dt><dd>' + esc(p.repeat) + "</dd></div>" +
        "</dl>" +
      "</section>" +

      '<section><h3><span class="pd-num">10</span> Procedure</h3><ol class="steps">' +
        p.procedure.map(function (s) { return "<li><span>" + esc(s) + "</span></li>"; }).join("") +
      "</ol></section>" +

      '<section class="pd-data"><h3><span class="pd-num">11</span> Data table</h3>' +
        '<p class="pd-small">Fill in the blank boxes as you work. Always include units.</p>' +
        p.tables.map(dataTable).join("") +
      "</section>" +

      '<section><h3><span class="pd-num">12</span> Suggested graph</h3><p>' + esc(p.graph) + "</p></section>" +

      '<section><h3><span class="pd-num">13</span> Questions to help you interpret your results</h3>' + list(p.questions, "ol") + "</section>" +

      '<section class="pd-extension"><h3><span class="pd-num">14</span> Optional extension</h3><p>' + esc(p.extension) + "</p></section>" +

      (p.note ? '<section class="pd-note"><h3>💡 Good to know</h3><p>' + esc(p.note) + "</p></section>" : "")
    );
  }

  function openDetails(id, trigger) {
    const p = PROJECTS.find(function (x) { return x.id === id; });
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
    history.replaceState(null, "", "#ideas");
    // Put keyboard focus back on the button that opened it
    const back = opener || grid.querySelector('.pc-view[data-id="' + (openProject && openProject.id) + '"]');
    if (back) back.focus();
    openProject = null;
  });
  document.getElementById("pd-close").addEventListener("click", function () { dialog.close(); });
  // Clicking the dark area outside the window closes it
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });

  grid.addEventListener("click", function (e) {
    const btn = e.target.closest(".pc-view");
    if (btn) openDetails(btn.dataset.id, btn);
  });

  /* ---------- 4. Printing ---------- */
  const printArea = document.getElementById("print-area");

  function printOnly(html) {
    printArea.innerHTML =
      '<p class="print-site">Middle School Science Project Center • Mr. Watford</p>' +
      '<p class="print-name">Name: ______________________________ &nbsp; Date: ______________</p>' +
      html;
    document.body.classList.add("printing");
    window.print();
  }
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("printing");
    printArea.innerHTML = "";
  });

  document.getElementById("pd-print").addEventListener("click", function () {
    if (openProject) printOnly('<article class="print-project">' + detailsHTML(openProject).replace('id="pd-title"', "") + "</article>");
  });

  document.getElementById("print-guide").addEventListener("click", function () {
    const guide = document.getElementById("method-guide").cloneNode(true);
    const safety = document.getElementById("safety").cloneNode(true);
    guide.removeAttribute("id");
    safety.removeAttribute("id");
    printOnly('<h1 class="print-title">The Scientific Method: A Step-by-Step Guide</h1>' + guide.outerHTML + safety.outerHTML);
  });

  /* ---------- Start: open the tab or project named in the web address ---------- */
  function fromAddress() {
    const hash = location.hash.slice(1);
    if (hash.indexOf("project-") === 0) {
      showTab("ideas");
      openDetails(hash.slice(8));
    } else if (hash === "method") {
      showTab("method");
    } else {
      showTab("ideas");
    }
  }
  fromAddress();
  window.addEventListener("hashchange", fromAddress);
})();
