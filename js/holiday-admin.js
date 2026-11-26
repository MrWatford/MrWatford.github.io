/* =========================================================
   Holiday Theme Settings page (holidays.html)
   Reads and changes the settings used by js/holidays.js.
   "Save on this computer" keeps them in this browser only.
   "Download settings file" makes a new js/holiday-settings.js
   for everyone (it has to be uploaded to the website).
   ========================================================= */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function ready(fn) {
    if (window.HolidayThemes) return fn(window.HolidayThemes);
    setTimeout(() => ready(fn), 50);
  }

  ready(function (HT) {
    let form = HT.settings();      // what the page is editing (site file + this computer)
    const today = HT.chicagoToday(), thisYear = HT.ymd(today).y;

    /* ----- menus ----- */
    const all = HT.HOLIDAYS.concat(HT.SEASONS);
    $("ha-preview-id").innerHTML = '<option value="">(use the date instead)</option>' + all.map((h) => '<option value="' + h.id + '">' + esc(h.name) + "</option>").join("");
    $("ha-force").innerHTML = '<option value="">Automatic (recommended)</option><option value="none">Standard look: no decorations</option>' +
      '<optgroup label="Holidays">' + HT.HOLIDAYS.map((h) => '<option value="' + h.id + '">' + esc(h.name) + "</option>").join("") + "</optgroup>" +
      '<optgroup label="Seasons">' + HT.SEASONS.map((h) => '<option value="' + h.id + '">' + esc(h.name) + "</option>").join("") + "</optgroup>";
    let years = "";
    for (let y = thisYear - 1; y <= thisYear + 5; y++) years += '<option value="' + y + '"' + (y === thisYear ? " selected" : "") + ">" + y + "</option>";
    $("ha-year").innerHTML = years;
    $("ha-preview-date").value = HT.toISO(today);

    /* ----- status line at the top ----- */
    function status() {
      const r = HT.resolve();
      const h = HT.BY_ID[r.id];
      const why = { auto: "turned on automatically by the calendar", season: "a season (no holiday today)", forced: "chosen by hand in the settings", preview: "a preview in this tab only", standard: "" }[r.source];
      $("ha-status").innerHTML = "<strong>Today in Chicago:</strong> " + esc(HT.fmt(today, { weekday: "long", month: "long", day: "numeric", year: "numeric" })) +
        ". <strong>Showing:</strong> " + (h ? esc(h.name) + " (" + why + ")" : "the standard look, no decorations") + ".";
      const dev = HT.deviceSettings();
      $("ha-source").textContent = dev ? "This computer has its own saved settings, shown below. Students still get the settings file." : "These are the settings everyone gets right now (from the settings file).";
    }

    /* ----- fill the form ----- */
    function fill() {
      $("ha-auto").checked = form.auto;
      $("ha-seasonal").checked = form.seasonal;
      $("ha-animations").checked = form.animations;
      $("ha-force").value = form.force || "";
      rows();
      status();
    }
    function rows() {
      const y = +$("ha-year").value;
      $("ha-year-label").textContent = "in " + y;
      const cal = HT.calendar(y, form);
      $("ha-rows").innerHTML = cal.map((c) => {
        const a = form.adjust[c.id] || { before: 0, after: 0 };
        const one = (r) => r.start === r.end ? HT.fmt(r.start) : HT.fmt(r.start) + " – " + HT.fmt(r.end);
        const tag = c.kind === "major" ? ' <span class="ha-tag">big scene</span>' : c.kind === "solemn" ? ' <span class="ha-tag ha-tag-quiet">quiet</span>' : "";
        const now = (today >= c.range.start && today <= c.range.end && y === thisYear) ? ' <span class="ha-tag ha-tag-now">on now</span>' : "";
        return '<tr data-id="' + c.id + '"' + (c.disabled ? ' class="ha-off"' : "") + ">" +
          '<td><input type="checkbox" class="ha-on" aria-label="' + esc(c.name) + ' on"' + (c.disabled ? "" : " checked") + "></td>" +
          '<th scope="row">' + esc(c.name) + tag + now + "</th>" +
          "<td>" + esc(c.when) + "</td>" +
          '<td class="ha-dates">' + esc(one(c.range)) + "</td>" +
          '<td><input type="number" class="ha-num ha-before" min="-30" max="60" step="1" value="' + (a.before || 0) + '" aria-label="' + esc(c.name) + ': start this many days earlier"></td>' +
          '<td><input type="number" class="ha-num ha-after" min="-30" max="60" step="1" value="' + (a.after || 0) + '" aria-label="' + esc(c.name) + ': end this many days later"></td>' +
          '<td><button type="button" class="btn small ghost ha-prev">Preview</button></td></tr>';
      }).join("");
    }

    /* ----- read the form back ----- */
    function read() {
      const s = { auto: $("ha-auto").checked, seasonal: $("ha-seasonal").checked, animations: $("ha-animations").checked, disabled: [], adjust: {}, force: $("ha-force").value };
      document.querySelectorAll("#ha-rows tr").forEach((tr) => {
        const id = tr.getAttribute("data-id");
        if (!tr.querySelector(".ha-on").checked) s.disabled.push(id);
        const b = parseInt(tr.querySelector(".ha-before").value, 10) || 0, a = parseInt(tr.querySelector(".ha-after").value, 10) || 0;
        if (b || a) s.adjust[id] = { before: Math.max(-30, Math.min(60, b)), after: Math.max(-30, Math.min(60, a)) };
      });
      return HT.mergeSettings(JSON.parse(JSON.stringify(HT.DEFAULTS)), s);
    }
    function msg(t) { $("ha-msg").textContent = t; }

    // Live updates while editing (dates column refreshes)
    $("ha-rows").addEventListener("change", (e) => {
      form = read();
      const tr = e.target.closest("tr");
      if (tr) tr.classList.toggle("ha-off", !tr.querySelector(".ha-on").checked);
      rows();
      msg("Not saved yet. Pick “Save on this computer” or “Download settings file.”");
    });
    ["ha-auto", "ha-seasonal", "ha-animations", "ha-force"].forEach((id) => $(id).addEventListener("change", () => { form = read(); msg("Not saved yet. Pick “Save on this computer” or “Download settings file.”"); }));
    $("ha-year").addEventListener("change", rows);

    /* ----- previews ----- */
    $("ha-rows").addEventListener("click", (e) => {
      const b = e.target.closest(".ha-prev");
      if (!b) return;
      location.href = "index.html?holiday=" + b.closest("tr").getAttribute("data-id") + "#holiday-scene";
    });
    function previewTarget() {
      const id = $("ha-preview-id").value, date = $("ha-preview-date").value;
      return id ? "holiday=" + encodeURIComponent(id) : "holidayDate=" + encodeURIComponent(date);
    }
    $("ha-preview-home").addEventListener("click", () => { location.href = "index.html?" + previewTarget() + "#holiday-scene"; });
    $("ha-preview-here").addEventListener("click", () => {
      const id = $("ha-preview-id").value, date = $("ha-preview-date").value;
      HT.setPreview(id ? { id, date: "" } : { id: "", date });
      status();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    /* ----- saving ----- */
    $("ha-save-device").addEventListener("click", () => {
      form = read();
      HT.saveDevice(form);
      status();
      msg("Saved on this computer. Open any page to see it. (Students still get the settings file.)");
    });
    $("ha-clear-device").addEventListener("click", () => {
      HT.saveDevice(null);
      form = HT.settings();
      fill();
      msg("This computer is back to the settings everyone gets.");
    });
    $("ha-standard").addEventListener("click", () => {
      $("ha-force").value = "none";
      form = read();
      msg("Set to the standard look. Now save it on this computer or download the settings file.");
    });
    $("ha-reset").addEventListener("click", () => {
      form = JSON.parse(JSON.stringify(HT.DEFAULTS));
      fill();
      msg("Everything is back to automatic. Now save it on this computer or download the settings file.");
    });
    $("ha-download").addEventListener("click", () => {
      form = read();
      const text = "/* =========================================================\n" +
        "   Holiday theme settings for EVERYONE who visits the site.\n" +
        "   Made on the Holiday Theme Settings page (holidays.html) on " + HT.fmt(today, { month: "long", day: "numeric", year: "numeric" }) + ".\n" +
        "   Upload this file into the js folder to use it.\n" +
        "   auto = holidays switch by themselves; seasonal = season touches;\n" +
        "   animations = moving decorations; disabled = holidays to skip;\n" +
        "   adjust = { id: { before: days earlier, after: days later } };\n" +
        "   force = \"\" automatic, \"none\" standard look, or a holiday id.\n" +
        "   ========================================================= */\n" +
        "window.HOLIDAY_SETTINGS = " + JSON.stringify(form, null, 2) + ";\n";
      const url = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
      const a = document.createElement("a");
      a.href = url; a.download = "holiday-settings.js";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      msg("Downloaded holiday-settings.js. Send it to Claude to publish, or upload it into the js folder on GitHub.");
    });

    fill();
  });
})();
