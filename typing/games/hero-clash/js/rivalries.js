// Hero Clash — rivalries: special introductions, dialogue, and win quotes for
// certain match-ups. Pure data, kept apart from the combat rules. To add a
// rivalry, add an entry here; nothing else needs to change.
//
// lines: spoken in order, [fighter id, text].  win: what each fighter says after beating the other.
// react: what a fighter says when the rival's Ultimate Move lands on them.  fx: the intro's effect style.

export const RIVALRIES = [
  { n: 1, ids: ["titan", "overlord"], title: "Light Against the Void", featured: true, fx: "energy",
    about: "The city's greatest guardian against the emperor who wants it for his collection. Their powers push against each other before a single punch is thrown.",
    announce: "The Unbreakable Guardian faces the Emperor of the Void!",
    lines: [["titan", "Your reign ends today."], ["overlord", "Then come and try to stop me."]],
    win: { titan: "The void can wait. This world is spoken for.", overlord: "Even stars burn out, Guardian." },
    react: { titan: "Not... finished yet!", overlord: "Impossible!" } },
  { n: 2, ids: ["shadow", "ninja"], title: "Sharper Blade", featured: true, fx: "fast",
    about: "Two masters of the same arts who have never agreed on who learned them better. Their introductions are over almost before they start.",
    announce: "Two shadows. One spotlight.",
    lines: [["ninja", "You trained in daylight. It shows."], ["shadow", "And you talk too much for a ghost."]],
    win: { shadow: "Preparation beats mystery. Every time.", ninja: "You never saw the lesson coming." },
    react: { shadow: "I didn't plan for that.", ninja: "...Well struck." } },
  { n: 3, ids: ["velocity", "frost"], title: "Speed vs. Control", featured: true, fx: "speedice",
    about: "She cannot slow down. He will not hurry. Every match between them is a question of whose pace wins.",
    announce: "The fastest feet in the city meet the coldest hands!",
    lines: [["velocity", "Catch me if you can, snowman!"], ["frost", "I don't need to catch you. I just need you to slip."]],
    win: { velocity: "Too slow! Want a head start next time?", frost: "Slow and steady. Works every time." },
    react: { velocity: "Whoa, brain freeze!", frost: "Too... fast..." } },
  { n: 4, ids: ["sentinel", "mecha"], title: "Battle of the Machines", featured: true, fx: "scan",
    about: "One suit of armor with a person inside, one machine with nobody home. They size each other up with scanners first.",
    announce: "Armor against iron. Scanning complete!",
    lines: [["mecha", "SCANNING. THREAT LEVEL: MINOR."], ["sentinel", "Scan again, big guy. I've had upgrades."]],
    win: { sentinel: "Have you tried turning yourself off and on again?", mecha: "DEMOLITION COMPLETE. NEXT BUILDING." },
    react: { sentinel: "Warning lights. Lots of warning lights.", mecha: "ERROR. ERROR. RECALCULATING." } },
  { n: 5, ids: ["thunder", "storm"], title: "Clash of Storms", featured: true, fx: "storm",
    about: "He commands the lightning. She commands the whole sky. Neither one likes sharing the weather.",
    announce: "The sky is not big enough for both of them!",
    lines: [["storm", "The sky answers to me, Thunderfist."], ["thunder", "Then let's hear what it has to say."]],
    win: { thunder: "The thunder always gets the last word.", storm: "Clear skies ahead. For me, anyway." },
    react: { thunder: "By the mountain... what a storm!", storm: "A gust like that... I felt it." } },
  // more match-ups students can discover
  { n: 0, ids: ["inferno", "frost"], title: "Fire and Ice", fx: "speedice", about: "The oldest disagreement there is.",
    announce: "Fire meets ice!", lines: [["inferno", "Let's turn up the heat."], ["frost", "Let's not."]],
    win: { inferno: "Melted. Next!", frost: "Consider yourself put out." }, react: {} },
  { n: 0, ids: ["sage", "overlord"], title: "The Ninth Door", fx: "energy", about: "The Overlord wants what is behind the Sage's last door. The Sage would like him to stop knocking.",
    announce: "Magic stands against the void!", lines: [["overlord", "Open the door, librarian."], ["sage", "It's overdue for closing, actually."]],
    win: { sage: "The library is closed.", overlord: "Every door opens eventually." }, react: {} },
  { n: 0, ids: ["archer", "web"], title: "Friendly Fire", fx: "fast", about: "Two heroes, one rooftop, and a running argument about who has the better aim.",
    announce: "A friendly contest of aim!", lines: [["web", "Loser buys the pizza?"], ["archer", "Hope you brought your wallet."]],
    win: { archer: "Extra cheese on mine.", web: "I'll take pepperoni, thanks!" }, react: {} },
  { n: 0, ids: ["wildclaw", "mecha"], title: "Nature vs. Machine", fx: "scan", about: "It bulldozed half a forest. She took that personally.",
    announce: "The jungle strikes back!", lines: [["mecha", "OBSTACLE DETECTED."], ["wildclaw", "I'm not an obstacle. I'm the consequences."]],
    win: { wildclaw: "The forest remembers.", mecha: "OBSTACLE REMOVED." }, react: {} },
  { n: 0, ids: ["solar", "inferno"], title: "Who Shines Brighter", fx: "energy", about: "One of them is powered by a star. The other one thinks he is one.",
    announce: "Sunlight against wildfire!", lines: [["inferno", "There's only room for one hot shot."], ["solar", "You're a campfire. I'm the sun."]],
    win: { solar: "Lights out.", inferno: "And the crowd goes wild!" }, react: {} },
  { n: 0, ids: ["professor", "*"], title: "Pop Quiz", fx: "class", about: "The Professor has a question ready for everyone.",
    announce: "Class is in session!", lines: [["professor", "Pencils down. Eyes up front."]],
    win: { professor: "Looks like somebody needs extra credit." }, react: {} },
];

export function rivalryFor(a, b) {
  for (const r of RIVALRIES) {
    if (r.ids[1] === "*") { if (r.ids[0] === a || r.ids[0] === b) { if (a !== b) return r; } continue; }
    if ((r.ids[0] === a && r.ids[1] === b) || (r.ids[0] === b && r.ids[1] === a)) return r;
  }
  return null;
}
export function rivalriesOf(id) { return RIVALRIES.filter((r) => r.ids.includes(id) && r.ids[1] !== "*"); }
