/* ===== Science Kit Guide data =====
   KITS: every kit, listed once.
     type:  "demo"    = one big kit Mr. Watford runs for the whole class
            "group"   = small or multi-pack kit, one per group of 3–4
            "project" = the class builds or watches it over several days
     url:   optional store/maker page. Leave it out and the "Find it" button
            searches Amazon for the brand + name instead.
     adult: true shows an "Adult supervision" tag (chemicals, launches, plug-ins).
   CHAPTERS: which kits go with each chapter, plus a note on how we'd use it.
   To add a kit: add it to KITS, then add [ "its-id", "how we'd use it" ] to a chapter. */

const KITS = {
  // ---- National Geographic (made by Blue Marble) ----
  "ng-reaction-rocket": { name: "Reaction Rocket", brand: "National Geographic", icon: "🚀", type: "demo", adult: true },
  "ng-epic-circuits":   { name: "Epic Circuits Science Kit", brand: "National Geographic", icon: "💡", type: "demo" },
  "ng-solar-system":    { name: "Glow-in-the-Dark Solar System Activity Kit", brand: "National Geographic", icon: "🪐", type: "project" },
  "ng-ocean-dig":       { name: "Ocean Animal Dig Kits (12-pack)", brand: "National Geographic", icon: "🐙", type: "group" },
  "ng-mega-fossil":     { name: "Mega Fossil Dig Kit", brand: "National Geographic", icon: "🦴", type: "project" },
  "ng-earth-science":   { name: "Mega Science Series Earth Science Kit", brand: "National Geographic", icon: "🌋", type: "demo",
                          url: "https://thinkbluemarble.com/product/national-geographic-earth-science-kit/" },
  "ng-gemstone-dig":    { name: "Gemstone Dig Kit", brand: "National Geographic", icon: "💎", type: "group" },
  "ng-stunning-chem":   { name: "Stunning Chemistry Set", brand: "National Geographic", icon: "⚗️", type: "demo", adult: true,
                          url: "https://thinkbluemarble.com/product/national-geographic-stunning-chemistry-set/" },
  "ng-magic-chem":      { name: "Magic Chemistry Set", brand: "National Geographic", icon: "🎩", type: "demo", adult: true,
                          url: "https://thinkbluemarble.com/product/national-geographic-magic-chemistry-set-2/" },
  "ng-battery":         { name: "Battery Making Kit", brand: "National Geographic", icon: "🔋", type: "group",
                          url: "https://thinkbluemarble.com/product/national-geographic-battery-making-kit/" },
  "ng-jumbo-volcano":   { name: "Jumbo Volcano Science Kit", brand: "National Geographic", icon: "🌋", type: "demo", adult: true,
                          url: "https://thinkbluemarble.com/product/national-geographic-jumbo-volcano-science-kit/" },
  "ng-mega-crystal":    { name: "Mega Crystal Growing Lab", brand: "National Geographic", icon: "🔮", type: "project",
                          url: "https://thinkbluemarble.com/product/national-geographic-mega-crystal-growing-lab-2/" },
  "ng-rocks-ed-set":    { name: "Rocks and Minerals Education Set", brand: "National Geographic", icon: "🪨", type: "demo",
                          url: "https://thinkbluemarble.com/product/national-geographic-rocks-and-minerals-education-set/" },
  "ng-rfm-200":         { name: "Rocks, Fossils & Minerals Kit (200+ pieces)", brand: "National Geographic", icon: "🧺", type: "group",
                          url: "https://thinkbluemarble.com/product/national-geographic-rocks-fossils-minerals-kit-200-piece/" },
  "ng-geodes":          { name: "Break Open 15 Premium Geodes", brand: "National Geographic", icon: "🥚", type: "group",
                          url: "https://thinkbluemarble.com/product/national-geographic-break-open-15-premium-geodes/" },
  "ng-tumbler":         { name: "Hobby Rock Tumbler Kit", brand: "National Geographic", icon: "🔄", type: "project", adult: true,
                          url: "https://thinkbluemarble.com/product/national-geographic-hobby-rock-tumbler-kit/" },
  "ng-dino-12":         { name: "Dinosaur Dig Kit (12-pack)", brand: "National Geographic", icon: "🦖", type: "group",
                          url: "https://thinkbluemarble.com/product/national-geographic-dinosaur-dig-kit-12-count/" },
  "ng-shark-tooth":     { name: "Shark Tooth Dig Kit", brand: "National Geographic", icon: "🦈", type: "group" },
  "ng-meteorite":       { name: "Meteorite Dig Kit", brand: "National Geographic", icon: "☄️", type: "group" },
  "ng-mega-space":      { name: "Mega Space Activity Kit", brand: "National Geographic", icon: "🌠", type: "project" },
  "ng-mega-science":    { name: "Mega Science Kit", brand: "National Geographic", icon: "🧪", type: "demo",
                          url: "https://thinkbluemarble.com/product/national-geographic-mega-science-kit/" },
  "ng-microscope-lab":  { name: "Microscope Science Lab", brand: "National Geographic", icon: "🔬", type: "demo",
                          url: "https://thinkbluemarble.com/product/national-geographic-microscope-science-lab/" },
  "ng-digital-scope":   { name: "Digital Handheld Microscope", brand: "National Geographic", icon: "🔍", type: "group",
                          url: "https://thinkbluemarble.com/product/national-geographic-digital-handheld-microscope/" },
  "ng-bug-catcher":     { name: "Bug Catcher Kit", brand: "National Geographic", icon: "🐛", type: "group" },
  "ng-butterfly":       { name: "Butterfly Growing Kit", brand: "National Geographic", icon: "🦋", type: "project",
                          url: "https://thinkbluemarble.com/product/national-geographic-butterfly-growing-kit/" },
  "ng-ant":             { name: "Ant Habitat Kit", brand: "National Geographic", icon: "🐜", type: "project" },
  "ng-terrarium":       { name: "Light Up Terrarium Kit", brand: "National Geographic", icon: "🌿", type: "project" },
  "ng-metal-detector":  { name: "Junior Metal Detector", brand: "National Geographic", icon: "📡", type: "demo",
                          url: "https://thinkbluemarble.com/product/national-geographic-junior-metal-detector/" },
  "ng-telescope":       { name: "70mm Refractor Telescope", brand: "National Geographic", icon: "🔭", type: "demo" },

  // ---- Similar kits from other makers ----
  "carolina-soil":      { name: "Soil Analysis Kit", brand: "Carolina Biological", icon: "🟫", type: "group",
                          url: "https://www.carolina.com/earth-science-soil-stream-studies/soil-analysis-kit/GEO8692.pr" },
  "rapitest":           { name: "Rapitest Soil Test Kit", brand: "Luster Leaf", icon: "🧫", type: "group" },
  "fast-plants":        { name: "Wisconsin Fast Plants Classroom Kit", brand: "Carolina Biological", icon: "🌱", type: "project" },
  "root-viewer":        { name: "Root-Vue Farm", brand: "HSP Nature Toys", icon: "🥕", type: "project" },
  "mushroom":           { name: "Mushroom Grow Kit", brand: "Back to the Roots", icon: "🍄", type: "project" },
  "insect-lore":        { name: "Live Butterfly Garden", brand: "Insect Lore", icon: "🦋", type: "project" },
  "4m-tornado":         { name: "KidzLabs Tornado Maker", brand: "4M", icon: "🌪️", type: "group" },
  "4m-weather":         { name: "Green Science Weather Station", brand: "4M", icon: "🌡️", type: "group" },
  "smartlab-weather":   { name: "You-Track-It Weather Lab", brand: "SmartLab", icon: "🌦️", type: "project" },
  "discovery-weather":  { name: "Extreme Weather STEM Science Kit", brand: "Discovery", icon: "❄️", type: "demo" },
  "celestron":          { name: "FirstScope Telescope", brand: "Celestron", icon: "🔭", type: "demo" },
  "4m-planetarium":     { name: "Solar System Planetarium", brand: "4M", icon: "🌌", type: "group" },
  "stomp-rocket":       { name: "Stomp Rocket Launcher", brand: "Stomp Rocket", icon: "🦶", type: "group" },
  "snap-green":         { name: "Snap Circuits Green (alternative energy)", brand: "Elenco", icon: "☀️", type: "demo" },
  "4m-green":           { name: "Green Science kits (solar and wind)", brand: "4M", icon: "🌬️", type: "group" },

  // ---- Basic lab supplies (any brand works) ----
  "molecular":          { name: "Molecular model kit", brand: "Any brand", icon: "⚛️", type: "group" },
  "ir-thermometer":     { name: "Infrared thermometer", brand: "Any brand", icon: "🌡️", type: "group" },
  "radiometer":         { name: "Crookes radiometer (light mill)", brand: "Any brand", icon: "🌀", type: "demo" },
  "prism":              { name: "Glass prism set", brand: "Any brand", icon: "🌈", type: "group" },
  "psychrometer":       { name: "Sling psychrometer", brand: "Any brand", icon: "💧", type: "group" },
  "magnet-kit":         { name: "Magnet kit with compass and iron filings", brand: "Any brand", icon: "🧲", type: "group" },
  "slinky":             { name: "Metal Slinky", brand: "Slinky", icon: "〰️", type: "demo" },
  "stream-table":       { name: "Stream table (erosion table)", brand: "Any brand", icon: "🏞️", type: "project" },
  "hydrometer":         { name: "Saltwater hydrometer", brand: "Any brand", icon: "🌊", type: "group" },
  "water-test":         { name: "Water quality test strips", brand: "Any brand", icon: "🚰", type: "group" },
  "protozoa-slides":    { name: "Prepared microscope slides: protozoa", brand: "Any brand", icon: "🦠", type: "demo" }
};

const KIT_CHAPTERS = [
  // ===== 6th grade =====
  { grade: 6, ch: 1, title: "Plentiful Plants", icon: "🍃", kits: [
    ["ng-terrarium", "Plant a small light-up garden and watch it grow and change through the chapter."],
    ["fast-plants", "These plants go from seed to flower to new seeds in just a few weeks, so we can see a whole life cycle."],
    ["root-viewer", "Clear growing windows show roots and stems growing underground."],
    ["ng-microscope-lab", "Look closely at leaf cells and the tiny pores leaves use to breathe."],
    ["mushroom", "Grow real mushrooms in class for the ferns, mosses, algae, and fungi lesson."]
  ]},
  { grade: 6, ch: 2, title: "The World of Invertebrates", icon: "🐞", kits: [
    ["ng-bug-catcher", "Groups catch insects outside, count legs and body parts, then let them go."],
    ["ng-butterfly", "Raise caterpillars into butterflies and watch every stage of metamorphosis."],
    ["insect-lore", "Another butterfly habitat if we want more than one going at once."],
    ["ng-ant", "A see-through ant home to watch a colony dig tunnels and work together."],
    ["ng-ocean-dig", "Each group digs out sea animals, then sorts them into animals with and without backbones."],
    ["ng-digital-scope", "Groups get an up-close look at spiders, shells, and other small creatures."],
    ["protozoa-slides", "See protozoans under the microscope: creatures too small to see with your eyes alone."]
  ]},
  { grade: 6, ch: 3, title: "Our Fascinating Earth", icon: "🌋", kits: [
    ["ng-jumbo-volcano", "A big eruption demo to show how volcanoes build up and blow their top."],
    ["ng-earth-science", "Earth science activities with real rock and mineral specimens to pass around."],
    ["ng-rocks-ed-set", "A labeled set of fiery, layered, and changed rocks to compare up close."],
    ["ng-gemstone-dig", "Each group digs out real gemstones for the gems and metals lesson."],
    ["ng-geodes", "Crack open geodes to find the crystals hiding inside."],
    ["ng-mega-crystal", "Grow crystals over several days, a small-scale look at how cave formations build up."],
    ["magnet-kit", "Map magnetic fields with iron filings and a compass to see why Earth acts like a giant magnet."],
    ["ng-metal-detector", "Hunt for hidden metal objects to see how metal detectors find buried metal."]
  ]},
  { grade: 6, ch: 4, title: "God's Great Universe", icon: "🌌", kits: [
    ["ng-solar-system", "Paint and build a glowing model of the planets in order from the Sun."],
    ["ng-mega-space", "Make glowing constellations and space crafts to go with the star lessons."],
    ["4m-planetarium", "Groups build their own small glow-in-the-dark solar system."],
    ["ng-meteorite", "Dig out real meteorite pieces for the lesson on comets, asteroids, and meteors."],
    ["celestron", "A simple telescope for looking at the Moon's craters together."]
  ]},
  { grade: 6, ch: 5, title: "Exploring Space", icon: "🚀", kits: [
    ["ng-reaction-rocket", "Launch a rocket from a test tube to see action and reaction, the rule that makes every rocket fly."],
    ["stomp-rocket", "Groups test launch angles outside and measure how far their rocket travels."],
    ["prism", "Split white light into a rainbow for the lesson on light and waves."],
    ["ng-telescope", "A closer look at how telescopes gather light from far away."]
  ]},
  { grade: 6, ch: 6, title: "Matter & Chemistry", icon: "⚗️", kits: [
    ["ng-stunning-chem", "Fizzing, color-changing chemical reactions that make brand-new substances."],
    ["ng-magic-chem", "\"Magic\" tricks that are really chemistry, then we explain how each one works."],
    ["molecular", "Groups snap atoms together to build water, carbon dioxide, and other molecules."],
    ["ng-battery", "Make electricity from a chemical reaction using simple materials."]
  ]},

  // ===== 8th grade =====
  { grade: 8, ch: 1, title: "Introduction to Science", icon: "🔬", kits: [
    ["ng-mega-science", "Practice the scientific method at stations: ask a question, predict, test, and record."],
    ["rapitest", "Groups test soil samples for pH and plant nutrients."],
    ["carolina-soil", "Find out what soil is made of: sand, silt, clay, and decaying material."],
    ["ng-digital-scope", "Zoom in on soil to see its particles and tiny living things."]
  ]},
  { grade: 8, ch: 2, title: "Foundations of Geology", icon: "🌍", kits: [
    ["ng-earth-science", "Earth science activities with volcanoes and specimens to pass around."],
    ["ng-jumbo-volcano", "A large eruption demo for the volcano lesson."],
    ["slinky", "Stretch a Slinky across the room to show how the two kinds of earthquake waves move."]
  ]},
  { grade: 8, ch: 3, title: "Minerals & Rocks", icon: "💎", kits: [
    ["ng-rocks-ed-set", "A labeled teaching set for comparing the three main kinds of rock."],
    ["ng-rfm-200", "Enough specimens to set up mineral ID stations for streak, hardness, and luster."],
    ["ng-gemstone-dig", "Each group digs out real gemstones for the valuable minerals lesson."],
    ["ng-geodes", "Crack open geodes to see crystals that formed inside a rock."],
    ["ng-mega-crystal", "Grow crystals over several days and look at their shapes."]
  ]},
  { grade: 8, ch: 4, title: "Weathering & Erosion", icon: "🏜️", kits: [
    ["ng-tumbler", "Tumble rough rocks for a few weeks and check them each week: the same grinding that rounds river rocks."],
    ["stream-table", "Run water over sand to watch rivers carve channels and drop sediment."]
  ]},
  { grade: 8, ch: 5, title: "The Fossil Record", icon: "🦴", kits: [
    ["ng-mega-fossil", "A big class dig with 15 real fossils to uncover, identify, and sketch."],
    ["ng-dino-12", "Twelve small dig kits, one for each group or student."],
    ["ng-shark-tooth", "Dig out real fossil shark teeth, one of the most common fossils found."]
  ]},
  { grade: 8, ch: 6, title: "A Survey of the Seas", icon: "🌊", kits: [
    ["ng-ocean-dig", "Each group digs out an ocean animal and teaches the class where it lives in the sea."],
    ["hydrometer", "Measure how salty water samples are and compare fresh water to seawater."],
    ["ng-shark-tooth", "Fossil shark teeth to go along with life in the ocean."]
  ]},
  { grade: 8, ch: 7, title: "The Atmosphere", icon: "🌤️", kits: [
    ["ir-thermometer", "Point and measure how hot light and dark surfaces get in the sun (albedo)."],
    ["radiometer", "Watch light energy spin the vanes, a quick demo of the Sun's energy."],
    ["discovery-weather", "Weather experiments to show how heat and air pressure move the air."]
  ]},
  { grade: 8, ch: 8, title: "Water Vapor & Air Masses", icon: "🌧️", kits: [
    ["psychrometer", "Groups measure humidity and dew point with wet and dry thermometers."],
    ["smartlab-weather", "Set up a weather station and start a class weather log."],
    ["discovery-weather", "Make fake snow and watch how water changes in the air."]
  ]},
  { grade: 8, ch: 9, title: "Storms & Forecasting", icon: "⛈️", kits: [
    ["4m-tornado", "Groups make a spinning water tornado in a bottle."],
    ["4m-weather", "Build simple weather instruments and use them to make a forecast."],
    ["ng-earth-science", "Includes a tornado race activity and other storm experiments."],
    ["smartlab-weather", "Keep the class weather station going and compare our forecasts to what really happened."]
  ]},
  { grade: 8, ch: 10, title: "Consider the Heavens", icon: "🪐", kits: [
    ["ng-solar-system", "Paint and build a glowing model of the planets for the planet lessons."],
    ["ng-mega-space", "Glow-in-the-dark constellations and space crafts for the star lessons."],
    ["4m-planetarium", "Groups build a small solar system and quiz each other on the planets."],
    ["ng-meteorite", "Dig out real meteorite pieces for the asteroids, comets, and meteors lesson."]
  ]},
  { grade: 8, ch: 11, title: "Man & the Universe", icon: "🛰️", kits: [
    ["celestron", "A simple telescope for Moon viewing and learning how telescopes work."],
    ["ng-telescope", "A larger telescope for a class night-sky viewing."],
    ["ng-reaction-rocket", "Launch a rocket from a test tube to show what pushes a spacecraft into orbit."],
    ["stomp-rocket", "Groups test launches outside to connect speed and angle to how far a rocket goes."]
  ]},
  { grade: 8, ch: 12, title: "Environmental Science", icon: "♻️", kits: [
    ["snap-green", "Build circuits powered by sunlight and moving air to compare energy resources."],
    ["ng-epic-circuits", "Light, sound, and motion projects that show how we use electricity every day."],
    ["4m-green", "Groups build small solar or wind powered models."],
    ["water-test", "Test water samples from around school for signs of pollution."],
    ["rapitest", "Test soil from different spots to see how well the land is cared for."]
  ]}
];
