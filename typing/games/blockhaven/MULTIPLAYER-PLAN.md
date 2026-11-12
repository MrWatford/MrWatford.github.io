# Blockhaven Multiplayer: Plan

Written 2026-11-11. This is a plan only. **No multiplayer code has been written yet.** (AGENTS.md rule: building starts only after Mr. Watford approves, and publishing needs its own OK.)

---

## 1. The short version

- **No logins.** One player hosts their world and gets a **room code** (example: `MAPLE-OTTER-27`). Friends type the code to join.
- **The host's computer runs the world.** Creatures, redstone, crops and saving all happen there. Guests send what they *want* to do ("break this block"), the host's game does it, and everyone sees the result.
- **A small relay server passes messages between players.** It runs on Cloudflare, the same account that already runs Mr. Watford AI. It doesn't understand the game: it only forwards messages to everyone in the same room, and it saves nothing.
- **The website stays on GitHub Pages** exactly as it is now.
- **Built in 4 stages.** After stage 2 there's already something students can use: building together in Creative.

---

## 2. Why this works without logins

Normally a login answers the question "who is this?" We don't need that answer here:

| Need | How it's handled without accounts |
|---|---|
| Find your friends' game | Room code, shared out loud in person |
| Show a name over each player | Random safe name like "Swift Otter" (can re-roll, can't type one) |
| Keep strangers out | Host clicks **Allow** for each person who asks to join, can **kick**, and can **lock** the room |
| Keep your stuff | The host's world saves on the host's computer like today. Each guest's backpack saves on the guest's computer. |

Nothing about a student is collected. The relay only sees game messages (block positions, movement), and it throws them away as soon as it passes them on.

---

## 3. Why the code is ready for this (what I checked)

- **The land comes from the seed.** `worldgen.js`: "The same seed always makes the same land," and it never uses `Math.random`. So a guest doesn't need the host to send the whole world. They get the **seed** and the host's **list of changes** (`world.mods`), and their computer builds the same land. That makes joining fast.
- **Every block change already goes through one place:** `World.set()` in `world.js`, which calls `world.onSet`. That's the natural spot to send block changes to the other players. (Redstone already uses `onSet`, so the two need to share it.)
- **Player skins can already be drawn as 3D figures** (`makeModel(skinId)` and `dressModel` in `skins.js`), so other players can be drawn with the skin they picked, armor included.
- **The game already has a Cloudflare Worker deployed** (`ai-backend/`, set up with wrangler), so the setup steps are familiar.

**Hard parts (where most of the work is):**

- `entities.js` (3,600 lines) runs creatures. Guests need a "puppet" mode that **draws** creatures where the host says they are without **thinking** for them.
- `main.js` (5,700 lines) assumes one player. The pause menu stops the whole world, and that has to stop happening when friends are connected.
- The game holds **one dimension at a time** (`G.world = makeWorld(toDim)`), so the group has to stay in the same dimension (see Stage 4).
- **The host's browser tab has to stay open and visible.** Browsers slow down hidden tabs, which would freeze the world for everyone.

---

## 4. How the pieces fit

```
  Host's browser                 Cloudflare relay               Guest's browser
  (runs the real world)          (one "room" per code)          (draws what host says)
 ┌───────────────────┐          ┌──────────────────┐          ┌───────────────────┐
 │ full Blockhaven   │◄────────►│ room MAPLE-OTTER │◄────────►│ Blockhaven in     │
 │ creatures, redstone│ messages │ forwards messages│ messages │ "guest mode"      │
 │ saving            │          │ max players, kick│          │ own walking/camera│
 └───────────────────┘          │ saves nothing    │          │ own backpack      │
                                └──────────────────┘          └───────────────────┘
```

**Relay:** a new Cloudflare Worker called `blockhaven-relay`, kept separate from Mr. Watford AI so a problem in one can't break the other. Each room is a **Durable Object**, Cloudflare's name for a tiny always-on room. It holds the live WebSocket connections and forwards messages. Durable Objects are on Cloudflare's free plan. **Check the current free limits in Stage 0 before building.** My understanding is that a class-sized group fits comfortably as long as players send movement about 10 times a second, not 60.

**Who decides what:**

| Thing | Decided by |
|---|---|
| Your own walking, jumping, camera | Your own computer (feels instant) |
| Blocks, chests, furnaces, doors | Host |
| Creatures, item drops, projectiles | Host |
| Redstone, crops, minecarts | Host (guests just see the block changes) |
| Time of day, weather | Host |
| Your backpack, health, hunger | Your own computer, but damage *from* creatures comes from the host |
| Saving the world | Host only |

**When the host leaves,** the room closes and guests see "The host has left the world" and go back to the title screen. Their backpacks are already saved.

**Rejected alternative:** connecting players directly to each other (WebRTC/PeerJS). School networks often block that, and it still needs an outside server to introduce the players. The Cloudflare relay is simpler and more reliable.

---

## 5. Messages (for the builder)

All messages are small JSON objects with a type field `t`. Positions are whole numbers or one decimal place to keep messages small.

| `t` | Direction | Meaning |
|---|---|---|
| `hello` | guest → host | name, skin, game version |
| `welcome` | host → guest | seed, gen version, `mods`, containers near spawn, time, weather, player list, spawn point |
| `deny` / `kick` | host → guest | not allowed in / removed (with a friendly reason) |
| `pos` | everyone, ~10/sec | x, y, z, look direction, held item, crouch/swim state |
| `want` | guest → host | "break x,y,z", "place block b at x,y,z facing f", "use x,y,z", "attack creature uid" |
| `blk` | host → all | block changes (batched every 50 ms) |
| `box` | host ↔ guest | open chest/furnace, move one stack, close |
| `ents` | host → guest, ~10/sec | creatures near that guest: uid, kind, position, facing, health, animation |
| `hurt` / `give` | host → guest | you took damage / you picked something up |
| `env` | host → all, every few seconds | time of day, weather |
| `say` | anyone → all | quick-message number (not free text) |
| `bye` | relay → all | someone left |

The relay also checks things the game can't trust: message size, how many messages per second each player sends, room size, and whether a player was kicked.

**Version check:** if a guest's game version is different from the host's (for example, the guest has an old cached copy), the guest gets "Refresh the page to get the newest Blockhaven" instead of a broken world.

---

## 6. The stages

Each stage ends with a browser test using two browser profiles on this Mac and a local copy of the relay (`wrangler dev`). The checks are in each stage's "Done when" list.

### Stage 0: Groundwork (small)
- Test that the same seed makes **identical land** in two separate tabs. Compare chunk data, including structures and older-world rules (`CURRENT_GEN`, `newGen`).
- Check Cloudflare's current free-plan limits for Durable Objects and WebSockets.
- **School network test:** a tiny test page that connects to a `workers.dev` relay and says "Connected ✓". Mr. Watford opens it on a school computer and a student Chromebook. If the school filter blocks it, we find out before building anything big.
- Mr. Watford answers the decisions in section 8.

**Done when:** land matches, limits are written down, and the school test shows Connected (or we have a plan B).

#### Stage 0 results (2026-11-11)

1. **Same land: PASS.** Tested in the browser with a disposable Creative world (seed `mptest-seed-1`, deleted afterward). I measured 81 chunks (9×9 around spawn), with 3 blocks changed, then saved:
   - After a full page reload and loading the save, all 81 chunks were identical, changes included.
   - A *second new world* with the same seed made identical raw land in the Surface and in the Nether.
   - **Important for Stage 1:** the seed alone is not quite enough. The Surface also gets planned "stamps" (13 in this world: Starter Home, Keeper dig site, temple entrances, relic sites), and the Nether gets the citadel spot. These are chosen from the seed but stored in `G.dimData` and `G.story`, and they can depend on what the player already visited. So the `welcome` message must send `meta.seed`, `meta.gen`, the dimension's `dimData` (mods, visited, newGen, stamp plans), and the story planning fields, not just the seed.
2. **Free limits: written down** (Cloudflare Durable Objects pricing page, checked 2026-11-11). The free plan allows 100,000 requests a day. Each incoming message counts as 1/20 of a request, and outgoing messages are free. It also allows 13,000 GB-s of run time a day, and limits reset at 00:00 UTC. Rough budget:
   - A moving player sending 10 position updates a second ≈ 1,800 requests an hour.
   - One full 6-player room for an hour ≈ 11,000 requests, so the free plan covers about **9 full-room hours a day** across all rooms. Run time allows about 28, so requests are the tighter limit.
   - **Plan changes:** send position only when the player actually moved (standing still sends nothing), batch block changes, and have the relay show a friendly "Play Together is resting until tomorrow" message near the limit. If students use it a lot, the paid plan ($5/month) removes the worry. That's Mr. Watford's call later.
3. **School network test: built, waiting on Mr. Watford.**
   - `blockhaven-relay/` (Worker + Durable Object "Room" using the Hibernation API + the "Blockhaven Network Test" page) passed locally: connects, 100/100 messages returned, the device count went 1 → 2 → 1 as a second copy opened and closed, and bad requests are refused.
   - **Deployed 2026-11-11 with his OK:** https://blockhaven-relay.watford-ai.workers.dev. The live test passed from his Mac's home network: 100/100 messages, 70 ms average.
   - **Still to do:** he opens that page on a school computer and a student Chromebook on school Wi-Fi.
4. **New finding: hidden tabs.** While the browser pane was hidden, the test page's 10-second test took about 100 seconds, because the browser slowed its timers to once a second. This confirms the risk in section 3: **if the host switches tabs, the world will slow down for everyone.**
   - Stage 1 must handle it: the game should show the host a "Keep Blockhaven in front while friends are playing" warning. Guests should see "The host's game is paused" instead of the world just freezing.
   - The test page now asks people to keep it in front.

### Stage 1: Rooms and seeing each other
- `blockhaven-relay/` Worker: create a room, join a room, Allow/Deny, kick, lock, close when empty. Rooms also expire after a few hours.
- Title screen gets a **Play Together** button with **Host this world** and **Join with a code**.
- The host's pause menu shows the code, the player list, and Kick/Lock buttons. The pause menu no longer freezes the world while guests are connected.
- Joining downloads the world (seed and changes) and puts the guest at the host's spawn.
- Other players appear as their skins with a name tag above them and move smoothly (each guest's game smooths between position updates).
- **Creative only.** Guests can fly around and look, but can't change blocks yet.

**Done when:** two profiles see each other walking around, the name tags show, and Kick, Lock, Deny, "host left" and the version mismatch message all work.

#### Stage 1 results (2026-11-11): built, browser-tested, and published with Stage 2
- Everything in the Stage 1 list works between two tabs and a local relay. The details are in `FEATURES.md` under "Play Together, Stage 1".
- **Extra included:** the host's own building already shows up for guests live. That was cheap to add and avoids confusion. Guests' building is still Stage 2.
- **Bug found and fixed:** being removed from a world saved a "(visiting)" copy on the guest's computer. Saving now refuses any guest world in two separate places.
- **Not yet done:**
  - The "host's game is paused" banner isn't tested.
  - The class-time hours need Mr. Watford's choice.

### Stage 2: Building together → first thing students can use
- Break and place blocks (host checks reach distance), with block-change messages that redstone shares too.
- Doors, buttons, levers, signs. Chests and furnaces open and move items through the host. Two people in one chest is handled safely.
- Quick messages ("Follow me!", "Over here!", "Nice build!", "Help!", "Thanks!", "Be right back") plus a little speech bubble.
- Backpack saved on the guest's computer, separately for each host world.

**Done when:** two players build the same house at the same time without disagreeing about any block. Redstone a guest builds runs. The host's save holds everyone's building. The guest's backpack comes back after rejoining. **Then it can be published as "Creative: Play Together."**

#### Stage 2 results (2026-11-11): built, browser-tested, and published 2026-11-11
- Everything in the Stage 2 list works between two tabs and a local relay. The details are in `FEATURES.md` under "Play Together, Stage 2".
- **How building works:** the guest's game makes the change right away (so it feels instant) and sends it to the host. The host's game checks it, then does it for real or sends back an undo. Everyone then gets the host's result.
- **Safety additions:**
  - Sign text is never shared, and guests can't write signs while visiting.
  - The visited world shows the host's random name instead of the world name the host typed.
  - Fire and portals are refused.
- **Machines** (hoppers, droppers, crafters, beacons), **beds**, and **story pieces** stay host-only while playing together.
- **Published 2026-11-11 with Mr. Watford's OK**, together with Stage 1:
  - The relay update was deployed and checked live with a test host and guest.
  - The game files were uploaded, with the import-map version bump.
  - The footer sentence (decision 7) was added to all 33 site pages that have the privacy line.
- **Still open:**
  - A real test on two separate computers on school Wi-Fi.
  - The class-time hours.

### Stage 3: Survival together (the biggest stage)
- `entities.js` puppet mode: guests draw creatures from `ents` messages and don't run AI.
- The host's creatures notice **all** players, not just the host: chasing, targets, despawn distance, and the "creatures beyond 48 blocks don't think" rule.
- Guests can attack. Creatures and projectiles can hurt guests. Guests can die, respawn, and drop their items.
- Item drops and picking them up go through the host, so no item gets copied by accident.
- Day/night, weather and sleeping: everyone must be in bed to skip the night.
- Hunger and eating stay on each guest's own computer.

**Done when:** a guest and the host fight the same zombie and both see it die once, with one set of drops. A guest dies and respawns, and their items are left where they died. Night can be skipped only when everyone sleeps.

### Stage 4: Machines and travel
- Minecarts and boats with a guest riding.
- **Dimensions:** the group travels together. When the host goes through a portal, everyone comes along. Guests can't go through a portal alone.
- Bosses and expansion creatures (Leviathan, desert bosses) are checked one at a time. Anything that doesn't sync well stays single-player.

**Done when:** a guest rides a minecart loop the host built, and the group goes to the Nether and back together.

### Not planned (stays single-player)
- The Legacy story campaign
- The Forsaken World adventure
- Hardcore worlds
- Joining a friend's world when the host isn't online. That would mean storing worlds on the server, which this plan avoids on purpose.

---

## 7. Safety and school rules

- **No free-typed chat.** Quick messages only. Nothing typed by a student ever reaches another student.
- **No typed names.** Names come from a kid-safe word list (adjective + animal). The room code word lists are kid-safe too.
- **Host approval** for every join, plus Kick and Lock. Rooms close when empty and expire after a few hours.
- **Max players per room** (default 6), enforced by the relay.
- **Teacher off-switch (optional):** a setting on the relay that turns Play Together off during set hours (for example, class time). It can also be switched off completely in one step.
- **Privacy:** the relay keeps no logs of game messages and no player list after a room closes. Cloudflare itself still sees internet addresses, like any website does.
- **Footer wording:** suggested new sentence, *"Playing Blockhaven together sends game moves through a server to the other players; nothing is saved."*
- **Cheating:** a determined student could use browser tools to send fake messages. The host checks the obvious things (reach distance, having the block they place), but this is a classroom game, not a protected server. The worst case is a messed-up world in one room, and Kick fixes that.

---

## 8. Decisions for Mr. Watford

**Decided 2026-11-11: Mr. Watford accepted the first answer on all 8.** (6 players, host approval, quick messages only, random names, Survival + Creative, class-hours off-switch, the section 7 footer sentence, "Play Together".)

My suggested answer is first on each one.

1. **Max players per room:** 6 / 4 / 10
2. **Host must approve each join:** yes / no (anyone with the code gets in)
3. **Chat:** quick messages only / none at all
4. **Names:** random only (re-roll allowed) / pick from a list
5. **Modes allowed:** Survival + Creative / Creative only
6. **Teacher off-switch during class hours:** yes, with hours you choose / no
7. **Footer sentence:** the one in section 7 / your own wording
8. **Name of the feature:** "Play Together" / something else

---

## 9. Files that will change or be added

**New**
- `blockhaven-relay/` at the site root (next to `ai-backend/`): Worker, Durable Object room, `wrangler.toml`, README with setup steps, tests
- `js/net.js`: connection, reconnect, sending and receiving messages
- `js/multiplayer.js`: host and guest rules (wants, block batches, snapshots)
- `js/remote-players.js`: drawing other players, name tags, speech bubbles
- `js/mp-words.js`: kid-safe word lists for names and room codes

**Changed (kept small, per AGENTS.md)**
- `world.js`: let `onSet` have more than one listener (redstone + multiplayer)
- `main.js`: guest mode start-up, pause behavior with friends connected, the portal group trip
- `entities.js`: puppet mode, creatures noticing every player
- `ui.js`: Play Together screens, player list, quick messages
- `save.js`: guest backpack store (new key, does **not** change `SAVE_VERSION`)
- `FEATURES.md`: checklist updated each stage
