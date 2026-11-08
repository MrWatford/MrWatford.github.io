import { mountedAttackRejection } from "./leviathan-mounted-combat.js";
import { planLeviathanBurrow, createBurrowJourney } from "./leviathan-burrow.js";

export const BURROW_COOLDOWN = 20;

export function beginMountedBurrow(args) {
  const { world, gen, mount, player, record, entities = [], now } = args;
  if (!mount || !["leviathan_dune", "leviathan_obsidian"].includes(mount.sp) || mount.burrowTravel) return { status: "unavailable" };
  const rejected = mountedAttackRejection({ ...args, record: record && { ...record, mountedReadyAt: record.burrowReadyAt } }, mount.sp);
  if (rejected) return rejected;
  const origin = { x: player.pos.x, y: Math.round(player.pos.y), z: player.pos.z };
  if (Math.abs(origin.y - player.pos.y) > 0.05 || Math.hypot(mount.pos.x - origin.x, mount.pos.y - origin.y, mount.pos.z - origin.z) > 0.1) return { status: "unavailable" };
  const plan = planLeviathanBurrow(world, gen, origin, args.yaw, mount, entities.filter(e => e !== mount));
  if (!plan) return { status: "blocked" };
  const journey = createBurrowJourney(world, gen, plan, mount);
  if (!journey) return { status: "blocked" };
  const yaw = plan.yaw;
  record.burrowReadyAt = now + BURROW_COOLDOWN;
  const session = {
    owner: mount, journey, plan, stopped: false, cancelElapsed: null, cancelDepth: 0,
    get visualState() { return { position: journey.position, elapsed: journey.elapsed + (this.cancelElapsed || 0), depth: mount.burrowDepth || 0,
      stage: this.cancelElapsed !== null && !this.stopped ? "emerging" : journey.stage }; },
    get savePosition() { return journey.savePosition; },
    get recoveryRequired() { return !journey.savePosition; },
    requestCancel(reason = "manual", depth = mount.burrowDepth || 0) {
      if (this.stopped || this.cancelElapsed !== null) return;
      this.cancelDepth = depth; this.cancelElapsed = 0;
      journey.cancel(reason); mount.burrowDepth = depth;
      mount.vel.x = mount.vel.y = mount.vel.z = 0;
    },
    stop(reason = "canceled") {
      if (this.stopped) return;
      this.stopped = true; journey.cancel(reason);
      if (mount.burrowTravel === this) { mount.burrowTravel = null; mount.burrowDepth = 0; mount.vel.x = mount.vel.y = mount.vel.z = 0; }
    },
    update(dt, context) {
      if (this.stopped) return false;
      if (this.cancelElapsed !== null) {
        if (!Number.isFinite(dt) || dt < 0 || context.dim !== "overworld" || context.riding !== mount || mount.dead || mount.gone ||
            !mount.ridden || mount.hp <= 0 || !context.entities.includes(mount) || !journey.savePosition) { this.stop("lifecycle"); return false; }
        if (!context.active) return true;
        this.cancelElapsed += Math.min(0.1, dt);
        const t = Math.min(1, this.cancelElapsed / 0.4);
        mount.burrowDepth = this.cancelDepth * (1 - t * t * (3 - 2 * t));
        if (t >= 1) { this.stop(); return false; }
        return true;
      }
      const before = { ...journey.position };
      const depth = mount.burrowDepth || 0;
      const active = journey.update(dt, context);
      // Never pull the rider back into a dimension or onto a different mount.
      if (context.dim === "overworld" && context.riding === mount) {
        const anchor = journey.savePosition;
        if (anchor) {
          Object.assign(player.pos, anchor); Object.assign(mount.pos, anchor);
          player.vel.x = player.vel.y = player.vel.z = 0;
          player.airTop = null; player.onGround = true; player.inWater = player.headInWater = player.inLava = false;
          player.flying = player.gliding = false;
          mount.vel.x = dt > 0 && context.active ? (anchor.x - before.x) / dt : 0;
          mount.vel.z = dt > 0 && context.active ? (anchor.z - before.z) / dt : 0;
          mount.vel.y = 0; mount.yaw = yaw; mount.onGround = true;
        }
        mount.burrowDepth = journey.depth;
      }
      if (!active && ["route-blocked", "anchor-blocked"].includes(journey.reason) && journey.savePosition && context.riding === mount && context.dim === "overworld") {
        this.requestCancel(journey.reason, depth); return true;
      }
      if (!active) this.stop(journey.reason || "complete");
      return active;
    }
  };
  mount.burrowTravel = session; mount.burrowDepth = 0;
  return { status: "ready", session };
}
