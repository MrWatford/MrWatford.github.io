/* =========================================================
   Middle School Science Project Center — project list
   Used by science/project-center.html (drawn by js/project-center.js).

   HOW TO ADD OR EDIT A PROJECT
   Copy one { ... } block below, paste it at the end of the list,
   and change the words. Keep the commas between blocks.

     id          short name for the web address (lowercase-with-dashes, must be unique)
     title       project name
     difficulty  "Easy", "Medium", or "Hard"
     category    the category shown on the card
     themes      one or more theme keys from THEMES just below (the first one sets the card icon)
     keywords    extra words that help the search box find it
     summary     one sentence for the card
     time        { active: "hands-on work", waiting: "waiting or growing time" }
     supplies    short supply list for the card
     question, investigating, materials[], safety[],
     independent, dependent, controlled[], comparison, repeat,
     procedure[], tables[ { title, cols[], rows[] } ], graph,
     questions[], extension, note (optional "good to know" limitation)
   In tables, each word in rows[] fills the first box of a blank row ("" = empty box).
   ========================================================= */

const PROJECT_THEMES = {
  plants:      { label: "Plants", icon: "🌱" },
  motion:      { label: "Forces & Motion", icon: "🚀" },
  chemistry:   { label: "Chemistry", icon: "🧪" },
  heat:        { label: "Heat & Energy", icon: "🌡️" },
  electricity: { label: "Electricity & Magnetism", icon: "⚡" },
  engineering: { label: "Engineering & Structures", icon: "🏗️" },
  earth:       { label: "Earth & Environment", icon: "🌍" },
  water:       { label: "Water & Weather", icon: "💧" },
  sound:       { label: "Sound", icon: "🔊" },
  materials:   { label: "Materials", icon: "🧻" }
};

const PROJECTS = [

  /* ===================== EASY ===================== */

  {
    id: "paper-towel-absorbency",
    title: "Paper Towel Absorbency",
    difficulty: "Easy",
    category: "Materials Science",
    themes: ["materials"],
    keywords: ["paper towel", "absorb", "absorbency", "brands", "spill", "soak"],
    summary: "Cut same-sized squares of different paper towels and measure how much water each one holds.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "3 paper towel types, ruler, scissors, kitchen scale",
    question: "Which type of paper towel absorbs the most water?",
    investigating: "Paper towel brands are made with different thicknesses, textures, and layers. You will soak equal-sized squares of each type the same way and measure how much water each square holds.",
    materials: [
      "3 or more types or brands of paper towels (about 3 sheets of each)",
      "Ruler and pencil",
      "Scissors",
      "Kitchen scale that measures in grams (a graduated cylinder also works; see the note)",
      "Small dry plate to weigh the towels on",
      "Shallow bowl or baking dish",
      "Water (about 1 liter)",
      "Timer or stopwatch",
      "Masking tape and a marker for labels"
    ],
    safety: [
      "Wipe up spilled water right away so no one slips.",
      "Keep the scale on a dry spot away from the water bowl."
    ],
    independent: "Paper towel type",
    dependent: "Mass of water absorbed by each square, in grams (g)",
    controlled: [
      "Square size (20 cm × 20 cm)",
      "Soaking time (10 seconds)",
      "Dripping time (15 seconds)",
      "Water temperature and depth",
      "Same scale, plate, and way of lifting the square"
    ],
    comparison: "No untreated group is needed. You are comparing the towel types to each other.",
    repeat: "Test at least 3 fresh squares of each towel type (5 is even better).",
    procedure: [
      "Label each towel type with a letter (A, B, C) and write the brand names in your notebook.",
      "Measure and cut squares that are 20 cm × 20 cm. Cut at least 3 squares of each type. If a towel has two layers, keep the layers together the way it comes off the roll.",
      "Pour water into the bowl until it is about 3 cm deep.",
      "Put the dry plate on the scale and press zero (tare). Weigh one dry square and record its dry mass.",
      "Lay the square flat on the water and gently push it under. Start the timer and leave it there for 10 seconds.",
      "Lift the square by one corner and hold it over the bowl for 15 seconds so the extra water drips off.",
      "Lay the wet square on the plate on the scale and record its wet mass.",
      "Subtract: wet mass − dry mass = water absorbed. Record it.",
      "Throw away the used square. Repeat steps 4–8 with a new square, taking turns between types (A, B, C, A, B, C…) until each type has been tested at least 3 times.",
      "Find the average water absorbed for each towel type."
    ],
    tables: [
      {
        title: "Measurements",
        cols: ["Towel type & trial", "Dry mass (g)", "Wet mass (g)", "Water absorbed (g)"],
        rows: ["A – trial 1", "A – trial 2", "A – trial 3", "B – trial 1", "B – trial 2", "B – trial 3", "C – trial 1", "C – trial 2", "C – trial 3"]
      },
      {
        title: "Averages",
        cols: ["Towel type", "Average water absorbed (g)"],
        rows: ["A", "B", "C"]
      }
    ],
    graph: "Bar graph: towel type on the x-axis and average water absorbed (g) on the y-axis.",
    questions: [
      "Which towel type absorbed the most water on average? Which absorbed the least?",
      "How much did the trials of the same towel type vary? Were the differences between types bigger than the differences between trials?",
      "Did thickness or texture seem connected to your results? How could you check that?",
      "Would your answer change if you compared whole sheets instead of equal-sized squares? Why?",
      "What could have caused small errors in your measurements?"
    ],
    extension: "Hang a 2 cm × 15 cm strip of each towel with its bottom edge in water and measure how high the water climbs in 2 minutes.",
    note: "1 gram of water is about 1 milliliter, so you can report your results in either unit. To use a graduated cylinder instead of a scale: start with 100 mL of water in the bowl, soak and drip the square over the bowl, pour what is left back into the cylinder, and subtract it from 100 mL."
  },

  {
    id: "paper-airplane-wing-width",
    title: "Paper Airplane Flight Distance",
    difficulty: "Easy",
    category: "Physics / Aerodynamics",
    themes: ["motion"],
    keywords: ["paper airplane", "wings", "flight", "distance", "glide", "throw", "aerodynamics"],
    summary: "Fold the same airplane design with different wing widths and measure how far each one flies.",
    time: { active: "1–2 hours", waiting: "None" },
    supplies: "Printer paper, ruler, tape measure, masking tape",
    question: "How does wing width affect a paper airplane's flight distance?",
    investigating: "You will fold several airplanes from the same kind of paper using the same design, but make the wings different widths. Then you will throw each one the same way and measure how far it flies.",
    materials: [
      "Several sheets of the same printer paper (8.5 × 11 in)",
      "Ruler and pencil",
      "Tape measure (at least 10 m, or a meter stick)",
      "Masking tape for a launch line",
      "Sticky notes to mark landing spots",
      "A partner",
      "A long indoor space, such as a hallway or gym (with permission)"
    ],
    safety: [
      "Never throw an airplane toward anyone's face.",
      "Get permission before using a hallway or gym, and make sure the flight path is clear."
    ],
    independent: "Wing width (cm), measured from the center fold to the outer edge of a wing",
    dependent: "Flight distance (m) from the launch line to where the plane first lands",
    controlled: [
      "Paper type and size",
      "Basic airplane design and fold order",
      "Launch spot, launch height, and throwing person",
      "Indoor location with no fans or open doors"
    ],
    comparison: "No untreated group is needed. You are comparing wing widths to each other.",
    repeat: "Throw each airplane at least 5 times. Throws vary a lot, so more is better.",
    procedure: [
      "Choose one simple airplane design and practice folding it until you can fold it the same way every time.",
      "Fold 3 airplanes with wing widths of about 3 cm, 5 cm, and 7 cm. Measure each wing with a ruler and write the width on the plane.",
      "Put a strip of masking tape on the floor as the launch line.",
      "Stand with your toes on the line. Hold the plane at shoulder height and throw it gently and level, the same way every time.",
      "Your partner puts a sticky note where the plane first touches the floor.",
      "Measure from the launch line straight to the sticky note. Record the distance in meters.",
      "Throw each plane 5 times, taking turns between planes. If a plane hits a wall or a person, note it and throw again.",
      "Check each plane for bent tips between throws and gently straighten them the same way.",
      "Find the average distance for each wing width."
    ],
    tables: [
      {
        title: "Flight distances",
        cols: ["Wing width (cm)", "Throw 1 (m)", "Throw 2 (m)", "Throw 3 (m)", "Throw 4 (m)", "Throw 5 (m)", "Average (m)"],
        rows: ["", "", ""]
      }
    ],
    graph: "Because wing width is a number, make a line graph or scatterplot with wing width (cm) on the x-axis and average distance (m) on the y-axis. A bar graph also works.",
    questions: [
      "Which wing width flew farthest on average?",
      "How much did the 5 throws of the same plane vary? What might cause that?",
      "Did you see a pattern as the wings got wider, or did one width stand out?",
      "Folding different wing widths also changes the body of the plane a little. How might that affect your results?",
      "What would you change to make your throws more consistent?"
    ],
    extension: "Using your best wing width, test how adding a paper clip at the nose, middle, or tail changes flight distance.",
    note: "With one sheet of paper, wider wings leave a smaller body underneath. That means wing width is not the only thing that changes, so mention this in your conclusion."
  },

  {
    id: "light-seedling-growth",
    title: "Light and Seedling Growth",
    difficulty: "Easy",
    category: "Plant Science",
    themes: ["plants"],
    keywords: ["light", "seedlings", "plants", "growth", "lamp", "hours", "sunlight", "beans", "radish"],
    summary: "Give groups of seedlings different hours of light each day and track height, leaves, and color.",
    time: { active: "30 minutes to set up, then about 10 minutes a day", waiting: "About 3 weeks (sprouting plus 2 weeks of light treatments)" },
    supplies: "Bean or radish seeds, 9 small pots, soil, LED lamp, box",
    question: "How does daily light duration affect seedling growth?",
    investigating: "Plants use light to make food. You will grow several seedlings in each light group, give each group a different number of hours of light per day, and measure height, leaf count, and leaf color for about two weeks.",
    materials: [
      "One packet of fast-growing seeds, such as bush beans or radishes",
      "9 small identical pots or cups with drainage holes (3 per group)",
      "Potting soil (enough to fill every pot the same amount)",
      "Tray to catch water",
      "One LED desk lamp or grow light (LEDs stay cool)",
      "Large cardboard box to cover plants during their dark time",
      "Measuring cup or spoon for water",
      "Ruler with millimeter marks",
      "Masking tape and marker for labels"
    ],
    safety: [
      "Wash your hands after handling soil and seeds. Do not eat seeds; some are coated with chemicals.",
      "An adult should set up the lamp and any lamp timer. Use the lamp the normal way and keep water away from it."
    ],
    independent: "Hours of light each day (for example, 4, 8, and 12 hours)",
    dependent: "Seedling height (mm), number of leaves, and leaf color (1–4 scale)",
    controlled: [
      "Seed type and packet",
      "Pot size and amount of soil",
      "Amount of water and watering schedule",
      "Lamp type and distance from the plants",
      "Room temperature"
    ],
    comparison: "Compare the light groups to each other. The 12-hour group, which is close to a normal day, can be your baseline.",
    repeat: "Use at least 3 separate plants in each light group. Measuring one plant on five different days is not the same as testing five plants.",
    procedure: [
      "Label 9 pots: three for 4 hours, three for 8 hours, and three for 12 hours.",
      "Fill each pot with the same amount of soil. Plant 2 seeds in each pot at the depth on the packet, and water each pot with the same amount.",
      "Keep all pots together in the same place until the seeds sprout. When they sprout, gently pull out the extra seedling so each pot has one plant.",
      "Set the lamp the same height above every pot (about 20–30 cm).",
      "Each day, turn the lamp on and start the clock. When a group's hours are done, cover it with the box so it is in the dark. Keep the room otherwise dark or keep covered plants in a closet.",
      "Water every pot with the same amount on the same days.",
      "Every 3 days, measure each plant's height from the soil to the top of the stem in millimeters. Count its leaves and rate leaf color: 1 = pale yellow, 2 = light green, 3 = medium green, 4 = dark green.",
      "Write observations too, such as thin stems, drooping, or leaning.",
      "Continue for about 2 weeks after the light treatments begin. Then find the average height, leaf count, and color for each group."
    ],
    tables: [
      {
        title: "Height (mm)",
        cols: ["Plant", "Day 0", "Day 3", "Day 6", "Day 9", "Day 12", "Day 14"],
        rows: ["4 hr – plant 1", "4 hr – plant 2", "4 hr – plant 3", "8 hr – plant 1", "8 hr – plant 2", "8 hr – plant 3", "12 hr – plant 1", "12 hr – plant 2", "12 hr – plant 3"]
      },
      {
        title: "Final day",
        cols: ["Plant", "Number of leaves", "Leaf color (1–4)", "Notes (stem, posture)"],
        rows: ["4 hr – plant 1", "4 hr – plant 2", "4 hr – plant 3", "8 hr – plant 1", "8 hr – plant 2", "8 hr – plant 3", "12 hr – plant 1", "12 hr – plant 2", "12 hr – plant 3"]
      }
    ],
    graph: "Line graph: day on the x-axis and average height (mm) on the y-axis, with one line for each light group. Add a bar graph of final average leaf count.",
    questions: [
      "How did average height change over time in each light group?",
      "Did leaf count and leaf color follow the same pattern as height?",
      "Which group looked healthiest overall? What evidence besides height supports your answer?",
      "How different were the three plants in the same group?",
      "Could anything other than light have been different between the groups?"
    ],
    extension: "Keep the hours the same and test how lamp distance (10, 20, and 30 cm) affects seedling growth.",
    note: "Taller is not automatically healthier. Plants with too little light can grow tall, thin, and pale as they stretch toward light. Look at all your measurements together."
  },

  {
    id: "water-seed-germination",
    title: "Water and Seed Germination",
    difficulty: "Easy",
    category: "Plant Science",
    themes: ["plants"],
    keywords: ["seeds", "germination", "sprout", "water", "radish", "paper towel", "bag"],
    summary: "Give groups of seeds different measured amounts of water and count how many sprout.",
    time: { active: "30 minutes to set up, then 5 minutes a day", waiting: "5–7 days" },
    supplies: "Radish seeds, paper towels, zip-top bags, measuring spoons",
    question: "How does the amount of water affect seed germination?",
    investigating: "Seeds need water to sprout, but how much? You will place groups of seeds on damp paper towels with different measured amounts of water and count how many sprout over a week.",
    materials: [
      "50 or more seeds from one packet (radish seeds sprout quickly)",
      "5 or 10 paper towels of the same brand",
      "5 or 10 zip-top sandwich bags",
      "Measuring spoons (1 teaspoon is about 5 mL) or a medicine syringe",
      "Water",
      "Marker for labeling bags",
      "Magnifying glass (optional)"
    ],
    safety: [
      "Wash your hands after handling seeds, and do not eat them.",
      "If mold grows in a bag, do not open it. Ask your teacher how to throw it away."
    ],
    independent: "Amount of water added to each bag: 0, 5, 10, 20, and 30 mL",
    dependent: "Percentage of seeds that germinate (sprout a visible root) within 7 days",
    controlled: [
      "Seed type and packet",
      "Number of seeds per bag (10)",
      "Paper towel size and how it is folded",
      "Location and temperature",
      "What counts as germinated (root at least 2 mm long)"
    ],
    comparison: "The 0 mL bag is a comparison group that shows what happens with no added water.",
    repeat: "Use 10 seeds per bag. If you can, make 2 bags for each water amount (20 seeds per group).",
    procedure: [
      "Label bags: 0 mL, 5 mL, 10 mL, 20 mL, and 30 mL.",
      "Fold one paper towel the same way for each bag so it fits flat inside.",
      "Add the measured water evenly over each paper towel. The 0 mL towel stays dry.",
      "Place 10 seeds spread apart on each towel and slide it into its bag. Seal the bag, leaving a little air inside.",
      "Lay all bags flat in the same spot at room temperature, out of direct sunlight.",
      "Each day at about the same time, count the seeds that have a root at least 2 mm long. Record the count without opening the bags.",
      "Continue for 7 days.",
      "Calculate the germination percentage: (number sprouted ÷ number of seeds) × 100."
    ],
    tables: [
      {
        title: "Seeds sprouted (count each day)",
        cols: ["Water (mL)", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Germination %"],
        rows: ["0", "5", "10", "20", "30"]
      }
    ],
    graph: "Bar graph of final germination percentage for each water amount. You can also make a line graph of the number sprouted each day, one line per water amount.",
    questions: [
      "Which water amount had the highest germination percentage? The lowest?",
      "Did any amount seem to be too much water? What did those seeds look like?",
      "Did some groups sprout faster even if they ended with similar totals?",
      "If you made two bags per group, how similar were they?",
      "How might seeds in soil behave differently from seeds on a paper towel?"
    ],
    extension: "Use the best water amount and test how temperature (refrigerator, room, warm spot) affects germination."
  },

  {
    id: "ramp-height-toy-car",
    title: "Ramp Height and Toy Car Distance",
    difficulty: "Easy",
    category: "Physics / Motion",
    themes: ["motion"],
    keywords: ["ramp", "toy car", "distance", "height", "motion", "speed", "energy", "incline"],
    summary: "Release a toy car from ramps of different heights and measure how far it rolls across the floor.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "Toy car, board or stiff cardboard, books, tape measure",
    question: "How does ramp height affect how far a toy car travels after leaving the ramp?",
    investigating: "You will raise one end of a ramp to different heights, let a toy car roll down without pushing it, and measure how far it rolls across the same floor.",
    materials: [
      "One small toy car that rolls straight",
      "A smooth board or stiff piece of cardboard about 1 m long",
      "Stack of books or blocks to raise the ramp",
      "Meter stick or ruler",
      "Tape measure",
      "Masking tape",
      "A smooth, open floor"
    ],
    safety: [
      "Make sure the stack of books is steady so it cannot fall.",
      "Keep the area clear so no one trips over the ramp or steps on the car."
    ],
    independent: "Ramp height (cm), measured from the floor to the top of the ramp",
    dependent: "Distance (cm) the car travels from the bottom of the ramp to where it stops",
    controlled: [
      "Same car and same ramp",
      "Same starting line on the ramp",
      "Same floor surface",
      "Car is released, never pushed"
    ],
    comparison: "No untreated group is needed. You are comparing ramp heights to each other.",
    repeat: "Do at least 5 runs at each height.",
    procedure: [
      "Put a strip of tape on the ramp near the top as the starting line.",
      "Raise the top of the ramp to 10 cm with books. Measure from the floor to the top edge of the ramp.",
      "Tape the bottom of the ramp to the floor so there is a smooth edge with no bump.",
      "Hold the car behind a ruler at the starting line. Lift the ruler straight up to release the car without pushing it.",
      "When the car stops, measure from the bottom of the ramp straight to the front of the car. Record the distance in centimeters.",
      "If the car hits a wall or falls off the side of the ramp, note it and repeat that run.",
      "Do 5 runs at 10 cm. Then repeat at 20 cm, 30 cm, and 40 cm.",
      "Find the average distance for each height."
    ],
    tables: [
      {
        title: "Distance traveled",
        cols: ["Ramp height (cm)", "Run 1 (cm)", "Run 2 (cm)", "Run 3 (cm)", "Run 4 (cm)", "Run 5 (cm)", "Average (cm)"],
        rows: ["10", "20", "30", "40"]
      }
    ],
    graph: "Line graph or scatterplot: ramp height (cm) on the x-axis and average distance (cm) on the y-axis.",
    questions: [
      "How did average distance change as the ramp got higher?",
      "Did doubling the height double the distance? Use your numbers to explain.",
      "How much did the 5 runs at the same height vary?",
      "Why is it important to release the car instead of pushing it?",
      "What could have caused the car to curve or stop early?"
    ],
    extension: "Keep the ramp at one height and compare how far the car rolls on different floor surfaces, such as tile, carpet, and wood."
  },

  {
    id: "ice-cube-insulation",
    title: "Ice Cube Insulation",
    difficulty: "Easy",
    category: "Thermal Science",
    themes: ["heat"],
    keywords: ["ice", "melting", "insulation", "wrap", "foil", "cloth", "bubble wrap", "keep cold"],
    summary: "Wrap identical cups of ice in different materials and measure how much meltwater each one makes.",
    time: { active: "About 1 hour per round", waiting: "1 hour of melting per round" },
    supplies: "Identical cups, ice cubes, foil, cloth, bubble wrap, measuring cup",
    question: "Which wrapping material slows ice melting the most?",
    investigating: "Insulation slows the movement of heat. You will wrap identical cups of ice in different materials, wait the same amount of time, and measure how much of the ice melted.",
    materials: [
      "5 identical plastic cups with lids (or cover each with the same small square of cardboard)",
      "Ice cubes from the same tray",
      "Kitchen scale (to give each cup the same amount of ice)",
      "Wrapping materials: aluminum foil, a cotton sock or cloth, bubble wrap, newspaper",
      "Tape or rubber bands",
      "Measuring cup or graduated cylinder with mL marks",
      "Fork or spoon to hold back ice while pouring",
      "Timer"
    ],
    safety: [
      "Wipe up water spills right away.",
      "Be careful of sharp edges on aluminum foil."
    ],
    independent: "Wrapping material around the cup",
    dependent: "Meltwater collected (mL) after 60 minutes",
    controlled: [
      "Identical cups and lids",
      "Same mass of ice in each cup (about 60 g)",
      "Same number of layers of each wrap",
      "Same location and starting time",
      "Same melting time"
    ],
    comparison: "Include one unwrapped cup. It shows how fast ice melts with no insulation.",
    repeat: "Repeat the whole test at least 3 times (on different days, or with 3 cups for each material at once).",
    procedure: [
      "Label the cups: foil, cloth, bubble wrap, newspaper, and unwrapped.",
      "Wrap the sides of each cup with one material, using the same number of layers. Leave the unwrapped cup bare.",
      "Weigh about 60 g of ice into each cup as quickly as you can and put on the lids.",
      "Place all cups side by side on the same table, away from sunlight and vents. Start the timer.",
      "After 60 minutes, hold the ice back with a fork and pour the meltwater from one cup into the measuring cup. Record the volume in mL.",
      "Rinse and dry the measuring cup, then do the same for each cup in the same order.",
      "Repeat the whole test at least 2 more times.",
      "Find the average meltwater for each material."
    ],
    tables: [
      {
        title: "Meltwater after 60 minutes",
        cols: ["Wrapping", "Trial 1 (mL)", "Trial 2 (mL)", "Trial 3 (mL)", "Average (mL)"],
        rows: ["Unwrapped", "Aluminum foil", "Cloth", "Bubble wrap", "Newspaper"]
      }
    ],
    graph: "Bar graph: wrapping material on the x-axis and average meltwater (mL) on the y-axis.",
    questions: [
      "Which material had the least meltwater? Which had the most?",
      "How did each wrapped cup compare with the unwrapped cup?",
      "What do the materials that worked best have in common?",
      "Were your three trials similar? What might have changed between them?",
      "Why is it important for every cup to start with the same mass of ice?"
    ],
    extension: "Test whether 1, 2, or 3 layers of your best material changes the amount of meltwater."
  },

  {
    id: "water-temperature-dissolving",
    title: "Water Temperature and Dissolving",
    difficulty: "Easy",
    category: "Chemistry",
    themes: ["chemistry"],
    keywords: ["sugar", "dissolve", "temperature", "water", "warm", "cold", "solution", "stir"],
    summary: "Time how long sugar takes to dissolve in cool, room-temperature, and warm water.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "Sugar, clear cups, thermometer, measuring tools, timer",
    question: "How does water temperature affect how quickly sugar dissolves?",
    investigating: "When sugar dissolves, it breaks into pieces too small to see and spreads through the water. You will time how long the same amount of sugar takes to disappear in water at different temperatures, stirring the same way every time.",
    materials: [
      "Granulated sugar",
      "Measuring tablespoon",
      "3 or more clear plastic cups of the same size",
      "Measuring cup",
      "Thermometer",
      "Cool water (from the refrigerator), room-temperature water, and warm tap water",
      "Spoon for stirring",
      "Timer or stopwatch"
    ],
    safety: [
      "Do not use boiling water. An adult should prepare the warm water and check that it is below 45 °C (113 °F).",
      "Do not taste or drink anything you use in the experiment.",
      "Use plastic cups, not glass, and wipe spills right away."
    ],
    independent: "Water temperature (cool, room temperature, warm)",
    dependent: "Time (seconds) for the sugar to completely dissolve",
    controlled: [
      "Amount of water (200 mL)",
      "Amount of sugar (1 level tablespoon)",
      "Stirring speed (about one circle per second) and spoon",
      "Same type of cup",
      "Same rule for deciding when sugar is dissolved"
    ],
    comparison: "Room-temperature water can be your baseline to compare cool and warm water against.",
    repeat: "Do at least 3 trials at each temperature, using fresh water and sugar each time.",
    procedure: [
      "Decide what “dissolved” means before you begin, such as “no crystals can be seen on the bottom when I look from the side and from below.”",
      "Measure 200 mL of cool water into a clear cup. Measure and record its temperature.",
      "Add 1 level tablespoon of sugar and start the timer at the same moment.",
      "Stir in steady circles, about one circle per second.",
      "Stop the timer when the sugar is dissolved by your rule. Record the time in seconds.",
      "Repeat with room-temperature water and with warm water, recording each starting temperature.",
      "Repeat the whole set at least 2 more times with fresh water and sugar.",
      "Find the average time for each temperature."
    ],
    tables: [
      {
        title: "Dissolving times",
        cols: ["Water", "Starting temp (°C)", "Trial 1 (s)", "Trial 2 (s)", "Trial 3 (s)", "Average (s)"],
        rows: ["Cool", "Room temperature", "Warm"]
      }
    ],
    graph: "Line graph or scatterplot: water temperature (°C) on the x-axis and average dissolving time (s) on the y-axis.",
    questions: [
      "How did dissolving time change as the water got warmer?",
      "Were your trials at the same temperature close together? Why might they differ?",
      "Why was it important to stir the same way every time?",
      "Deciding when sugar is “dissolved” takes judgment. How could you make that decision more consistent?",
      "Did the water temperature change during the trial? How might that matter?"
    ],
    extension: "At room temperature, compare how quickly the same mass of granulated sugar, powdered sugar, and a sugar cube dissolves.",
    note: "Warm water may cool down a little while you stir. Record the starting temperature so you know what you actually tested."
  },

  {
    id: "surface-color-warming",
    title: "Surface Color and Warming",
    difficulty: "Easy",
    category: "Energy / Thermal Science",
    themes: ["heat"],
    keywords: ["color", "sunlight", "temperature", "black", "white", "absorb", "solar", "paper"],
    summary: "Cover identical cups of water with different colored paper and measure how much each warms in sunlight.",
    time: { active: "About 1 hour per round", waiting: "None (measure during the hour)" },
    supplies: "Identical cups, colored construction paper, thermometers, tape",
    question: "How does the color of a paper covering affect a container's temperature in sunlight?",
    investigating: "Different colors reflect and absorb different amounts of light. You will cover identical cups of water with different colors of the same kind of paper, set them in the sun together, and measure how much the water warms.",
    materials: [
      "4–5 identical clear plastic cups",
      "Construction paper from the same pack in white, black, and 2 other colors",
      "Tape",
      "Measuring cup",
      "Water",
      "Identical thermometers, one per cup (or one digital thermometer used in the same order)",
      "Timer",
      "A sunny spot outdoors or in a sunny window"
    ],
    safety: [
      "Never look directly at the sun.",
      "If you are outside, wear a hat and drink water.",
      "Use digital or alcohol thermometers, not mercury thermometers."
    ],
    independent: "Color of the paper covering",
    dependent: "Temperature change of the water (°C) after 40 minutes",
    controlled: [
      "Same paper type and thickness",
      "Identical cups and the same amount of water (150 mL)",
      "Same starting water temperature",
      "Cups placed together in the same sunlight",
      "Same type of thermometer and measuring times"
    ],
    comparison: "Add an uncovered cup to show how much the water warms with no paper covering.",
    repeat: "Repeat on at least 3 sunny days, or test 3 cups of each color at the same time. Swap the cup positions each trial.",
    procedure: [
      "Wrap the sides of each cup with one color of paper and tape it. Cut a matching paper lid with a small hole for the thermometer.",
      "Fill each cup with 150 mL of water from the same pitcher so all start at the same temperature.",
      "Put on the lids and insert a thermometer in each cup. Record the starting temperatures.",
      "Set the cups side by side in direct sunlight at the same time.",
      "Record each cup's temperature every 10 minutes for 40 minutes.",
      "Calculate the change for each cup: final temperature − starting temperature.",
      "Repeat on other days (or with more cups), moving each color to a different position.",
      "Find the average temperature change for each color."
    ],
    tables: [
      {
        title: "Temperatures for one trial (°C)",
        cols: ["Covering", "Start", "10 min", "20 min", "30 min", "40 min", "Change"],
        rows: ["White", "Black", "", "", "Uncovered"]
      },
      {
        title: "Temperature change summary",
        cols: ["Covering", "Trial 1 (°C)", "Trial 2 (°C)", "Trial 3 (°C)", "Average change (°C)"],
        rows: ["White", "Black", "", "", "Uncovered"]
      }
    ],
    graph: "Line graph: time (min) on the x-axis and temperature (°C) on the y-axis, with one line per color. Add a bar graph of average temperature change.",
    questions: [
      "Which color warmed the most? Which warmed the least?",
      "How did the covered cups compare with the uncovered cup?",
      "Did the colors change temperature at a steady rate or faster at the start?",
      "Did clouds or shade affect any trial? How did you handle it?",
      "How could your results help someone choose a color for a roof, a car, or clothing?"
    ],
    extension: "After the warming test, move the cups into the shade and measure how quickly each color cools."
  },

  {
    id: "pendulum-length",
    title: "Pendulum Length and Swing Time",
    difficulty: "Easy",
    category: "Physics / Motion",
    themes: ["motion"],
    keywords: ["pendulum", "swing", "string", "length", "period", "time", "washer"],
    summary: "Change the string length of a pendulum and time 10 complete swings.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "String, metal washers, tape, ruler, stopwatch, protractor",
    question: "How does string length affect a pendulum's swing time?",
    investigating: "A pendulum is a weight hanging from a string that swings back and forth. You will change the string length and time how long 10 complete swings take.",
    materials: [
      "Strong string (about 1.5 m)",
      "2–3 large metal washers taped together (the hanging weight)",
      "A pencil or ruler taped firmly to the edge of a table (the pivot)",
      "Masking tape",
      "Meter stick",
      "Protractor",
      "Stopwatch",
      "A partner"
    ],
    safety: [
      "Make sure the pivot is firmly taped so the pendulum cannot fall.",
      "Keep faces and feet away from the swinging weight."
    ],
    independent: "String length (cm), from the pivot to the middle of the washers",
    dependent: "Time (s) for 10 complete swings",
    controlled: [
      "Same hanging weight",
      "Same release angle (about 15°)",
      "Release without pushing",
      "Same person timing"
    ],
    comparison: "No untreated group is needed. You are comparing string lengths to each other.",
    repeat: "Do at least 3 trials for each length.",
    procedure: [
      "Tie the washers to one end of the string. Tie the other end to the pivot.",
      "Adjust the string so the length from the pivot to the middle of the washers is 20 cm.",
      "Hold a protractor at the pivot. Pull the weight to the side until the string is at 15°.",
      "Let go without pushing. Start the stopwatch at the same moment.",
      "Count complete swings. One complete swing is over and back to where it started. Stop the timer at the end of the 10th swing.",
      "Record the time. Do 3 trials at this length.",
      "Repeat with lengths of 40, 60, 80, and 100 cm.",
      "Find the average time for 10 swings, then divide by 10 to find the time for one swing."
    ],
    tables: [
      {
        title: "Swing times",
        cols: ["Length (cm)", "Trial 1: 10 swings (s)", "Trial 2: 10 swings (s)", "Trial 3: 10 swings (s)", "Average: 10 swings (s)", "Time for 1 swing (s)"],
        rows: ["20", "40", "60", "80", "100"]
      }
    ],
    graph: "Line graph or scatterplot: string length (cm) on the x-axis and time for one swing (s) on the y-axis.",
    questions: [
      "How did swing time change as the string got longer?",
      "When the length doubled, did the swing time double? Use your numbers.",
      "Why might timing 10 swings give a better result than timing just one?",
      "How close were your 3 trials at each length?",
      "What would you predict for a 120 cm string? How could you check?"
    ],
    extension: "Keep the length at 60 cm and test whether the number of washers changes the swing time."
  },

  {
    id: "soil-drainage",
    title: "Soil Drainage",
    difficulty: "Easy",
    category: "Earth Science",
    themes: ["earth"],
    keywords: ["soil", "drainage", "sand", "clay", "water", "dirt", "funnel", "earth"],
    summary: "Pour the same amount of water through different soils and measure how much drains out.",
    time: { active: "About 1 hour", waiting: "1–2 days to let soils air-dry first" },
    supplies: "3 soil types, plastic bottles, coffee filters, measuring cup",
    question: "Which soil type allows water to drain through fastest?",
    investigating: "Soils are made of particles of different sizes. You will pour the same amount of water through equal amounts of different soils and measure how much drains through in a set time.",
    materials: [
      "3 soil types, such as sand, potting soil, and clay-rich soil from outside (with permission)",
      "3 identical 2-liter plastic bottles (an adult cuts each one in half)",
      "3 coffee filters",
      "Measuring cup with mL marks",
      "Water",
      "Timer",
      "Newspaper or tray for spills"
    ],
    safety: [
      "An adult should cut the bottles.",
      "Wear gloves or wash your hands after handling soil.",
      "Do not collect soil where animals use the bathroom or where chemicals may have been sprayed."
    ],
    independent: "Soil type",
    dependent: "Water collected (mL) after 5 minutes",
    controlled: [
      "Same soil volume (1 cup, about 250 mL)",
      "Identical containers and filters",
      "Same amount of water (200 mL), poured the same way",
      "Soils equally dry at the start",
      "Same collecting time"
    ],
    comparison: "No untreated group is needed. You are comparing soil types to each other.",
    repeat: "Do at least 3 trials for each soil, using fresh soil each time.",
    procedure: [
      "Spread each soil on newspaper for 1–2 days so all soils are about equally dry.",
      "Have an adult cut each bottle in half. Turn the top half upside down into the bottom half to make a funnel and collector.",
      "Place a coffee filter inside each funnel.",
      "Measure 1 cup of soil into each funnel without packing it down.",
      "Pour 200 mL of water slowly and evenly over the soil and start the timer.",
      "After 5 minutes, lift the funnel and pour the collected water into the measuring cup. Record the amount in mL.",
      "Empty the soil and use fresh soil for each new trial.",
      "Find the average water collected for each soil."
    ],
    tables: [
      {
        title: "Water drained in 5 minutes",
        cols: ["Soil type", "Trial 1 (mL)", "Trial 2 (mL)", "Trial 3 (mL)", "Average (mL)"],
        rows: ["Sand", "Potting soil", "Clay-rich soil"]
      }
    ],
    graph: "Bar graph: soil type on the x-axis and average water collected (mL) on the y-axis.",
    questions: [
      "Which soil drained the most water in 5 minutes? Which drained the least?",
      "How did the soil particles look or feel? Did that connect with your results?",
      "Where did the water go that did not drain through?",
      "How might soil drainage matter for gardens, farms, or building foundations?",
      "Were your trials consistent? What might have changed between them?"
    ],
    extension: "Mix sand and potting soil in different amounts (all sand, half and half, all soil) and test how the mixture affects drainage."
  },

  {
    id: "rubber-band-pitch",
    title: "Rubber Band Pitch",
    difficulty: "Easy",
    category: "Sound / Physics",
    themes: ["sound"],
    keywords: ["rubber band", "pitch", "sound", "vibration", "frequency", "music", "tuner"],
    summary: "Slide a bridge under a rubber band to change its vibrating length and measure the pitch.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "Sturdy box, thick rubber band, pencil, ruler, tuner (if approved)",
    question: "How does the vibrating length of a rubber band affect its pitch?",
    investigating: "Sounds are made by vibrations. You will slide a pencil under a stretched rubber band to change how much of it can vibrate, pluck it, and measure or compare the pitch.",
    materials: [
      "A sturdy open box or plastic container about 30 cm long",
      "One thick rubber band that fits snugly around the box the long way",
      "A pencil to use as a bridge",
      "Ruler",
      "A teacher-approved tuner app or tuner (optional)",
      "Safety glasses"
    ],
    safety: [
      "Wear safety glasses in case the rubber band snaps.",
      "Do not overstretch the band or aim it at anyone.",
      "Only use a tuner app or device your teacher approves."
    ],
    independent: "Vibrating length (cm): the distance from the pencil bridge to the edge of the box",
    dependent: "Pitch, measured as frequency (Hz) with a tuner, or recorded as higher or lower",
    controlled: [
      "Same rubber band and box",
      "Band stays wrapped the same way (tension changed only by the bridge, not by stretching it farther)",
      "Same plucking strength and spot",
      "Same tuner position"
    ],
    comparison: "No untreated group is needed. You are comparing lengths to each other.",
    repeat: "Pluck at least 3 times at each length and record each reading.",
    procedure: [
      "Stretch the rubber band around the box the long way.",
      "Slide the pencil under the band so the part between the pencil and the box edge is 25 cm long.",
      "Pluck the middle of that part with the same strength each time.",
      "If you have a tuner, hold it the same distance away and record the frequency in hertz (Hz). Without a tuner, record whether the sound is higher or lower than the length before.",
      "Pluck 3 times and record each reading.",
      "Move the bridge to make vibrating lengths of 20, 15, 10, and 5 cm and repeat.",
      "Find the average frequency for each length."
    ],
    tables: [
      {
        title: "Pitch",
        cols: ["Vibrating length (cm)", "Pluck 1 (Hz)", "Pluck 2 (Hz)", "Pluck 3 (Hz)", "Average (Hz)", "Higher or lower than before?"],
        rows: ["25", "20", "15", "10", "5"]
      }
    ],
    graph: "Line graph or scatterplot: vibrating length (cm) on the x-axis and average frequency (Hz) on the y-axis. Without a tuner, make a chart showing the order from lowest to highest pitch.",
    questions: [
      "How did the pitch change as the vibrating length got shorter?",
      "Did the change in pitch seem steady, or bigger at some lengths?",
      "Moving the bridge may change the band's tension a little. How could that affect your results?",
      "How is this similar to how a guitar or violin player changes notes?",
      "Were your three plucks at the same length consistent?"
    ],
    extension: "Keep the vibrating length the same and compare a thin rubber band with a thick one.",
    note: "Rubber bands make quiet sounds with several tones mixed together, so a tuner may jump around. Take the reading that shows up most often."
  },

  {
    id: "drops-on-a-penny",
    title: "Drops on a Penny",
    difficulty: "Easy",
    category: "Water Science / Surface Tension",
    themes: ["water", "chemistry"],
    keywords: ["penny", "drops", "surface tension", "soap", "water", "dropper", "coin"],
    summary: "Count how many drops of water a penny can hold before it spills, with different amounts of soap mixed in.",
    time: { active: "About 1 hour", waiting: "None" },
    supplies: "Pennies, dropper, dish soap, small cups, paper towels",
    question: "How does adding dish soap affect the number of drops a penny can hold?",
    investigating: "Water molecules pull on each other, which lets water form a dome on top of a penny. You will mix different amounts of dish soap into water and count how many drops the penny holds before the water spills.",
    materials: [
      "One penny (and a spare)",
      "One plastic dropper or pipette",
      "Liquid dish soap",
      "4 small cups",
      "Measuring cup",
      "Water",
      "Paper towels",
      "A small flat plate to hold the penny"
    ],
    safety: [
      "Do not taste the soap water. Wash your hands if soap gets on them, and keep it away from your eyes.",
      "Wipe up spills."
    ],
    independent: "Soap concentration: 0, 1, 2, and 4 drops of dish soap in 50 mL of water",
    dependent: "Number of drops the penny holds before water spills over the edge",
    controlled: [
      "Same penny, heads side up",
      "Same dropper",
      "Same drop height (about 1 cm above the penny)",
      "Same cleaning and drying steps between trials"
    ],
    comparison: "Plain water (0 drops of soap) is the comparison group.",
    repeat: "Do at least 3 trials (5 is better) for each soap mixture.",
    procedure: [
      "Label the cups 0, 1, 2, and 4. Put 50 mL of water in each.",
      "Add that many drops of dish soap to each cup and stir gently so it does not foam.",
      "Rinse the penny with plain water, dry it with a paper towel, and lay it heads up on the plate.",
      "Fill the dropper with plain water (cup 0). Hold it straight up about 1 cm above the penny.",
      "Squeeze out one drop at a time, counting each drop, until water spills over the edge. Record the number of drops that stayed on.",
      "Clean and dry the penny the same way after every trial.",
      "Test each mixture in order from least soap to most soap. Rinse the dropper well with plain water before switching mixtures.",
      "Find the average number of drops for each mixture."
    ],
    tables: [
      {
        title: "Drops held",
        cols: ["Soap (drops in 50 mL)", "Trial 1", "Trial 2", "Trial 3", "Trial 4", "Trial 5", "Average"],
        rows: ["0 (plain water)", "1", "2", "4"]
      }
    ],
    graph: "Bar graph or line graph: soap amount on the x-axis and average number of drops on the y-axis.",
    questions: [
      "How did adding soap change the number of drops?",
      "Did more soap always make a bigger difference?",
      "Why do you think the order of testing (least soap to most soap) matters?",
      "What did the water dome look like with and without soap?",
      "What might cause trials with the same mixture to be different?"
    ],
    extension: "Use plain water and compare how many drops a penny, nickel, and quarter hold. Measure each coin's diameter too."
  },

  /* ===================== MEDIUM ===================== */

  {
    id: "salt-seed-germination",
    title: "Salt and Seed Germination",
    difficulty: "Medium",
    category: "Plant Science / Environmental Science",
    themes: ["plants", "earth"],
    keywords: ["salt", "seeds", "germination", "roots", "salty water", "radish", "sprout"],
    summary: "Water groups of seeds with different salt solutions and measure germination and early root length.",
    time: { active: "45 minutes to set up, then 10 minutes a day", waiting: "7 days" },
    supplies: "Radish seeds, table salt, paper towels, zip-top bags, ruler",
    question: "How does salt concentration affect seed germination?",
    investigating: "Salt can build up in soil near roads or in dry farmland. You will water groups of seeds with different salt solutions and measure how many sprout and how long their first roots grow.",
    materials: [
      "80 or more radish seeds from one packet",
      "Table salt",
      "Measuring spoons and a kitchen scale (if available)",
      "Measuring cup",
      "4 cups or jars for the solutions",
      "8 paper towels of the same brand",
      "8 zip-top sandwich bags",
      "Ruler with millimeter marks",
      "Marker for labels"
    ],
    safety: [
      "Wash your hands after handling seeds and salt water. Do not eat the seeds.",
      "Salt water stings cuts and eyes, so keep your hands away from your face.",
      "If mold grows in a bag, do not open it. Ask your teacher how to throw it away."
    ],
    independent: "Salt concentration of the watering solution: 0, ¼, ½, and 1 teaspoon of salt per cup (250 mL) of water",
    dependent: "Germination percentage after 7 days and root length (mm) on day 4",
    controlled: [
      "Seed type and packet",
      "10 seeds per bag",
      "Same amount of solution per bag (15 mL)",
      "Same paper towel size and fold",
      "Same location and temperature"
    ],
    comparison: "Plain water (0 teaspoons of salt) is the comparison group.",
    repeat: "Make 2 bags for each salt solution (20 seeds per group).",
    procedure: [
      "Mix each solution in a labeled cup: 250 mL of water plus 0, ¼, ½, or 1 teaspoon of salt. Stir until the salt dissolves. If you have a scale, record the grams of salt.",
      "Label 2 bags for each solution.",
      "Fold a paper towel to fit each bag. Add 15 mL of the matching solution evenly over the towel.",
      "Place 10 seeds spaced apart on each towel, slide it into the bag, and seal it with a little air inside.",
      "Lay all bags flat in the same spot at room temperature, out of direct sunlight.",
      "Each day, count the seeds with a root at least 2 mm long, without opening the bags.",
      "On day 4, measure the root length of every sprouted seed through the bag with a ruler. Record each length.",
      "On day 7, record the final count and calculate the germination percentage for each solution."
    ],
    tables: [
      {
        title: "Seeds sprouted (both bags together, out of 20)",
        cols: ["Salt per cup", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Germination %"],
        rows: ["0 tsp", "¼ tsp", "½ tsp", "1 tsp"]
      },
      {
        title: "Root length on day 4",
        cols: ["Salt per cup", "Root lengths (mm) — list each sprouted seed", "Average root length (mm)"],
        rows: ["0 tsp", "¼ tsp", "½ tsp", "1 tsp"]
      }
    ],
    graph: "Bar graph of germination percentage for each salt amount, and a second bar graph of average root length.",
    questions: [
      "How did germination percentage change as the salt amount increased?",
      "Did root length show the same pattern as germination?",
      "Were the two bags in each group similar? What might explain differences?",
      "Water can evaporate inside the bags. How might that change the salt concentration?",
      "What could your results mean for plants growing near salted roads?"
    ],
    extension: "Compare how two different kinds of seeds, such as radish and bean, respond to the same salt solutions."
  },

  {
    id: "soil-type-plant-growth",
    title: "Soil Type and Plant Growth",
    difficulty: "Medium",
    category: "Plant Science",
    themes: ["plants", "earth"],
    keywords: ["soil", "plants", "growth", "beans", "potting soil", "sand", "clay", "garden"],
    summary: "Grow the same kind of plant in different soils and track height and leaves for several weeks.",
    time: { active: "1 hour to set up, then about 15 minutes twice a week", waiting: "About 4 weeks" },
    supplies: "Bean seeds, 12 pots, 3 soil types, ruler, measuring cup",
    question: "How does soil type affect plant growth?",
    investigating: "Soils hold water and nutrients differently. You will grow several plants of the same kind in each of three soils, with everything else kept the same, and measure their growth for about four weeks.",
    materials: [
      "One packet of bush bean seeds (or another fast-growing plant)",
      "12 identical pots with drainage holes",
      "3 soil types, such as potting mix, sandy soil, and clay-rich garden soil (with permission)",
      "Trays to catch water",
      "Measuring cup",
      "Ruler",
      "Masking tape and marker",
      "A sunny window or the same grow light for all pots"
    ],
    safety: [
      "Wear gloves or wash your hands after handling soil.",
      "Get permission before digging soil, and avoid areas with animal waste or sprayed chemicals.",
      "Do not eat the seeds."
    ],
    independent: "Soil type",
    dependent: "Plant height (cm) and number of leaves",
    controlled: [
      "Same plant species and seed packet",
      "Same pot size and amount of soil",
      "Same light",
      "Same amount of water on the same schedule",
      "Same temperature"
    ],
    comparison: "Potting mix, which is made for growing plants, can be the baseline for comparing the other soils.",
    repeat: "Grow 4 separate plants in each soil. Measuring one plant many times is not the same as testing many plants.",
    procedure: [
      "Label 4 pots for each soil type.",
      "Fill each pot with the same amount of its soil.",
      "Plant 2 seeds in each pot at the same depth and water each pot with the same amount.",
      "Place all pots together in the same light. Rotate their positions every few days so no pot always gets the best spot.",
      "When seedlings appear, remove the extra one so each pot has one plant. Do this for all pots on the same day.",
      "Water every pot with the same amount on the same schedule (for example, 50 mL every other day).",
      "Twice a week, measure each plant's height from the soil to the top of the stem and count the leaves.",
      "Write observations such as leaf color, wilting, or soil that stays soggy or dries out fast.",
      "Continue for about 4 weeks. Find the average height and leaf count for each soil on each measuring day."
    ],
    tables: [
      {
        title: "Height (cm), measured twice a week",
        cols: ["Plant", "Wk 1 #1", "Wk 1 #2", "Wk 2 #1", "Wk 2 #2", "Wk 3 #1", "Wk 3 #2", "Wk 4 #1", "Wk 4 #2"],
        rows: ["Soil 1 – plant 1", "Soil 1 – plant 2", "Soil 1 – plant 3", "Soil 1 – plant 4", "Soil 2 – plant 1", "Soil 2 – plant 2", "Soil 2 – plant 3", "Soil 2 – plant 4", "Soil 3 – plant 1", "Soil 3 – plant 2", "Soil 3 – plant 3", "Soil 3 – plant 4"]
      },
      {
        title: "Leaf count on the final day",
        cols: ["Soil type", "Plant 1", "Plant 2", "Plant 3", "Plant 4", "Average"],
        rows: ["", "", ""]
      }
    ],
    graph: "Line graph: measuring day on the x-axis and average height (cm) on the y-axis, one line per soil type.",
    questions: [
      "Which soil had the tallest plants on average? Which had the most leaves?",
      "Did the differences appear right away or later?",
      "How different were the 4 plants in the same soil?",
      "The same amount of water may stay soggy in one soil and dry out fast in another. How might that be part of your results?",
      "What would you change if you did this again?"
    ],
    extension: "At the end, gently wash the roots of each plant and compare root length for each soil."
  },

  {
    id: "water-filter-materials",
    title: "Water Filter Materials",
    difficulty: "Medium",
    category: "Environmental Science / Engineering",
    themes: ["earth", "engineering", "water"],
    keywords: ["water filter", "filtration", "cloudy water", "sand", "gravel", "charcoal", "cotton", "clean water"],
    summary: "Pour cloudy water through different filter materials and rate how clear it comes out.",
    time: { active: "About 2 hours", waiting: "None" },
    supplies: "Plastic bottles, sand, gravel, cotton, coffee filters, clean soil",
    question: "Which filter material removes the most visible particles from cloudy water?",
    investigating: "Filters trap particles as water passes through. You will make cloudy water with clean soil, pour it through different filter materials, and rate how clear each sample is and how long it takes to filter.",
    materials: [
      "Clean soil from a bag of potting soil or garden soil (about ½ cup)",
      "Tap water (about 4 liters)",
      "Large pitcher or jar for mixing",
      "3 or more identical plastic bottles cut in half by an adult (top half becomes a funnel)",
      "Filter materials: sand, small gravel, cotton balls, coffee filters, and aquarium activated charcoal (rinsed)",
      "Measuring cup with mL marks",
      "Clear cups for collected water",
      "An index card with a thick black X drawn on it",
      "Timer",
      "Gloves"
    ],
    safety: [
      "Do not drink any test water, even if it looks clear. Clear water is not necessarily safe; these filters do not remove germs or chemicals.",
      "Use only clean soil mixed with tap water, never water from a pond, ditch, or other unknown source.",
      "An adult should cut the bottles.",
      "Wear gloves when handling charcoal and wash your hands afterward."
    ],
    independent: "Filter material",
    dependent: "Water clarity (1–5 scale) and time (s) to collect 100 mL of filtered water",
    controlled: [
      "Same cloudy water, stirred before each pour",
      "Same amount of water poured (200 mL)",
      "Same depth of filter material (about 5 cm) in identical funnels",
      "Same clarity scale, lighting, and background",
      "Same person rating clarity"
    ],
    comparison: "Save a cup of unfiltered cloudy water and rate it too. It shows the starting clarity.",
    repeat: "Do at least 3 trials for each material, using fresh material each time.",
    procedure: [
      "Mix about 2 tablespoons of clean soil into 1 liter of tap water to make cloudy water. Mix more the same way as needed.",
      "Make a clarity scale: hold a clear cup of water in front of the X card. 1 = cannot see the X, 2 = X is a faint blur, 3 = X is visible but water is cloudy, 4 = X is clear with slight cloudiness, 5 = looks as clear as tap water.",
      "Place a coffee filter or a small cotton plug in the neck of each funnel so the material cannot fall through. Use the same plug in every funnel.",
      "Add about 5 cm of one filter material to each funnel. Rinse sand, gravel, and charcoal first with tap water.",
      "Stir the cloudy water. Measure 200 mL and pour it into a funnel at a steady speed. Start the timer.",
      "Stop the timer when 100 mL has collected below. If a filter has not released 100 mL after 10 minutes, record “more than 10 min.”",
      "Pour the filtered water into a clear cup and rate its clarity using the X card. If possible, have a partner rate it without knowing which filter was used.",
      "Repeat with fresh material for each trial.",
      "Find the average clarity rating and average time for each material."
    ],
    tables: [
      {
        title: "Filter results",
        cols: ["Material", "Trial", "Time to collect 100 mL (s)", "Clarity (1–5)", "Notes (color, particles)"],
        rows: ["Unfiltered", "Sand – 1", "Sand – 2", "Sand – 3", "Gravel – 1", "Gravel – 2", "Gravel – 3", "Cotton – 1", "Cotton – 2", "Cotton – 3", "Charcoal – 1", "Charcoal – 2", "Charcoal – 3"]
      }
    ],
    graph: "Two bar graphs: average clarity rating for each material, and average filtering time for each material.",
    questions: [
      "Which material produced the clearest water? Which was fastest?",
      "Was the clearest filter also the slowest? What trade-offs did you notice?",
      "How consistent were the clarity ratings for the same material?",
      "Why is clearer water not necessarily safe to drink?",
      "How could you make the clarity rating less dependent on opinion?"
    ],
    extension: "Layer the materials in different orders inside one funnel and test which order gives the clearest water.",
    note: "The clarity scale is a judgment, so describe exactly how you rated each sample and use the same lighting every time."
  },

  {
    id: "electromagnet-coils",
    title: "Electromagnet Coil Count",
    difficulty: "Medium",
    category: "Electrical / Magnetism",
    themes: ["electricity"],
    keywords: ["electromagnet", "coils", "wire", "nail", "magnet", "paper clips", "battery", "magnetism"],
    summary: "Wrap different numbers of wire coils around a nail and count how many paper clips the electromagnet lifts.",
    time: { active: "1–2 hours", waiting: "None" },
    supplies: "Large iron nail, insulated wire, 1.5 V battery and holder, paper clips",
    question: "How does the number of wire coils affect an electromagnet's strength?",
    investigating: "Electric current flowing through a coil of wire makes a magnetic field, and an iron core makes it stronger. You will wrap different numbers of turns around the same nail and count how many paper clips it can lift.",
    materials: [
      "One large iron or steel nail or bolt (about 8 cm long)",
      "About 3 m of thin insulated (plastic-coated) copper wire",
      "One teacher-approved 1.5 V alkaline battery (D or AA) in a battery holder",
      "A box of identical small paper clips",
      "Wire strippers (adult use)",
      "Masking tape",
      "Kitchen scale (optional, to find the mass of clips)"
    ],
    safety: [
      "Use only a teacher-approved low-voltage battery and insulated wire, with an adult supervising.",
      "Connect the battery only for a few seconds at a time and disconnect between trials. The wire and battery can heat up quickly.",
      "Stop right away if the wire, battery, or holder feels warm, and let it cool.",
      "Never connect anything to a household outlet, and never use lithium or rechargeable batteries for this project.",
      "An adult should strip the wire ends. Be careful of the nail's sharp point."
    ],
    independent: "Number of turns of wire around the nail: 10, 20, 30, and 40",
    dependent: "Number of paper clips lifted (or their total mass in grams)",
    controlled: [
      "Same nail and same type of paper clips",
      "Same total length of wire in the circuit (extra wire is left unwrapped)",
      "Same battery",
      "Same connection time (about 5 seconds)",
      "Same way of dipping the nail into the clips"
    ],
    comparison: "Before each trial, touch the disconnected nail to the clips. It should lift none or almost none. This shows how much magnetism is left in the nail.",
    repeat: "Do at least 3 trials for each number of turns.",
    procedure: [
      "Have an adult strip about 2 cm of plastic off both wire ends.",
      "Wrap 10 tight turns of wire around the nail, all in the same direction. Leave the rest of the wire unwrapped so the total wire length stays the same for every test.",
      "Spread the paper clips in a shallow pile.",
      "Touch the disconnected nail to the clips and record how many it lifts (this should be 0 or very few).",
      "Connect the wire ends to the battery holder. Within 5 seconds, touch the nail tip to the pile, lift it straight up, and count the clips hanging on.",
      "Disconnect the battery right away. Record the number of clips.",
      "Wait a minute before the next trial. Do 3 trials at 10 turns.",
      "Unwrap and rewrap the nail with 20, 30, and 40 turns, repeating steps 4–7 each time. Test in a mixed order if you can, such as 30, 10, 40, 20.",
      "Find the average number of clips for each number of turns."
    ],
    tables: [
      {
        title: "Clips lifted",
        cols: ["Turns of wire", "Clips before connecting", "Trial 1 (clips)", "Trial 2 (clips)", "Trial 3 (clips)", "Average (clips)"],
        rows: ["10", "20", "30", "40"]
      }
    ],
    graph: "Line graph or scatterplot: number of turns on the x-axis and average clips lifted on the y-axis.",
    questions: [
      "How did the number of clips change as you added turns?",
      "Was the change steady, or did it level off?",
      "Did the battery seem to weaken during testing? How could that affect your results?",
      "Counting clips skips partial strength (a clip that almost sticks). How could you measure strength more exactly?",
      "Why did you keep the total wire length the same even though the number of turns changed?"
    ],
    extension: "Keep the number of turns the same and compare nails or bolts of different thicknesses.",
    note: "Changing the number of turns can also change how much current flows, because current depends on the wire's resistance and the battery. Keeping the total wire length the same helps, but a battery also weakens as you use it. Mention this limitation in your conclusion."
  },

  {
    id: "fruit-battery",
    title: "Fruit Battery Comparison",
    difficulty: "Medium",
    category: "Electrical / Chemistry",
    themes: ["electricity", "chemistry"],
    keywords: ["fruit battery", "lemon", "potato", "voltage", "multimeter", "zinc", "copper", "electricity"],
    summary: "Make simple batteries from different fruits and measure their voltage with a multimeter.",
    time: { active: "About 1½ hours", waiting: "None" },
    supplies: "Several fruits, galvanized nails, copper strips, multimeter",
    question: "How does fruit type affect a simple battery's voltage?",
    investigating: "Two different metals pushed into a juicy fruit can make a small battery. You will use the same metals in different fruits and measure the voltage of each one.",
    materials: [
      "3 each of several fruits, such as lemons, limes, oranges, and apples (a potato also works)",
      "Galvanized (zinc-coated) nails, one per test",
      "Copper strips or pieces of thick copper wire, one per test",
      "Digital multimeter (ask your teacher about borrowing one)",
      "Ruler",
      "Paper towels",
      "Masking tape and marker"
    ],
    safety: [
      "Do not eat the fruit afterward. Metal from the electrodes gets into the fruit, so throw it away.",
      "Be careful with sharp nail points. An adult can help push electrodes into firm fruit.",
      "Wash your hands when you finish."
    ],
    independent: "Fruit type",
    dependent: "Voltage (V) measured with a multimeter",
    controlled: [
      "Same kinds of metal electrodes",
      "Same distance between electrodes (2 cm)",
      "Same insertion depth (3 cm)",
      "Fruits at room temperature",
      "Same meter setting"
    ],
    comparison: "No untreated group is needed. You are comparing fruits to each other.",
    repeat: "Test at least 3 separate fruits of each type.",
    procedure: [
      "Mark a line 3 cm from the tip on each nail and copper strip so you can push them in to the same depth.",
      "Push a zinc nail and a copper strip into one fruit, 2 cm apart, up to the 3 cm mark. Do not let them touch inside.",
      "Set the multimeter to DC volts (the 20 V setting if it has one).",
      "Touch the red probe to the copper and the black probe to the zinc nail. Wait until the number settles, then record the voltage.",
      "Remove the electrodes and wipe them clean with a paper towel.",
      "Repeat with each fruit, testing 3 fruits of each type.",
      "Find the average voltage for each fruit type."
    ],
    tables: [
      {
        title: "Voltage",
        cols: ["Fruit type", "Fruit 1 (V)", "Fruit 2 (V)", "Fruit 3 (V)", "Average (V)"],
        rows: ["Lemon", "Lime", "Orange", "Apple"]
      }
    ],
    graph: "Bar graph: fruit type on the x-axis and average voltage (V) on the y-axis.",
    questions: [
      "Which fruit gave the highest average voltage? The lowest?",
      "How similar were the three fruits of the same type?",
      "Were the differences between fruits large or small compared with the differences between fruits of the same kind?",
      "What do you think the fruit does in this battery, and what do the metals do?",
      "Why might a fruit battery with a good voltage still be unable to light a regular bulb?"
    ],
    extension: "Using your best fruit, test how the distance between the electrodes (1, 2, 4, and 6 cm) affects voltage.",
    note: "Voltage alone does not show how much useful power a battery can deliver. Fruit batteries produce very little current, which is why they usually cannot run devices by themselves."
  },

  {
    id: "paper-bridge-strength",
    title: "Paper Bridge Strength",
    difficulty: "Medium",
    category: "Engineering / Structures",
    themes: ["engineering"],
    keywords: ["bridge", "paper", "strength", "load", "fold", "shape", "pennies", "structure"],
    summary: "Fold the same paper into different bridge shapes and find how many pennies each can hold across a gap.",
    time: { active: "About 1½ hours", waiting: "None" },
    supplies: "Printer paper, books, small paper cup, pennies, ruler",
    question: "How does paper bridge shape affect the load it can support?",
    investigating: "Engineers shape materials to make them stronger. You will fold identical sheets of paper into different bridge shapes, place each across the same gap, and add pennies until it fails.",
    materials: [
      "Printer paper (8.5 × 11 in), several sheets",
      "2 equal stacks of books",
      "Ruler",
      "Small paper cup",
      "About 200 pennies (or other identical small weights)",
      "Tape (2 small 2 cm pieces per bridge)",
      "Kitchen scale (optional)"
    ],
    safety: [
      "Stack the books carefully so they cannot fall on your fingers.",
      "Keep pennies away from young children."
    ],
    independent: "Bridge shape: flat sheet, zigzag (accordion) folds, U-channel, and rolled tubes",
    dependent: "Maximum number of pennies supported before the bridge fails",
    controlled: [
      "One sheet of the same paper per bridge",
      "Same amount of tape",
      "Same gap between the book stacks (20 cm)",
      "Cup placed at the center of the bridge",
      "Pennies added the same way"
    ],
    comparison: "The flat sheet is the baseline that the folded shapes are compared to.",
    repeat: "Build and test at least 3 bridges of each shape.",
    procedure: [
      "Set the two book stacks exactly 20 cm apart.",
      "Decide what “failure” means before you start, such as “the bridge touches the table or the cup falls.”",
      "Fold one sheet into the first shape. Use no more than 2 small pieces of tape.",
      "Lay the bridge across the gap so the same amount rests on each stack.",
      "Set the empty cup at the center of the bridge.",
      "Add pennies gently, 5 at a time. When the bridge starts to sag, add them 1 at a time.",
      "When the bridge fails, record the last number of pennies it held.",
      "Build 3 bridges of each shape and test them all the same way.",
      "Find the average number of pennies for each shape. You can multiply by 2.5 g to estimate the mass (one U.S. penny is about 2.5 g)."
    ],
    tables: [
      {
        title: "Maximum load",
        cols: ["Bridge shape", "Bridge 1 (pennies)", "Bridge 2 (pennies)", "Bridge 3 (pennies)", "Average (pennies)", "Average mass (g)"],
        rows: ["Flat sheet", "Zigzag", "U-channel", "Rolled tubes"]
      }
    ],
    graph: "Bar graph: bridge shape on the x-axis and average maximum load (pennies or grams) on the y-axis.",
    questions: [
      "Which shape held the most pennies on average? How did it compare with the flat sheet?",
      "How did each bridge fail? Did it bend, buckle, or tear?",
      "Why do you think some shapes were stronger with the same amount of paper?",
      "How consistent were the bridges of the same shape?",
      "Where do you see similar shapes in real bridges or buildings?"
    ],
    extension: "Use your strongest shape and test how the gap length (10, 15, 20, and 25 cm) affects the load it holds."
  },

  {
    id: "parachute-size",
    title: "Parachute Size and Falling Time",
    difficulty: "Medium",
    category: "Physics / Aerodynamics",
    themes: ["motion"],
    keywords: ["parachute", "falling", "air resistance", "drag", "canopy", "gravity", "time"],
    summary: "Make parachutes with different canopy sizes and time how long each takes to fall.",
    time: { active: "About 2 hours", waiting: "None" },
    supplies: "Plastic bag, string, metal washers, scissors, stopwatch",
    question: "How does parachute area affect falling time?",
    investigating: "Air pushes against a falling parachute and slows it down. You will make parachutes that are the same in every way except canopy size, drop them from the same height, and time the fall.",
    materials: [
      "Thin plastic bags or a plastic tablecloth (one material for all canopies)",
      "String",
      "Identical metal washers (the same number for each parachute)",
      "Ruler and marker",
      "Scissors",
      "Tape",
      "Stopwatch (or a teacher-approved device that records video)",
      "Masking tape to mark a drop height on a wall",
      "A partner"
    ],
    safety: [
      "Drop parachutes only while standing on the floor. No climbing on chairs, tables, or furniture, and no dropping from stairs, balconies, or elevated walkways.",
      "Plastic bags can cause suffocation. Keep them away from young children.",
      "Be careful with scissors."
    ],
    independent: "Canopy area (cm²): squares with sides of 15, 25, 35, and 45 cm",
    dependent: "Falling time (s) from release to touching the floor",
    controlled: [
      "Same canopy material and square shape",
      "Same string length (30 cm per string, 4 strings)",
      "Same attached mass (same washers)",
      "Same drop height (about 2 m, marked on a wall)",
      "Same folding and release method, indoors away from fans and vents"
    ],
    comparison: "Drop the washers alone with no parachute to see how long the mass takes to fall without a canopy.",
    repeat: "Do at least 5 drops for each parachute. Short falls are hard to time, so more trials help.",
    procedure: [
      "Cut 4 square canopies with sides of 15, 25, 35, and 45 cm. Calculate each area (side × side).",
      "Tape a 30 cm string to each corner of a canopy. Tie the 4 strings together and attach the washers.",
      "Put a strip of tape on a wall about 2 m above the floor. Stand on the floor and hold the top of the canopy even with the tape.",
      "Fold or hold each parachute the same way before release.",
      "Release it while your partner starts the stopwatch. Stop it when the washers touch the floor.",
      "Do 5 drops for each parachute and for the washers alone.",
      "If a parachute tangles or hits a wall, note it and drop again.",
      "Find the average falling time for each canopy."
    ],
    tables: [
      {
        title: "Falling times",
        cols: ["Side (cm)", "Area (cm²)", "Drop 1 (s)", "Drop 2 (s)", "Drop 3 (s)", "Drop 4 (s)", "Drop 5 (s)", "Average (s)"],
        rows: ["No parachute", "15", "25", "35", "45"]
      }
    ],
    graph: "Line graph or scatterplot: canopy area (cm²) on the x-axis and average falling time (s) on the y-axis.",
    questions: [
      "How did falling time change as the canopy area increased?",
      "Did the biggest parachute fall the most slowly? By how much compared with the washers alone?",
      "How much did your times vary for the same parachute? What caused that?",
      "Why might a short drop height make your differences harder to see?",
      "How could you time the falls more accurately?"
    ],
    extension: "Make a circle canopy and a square canopy with the same area and compare their falling times.",
    note: "A 2 m fall takes only a second or two, so reaction time matters. Video recording, if your teacher allows it, can help you time more exactly."
  },

  {
    id: "salt-ice-melting",
    title: "Salt and Ice Melting",
    difficulty: "Medium",
    category: "Chemistry / Thermal Science",
    themes: ["chemistry", "heat"],
    keywords: ["salt", "ice", "melting", "meltwater", "roads", "winter", "freezing"],
    summary: "Sprinkle different amounts of salt on equal amounts of ice and measure the meltwater after a set time.",
    time: { active: "About 1½ hours", waiting: "20 minutes of melting per round" },
    supplies: "Ice cubes, table salt, kitchen scale, bowls, measuring cup",
    question: "How does the amount of salt affect ice melting over a fixed period?",
    investigating: "Salt is spread on icy roads in winter. You will sprinkle different measured amounts of salt on equal amounts of ice and measure how much meltwater forms in the same time.",
    materials: [
      "Ice cubes from the same tray or bag",
      "Table salt",
      "Kitchen scale that measures in grams",
      "5 identical small bowls or cups",
      "Measuring cup or graduated cylinder with mL marks",
      "Fork to hold back ice while pouring",
      "Timer",
      "Paper towels"
    ],
    safety: [
      "Do not taste the salt or meltwater.",
      "Salt water stings cuts and eyes, so wash your hands when you finish.",
      "Do not hold ice in your bare hands for long."
    ],
    independent: "Mass of salt added: 0, 2, 4, 8, and 16 g",
    dependent: "Meltwater (mL) collected after 20 minutes",
    controlled: [
      "Same mass of ice in each bowl (about 100 g)",
      "Identical bowls",
      "Same starting time and melting time",
      "Same room location",
      "Salt sprinkled evenly the same way"
    ],
    comparison: "The bowl with no salt shows how much ice melts on its own in the same time.",
    repeat: "Repeat the full test at least 3 times.",
    procedure: [
      "Label the bowls 0 g, 2 g, 4 g, 8 g, and 16 g.",
      "Weigh about 100 g of ice into each bowl, working quickly.",
      "Weigh each amount of salt and sprinkle it evenly over the ice in its bowl. Start the timer when all the salt is added.",
      "Leave all bowls side by side for 20 minutes.",
      "Hold the ice back with a fork and pour the meltwater from one bowl into the measuring cup. Record the volume in mL.",
      "Rinse and dry the measuring cup and repeat for each bowl in the same order.",
      "Repeat the whole test at least 2 more times.",
      "Find the average meltwater for each salt amount."
    ],
    tables: [
      {
        title: "Meltwater after 20 minutes",
        cols: ["Salt (g)", "Trial 1 (mL)", "Trial 2 (mL)", "Trial 3 (mL)", "Average (mL)"],
        rows: ["0", "2", "4", "8", "16"]
      }
    ],
    graph: "Line graph or scatterplot: salt mass (g) on the x-axis and average meltwater (mL) on the y-axis.",
    questions: [
      "How did the amount of meltwater compare with the no-salt bowl?",
      "When you doubled the salt, did the meltwater double? Use your numbers.",
      "Did your results level off at higher salt amounts?",
      "The dissolved salt adds a tiny bit to the meltwater's volume. How much might that matter?",
      "How could your results help someone decide how much salt to use on a sidewalk?"
    ],
    extension: "Use the same mass of table salt, sugar, and sand and compare which melts the most ice.",
    note: "Adding more salt does not guarantee a proportionally bigger effect. Let your data show whether the effect grows steadily or levels off."
  },

  {
    id: "evaporation-surface-area",
    title: "Evaporation and Surface Area",
    difficulty: "Medium",
    category: "Water Science",
    themes: ["water"],
    keywords: ["evaporation", "surface area", "water", "containers", "mass", "drying", "water cycle"],
    summary: "Put equal amounts of water in containers of different widths and weigh the water lost each day.",
    time: { active: "30 minutes to set up, then 5 minutes a day", waiting: "5–7 days" },
    supplies: "3 containers of different widths, kitchen scale, ruler, water",
    question: "How does exposed surface area affect evaporation?",
    investigating: "Water evaporates from its surface. You will put the same amount of water in containers with different-sized openings and weigh them each day to see how much water evaporates.",
    materials: [
      "3 containers with straight sides and different widths, such as a narrow cup, a medium bowl, and a wide baking pan (2 of each if possible)",
      "Kitchen scale that measures in grams",
      "Measuring cup",
      "Water",
      "Ruler",
      "Masking tape and marker"
    ],
    safety: [
      "Wipe up spills, and handle glass containers carefully.",
      "Place containers where pets and small children cannot drink from or knock them over."
    ],
    independent: "Exposed water surface area (cm²)",
    dependent: "Mass of water lost (g) each day",
    controlled: [
      "Same starting amount of water (200 mL)",
      "Same location, temperature, and airflow",
      "Weighed at the same time each day",
      "Same scale"
    ],
    comparison: "No untreated group is needed. You are comparing surface areas to each other.",
    repeat: "Use 2 containers of each width if possible, and record for at least 5 days.",
    procedure: [
      "Label each container.",
      "Measure the width (diameter) of each container's opening at the water line. For a round container, area = 3.14 × (diameter ÷ 2) × (diameter ÷ 2). For a rectangle, area = length × width.",
      "Pour 200 mL of room-temperature water into each container.",
      "Weigh each container with its water. Record this as the day 0 mass.",
      "Place all containers together in a spot away from windows, heaters, and vents.",
      "Weigh each container at the same time every day for 5–7 days.",
      "Calculate the water lost each day (yesterday's mass − today's mass) and the total lost so far. If a container dries out, record the day it became empty."
    ],
    tables: [
      {
        title: "Container sizes",
        cols: ["Container", "Diameter or length × width (cm)", "Surface area (cm²)"],
        rows: ["Narrow", "Medium", "Wide"]
      },
      {
        title: "Daily mass (g)",
        cols: ["Day", "Narrow", "Medium", "Wide"],
        rows: ["0", "1", "2", "3", "4", "5", "6", "7"]
      }
    ],
    graph: "Line graph: day on the x-axis and total water lost (g) on the y-axis, one line per container. You can also make a scatterplot of total water lost vs. surface area.",
    questions: [
      "Which container lost water the fastest?",
      "Was the amount lost each day steady, or did it change over time?",
      "If one container had about twice the surface area of another, did it lose about twice as much water?",
      "The narrow container also had deeper water. How might depth affect your results?",
      "Where could this idea be useful, such as drying clothes or storing water?"
    ],
    extension: "Use identical containers and compare evaporation in a sunny spot and a shady spot."
  },

  {
    id: "crystal-growth-cooling",
    title: "Crystal Growth and Cooling",
    difficulty: "Medium",
    category: "Chemistry / Crystals",
    themes: ["chemistry"],
    keywords: ["crystals", "epsom salt", "cooling", "solution", "crystal size", "chemistry"],
    summary: "Split one Epsom salt solution into cups that cool at different speeds and measure the crystals.",
    time: { active: "About 1½ hours", waiting: "1–2 days" },
    supplies: "Epsom salt, hot water (adult), identical cups, ruler, camera",
    question: "How does cooling rate affect crystal size?",
    investigating: "Crystals form when a dissolved substance comes out of a solution in an orderly pattern. You will divide one Epsom salt solution into equal portions, cool them at different speeds, and measure the crystals that form.",
    materials: [
      "Epsom salt (about 1 cup)",
      "Hot tap water or water heated by an adult",
      "Heat-safe measuring cup or pitcher",
      "Spoon for stirring",
      "6 identical clear cups (2 per cooling condition)",
      "A refrigerator, a counter, and a small foam cooler or thick towels",
      "Ruler with millimeter marks",
      "Camera or a teacher-approved device for photos",
      "Paper towels",
      "Safety glasses"
    ],
    safety: [
      "An adult should heat and pour the hot water.",
      "Wear safety glasses when the hot solution is being poured.",
      "Do not taste the Epsom salt or the solution.",
      "Wash your hands after handling crystals."
    ],
    independent: "Cooling conditions: fast (refrigerator), medium (counter), and slow (cup wrapped in towels or set in a closed foam cooler)",
    dependent: "Crystal size (mm): length of the 5 largest crystals in each cup",
    controlled: [
      "Same prepared solution, divided equally",
      "Same amount of solution in each cup",
      "Identical cups",
      "Same time before checking (24 hours)",
      "Cups not moved or bumped while cooling"
    ],
    comparison: "The counter (room temperature) cups can be the baseline for comparing faster and slower cooling.",
    repeat: "Use 2 cups for each cooling condition. If you have time, repeat the whole experiment.",
    procedure: [
      "Do a small pilot trial first to see how long your crystals take to form.",
      "An adult measures 1 cup (about 250 mL) of hot water into a heat-safe pitcher.",
      "Stir in Epsom salt a spoonful at a time until no more will dissolve and a little stays on the bottom.",
      "Pour the clear solution evenly into the 6 cups, the same amount in each. Leave any undissolved salt behind.",
      "Put 2 cups in the refrigerator, leave 2 on the counter, and put 2 wrapped in towels or inside a closed foam cooler.",
      "Leave all cups undisturbed for 24 hours.",
      "Carefully pour off the leftover liquid. Lay the crystals on a paper towel.",
      "Measure the length of the 5 largest crystals in each cup in millimeters. Photograph them next to a ruler.",
      "Find the average length of the 5 largest crystals for each cooling condition."
    ],
    tables: [
      {
        title: "Crystal lengths (mm)",
        cols: ["Condition & cup", "Crystal 1", "Crystal 2", "Crystal 3", "Crystal 4", "Crystal 5", "Average (mm)", "Notes (shape, number)"],
        rows: ["Refrigerator – cup 1", "Refrigerator – cup 2", "Counter – cup 1", "Counter – cup 2", "Insulated – cup 1", "Insulated – cup 2"]
      }
    ],
    graph: "Bar graph: cooling condition on the x-axis and average crystal length (mm) on the y-axis.",
    questions: [
      "Which cooling condition produced the largest crystals on average?",
      "Did the number of crystals or their shape change with cooling speed?",
      "How similar were the two cups in each condition?",
      "The refrigerator cups also ended colder than the others. How might that affect how much salt came out of the solution?",
      "What did your pilot trial teach you about timing?"
    ],
    extension: "Use the same cooling condition and test how the amount of Epsom salt dissolved affects crystal size.",
    note: "Crystal growth can be unpredictable, even when you follow the same steps. A pilot trial helps you choose a good waiting time, and photos help you compare crystals fairly."
  },

  {
    id: "balloon-rocket-payload",
    title: "Balloon Rocket Payload",
    difficulty: "Medium",
    category: "Physics / Engineering",
    themes: ["motion", "engineering"],
    keywords: ["balloon rocket", "payload", "string", "straw", "mass", "distance", "thrust", "force"],
    summary: "Send a balloon rocket along a string with different payloads and measure how far it travels.",
    time: { active: "About 2 hours", waiting: "None" },
    supplies: "Balloons, string, straw, tape, paper clips, tape measure",
    question: "How does added payload affect the distance a balloon rocket travels?",
    investigating: "Air rushing out of a balloon pushes it forward. You will attach different small masses to a balloon rocket on a string track and measure how far it travels.",
    materials: [
      "Several identical balloons (latex-free if anyone is allergic)",
      "About 5 m of smooth string or fishing line",
      "A drinking straw",
      "Masking tape",
      "Identical paper clips or small metal washers (the payload)",
      "Binder clip or clothespin to hold the balloon closed",
      "Flexible measuring tape (to measure balloon size)",
      "Long tape measure",
      "Two chairs or sturdy anchors",
      "Kitchen scale (optional, to find the payload mass)"
    ],
    safety: [
      "Set up the string where no one walks into it, and take it down when you finish.",
      "Do not overinflate balloons. Pick up popped balloon pieces right away because they are a choking hazard.",
      "Use latex-free balloons if anyone nearby has a latex allergy."
    ],
    independent: "Payload: 0, 2, 4, 6, and 8 paper clips",
    dependent: "Distance traveled (cm) along the string",
    controlled: [
      "Same balloon type and inflation size (same measured circumference)",
      "Same string, tension, and level height",
      "Same starting position",
      "Same straw length and taping method",
      "Payload attached at the same spot"
    ],
    comparison: "The rocket with no payload (0 clips) is the baseline.",
    repeat: "Do at least 3 launches for each payload.",
    procedure: [
      "Thread the string through the straw. Tie the string tightly between two chairs at the same height, about 5 m apart. Mark the knots so the tension stays the same.",
      "Put a tape mark on the string as the starting line.",
      "Blow up the balloon until its circumference is a set size (for example, 60 cm), measured with the flexible tape. Clip the neck closed.",
      "Tape the balloon to the straw the same way each time, with the opening facing the starting chair.",
      "Hang the payload from the tape under the middle of the balloon. Start with 0 clips.",
      "Line up the back of the straw with the starting mark. Remove the clip to release the balloon.",
      "Measure from the starting mark to the back of the straw where it stops. Record the distance.",
      "Do 3 launches with each payload. If a balloon wears out or pops, switch to a new one of the same kind and note it.",
      "Find the average distance for each payload."
    ],
    tables: [
      {
        title: "Distance traveled",
        cols: ["Payload (clips)", "Payload mass (g)", "Launch 1 (cm)", "Launch 2 (cm)", "Launch 3 (cm)", "Average (cm)"],
        rows: ["0", "2", "4", "6", "8"]
      }
    ],
    graph: "Line graph or scatterplot: payload (clips or grams) on the x-axis and average distance (cm) on the y-axis.",
    questions: [
      "How did distance change as you added payload?",
      "Was the change steady, or did it drop off faster at some point?",
      "How consistent were your launches with the same payload?",
      "Why is it important to inflate the balloon to the same size each time?",
      "What does your data suggest about why real rockets try to keep weight low?"
    ],
    extension: "Keep the payload at 0 and test how the angle of the string (flat, slightly uphill, steeper) affects distance."
  },

  {
    id: "wind-evaporation",
    title: "Wind and Evaporation",
    difficulty: "Medium",
    category: "Weather / Environmental Science",
    themes: ["water", "earth"],
    keywords: ["wind", "fan", "evaporation", "airflow", "weather", "drying", "water"],
    summary: "Blow air across dishes of water at different fan settings and measure how much water evaporates.",
    time: { active: "About 1 hour per session", waiting: "3 hours per fan setting" },
    supplies: "Shallow dishes, fan, kitchen scale, measuring cup",
    question: "How does airflow affect evaporation rate?",
    investigating: "Moving air carries water vapor away from a surface. You will set dishes of water in front of a fan at different settings and measure how much mass each loses in the same amount of time.",
    materials: [
      "3 identical wide, shallow dishes, such as pie pans",
      "A fan with several speed settings (plug-in or battery-powered)",
      "Kitchen scale (one that measures to 0.1 g is best)",
      "Measuring cup",
      "Water",
      "Meter stick",
      "Tray to hold the dishes",
      "Thermometer to check room temperature"
    ],
    safety: [
      "Keep water and the fan apart. Put the dishes on a tray at least 1 m from the fan and never carry water over or near it.",
      "An adult should set up and plug in a plug-in fan. Dry your hands before touching the fan's controls.",
      "Keep fingers away from the fan blades."
    ],
    independent: "Fan setting: off, low, medium, and high, at a fixed distance of 1 m",
    dependent: "Mass of water lost (g) in 3 hours",
    controlled: [
      "Identical dishes and the same amount of water (200 mL)",
      "Same fan and same distance",
      "Same room, and about the same temperature and time of day",
      "Same test length (3 hours)"
    ],
    comparison: "The fan-off setting is the comparison group.",
    repeat: "Test 3 dishes side by side for each setting. If possible, repeat each setting on another day in a mixed order.",
    procedure: [
      "Place the fan on a table and mark a spot on another surface exactly 1 m in front of it for the tray of dishes.",
      "Pour 200 mL of room-temperature water into each dish.",
      "Weigh each dish with water and record the starting mass.",
      "Set the tray with the 3 dishes side by side at the marked spot. Record the room temperature.",
      "Turn the fan to the first setting (start with off). Leave it for 3 hours.",
      "Carefully weigh each dish again and record the final mass.",
      "Calculate the mass lost: starting mass − final mass.",
      "On other sessions, repeat with low, medium, and high, at about the same time of day.",
      "Find the average mass lost for each fan setting."
    ],
    tables: [
      {
        title: "Mass lost in 3 hours",
        cols: ["Fan setting", "Room temp (°C)", "Dish 1 lost (g)", "Dish 2 lost (g)", "Dish 3 lost (g)", "Average lost (g)"],
        rows: ["Off", "Low", "Medium", "High"]
      }
    ],
    graph: "Bar graph: fan setting on the x-axis and average mass lost (g) on the y-axis.",
    questions: [
      "How did the fan setting affect how much water evaporated?",
      "How much more water evaporated on high than with the fan off?",
      "Did room temperature differ between sessions? How might that affect your results?",
      "Were the 3 dishes in the same session similar?",
      "How does this connect to why laundry dries faster on a windy day?"
    ],
    extension: "Keep the fan on one setting and test how distance from the fan (0.5, 1, and 2 m) affects evaporation."
  },

  /* ===================== HARD ===================== */

  {
    id: "solar-panel-angle",
    title: "Solar Panel Angle and Output",
    difficulty: "Hard",
    category: "Electrical / Renewable Energy",
    themes: ["electricity", "heat"],
    keywords: ["solar panel", "angle", "voltage", "power", "sun", "renewable energy", "resistor", "multimeter"],
    summary: "Tilt a small solar panel to different angles and measure its electrical output.",
    time: { active: "About 2 hours", waiting: "None (test on a clear day near midday)" },
    supplies: "Small solar panel, resistor, multimeter, protractor, cardboard stand",
    question: "How does a small solar panel's angle affect its electrical output?",
    investigating: "Solar panels turn sunlight into electricity. You will tilt a small panel to different angles toward the sun and measure the voltage across a resistor to compare its output.",
    materials: [
      "A small teacher-approved solar panel (about 5–6 V, from an educational kit)",
      "A fixed resistor your teacher chooses to match the panel (often around 100 Ω)",
      "Alligator-clip leads",
      "Digital multimeter",
      "Protractor",
      "Cardboard, tape, and a ruler to build an adjustable stand",
      "Compass or compass app (optional)",
      "Clipboard and timer"
    ],
    safety: [
      "Use only teacher-approved low-voltage equipment. Never connect the panel to an outlet, a battery, or other devices without approval.",
      "Never look directly at the sun.",
      "Panels can get hot in the sun. Touch the edges only.",
      "Wear a hat and sunscreen, and drink water when outside."
    ],
    independent: "Panel tilt angle from the ground: 0°, 15°, 30°, 45°, 60°, 75°, and 90°",
    dependent: "Voltage (V) across the resistor; power can be calculated from it",
    controlled: [
      "Same panel, resistor, and meter",
      "Panel faces the same direction (toward the sun)",
      "Clear sky and the same location",
      "All angles tested within a short period around midday",
      "Meter read after the same waiting time (5 seconds)"
    ],
    comparison: "The flat (0°) position can serve as a baseline for comparing the tilted positions.",
    repeat: "Test every angle in at least 3 rounds, switching the order each round.",
    procedure: [
      "Build a cardboard stand that lets you tilt the panel and hold it steady. Mark the angles using the protractor.",
      "Connect the resistor across the panel's two wires with alligator clips.",
      "Set the multimeter to DC volts. Connect the probes across the resistor.",
      "Go outside on a clear day near midday. Point the panel toward the sun's direction (south, in most of the United States).",
      "Set the panel at 0°, wait 5 seconds, and record the voltage.",
      "Quickly test every angle the same way. One full round should take about 5–10 minutes.",
      "Do round 2 in reverse order (90° down to 0°) and round 3 in the original order. Stop and note it if clouds pass.",
      "Find the average voltage for each angle.",
      "Optional: calculate power. Power (W) = voltage × voltage ÷ resistance. Multiply by 1000 to get milliwatts (mW)."
    ],
    tables: [
      {
        title: "Panel output",
        cols: ["Angle (°)", "Round 1 (V)", "Round 2 (V)", "Round 3 (V)", "Average (V)", "Power (mW)"],
        rows: ["0", "15", "30", "45", "60", "75", "90"]
      }
    ],
    graph: "Line graph: panel angle (°) on the x-axis and average voltage (V) or power (mW) on the y-axis.",
    questions: [
      "At which angle was the output greatest? How did output change on either side of that angle?",
      "How did the rounds compare? Did output drift as the sun moved?",
      "How might your best angle change at a different time of day or season?",
      "Why did you measure across a resistor instead of measuring the panel with nothing connected?",
      "What could have caused errors, such as clouds, shadows, or the stand slipping?"
    ],
    extension: "Repeat the test at three times of day (morning, midday, afternoon) and compare the best angle at each time."
  },

  {
    id: "wind-turbine-blades",
    title: "Wind Turbine Blade Angle",
    difficulty: "Hard",
    category: "Engineering / Renewable Energy",
    themes: ["engineering", "electricity"],
    keywords: ["wind turbine", "blades", "angle", "pitch", "fan", "voltage", "renewable energy", "motor", "generator"],
    summary: "Build a model wind turbine, change the blade angle, and measure its electrical output.",
    time: { active: "4–5 hours (including building)", waiting: "None" },
    supplies: "Small DC motor, cork hub, cardstock blades, fan, multimeter",
    question: "How does blade angle affect a model wind turbine's output?",
    investigating: "Wind turbines turn moving air into electricity. You will build a small turbine whose blades can be set at different angles, run it in front of a fan, and measure its output.",
    materials: [
      "A small DC motor from an educational kit (used as a generator)",
      "A cork or thick foam disk for the hub",
      "Cardstock and wooden skewers or craft sticks for lightweight blades",
      "Protractor",
      "A fixed resistor your teacher chooses for the motor",
      "Alligator-clip leads and a digital multimeter",
      "A sturdy stand (wood block or box) with tape or clamps",
      "A box fan or desk fan",
      "Meter stick",
      "Low-temperature glue gun (adult use) or strong tape",
      "Safety glasses"
    ],
    safety: [
      "Wear safety glasses while the turbine spins, and keep fingers and hair away from the blades.",
      "Use lightweight blades, and clamp or tape the stand so it cannot tip over.",
      "An adult should help with cutting and hot glue.",
      "An adult should set up the fan. Keep leads away from the fan and turbine blades. Never connect the motor to an outlet."
    ],
    independent: "Blade angle (°) between the blade's flat face and the turbine's spinning circle: 10°, 20°, 30°, 45°, and 60°",
    dependent: "Voltage (V) across a fixed resistor",
    controlled: [
      "Same number of blades (4), size, and material",
      "Same hub and motor",
      "Same fan setting and distance (1 m)",
      "Same resistor and meter",
      "Reading taken at the same time after starting (20 seconds)"
    ],
    comparison: "No untreated group is needed. You are comparing blade angles to each other.",
    repeat: "Do at least 3 trials for each blade angle.",
    procedure: [
      "Cut 4 identical blades from cardstock (for example, 10 cm × 4 cm) and tape each to a skewer.",
      "Push the 4 skewers into the cork hub evenly spaced. Twist each blade so it can be set to an angle.",
      "Attach the hub to the motor shaft. Mount the motor firmly on the stand so the blades face the fan.",
      "Connect the resistor across the motor's wires, then connect the multimeter (DC volts) across the resistor.",
      "Use the protractor to set every blade to 10°. Check each blade carefully.",
      "Place the turbine exactly 1 m from the fan. Turn the fan on its chosen setting and start a timer.",
      "At 20 seconds, record the voltage. Turn off the fan and let the blades stop.",
      "Do 3 trials at each angle, rechecking blade angles each time.",
      "Repeat for 20°, 30°, 45°, and 60°. Find the average voltage for each angle."
    ],
    tables: [
      {
        title: "Turbine output",
        cols: ["Blade angle (°)", "Trial 1 (V)", "Trial 2 (V)", "Trial 3 (V)", "Average (V)", "Notes (wobble, speed)"],
        rows: ["10", "20", "30", "45", "60"]
      }
    ],
    graph: "Line graph: blade angle (°) on the x-axis and average voltage (V) on the y-axis.",
    questions: [
      "Which blade angle produced the most output?",
      "What happened to the output at the smallest and largest angles? Why might that be?",
      "Did the turbine wobble or spin unevenly at any angle? How might that affect the readings?",
      "How close were your 3 trials at each angle?",
      "How is your model different from a real wind turbine?"
    ],
    extension: "Use your best angle and compare turbines with 2, 3, 4, and 6 blades."
  },

  {
    id: "earthquake-model-buildings",
    title: "Earthquake-Resistant Model Buildings",
    difficulty: "Hard",
    category: "Engineering / Earth Science",
    themes: ["engineering", "earth"],
    keywords: ["earthquake", "building", "bracing", "shake table", "structure", "engineering", "cross-bracing"],
    summary: "Build model frames with different bracing and count how many standard shakes each survives.",
    time: { active: "5–6 hours (including building)", waiting: "Glue drying time, if used" },
    supplies: "Straws or craft sticks, tape, string, box lid, marbles, pennies",
    question: "How does cross-bracing affect a model building's resistance to shaking?",
    investigating: "Engineers add diagonal braces to help buildings resist shaking. You will build identical model frames with different bracing, test them on a simple shake table using the same motion, and count how many shakes each survives.",
    materials: [
      "Drinking straws (or craft sticks) and masking tape or pipe cleaners for joints",
      "String or extra straws for braces",
      "A sturdy box lid or tray with a flat board on top (the shake table)",
      "About 20 marbles or 4 tennis balls for the board to roll on",
      "2 wooden blocks taped down as stoppers",
      "A small bag of pennies or modeling clay (about 100 g) for a roof load",
      "Ruler",
      "Metronome app approved by your teacher (or a steady count)",
      "Camera (optional, to record each test)"
    ],
    safety: [
      "Keep marbles inside the box lid so no one slips on them.",
      "An adult should help with any cutting or hot glue.",
      "Keep fingers clear of the board while shaking."
    ],
    independent: "Bracing arrangement: no braces, X-braces on 2 sides, and X-braces on all 4 sides",
    dependent: "Number of standard shaking cycles before failure (and damage observations)",
    controlled: [
      "Same frame size (3 stories, about 30 cm tall) and materials",
      "Same number of joints and amount of tape",
      "Same roof load (100 g)",
      "Same shake distance (set by the stoppers) and shaking beat",
      "Same rule for failure"
    ],
    comparison: "The frame with no braces is the comparison group.",
    repeat: "Build at least 2 models of each design (3 is better). Do not repair a model and retest it as if it were new.",
    procedure: [
      "Build the shake table: put marbles in the box lid and set the board on top. Tape two stoppers so the board can slide 4 cm left and right.",
      "Decide on failure before testing, such as “the roof load falls off, a joint breaks, or the frame leans more than 45°.”",
      "Build identical 3-story frames. Then add bracing: none, X-braces on 2 opposite sides, or X-braces on all 4 sides.",
      "Tape the roof load to the top of the first model and tape its base to the center of the board.",
      "Set the metronome to a steady beat (for example, 120 beats per minute). Slide the board from stopper to stopper on each beat. Over and back is one cycle.",
      "Count cycles until the model fails. Stop at 100 cycles and record “100+” if it survives.",
      "Write what happened: where it bent, which joints failed, and how much it swayed.",
      "Test every model the same way.",
      "Find the average cycles before failure for each design."
    ],
    tables: [
      {
        title: "Shake test results",
        cols: ["Design & model", "Cycles before failure", "How it failed / damage notes"],
        rows: ["No braces – model 1", "No braces – model 2", "No braces – model 3", "2 sides braced – model 1", "2 sides braced – model 2", "2 sides braced – model 3", "4 sides braced – model 1", "4 sides braced – model 2", "4 sides braced – model 3"]
      }
    ],
    graph: "Bar graph: bracing design on the x-axis and average cycles before failure on the y-axis.",
    questions: [
      "Which design survived the most cycles on average?",
      "Did the braced models fail in different places than the unbraced ones?",
      "How similar were models of the same design? What might explain differences?",
      "If a model reached 100+ cycles, what does that tell you, and what doesn't it tell you?",
      "How is your shake table different from a real earthquake?"
    ],
    extension: "Test whether the height of the building (2, 3, or 4 stories) affects how many cycles it survives with the same bracing.",
    note: "A model is useful for comparing designs, but it cannot show exactly how a real building would act. Real earthquakes shake in several directions with changing strength, and real buildings use different materials at a much larger size."
  },

  {
    id: "soil-erosion-ground-cover",
    title: "Soil Erosion and Ground Cover",
    difficulty: "Hard",
    category: "Environmental Science / Earth Science",
    themes: ["earth", "water", "plants"],
    keywords: ["erosion", "soil", "ground cover", "grass", "mulch", "rain", "sediment", "runoff"],
    summary: "Pour the same simulated rain on bare, mulched, and grassy soil and weigh the soil that washes away.",
    time: { active: "4–5 hours spread over several days", waiting: "2–3 weeks to grow grass, plus 1–3 days to dry each sediment sample" },
    supplies: "3 trays, soil, mulch, grass seed, watering bottle, kitchen scale",
    question: "How does ground cover affect soil erosion?",
    investigating: "Rain can wash soil away, which is called erosion. You will prepare trays of soil that are bare, covered with mulch, or covered with growing grass, sprinkle them with the same amount of simulated rain, and weigh the soil that washes off.",
    materials: [
      "3 identical shallow trays, such as disposable aluminum roasting pans (2 of each if possible)",
      "Garden soil or topsoil (the same bag or source for all trays)",
      "Grass seed (planted 2–3 weeks early)",
      "Mulch, such as wood chips or straw",
      "Blocks or books to tilt the trays to the same slope",
      "A plastic bottle with about 10 small holes poked in the cap (adult pokes holes) to make rain",
      "Measuring cup",
      "Collection containers for runoff",
      "Shallow dishes or pie tins for drying sediment",
      "Kitchen scale (one that measures to 0.1 g is best)",
      "Ruler",
      "Scissors (adult use)"
    ],
    safety: [
      "An adult should cut drain notches in the trays and poke holes in the bottle cap.",
      "Wash your hands after handling soil. Do not use soil that may contain fertilizer, pesticides, or animal waste.",
      "Do not drink the runoff water. Work outside or on a tray to keep floors dry."
    ],
    independent: "Ground cover: bare soil, mulch-covered soil, and grass-covered soil",
    dependent: "Dry mass (g) of sediment washed off after a standard rainfall",
    controlled: [
      "Same soil type and amount (filled to the same depth)",
      "Same tray size and slope (raised 10 cm at one end)",
      "Same amount of rain (1 liter) from the same height (30 cm) over the same time (about 60 seconds)",
      "Same starting soil moisture",
      "Same way of collecting and drying sediment"
    ],
    comparison: "The bare soil tray is the comparison group.",
    repeat: "Use 2 trays of each cover if possible, and repeat the rainfall on 3 separate days.",
    procedure: [
      "About 3 weeks early, fill one tray (or two) with soil and plant grass seed. Water it until the grass is thick and established.",
      "When the grass is ready, fill the other trays with soil to the same depth. Spread 2 cm of mulch over the mulch tray.",
      "Have an adult cut a small V-notch at the low end of each tray so runoff can pour out.",
      "Give each tray the same small amount of water the day before so all start equally moist.",
      "Raise the notched end's opposite side 10 cm with blocks. Place a collection container under each notch.",
      "Hold the rain bottle 30 cm above the top of the tray and sprinkle 1 liter of water evenly over about 60 seconds.",
      "Let the runoff settle for at least 1 hour. Carefully pour off the clear water on top.",
      "Weigh an empty drying dish and record its mass. Pour the muddy sediment into it, rinsing the container with a little water.",
      "Let the sediment dry completely (1–3 days, or in the sun). Weigh the dish and dry sediment.",
      "Calculate sediment mass: (dish + dry sediment) − empty dish. Repeat the rainfall on 2 more days."
    ],
    tables: [
      {
        title: "Sediment collected",
        cols: ["Cover & rainfall", "Empty dish (g)", "Dish + dry sediment (g)", "Sediment (g)", "Notes (runoff color, channels)"],
        rows: ["Bare – rain 1", "Bare – rain 2", "Bare – rain 3", "Mulch – rain 1", "Mulch – rain 2", "Mulch – rain 3", "Grass – rain 1", "Grass – rain 2", "Grass – rain 3"]
      }
    ],
    graph: "Bar graph: ground cover on the x-axis and average sediment mass (g) on the y-axis.",
    questions: [
      "Which ground cover lost the most soil? Which lost the least?",
      "Did the amount of sediment change from rain 1 to rain 3 on the same tray? Why might that happen?",
      "What did you notice about the runoff water's color and the channels in the soil?",
      "How might the grass roots or mulch protect the soil?",
      "How could these results help someone protect a garden or a hillside?"
    ],
    extension: "Use bare soil only and test how slope (5, 10, and 15 cm raise) affects erosion.",
    note: "Each rainfall washes away the loosest soil first, so later rainfalls on the same tray may lose less. Record each rainfall separately and mention this in your conclusion."
  },

  {
    id: "automated-plant-watering",
    title: "Automated Plant-Watering Model",
    difficulty: "Hard",
    category: "Electrical / Plant Science / Engineering",
    themes: ["electricity", "plants", "engineering"],
    keywords: ["automatic watering", "soil moisture", "sensor", "pump", "microcontroller", "coding", "plants", "micro:bit", "arduino"],
    summary: "Compare a moisture-triggered watering system with a fixed watering schedule to see which keeps soil moisture steadier.",
    time: { active: "4–6 hours to build and program, then 10 minutes a day", waiting: "1–2 weeks of monitoring" },
    supplies: "Low-voltage microcontroller kit, moisture sensors, small pump, 2 potted plants",
    question: "Does a moisture-triggered watering system keep soil moisture more consistent than a fixed watering schedule?",
    investigating: "Some gardens water themselves when the soil gets dry. You will build a small system that waters one plant when a sensor says the soil is dry, water a second plant on a fixed schedule, and compare how steady the soil moisture stays.",
    materials: [
      "A teacher-approved low-voltage microcontroller kit (such as a micro:bit or an Arduino-compatible kit) with a battery pack",
      "2 identical soil moisture sensors (capacitive sensors last longer in wet soil)",
      "A small low-voltage water pump module with a driver or relay board made for the kit, plus tubing",
      "A water reservoir (a jar or bottle) with mL marks",
      "2 identical potted plants of the same kind in the same soil",
      "Trays under the pots",
      "A plastic box or zip-top bag to protect the electronics",
      "Measuring cup",
      "Clipboard or a notebook for readings"
    ],
    safety: [
      "Use only a teacher-approved, low-voltage battery kit with adult supervision. Never connect anything to a household outlet.",
      "Keep all electronics in a protective box or bag, raised and away from the pots, tubing, and reservoir.",
      "Disconnect the battery pack before changing any wiring, and dry your hands before touching the electronics.",
      "Secure the tubing so it cannot spray water onto the electronics. Do not drink the reservoir water."
    ],
    independent: "Watering method: moisture-triggered (automatic) or fixed schedule",
    dependent: "Soil moisture readings at set times, and total water used (mL)",
    controlled: [
      "Same plant type, pot size, and soil",
      "Sensors at the same depth and distance from the stem",
      "Same location, light, and temperature",
      "Readings taken at the same times each day"
    ],
    comparison: "The fixed-schedule plant is the comparison group.",
    repeat: "Record readings at least 3 times a day for 1–2 weeks. If you have enough equipment, set up 2 pots for each method.",
    procedure: [
      "Calibrate the sensors: record each sensor's reading in dry soil and in soil that was just watered. Use these to decide what reading counts as “too dry” (your threshold).",
      "Insert one sensor in each pot at the same depth and the same distance from the stem.",
      "With your teacher, program the automatic system in plain steps: every 10 minutes, check the sensor; if the soil is drier than the threshold, run the pump for 2 seconds; then wait before checking again so the water can soak in.",
      "Place the pump in the reservoir and run the tubing to the automatic pot. Put the electronics in their protective box.",
      "Fill the reservoir to a marked level and record it.",
      "Water the fixed-schedule pot by hand with a set amount at the same time each day (for example, 50 mL at 8 a.m.).",
      "Record both sensors' moisture readings at the same times each day (for example, 8 a.m., 12 p.m., and 3 p.m.).",
      "Each day, record how much water left the reservoir and how much you gave the schedule pot.",
      "After 1–2 weeks, find the highest and lowest reading for each pot. The range (highest − lowest) shows how steady the moisture stayed."
    ],
    tables: [
      {
        title: "Daily readings",
        cols: ["Day & time", "Automatic pot moisture", "Schedule pot moisture", "Water used: automatic (mL)", "Water used: schedule (mL)"],
        rows: ["Day 1 – 8 a.m.", "Day 1 – 12 p.m.", "Day 1 – 3 p.m.", "Day 2 – 8 a.m.", "Day 2 – 12 p.m.", "Day 2 – 3 p.m.", "Day 3 – 8 a.m.", "Day 3 – 12 p.m.", "Day 3 – 3 p.m."]
      },
      {
        title: "Summary",
        cols: ["Watering method", "Highest reading", "Lowest reading", "Range", "Total water used (mL)"],
        rows: ["Automatic", "Fixed schedule"]
      }
    ],
    graph: "Line graph: time on the x-axis and soil moisture reading on the y-axis, with one line for each pot.",
    questions: [
      "Which pot's soil moisture had the smaller range?",
      "Which method used more water in total?",
      "Were there times when the automatic system watered too much or not enough? What might explain that?",
      "How did your threshold choice affect the results?",
      "What would you improve about the system or the measurements?"
    ],
    extension: "Run the automatic system with two different threshold settings and compare moisture ranges and water used.",
    note: "Soil moisture is the main result. The project does not need to show that either plant grew better. Sensor readings are relative numbers, so use the same sensors and positions throughout."
  },

  {
    id: "solar-oven-insulation",
    title: "Solar Oven Insulation",
    difficulty: "Hard",
    category: "Engineering / Thermal Energy",
    themes: ["heat", "engineering"],
    keywords: ["solar oven", "insulation", "temperature", "sun", "reflector", "pizza box", "thermal energy"],
    summary: "Build identical solar ovens with different insulation and track their inside temperatures in sunlight.",
    time: { active: "4–5 hours (including building)", waiting: "None (45-minute tests on clear days)" },
    supplies: "Identical pizza boxes, foil, plastic wrap, black paper, insulation materials, thermometers",
    question: "How does insulation material affect a model solar oven's temperature?",
    investigating: "A solar oven traps sunlight to heat its inside. You will build identical ovens, line each with a different insulation material, and measure how hot each one gets in the same sunlight.",
    materials: [
      "4 identical pizza boxes or shoeboxes",
      "Aluminum foil and glue stick",
      "Clear plastic wrap and tape",
      "Black construction paper",
      "Insulation materials: crumpled newspaper, foam sheets, and cotton batting (same thickness, about 2 cm)",
      "4 identical oven thermometers or digital probe thermometers",
      "Rulers or sticks to prop the reflector flaps",
      "Protractor",
      "Box cutter (adult use)",
      "Oven mitts",
      "Sunglasses"
    ],
    safety: [
      "Solar ovens can get hot inside. Use oven mitts and do not touch the foil or black paper.",
      "Never look at the sun or at bright reflections from the foil. Wear sunglasses.",
      "Use the ovens only for temperature testing, not for cooking or tasting food.",
      "An adult should do all box-cutter work. Wear a hat and drink water when outside."
    ],
    independent: "Insulation material lining the oven",
    dependent: "Internal temperature (°C) every 5 minutes",
    controlled: [
      "Same box size, window, and black floor",
      "Same reflector size and angle",
      "Same insulation thickness",
      "Ovens placed side by side, facing the sun at the same time",
      "Same thermometer type and position"
    ],
    comparison: "One oven with no added insulation is the comparison group.",
    repeat: "Test on at least 3 clear days, moving each oven to a different position each time.",
    procedure: [
      "Have an adult cut a 3-sided flap in each box lid, leaving a 3 cm border.",
      "Cover the inside of each flap with smooth foil (shiny side out) to make a reflector.",
      "Tape plastic wrap tightly over the opening under the flap to make a window.",
      "Line the inside walls and bottom of 3 boxes with one insulation material each, 2 cm thick. Leave the fourth box unlined.",
      "Cover the floor of every box with black paper.",
      "Place a thermometer in the same spot in each oven, where you can read it through the window.",
      "On a clear day near midday, set the ovens side by side facing the sun. Prop each reflector at the same angle (about 45°).",
      "Record each oven's temperature at the start and every 5 minutes for 45 minutes.",
      "Calculate each oven's temperature rise (highest − starting). Repeat on 2 more days."
    ],
    tables: [
      {
        title: "Temperatures for one day (°C)",
        cols: ["Time (min)", "No insulation", "Newspaper", "Foam", "Cotton"],
        rows: ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45"]
      },
      {
        title: "Temperature rise summary",
        cols: ["Insulation", "Day 1 rise (°C)", "Day 2 rise (°C)", "Day 3 rise (°C)", "Average rise (°C)"],
        rows: ["No insulation", "Newspaper", "Foam", "Cotton"]
      }
    ],
    graph: "Line graph: time (min) on the x-axis and temperature (°C) on the y-axis, one line per oven. Add a bar graph of average temperature rise.",
    questions: [
      "Which oven reached the highest temperature? Which rose the least?",
      "How did each insulated oven compare with the oven that had no insulation?",
      "Did the ovens heat quickly at first and then level off?",
      "How did weather, such as clouds or wind, affect each day's results?",
      "What else besides insulation could improve a solar oven?"
    ],
    extension: "Use your best insulation and test how reflector angle (30°, 45°, and 60°) affects the temperature."
  },

  {
    id: "water-wheel",
    title: "Water Wheel Efficiency Investigation",
    difficulty: "Hard",
    category: "Engineering / Renewable Energy",
    themes: ["engineering", "water"],
    keywords: ["water wheel", "paddles", "lift", "power", "energy", "flowing water", "renewable energy"],
    summary: "Build a model water wheel and test how paddle shape affects how quickly it lifts a small load.",
    time: { active: "5–6 hours (including building)", waiting: "None" },
    supplies: "Plastic lids, dowel, plastic spoons or cups, string, washers, water source",
    question: "How does paddle shape affect a model water wheel's ability to lift a small load?",
    investigating: "Flowing water can turn a wheel to do work. You will build a water wheel, try different paddle shapes, and time how long each one takes to lift the same small load the same height.",
    materials: [
      "2 matching plastic lids or stiff cardboard circles (about 15 cm across)",
      "A wooden dowel or round pencil for the axle",
      "A stand made from a cardboard box or wood with notches to hold the axle",
      "Paddle materials: flat plastic or cardstock rectangles, cupped paddles (cut plastic spoons or small cups), and V-shaped folded paddles (8 of each)",
      "Hot glue (adult use) or waterproof tape",
      "String (about 50 cm) and a small cup",
      "Metal washers (to make a 20 g load)",
      "A water source with steady flow, such as a faucet set to a marked position or a large bottle with a hole near the bottom kept full",
      "A tub or sink to catch the water",
      "Measuring cup or 1 L container (to check flow rate)",
      "Ruler, stopwatch, and masking tape"
    ],
    safety: [
      "Work in a sink, a tub, or outdoors, and wipe spills right away so no one slips.",
      "An adult should help with cutting, poking holes, and hot glue.",
      "Keep water away from outlets and electronics. This project uses no electricity."
    ],
    independent: "Paddle shape: flat, cupped, and V-shaped",
    dependent: "Time (s) to lift a 20 g load through 30 cm",
    controlled: [
      "Same wheel size and number of paddles (8)",
      "Paddles about the same size",
      "Same water flow rate (checked by timing how long it takes to fill 1 L)",
      "Same fall height from the water outlet to the wheel",
      "Same load, lifting height, and axle"
    ],
    comparison: "The flat paddles can be the baseline for comparing the other shapes.",
    repeat: "Do at least 3 trials for each paddle shape.",
    procedure: [
      "Build the wheel: connect the two lids with the axle through their centers, and attach 8 flat paddles evenly between them.",
      "Set the axle in the stand's notches so the wheel spins freely over the tub.",
      "Tie one end of the string to the axle and the cup with the 20 g load to the other end. Mark the string or set a ruler to show a 30 cm lift.",
      "Set the water flow. Time how long it takes to fill 1 L and record it. Check it again before each set of trials.",
      "Position the outlet the same height above the wheel every time (for example, 15 cm).",
      "Start the water and the stopwatch at the same moment. Stop timing when the load reaches the 30 cm mark.",
      "Unwind the string and repeat for 3 trials.",
      "Replace the paddles with cupped paddles, then V-shaped paddles, and repeat.",
      "Find the average lifting time for each shape.",
      "Optional: calculate useful power. Power (W) = mass (kg) × 9.8 × height (m) ÷ time (s). For a 20 g load lifted 30 cm, that is 0.020 × 9.8 × 0.30 ÷ your time."
    ],
    tables: [
      {
        title: "Lifting times",
        cols: ["Paddle shape", "Flow check: time to fill 1 L (s)", "Trial 1 (s)", "Trial 2 (s)", "Trial 3 (s)", "Average (s)", "Useful power (W, optional)"],
        rows: ["Flat", "Cupped", "V-shaped"]
      }
    ],
    graph: "Bar graph: paddle shape on the x-axis and average lifting time (s) or useful power (W) on the y-axis.",
    questions: [
      "Which paddle shape lifted the load fastest?",
      "Did the water flow stay the same throughout testing? How do you know?",
      "How did the water hit and leave each paddle shape? What did you notice?",
      "Why does faster lifting show more useful power in this test, but not exact efficiency?",
      "What could cause errors, such as friction at the axle or splashing?"
    ],
    extension: "Use your best paddle shape and test how the number of paddles (4, 8, and 12) affects lifting time.",
    note: "Lifting faster means the wheel delivered more useful power under these conditions. Finding the exact efficiency would also require measuring how much energy the falling water supplied, which this test does not do."
  },

  {
    id: "model-house-insulation",
    title: "Model House Insulation",
    difficulty: "Hard",
    category: "Engineering / Thermal Science",
    themes: ["heat", "engineering"],
    keywords: ["insulation", "house", "heat loss", "temperature", "model", "warm water", "cooling"],
    summary: "Insulate identical model houses with different materials and measure how fast a warm-water heat source cools.",
    time: { active: "4–5 hours (including building)", waiting: "1 hour per test" },
    supplies: "Identical shoeboxes, insulation materials, water bottles, thermometers",
    question: "Which insulation material best slows heat loss from a model house?",
    investigating: "Insulation helps homes stay warm by slowing heat loss. You will place identical bottles of warm water inside identical model houses lined with different materials and measure how much the water temperature drops in one hour.",
    materials: [
      "5 identical shoeboxes with lids (the model houses)",
      "5 identical small plastic water bottles with caps",
      "Insulation materials: foam sheets, cotton batting, bubble wrap, and newspaper (same thickness, about 2 cm)",
      "Digital probe thermometers, one per house if possible",
      "Modeling clay or tape to seal around the probes",
      "Warm tap water prepared by an adult (no hotter than 50 °C / 122 °F)",
      "Tape, scissors, and a box cutter (adult use)",
      "Timer"
    ],
    safety: [
      "Use warm tap water only. An adult should prepare it and check that it is no hotter than 50 °C (122 °F).",
      "No flames, candles, light bulbs, or heaters inside the models.",
      "An adult should poke holes in the caps and boxes and use the box cutter."
    ],
    independent: "Insulation material lining the house",
    dependent: "Drop in water temperature (°C) over 60 minutes",
    controlled: [
      "Identical boxes and bottles",
      "Same amount of warm water (from one batch) at the same starting temperature",
      "Same insulation thickness, covering walls, floor, and lid",
      "Same room location and testing time",
      "Same thermometer type and probe position"
    ],
    comparison: "One house with no insulation is the comparison group.",
    repeat: "Repeat the full test at least 3 times.",
    procedure: [
      "Line the inside walls, floor, and lid of 4 houses with one insulation material each, 2 cm thick. Leave the fifth house unlined.",
      "Have an adult poke a small hole in each bottle cap and in each box lid for a thermometer probe.",
      "An adult fills all bottles at the same time from one container of warm water and caps them.",
      "Push a probe through each cap so its tip sits in the middle of the water. Seal around it with clay.",
      "Set a bottle in the center of each house, run the probe through the lid, and close the lid. Record the starting temperatures.",
      "Keep all houses side by side in the same room, away from vents and sunlight.",
      "Record each temperature every 10 minutes for 60 minutes.",
      "Calculate the drop: starting temperature − temperature at 60 minutes.",
      "Repeat the whole test 2 more times, moving houses to different positions. Find the average drop for each material."
    ],
    tables: [
      {
        title: "Water temperatures for one test (°C)",
        cols: ["Time (min)", "No insulation", "Foam", "Cotton", "Bubble wrap", "Newspaper"],
        rows: ["0", "10", "20", "30", "40", "50", "60"]
      },
      {
        title: "Temperature drop summary",
        cols: ["Insulation", "Test 1 drop (°C)", "Test 2 drop (°C)", "Test 3 drop (°C)", "Average drop (°C)"],
        rows: ["No insulation", "Foam", "Cotton", "Bubble wrap", "Newspaper"]
      }
    ],
    graph: "Line graph: time (min) on the x-axis and water temperature (°C) on the y-axis, one line per house. Add a bar graph of average temperature drop.",
    questions: [
      "Which house had the smallest temperature drop? Which had the largest?",
      "How did each insulated house compare with the house with no insulation?",
      "Did the water cool faster at the beginning or the end of the hour? Why might that be?",
      "Were your three tests consistent?",
      "What features of the best material might explain its results?"
    ],
    extension: "Use your best material and test how adding a plastic-wrap “window” to the house affects heat loss.",
    note: "If you only have one thermometer, test one house at a time instead, in a mixed order, and record the room temperature for each test."
  },

  {
    id: "cantilever-beam",
    title: "Cantilever Beam Strength",
    difficulty: "Hard",
    category: "Engineering / Materials Science",
    themes: ["engineering", "materials"],
    keywords: ["beam", "cantilever", "bending", "deflection", "paper", "shape", "load", "structure"],
    summary: "Fold paper beams into different shapes, measure how much each bends under a load, and find its maximum load.",
    time: { active: "2–3 hours", waiting: "None" },
    supplies: "Cardstock or printer paper, tape, heavy books, cup, pennies, ruler",
    question: "How does the cross-sectional shape of a paper beam affect its bending?",
    investigating: "A cantilever is a beam held at one end, like a diving board or balcony. You will fold identical sheets of paper into beams with different cross-section shapes, clamp each to a table, and measure how much it bends under a load and how much it can hold.",
    materials: [
      "Cardstock or printer paper (all the same kind and size)",
      "Tape (same amount for each beam)",
      "Heavy books to clamp the beam to the table",
      "Small paper cup with a string or paper-clip hanger",
      "About 200 pennies",
      "2 rulers (one held upright to measure bending)",
      "Pencil"
    ],
    safety: [
      "Keep the clamping books firmly on the table so they cannot slide off.",
      "Keep feet clear of the falling cup and pennies."
    ],
    independent: "Beam cross-section shape: flat strip, U-channel, triangle tube, square tube, and round tube",
    dependent: "Deflection (mm) under a fixed load of 10 pennies, and maximum pennies held before failure",
    controlled: [
      "Same paper amount (one sheet per beam)",
      "Same beam length (28 cm) and tape amount",
      "Same unsupported length sticking out (20 cm)",
      "Load hung at the same spot (the beam's tip)",
      "Same rule for failure"
    ],
    comparison: "The flat strip is the baseline shape for comparison.",
    repeat: "Build and test at least 3 beams of each shape.",
    procedure: [
      "Fold or roll each sheet lengthwise into a 28 cm long beam of one shape. Use the same amount of tape on each.",
      "Lay the beam on the table so 20 cm sticks out past the edge. Clamp the other 8 cm under heavy books.",
      "Stand a ruler upright on the floor at the beam's tip. Record the height of the tip with no load.",
      "Hang the empty cup from the tip. Add 10 pennies. Record the new tip height.",
      "Deflection = height with no load − height with 10 pennies. Record it in mm. If a beam fails before 10 pennies, record “failed.”",
      "Keep adding pennies one at a time until the beam fails (it creases, buckles, or the tip drops more than 10 cm). Record the most pennies it held.",
      "Test 3 beams of each shape.",
      "Find the average deflection and average maximum load for each shape."
    ],
    tables: [
      {
        title: "Beam results",
        cols: ["Shape & beam", "Deflection with 10 pennies (mm)", "Maximum pennies", "How it failed"],
        rows: ["Flat – 1", "Flat – 2", "Flat – 3", "U-channel – 1", "U-channel – 2", "U-channel – 3", "Triangle – 1", "Triangle – 2", "Triangle – 3", "Square – 1", "Square – 2", "Square – 3", "Round – 1", "Round – 2", "Round – 3"]
      }
    ],
    graph: "Two bar graphs: shape vs. average deflection (mm), and shape vs. average maximum load (pennies).",
    questions: [
      "Which shape bent the least under 10 pennies? Which held the most pennies?",
      "Did the shape that bent least also hold the most? Why might those differ?",
      "Where did each beam fail?",
      "How consistent were beams of the same shape?",
      "Where do you see similar beam shapes in buildings, bridges, or furniture?"
    ],
    extension: "Use your best shape and test how the unsupported length (10, 15, 20, and 25 cm) affects deflection."
  },

  {
    id: "sound-reducing-materials",
    title: "Sound-Reducing Materials",
    difficulty: "Hard",
    category: "Physics / Acoustics",
    themes: ["sound", "materials"],
    keywords: ["sound", "noise", "decibels", "acoustics", "foam", "soundproof", "materials", "enclosure"],
    summary: "Line a box with different materials and measure how much sound escapes from a speaker inside.",
    time: { active: "About 3 hours", waiting: "None" },
    supplies: "Box with lid, small speaker, sound meter app, lining materials",
    question: "Which material most reduces sound measured outside a model enclosure?",
    investigating: "Some materials absorb or block sound better than others. You will place a steady sound source inside a box, line the box with different materials, and measure the sound level outside.",
    materials: [
      "A sturdy box or plastic container with a lid",
      "A small speaker or device that can play a steady tone at a set volume",
      "A teacher-approved tone generator and sound level meter app, on two separate devices",
      "Lining materials: foam, felt or thick cloth, bubble wrap, egg cartons, and cardboard (same thickness, about 2 cm)",
      "Tape and scissors",
      "Meter stick",
      "Masking tape to mark device positions",
      "A quiet room"
    ],
    safety: [
      "Keep the sound at a comfortable level. Stop if the sound hurts or your ears ring.",
      "Use only apps and devices your teacher approves.",
      "Be careful with scissors."
    ],
    independent: "Lining material inside the box",
    dependent: "Sound level outside the box (dB) on the meter app",
    controlled: [
      "Same box and lid",
      "Same sound source, frequency (1000 Hz), and volume",
      "Same speaker position inside the box",
      "Same meter device, placed 50 cm away at the same spot",
      "Same lining thickness and coverage, in the same quiet room"
    ],
    comparison: "The box with no lining is the comparison group. Also record the room's background level with the sound off.",
    repeat: "Do at least 3 trials for each material, removing and replacing the speaker each time.",
    procedure: [
      "Mark the box's position on a table with tape. Mark a spot 50 cm away for the meter device.",
      "With the sound off, record the room's background level.",
      "Set the tone to 1000 Hz at a comfortable volume. Do not change the volume for the rest of the experiment.",
      "Place the speaker in the center of the empty box and close the lid.",
      "Watch the meter for 10 seconds and record the typical reading (the number it shows most).",
      "Turn off the sound, take out the speaker, and replace it for the next trial. Do 3 trials.",
      "Line all inside walls, floor, and lid with the first material. Repeat steps 4–6.",
      "Repeat for each lining material.",
      "Find the average reading for each material. Calculate the reduction: no-lining average − material average."
    ],
    tables: [
      {
        title: "Sound levels",
        cols: ["Lining", "Trial 1 (dB)", "Trial 2 (dB)", "Trial 3 (dB)", "Average (dB)", "Reduction vs. no lining (dB)"],
        rows: ["Background (sound off)", "No lining", "Foam", "Felt or cloth", "Bubble wrap", "Egg cartons", "Cardboard"]
      }
    ],
    graph: "Bar graph: lining material on the x-axis and average sound level (dB) or reduction (dB) on the y-axis.",
    questions: [
      "Which lining reduced the sound the most?",
      "How did each lining compare with the unlined box?",
      "Were any results close to the background level? What would that mean?",
      "What do the best materials have in common, such as softness, thickness, or air pockets?",
      "Why are your app's readings good for comparing materials but not for official measurements?"
    ],
    extension: "Use your best and worst materials and compare a low tone (250 Hz) with a high tone (2000 Hz).",
    note: "Phone or tablet meter apps are not calibrated like professional sound meters. Their readings work for comparing your materials with each other, but they are not certified measurements."
  },

  {
    id: "water-storage-temperature",
    title: "Water Storage and Temperature Change",
    difficulty: "Hard",
    category: "Environmental Science / Thermal Science",
    themes: ["heat", "earth", "water"],
    keywords: ["water", "temperature", "heat capacity", "model", "warming", "cooling", "bottles", "climate"],
    summary: "Put different amounts of water inside identical model boxes and compare how their air temperatures change while warming and cooling.",
    time: { active: "About 3 hours per test day", waiting: "Models sit overnight before each test" },
    supplies: "Identical clear storage boxes, water bottles, thermometers",
    question: "How does the amount of water in identical model environments affect their temperature changes?",
    investigating: "Water can soak up and give off heat slowly. You will place different amounts of water, sealed in identical bottles, inside identical model boxes and measure how the air temperature in each box changes as it warms in the sun and cools in the shade.",
    materials: [
      "4 identical clear plastic storage boxes with lids",
      "16 identical 500 mL plastic bottles with caps (4 per box)",
      "Water",
      "4 identical digital thermometers with probes (one per box)",
      "Tape and string to hang each probe in the same spot",
      "A sunny outdoor spot and a shady spot (or indoor room)",
      "Timer"
    ],
    safety: [
      "Never look directly at the sun. Wear a hat and drink water when outside.",
      "Boxes in the sun can get warm. Handle them carefully.",
      "Keep thermometer displays dry and outside the boxes if possible."
    ],
    independent: "Amount of water inside each model: 0, 500, 1000, and 2000 mL (0, 1, 2, or 4 of the 4 bottles filled; the rest left empty and capped)",
    dependent: "Air temperature inside the model (°C) during equal warming and cooling periods",
    controlled: [
      "Identical boxes and the same number of bottles in each",
      "Same probe location (center, not touching bottles)",
      "Same starting temperature (all models and water sit together overnight)",
      "Same sun and shade exposure and timing",
      "Lids closed the same way"
    ],
    comparison: "The model with all empty bottles (0 mL) is the comparison group.",
    repeat: "Repeat on at least 3 days, moving each model to a different position each time.",
    procedure: [
      "Fill bottles with water: 0 in box A, 1 in box B, 2 in box C, and 4 in box D. Cap the empty bottles too so every box has 4 bottles.",
      "Place the bottles the same way in each box. Hang a probe in the center of each box, not touching the bottles.",
      "Leave all boxes together indoors overnight so everything starts at the same temperature.",
      "Record each box's starting air temperature.",
      "Set all boxes side by side in full sun. Record temperatures every 10 minutes for 60 minutes (warming period).",
      "Move all boxes at the same time to the shade. Record every 10 minutes for 60 more minutes (cooling period).",
      "Calculate each box's rise during warming (highest − start) and drop during cooling (highest − final).",
      "Repeat on 2 more days. Find the average rise and drop for each water amount."
    ],
    tables: [
      {
        title: "Air temperatures for one day (°C)",
        cols: ["Time (min)", "Period", "A: 0 mL", "B: 500 mL", "C: 1000 mL", "D: 2000 mL"],
        rows: ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100", "110", "120"]
      },
      {
        title: "Summary",
        cols: ["Water (mL)", "Average rise while warming (°C)", "Average drop while cooling (°C)"],
        rows: ["0", "500", "1000", "2000"]
      }
    ],
    graph: "Line graph: time (min) on the x-axis and air temperature (°C) on the y-axis, one line per model. Mark where warming ends and cooling begins.",
    questions: [
      "Which model warmed the most? Which warmed the least?",
      "Which model cooled the most in the shade?",
      "Did more water always mean a smaller temperature change? Use your data.",
      "Why was it important for all models to start at the same temperature?",
      "What can this model show about water and temperature, and what can't it show about real places?"
    ],
    extension: "Compare a box with 1000 g of water to a box with 1000 g of dry sand and see which changes temperature more.",
    note: "This model shows one idea: water can slow temperature changes. It does not recreate the weather or climate of a real place."
  },

  {
    id: "series-parallel-circuits",
    title: "Series and Parallel Circuits",
    difficulty: "Hard",
    category: "Electrical / Engineering",
    themes: ["electricity", "engineering"],
    keywords: ["circuit", "series", "parallel", "bulbs", "current", "ammeter", "brightness", "electricity", "battery"],
    summary: "Connect identical bulbs in series and in parallel and measure the current and brightness.",
    time: { active: "About 2 hours", waiting: "None" },
    supplies: "Educational circuit kit with matched bulbs, battery holder, multimeter",
    question: "How does connecting identical bulbs in series versus parallel affect current and bulb brightness?",
    investigating: "Bulbs can be connected in one loop (series) or in separate branches (parallel). You will build both arrangements with identical bulbs and the same batteries, measure the current, and compare brightness.",
    materials: [
      "A teacher-approved low-voltage educational circuit kit",
      "2 identical (matched) small bulbs in holders, rated for your battery voltage",
      "Battery holder with 2 fresh AA batteries (3 V)",
      "Connecting leads with clips and a switch",
      "Digital multimeter or the kit's ammeter",
      "Paper and pencil for circuit diagrams"
    ],
    safety: [
      "Use only a teacher-approved low-voltage kit with adult supervision. Never use household outlets.",
      "Never connect a wire, or the ammeter, directly from one battery terminal to the other. That is a short circuit and can make the battery and wires hot.",
      "Open the switch between tests. Disconnect right away if anything gets hot or smells.",
      "Bulbs get warm. Do not touch them while they are lit."
    ],
    independent: "Circuit arrangement: one bulb alone, two bulbs in series, and two bulbs in parallel",
    dependent: "Total current from the battery (mA) and bulb brightness (0–5 rating)",
    controlled: [
      "Same batteries and battery holder",
      "Same matched bulbs and leads",
      "Same meter and setting",
      "Same room lighting when rating brightness",
      "Readings taken right after closing the switch"
    ],
    comparison: "One bulb alone is the baseline. Rate it a 3 on the brightness scale, then rate the others compared with it.",
    repeat: "Build and measure each arrangement at least 3 times, taking it apart between trials.",
    procedure: [
      "Draw a diagram of each circuit before building it, and have your teacher check it.",
      "Ammeter rule: the ammeter always goes in series. Open the circuit and connect the meter into the gap so the current flows through it. Set the meter to DC current with the teacher-chosen setting. Never connect it across a battery or across a bulb.",
      "Build the one-bulb circuit: battery → switch → ammeter → bulb → back to battery.",
      "Close the switch, record the current, and give the bulb a brightness of 3. Open the switch.",
      "Build the series circuit: battery → switch → ammeter → bulb 1 → bulb 2 → back to battery. Record the current and rate each bulb's brightness compared with the single bulb (0 = off, 5 = much brighter).",
      "Build the parallel circuit: battery → switch → ammeter → a split into two branches, one bulb on each → joining back to battery. Record the total current and rate each bulb's brightness.",
      "Take each circuit apart and rebuild it for 3 trials.",
      "Optional: with a voltmeter (not the ammeter), measure the battery voltage at the start and end to check whether it changed.",
      "Find the average current for each arrangement."
    ],
    tables: [
      {
        title: "Circuit measurements",
        cols: ["Arrangement", "Trial 1 (mA)", "Trial 2 (mA)", "Trial 3 (mA)", "Average current (mA)", "Brightness (0–5)", "Notes"],
        rows: ["One bulb", "Series (2 bulbs)", "Parallel (2 bulbs)"]
      }
    ],
    graph: "Bar graph: circuit arrangement on the x-axis and average current (mA) on the y-axis. Label each bar with its brightness rating.",
    questions: [
      "How did the total current compare in the three arrangements?",
      "How did bulb brightness compare? Did brightness match the current pattern?",
      "What happened in each circuit when one bulb was unscrewed? (Test it with the switch open first.)",
      "Brightness ratings are opinions. How could you make them more consistent?",
      "Which arrangement do you think homes use for lights, and why?"
    ],
    extension: "With your teacher's approval, add a third matched bulb and compare series and parallel again.",
    note: "Brightness ratings depend on the person rating them. Have a partner rate brightness without knowing which arrangement is connected."
  }
];
