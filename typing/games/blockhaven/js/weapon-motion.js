// A quick strike followed by a longer, eased recovery. Damage remains immediate.
export function weaponSwing(progress, heavy = false, reducedMotion = false) {
  if (!(progress > 0)) return 0;
  const t = Math.min(1, progress);
  if (!heavy) return Math.sin(t * Math.PI);
  const smooth = x => x * x * (3 - 2 * x);
  const amount = t < 0.2 ? smooth(t / 0.2) : 1 - smooth((t - 0.2) / 0.8);
  return amount * (reducedMotion ? 0.25 : 1);
}
