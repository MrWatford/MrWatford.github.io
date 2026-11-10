// The reveal follows the actual first emergence, not wall-clock timers.
export function ancientIntroCue(actor) {
  const at = actor?.duneCycle?.awakenedAt;
  if (actor?.sp !== "leviathan_ancient" || actor.dead || actor.gone || actor.tame ||
      actor.duneCycle?.preview || !actor.emerged || !Number.isFinite(at) ||
      at < 0 || !Number.isFinite(actor.age) || !Number.isFinite(actor.hp) || actor.hp <= 0) return null;
  const elapsed = actor.age - at;
  if (elapsed < 0 || elapsed >= 3.8) return null;
  return { elapsed, opacity: Math.max(0, Math.min(1, elapsed / .35, (3.8 - elapsed) / .5)) };
}

export function createAncientIntroView(parent) {
  const doc = parent.ownerDocument, style = doc.createElement("style"), root = doc.createElement("div");
  style.textContent = `
    .ancient-intro { position:absolute; left:50%; top:62%; transform:translateX(-50%);
      box-sizing:border-box; width:min(620px,calc(100% - 24px)); padding:13px 12px 15px;
      text-align:center; pointer-events:none; color:#e6f7ff;
      background:linear-gradient(90deg,transparent,rgba(8,20,31,.88) 20%,rgba(8,20,31,.88) 80%,transparent);
      text-shadow:0 2px 2px #000; border-block:1px solid rgba(146,208,234,.48); }
    .ancient-intro[hidden] { display:none; }
    .ancient-intro small { display:block; color:#a7d8ed; font:400 8px/1.6 var(--pixel,monospace); letter-spacing:2px; }
    .ancient-intro strong { display:block; margin:7px 0 4px; font:600 clamp(19px,3.4vw,32px)/1.15 var(--display,serif); }
    .ancient-intro span { display:block; color:#c8e0ec; font:700 clamp(12px,1.8vw,15px)/1.4 var(--body,system-ui); }
    @media(max-height:440px) { .ancient-intro { top:50%; padding:6px 10px; } .ancient-intro strong { margin:3px 0; font-size:19px; } }
  `;
  root.className = "ancient-intro"; root.hidden = true;
  const overline = doc.createElement("small"), title = doc.createElement("strong"), subtitle = doc.createElement("span");
  overline.textContent = "THRONE OF THE BURIED KING";
  title.textContent = "THE ANCIENT LEVIATHAN";
  subtitle.textContent = "The Buried King Has Awakened";
  root.append(overline, title, subtitle); parent.append(style, root);
  let disposed = false;
  return {
    element: root,
    update(cue, reducedMotion = false) {
      if (disposed) return;
      root.hidden = !cue;
      if (cue) root.style.opacity = reducedMotion ? "1" : String(cue.opacity);
    },
    dispose() { if (disposed) return; disposed = true; root.remove(); style.remove(); }
  };
}
