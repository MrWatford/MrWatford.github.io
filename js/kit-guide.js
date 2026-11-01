/* Science Kit Guide: draws one panel per chapter from js/kit-guide-data.js,
   plus the "show only" filter buttons. */
(function () {
  const TYPES = {
    demo:    { label: "Class demo",    icon: "🎬" },
    group:   { label: "Group kit",     icon: "👥" },
    project: { label: "Class project", icon: "🛠️" }
  };

  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function findLink(kit) {
    if (kit.url) return { href: kit.url, label: "See the kit" };
    const words = kit.brand === "Any brand" ? kit.name : kit.brand + " " + kit.name;
    return { href: "https://www.amazon.com/s?k=" + encodeURIComponent(words), label: "Find it" };
  }

  function kitCard(id, note) {
    const kit = KITS[id];
    if (!kit) return "";
    const type = TYPES[kit.type];
    const link = findLink(kit);
    return (
      '<li class="kg-kit" data-type="' + kit.type + '">' +
        '<span class="kg-icon" aria-hidden="true">' + kit.icon + "</span>" +
        '<div class="kg-text">' +
          '<p class="kg-tags"><span class="kg-type kg-' + kit.type + '">' + type.icon + " " + type.label + "</span>" +
            (kit.adult ? '<span class="kg-adult">⚠️ Adult supervision</span>' : "") + "</p>" +
          "<h4>" + esc(kit.name) + "</h4>" +
          '<p class="kg-brand">' + esc(kit.brand) + "</p>" +
          "<p>" + esc(note) + "</p>" +
          '<a class="kg-find" href="' + esc(link.href) + '" target="_blank" rel="noopener">' + link.label +
            ' <span class="sr-only">(opens in a new tab)</span></a>' +
        "</div>" +
      "</li>"
    );
  }

  function chapterPanel(chapter) {
    return (
      '<section class="panel kg-chapter" id="g' + chapter.grade + "-ch" + chapter.ch + '">' +
        '<h3 class="panel-head"><span class="ic" aria-hidden="true">' + chapter.icon + "</span> Chapter " +
          chapter.ch + " • " + esc(chapter.title) + "</h3>" +
        '<div class="panel-body">' +
          '<ul class="kg-list">' + chapter.kits.map(function (k) { return kitCard(k[0], k[1]); }).join("") + "</ul>" +
          '<p class="kg-none" hidden>No kits of this kind for this chapter.</p>' +
          '<p class="kg-back"><a href="grade-' + chapter.grade + ".html#chapter-" + chapter.ch + '">← Back to Chapter ' +
            chapter.ch + "</a></p>" +
        "</div>" +
      "</section>"
    );
  }

  [6, 7, 8].forEach(function (grade) {
    const box = document.getElementById("kits-grade-" + grade);
    const jump = document.getElementById("jump-grade-" + grade);
    const chapters = KIT_CHAPTERS.filter(function (c) { return c.grade === grade; });
    box.innerHTML = chapters.map(chapterPanel).join("");
    jump.innerHTML = chapters.map(function (c) {
      return '<li><a href="#g' + grade + "-ch" + c.ch + '"><span class="badge">Ch ' + c.ch + "</span> " + esc(c.title) + "</a></li>";
    }).join("");
  });

  // "Show only" filter
  const buttons = document.querySelectorAll("[data-kit-filter]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const want = btn.dataset.kitFilter;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      document.querySelectorAll(".kg-chapter").forEach(function (panel) {
        let shown = 0;
        panel.querySelectorAll(".kg-kit").forEach(function (card) {
          const show = want === "all" || card.dataset.type === want;
          card.hidden = !show;
          if (show) shown++;
        });
        panel.querySelector(".kg-none").hidden = shown > 0;
      });
    });
  });

  // Opened from a chapter link (kit-guide.html#g6-ch1): scroll to it once the panels exist.
  // Grade buttons: show one grade at a time. The choice is remembered on this device.
  const tabs = document.querySelectorAll("[data-grade-tab]");
  function showGrade(grade) {
    tabs.forEach(function (tab) {
      const on = tab.dataset.gradeTab === String(grade);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      document.getElementById("grade-" + tab.dataset.gradeTab).hidden = !on;
    });
    try { localStorage.setItem("kit-guide-grade", grade); } catch (e) {}
  }
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      showGrade(tab.dataset.gradeTab);
      history.replaceState(null, "", "#grade-" + tab.dataset.gradeTab);
    });
  });

  // Pick the grade from the link (#g7-ch3 or #grade-7), else the last one chosen, else 6th.
  function gradeFromHash() {
    const m = location.hash.match(/^#(?:g|grade-)([678])/);
    return m ? m[1] : null;
  }
  let saved = null;
  try { saved = localStorage.getItem("kit-guide-grade"); } catch (e) {}
  showGrade(gradeFromHash() || (/^[678]$/.test(saved) ? saved : "6"));

  function jumpToHash() {
    const grade = gradeFromHash();
    if (grade) showGrade(grade);
    const target = /^#g\d-ch\d+$/.test(location.hash) && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant" });
  }
  jumpToHash();
  window.addEventListener("load", jumpToHash);
  window.addEventListener("hashchange", jumpToHash);
})();
