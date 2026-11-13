/* Typing Classroom assignments — edit this list to add, change, or retire assignments.
   status:  "current"  = shows under "Current assignments" (newest first)
            "practice" = always-open practice, no due date
            "past"     = moves to "Past assignments" (still playable)
   due:     plain words shown on the card, e.g. "Friday, Nov. 21" (optional)
   seconds: optional time limit; leave it out to type the whole passage
   goal:    optional targets shown on the results, e.g. { wpm: 25, accuracy: 90 }
   text:    the passage students type (one paragraph). */
var TYPING_ASSIGNMENTS = [
  {
    id: "home-row-warmup",
    title: "Home Row Warm-Up",
    status: "practice",
    directions: "Keep your fingers on A S D F and J K L ; the whole time. Go slowly and aim for accuracy first.",
    goal: { accuracy: 90 },
    text: "a sad lad; a sad dad; all fall; ask a lad; add a flask; dad asks all lads; a lass falls; flasks fall; a dad adds salsa; all lads ask dad; sad lads fall; a lass asks a lad"
  },
  {
    id: "sentence-warmup",
    title: "Sentence Warm-Up",
    status: "practice",
    directions: "Type the sentences with capital letters and periods. Use the Shift key with the opposite hand from the letter.",
    goal: { wpm: 20, accuracy: 90 },
    text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen jugs of juice. A good typist keeps eyes on the screen and fingers on the home row. Practice a little every day and your speed will grow."
  }
];
