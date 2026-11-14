// Turbo League — the text announcer. Original lines; it remembers what it said recently so it
// doesn't repeat itself. {name}, {assist}, {kph}, {team} are filled in.
const LINES = {
  intro: ["Welcome to the Championship Stadium!", "The crowd is on its feet. Here we go!", "Engines warm, boost tanks full. Let's play!", "A packed house tonight for this one!"],
  kickoff: ["Kickoff!", "Here's the kickoff!", "And we're underway!", "Ball's in play!", "Back to the center, and go!"],
  goal: ["{name} scores!", "{name} finds the back of the net!", "Goal for {team}! {name} with the finish!", "{name} puts it away!", "There it is! {name}!", "{name} with a beauty!"],
  goalFast: ["{kph} km/h! {name} absolutely rockets it in!", "What a blast from {name}! {kph} km/h!", "The keeper never saw it. {name}, {kph} km/h!"],
  goalAir: ["{name} takes to the sky and scores!", "An aerial goal from {name}! Spectacular!", "{name} flies in for the finish!"],
  goalAssist: ["Great teamwork! {assist} sets up {name}!", "{assist} with the pass, {name} with the goal!", "Textbook combination: {assist} to {name}!"],
  ownGoal: ["Oh no, that one went in off {team}!", "An unlucky bounce, and it's in!", "That's going to sting. Own goal!"],
  save: ["Big save by {name}!", "{name} denies it!", "Not today! {name} with the stop!", "What a block from {name}!"],
  overtime: ["Overtime! Next goal wins!", "We're going to overtime. Sudden death!", "Tied up! Next goal takes it all!"],
  lastMinute: ["One minute left!", "Sixty seconds to go!", "Final minute, here we go!"],
  last10: ["Ten seconds!", "Here comes the final countdown!"],
  win: ["{team} wins it!", "That's the match! {team} takes the victory!", "Full time! Congratulations, {team}!"],
  close: ["What a battle that was!", "Both teams left it all on the field!"],
};
export class Announcer {
  constructor(rand = Math.random) { this.rand = rand; this.recent = {}; }
  say(kind, vals = {}) {
    const list = LINES[kind]; if (!list) return "";
    const used = this.recent[kind] || (this.recent[kind] = []);
    const fresh = list.map((_, i) => i).filter((i) => !used.includes(i));
    const pickFrom = fresh.length ? fresh : list.map((_, i) => i);
    const i = pickFrom[Math.floor(this.rand() * pickFrom.length)];
    used.push(i); while (used.length > Math.min(3, list.length - 1)) used.shift();
    return list[i].replace(/\{(\w+)\}/g, (_, k) => (vals[k] !== undefined ? vals[k] : ""));
  }
  // picks the most exciting fitting line for a goal
  goal(e, teamName) {
    const v = { name: e.scorer ? e.scorer.name : "", assist: e.assist ? e.assist.name : "", kph: Math.round(e.speed * 3.6), team: teamName };
    if (e.ownGoal || !e.scorer) return this.say("ownGoal", v);
    if (e.aerial) return this.say("goalAir", v);
    if (v.kph >= 100) return this.say("goalFast", v);
    if (e.assist && this.rand() < 0.7) return this.say("goalAssist", v);
    return this.say("goal", v);
  }
}
export const ANNOUNCER_LINES = LINES;
