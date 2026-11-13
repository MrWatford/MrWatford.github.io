/* Key Locations study guide data (used by js/review-engine.js).
   makeMC builds fresh "where is this key?" questions from the real keyboard layout every round. */
window.REVIEW = (function () {
  var TERMS = [
    ["Home row (left hand)", "A S D F"],
    ["Home row (right hand)", "J K L ;"],
    ["The keys with bumps", "F and J, so you can find the home row without looking"],
    ["Top letter row", "Q W E R T Y U I O P"],
    ["Bottom letter row", "Z X C V B N M"],
    ["Number row", "1 2 3 4 5 6 7 8 9 0 (above the top letter row)"],
    ["QWERTY", "The name of a standard keyboard, from the first six letters of the top letter row"],
    ["Backspace", "Erases the character to the LEFT of the cursor"],
    ["Caps Lock", "Makes every letter a capital until you press it again"],
    ["Shift", "Hold it for ONE capital letter, or for the symbol on the top half of a key"],
    ["Space bar", "Pressed with your thumb"],
    ["Enter", "Starts a new line or paragraph"],
    ["Tab", "Jumps the cursor forward, like indenting a paragraph"]
  ];
  var EXTRA = [
    ["Shift + 8", "* (asterisk)"],
    ["Shift + 1", "! (exclamation point)"],
    ["Shift + 2", "@ (at sign)"],
    ["Shift + 3", "# (number sign)"]
  ];

  var MC = [
    ["Which keys are the home row for your LEFT hand?", ["A S D F", "Q W E R", "Z X C V", "F G H J"], "Left hand rests on A S D F."],
    ["Which keys are the home row for your RIGHT hand?", ["J K L ;", "H J K L", "U I O P", "N M , ."], "Right hand rests on J K L ; (semicolon)."],
    ["Which two keys have little bumps you can feel?", ["F and J", "A and ;", "D and K", "G and H"], "Your pointer fingers find the bumps on F and J."],
    ["Z X C V B N M are on which row?", ["Bottom row", "Top row", "Home row", "Number row"], "They sit below the home row."],
    ["Q W E R T Y U I O P are on which row?", ["Top row", "Bottom row", "Home row", "Number row"], "The top letter row gives the QWERTY keyboard its name."],
    ["You typed \"catt\" and want to erase the last t. Which key erases to the LEFT of the cursor?", ["Backspace", "Tab", "Shift", "Esc"], "Backspace erases backward (to the left)."],
    ["You want to type a whole title in capital letters without holding a key. Which key do you turn on?", ["Caps Lock", "Shift", "Ctrl", "Alt"], "Caps Lock stays on until you press it again."],
    ["You need ONE capital letter at the start of a sentence. Which key do you hold?", ["Shift", "Caps Lock", "Tab", "Enter"], "Hold Shift with the opposite hand and press the letter."],
    ["Why is a standard keyboard called QWERTY?", ["Those are the first six letters of the top letter row", "It was invented by Mr. Qwerty", "Those are the home row keys", "Those letters are used the most"], "Look at the top letter row: Q W E R T Y…"],
    ["Which finger presses the space bar?", ["Your thumb", "Your pointer finger", "Your pinky", "Your ring finger"], "Thumbs rest on the space bar."],
    ["To type the * symbol, you hold Shift and press which key?", ["8", "6", "7", "9"], "* shares a key with 8."]
  ];

  var TF = [
    ["The F and J keys have small bumps.", true, "They help you find the home row without looking."],
    ["Caps Lock gives you just one capital letter.", false, "That's Shift. Caps Lock stays on."],
    ["Backspace erases the character to the right of the cursor.", false, "Backspace erases to the LEFT."],
    ["You press the space bar with your thumb.", true, "Thumbs rest on the space bar."],
    ["Z X C V are on the top row.", false, "They are on the bottom row."],
    ["Your left hand's home row keys are A S D F.", true, "Right hand: J K L ;"],
    ["The number keys are below the home row.", false, "The number row is at the very top, above Q W E R T Y."],
    ["The ; key is just to the right of L.", true, "Right pinky rests on ;"]
  ];

  /* ---- Fresh questions from the layout ---- */
  var NUM = "`1234567890-=".split("");
  var TOP = "QWERTYUIOP[]\\".split("");
  var HOME = "ASDFGHJKL;'".split("");
  var BOT = "ZXCVBNM,./".split("");
  var ROWS = [TOP, HOME, BOT];
  var ROWNAME = ["the top row", "the home row", "the bottom row"];
  var SHIFTED = { "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "*", "9": "(", "0": ")" };
  var NAMES = { ";": "; (semicolon)", "'": "' (apostrophe)", ",": ", (comma)", ".": ". (period)", "/": "/ (slash)", "[": "[ (bracket)", "]": "] (bracket)", "\\": "\\ (backslash)", "`": "` (back tick)", "-": "- (minus)", "=": "= (equals)" };
  function nm(k) { return NAMES[k] || k; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function isLetter(k) { return /^[A-Z]$/.test(k); }
  function make(question, answer, pool, why) {
    var opts = [answer], tries = 0;
    pool = pool.filter(function (p) { return p && p !== answer; });
    while (opts.length < 4 && tries++ < 80) {
      var p = pool.length ? pool[rnd(pool.length)] : "QWERTYUIOPASDFGHJKLZXCVBNM"[rnd(26)];
      if (opts.indexOf(p) < 0) opts.push(p);
      if (tries > 40) pool = [];
    }
    return [question, opts.map(nm), why];
  }
  function strip(row, i) { return row.slice(Math.max(0, i - 2), i + 3).join(" "); }

  function makeMC() {
    var out = [], kinds = ["left", "right", "between", "above", "below", "below", "shift", "row"];
    for (var n = 0; n < 12; n++) {
      var kind = kinds[rnd(kinds.length)], r = rnd(3), row = ROWS[r], i, k, near;
      if (kind === "left" || kind === "right" || kind === "between") {
        i = 1 + rnd(row.length - 2);
        if (!isLetter(row[i])) { n--; continue; }
        near = [row[i - 1], row[i + 1], row[i]].concat(ROWS[(r + 1) % 3].slice(Math.max(0, i - 1), i + 2));
        if (kind === "left") out.push(make("What key is just to the LEFT of " + row[i] + "?", row[i - 1], near.concat(row[i + 1]), "Picture " + ROWNAME[r] + ": " + strip(row, i)));
        else if (kind === "right") out.push(make("What key is just to the RIGHT of " + row[i] + "?", row[i + 1], near.concat(row[i - 1]), "Picture " + ROWNAME[r] + ": " + strip(row, i)));
        else {
          if (!isLetter(row[i - 1]) || !isLetter(row[i + 1])) { n--; continue; }
          out.push(make("What letter is between " + row[i - 1] + " and " + row[i + 1] + "?", row[i], row.slice(Math.max(0, i - 3), i + 4).concat(ROWS[(r + 1) % 3][i]), "Picture " + ROWNAME[r] + ": " + strip(row, i)));
        }
      } else if (kind === "above") {
        i = rnd(10); k = TOP[i];
        out.push(make("Which number key is just above " + k + "?", NUM[i + 1], NUM.slice(Math.max(1, i - 1), i + 4), "The number row sits a little to the left above the top row: " + NUM.slice(i, i + 3).join(" ") + " over " + TOP.slice(Math.max(0, i - 1), i + 2).join(" ")));
      } else if (kind === "below") {
        if (rnd(2)) {
          i = rnd(10); k = TOP[i];
          out.push(make("What key is just below " + k + "?", HOME[i], HOME.slice(Math.max(0, i - 2), i + 3).concat(BOT[i]), k + " is on the top row. Below it on the home row is " + HOME[i] + "."));
        } else {
          i = rnd(10); k = HOME[i];
          if (!isLetter(k)) { n--; continue; }
          out.push(make("What key is just below " + k + "?", BOT[i], BOT.slice(Math.max(0, i - 2), i + 3).concat(TOP[i]), k + " is on the home row. Below it on the bottom row is " + nm(BOT[i]) + "."));
        }
      } else if (kind === "shift") {
        var d = String(1 + rnd(9)), sym = SHIFTED[d];
        var others = Object.keys(SHIFTED).map(function (x) { return SHIFTED[x]; });
        out.push(make("Which symbol shares a key with the number " + d + "?", sym, others, "Hold Shift and press " + d + " to type " + sym + "."));
      } else {
        i = rnd(row.length);
        if (!isLetter(row[i])) { n--; continue; }
        out.push([ "Which row is the letter " + row[i] + " on?", ["Top row", "Home row", "Bottom row", "Number row"].sort(function (a, b) { return a === cap(ROWNAME[r]) ? -1 : b === cap(ROWNAME[r]) ? 1 : 0; }), row[i] + " is on " + ROWNAME[r] + ": " + strip(row, i) ]);
      }
    }
    return out;
  }
  function cap(s) { s = s.replace("the ", ""); return s.charAt(0).toUpperCase() + s.slice(1); }

  return { labels: { term: "Key", def: "What to know" }, terms: TERMS, extraCards: EXTRA, mc: MC, tf: TF, makeMC: makeMC };
})();
