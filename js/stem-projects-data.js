/* =========================================================
   STEM Project Center — project list
   Used by science/stem-projects.html (drawn by js/stem-projects.js).
   This is a separate collection from the Science Project Center
   (js/project-center-data.js); the two lists never mix.

   HOW TO ADD OR EDIT A PROJECT
   Copy one { ... } block below, paste it in the right difficulty
   group, and change the words. Keep the commas between blocks.

     id           short name for the web address (lowercase-with-dashes, must be unique)
     title        project name
     difficulty   "Easy", "Medium", or "Hard"
     category     the category shown on the card
     themes       one or more keys from STEM_CATEGORIES (the first one sets the card icon)
     keywords     extra words that help the search box find it
     challenge    one sentence for the card
     time         { active: "building and testing time", waiting: "drying or waiting time" }
     supplies     short list of main materials for the card
     format       "Individual", "Individual or pairs", "Teams of 2–3"…
     adult        what an adult helps with ("" = no adult-help badge)
     problem, mission, criteria[], constraints[], materials[], toolNote (optional),
     stem { science, technology, engineering, math },
     plan[], build[], testing[], tables[ { title, cols[], rows[] } ],
     math { intro, steps[], frame }, improve[], retest, reflection[],
     extension, safety[], note (optional "good to know")
   In tables, each word in rows[] fills the first box of a blank row.
   Any target number must be called a "suggested challenge goal."
   ========================================================= */

const STEM_CATEGORIES = {
  structures: { label: "Structures & Civil Engineering", icon: "🏗️" },
  machines:   { label: "Motion, Machines & Mechanisms", icon: "⚙️" },
  water:      { label: "Water & Fluids", icon: "💧" },
  design:     { label: "Product & Human-Centered Design", icon: "📐" },
  materials:  { label: "Materials & Packaging", icon: "📦" },
  earth:      { label: "Earth, Weather & Environment", icon: "🌎" },
  sound:      { label: "Sound & Communication", icon: "📞" },
  robotics:   { label: "Robotics & Automation", icon: "🤖" },
  measure:    { label: "Measurement & Timekeeping", icon: "⏱️" },
  energy:     { label: "Energy & Systems", icon: "⚡" }
};

// Makes blank data-table rows: "Original – trial 1", "Original – trial 2"…
function stemRows(trials, versions) {
  const rows = [];
  (versions || ["Original", "Improved"]).forEach(function (v) {
    for (let i = 1; i <= trials; i++) rows.push(v + " – trial " + i);
  });
  return rows;
}

const STEM_PROJECTS = [

  /* ===================== EASY (12) ===================== */

  {
    id: "index-card-tower",
    title: "Index-Card Tower",
    difficulty: "Easy",
    category: "Structures / Civil Engineering",
    themes: ["structures"],
    keywords: ["tower", "index cards", "tall", "tallest", "stable", "tape", "building", "height"],
    challenge: "Build the tallest freestanding tower possible using 20 index cards and a limited length of tape.",
    time: { active: "About 1–1½ hours", waiting: "None" },
    supplies: "20 index cards per tower, masking tape, ruler or meter stick",
    format: "Individual or pairs",
    adult: "",
    problem: "Radio towers, lookout towers, and cell towers need to be tall so signals or people can see far, but every extra piece of material costs money and adds weight. Engineers must make towers tall while keeping them from tipping over.",
    mission: "Design and build the tallest tower you can that stands by itself, using no more than 20 index cards and a measured length of tape.",
    criteria: [
      "Suggested challenge goal: the tower stands unsupported for at least 30 seconds.",
      "The tower is freestanding. It is not taped or held to the table, wall, or anything else.",
      "Height is measured straight up from the table to the tower's highest point."
    ],
    constraints: [
      "No more than 20 index cards (3 × 5 inch) per tower.",
      "No more than 50 cm of masking tape per tower (your teacher may choose a different amount).",
      "No other materials. Cards may be folded, rolled, or cut.",
      "First version: about 25 minutes of building time."
    ],
    materials: [
      "40–60 index cards (20 for each version you build)",
      "Masking tape (about 50 cm per tower), measured with a ruler",
      "Scissors",
      "Meter stick or tape measure",
      "Ruler",
      "Timer or stopwatch",
      "Pencil and the design-sketch page"
    ],
    stem: {
      science: "Gravity pulls down on every card. A tower stays up when its center of mass stays above its base. A folded or rolled card resists compression (being squeezed from the ends) much better than a flat card, which bends easily.",
      technology: "Folding a flat card into a triangle or tube turns it into a structural part, the same idea as steel beams and columns in real buildings. Rulers and timers are measuring tools that turn “it looks tall” into data.",
      engineering: "You must trade height for stability. Every card you put in a wide base is a card that is not adding height, so you have to decide where each card does the most good.",
      math: "You will compare the height-to-base-width ratio of your towers, calculate height per card, and find how much height you gained after your redesign."
    },
    plan: [
      "What shapes could you fold a card into? Which one do you think will be stiffest?",
      "How many cards will go into the base, and how many into the top?",
      "How wide should the base be? What might happen if it is too narrow?",
      "Where will tape be most useful? How will you make 50 cm of tape last?",
      "Sketch two different tower ideas and label the number of cards in each part."
    ],
    build: [
      "Measure 50 cm of tape and cut it into 10 pieces about 5 cm long. Stick them to the edge of the table so they are ready.",
      "Fold 4 cards the long way into triangular tubes: fold each card into three equal strips and tape the edges together with one piece of tape.",
      "Stand the 4 tubes upright in a square, about 8–10 cm apart. These are the legs of your base.",
      "Lay 1 or 2 flat cards across the tops of the legs to make a platform. Tape it in place.",
      "Make 3 or 4 more tubes and stand them on the platform, a little closer together than the first level. Add another platform.",
      "Keep building upward, making each level narrower, until you use all the cards you want to use. Count any cards you have left."
    ],
    testing: [
      "Place the tower on a flat table away from fans, open windows, and air vents.",
      "Let go and start the timer. Watch for 30 seconds without touching the tower or the table.",
      "Record whether it stood for 30 seconds. If it fell, record when and how it fell.",
      "Hold the meter stick straight up beside the tower and measure the height from the table to the highest point, in centimeters.",
      "Measure the base width: the widest distance across the bottom of the tower.",
      "Record how many cards and how much tape you used.",
      "Pick the tower up, set it back down in the same spot, and repeat steps 2–5. Do 3 trials for each version."
    ],
    tables: [
      {
        title: "Tower test results",
        cols: ["Version & trial", "Stood 30 s? (yes/no)", "Height (cm)", "Base width (cm)", "Cards used", "Tape used (cm)"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "A tall tower on a narrow base is harder to keep standing. Ratios help you compare towers of different sizes.",
      steps: [
        "Find the average height for each version: add the 3 heights and divide by 3.",
        "Height-to-base-width ratio = average height ÷ base width. A larger number means a taller, skinnier tower.",
        "Height per card = average height ÷ number of cards used.",
        "Height gained = improved average height − original average height."
      ],
      frame: "Ratio = ___ cm ÷ ___ cm = ___.   Height per card = ___ cm ÷ ___ cards = ___ cm per card.   Height gained = ___ cm − ___ cm = ___ cm."
    },
    improve: [
      "Change the shape of the card columns (triangle, square, or rolled cylinder) and keep everything else the same.",
      "Change the width of the base.",
      "Add triangular braces between levels.",
      "Use fewer, taller levels or more, shorter levels."
    ],
    retest: "Build your improved tower with the same 20-card and 50 cm tape limits. Run the same 3 trials and compare its average height, ratio, and 30-second results with your original tower.",
    reflection: [
      "Which feature seemed to help height the most? Use your measurements as evidence.",
      "Did the tallest tower also have the largest height-to-base ratio? What happened to stability as the ratio grew?",
      "Where did your tower fail or wobble? Why do you think that part was weakest?",
      "If you were given 5 more cards, where would you put them, and why?"
    ],
    extension: "Add a load requirement: the tower must hold a small paper cup with 20 pennies (about 50 g) on top for 30 seconds. Compare how the best design changes when the tower must carry weight.",
    safety: [
      "Use scissors carefully and keep fingers away from the tape-dispenser blade.",
      "Build on a table, not on the floor in a walkway, so no one trips."
    ]
  },

  {
    id: "paper-chair-for-a-toy",
    title: "Paper Chair for a Toy",
    difficulty: "Easy",
    category: "Structures / Product Design",
    themes: ["structures", "design"],
    keywords: ["chair", "furniture", "paper", "toy", "legs", "load", "sag", "deflection", "buckling"],
    challenge: "Build a chair from paper and tape that supports the same small toy for 30 seconds.",
    time: { active: "About 1–1½ hours", waiting: "None" },
    supplies: "Printer paper, tape, ruler, small toy of known mass",
    format: "Individual or pairs",
    adult: "",
    problem: "Furniture designers want chairs that are strong and comfortable but use as little material as possible, because material costs money and makes furniture heavy to ship. A toy shop wants a lightweight display chair for its small toys.",
    mission: "Build a chair with a seat, legs, and a backrest from paper and tape that holds a small toy without collapsing.",
    criteria: [
      "Suggested challenge goal: the chair holds the toy for 30 seconds without collapsing.",
      "The seat is at least 6 cm above the table.",
      "The chair has a backrest.",
      "Suggested challenge goal: the seat sags (deflects) less than 1 cm while holding the toy."
    ],
    constraints: [
      "No more than 3 sheets of printer paper per chair.",
      "No more than 60 cm of tape per chair.",
      "No cardboard, glue, or other materials.",
      "The toy must sit on the seat. It may not lean on the table."
    ],
    materials: [
      "6–9 sheets of printer paper (3 for each version)",
      "Tape (about 60 cm per chair), measured with a ruler",
      "Scissors",
      "Ruler with centimeters",
      "One small toy, about 50–150 g (for example, a small action figure or plastic animal). Use the same toy every time.",
      "Kitchen scale to find the toy's mass, or use a bag of pennies instead of a toy (40 pennies ≈ 100 g)",
      "Timer"
    ],
    toolNote: "No scale? Use a sealed bag of 40 pennies as your “toy.” Pennies made after 1982 each have a mass of about 2.5 g.",
    stem: {
      science: "The toy's weight pushes down on the seat, and the seat spreads that load to the legs. Thin legs can buckle (bend sideways and fold) under a load. Tubes and folds resist buckling better than flat paper.",
      technology: "Paper tubes, accordion folds, and taped joints are the structural solutions you will use. They work like the hollow metal tubes in real lightweight chairs.",
      engineering: "You must design legs, a seat, and bracing that work together. A strong seat on weak legs still fails, so you need to find and fix the weakest part.",
      math: "You will measure the chair's dimensions, measure how far the seat sags, and compare the toy's mass with the amount of paper used."
    },
    plan: [
      "How will you make the legs stiff? Rolled tubes? Folded columns?",
      "How will you keep the legs from spreading apart when the toy sits down?",
      "How will you make the seat stiff so it does not sag in the middle?",
      "Sketch two chair designs. Label the leg height, seat size, and where tape will go."
    ],
    build: [
      "Roll one sheet of paper tightly around a pencil the long way, tape it, and slide the pencil out. Cut this tube into 4 equal legs about 7 cm long.",
      "Fold a second sheet in half, then in half again, to make a thick rectangle about 10 cm × 7 cm for the seat.",
      "Tape one leg under each corner of the seat. Use small pieces of tape wrapped around the top of each leg.",
      "Cut thin strips from the third sheet and tape them between the legs, low down, as braces.",
      "Fold the rest of the third sheet into a stiff rectangle and tape it to the back of the seat as a backrest.",
      "Check that the chair stands level and that the seat is at least 6 cm high."
    ],
    testing: [
      "Find and record the toy's mass in grams (or use the 40-penny bag, about 100 g).",
      "Measure the chair's seat height, seat width, and seat depth.",
      "Stand a ruler upright next to the middle of the seat and record the seat height without the toy.",
      "Gently place the toy in the center of the seat the same way every time. Start the timer.",
      "While the toy is sitting, read the seat height again at the same spot. The difference is the deflection (sag).",
      "Watch for 30 seconds and record whether the chair held, sagged, or collapsed.",
      "Remove the toy and repeat steps 3–6 for 3 trials. If the chair collapses, record the result and build an identical chair for the next trial."
    ],
    tables: [
      {
        title: "Chair measurements",
        cols: ["Version", "Seat height (cm)", "Seat width (cm)", "Seat depth (cm)", "Paper sheets used", "Tape used (cm)"],
        rows: ["Original", "Improved"]
      },
      {
        title: "Load tests (toy mass: ______ g)",
        cols: ["Version & trial", "Seat height empty (cm)", "Seat height with toy (cm)", "Deflection (cm)", "Held 30 s? (yes/no)"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Deflection tells you how much the seat bends. Comparing mass with material shows how efficient your design is.",
      steps: [
        "Deflection = seat height empty − seat height with toy.",
        "Find the average deflection for each version.",
        "Mass supported per sheet of paper = toy mass ÷ number of sheets used.",
        "Change in deflection = original average − improved average."
      ],
      frame: "Deflection = ___ cm − ___ cm = ___ cm.   Mass per sheet = ___ g ÷ ___ sheets = ___ g per sheet."
    },
    improve: [
      "Change the leg shape (round tubes, square columns, or triangle columns).",
      "Add or move braces between the legs.",
      "Make the seat stiffer with folds, ribs, or a double layer.",
      "Shorten or lengthen the legs (while keeping the seat at least 6 cm high)."
    ],
    retest: "Build an improved chair using the same paper and tape limits and the same toy. Run 3 trials and compare average deflection and 30-second results with your original chair.",
    reflection: [
      "Which part of your first chair was weakest? What evidence showed you that?",
      "How did the deflection change after your redesign?",
      "Did using more paper always make the chair stronger? Explain with your data.",
      "How might a real furniture designer use what you learned?"
    ],
    extension: "Find the maximum load: put a small cup on the seat and add pennies 5 at a time until the seat sags 2 cm or collapses. Because this test can destroy the chair, build 2 identical chairs and test both. One result alone gives limited evidence.",
    safety: [
      "Use scissors carefully.",
      "Choose a toy that will not break if the chair collapses."
    ]
  },

  {
    id: "marble-delivery-ramp",
    title: "Marble Delivery Ramp",
    difficulty: "Easy",
    category: "Motion / Transport Systems",
    themes: ["machines"],
    keywords: ["marble", "ramp", "track", "gravity", "roller coaster", "delivery", "target", "cup", "friction", "turn"],
    challenge: "Build a gravity-powered track that delivers a marble into a target cup without letting it leave the track.",
    time: { active: "About 1½–2 hours", waiting: "None" },
    supplies: "Cardboard, paper towel tubes, tape, books, marble",
    format: "Individual or pairs",
    adult: "",
    problem: "Factories and warehouses use gravity-powered chutes and conveyors to move parts from one place to another without motors. A chute that drops parts on the floor wastes time and money, so the path has to be reliable.",
    mission: "Build a track that carries a marble from a fixed starting point, around at least one turn, and into a target cup, using only gravity.",
    criteria: [
      "Suggested challenge goal: the marble lands in the cup in at least 4 out of 5 runs.",
      "The marble stays on the track for the whole run.",
      "The track includes at least one turn."
    ],
    constraints: [
      "The starting point may be no higher than 30 cm above the table.",
      "The target cup must be at least 60 cm (measured along the table) from the starting point.",
      "The marble is released from the same spot every time, with no pushing.",
      "The whole track must fit on one desk or table."
    ],
    materials: [
      "3–4 paper towel or wrapping-paper tubes",
      "Cardboard from a cereal box or shipping box",
      "Masking tape",
      "Scissors",
      "Books or small boxes for supports",
      "1 marble (keep a spare)",
      "Paper cup for the target",
      "Ruler or tape measure",
      "Stopwatch"
    ],
    stem: {
      science: "Gravity pulls the marble down the slope, turning height into motion. Friction and bumps at joints slow it down. On a turn, the marble keeps trying to go straight, so it needs a wall to push it around the curve.",
      technology: "Your channels, barriers, and the funnel or catcher at the end are delivery mechanisms, like the chutes and guide rails in a factory.",
      engineering: "You must design a slope, a turn, and supports that keep the track steady. A track that is too steep may launch the marble; one that is too gentle may let it stop.",
      math: "You will calculate a success percentage and an average travel time, and compare them between designs."
    },
    plan: [
      "Where will the turn be? What will keep the marble from flying off at the turn?",
      "How steep should each section be? How will you measure the height of each support?",
      "How will the marble get into the cup? Will you add a funnel or backstop?",
      "Sketch two layouts from above (a bird's-eye view) and label heights at each support."
    ],
    build: [
      "Cut 2 paper towel tubes in half the long way to make open channels.",
      "Mark a starting point on a stack of books no higher than 30 cm. Tape the first channel so it slopes gently down from it.",
      "Make a turn by taping a curved strip of cardboard as a wall where two channels meet. Tape the joint so the lower channel is just under the upper one, like shingles.",
      "Support the track with books or boxes at each joint so it does not sag.",
      "Place the cup at least 60 cm from the start and tape it in place. Add a cardboard backstop behind the cup if you like.",
      "Roll the marble a few times and adjust supports until it reaches the end."
    ],
    testing: [
      "Mark the release point with tape. Hold the marble at the mark and let go. Do not push.",
      "Start the stopwatch when you let go and stop it when the marble lands in the cup or leaves the track.",
      "Record whether it was a success (landed in the cup) and the time.",
      "If it failed, record where it left the track.",
      "Repeat for 5 runs. Do not adjust the track between runs."
    ],
    tables: [
      {
        title: "Delivery runs",
        cols: ["Version & run", "In the cup? (yes/no)", "Travel time (s)", "Where it failed (if it did)"],
        rows: stemRows(5)
      }
    ],
    math: {
      intro: "Percentages let you compare reliability. Averages show the typical travel time.",
      steps: [
        "Success percentage = successful runs ÷ total runs × 100.",
        "Average travel time = add the times of the successful runs ÷ the number of successful runs.",
        "Change in success = improved percentage − original percentage."
      ],
      frame: "Success = ___ ÷ 5 × 100 = ___%.   Average time = ___ s ÷ ___ runs = ___ s."
    },
    improve: [
      "Add higher walls or a cover at the turn.",
      "Make one section less steep or more steep.",
      "Smooth the joints so the marble does not bump.",
      "Add a funnel at the cup."
    ],
    retest: "After changing one main feature, run 5 more trials with the same release point and the same marble. Compare success percentage and average travel time with your original design.",
    reflection: [
      "Where did the marble most often leave the track? What caused it?",
      "Did a faster run always mean a more successful run? Use your data.",
      "Which change improved reliability the most? How do you know?",
      "How is your track like a real factory chute?"
    ],
    extension: "Add a second turn or a drop, and find the steepest slope that still gives 5 out of 5 successes. Measure the slope of each section as rise ÷ run.",
    safety: [
      "Pick up marbles from the floor right away so no one slips.",
      "Keep marbles away from young children (choking hazard)."
    ]
  },

  {
    id: "foil-cargo-boat",
    title: "Foil Cargo Boat",
    difficulty: "Easy",
    category: "Buoyancy / Marine Engineering",
    themes: ["water"],
    keywords: ["boat", "foil", "aluminum", "float", "buoyancy", "cargo", "pennies", "hull", "displacement", "sink"],
    challenge: "Build a boat from one measured sheet of aluminum foil that carries the greatest load before water enters.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "Aluminum foil, basin of water, pennies or identical small weights",
    format: "Individual or pairs",
    adult: "",
    problem: "Cargo ships carry heavy loads across oceans. Ship designers must shape the hull so the ship floats high enough to stay dry while carrying as much cargo as possible.",
    mission: "Shape one 20 cm × 20 cm sheet of foil into a boat that carries as many pennies as possible before any water comes in.",
    criteria: [
      "The boat floats on its own when empty.",
      "The boat holds cargo without water coming over the sides.",
      "Suggested challenge goal: carry at least 25 pennies (about 62 g)."
    ],
    constraints: [
      "One 20 cm × 20 cm square of regular aluminum foil per boat.",
      "No tape, glue, or other materials.",
      "Every competing design uses the same size and type of foil.",
      "Weights are added one at a time in the same pattern each trial."
    ],
    materials: [
      "Aluminum foil (one roll of the same brand and thickness)",
      "Ruler and scissors",
      "Basin, sink, or plastic bin filled about 8 cm deep with water",
      "100 pennies or another set of identical small weights (washers or marbles)",
      "Towel",
      "Kitchen scale (optional, to check the mass of the weights)"
    ],
    toolNote: "No scale? Pennies made after 1982 have a mass of about 2.5 g each, so you can find total mass by counting.",
    stem: {
      science: "A boat floats because it pushes aside (displaces) water. The water pushes back up with a force equal to the weight of the water pushed aside. A wider, deeper hull can push aside more water before the sides go under.",
      technology: "Hull shapes, such as flat-bottomed barges and pointed ship hulls, are technologies people developed to carry loads on water.",
      engineering: "You must balance carrying capacity with stability. A huge, flat boat may hold a lot but tip when the load is uneven; tall sides help but use up foil.",
      math: "You will calculate total cargo mass, average it over several trials, and compare loads between designs."
    },
    plan: [
      "Will a wide, flat boat or a narrow, deep boat hold more? Why?",
      "How tall should the sides be? What happens to the floor area if the sides get taller?",
      "Where will you place the pennies so the boat does not tip?",
      "Sketch two hull shapes and label their length, width, and side height."
    ],
    build: [
      "Measure and cut a 20 cm × 20 cm square of foil.",
      "Fold up about 3 cm on each edge to form the sides.",
      "Pinch the corners together so they are watertight.",
      "Gently press the floor flat. Measure the boat's length, width, and side height.",
      "Float the empty boat and measure the freeboard: the height of the side above the waterline."
    ],
    testing: [
      "Float the boat in the middle of the basin.",
      "Add pennies one at a time, starting in the center and spreading them in the same pattern every trial. Wait about 2 seconds between pennies.",
      "Stop as soon as water enters the boat. Record the number of pennies that were in the boat just before water came in.",
      "Lift the boat out, dry it, and check that its shape did not change. If it was crushed or torn, build an identical boat from a new square.",
      "Repeat for 3 trials."
    ],
    tables: [
      {
        title: "Boat dimensions",
        cols: ["Version", "Length (cm)", "Width (cm)", "Side height (cm)", "Freeboard empty (cm)"],
        rows: ["Original", "Improved"]
      },
      {
        title: "Cargo trials",
        cols: ["Version & trial", "Pennies held", "Cargo mass (g)", "Observations (tipping, leaking, bending)"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Converting a penny count into grams lets you compare your boat with boats that used different weights.",
      steps: [
        "Cargo mass = number of pennies × 2.5 g (or use the mass of your own weights).",
        "Average cargo = add the 3 cargo masses ÷ 3.",
        "Floor area = length × width (cm²).",
        "Cargo per square centimeter of floor = average cargo ÷ floor area."
      ],
      frame: "Cargo = ___ pennies × 2.5 g = ___ g.   Floor area = ___ cm × ___ cm = ___ cm².   Load comparison: improved ___ g − original ___ g = ___ g."
    },
    improve: [
      "Change the side height while keeping the same foil size.",
      "Change the hull shape (square, rectangle, rounded, or pointed).",
      "Change how the cargo is arranged.",
      "Add folded ribs to the floor to keep it from bending."
    ],
    retest: "Build an improved boat from a new 20 cm × 20 cm square. Test it 3 times with the same weights and loading pattern, then compare average cargo mass with your original boat.",
    reflection: [
      "Which boat carried the most cargo on average? What feature do you think made the difference?",
      "How did the freeboard of the empty boat relate to how much it could carry?",
      "Did any boat tip before water came over the sides? What does that tell you about stability?",
      "Why is it important that each design uses the same size of foil?"
    ],
    extension: "Measure the water depth inside the basin before and after loading, or test in salt water (stir in about 4 tablespoons of salt per liter) and compare how much cargo the same design holds.",
    safety: [
      "Wipe up spilled water right away.",
      "Foil edges can be sharp. Fold them over, and wash your hands after handling pennies."
    ]
  },

  {
    id: "paper-chain-efficiency",
    title: "Paper Chain Efficiency Challenge",
    difficulty: "Easy",
    category: "Materials / Manufacturing",
    themes: ["materials"],
    keywords: ["paper chain", "links", "one sheet", "cutting pattern", "longest", "tension", "manufacturing", "efficiency"],
    challenge: "Make the longest hanging paper chain from one sheet of paper and a fixed amount of tape.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "Printer paper, tape, scissors, ruler",
    format: "Individual or pairs",
    adult: "",
    problem: "Factories try to get as many products as possible from each sheet of raw material, because wasted material costs money. A product also has to be strong enough to do its job.",
    mission: "Plan a cutting pattern and build the longest paper chain you can from one sheet of paper that can hang by itself without tearing.",
    criteria: [
      "Suggested challenge goal: the chain holds its own weight for 30 seconds when hung from one end.",
      "The chain is made of separate, connected links.",
      "Length is measured from the top of the first link to the bottom of the last link while it hangs."
    ],
    constraints: [
      "One sheet of printer paper (8.5 × 11 inch, about 21.6 × 27.9 cm) per chain.",
      "No more than 30 cm of tape per chain (your teacher may choose a different amount).",
      "No glue or staples.",
      "You must sketch your cutting plan before you cut."
    ],
    materials: [
      "2–4 sheets of printer paper (one per chain)",
      "Clear tape (30 cm per chain), measured with a ruler",
      "Scissors",
      "Ruler and pencil",
      "Meter stick or tape measure",
      "Timer",
      "A place to hang the chain, such as a hook, a pencil taped to the edge of a table, or a doorframe (with permission)"
    ],
    stem: {
      science: "When the chain hangs, every link is pulled by the weight of all the links below it. This pull is called tension. The top link carries the most tension, so it is the most likely to tear.",
      technology: "Repeated links and an efficient cutting pattern are manufacturing technologies. Factories plan cutting layouts to waste as little material as possible.",
      engineering: "You must balance length with strength. Thin strips make more links but may tear; wide strips are strong but give fewer links. Your tape limit also limits how many joints you can make.",
      math: "You will calculate the paper's area, the average length each link adds, and how many centimeters of chain you made per square centimeter of paper."
    },
    plan: [
      "How wide will each strip be? How long? How many strips can you get from one sheet?",
      "How will you join links with only 30 cm of tape? Could some links be joined without tape?",
      "Which links will carry the most tension? Should those be different?",
      "Draw your cutting plan on a sketch of the sheet, with measurements."
    ],
    build: [
      "On the back of the sheet, use a ruler to draw strips 2 cm wide along the long side. (This gives about 10 strips that are 27.9 cm long.)",
      "Cut each long strip into 3 pieces about 9 cm long.",
      "Cut the 30 cm of tape into 1 cm pieces.",
      "Loop the first strip into a ring with a small overlap and tape it.",
      "Thread the next strip through the ring, loop it, and tape it. Continue until you run out of strips or tape.",
      "Count your links and any leftover tape."
    ],
    testing: [
      "Hang the chain from its top link on the hook or pencil.",
      "Start the timer and watch for 30 seconds. Record whether it held.",
      "While it hangs, measure the length from the top of the first link to the bottom of the last link.",
      "Count the links and measure the width of one typical link.",
      "Take the chain down and hang it again for a total of 3 trials. If it tears, record where it tore and how many trials it survived."
    ],
    tables: [
      {
        title: "Chain trials",
        cols: ["Version & trial", "Held 30 s? (yes/no)", "Hanging length (cm)", "Number of links", "Link width (cm)", "Where it tore (if it did)"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Efficiency compares what you made with what you used.",
      steps: [
        "Paper area = sheet length × sheet width (for example, 27.9 cm × 21.6 cm).",
        "Average link contribution = chain length ÷ number of links.",
        "Material efficiency = chain length ÷ paper area (cm of chain per cm² of paper).",
        "Length gained = improved chain length − original chain length."
      ],
      frame: "Each link adds ___ cm ÷ ___ links = ___ cm.   Efficiency = ___ cm ÷ ___ cm² = ___ cm of chain per cm²."
    },
    improve: [
      "Change the strip width (for example, 1.5 cm instead of 2 cm).",
      "Change the strip length, which changes the size of each link.",
      "Use less tape per link so you can make more links.",
      "Make the top links wider than the bottom links."
    ],
    retest: "Make an improved chain from a new sheet with the same tape limit. Hang it for 3 trials and compare its length, efficiency, and 30-second results with the original.",
    reflection: [
      "Where did the chain tear, or where did it look most stretched? Why there?",
      "Did thinner strips give a longer chain? Did they hold?",
      "How did your tape limit affect your design?",
      "How could a factory use this kind of planning to save material?"
    ],
    extension: "Design a chain that is cut from the sheet already linked, with no tape at all. Compare its efficiency with your taped chain.",
    safety: [
      "Use scissors carefully.",
      "Get permission before hanging the chain from a doorframe, and do not stand on chairs."
    ]
  },

  {
    id: "recycled-desk-organizer",
    title: "Desk Organizer from Recycled Materials",
    difficulty: "Easy",
    category: "Product Design / Sustainability",
    themes: ["design", "materials"],
    keywords: ["organizer", "desk", "recycle", "recycled", "pencil holder", "cardboard", "boxes", "tubes", "storage", "stability", "tipping"],
    challenge: "Build a stable organizer that holds a specified set of pencils, an eraser, and other classroom supplies.",
    time: { active: "About 1½–2 hours", waiting: "About 1 hour if you use white glue (none with tape only)" },
    supplies: "Clean small boxes, paper tubes, cardboard, tape, glue",
    format: "Individual",
    adult: "Cutting thick cardboard; hot glue if used",
    problem: "Desks get cluttered, and supplies get lost or knocked onto the floor. A good organizer keeps tools easy to reach, does not tip over, and does not take up too much desk space. Using recycled materials keeps useful cardboard out of the trash.",
    mission: "Design and build an organizer from recycled materials that holds a set list of supplies, stays stable, and fits on a desk.",
    criteria: [
      "Holds all of these at once: 6 pencils, 1 eraser, 1 30 cm ruler, 1 glue stick, 1 pad of sticky notes, and 1 pair of scissors.",
      "Each item can be removed with one hand.",
      "Suggested challenge goal: does not tip over when the test board is tilted to 15 cm of rise (see testing)."
    ],
    constraints: [
      "Footprint no larger than 20 cm × 20 cm.",
      "Use recycled materials (clean boxes, tubes, cardboard) plus tape and glue only.",
      "No more than 1 m of tape."
    ],
    materials: [
      "Clean small boxes (cereal, tissue, or snack boxes)",
      "3–5 paper towel or toilet paper tubes",
      "Scrap cardboard",
      "Masking tape and white glue (hot glue only with an adult)",
      "Scissors",
      "Ruler",
      "The supply set: 6 pencils, eraser, 30 cm ruler, glue stick, sticky-note pad, scissors",
      "Test board: a clipboard, cutting board, or stiff piece of cardboard about 40 cm long",
      "A stack of books or a box to raise the board",
      "A second ruler to tape across the board as a stopper"
    ],
    stem: {
      science: "An object tips over when its center of mass moves outside its base. Tall compartments filled with heavy items raise the center of mass, while a wide base and heavy items placed low make the organizer harder to tip.",
      technology: "Compartments, dividers, and slots are storage technologies that make tools easy to find and reach.",
      engineering: "You are designing for a real user and a real need. You must fit every item, keep the footprint small, and still make the organizer stable.",
      math: "You will measure dimensions, calculate footprint area, and calculate how many items you store per 100 cm² of desk space."
    },
    plan: [
      "Measure each supply item. Which needs the tallest space? Which needs the widest?",
      "Where should heavy items go to keep it from tipping?",
      "How will a user reach each item with one hand?",
      "Sketch two layouts from above and from the side, with measurements."
    ],
    build: [
      "Measure the tallest item (probably the ruler or scissors) and the base size you have to work with.",
      "Cut a cardboard base 18 cm × 18 cm (an adult should cut thick cardboard).",
      "Cut tubes to different heights for pencils and the glue stick, and glue or tape them to the base.",
      "Cut a small box down to make an open tray for the eraser and sticky notes.",
      "Make a tall, narrow slot for the ruler and scissors from folded cardboard.",
      "Let glue dry fully before testing. Load all the supplies."
    ],
    testing: [
      "Measure the footprint (length and width of the base) and the tallest height.",
      "Load the full supply set in the same places every time.",
      "Tape a ruler across the low end of the test board as a stopper so the organizer cannot slide off.",
      "Set the organizer on the board against the stopper, with its tallest side facing downhill.",
      "Slowly raise the other end of the board with books. Measure the height of the raised end at the moment the organizer begins to tip.",
      "Record the height. If it did not tip by 15 cm of rise, record “no tip.”",
      "Repeat for 3 trials."
    ],
    tables: [
      {
        title: "Organizer measurements",
        cols: ["Version", "Footprint length (cm)", "Footprint width (cm)", "Footprint area (cm²)", "Tallest height (cm)", "Items stored"],
        rows: ["Original", "Improved"]
      },
      {
        title: "Tipping test (board length: ______ cm)",
        cols: ["Version & trial", "Rise when tipping began (cm)", "Tipped or slid?", "Observations"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Area tells how much desk space your organizer uses. Storage density tells how well you used that space.",
      steps: [
        "Footprint area = length × width.",
        "Items stored per 100 cm² = number of items ÷ footprint area × 100.",
        "Average tipping rise = add the 3 rises ÷ 3.",
        "Compare: improved average − original average."
      ],
      frame: "Area = ___ cm × ___ cm = ___ cm².   Items per 100 cm² = ___ ÷ ___ × 100 = ___."
    },
    improve: [
      "Move the heaviest items lower or closer to the center.",
      "Widen the base or add a flared “foot.”",
      "Shorten the tallest compartment.",
      "Rearrange compartments so the tall slot is in the middle."
    ],
    retest: "Rebuild or adjust your organizer, keeping the same supply set and footprint limit. Run 3 tipping trials and compare the average rise and storage density with your original.",
    reflection: [
      "Which direction did your organizer tip most easily? Why?",
      "How did moving heavy items change the results? Use your data.",
      "Was there a trade-off between small footprint and stability?",
      "What would a real user like or dislike about your design?"
    ],
    extension: "Measure the board's angle at the tipping point with a protractor, or calculate the slope as rise ÷ board length. Compare the angle at which tall and short designs tip.",
    safety: [
      "An adult should cut thick cardboard and run any hot-glue gun.",
      "Use only clean, empty boxes and containers.",
      "Point scissors down when you place them in the organizer."
    ]
  },

  {
    id: "cup-to-cup-water-transport",
    title: "Cup-to-Cup Water Transport",
    difficulty: "Easy",
    category: "Fluids / Infrastructure",
    themes: ["water", "structures"],
    keywords: ["water", "channel", "aqueduct", "gutter", "pipe", "transport", "spill", "leak", "gravity", "flow"],
    challenge: "Build a gravity-fed channel that transfers water between two containers with minimal spilling.",
    time: { active: "About 1½ hours", waiting: "None" },
    supplies: "Foil, straws, plastic channels, supports, tape, trays",
    format: "Individual or pairs",
    adult: "",
    problem: "Towns need to move water from a source to where people use it. Long ago, people built aqueducts; today, we use gutters, channels, and pipes. Leaks waste water, so the system needs to be well sealed and well supported.",
    mission: "Build a channel system that carries water from a starting cup to a collection container using only gravity, while losing as little water as possible.",
    criteria: [
      "Water travels from the start cup to the collection container with no one touching the channel.",
      "Suggested challenge goal: collect at least 80% of the water poured."
    ],
    constraints: [
      "The collection container sits at least 60 cm away (measured along the table) from the start point.",
      "The start point is no more than 20 cm higher than the top of the collection container.",
      "Use only foil, straws, plastic channels (for example, cut plastic bottles), tape, and supports.",
      "Pour 250 mL each trial, the same way each time."
    ],
    materials: [
      "Aluminum foil",
      "Plastic straws (wide ones work best)",
      "Plastic channels, such as clean plastic bottles cut in half the long way by an adult",
      "Waterproof tape (duct tape or packing tape)",
      "Books, boxes, or blocks for supports",
      "Measuring cup (mL)",
      "Collection container (bowl or second measuring cup)",
      "Large tray or baking pan under the whole setup",
      "Towels",
      "Stopwatch",
      "Food coloring (optional, makes leaks easier to see)"
    ],
    stem: {
      science: "Gravity pulls water downhill. Water flows faster on steeper slopes and can splash out at sharp bends. Water also clings to surfaces and drips out of loose joints.",
      technology: "Gutters, channels, and aqueducts are water-moving technologies. Your joints work like the connections between real pipe sections.",
      engineering: "You must choose a slope, support the channel so it does not sag, and seal connections so they do not leak.",
      math: "You will calculate water lost and the percentage of water successfully collected."
    },
    plan: [
      "How steep should the channel be? What might happen if it is too steep or too flat?",
      "How will you connect sections so water does not leak at the joints?",
      "Where will the channel need supports?",
      "Sketch two designs from the side, showing heights and support locations."
    ],
    build: [
      "Set the whole build area on a tray. Place the collection container at the low end.",
      "Fold foil into a U-shaped channel about 5 cm wide with sides at least 2 cm high. Make 2 or 3 sections.",
      "Overlap the sections like roof shingles (upper section on top) and tape the joints from underneath.",
      "Support the channel with books so it slopes gently downhill the whole way, with no low spots where water can pool.",
      "Place the upper end where you will pour. Make sure the lower end hangs over the collection container."
    ],
    testing: [
      "Measure exactly 250 mL of water in the measuring cup.",
      "Pour it into the top of the channel steadily over about 5 seconds, from the same spot each time.",
      "Start the stopwatch when you begin pouring and stop it when the water stops dripping into the container.",
      "Measure the water collected in mL.",
      "Water lost = 250 mL − collected. Note where any leaks happened.",
      "Empty and dry the container. Repeat for 3 trials."
    ],
    tables: [
      {
        title: "Water transport trials",
        cols: ["Version & trial", "Water poured (mL)", "Water collected (mL)", "Water lost (mL)", "Transfer time (s)", "Leak locations"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Percent collected lets you compare systems even if the amounts change.",
      steps: [
        "Water lost = water poured − water collected.",
        "Percent collected = water collected ÷ water poured × 100.",
        "Average percent collected = add the 3 percentages ÷ 3.",
        "Improvement = improved average − original average (in percentage points)."
      ],
      frame: "Percent collected = ___ mL ÷ 250 mL × 100 = ___%."
    },
    improve: [
      "Seal or redesign the leakiest joint.",
      "Change the slope of one section.",
      "Make the channel walls taller at turns.",
      "Use a different channel material (straws, foil, or plastic)."
    ],
    retest: "Make one main change and run 3 more trials with the same 250 mL pour. Compare average percent collected and transfer time with your original system.",
    reflection: [
      "Where did your system lose the most water? How do you know?",
      "Did a faster transfer mean more or less water lost?",
      "Which change helped the most? Use your measurements.",
      "How are your problems like the problems engineers face with real gutters or water pipes?"
    ],
    extension: "Add a required turn or a longer distance (1 m), or measure the flow rate in mL per second and compare different slopes.",
    safety: [
      "Keep water away from outlets, cords, and electronics.",
      "Work over a tray and wipe up spills right away.",
      "An adult should cut plastic bottles; cut edges can be sharp."
    ]
  },

  {
    id: "windproof-model-shelter",
    title: "Windproof Model Shelter",
    difficulty: "Easy",
    category: "Structures / Weather Engineering",
    themes: ["structures", "earth"],
    keywords: ["shelter", "wind", "fan", "house", "roof", "storm", "hurricane", "drag", "anchor", "weather"],
    challenge: "Build a small shelter that stays in place and protects a lightweight paper figure from a fan's airflow.",
    time: { active: "About 1½ hours", waiting: "None" },
    supplies: "Paper, cardboard, tape, reusable adhesive, guarded fan",
    format: "Individual or pairs",
    adult: "Setting up and plugging in the fan",
    problem: "Strong winds from storms can lift roofs, push buildings, and damage shelters. Engineers design roof shapes, bracing, and anchors that help buildings stay in place and protect the people inside.",
    mission: "Build a small shelter that protects a paper figure inside it and stays in place when a fan blows on it.",
    criteria: [
      "The shelter stays in place (moves less than 1 cm).",
      "The paper figure inside stays standing.",
      "Suggested challenge goal: pass all 3 trials at the 30 cm fan distance."
    ],
    constraints: [
      "Footprint no larger than 15 cm × 15 cm and height no more than 15 cm.",
      "The shelter must have a door opening at least 4 cm wide, facing sideways (not toward the fan).",
      "Use no more than 2 sheets of paper, one 20 cm × 30 cm piece of cardboard, and 50 cm of tape.",
      "Base attachment: no more than 4 pea-sized pieces of reusable adhesive. No tape to the table."
    ],
    materials: [
      "Printer paper",
      "Thin cardboard (cereal box)",
      "Masking tape",
      "Reusable adhesive putty",
      "Scissors and ruler",
      "Paper figure: an index-card strip 5 cm tall, folded to stand up",
      "Box fan or desk fan with a guard over the blades",
      "Tape measure and masking tape to mark fan distances",
      "Pencil to trace the shelter's starting outline",
      "Stopwatch"
    ],
    stem: {
      science: "Moving air pushes on any surface it hits. This push is called drag. Flat walls facing the wind catch a lot of air, while sloped or curved shapes let air flow around. Air flowing over a roof can also lift it.",
      technology: "Roof shapes, braces, and anchors are building technologies that help structures survive storms.",
      engineering: "You must improve your shelter within strict material and size limits, so every change has a cost.",
      math: "You will measure dimensions, test at set distances, and calculate success rates."
    },
    plan: [
      "Which roof shape might let wind pass over most easily?",
      "Which wall should face the fan? Should it be flat, angled, or curved?",
      "Where will you place your 4 pieces of adhesive to anchor it best?",
      "Sketch two shelters from the front and side, with measurements."
    ],
    build: [
      "Cut a cardboard floor 12 cm × 12 cm.",
      "Fold paper walls 8 cm tall and tape them around three sides of the floor. Leave a 4 cm door on one side.",
      "Fold a paper roof that overhangs the walls slightly and tape it on.",
      "Stand the paper figure inside.",
      "Press 4 small pieces of reusable adhesive under the corners of the floor."
    ],
    testing: [
      "An adult places the fan on the table and plugs it in. Mark distances of 90 cm, 60 cm, and 30 cm from the front of the fan with tape.",
      "Set the fan to the same speed for every test. Do not change it.",
      "Place the shelter at the 90 cm mark with the same side facing the fan each time. Trace around its base with a pencil.",
      "Turn on the fan for 15 seconds, then turn it off.",
      "Measure how far the shelter moved from its outline, and record whether the figure stayed standing and any damage.",
      "Repeat 3 trials at 90 cm, then 3 at 60 cm, then 3 at 30 cm. Stop testing at a distance once the shelter has failed there."
    ],
    tables: [
      {
        title: "Wind tests (fan speed setting: ______)",
        cols: ["Version, distance & trial", "Shelter moved (cm)", "Figure standing? (yes/no)", "Damage observed", "Passed? (yes/no)"],
        rows: [
          "Original – 90 cm – 1", "Original – 90 cm – 2", "Original – 90 cm – 3",
          "Original – 60 cm – 1", "Original – 60 cm – 2", "Original – 60 cm – 3",
          "Original – 30 cm – 1", "Original – 30 cm – 2", "Original – 30 cm – 3",
          "Improved – 90 cm – 1", "Improved – 90 cm – 2", "Improved – 90 cm – 3",
          "Improved – 60 cm – 1", "Improved – 60 cm – 2", "Improved – 60 cm – 3",
          "Improved – 30 cm – 1", "Improved – 30 cm – 2", "Improved – 30 cm – 3"
        ]
      }
    ],
    math: {
      intro: "A success rate at each distance shows how close to the fan your shelter can survive.",
      steps: [
        "Success rate at a distance = trials passed ÷ trials run × 100.",
        "Average movement at a distance = add the movements ÷ number of trials.",
        "Find the closest distance where the shelter passed every trial."
      ],
      frame: "At ___ cm: ___ passed ÷ 3 trials × 100 = ___%."
    },
    improve: [
      "Change the roof shape (flat, peaked, or curved).",
      "Angle or curve the wall that faces the fan.",
      "Move the adhesive pieces to different spots.",
      "Add paper braces inside the walls."
    ],
    retest: "Change one main feature, then test the improved shelter with the same fan speed, distances, and 15-second time. Compare success rates at each distance.",
    reflection: [
      "What failed first: the anchor, the walls, the roof, or the figure? Why?",
      "How did the closest passing distance change after your redesign?",
      "Which change made the biggest difference? Support your answer with data.",
      "How do real builders protect homes from strong winds?"
    ],
    extension: "Test the shelter facing the fan at different angles (0°, 45°, 90°) to see how wind direction changes the results.",
    safety: [
      "Use only a fan with a guard over the blades. An adult sets up and plugs in the fan.",
      "Keep fingers, hair, and paper away from the fan guard.",
      "Turn the fan off before reaching near it to move your shelter."
    ]
  },

  {
    id: "protective-package-drop",
    title: "Protective Package Drop",
    difficulty: "Easy",
    category: "Materials / Packaging Engineering",
    themes: ["materials"],
    keywords: ["package", "packaging", "drop", "cracker", "cushion", "impact", "box", "shipping", "egg drop", "protect"],
    challenge: "Design a small package that protects a brittle cracker during a short drop.",
    time: { active: "About 1–1½ hours", waiting: "None" },
    supplies: "Small box, scrap paper, cardboard, tape, matching crackers",
    format: "Individual or pairs",
    adult: "",
    problem: "Online stores ship fragile products every day. Packages get dropped and bumped along the way. Packaging engineers protect products without making the package too heavy or wasteful, because extra mass costs more to ship.",
    mission: "Design a reusable package that protects a cracker when it is dropped from a set height, using as little material as you can.",
    criteria: [
      "Suggested challenge goal: an average damage score of 1 or lower (see the damage scale).",
      "The package can be opened and closed again so a fresh cracker can be loaded for each trial.",
      "The package must fit inside a 15 cm × 15 cm × 10 cm space."
    ],
    constraints: [
      "One small box (such as a tea or snack box), 2 sheets of scrap paper, one 20 cm × 20 cm piece of cardboard, and 50 cm of tape.",
      "No bubble wrap, cotton balls, or foam unless your teacher adds them to everyone's list.",
      "Drop height: 1 m, the same for every trial."
    ],
    materials: [
      "One small box per package",
      "Scrap paper, cardboard, and tape",
      "At least 8 identical crackers of the same brand (for example, square saltines)",
      "Meter stick and masking tape to mark the 1 m drop height",
      "Tray or shallow box on the floor to catch crumbs",
      "Kitchen scale (optional, to weigh the package)"
    ],
    toolNote: "No scale? Compare packages by counting the sheets of paper and centimeters of tape used instead of their mass.",
    stem: {
      science: "When a falling package hits the floor, it stops very quickly, and that sudden stop creates a large force. Cushioning materials squish and spread the stop over a little more time and distance, which lowers the force on the cracker.",
      technology: "Packaging inserts, crumpled paper, and suspension systems are protective technologies used to ship fragile items.",
      engineering: "You must protect the cracker using limited material, and the package must be easy to repack. Adding more padding may help, but it also adds mass.",
      math: "You will use a damage scale to turn observations into numbers, find average damage scores, and compare package masses."
    },
    plan: [
      "Should the cracker be held still in the middle, or cushioned on all sides? Why?",
      "Which side of the package might hit the floor first? Will that change?",
      "How will you open and repack the package quickly for each trial?",
      "Sketch two package designs, showing the inside layers."
    ],
    build: [
      "Crumple 1 sheet of scrap paper loosely and place it in the bottom of the box.",
      "Cut a cardboard rectangle slightly larger than the cracker to make a stiff tray.",
      "Place the cracker on the tray and the tray on the crumpled paper.",
      "Crumple the second sheet loosely and place it on top.",
      "Close the box and seal it with one strip of tape that can be peeled back."
    ],
    testing: [
      "Mark a height of 1 m on a wall or table leg with tape. Place the tray on the floor below.",
      "Weigh the package with the cracker inside (or record the materials used).",
      "Hold the package with its bottom flat and level, with the bottom at the 1 m mark. Release it without throwing.",
      "Open the package and score the cracker using the damage scale: 0 = no visible damage, 1 = small chips or crumbs only, 2 = one crack, 3 = broken into 2–3 pieces, 4 = broken into more than 3 pieces or crushed.",
      "Use a fresh cracker for every trial. Run 3 trials."
    ],
    tables: [
      {
        title: "Drop trials (drop height: 100 cm)",
        cols: ["Version & trial", "Package mass (g) or materials used", "Damage score (0–4)", "Observations"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "A scoring scale turns “kind of broken” into numbers you can average and compare.",
      steps: [
        "Average damage score = add the 3 scores ÷ 3.",
        "Change in damage = original average − improved average.",
        "Change in mass = improved package mass − original package mass.",
        "Decide: did the improvement in protection outweigh any added mass?"
      ],
      frame: "Average damage = (___ + ___ + ___) ÷ 3 = ___.   Mass change = ___ g − ___ g = ___ g."
    },
    improve: [
      "Change how the cracker is held: cushioned on all sides or suspended in the middle.",
      "Change the cushioning material or how tightly it is crumpled.",
      "Add folded cardboard “crumple zones” to the corners.",
      "Use less material and see if protection stays the same."
    ],
    retest: "Change one main feature and run 3 more drops from the same 1 m height with fresh crackers. Compare average damage scores and package mass with your original design.",
    reflection: [
      "Which design had the lowest average damage? What evidence do you have?",
      "Were your 3 trials of the same design similar or very different? What might explain differences?",
      "Did adding more material always mean less damage?",
      "How would you balance protection and shipping cost for a real company?"
    ],
    extension: "Test at 1.5 m, or drop the package on a corner instead of a flat side. Keep everything else the same and compare damage scores.",
    safety: [
      "Drop from a safe height while standing on the floor. Do not climb on chairs or desks.",
      "Do not eat any tested crackers or crumbs.",
      "Sweep up crumbs so they do not attract pests."
    ]
  },

  {
    id: "shadow-clock",
    title: "Shadow Clock",
    difficulty: "Easy",
    category: "Earth and Space Science / Measurement Technology",
    themes: ["measure", "earth"],
    keywords: ["shadow", "sundial", "sun", "clock", "time", "earth", "rotation", "calibrate", "outdoors"],
    challenge: "Build and calibrate a simple shadow clock that estimates the time during a later observation.",
    time: { active: "About 1 hour total, spread over 2 days", waiting: "Calibration marks every hour for about 5 hours on one sunny day, then testing on a later sunny day" },
    supplies: "Cardboard base, upright pencil or stick, ruler, clock",
    format: "Individual or pairs",
    adult: "",
    problem: "Long before clocks with gears, people told time with the Sun. Even today, a simple tool that works without batteries can be useful. To be trusted, any measuring tool must be calibrated (checked against a known standard).",
    mission: "Build a shadow clock, mark it against a real clock on one sunny day, and then use it to estimate the time on a later day.",
    criteria: [
      "The clock has clear hour marks made during calibration.",
      "Suggested challenge goal: estimates are within 15 minutes of the actual time.",
      "The clock can be set back in exactly the same place and direction."
    ],
    constraints: [
      "Base no larger than 30 cm × 40 cm.",
      "The shadow-casting stick (gnomon) is no taller than 15 cm.",
      "Calibration and testing happen in the same location with the base pointed the same way."
    ],
    materials: [
      "Stiff cardboard about 30 cm × 40 cm",
      "Pencil, dowel, or straight stick (about 15 cm tall)",
      "Modeling clay or tape to hold the stick upright",
      "Ruler and marker",
      "Watch or clock",
      "Chalk or masking tape to mark the base's location on the ground",
      "A few small rocks to keep the base from blowing away",
      "Compass (optional)"
    ],
    stem: {
      science: "Earth rotates once about every 24 hours, so the Sun appears to move across the sky. As the Sun's position changes, the shadow of the stick changes direction and length. Around midday, the shadow is shortest.",
      technology: "Sundials are timekeeping tools that people have used for thousands of years. Your clock is a measuring instrument that you calibrate yourself.",
      engineering: "You must build a stable, repeatable setup: the stick must stay straight and the base must return to exactly the same position and direction.",
      math: "You will measure time intervals, shadow lengths, and the absolute error (how far off your estimate was) in minutes."
    },
    plan: [
      "Where is a spot that gets sun most of the school day and where the base will not be bumped?",
      "How will you make sure the base goes back in the same spot and direction?",
      "How will you hold the stick perfectly upright?",
      "Sketch your clock and how you will mark the hours."
    ],
    build: [
      "Poke or press the stick upright near one long edge of the cardboard, centered. Hold it with clay or tape so it stands straight up.",
      "Choose a sunny, flat spot. Set the base down and trace its corners on the ground with chalk or tape.",
      "Mark an arrow on the base and on the ground so you can line them up the same way each time.",
      "Weigh the corners down with rocks."
    ],
    testing: [
      "Calibration: on a sunny day, at each full hour (for example, 9:00, 10:00, 11:00, 12:00, 1:00, 2:00), mark the tip of the shadow with a dot and write the clock time beside it.",
      "Draw a line from the base of the stick to each dot. Measure and record the shadow length.",
      "Take the clock inside between days. Do not change the marks.",
      "Testing: on a later sunny day, set the base back exactly on its outline and arrow.",
      "Have a partner hide the time. Look at the shadow and estimate the time using your hour lines.",
      "Record your estimate and the actual clock time. Repeat at 3 different times of day."
    ],
    tables: [
      {
        title: "Calibration day (date: ________)",
        cols: ["Clock time", "Shadow length (cm)", "Notes (clouds, etc.)"],
        rows: ["9:00", "10:00", "11:00", "12:00", "1:00", "2:00"]
      },
      {
        title: "Testing day (date: ________)",
        cols: ["Version & trial", "Estimated time", "Actual time", "Absolute error (min)"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Absolute error tells how far off an estimate was, whether it was early or late.",
      steps: [
        "Absolute error = the difference between estimated time and actual time, in minutes, without a negative sign.",
        "Average absolute error = add the errors ÷ number of trials.",
        "Change in shadow length per hour = (length at one hour − length at the next hour)."
      ],
      frame: "Error = |___:___ − ___:___| = ___ minutes.   Average error = ___ min ÷ 3 = ___ min."
    },
    improve: [
      "Add half-hour marks between the hour marks.",
      "Use a taller or thinner stick, or a stick with a pointed tip, so the shadow tip is easier to read.",
      "Improve how the base lines up (for example, use a compass so the arrow always points north).",
      "Tilt the stick so it points toward the North Star's direction at an angle equal to your latitude (an advanced design called a polar gnomon)."
    ],
    retest: "Calibrate an improved clock (or add marks to your first one) and test it at 3 times on a later sunny day. Compare the average absolute error with your original clock.",
    reflection: [
      "When was your clock most accurate, and when was it least accurate? Why might that be?",
      "How did the shadow's length change during the day? When was it shortest?",
      "Why is calibration local? Would your marks work at a school in another state?",
      "Why might your marks become less accurate after several weeks?"
    ],
    extension: "Check your clock once a week for a month at the same clock time. Measure how the shadow tip moves away from your original mark as the seasons change.",
    safety: [
      "Never look directly at the Sun, even for a moment, and never look at it through anything.",
      "Use sunscreen and a hat if you will be outside for a while.",
      "Stay in a supervised area during school hours."
    ],
    note: "Calibration is local and seasonal. The Sun's path changes during the year, and your clock's marks only fit your location and the time of year when you made them. When daylight saving time starts or ends, clock times shift by one hour."
  },

  {
    id: "string-telephone-design-lab",
    title: "String Telephone Design Lab",
    difficulty: "Easy",
    category: "Sound / Communication Technology",
    themes: ["sound"],
    keywords: ["string telephone", "cup phone", "sound", "vibration", "communication", "string", "message", "words"],
    challenge: "Build a string telephone that communicates a short message clearly.",
    time: { active: "About 1–1½ hours", waiting: "None" },
    supplies: "Paper cups, several string types, marked testing space",
    format: "Pairs or teams of 3",
    adult: "Poking holes in the cup bottoms",
    problem: "Communication systems have to carry a message from one place to another clearly. Engineers improve them by testing how well real messages arrive, then changing one part at a time.",
    mission: "Build and improve a string telephone that carries spoken words clearly across a measured distance.",
    criteria: [
      "The listener writes down words spoken at a normal classroom voice.",
      "Suggested challenge goal: at least 8 out of 10 words received correctly at 5 m."
    ],
    constraints: [
      "Test distance: 5 m, the same every trial.",
      "Speak at a normal classroom voice, not a shout, every trial.",
      "Use a new, comparable word list for every trial so the listener cannot memorize words.",
      "Change only one feature at a time."
    ],
    materials: [
      "6 paper cups (the same size)",
      "At least 3 string types, about 6 m each (for example, cotton kitchen string, fishing line, yarn, dental floss)",
      "Paper clips (to anchor the string inside each cup)",
      "Pushpin or sharpened pencil (an adult pokes the holes)",
      "Tape measure and masking tape to mark the 5 m distance",
      "8 or more word lists of 10 simple, one-syllable words, written by a third person or your teacher",
      "Paper and pencil for the listener"
    ],
    stem: {
      science: "Your voice makes the bottom of the cup vibrate. When the string is tight, those vibrations travel along the string to the other cup, which vibrates and makes sound again. A slack string or soft string absorbs vibrations.",
      technology: "A string telephone is a mechanical communication system. Real telephones also turn sound into a signal, carry it, and turn it back into sound.",
      engineering: "You will improve the connections at the cups and the string tension and type, testing one change at a time.",
      math: "You will calculate the percentage of words received correctly and compare designs."
    },
    plan: [
      "Which string do you think will carry sound best? Why?",
      "How will you attach the string to the cup so vibrations pass through?",
      "How will you keep string tension the same each trial?",
      "Sketch your phone and label the parts that vibrate."
    ],
    build: [
      "An adult pokes a small hole in the center of the bottom of 2 cups.",
      "Thread one end of a 6 m cotton string through each hole from the outside.",
      "Tie each end around a paper clip inside the cup so it cannot pull back through.",
      "Stand 5 m apart (marked with tape) and pull the string tight. Make sure it does not touch anything."
    ],
    testing: [
      "The listener holds a cup to one ear; the speaker holds the other cup to their mouth. Keep the string straight and tight.",
      "The speaker reads a word list of 10 words in a normal classroom voice, about one word every 3 seconds.",
      "The listener writes down each word heard.",
      "Score the number of words correct out of 10.",
      "Use a new word list for each trial. Run 3 trials for each design.",
      "Switch roles if possible, but keep the same speaker for trials you will compare."
    ],
    tables: [
      {
        title: "Message tests (distance: 5 m)",
        cols: ["Design (string type & feature) & trial", "Word list used", "Words correct (out of 10)", "Percent correct", "Notes"],
        rows: stemRows(3, ["Cotton string", "String type 2", "String type 3", "Improved design"])
      }
    ],
    math: {
      intro: "Percent correct lets you compare designs even if word lists have different lengths.",
      steps: [
        "Percent correct = words correct ÷ words spoken × 100.",
        "Average percent correct = add the 3 percentages ÷ 3.",
        "Difference = best design's average − original design's average."
      ],
      frame: "Percent correct = ___ ÷ 10 × 100 = ___%.   Average = ___% ÷ 3 = ___%."
    },
    improve: [
      "Change the string type and keep everything else the same.",
      "Change the cup material or size (for example, plastic cups).",
      "Change the attachment (paper clip, toothpick, button).",
      "Test different string tensions (tight vs. slightly loose)."
    ],
    retest: "Choose your best string, change one more feature, and run 3 new trials with new word lists. Compare the average percent correct with your original cotton-string phone.",
    reflection: [
      "Which string carried words best? What is your evidence?",
      "What happened when the string touched something or went slack? Why?",
      "Why did you need a new word list for each trial?",
      "How is your phone like and unlike a modern phone?"
    ],
    extension: "Test the best design at 5, 10, and 15 m and graph percent correct against distance. Or build a three-way “party line” with a third cup.",
    safety: [
      "An adult pokes the holes in the cups.",
      "Never speak or yell loudly into a cup someone is listening to.",
      "Keep the string at waist height or lower so no one walks into it, and watch for people walking through."
    ]
  },

  {
    id: "cardboard-grabber",
    title: "Cardboard Grabber",
    difficulty: "Easy",
    category: "Mechanisms / Assistive Technology",
    themes: ["machines", "design"],
    keywords: ["grabber", "reacher", "claw", "assistive", "lever", "pivot", "cardboard", "pick up", "tongs"],
    challenge: "Build a hand-operated tool that picks up a lightweight object beyond normal reach.",
    time: { active: "About 1½ hours", waiting: "None" },
    supplies: "Cardboard strips, paper fasteners, tape, soft gripping pads",
    format: "Individual or pairs",
    adult: "Making holes for the paper fasteners",
    problem: "Some people have trouble bending or reaching because of an injury, age, or disability. Reacher-grabber tools help them pick things up without stretching. A good grabber is light, simple to use, and grips without dropping things.",
    mission: "Build a cardboard grabber that extends your reach and picks up lightweight objects reliably.",
    criteria: [
      "The grabber extends your reach by at least 30 cm beyond your fingertips.",
      "Suggested challenge goal: picks up each test object in at least 4 out of 5 attempts.",
      "Works with one hand."
    ],
    constraints: [
      "Total length no more than 60 cm.",
      "Use cardboard, paper fasteners (brads), tape, rubber bands, and soft pads only.",
      "Test objects must be lightweight: a crumpled paper ball, an empty paper cup, a pencil, and a cotton ball or pom-pom."
    ],
    materials: [
      "Corrugated cardboard cut into strips 3 cm × 45 cm (an adult cuts thick cardboard)",
      "Paper fasteners (brads)",
      "Pushpin or sharpened pencil to start holes (adult)",
      "Masking tape",
      "Soft gripping pads: craft foam, felt, rubber bands, or folded paper towel",
      "Ruler or meter stick",
      "Test objects: crumpled paper ball, empty paper cup, pencil, cotton ball"
    ],
    stem: {
      science: "Your grabber is made of levers that turn around a pivot (the paper fastener). Squeezing the handles makes the jaws close. Friction between the pads and the object keeps it from slipping out.",
      technology: "Reacher-grabbers are assistive technology that help people do everyday tasks independently.",
      engineering: "You must create moving linkages that close smoothly and gripping surfaces that hold different shapes.",
      math: "You will measure link lengths, calculate reach gain, and calculate success percentages."
    },
    plan: [
      "Where should the pivot go? What happens if the jaws are long and the handles are short, or the other way around?",
      "Which pad material will grip a smooth pencil and a soft cotton ball?",
      "How can the jaws reopen after you squeeze?",
      "Sketch two grabber designs and label lengths and the pivot."
    ],
    build: [
      "Tape 2 cardboard strips together to make one stiff arm. Repeat to make a second arm. (Each arm is 2 layers thick.)",
      "Lay the arms on top of each other in an X shape, crossing 10 cm from one end (the jaw end).",
      "An adult pokes a hole through both arms at the crossing point. Push a paper fastener through and open its legs loosely so the arms can pivot.",
      "Tape foam or felt pads on the inside tips of the jaws.",
      "Squeeze the long handle ends together and check that the jaw tips meet. Trim or adjust until they do."
    ],
    testing: [
      "Stand next to a table. Measure your normal reach: the distance from your shoulder to your fingertips with your arm straight out.",
      "Measure your reach while holding the grabber: shoulder to the tip of the jaws.",
      "Place a test object on the floor or table at a spot you can reach only with the grabber.",
      "Try to pick it up, lift it 20 cm, and hold it for 3 seconds. Record success or failure.",
      "Make 5 attempts for each test object."
    ],
    tables: [
      {
        title: "Grabber measurements",
        cols: ["Version", "Jaw length from pivot (cm)", "Handle length from pivot (cm)", "Reach with grabber (cm)", "Normal reach (cm)", "Reach gain (cm)"],
        rows: ["Original", "Improved"]
      },
      {
        title: "Pickup attempts (successes out of 5)",
        cols: ["Version", "Paper ball", "Paper cup", "Pencil", "Cotton ball", "Total successes (out of 20)"],
        rows: ["Original", "Improved"]
      }
    ],
    math: {
      intro: "Reach gain shows how much the tool helps. Success percentage shows how reliable it is.",
      steps: [
        "Reach gain = reach with grabber − normal reach.",
        "Success percentage = successes ÷ attempts × 100 (for each object and for all 20 attempts).",
        "Lever ratio = handle length ÷ jaw length. Compare how this ratio felt to use."
      ],
      frame: "Reach gain = ___ cm − ___ cm = ___ cm.   Success = ___ ÷ 20 × 100 = ___%."
    },
    improve: [
      "Move the pivot to change the lever ratio.",
      "Try a different pad material or pad shape.",
      "Add a rubber band or folded-cardboard spring to reopen the jaws.",
      "Stiffen the arms so they do not bend when squeezed."
    ],
    retest: "Change one main feature, then repeat 5 attempts with each test object. Compare the total success percentage and reach gain with your original grabber.",
    reflection: [
      "Which object was hardest to pick up? Why?",
      "How did changing the pivot or pads change your success rate? Use your numbers.",
      "Was there a trade-off between reach and grip strength?",
      "What would someone who uses a grabber every day want you to improve?"
    ],
    extension: "Build a “lazy tongs” (scissor-lift) linkage with 3 or more X-shaped sections to reach farther, and compare its reach gain and success rate with your simple grabber.",
    safety: [
      "An adult makes the holes for the paper fasteners and cuts thick cardboard.",
      "Use only lightweight test objects. Never try to lift anything heavy, sharp, or breakable.",
      "Keep the jaw end away from faces."
    ]
  },

  /* ===================== MEDIUM (8) ===================== */

  {
    id: "hand-crank-rescue-winch",
    title: "Hand-Crank Rescue Winch",
    difficulty: "Medium",
    category: "Simple Machines / Mechanical Engineering",
    themes: ["machines"],
    keywords: ["winch", "crank", "spool", "pulley", "lift", "rescue", "basket", "torque", "axle", "simple machine", "circumference"],
    challenge: "Build a winch that lifts a small “rescue basket” through a fixed height.",
    time: { active: "About 2–3 hours", waiting: "About 1 hour if you use white glue" },
    supplies: "Cardboard frame, spool or dowel, string, crank handle, small weights",
    format: "Pairs or teams of 3",
    adult: "Making axle holes in the cardboard frame",
    problem: "Rescue teams use winches to lift people and supplies up cliffs or out of deep places. A winch must lift a load smoothly, hold it without slipping, and let the operator predict how far the load will move.",
    mission: "Build a hand-cranked winch that lifts a small basket a fixed height of 50 cm, and predict how many crank turns it will take.",
    criteria: [
      "Lifts the basket the full 50 cm without the frame tipping or the string slipping.",
      "Suggested challenge goal: reliably lift 100 g (3 out of 3 trials).",
      "Your predicted number of turns is within 1 turn of the actual number."
    ],
    constraints: [
      "Lift height: 50 cm, measured from the floor (or a lower table) to the basket's starting point at the top.",
      "Safe load limit: no more than 200 g in the basket.",
      "Frame made of cardboard, tape, and glue. The axle is a dowel or pencil.",
      "The frame must sit on a table edge and may be held down with books or clamps, not by hand."
    ],
    materials: [
      "Sturdy cardboard (a shoebox works well as a frame)",
      "Wooden dowel or round pencil for the axle (about 1 cm thick and 20 cm long)",
      "Empty thread spool, paper tube, or bottle cap stack for the spool (optional)",
      "Strong string (1 m)",
      "Cardboard and a second pencil or short dowel for the crank handle",
      "Paper cup with a string handle as the rescue basket",
      "Pennies or washers as weights (40 pennies ≈ 100 g)",
      "Tape, white glue, ruler, meter stick, stopwatch",
      "Books to hold the frame down"
    ],
    toolNote: "No scale? Pennies made after 1982 are about 2.5 g each, so 40 pennies ≈ 100 g and 80 pennies ≈ 200 g.",
    stem: {
      science: "Turning the crank applies torque (a twisting force) to the axle. A longer crank arm lets you make the same torque with less force. The spool turns this rotation into straight-line lifting of the string.",
      technology: "Winches, cranes, and well buckets use the same lifting mechanism: a crank, an axle, and a spool that winds a cable.",
      engineering: "You must build a frame that does not bend or tip and attach the spool so it turns with the axle without slipping.",
      math: "Each full turn of the spool winds up one circumference of string. You will use circumference to predict lifting distance per turn and compare the prediction with measurements."
    },
    plan: [
      "How will the axle stay level and turn smoothly in the frame?",
      "How will you attach the string to the spool so it does not slip?",
      "How long should the crank arm be? How might that affect how hard it is to turn?",
      "How will you keep the basket from falling if you let go? (Think about a brake or catch.)",
      "Sketch two designs and label the spool diameter and crank length."
    ],
    build: [
      "Stand the shoebox on its side at the edge of a table. An adult pokes matching axle holes through both sides, about 4 cm from the top.",
      "Slide the dowel through both holes. It should turn freely without wobbling.",
      "Wrap tape around the middle of the dowel several times to make a thicker spool, or glue a thread spool onto it.",
      "Tape one end of the string firmly to the spool, then wrap it twice so it grips.",
      "Make a crank: glue or tape a 6 cm cardboard arm to one end of the dowel, and tape a short pencil to the end of the arm as a handle.",
      "Tie the basket to the free end of the string so it hangs over the table edge. Weigh the frame down with books."
    ],
    testing: [
      "Measure the spool's diameter with a ruler. Calculate your predicted turns for a 50 cm lift (see Math connection).",
      "Lower the basket so it rests 50 cm below the spool. Put 40 pennies (about 100 g) in it.",
      "Turn the crank at a steady pace and count full turns until the basket has risen 50 cm. Time the lift.",
      "Record turns, time, and any slipping, string stacking, or wobbling.",
      "Repeat for 3 trials at this load.",
      "To find the maximum reliable load, add 20 pennies (about 50 g) at a time, up to the 200 g limit, and run 3 trials at each load. The highest load that works 3 out of 3 times is your maximum reliable load."
    ],
    tables: [
      {
        title: "Prediction (spool diameter: ______ cm)",
        cols: ["Version", "Circumference (cm)", "Predicted turns for 50 cm", "Actual average turns", "Difference (turns)"],
        rows: ["Original", "Improved"]
      },
      {
        title: "Lifting trials",
        cols: ["Version, load & trial", "Load (g)", "Crank turns", "Lift time (s)", "Slipping or problems"],
        rows: stemRows(3, ["Original – 100 g", "Improved – 100 g"])
      },
      {
        title: "Maximum reliable load",
        cols: ["Version", "Load (g)", "Successful lifts (out of 3)"],
        rows: ["Original", "Original", "Original", "Improved", "Improved", "Improved"]
      }
    ],
    math: {
      intro: "Circumference is the distance around a circle. Each spool turn lifts the basket about one circumference.",
      steps: [
        "Circumference = π × diameter (use π ≈ 3.14).",
        "Predicted turns = lift height ÷ circumference.",
        "Compare: actual average turns − predicted turns.",
        "As string winds on top of itself, the spool gets thicker. Explain how that could make the actual number of turns smaller than predicted."
      ],
      frame: "Circumference = 3.14 × ___ cm = ___ cm.   Predicted turns = 50 cm ÷ ___ cm = ___ turns."
    },
    improve: [
      "Change the spool diameter (thinner or thicker) and predict the change before testing.",
      "Change the crank arm length.",
      "Add a ratchet or brake (for example, a cardboard tab that catches the crank) so the load cannot fall back.",
      "Strengthen or widen the frame to stop wobbling."
    ],
    retest: "Make one main change, predict the new number of turns, and run 3 trials at 100 g plus a new maximum-load test. Compare turns, time, and maximum reliable load with your original winch.",
    reflection: [
      "How close was your predicted number of turns to the actual number? What explains the difference?",
      "How did changing the spool or crank change the number of turns and how hard it was to crank?",
      "What limited your maximum load: the frame, the axle, the string, or the spool attachment?",
      "Why is a brake important on a real rescue winch?"
    ],
    extension: "Add a second spool of a different size on the same axle, or build a simple pulley at the top, and compare the turns and effort needed to lift the same load.",
    safety: [
      "Never suspend loads over people, and keep feet out from under the basket.",
      "Stay at or below the 200 g load limit.",
      "An adult makes the axle holes."
    ]
  },

  {
    id: "drawbridge-design-challenge",
    title: "Drawbridge Design Challenge",
    difficulty: "Medium",
    category: "Civil Engineering / Mechanisms",
    themes: ["structures", "machines"],
    keywords: ["drawbridge", "bridge", "hinge", "boat", "lift", "cable", "torque", "span", "clearance", "angle"],
    challenge: "Build a bridge that supports a small toy vehicle when lowered and opens to let a model boat pass.",
    time: { active: "About 2–3 hours", waiting: "About 1 hour if you use white glue" },
    supplies: "Cardboard, string, dowels, tape, simple hinges",
    format: "Pairs or teams of 3",
    adult: "Cutting cardboard and making holes",
    problem: "Some rivers carry both cars and tall boats. A fixed bridge would have to be very tall, so engineers build movable bridges that carry traffic and then lift out of the way for boats.",
    mission: "Build a drawbridge that spans a 25 cm “river,” holds a toy vehicle when lowered, and lifts high enough for a model boat to pass.",
    criteria: [
      "When lowered, the deck holds the toy vehicle (plus any added load) without sagging more than 1 cm.",
      "When raised, it leaves at least 15 cm of clearance for the boat.",
      "Suggested challenge goal: 10 out of 10 successful open-and-close cycles."
    ],
    constraints: [
      "Support span: 25 cm between two “banks” (stacks of books), the same for every design.",
      "Deck width: 8–10 cm.",
      "The bridge is operated with string, a crank, or a lever. You may not lift the deck with your hand.",
      "Cardboard, string, dowels or pencils, straws, tape, and paper fasteners only."
    ],
    materials: [
      "Corrugated cardboard",
      "String (about 1 m)",
      "Dowels, pencils, or wooden skewers (an adult cuts off sharp points)",
      "Straws (to use as hinge sleeves)",
      "Masking tape and paper fasteners",
      "Two equal stacks of books for the banks",
      "Small toy car and pennies to add load",
      "Model boat: a small box or block 15 cm tall",
      "Ruler, protractor"
    ],
    stem: {
      science: "The deck's weight creates torque around the hinge. Pulling the cable far from the hinge gives more torque for less force. When the deck is down, the vehicle's weight is shared by the hinge and the far bank.",
      technology: "Hinges, cables, and counterweights are the mechanisms that let real bascule and lift bridges move.",
      engineering: "You must combine structural strength (holding the vehicle) with movement (opening smoothly again and again). A heavy, strong deck may be harder to lift.",
      math: "You will measure span, clearance, and opening angle, and calculate cycle reliability as a percentage."
    },
    plan: [
      "Will you use one deck that lifts from one side, or two halves that meet in the middle?",
      "Where will the string attach to the deck? How high should the tower be?",
      "How will you stop the deck from sagging under the car?",
      "Could a counterweight make it easier to lift?",
      "Sketch two designs from the side, showing the hinge, cable, and angle when open."
    ],
    build: [
      "Set two stacks of books 25 cm apart. Cut a cardboard deck 32 cm × 9 cm so it rests about 3–4 cm on each bank.",
      "Make a tape hinge: tape one end of the deck to a 9 cm cardboard “abutment” piece that sits on the first bank, using tape on top and bottom so it folds.",
      "Glue or tape folded cardboard rails along both edges of the deck to stiffen it.",
      "Build a cardboard tower about 25 cm tall on the hinge bank, behind the hinge.",
      "Tie string to the far end of the deck, run it over the top of the tower (through a straw piece as a guide), and down to a pencil spool or handle.",
      "Pull the string to raise the deck. Adjust until it opens and closes smoothly."
    ],
    testing: [
      "Load test: lower the bridge, place the toy car in the middle of the deck, and measure the sag with a ruler. Add 10 pennies at a time to the car until the deck sags 1 cm. Record the total load (car + pennies). Run 3 trials.",
      "Clearance test: raise the bridge and measure the opening angle with a protractor and the clearance (the height of the open space where the boat passes).",
      "Check whether the 15 cm boat can pass without touching.",
      "Cycle test: open and close the bridge 10 times. A cycle is successful if it opens to full clearance and closes with the deck lying flat on the far bank.",
      "Record the number of successful cycles and any failures."
    ],
    tables: [
      {
        title: "Load tests (span: 25 cm)",
        cols: ["Version & trial", "Car mass (g)", "Added pennies", "Total load at 1 cm sag (g)"],
        rows: stemRows(3)
      },
      {
        title: "Opening and reliability",
        cols: ["Version", "Opening angle (°)", "Clearance (cm)", "Boat passed? (yes/no)", "Successful cycles (out of 10)"],
        rows: ["Original", "Improved"]
      }
    ],
    math: {
      intro: "Angles, distances, and percentages describe how well your bridge opens and how reliable it is.",
      steps: [
        "Cycle reliability = successful cycles ÷ total cycles × 100.",
        "Total load = car mass + (number of pennies × 2.5 g).",
        "Average load at 1 cm sag = add the 3 trials ÷ 3.",
        "Compare the opening angle you measured with the angle you planned in your sketch."
      ],
      frame: "Reliability = ___ ÷ 10 × 100 = ___%.   Total load = ___ g + (___ × 2.5 g) = ___ g."
    },
    improve: [
      "Move the cable attachment point farther from or closer to the hinge.",
      "Add a counterweight on the back of the deck.",
      "Change the hinge type (tape hinge vs. dowel in straw sleeves).",
      "Stiffen the deck with a truss pattern or deeper side rails."
    ],
    retest: "Keep the same 25 cm span, car, and boat. Make one main change, then repeat the load, clearance, and 10-cycle tests. Compare average load, clearance, and reliability with your original.",
    reflection: [
      "What part failed most often during the cycle test? Why?",
      "How did moving the cable or adding a counterweight change how hard it was to lift?",
      "Was there a trade-off between a strong deck and an easy-to-lift deck? Use your data.",
      "Why do real drawbridges need to be reliable thousands of times?"
    ],
    extension: "Build a two-leaf (double) drawbridge that meets in the middle, or add a crank with a spool, and compare its reliability and clearance with your single-leaf design.",
    safety: [
      "An adult cuts thick cardboard, pokes holes, and trims sharp ends off skewers.",
      "Keep fingers out of the hinge while the deck is moving."
    ]
  },

  {
    id: "rubber-band-powered-rover",
    title: "Rubber-Band-Powered Rover",
    difficulty: "Medium",
    category: "Energy / Vehicle Engineering",
    themes: ["energy", "machines"],
    keywords: ["rover", "car", "vehicle", "rubber band", "elastic", "energy", "wheels", "axle", "distance", "straight"],
    challenge: "Build a vehicle powered by energy stored in a twisted rubber band.",
    time: { active: "About 2–3 hours", waiting: "None" },
    supplies: "Cardboard chassis, wheels, axles, rubber bands, straws",
    format: "Individual or pairs",
    adult: "Poking axle holes and trimming skewer points",
    problem: "Rovers that explore other planets must travel as far as possible on stored energy and drive straight enough to reach a target. Engineers test wheel size, alignment, and friction to get the most distance from the energy available.",
    mission: "Build a rover that travels as far and as straight as possible on a rubber band wound a fixed number of turns.",
    criteria: [
      "The rover moves forward using only the rubber band's stored energy (no pushing).",
      "Suggested challenge goal: travel at least 2 m.",
      "Suggested challenge goal: end within 20 cm of the straight center line."
    ],
    constraints: [
      "Winding limit: 10 turns of the drive axle for every trial (never more than 15).",
      "Chassis no longer than 25 cm.",
      "One or two rubber bands only.",
      "Release from the same start line on the same smooth floor every trial."
    ],
    materials: [
      "Cardboard for the chassis (about 10 cm × 20 cm)",
      "2 plastic straws (axle sleeves)",
      "2 wooden skewers or thin dowels for axles (an adult trims sharp points)",
      "4 wheels: bottle caps, old CDs, or cardboard circles (all the same size on each axle)",
      "Rubber bands (the same type for all trials)",
      "Paper clip",
      "Tape, hot glue (with an adult) or reusable adhesive putty to fix wheels to axles",
      "Tape measure and masking tape for a start line and center line"
    ],
    stem: {
      science: "Twisting or stretching a rubber band stores elastic potential energy. When it unwinds, that energy turns the axle and becomes motion. Friction at the axles wastes some energy, while friction between the wheels and floor is needed for grip.",
      technology: "Axles in sleeves and a rubber-band drive are a mechanical drive system, like the drive trains that turn wheels in real vehicles.",
      engineering: "You will improve alignment (so it goes straight) and energy transfer (so less energy is wasted), testing one change at a time.",
      math: "You will calculate wheel circumference, predict distance from axle turns, average your distances, and measure straight-line error."
    },
    plan: [
      "How will you keep the axles parallel so the rover drives straight?",
      "How will the rubber band attach to the drive axle and the chassis?",
      "Should the drive wheels be big or small? Why?",
      "Where can friction be reduced, and where is friction helpful?",
      "Sketch two rover designs from above and from the side."
    ],
    build: [
      "Cut a cardboard chassis 10 cm × 20 cm.",
      "Tape 2 straws across the bottom of the chassis, one near each end. Use a ruler to make sure they are exactly parallel.",
      "Slide a skewer through each straw. Attach a wheel to each end of each skewer so the wheels are straight (an adult can use hot glue).",
      "Bend a paper clip into a hook and tape it to the middle of the rear axle.",
      "Cut a notch in the front of the chassis. Hook one end of the rubber band on the notch and the other on the paper clip.",
      "Check that the wheels spin freely without rubbing on the chassis."
    ],
    testing: [
      "Mark a start line and a straight center line on the floor with tape.",
      "Wind the drive axle exactly 10 turns by rolling the rover backward or turning the wheels.",
      "Place the rover at the start line, centered, and let go without pushing.",
      "Measure the forward distance from the start line to the front of the rover, and the sideways distance from the center line.",
      "Run 3 trials. Use the same rubber band, winding count, and floor."
    ],
    tables: [
      {
        title: "Rover runs (winding turns: 10)",
        cols: ["Version & trial", "Forward distance (cm)", "Sideways deviation (cm)", "Notes (wobble, skidding, stopping)"],
        rows: stemRows(3)
      },
      {
        title: "Wheel prediction",
        cols: ["Version", "Drive-wheel diameter (cm)", "Circumference (cm)", "Predicted powered distance (cm)", "Average actual distance (cm)"],
        rows: ["Original", "Improved"]
      }
    ],
    math: {
      intro: "Each turn of the drive axle moves the rover forward one wheel circumference, unless the wheels skid.",
      steps: [
        "Circumference = π × wheel diameter (π ≈ 3.14).",
        "Predicted powered distance = number of winding turns × circumference.",
        "Average distance and average deviation = add the 3 trials ÷ 3.",
        "Compare actual and predicted distance. Coasting can make the actual distance longer; skidding and friction can make it shorter."
      ],
      frame: "Circumference = 3.14 × ___ cm = ___ cm.   Predicted = 10 turns × ___ cm = ___ cm."
    },
    improve: [
      "Change the drive-wheel size.",
      "Add grip to the drive wheels (rubber bands or tape around the edge).",
      "Reduce axle friction (smoother sleeves, less rubbing).",
      "Improve axle alignment to reduce sideways deviation."
    ],
    retest: "Make one main change, keep the 10-turn winding and the same rubber band, and run 3 trials. Compare average distance and deviation with your original rover.",
    reflection: [
      "How close was your predicted distance to your actual distance? What explains the difference?",
      "What caused your rover to curve? How do you know?",
      "Which change made the biggest difference in distance? Use your averages.",
      "What happens to the rubber band's stored energy by the time the rover stops?"
    ],
    extension: "Test 5, 10, and 15 winding turns and graph distance against turns. Is the relationship a straight line?",
    safety: [
      "Set a modest winding limit (no more than 15 turns) so bands do not snap.",
      "Do not stretch rubber bands near faces or aim them at anyone.",
      "An adult trims sharp skewer points and runs any hot-glue gun.",
      "Test in an open area where no one will step on the rover."
    ]
  },

  {
    id: "mechanical-coin-sorter",
    title: "Mechanical Coin Sorter",
    difficulty: "Medium",
    category: "Automation / Product Engineering",
    themes: ["robotics", "machines"],
    keywords: ["coin", "sorter", "sort", "token", "ramp", "automation", "diameter", "tolerance", "gravity", "jam"],
    challenge: "Build a gravity-powered device that separates at least three sizes of coins or uniform circular tokens.",
    time: { active: "About 2–3 hours", waiting: "None" },
    supplies: "Cardboard, rulers, collection cups, coins or tokens",
    format: "Pairs or teams of 3",
    adult: "Cutting openings in cardboard with a craft knife",
    problem: "Vending machines, banks, and recycling centers sort objects automatically. Machines that sort by size often use no electronics at all, just carefully sized openings and gravity.",
    mission: "Build a gravity-powered sorter that separates a mixed set of coins (or tokens) into separate cups by size.",
    criteria: [
      "Separates at least 3 sizes into separate cups.",
      "Runs on gravity only. You may drop coins in one at a time but may not guide them.",
      "Suggested challenge goal: at least 90% of coins sorted correctly with no more than 1 jam per run."
    ],
    constraints: [
      "Use the same mixed set every trial: for example, 5 dimes, 5 pennies, and 5 nickels (add 5 quarters for a 4-size challenge).",
      "Footprint no larger than 40 cm × 30 cm.",
      "Cardboard, rulers, tape, and cups only. No electronics."
    ],
    materials: [
      "Corrugated cardboard and thin cardboard (cereal box)",
      "Ruler with millimeters",
      "Masking tape and glue",
      "Pencil and a compass or round objects to trace circles",
      "Craft knife (adult only) and scissors",
      "3–4 paper cups for collection",
      "Books to tilt the sorter",
      "Mixed coin set (low-value coins) or circular cardboard or plastic tokens of 3–4 sizes",
      "Stopwatch"
    ],
    toolNote: "No coins? Cut circular tokens from thick cardboard at these diameters: 18 mm, 19 mm, 21 mm, and 24 mm. These match a U.S. dime, penny, nickel, and quarter.",
    stem: {
      science: "Gravity pulls each coin down the ramp. Friction slows coins and can make them stick. A coin falls through an opening only if the opening is wider than the coin's diameter.",
      technology: "This is mechanical sorting and automation without electronics, the same idea used in older vending machines and coin counters.",
      engineering: "You must design openings and pathways with the right tolerance (the extra space beyond the coin's size). Too tight and coins jam; too loose and larger coins fall through the wrong hole.",
      math: "You will measure diameters, calculate clearances, and calculate sorting accuracy as a percentage."
    },
    plan: [
      "In what order should the openings be: smallest first or largest first? Why?",
      "How much bigger than each coin should each opening be?",
      "How steep should the ramp be so coins roll or slide but do not bounce?",
      "How will you guide coins so they stay lined up with the openings?",
      "Sketch two sorter designs from above and from the side."
    ],
    build: [
      "Measure each coin's diameter in millimeters and record it.",
      "Cut a cardboard ramp 35 cm × 6 cm. Tape thin cardboard walls along both sides so coins travel in a lane.",
      "Mark 3 openings along the ramp, smallest first. Make each one about 1–2 mm wider than the coin it should catch.",
      "An adult cuts the openings with a craft knife.",
      "Prop the top of the ramp on books so it slopes about 10–15 cm over its length. Tilt it slightly sideways so coins ride along one wall.",
      "Place a cup under each opening and one at the end of the ramp for the largest coins."
    ],
    testing: [
      "Mix the coin set. Start the stopwatch.",
      "Drop coins one at a time onto the top of the ramp at the same spot, flat side down.",
      "Count a jam each time a coin stops and has to be freed. Free it with a pencil and keep going.",
      "Stop the stopwatch when the last coin lands.",
      "Count the coins in each cup. Record how many were sorted correctly.",
      "Run 3 trials with the same coin set."
    ],
    tables: [
      {
        title: "Opening sizes",
        cols: ["Coin or token", "Diameter (mm)", "Original opening (mm)", "Original clearance (mm)", "Improved opening (mm)", "Improved clearance (mm)"],
        rows: ["Size 1 (smallest)", "Size 2", "Size 3", "Size 4 (optional)"]
      },
      {
        title: "Sorting runs",
        cols: ["Version & trial", "Correctly sorted", "Total coins", "Accuracy (%)", "Jams", "Sorting time (s)"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Clearance and accuracy tell you whether your openings are sized well.",
      steps: [
        "Clearance = opening width − coin diameter.",
        "Accuracy = correctly sorted ÷ total coins × 100.",
        "Average accuracy, jams, and time = add the 3 trials ÷ 3.",
        "Look for patterns: do jams happen at openings with very small clearance?"
      ],
      frame: "Clearance = ___ mm − ___ mm = ___ mm.   Accuracy = ___ ÷ ___ × 100 = ___%."
    },
    improve: [
      "Change the clearance of one opening.",
      "Change the ramp's slope or side tilt.",
      "Smooth the ramp surface (tape over rough cardboard) to reduce friction.",
      "Add a guide rail that lines coins up before each opening."
    ],
    retest: "Make one main change, then run 3 more trials with the same coin set. Compare average accuracy, jams, and sorting time with your original sorter.",
    reflection: [
      "Which coin was most often sorted into the wrong cup? Why?",
      "What clearance worked best? Use your data.",
      "Did faster sorting cause more errors or jams?",
      "How could a real coin machine handle bent or dirty coins?"
    ],
    extension: "Add a fourth coin size, or design a sorter that sorts by thickness instead of diameter, and compare accuracy.",
    safety: [
      "Only an adult uses the craft knife.",
      "Use low-value coins or tokens, not collectible or valuable coins.",
      "Keep coins and small tokens away from young children (choking hazard), and wash hands after handling coins."
    ]
  },

  {
    id: "accessible-ramp-model",
    title: "Accessible Ramp Model",
    difficulty: "Medium",
    category: "Civil Engineering / Inclusive Design",
    themes: ["structures", "design"],
    keywords: ["ramp", "accessible", "wheelchair", "slope", "incline", "inclined plane", "cart", "rise", "run", "inclusive"],
    challenge: "Design a tabletop ramp that helps move a small loaded cart to a raised platform.",
    time: { active: "About 2 hours", waiting: "None" },
    supplies: "Cardboard, supports, toy cart, ruler, spring scale if available",
    format: "Pairs or teams of 3",
    adult: "",
    problem: "Stairs block people who use wheelchairs, walkers, strollers, or carts. Ramps help everyone reach a raised entrance, but a steep ramp is hard to climb and a gentle ramp takes up a lot of space. Designers have to balance these needs.",
    mission: "Build a model ramp that moves a loaded toy cart up to a platform 6 cm high, comparing steepness with the space the ramp uses and the force needed.",
    criteria: [
      "The cart reaches the top of the platform while being pulled steadily.",
      "The cart does not roll off the sides.",
      "Suggested challenge goal: the pulling force on your ramp is less than half the force needed to lift the cart straight up."
    ],
    constraints: [
      "Platform height (rise): 6 cm, for every design.",
      "The ramp's total horizontal run must fit within 60 cm of table space.",
      "Ramp width at least 2 cm wider than the cart, with side edges.",
      "Use the same cart and load for every test."
    ],
    materials: [
      "Cardboard for the ramp and side rails",
      "Books or blocks for a 6 cm platform",
      "Toy cart or small toy car",
      "Load: 20 pennies taped into the cart (about 50 g)",
      "Spring scale in newtons or grams, if available",
      "String",
      "Ruler or meter stick, tape",
      "Protractor (optional)"
    ],
    toolNote: "No spring scale? Make a rubber-band force meter: tie the string to a rubber band and pull the band with a ruler beside it. The farther it stretches, the larger the force. Compare stretches in centimeters instead of newtons.",
    stem: {
      science: "A ramp is an inclined plane. It lets you move a load to the same height with less force by spreading the work over a longer distance. Friction in the wheels and surface adds some force back.",
      technology: "Ramps are access technology. They make buildings usable for people who cannot use stairs.",
      engineering: "You must balance space limits with ease of movement. A longer, gentler ramp may need less force but may not fit the space, so you might add a landing or turn.",
      math: "Slope is rise divided by run. You will express it as a ratio and a percentage, and compare it with the force needed."
    },
    plan: [
      "What run would give a gentle slope? Will it fit in 60 cm?",
      "Could a turn or a landing help a longer ramp fit?",
      "How will you keep the cart from rolling off the sides?",
      "Sketch two ramp designs from above and from the side, labeling rise and run."
    ],
    build: [
      "Stack books to make a platform exactly 6 cm high. Measure carefully.",
      "Cut a cardboard ramp 8–10 cm wide and long enough to reach the platform with a run of 40 cm.",
      "Fold or tape cardboard strips along both edges as side rails.",
      "Tape the top of the ramp to the platform so there is no bump where they meet.",
      "Tape the 20 pennies securely into the cart.",
      "Tie a string to the front of the cart."
    ],
    testing: [
      "Lift test: hang the loaded cart from the spring scale and record the force needed to hold it straight up.",
      "Measure the ramp's rise (6 cm), horizontal run along the table, and travel distance (the length along the ramp surface).",
      "Place the cart at the bottom. Pull the string with the spring scale (or rubber band) parallel to the ramp at a slow, steady speed.",
      "Read the force while the cart is moving steadily in the middle of the ramp.",
      "Run 3 trials on each ramp.",
      "Build a second ramp with a different run (for example, 25 cm) and repeat."
    ],
    tables: [
      {
        title: "Ramp measurements (rise: 6 cm)",
        cols: ["Ramp version", "Run (cm)", "Travel distance (cm)", "Slope (rise ÷ run)", "Slope (%)"],
        rows: ["Original (run 40 cm)", "Steeper comparison (run 25 cm)", "Improved"]
      },
      {
        title: "Pulling force (straight-up lifting force: ______)",
        cols: ["Ramp version & trial", "Pulling force (N, g, or cm of stretch)", "Notes"],
        rows: stemRows(3, ["Original", "Steeper", "Improved"])
      }
    ],
    math: {
      intro: "Slope describes steepness. A smaller slope means a gentler ramp.",
      steps: [
        "Slope = rise ÷ run. Write it as a ratio (for example, 6 : 40) and as a decimal.",
        "Slope percentage = rise ÷ run × 100.",
        "Average pulling force = add the 3 trials ÷ 3.",
        "Force fraction = average pulling force ÷ straight-up lifting force. Compare this with your slope."
      ],
      frame: "Slope = ___ cm ÷ ___ cm = ___ = ___%.   Force fraction = ___ ÷ ___ = ___."
    },
    improve: [
      "Change the run (and therefore the slope).",
      "Add a level landing halfway and a turn to fit a longer ramp in the space.",
      "Change the ramp surface to reduce or increase friction.",
      "Raise the side rails or widen the ramp."
    ],
    retest: "Test your improved ramp with the same cart, load, and pulling method. Compare its slope, travel distance, and average pulling force with your original and steeper ramps.",
    reflection: [
      "How did slope relate to the pulling force? Use your data.",
      "What was the trade-off between a gentle slope and the space the ramp used?",
      "How did a landing or turn change the design?",
      "Besides wheelchair users, who else benefits from a ramp?"
    ],
    extension: "Research the maximum slope that accessibility guidelines allow for real ramps in the United States. Calculate whether your model's slope is steeper or gentler, and explain why real ramps need expert design.",
    safety: [
      "Pull the cart slowly so it does not fly off the platform.",
      "Keep the book stack steady so it does not fall."
    ],
    note: "This is a model for learning about slope and force. It is not a construction plan and does not show that any ramp meets building accessibility regulations. Real ramps must be designed and inspected by qualified professionals."
  },

  {
    id: "adjustable-phone-stand",
    title: "Adjustable Phone Stand",
    difficulty: "Medium",
    category: "Product Design / Human-Centered Engineering",
    themes: ["design"],
    keywords: ["phone stand", "stand", "angle", "portrait", "landscape", "adjustable", "cardboard", "friction", "tipping", "usability"],
    challenge: "Build a stand that holds a phone-sized cardboard dummy securely in portrait and landscape positions.",
    time: { active: "About 2–3 hours", waiting: "About 1 hour if you use white glue" },
    supplies: "Cardboard, paper fasteners, tape, ruler, weighted dummy",
    format: "Individual or pairs",
    adult: "Cutting thick cardboard and making fastener holes",
    problem: "People use phones and tablets for video calls, recipes, and reading. A stand frees their hands, but it must hold the device at a comfortable angle, adjust easily, and not slide or tip over.",
    mission: "Build an adjustable cardboard stand that holds a weighted phone-sized dummy in portrait and landscape at two or more viewing angles.",
    criteria: [
      "Holds the dummy in both portrait and landscape.",
      "Adjusts to at least 2 different viewing angles and holds each angle without slipping.",
      "Suggested challenge goal: the stand stays put until the test board is tilted at least 10°."
    ],
    constraints: [
      "Footprint no larger than 12 cm × 12 cm.",
      "Cardboard, paper fasteners, tape, rubber bands, and glue only.",
      "Use the dummy for all tests, never a real phone."
    ],
    materials: [
      "Corrugated cardboard",
      "Paper fasteners (brads)",
      "Tape, white glue, and rubber bands",
      "Ruler and protractor",
      "Phone dummy: 3 layers of cardboard cut to 15 cm × 7.5 cm, taped together with about 60–70 pennies inside (about 150–175 g)",
      "Test board: a clipboard or stiff cardboard about 40 cm long",
      "Books to raise the board"
    ],
    stem: {
      science: "The dummy's weight creates torque that tries to push the stand backward or fold the support. Friction keeps the dummy from sliding off its ledge. The stand tips when its center of mass moves past the edge of its base.",
      technology: "An adjustable support with pivots and notches is a device-support system, like tablet stands, easels, and laptop hinges.",
      engineering: "You must design for usability (easy adjustment), stability, and repeated adjustment without the cardboard wearing out.",
      math: "You will measure angles and dimensions and compare stability using the tilt angle at which slipping or tipping begins."
    },
    plan: [
      "What viewing angles would be comfortable for watching a video? For reading?",
      "How will the stand lock at each angle: notches, a prop, or a friction joint?",
      "How will the dummy stay on in landscape, when it is wider?",
      "Sketch two designs from the side, labeling angles and the footprint."
    ],
    build: [
      "Cut a base 12 cm × 10 cm and a back support 12 cm × 10 cm.",
      "Join them along one edge with a tape hinge so the back support can lean at different angles.",
      "Cut a prop strip 10 cm × 3 cm. Attach one end to the back of the support with a paper fastener (an adult makes the hole).",
      "Cut 3 notches across the base for the prop to rest in. Each notch gives a different angle.",
      "Fold and glue a 1.5 cm lip along the bottom front edge of the support so the dummy cannot slide off.",
      "Let any glue dry, then place the dummy in portrait and landscape to check the fit."
    ],
    testing: [
      "Stand angle: set the stand to a notch, place the dummy, and measure the angle between the table and the back of the dummy with a protractor. This is the viewing angle.",
      "Place the test board flat on the table and put the stand on it with the dummy facing downhill.",
      "Slowly raise the board's uphill end with books, a little at a time.",
      "Stop when the dummy slips or the stand tips. Measure the board's rise and length, or measure its tilt angle with a protractor. This is the test-surface tilt.",
      "Record which happened first: slipping or tipping.",
      "Test in portrait and in landscape, at 2 viewing angles, with 3 trials each."
    ],
    tables: [
      {
        title: "Stability tests",
        cols: ["Version, position & trial", "Viewing angle (°)", "Board tilt when failure began (° or rise in cm)", "Slipped or tipped?"],
        rows: stemRows(3, ["Original – portrait", "Original – landscape", "Improved – portrait", "Improved – landscape"])
      },
      {
        title: "Stand dimensions",
        cols: ["Version", "Footprint length (cm)", "Footprint width (cm)", "Footprint area (cm²)", "Number of angle settings"],
        rows: ["Original", "Improved"]
      }
    ],
    math: {
      intro: "Two different angles matter here. Keep them separate: the stand angle is how the dummy leans; the board tilt is how steep the test surface is.",
      steps: [
        "If you cannot measure board tilt with a protractor, use slope: board tilt slope = rise ÷ board length.",
        "Average the 3 tilt results for each position and setting.",
        "Footprint area = length × width.",
        "Compare: which combination of viewing angle and position was most stable?"
      ],
      frame: "Board slope = ___ cm ÷ ___ cm = ___.   Average tilt at failure = ___ ÷ 3 = ___."
    },
    improve: [
      "Add a non-slip pad (rubber band strip or folded paper towel) under the base or on the lip.",
      "Lengthen the base toward the back to resist tipping.",
      "Change the notch positions to give different angles.",
      "Deepen the lip so landscape holds better."
    ],
    retest: "Make one main change and repeat the same tests in portrait and landscape at the same viewing angles. Compare average tilt at failure with your original stand.",
    reflection: [
      "Was your stand more likely to slip or to tip? What does that tell you about where to improve?",
      "Was portrait or landscape more stable? Why?",
      "How did the viewing angle affect stability? Use your data.",
      "What would a real user care about that your tests did not measure?"
    ],
    extension: "Add a cable slot so a charger can plug in, or design the stand to fold flat. Test whether the new feature changes stability.",
    safety: [
      "Use a cardboard dummy. Never risk a real phone in a tipping test.",
      "An adult cuts thick cardboard and makes fastener holes.",
      "Keep fingers clear of the hinge when adjusting."
    ]
  },

  {
    id: "slow-drip-plant-waterer",
    title: "Slow-Drip Plant Waterer",
    difficulty: "Medium",
    category: "Environmental Engineering / Fluid Systems",
    themes: ["water", "earth"],
    keywords: ["plant", "water", "drip", "irrigation", "flow rate", "bottle", "reservoir", "garden", "gravity", "watering"],
    challenge: "Build a gravity-fed device that delivers water slowly toward a selected target amount.",
    time: { active: "About 2 hours", waiting: "Each test runs about 30 minutes" },
    supplies: "Plastic container, tubing or adult-prepared opening, measuring cup, supports",
    format: "Individual or pairs",
    adult: "Making the outlet hole in the container",
    problem: "Plants can dry out over a weekend or vacation, and pouring a lot of water at once can run off instead of soaking in. Drip irrigation delivers water slowly where it is needed and helps save water.",
    mission: "Build a gravity-fed waterer that delivers a chosen target amount of water slowly over a set time.",
    criteria: [
      "Suggested challenge goal: deliver 100 mL in 30 minutes, within 15 mL.",
      "No leaks except from the planned outlet.",
      "Flows on its own, with no squeezing or refilling during the test."
    ],
    constraints: [
      "Reservoir: one clean plastic bottle or container up to 1 L.",
      "Start each trial with the same amount of water filled to a marked line.",
      "Test over a collection cup before using near a plant."
    ],
    materials: [
      "Clean plastic bottle (500 mL–1 L) with a cap",
      "Pushpin or small nail for the outlet hole (adult only)",
      "Optional: aquarium air tubing and a binder clip as a flow adjuster, or a cotton string as a wick",
      "Measuring cup or graduated cylinder (mL)",
      "Collection cup",
      "Supports: books or a box to hold the bottle above the cup",
      "Stopwatch or clock",
      "Tray and towels",
      "Kitchen scale (optional; 1 mL of water has a mass of about 1 g)"
    ],
    toolNote: "Kitchen measuring cups have large markings. For more precise readings, weigh the collected water on a kitchen scale: 1 g ≈ 1 mL.",
    stem: {
      science: "Gravity pulls water down through the outlet. The deeper the water above the hole, the more pressure pushes it out, so flow is faster when the bottle is full and slows as it empties.",
      technology: "Drip emitters, soaker hoses, and flow valves are irrigation technologies that control how fast water is delivered.",
      engineering: "You must adjust the outlet size and prevent leaks to hit a target amount, even though the flow changes over time.",
      math: "You will calculate flow rate in milliliters per minute and the difference between the delivered amount and your target."
    },
    plan: [
      "How big should the outlet be? How could you make it adjustable?",
      "Should the bottle be upright or upside down? Why?",
      "How will you keep the starting water level the same each trial?",
      "How often will you measure the collected water?",
      "Sketch two designs, showing the outlet and the water level."
    ],
    build: [
      "An adult pokes one small hole in the bottle cap with a pushpin.",
      "Fill the bottle with 300 mL of water and mark the water line with a marker.",
      "Screw the cap on tightly. Turn the bottle upside down and hold it above the collection cup on a support of books.",
      "Loosen the cap slightly or poke a small air hole near the bottom of the bottle (now at the top) if water stops flowing because no air can get in.",
      "Watch the drip for 1 minute and adjust (an adult can carefully widen the hole) until it drips steadily."
    ],
    testing: [
      "Fill the bottle to the marked line. Place an empty collection cup under the outlet and start the timer.",
      "Every 5 minutes, record the total amount collected (read the measuring cup or weigh it).",
      "Record any leaks or changes in the drip speed.",
      "Stop at 30 minutes. Record the total collected and compare it with the target.",
      "Run 3 trials, refilling to the same line each time."
    ],
    tables: [
      {
        title: "Water collected over time (target: 100 mL in 30 min)",
        cols: ["Version & trial", "5 min (mL)", "10 min (mL)", "15 min (mL)", "20 min (mL)", "25 min (mL)", "30 min (mL)", "Leaks?"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Flow rate tells how fast water is delivered. Target error tells how close you got.",
      steps: [
        "Average flow rate = total collected ÷ total time (mL per minute).",
        "Flow rate in one interval = (amount at end − amount at start) ÷ 5 min. Compare the first and last intervals.",
        "Target error = collected − target. A negative number means you delivered too little.",
        "Average target error = add the 3 errors ÷ 3."
      ],
      frame: "Flow rate = ___ mL ÷ 30 min = ___ mL/min.   Target error = ___ mL − 100 mL = ___ mL."
    },
    improve: [
      "Change the outlet size or number of holes.",
      "Add tubing with a binder clip to adjust the flow.",
      "Use a cotton wick instead of a hole.",
      "Change the starting water height or the bottle shape."
    ],
    retest: "Make one main change and run 3 more 30-minute trials from the same fill line. Compare total collected, flow rate, and target error with your original design.",
    reflection: [
      "Did the flow stay the same during each trial? How do you know? Why might it change?",
      "Which design came closest to the target? Use your data.",
      "Were your 3 trials of the same design consistent? What might cause differences?",
      "What would you need to know about a specific plant before using your waterer?"
    ],
    extension: "Graph the total collected against time for each design. Use the graph to predict how long the full bottle will last, then test your prediction.",
    safety: [
      "An adult makes or widens the outlet hole.",
      "Test over a tray and keep water away from outlets and electronics.",
      "Wipe up spills right away."
    ],
    note: "Plants need different amounts of water depending on their type, size, soil, and weather. Do not assume one watering rate is right for every plant. Test the device over a cup before using it near a plant."
  },

  {
    id: "earthquake-isolation-platform",
    title: "Earthquake Isolation Platform",
    difficulty: "Medium",
    category: "Civil Engineering / Earth Science",
    themes: ["structures", "earth"],
    keywords: ["earthquake", "shake table", "base isolation", "damping", "vibration", "building", "seismic", "tower", "inertia"],
    challenge: "Build a base that reduces shaking transferred to a model structure.",
    time: { active: "About 2–3 hours", waiting: "None" },
    supplies: "Cardboard platforms, foam, rubber bands, straws, contained rolling elements",
    format: "Pairs or teams of 3",
    adult: "",
    problem: "Earthquakes shake the ground back and forth, and that shaking passes into buildings. Engineers protect some buildings with base isolation: a layer between the building and the ground that lets the ground move while the building above moves less.",
    mission: "Build an isolation platform that sits between a shake table and a model tower and reduces how much the top of the tower moves during a standard shaking routine.",
    criteria: [
      "The model tower stays standing during the shaking routine.",
      "Suggested challenge goal: the top of the tower moves at least 30% less than on a fixed base.",
      "The model does not slide off the isolation platform."
    ],
    constraints: [
      "Use the same model tower for every test.",
      "Isolation platform no larger than 20 cm × 20 cm and no taller than 4 cm.",
      "Rolling elements (marbles, beads, round pencils) must be contained in a tray or track so they cannot escape."
    ],
    materials: [
      "Shake table: a shoebox lid or tray resting on 4 marbles inside a larger box lid or baking pan, with rubber bands connecting the two",
      "Model tower: a paper-tube or index-card tower about 30 cm tall with a small lump of clay (about 50 g) taped on top",
      "Cardboard for 2 platform layers (20 cm × 20 cm)",
      "Isolation materials: craft foam, sponges, rubber bands, straws, marbles or beads in a contained tray",
      "Drinking straw for a pointer and a ruler mounted on a separate stand (not on the shake table)",
      "Masking tape, ruler",
      "Metronome or a counting rhythm (a free online metronome is optional, not required)",
      "Phone video in slow motion (optional, helpful for reading movement)"
    ],
    stem: {
      science: "Because of inertia, a building tends to stay where it is when the ground moves suddenly. Flexible or rolling layers let the ground move underneath while passing less motion upward. Damping materials like foam absorb some energy of vibration.",
      technology: "Base isolators and dampers are real systems used under some hospitals, bridges, and other important buildings.",
      engineering: "You are protecting a structure by redesigning only its base, while keeping the model and the shaking the same.",
      math: "You will compare movement amplitudes and calculate the percent reduction compared with a fixed-base model."
    },
    plan: [
      "Which layer could let the ground move underneath while the top layer stays still?",
      "How will you stop the top layer from sliding too far or falling off?",
      "How will you read how far the top of the tower moves?",
      "Sketch two isolation designs from the side, labeling each layer."
    ],
    build: [
      "Build the shake table: place 4 marbles in a baking pan, set a shoebox lid on them, and connect the lid to the pan's sides with 2 rubber bands so it springs back to center.",
      "Tape a 6 cm straw pointer sticking sideways from the top of the model tower.",
      "Tape a ruler upright on a separate stand (such as a stack of books beside the pan, not touching it) so the pointer moves in front of the ruler.",
      "Fixed-base test setup: tape the tower directly to the shake table.",
      "Isolation setup: build a two-layer platform, with foam pads, rubber-band suspension, or contained rolling beads between a bottom cardboard layer (taped to the shake table) and a top layer (where the tower is taped)."
    ],
    testing: [
      "Standard shaking routine: pull the shake table sideways to a tape mark 3 cm from center and let go. Repeat 10 times, once per second (count “one-one-thousand”).",
      "During the routine, a partner watches the pointer and records the largest movement of the tower top in centimeters (or reads it from slow-motion video).",
      "Record whether the tower survived and whether it slid on the platform.",
      "Run the routine 3 times with the fixed base.",
      "Run the routine 3 times with the isolation platform."
    ],
    tables: [
      {
        title: "Shake tests (pull distance: 3 cm, 10 pulls)",
        cols: ["Base type & trial", "Largest top movement (cm)", "Sliding on platform? (yes/no, cm)", "Tower survived? (yes/no)"],
        rows: stemRows(3, ["Fixed base", "Isolation – original", "Isolation – improved"])
      }
    ],
    math: {
      intro: "Percent reduction compares the isolated tower with the fixed-base tower.",
      steps: [
        "Find the average largest movement for each base: add the 3 trials ÷ 3.",
        "Reduction = fixed-base average − isolated average.",
        "Percent reduction = reduction ÷ fixed-base average × 100.",
        "If the isolated tower moved more, the percent will be negative. That is useful evidence too."
      ],
      frame: "Percent reduction = (___ cm − ___ cm) ÷ ___ cm × 100 = ___%."
    },
    improve: [
      "Change the isolation material (foam, rubber bands, or contained beads).",
      "Change the stiffness: thicker or thinner foam, more or fewer rubber bands.",
      "Add a stopper rim so the top layer cannot slide too far.",
      "Combine a rolling layer with a damping layer."
    ],
    retest: "Make one main change and run the same shaking routine 3 times. Compare its average movement and percent reduction with the fixed base and with your original isolation design.",
    reflection: [
      "Which base reduced movement most? Use your percent reduction as evidence.",
      "Did any isolation design make the tower sway more? Why might that happen?",
      "How did sliding on the platform affect the results?",
      "What are the limits of a tabletop model compared with a real earthquake and a real building?"
    ],
    extension: "Change the shaking routine (faster pulls or a larger pull distance) and test whether your best design still performs best.",
    safety: [
      "Keep marbles and beads contained, and pick up any that escape so no one slips.",
      "Use a light tower top (about 50 g of clay). Do not use heavy objects that could fall."
    ],
    note: "A tabletop shake table moves in one direction with a simple rhythm. Real earthquakes shake in several directions with changing speeds, and real buildings are far larger and made of different materials. Your results show how isolation can work, not exactly how a real building will behave."
  },

  /* ===================== HARD (5) ===================== */

  {
    id: "cardboard-robotic-hand",
    title: "Mechanical Cardboard Robotic Hand",
    difficulty: "Hard",
    category: "Robotics / Biomechanical Engineering",
    themes: ["robotics", "design"],
    keywords: ["robot", "robotic hand", "hand", "fingers", "tendons", "string", "grip", "grasp", "biomechanics", "prosthetic"],
    challenge: "Build a cable-operated model hand that grasps at least three different lightweight objects.",
    time: { active: "About 4–6 hours", waiting: "About 1 hour if you use white glue" },
    supplies: "Cardboard fingers, string tendons, straw guides, flexible joints, wrist support",
    format: "Teams of 2–3",
    adult: "Cutting cardboard; hot glue if used",
    problem: "Robotic grippers and prosthetic hands need to hold objects of different shapes without crushing or dropping them. Engineers study how human tendons pull on finger bones and copy that idea with cables.",
    mission: "Build a cardboard hand with string “tendons” that curl the fingers when pulled, and improve it until it grasps several different objects reliably.",
    criteria: [
      "Grasps and lifts at least 3 different objects 10 cm off the table and holds each for 5 seconds.",
      "Suggested challenge goal: at least 4 successful grasps out of 5 attempts for each object.",
      "Fingers return to open (by hand or with a return system) between attempts."
    ],
    constraints: [
      "Cardboard, string, straws, tape, rubber bands, and glue only. No electronics are needed.",
      "At least 4 fingers (including a thumb), each with at least 2 bending joints.",
      "Hand no larger than 30 cm long including the wrist support.",
      "Test objects must be lightweight: for example, an empty paper cup, a marker, a foam or tennis ball, and a small empty box."
    ],
    materials: [
      "Corrugated or poster-weight cardboard",
      "Your own hand to trace (optional)",
      "Plastic straws cut into 1–2 cm pieces (tendon guides)",
      "Strong string or yarn (about 2 m)",
      "Masking tape, white glue (hot glue only with an adult)",
      "Scissors, ruler, pencil",
      "Rubber bands (optional, for returning fingers to open)",
      "Cardboard tube or folded cardboard for a wrist support",
      "Test objects (listed in the constraints)",
      "Kitchen scale (optional, to find object masses)"
    ],
    stem: {
      science: "When you pull a tendon string, it pulls the fingertip toward the palm, and each joint bends where the cardboard is creased. Friction between the fingers and the object holds it, and more contact area usually means a better grip.",
      technology: "Cable-actuated (string-pulled) mechanisms are used in real robotic grippers and some prosthetic hands.",
      engineering: "You must coordinate several fingers so they close around an object together, and improve grip without making the hand hard to operate.",
      math: "You will measure finger-segment lengths, measure how far each tendon must be pulled, and calculate success rates."
    },
    plan: [
      "How long should each finger segment be? Compare with the segments of your own fingers.",
      "Where should the straw guides go so the string bends each joint?",
      "How will the thumb oppose (press toward) the fingers?",
      "How will the fingers open again after you let go?",
      "Sketch two hand designs and label segment lengths and tendon paths."
    ],
    build: [
      "Trace your hand on cardboard, or draw a palm about 9 cm × 9 cm with 4 fingers and a thumb. Make the fingers about 2 cm wide.",
      "Cut it out (an adult cuts thick cardboard). Mark joints on each finger: 3 joints per finger, 2 on the thumb.",
      "Crease each joint by folding it forward and back several times so it bends easily toward the palm.",
      "Glue or tape straw pieces on the palm side of each finger segment, between the joints, lined up in a row. Add longer straw pieces on the palm leading to the wrist.",
      "Tie or tape one string to each fingertip and thread it through that finger's straws down to the wrist.",
      "Tape the hand to the wrist support. Pull each string to test that the finger curls. Label the strings."
    ],
    testing: [
      "Mark each tendon string at the wrist with a marker while the hand is open.",
      "Place a test object on the table. Lower the hand around it and pull the strings to grasp.",
      "Lift the object 10 cm and hold for 5 seconds. Record success or failure.",
      "Measure how far the marks moved (tendon pull distance) for one finger during the grasp.",
      "Make 5 attempts for each object. Record the object's mass if you have a scale.",
      "Repeat with at least 3 objects."
    ],
    tables: [
      {
        title: "Finger measurements",
        cols: ["Finger", "Segment 1 (cm)", "Segment 2 (cm)", "Segment 3 (cm)", "Tendon pull to close (cm)"],
        rows: ["Thumb", "Index", "Middle", "Ring"]
      },
      {
        title: "Grasp attempts (successes out of 5)",
        cols: ["Version", "Object 1: ______ (__ g)", "Object 2: ______ (__ g)", "Object 3: ______ (__ g)", "Object 4 (optional)", "Total success rate (%)"],
        rows: ["Original", "Improved"]
      }
    ],
    math: {
      intro: "Measurements help you compare your hand with a human hand and judge how reliable it is.",
      steps: [
        "Success rate = successful grasps ÷ attempts × 100 (for each object and overall).",
        "Finger length = add the segment lengths.",
        "Segment proportion = each segment ÷ total finger length. Compare with your own finger.",
        "Pull ratio = tendon pull distance ÷ fingertip travel distance. A smaller pull for the same fingertip travel means less string to pull."
      ],
      frame: "Success rate = ___ ÷ ___ × 100 = ___%.   Segment proportion = ___ cm ÷ ___ cm = ___."
    },
    improve: [
      "Add grip pads (rubber bands, craft foam, or tape with the sticky side out) to fingertips.",
      "Change the straw-guide positions to change how each joint bends.",
      "Add rubber bands on the back of the fingers to pull them open again.",
      "Tie several tendons to one pull ring so all fingers close together."
    ],
    retest: "Compare one design change at a time. After each change, repeat 5 attempts with the same objects and compare success rates with the original hand.",
    reflection: [
      "Which object was hardest to grasp? What about its shape, size, or surface made it difficult?",
      "Which change improved the success rate most? What is your evidence?",
      "How was your hand like a human hand? How was it different?",
      "What would a person who uses a prosthetic hand want engineers to improve?"
    ],
    extension: "Add a mechanical wrist that bends or a lock that holds the grip without holding the strings. Advanced teams with access to a robotics kit may add a servo to pull one tendon, but the core project needs no electronics.",
    safety: [
      "An adult cuts thick cardboard and runs any hot-glue gun.",
      "Do not wrap string around fingers tightly; pull with a loop or ring instead.",
      "Use only lightweight, unbreakable test objects."
    ],
    note: "This is a mechanical model. It does not require electronics, coding, or a 3D printer."
  },

  {
    id: "precision-gravity-timer",
    title: "Precision Gravity Timer",
    difficulty: "Hard",
    category: "Measurement Technology / Fluid Engineering",
    themes: ["measure", "water"],
    keywords: ["water clock", "timer", "clepsydra", "time", "flow", "calibrate", "accuracy", "precision", "reservoir"],
    challenge: "Build a water-powered timer that signals a chosen interval as accurately and repeatedly as possible.",
    time: { active: "About 3–5 hours", waiting: "None (many short timed runs)" },
    supplies: "Plastic reservoirs, tubing or controlled outlets, collection vessel, ruler, stopwatch",
    format: "Pairs or teams of 3",
    adult: "Making outlet holes in plastic containers",
    problem: "Before mechanical clocks, people used water clocks to measure time. Any measuring instrument must be both accurate (close to the true value) and precise (giving nearly the same result each time). Engineers improve instruments by calibrating and testing them again and again.",
    mission: "Build a water clock that signals a chosen interval (a suggested starting target is 60 seconds) and improve its accuracy and repeatability.",
    criteria: [
      "The timer gives a clear signal (for example, a float flag reaching a line) at the end of the interval.",
      "Suggested challenge goal: average absolute error of 3 seconds or less.",
      "Suggested challenge goal: the range of 5 repeated trials is 5 seconds or less."
    ],
    constraints: [
      "Water and gravity only. No electronics.",
      "Containers up to 2 L each.",
      "Fill to the same marked starting level for every trial.",
      "Use a stopwatch only for calibration and testing, not as part of the timer."
    ],
    materials: [
      "2 clean clear plastic bottles or cups (reservoir and collection vessel)",
      "Pushpin or small nail for the outlet (adult only), or aquarium tubing with a binder clip",
      "Ruler and permanent marker",
      "Stopwatch",
      "Small float (a cork or foam piece) with a straw “flag” taped on (optional signal)",
      "Supports (books or a box) to hold the reservoir above the collection vessel",
      "Tray and towels",
      "Graph paper"
    ],
    stem: {
      science: "Water flows out faster when the water above the hole is deep (more pressure) and slower as the level drops. Because of this, the water level does not fall at a steady rate.",
      technology: "Water clocks are some of the oldest timekeeping technologies. Your timer is a measuring instrument that you calibrate with a stopwatch.",
      engineering: "You must control the flow and create a clear indicator, then reduce the differences from trial to trial.",
      math: "You will make a calibration graph, calculate average absolute error, and find the range of repeated times."
    },
    plan: [
      "Will you measure time by the water level falling in the reservoir (outflow) or rising in the collector (inflow)?",
      "How big should the outlet be for the water to last a little longer than 60 seconds?",
      "What will the signal be, and how will everyone see it clearly?",
      "How will you make every trial start exactly the same way?",
      "Sketch two designs and label the outlet, the start line, and the signal mark."
    ],
    build: [
      "An adult pokes one small hole in the bottom of the reservoir cup or bottle.",
      "Hold the reservoir above the collection vessel on a stand of books. Draw a fill line near the top of the reservoir.",
      "Tape a paper strip down the side of the collection vessel as a scale.",
      "Calibrate: cover the hole with a finger, fill to the line, then release and start the stopwatch. Every 10 seconds, mark the water level in the collection vessel and write the time.",
      "Draw the 60-second line on the scale. Optional: place a float with a straw flag in the collection vessel so the flag tip reaches a mark on a card at 60 seconds."
    ],
    testing: [
      "Fill the reservoir to the fill line with the hole covered. Empty the collection vessel completely.",
      "One partner uncovers the hole and says “go.” The other starts the stopwatch at the same moment.",
      "The timer partner watches the signal and says “stop” when the water (or flag) reaches the 60-second line. Stop the stopwatch and record the actual elapsed time.",
      "Do not look at the stopwatch while watching the signal.",
      "Run 5 trials."
    ],
    tables: [
      {
        title: "Calibration (water level every 10 s)",
        cols: ["Time (s)", "Water level (cm)", "Change since last mark (cm)"],
        rows: ["0", "10", "20", "30", "40", "50", "60", "70"]
      },
      {
        title: "Timing trials (target: ____ s)",
        cols: ["Version & trial", "Actual elapsed time (s)", "Error (s)", "Absolute error (s)"],
        rows: stemRows(5)
      }
    ],
    math: {
      intro: "Accuracy is how close you are to the target. Precision (repeatability) is how close your trials are to each other.",
      steps: [
        "Error = actual time − target time. Absolute error = the error without a negative sign.",
        "Average absolute error = add the absolute errors ÷ number of trials (accuracy).",
        "Range = longest time − shortest time (repeatability).",
        "Graph water level (y-axis) against time (x-axis). If the points curve instead of making a straight line, equal height marks do not represent equal time intervals."
      ],
      frame: "Average absolute error = ___ s ÷ 5 = ___ s.   Range = ___ s − ___ s = ___ s."
    },
    improve: [
      "Change the outlet size so the interval uses more of the container.",
      "Make the signal easier to read (a float flag or a narrow collection tube where the level rises faster).",
      "Improve the start: use a pinch clip on tubing so the flow starts the same way each time.",
      "Keep the water height above the outlet more constant (see the extension)."
    ],
    retest: "Make one main change, recalibrate if needed, and run 5 more trials. Compare average absolute error and range with your original timer.",
    reflection: [
      "Was your calibration graph a straight line or a curve? What does that tell you about the flow?",
      "Was your timer more accurate or more precise? Explain the difference using your data.",
      "What caused the most variation between trials?",
      "Why might a timer that is precise but not accurate still be useful?"
    ],
    extension: "Investigate ways to stabilize the water head (the height of water above the outlet), such as an overflow reservoir that stays full or a sealed bottle with a straw that lets air in (a Mariotte bottle). Compare the calibration graph with your original.",
    safety: [
      "An adult makes all holes in plastic containers.",
      "Work over a tray and keep water away from outlets and electronics.",
      "Wipe up spills right away."
    ],
    note: "Equal height marks may not represent equal time intervals, because water usually flows faster when the container is full. That is why calibration matters."
  },

  {
    id: "tabletop-flood-protection",
    title: "Tabletop Flood-Protection System",
    difficulty: "Hard",
    category: "Environmental Engineering / Water Management",
    themes: ["water", "earth", "structures"],
    keywords: ["flood", "levee", "barrier", "storm", "runoff", "drainage", "basin", "retention", "water management", "rain"],
    challenge: "Protect a model building from a controlled water release using channels, barriers, and a storage basin.",
    time: { active: "About 3–5 hours", waiting: "Sponges dry overnight between test days (or use several identical sponges)" },
    supplies: "Waterproof tray, modeling clay, gravel, plastic channels, collection containers, model building",
    format: "Teams of 2–4",
    adult: "Cutting plastic bottles into channels",
    problem: "Heavy storms can send water rushing through towns. Engineers protect neighborhoods with channels that carry runoff away, barriers that block it, and basins that store it for a while. A good system protects people without simply pushing the flood onto someone else.",
    mission: "Design a flood-protection system on a tilted tray that reduces how much water reaches a protected zone around a model building during a fixed “storm.”",
    criteria: [
      "Suggested challenge goal: reduce the water reaching the protected zone by at least 75% compared with the unprotected baseline.",
      "Your system does not cover, touch, or move the model building.",
      "You can account for where the water went (protected zone, basin, overflow, or left on the tray)."
    ],
    constraints: [
      "Tray tilted with the uphill end raised 3 cm, every trial.",
      "Storm: 500 mL of water poured through a rain cup over 60 seconds at the marked uphill spot.",
      "No more than 200 g of modeling clay, 2 plastic channels, 1 cup of gravel, and 1 storage basin up to 250 mL.",
      "The protected zone is a 10 cm × 10 cm square around the building, marked with tape."
    ],
    materials: [
      "Large waterproof tray, baking pan, or plastic storage-bin lid (about 30 cm × 45 cm) with an outlet notch or low edge at the downhill end",
      "Catch pan under the outlet",
      "Reusable modeling clay (oil-based clay that does not dissolve)",
      "Small gravel or aquarium pebbles (about 1 cup)",
      "Plastic channels: clean plastic bottles cut in half lengthwise (adult cuts)",
      "Storage basin: a small cup or container up to 250 mL",
      "Model building: a small plastic block or upside-down cup",
      "Kitchen sponge cut to 8 cm × 8 cm (several identical sponges if possible)",
      "Kitchen scale (grams)",
      "Rain cup: a paper cup with 10 small holes poked in the bottom (adult pokes holes)",
      "Measuring cup (mL), stopwatch, tape, towels"
    ],
    toolNote: "The kitchen scale measures the water in the sponge: 1 g of water ≈ 1 mL. No scale? Squeeze the sponge into a measuring cup and read the volume instead (less precise).",
    stem: {
      science: "Rain that cannot soak in becomes runoff and flows downhill along the easiest path. Barriers change the path, channels speed water away, and basins hold water temporarily.",
      technology: "Drainage channels, levees, flood walls, and retention basins are real water-management technologies used in cities.",
      engineering: "You must combine several components (channels, barriers, a basin) under space and material limits so they work together as one system.",
      math: "You will make a water-volume balance (where every milliliter went), calculate storage capacity, and find the percentage reduction in water entering the protected area."
    },
    plan: [
      "Which path does water take on the bare tray? (Run a small test and watch.)",
      "Where should water be steered, and where will it end up? Could your system flood somewhere else?",
      "How big must the basin be? What happens when it fills?",
      "How will clay barriers seal against the tray so water does not sneak under?",
      "Sketch two layouts from above with arrows showing the planned water path."
    ],
    build: [
      "Raise the uphill end of the tray 3 cm. Place the catch pan under the downhill outlet.",
      "Mark the storm spot near the uphill end and the 10 cm × 10 cm protected zone near the downhill end with tape.",
      "Weigh a dry sponge. Place it in the protected zone with the model building on top of it. (The sponge measures water that reaches the zone.)",
      "Run the unprotected baseline first (see testing) before adding any protection.",
      "Starter protection: press a curved clay barrier on the uphill side of the protected zone, sealing it firmly to the tray.",
      "Place a plastic channel so water deflected by the barrier flows into the storage basin, set into a ring of clay or gravel beside the zone."
    ],
    testing: [
      "Pour 500 mL into a measuring cup. Hold the rain cup over the storm spot, pour the water into it steadily, and keep it raining for about 60 seconds.",
      "Wait until dripping stops (about 1 minute).",
      "Carefully lift the sponge and weigh it. Water in zone = wet mass − dry mass (1 g ≈ 1 mL).",
      "Measure the water in the storage basin and in the catch pan with the measuring cup.",
      "Water left on the tray = 500 mL − (zone + basin + catch pan).",
      "Dry or replace the sponge, empty containers, and wipe the tray. Run 3 trials for the baseline and 3 for each protected design."
    ],
    tables: [
      {
        title: "Storm trials (storm: 500 mL over 60 s)",
        cols: ["Design & trial", "Water in protected zone (mL)", "Water in basin (mL)", "Overflow to catch pan (mL)", "Left on tray (mL)", "Notes"],
        rows: stemRows(3, ["Baseline (no protection)", "Original system", "Improved system"])
      }
    ],
    math: {
      intro: "A water balance checks that every milliliter is accounted for. Percent reduction compares your system with no protection.",
      steps: [
        "Water balance: zone + basin + overflow + left on tray should equal 500 mL.",
        "Average zone water for each design = add the 3 trials ÷ 3.",
        "Percent reduction = (baseline average − design average) ÷ baseline average × 100.",
        "Basin percent full = basin water ÷ basin capacity × 100."
      ],
      frame: "Percent reduction = (___ mL − ___ mL) ÷ ___ mL × 100 = ___%.   Basin full = ___ mL ÷ ___ mL × 100 = ___%."
    },
    improve: [
      "Change the barrier's shape or location (straight wall vs. curved diversion).",
      "Add or reroute a channel so water reaches the basin sooner.",
      "Use gravel as a slowing layer upstream to let water spread out.",
      "Change basin placement so it catches more before overflowing."
    ],
    retest: "Make one main change and run 3 trials with the same storm. Compare average zone water, percent reduction, and the water balance with both the baseline and your original system.",
    reflection: [
      "Where did most of the water go in each design? Use your water balance.",
      "Did your barrier eliminate water or just redirect it? Who or what could be affected by redirected water?",
      "What happened when the basin filled? How could a real town plan for a bigger storm?",
      "What are the limits of a tray model compared with a real town and real storms?"
    ],
    extension: "Test a “bigger storm” (750 mL) with your best design. Does the percent reduction stay the same? Explain why or why not.",
    safety: [
      "Keep water away from outlets, cords, and electronics.",
      "An adult cuts plastic bottles and pokes the rain-cup holes; cut plastic edges can be sharp.",
      "Work over towels and wipe up spills right away."
    ],
    note: "Barriers may redirect water rather than eliminate it. In real communities, engineers must consider where redirected water goes so they do not move the flood onto someone else's property."
  },

  {
    id: "two-axis-drawing-machine",
    title: "Two-Axis Drawing Machine",
    difficulty: "Hard",
    category: "Mechanical Computing / Precision Engineering",
    themes: ["robotics", "machines", "measure"],
    keywords: ["drawing machine", "plotter", "etch", "x-axis", "y-axis", "coordinates", "marker", "gantry", "precision", "cnc"],
    challenge: "Build a hand-operated drawing mechanism that moves a marker in two directions to reproduce a square and a simple letter.",
    time: { active: "About 5–7 hours", waiting: "About 1 hour if you use white glue" },
    supplies: "Cardboard frame, sliding guides, string, spools, straws, ruler, marker",
    format: "Teams of 2–3",
    adult: "Cutting cardboard and trimming skewers",
    problem: "Machines like plotters, laser cutters, and 3D printers move a tool to exact positions using two directions of motion, called axes. Precision engineers make these motions accurate and repeatable so drawings and parts come out the right size.",
    mission: "Build a machine with two separately controlled axes that moves a marker to draw a 6 cm square and a simple letter from coordinates, and improve its accuracy.",
    criteria: [
      "Each axis can move the marker without moving the other axis.",
      "Suggested challenge goal: square sides within 0.5 cm of 6 cm and corners within 10° of 90°.",
      "The machine draws a simple letter (L, T, or H) from a list of coordinates."
    ],
    constraints: [
      "Hand-operated only. Motors and coding are not required.",
      "Drawing area at least 10 cm × 10 cm.",
      "Base no larger than 40 cm × 40 cm.",
      "Cardboard, skewers or dowels, straws, string, tape, glue, and pencils as spools."
    ],
    materials: [
      "Corrugated cardboard for a base (40 cm × 40 cm) and gantry",
      "4 wooden skewers or thin dowels for rails (an adult trims sharp points)",
      "Straws slightly wider than the skewers, cut into 3 cm sleeves",
      "String (about 2 m)",
      "2 round pencils or dowels for control spools, with cardboard knobs",
      "Washable marker and a rubber band to hold it",
      "Paper taped to the base",
      "Ruler with millimeters, protractor",
      "Tape and white glue"
    ],
    stem: {
      science: "Friction between straws and rails resists motion and can make a carriage stick and then jump. String tension pulls each carriage; if the string stretches or slips on the spool, the marker will not move as far as expected.",
      technology: "Your machine is a coordinate-controlled plotting mechanism, the same basic idea as computer-controlled plotters, laser cutters, and 3D printers.",
      engineering: "You must build and align two axes that move independently and smoothly, then improve their accuracy and repeatability.",
      math: "You will use coordinate pairs, scale (centimeters per knob turn), distances, angles, and error."
    },
    plan: [
      "How will the X-axis carriage slide left and right without twisting?",
      "How will the Y-axis carriage ride on the X carriage and move front to back?",
      "How will turning a knob move each carriage a predictable distance?",
      "How will you lift the marker between letter strokes, or will you draw letters in one continuous line?",
      "Sketch the machine from above and label the X and Y axes, rails, and spools."
    ],
    build: [
      "X-axis rails: glue 2 skewers along the base, 15 cm apart and exactly parallel, raised on cardboard blocks at each end.",
      "Gantry: slide 2 straw sleeves onto each rail. Glue a cardboard bridge (25 cm × 5 cm) across the sleeves so it slides left and right.",
      "Y-axis rail: glue a skewer along the top of the gantry, raised on small blocks. Slide one straw sleeve on it and attach a small cardboard marker holder that hangs down to the paper.",
      "Fix the marker in the holder with a rubber band so its tip just touches the paper.",
      "X control: mount a pencil spool on the base at one end. Make a closed string loop from the spool to a pencil idler at the other end, and tape the gantry into the loop. Turning the spool knob moves the gantry.",
      "Y control: mount a second pencil spool on the gantry and make a string loop the same way to move the marker holder.",
      "Turn each knob slowly and check that the marker moves in a straight line."
    ],
    testing: [
      "Calibrate: turn the X knob exactly 1 full turn and measure how far the marker moves. Repeat 3 times and average. Do the same for Y. This is your scale (cm per turn).",
      "Plan a 6 cm square as coordinates: (0, 0) → (6, 0) → (6, 6) → (0, 6) → (0, 0). Convert each move into knob turns using your scale.",
      "Draw the square by turning only one knob at a time.",
      "Measure all 4 side lengths, all 4 corner angles, and the gap between the starting point and the ending point (closure error).",
      "Draw the square 3 times on the same paper, starting at the same point, and measure how far apart the matching corners are (repeatability).",
      "Write coordinates for a simple letter (L, T, or H), draw it, and compare it with the planned size."
    ],
    tables: [
      {
        title: "Scale calibration",
        cols: ["Axis", "Trial 1 (cm per turn)", "Trial 2", "Trial 3", "Average (cm per turn)"],
        rows: ["X – original", "Y – original", "X – improved", "Y – improved"]
      },
      {
        title: "Square tests (target sides: 6 cm, corners: 90°)",
        cols: ["Version & trial", "Side 1 (cm)", "Side 2 (cm)", "Side 3 (cm)", "Side 4 (cm)", "Largest corner error (°)", "Closure gap (cm)"],
        rows: stemRows(3)
      }
    ],
    math: {
      intro: "Coordinates tell the machine where to go. Scale converts distances into knob turns. Error tells you how close you came.",
      steps: [
        "Scale = distance moved ÷ knob turns (cm per turn). It should be close to the spool's circumference (π × diameter).",
        "Turns needed = distance ÷ scale.",
        "Side error = |measured side − 6 cm|. Average side error = add the 4 errors ÷ 4.",
        "Repeatability: the largest distance between matching corners in your 3 squares."
      ],
      frame: "Scale = ___ cm ÷ 1 turn = ___ cm per turn.   Turns for 6 cm = 6 ÷ ___ = ___ turns.   Average side error = ___ cm."
    },
    improve: [
      "Reduce friction: smoother straws, a little wax on the rails, or better alignment.",
      "Reduce backlash: tighten the string loops so the carriage moves as soon as the knob turns.",
      "Make the spool grip the string better (more wraps or a rubber band on the spool).",
      "Stiffen the gantry so the marker does not wobble."
    ],
    retest: "Make one main change, recalibrate your scale, and draw the square 3 more times. Compare side errors, corner errors, closure gap, and repeatability with your original machine.",
    reflection: [
      "Which axis was more accurate? What made the difference?",
      "Did your squares come out too big, too small, or skewed? What part of the machine caused it?",
      "What happened when you reversed direction on a knob? How did it affect the drawing?",
      "How is your machine like a 3D printer or laser cutter?"
    ],
    extension: "Optional: add motors and a microcontroller, or write a list of moves that a partner follows like a computer program. Measure whether the extra technology improves accuracy. The core project must still work by hand.",
    safety: [
      "An adult cuts thick cardboard and trims sharp points from skewers.",
      "Use washable markers.",
      "Keep fingers clear of string loops while turning knobs."
    ],
    note: "This core project works manually with everyday materials. A computer, coding kit, or 3D printer is not needed."
  },

  {
    id: "chain-reaction-problem-solver",
    title: "Chain-Reaction Problem Solver",
    difficulty: "Hard",
    category: "Systems Engineering / Energy Transfer",
    themes: ["energy", "machines"],
    keywords: ["chain reaction", "rube goldberg", "dominoes", "marble", "lever", "bell", "flag", "stages", "energy transfer", "system"],
    challenge: "Build a chain-reaction machine with at least five distinct stages that ends by ringing a bell or dropping a paper flag.",
    time: { active: "About 5–8 hours", waiting: "None" },
    supplies: "Cardboard ramps, dominoes, string, cups, marbles, levers, safe household materials",
    format: "Teams of 2–4",
    adult: "Cutting cardboard",
    problem: "Factories, assembly lines, and even the human body rely on systems where one step triggers the next. If any one step fails, the whole system stops. Systems engineers design each step to be reliable and test how the steps connect.",
    mission: "Plan, build, and test a machine with at least five distinct stages that passes energy from one stage to the next and finishes by ringing a bell or dropping a paper flag, then make it as reliable as possible.",
    criteria: [
      "At least 5 distinct stages, each using a different kind of trigger or motion.",
      "Only the first stage is started by hand.",
      "Ends by ringing a bell or dropping a paper flag.",
      "Suggested challenge goal: 4 out of 5 full runs succeed without any help."
    ],
    constraints: [
      "Fits within a 1.5 m × 60 cm table area (or a space your teacher sets).",
      "Safe household materials only: no flames, mains electricity, sharp projectiles, or heavy falling objects.",
      "A labeled plan showing every stage and its trigger is required before building.",
      "Reset time between runs: no more than 5 minutes."
    ],
    materials: [
      "Cardboard and paper tubes for ramps",
      "Dominoes or small blocks",
      "Marbles and a toy car",
      "String, paper cups, rulers or paint stirrers for levers",
      "Books for supports",
      "Masking tape",
      "Small bell or a paper flag on a string",
      "Stopwatch",
      "Planning paper"
    ],
    stem: {
      science: "Energy transfers from one stage to the next. A raised marble has stored energy because of gravity; when it rolls, that energy becomes motion; when it hits a domino, the collision passes energy along. Levers and pulleys change the direction and size of forces.",
      technology: "Mechanical triggers and sequential control (one step starting the next) are the same ideas used in machines that follow a set order of steps.",
      engineering: "You must integrate separate mechanisms into one reliable system. The hardest part is usually the handoff between stages.",
      math: "You will time each stage, calculate success percentages, and identify the stage that causes the most failures."
    },
    plan: [
      "List 5 or more stages. What triggers each one, and what does each one trigger next?",
      "Which handoffs need precise positioning? How will you mark positions so you can reset them?",
      "Which stage do you predict will be least reliable? Why?",
      "Draw a labeled plan: number each stage, name its trigger, and draw an arrow to the next stage."
    ],
    build: [
      "Draw your labeled plan and get teacher approval.",
      "Build each stage separately. Example stages: (1) a marble rolls down a ramp, (2) it knocks over a line of dominoes, (3) the last domino pushes a toy car down a slope, (4) the car hits a ruler lever that tips a cup, (5) the cup's weight pulls a string that releases a paper flag or swings into a bell.",
      "Test each stage by itself 5 times and record its success rate before connecting anything.",
      "Connect stages two at a time. Test each handoff 5 times.",
      "Mark the position of every part with tape so you can reset it the same way each run.",
      "Combine all stages for full runs."
    ],
    testing: [
      "Reset every part to its tape marks.",
      "Start the first stage by hand and start the stopwatch.",
      "Stop the stopwatch when the bell rings or the flag drops. Record the total run time.",
      "If the run stops, record the stage where it failed. Do not help it along during a test run.",
      "Run 5 full runs.",
      "Optional: have a partner record the time each stage finishes."
    ],
    tables: [
      {
        title: "Stage tests (tested separately, 5 tries each)",
        cols: ["Stage number & description", "Successes (out of 5)", "Success rate (%)", "Common problem"],
        rows: ["Stage 1:", "Stage 2:", "Stage 3:", "Stage 4:", "Stage 5:", "Stage 6 (optional):"]
      },
      {
        title: "Full runs",
        cols: ["Version & run", "Reached the end? (yes/no)", "Stage where it failed", "Total run time (s)"],
        rows: stemRows(5)
      }
    ],
    math: {
      intro: "Every stage you add is another chance for the machine to fail. Math helps you find the weakest link.",
      steps: [
        "Full-run success rate = successful runs ÷ total runs × 100.",
        "Failure tally: count how many times each stage caused a failure. The stage with the most is your largest source of failure.",
        "Stage timing: subtract the time one stage ends from the time the next ends to find how long each stage takes.",
        "Why stages add up: if each of 5 stages worked 9 out of 10 times, the chance that all 5 work in a row is 0.9 × 0.9 × 0.9 × 0.9 × 0.9 ≈ 0.59, or about 59%. (These are example numbers, not results.) Try the calculation with your own stage success rates."
      ],
      frame: "Full-run success = ___ ÷ 5 × 100 = ___%.   Largest source of failure: Stage ___ (___ failures)."
    },
    improve: [
      "Redesign the stage that failed most often.",
      "Add guides, walls, or stops so parts land in the same place every time.",
      "Replace a fussy handoff with a simpler, more reliable trigger.",
      "Remove a stage that adds complexity but not value. Prioritize reliability over complexity."
    ],
    retest: "After improving the least reliable stage, run 5 more full runs. Compare full-run success rate, failure tally, and total run time with your original machine.",
    reflection: [
      "Which stage failed most often, and why?",
      "Did adding more stages make your machine less reliable? Use your data.",
      "Which handoff between stages was hardest to make reliable?",
      "Where do real systems, like assembly lines, need every step to work in order?"
    ],
    extension: "Add a stage that uses a different simple machine (a pulley, wheel and axle, or wedge), and calculate whether your full-run success rate goes up or down.",
    safety: [
      "No flames, mains electricity, sharp projectiles, or heavy falling objects.",
      "Keep marbles and small parts off the floor and away from young children.",
      "An adult cuts thick cardboard.",
      "Keep faces away from launching parts and levers."
    ],
    note: "Adding more stages often creates more opportunities for failure. A reliable 5-stage machine shows better engineering than an unreliable 15-stage machine."
  },

];
