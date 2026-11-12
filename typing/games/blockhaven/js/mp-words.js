// Play Together: kid-safe words for player names ("Swift Otter") and room codes ("MAPLE-OTTER-27").
// KEEP NAME_A / NAME_B IN SYNC with blockhaven-relay/src/words.js (the relay only accepts names made from these).
export const NAME_A = ["Swift", "Brave", "Clever", "Happy", "Lucky", "Mighty", "Quiet", "Sunny", "Gentle", "Bold",
  "Bright", "Calm", "Cheerful", "Daring", "Eager", "Friendly", "Jolly", "Kind", "Lively", "Merry",
  "Nimble", "Noble", "Proud", "Quick", "Silly", "Speedy", "Steady", "Sturdy", "Witty", "Zippy",
  "Cozy", "Fuzzy", "Golden", "Rusty", "Misty", "Frosty", "Sandy", "Mossy", "Stormy", "Starry"];
export const NAME_B = ["Otter", "Fox", "Badger", "Beaver", "Bunny", "Panda", "Koala", "Puffin", "Penguin", "Owl",
  "Falcon", "Robin", "Sparrow", "Turtle", "Tortoise", "Gecko", "Lizard", "Dolphin", "Walrus", "Seal",
  "Moose", "Llama", "Alpaca", "Hedgehog", "Squirrel", "Chipmunk", "Raccoon", "Lynx", "Bison", "Yak",
  "Heron", "Pelican", "Toucan", "Parrot", "Salmon", "Trout", "Lobster", "Goat", "Pony", "Hamster"];
const CODE_A = ["MAPLE", "OAK", "PINE", "CEDAR", "BIRCH", "RIVER", "STONE", "CLOUD", "EMBER", "FROST",
  "CORAL", "AMBER", "JADE", "RUBY", "LAKE", "HILL", "SUN", "MOON", "STAR", "BRICK",
  "SAND", "SNOW", "RAIN", "LEAF", "TORCH", "IRON", "GOLD", "CLAY", "MOSS", "WAVE"];

const pick = list => list[Math.floor(Math.random() * list.length)];
export const randomName = () => pick(NAME_A) + " " + pick(NAME_B);
export const randomCode = () => pick(CODE_A) + "-" + pick(NAME_B).toUpperCase() + "-" + (10 + Math.floor(Math.random() * 90));
export const validName = name => { const p = String(name || "").split(" "); return p.length === 2 && NAME_A.includes(p[0]) && NAME_B.includes(p[1]); };
// Students may type "maple otter 27" or "Maple-Otter 27": tidy it into MAPLE-OTTER-27
export const tidyCode = text => String(text || "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const CODE_RE = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{2}$/;
