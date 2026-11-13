/* Keyboard Shortcuts study guide data (used by js/review-engine.js).
   Built from Mr. Watford's Keyboard Shortcuts Cheat Sheet. Practice questions are reworded, not copied from the exam. */
window.REVIEW = (function () {
  var TERMS = [
    ["Ctrl + C", "Copy"],
    ["Ctrl + V", "Paste"],
    ["Ctrl + X", "Cut"],
    ["Ctrl + Z", "Undo"],
    ["Ctrl + Y", "Redo"],
    ["Ctrl + A", "Select all"],
    ["Ctrl + B", "Bold"],
    ["Ctrl + I", "Italicize"],
    ["Ctrl + U", "Underline"],
    ["Ctrl + S", "Save"],
    ["Ctrl + P", "Print"],
    ["Ctrl + F", "Find a word"],
    ["Ctrl + K", "Insert a link"],
    ["Ctrl + Shift + V", "Paste without formatting"],
    ["Ctrl + Enter", "Page break (start a new page)"],
    ["Ctrl + Shift + L", "Align left"],
    ["Ctrl + Shift + E", "Center"],
    ["Ctrl + Shift + R", "Align right"],
    ["Ctrl + Shift + J", "Justify (both sides line up evenly)"],
    ["Ctrl + Alt + M", "Add a comment (Google Docs)"],
    ["Ctrl + Shift + 7", "Numbered list (Google Docs)"],
    ["Ctrl + Shift + 8", "Bulleted list (Google Docs)"],
    ["Ctrl + Shift + C", "Word count (Google Docs)"]
  ];
  var EXTRA = [
    ["The BIG FOUR", "Ctrl + C = Copy • Ctrl + V = Paste • Ctrl + Z = Undo • Ctrl + A = Select all"],
    ["How to press a shortcut", "Hold down Ctrl, tap the letter, then let go of both."]
  ];

  // First choice is the right answer.
  var MC = [
    ["You highlighted a sentence and want a COPY of it somewhere else, without removing it. What do you press first?", ["Ctrl + C", "Ctrl + X", "Ctrl + V", "Ctrl + A"], "Ctrl + C copies. Then Ctrl + V pastes it."],
    ["You copied a word. Which shortcut puts it where your cursor is?", ["Ctrl + V", "Ctrl + C", "Ctrl + P", "Ctrl + Y"], "Ctrl + V pastes."],
    ["You want to MOVE a paragraph: take it out here and put it somewhere else. What do you press first?", ["Ctrl + X", "Ctrl + C", "Ctrl + Z", "Ctrl + S"], "Ctrl + X cuts (removes) it so you can paste it somewhere else."],
    ["Oops! You deleted your whole paragraph by accident. Which shortcut brings it back?", ["Ctrl + Z", "Ctrl + Y", "Ctrl + B", "Ctrl + F"], "Ctrl + Z is Undo."],
    ["You pressed Undo one too many times. Which shortcut does it again (redo)?", ["Ctrl + Y", "Ctrl + Z", "Ctrl + R", "Ctrl + U"], "Ctrl + Y is Redo."],
    ["Which shortcut highlights everything on the page?", ["Ctrl + A", "Ctrl + E", "Ctrl + S", "Ctrl + C"], "A for All: Ctrl + A selects all."],
    ["You want your title to look thick and dark. Which shortcut makes it bold?", ["Ctrl + B", "Ctrl + I", "Ctrl + U", "Ctrl + D"], "B for Bold."],
    ["Which shortcut makes words slanted (italic)?", ["Ctrl + I", "Ctrl + B", "Ctrl + L", "Ctrl + K"], "I for Italicize."],
    ["Which shortcut puts a line under your words?", ["Ctrl + U", "Ctrl + L", "Ctrl + B", "Ctrl + Y"], "U for Underline."],
    ["You're working in a program that does NOT save by itself. Which shortcut saves your work?", ["Ctrl + S", "Ctrl + P", "Ctrl + A", "Ctrl + V"], "S for Save. Google Docs saves automatically, but many programs don't."],
    ["Your report is finished and you want a paper copy. Which shortcut opens Print?", ["Ctrl + P", "Ctrl + S", "Ctrl + C", "Ctrl + Enter"], "P for Print."],
    ["You need to find every place the word \"volcano\" shows up in your paper. Which shortcut helps?", ["Ctrl + F", "Ctrl + K", "Ctrl + A", "Ctrl + G"], "F for Find."],
    ["You highlighted the word \"NASA\" and want it to open the NASA website when clicked. Which shortcut adds a link?", ["Ctrl + K", "Ctrl + L", "Ctrl + F", "Ctrl + U"], "Ctrl + K inserts a link."],
    ["You copied text from a website and it pasted in a strange font and color. Which shortcut pastes plain text instead?", ["Ctrl + Shift + V", "Ctrl + V", "Ctrl + Shift + C", "Ctrl + Alt + V"], "Ctrl + Shift + V pastes without formatting."],
    ["You want to start typing at the top of a brand-new page right away. Which shortcut?", ["Ctrl + Enter", "Ctrl + Shift + 7", "Ctrl + P", "Ctrl + N"], "Ctrl + Enter makes a page break."],
    ["Which shortcut puts your title in the middle of the page?", ["Ctrl + Shift + E", "Ctrl + Shift + L", "Ctrl + Shift + R", "Ctrl + Shift + J"], "Ctrl + Shift + E centers text."],
    ["Which shortcut lines up BOTH sides of a paragraph evenly?", ["Ctrl + Shift + J", "Ctrl + Shift + E", "Ctrl + Shift + L", "Ctrl + Shift + R"], "Ctrl + Shift + J justifies."],
    ["Which shortcut moves your text to the RIGHT side of the page?", ["Ctrl + Shift + R", "Ctrl + Shift + L", "Ctrl + Shift + E", "Ctrl + Y"], "R for Right."],
    ["In Google Docs, which shortcut adds a comment to highlighted words?", ["Ctrl + Alt + M", "Ctrl + Shift + C", "Ctrl + K", "Ctrl + Shift + 8"], "Ctrl + Alt + M adds a comment."],
    ["In Google Docs, which shortcut starts a numbered list (1, 2, 3)?", ["Ctrl + Shift + 7", "Ctrl + Shift + 8", "Ctrl + 1", "Ctrl + Shift + N"], "7 = numbered list, 8 = bulleted list."],
    ["In Google Docs, which shortcut starts a bulleted list (•)?", ["Ctrl + Shift + 8", "Ctrl + Shift + 7", "Ctrl + B", "Ctrl + Shift + B"], "8 = bulleted list."],
    ["Your essay must be at least 300 words. Which Google Docs shortcut shows the word count?", ["Ctrl + Shift + C", "Ctrl + C", "Ctrl + Shift + W", "Ctrl + F"], "Ctrl + Shift + C shows the word count."],
    ["Almost every shortcut on the cheat sheet starts with which key?", ["Ctrl", "Shift", "Tab", "Alt"], "Hold Ctrl, then tap the letter."],
    ["The four shortcuts you should NEVER forget are Copy, Paste, Undo, and…", ["Select all", "Print", "Bold", "Find"], "The big four: Ctrl + C, Ctrl + V, Ctrl + Z, Ctrl + A."]
  ];

  var TF = [
    ["Ctrl + X removes the text so you can paste it somewhere else.", true, "That's Cut."],
    ["Ctrl + Y undoes your last action.", false, "Ctrl + Z undoes. Ctrl + Y redoes."],
    ["Google Docs saves your work automatically.", true, "But Ctrl + S is still important in many other programs."],
    ["Ctrl + P pastes text.", false, "Ctrl + P is Print. Ctrl + V is Paste."],
    ["Ctrl + U underlines words.", true, "U for Underline."],
    ["Ctrl + A selects only one word.", false, "Ctrl + A selects ALL."],
    ["To use a shortcut, you hold down Ctrl and then tap the letter.", true, "Hold Ctrl, tap the letter, let go."],
    ["Ctrl + Shift + E centers your text.", true, "Great for titles."],
    ["Ctrl + B makes text bigger.", false, "Ctrl + B makes text bold."],
    ["Ctrl + F helps you find a word in your document.", true, "F for Find."]
  ];

  // [keys shown, action, keyboard code, modifiers]. Shortcuts the browser won't let a page catch are left out.
  var PRESS = [
    ["Ctrl + C", "Copy", "KeyC"],
    ["Ctrl + V", "Paste", "KeyV"],
    ["Ctrl + X", "Cut", "KeyX"],
    ["Ctrl + Z", "Undo", "KeyZ"],
    ["Ctrl + Y", "Redo", "KeyY"],
    ["Ctrl + A", "Select all", "KeyA"],
    ["Ctrl + B", "Bold", "KeyB"],
    ["Ctrl + I", "Italicize", "KeyI"],
    ["Ctrl + U", "Underline", "KeyU"],
    ["Ctrl + S", "Save", "KeyS"],
    ["Ctrl + P", "Print", "KeyP"],
    ["Ctrl + F", "Find", "KeyF"],
    ["Ctrl + K", "Insert a link", "KeyK"],
    ["Ctrl + Shift + V", "Paste without formatting", "KeyV", { shift: true }],
    ["Ctrl + Enter", "Page break", "Enter"],
    ["Ctrl + Shift + L", "Align left", "KeyL", { shift: true }],
    ["Ctrl + Shift + E", "Center", "KeyE", { shift: true }],
    ["Ctrl + Alt + M", "Add a comment", "KeyM", { alt: true }],
    ["Ctrl + Shift + 7", "Numbered list", "Digit7", { shift: true }],
    ["Ctrl + Shift + 8", "Bulleted list", "Digit8", { shift: true }]
  ];

  return { labels: { term: "Shortcut", def: "What it does" }, terms: TERMS, extraCards: EXTRA, mc: MC, tf: TF, press: PRESS };
})();
