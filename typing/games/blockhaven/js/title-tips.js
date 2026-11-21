// Yellow tips on the title screen: a mix of helpful hints and silly sayings.
// A new one pops in every few seconds (or when you click it).

export const TITLE_TIPS = [
  // helpful
  "Torches keep monsters away!",
  "Sleep in a bed to skip the night!",
  "On fire? Jump in water!",
  "Hissers explode. Keep your distance!",
  "Press L to see your advancements!",
  "Press J to open your journal!",
  "Press V to see yourself!",
  "Press X to swap to your offhand!",
  "Press E to open your inventory!",
  "Press N to drop a map waypoint!",
  "Ride a Trotter to tame it!",
  "Scouts love bones!",
  "Hissers are scared of Whiskers!",
  "A Lifeward Totem can save you!",
  "Golden Apples are worth it!",
  "Shields block arrows!",
  "Build a shelter before dark!",
  "Bring extra torches into caves!",
  "Don't dig straight down!",
  "Craft a Workbench first!",
  "Furnaces turn ore into ingots!",
  "Keep your food bar full!",
  "Peaceful mode sends monsters home!",
  "Sparkdust makes machines go!",
  "Mark your way home with torches!",
  "Armored bosses block arrows!",
  "Your Starter Home has a map table!",
  "Name tags give pets names!",
  "Check the Settings for Music volume!",
  "Play Together with a friend!",
  // silly
  "Now with 100% more blocks!",
  "Mr. Watford approves!",
  "Homework first, then building!",
  "Gravity: still on!",
  "Sheep are clouds with legs!",
  "Pigs can't fly. Yet.",
  "Chickens try their best!",
  "Built one block at a time!",
  "Every block has a story!",
  "Now in 3D!",
  "Square sandwiches not included!",
  "Contains real carrots!",
  "Cows go moo. Groaners go groan.",
  "Ask a Groaner how its day was!",
  "Rattlers need more calcium!",
  "Skitters have eight knees!",
  "Waterproof (mostly)!",
  "Try saying Blockhaven 5 times fast!",
  "It's spelled Blockhaven!",
  "The Hollow Wyrm is not a pet!",
  "Diamonds are a crafter's best friend!",
  "Look up! A cloud!",
  "Blocks are square for a reason!",
  "Lava is not a hot tub!",
  "Gravel has trust issues!",
  "Sand falls. Sand doesn't care.",
  "Don't forget to stretch!",
  "Drink some water, crafter!",
  "Be kind to your build buddies!",
  "Share your diamonds!",
  "Typed with ten fingers!",
  "Type fast, build faster!",
  "Also try Keyboard Kart!",
  "Also try Turbo League!",
  "Also try Tower Typer!",
  "Also try Jungle Dash!",
  "Also try Geometry Race!",
  "Hand-placed pixels!",
  "Snacks not included!",
  "Pickaxe sold separately!",
  "Now with extra night!",
  "Mooo!",
  "Ribbit!",
  "Ssss... just kidding!",
  "No blocks were harmed!",
  "Certified block-tastic!",
  "Recess approved!",
  "Ten out of ten Groaners agree!",
  "The sun is a square too!"
];

export function initTitleTips(el, { every = 7000, reducedMotion = () => false, visible = () => true } = {}) {
  if (!el) return null;
  let last = -1;
  function next() {
    let i;
    do i = Math.floor(Math.random() * TITLE_TIPS.length); while (i === last && TITLE_TIPS.length > 1);
    last = i;
    el.textContent = TITLE_TIPS[i];
    fit();
    el.classList.toggle("still", !!reducedMotion());
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }
  // keep each tip on one line: shrink long ones until they fit beside the logo
  function fit() {
    el.style.setProperty("--tip-scale", 1);
    const room = (el.parentElement?.clientWidth || 400) * 0.7;
    for (let k = 1; k > 0.7 && el.scrollWidth > room; k -= 0.05) el.style.setProperty("--tip-scale", k.toFixed(2));
  }
  addEventListener("resize", fit);
  next();
  const timer = setInterval(() => { if (visible() && !document.hidden) next(); }, every);
  el.addEventListener("click", next);
  return { next, stop: () => clearInterval(timer) };
}
