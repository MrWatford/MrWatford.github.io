// Turbo League — on-screen touch controls (phones, tablets, touchscreen Chromebooks).
// Left thumb: a joystick (up/down = drive forward/back and tilt in the air, left/right = steer).
// Right thumb: JUMP, BOOST and SLIDE buttons. Small buttons at the top: pause and ball cam.
// They appear on their own the first time the screen is touched, and hide again if a keyboard or mouse is used.
export function initTouch({ onPause, onBallCam }) {
  const root = document.createElement("div"); root.id = "touch"; root.hidden = true;
  root.innerHTML = `<div class="tStick"><div class="tKnob"></div></div>
    <button class="tBtn tJump" data-t="jump">JUMP</button><button class="tBtn tBoost" data-t="boost">BOOST</button><button class="tBtn tSlide" data-t="slide">SLIDE</button>
    <button class="tTop tPause" aria-label="Pause">❚❚</button><button class="tTop tCam" aria-label="Ball cam">CAM</button>`;
  document.body.appendChild(root);
  const stick = root.querySelector(".tStick"), knob = root.querySelector(".tKnob");
  const st = { x: 0, y: 0, id: null, cx: 0, cy: 0, held: { jump: null, boost: null, slide: null } };
  let used = false, visibleWanted = false;
  const R = () => stick.getBoundingClientRect().width * 0.42;
  const setKnob = () => { knob.style.transform = `translate(${st.x * R()}px, ${-st.y * R()}px)`; };
  // joystick: the whole bottom-left area grabs the thumb, the stick centres where it lands
  const area = document.createElement("div"); area.className = "tArea"; root.prepend(area);
  const move = (e) => { const r = R(); let dx = (e.clientX - st.cx) / r, dy = -(e.clientY - st.cy) / r; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } st.x = dx; st.y = dy; setKnob(); };
  area.addEventListener("pointerdown", (e) => {
    if (st.id !== null) return; st.id = e.pointerId; try { area.setPointerCapture(e.pointerId); } catch (err) { /* not a real pointer */ }
    const b = area.getBoundingClientRect(); st.cx = Math.min(Math.max(e.clientX, b.left + 70), b.right - 70); st.cy = Math.min(Math.max(e.clientY, b.top + 70), b.bottom - 70);
    stick.style.left = `${st.cx - b.left}px`; stick.style.top = `${st.cy - b.top}px`; stick.classList.add("on"); move(e); e.preventDefault();
  });
  area.addEventListener("pointermove", (e) => { if (e.pointerId === st.id) move(e); });
  const end = (e) => { if (e.pointerId !== st.id) return; st.id = null; st.x = st.y = 0; setKnob(); stick.classList.remove("on"); };
  area.addEventListener("pointerup", end); area.addEventListener("pointercancel", end);
  for (const b of root.querySelectorAll(".tBtn")) {
    const k = b.dataset.t;
    b.addEventListener("pointerdown", (e) => { st.held[k] = e.pointerId; try { b.setPointerCapture(e.pointerId); } catch (err) { /* not a real pointer */ } b.classList.add("on"); e.preventDefault(); });
    const up = (e) => { if (st.held[k] === e.pointerId) { st.held[k] = null; b.classList.remove("on"); } };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
  }
  root.querySelector(".tPause").addEventListener("click", () => onPause());
  root.querySelector(".tCam").addEventListener("click", () => onBallCam());
  // show touch controls once someone touches the screen; hide them again for keyboard/mouse players
  addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") { used = true; sync(); } }, true);
  addEventListener("keydown", () => { if (used) { used = false; sync(); } });
  function sync() { root.hidden = !(used && visibleWanted); document.body.classList.toggle("touchUI", !root.hidden); }
  return {
    get active() { return !root.hidden; },
    show(on) { visibleWanted = on; sync(); },
    read() { return { throttle: st.y > 0.25 ? 1 : st.y < -0.25 ? -1 : 0, steer: Math.abs(st.x) > 0.12 ? st.x : 0, pitch: st.y, jump: st.held.jump !== null, boost: st.held.boost !== null, slide: st.held.slide !== null, roll: 0 }; },
    _state: st,
  };
}
