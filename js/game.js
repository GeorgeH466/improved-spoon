"use strict";
/* ============================================================
   PokéClicker — incremental game logic (no dependencies)
   Sprites: https://github.com/PokeAPI/sprites
   ============================================================ */
const SPRITE_POKEMON = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_ITEM = name => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
/* Animated Gen-V sprites — the good stuff */
const ANIM_SPRITE = (id, shiny=false) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${shiny?"shiny/":""}${id}.gif`;

const THEMES = [
  { id:"kanto",    name:"Kanto Classic",  icon:25,  swatch:"linear-gradient(90deg,#3d7dca,#8fd0ff)" },
  { id:"ember",    name:"Charizard Ember",icon:6,   swatch:"linear-gradient(90deg,#7a1f05,#ff7b39)" },
  { id:"forest",   name:"Bulbasaur Forest",icon:1,  swatch:"linear-gradient(90deg,#1e5c2a,#7ec850)" },
  { id:"ocean",    name:"Squirtle Ocean", icon:7,   swatch:"linear-gradient(90deg,#01497c,#38b6ff)" },
  { id:"volt",     name:"Pikachu Volt",   icon:25,  swatch:"linear-gradient(90deg,#8a6d00,#ffd83d)" },
  { id:"midnight", name:"Gengar Midnight",icon:94,  swatch:"linear-gradient(90deg,#2a1458,#7e57c2)" },
  { id:"sunset",   name:"Eevee Sunset",   icon:133, swatch:"linear-gradient(90deg,#a53860,#ffb37a)" },
  { id:"glacier",  name:"Articuno Glacier",icon:144, swatch:"linear-gradient(90deg,#7ec8e3,#ffffff)" },
  { id:"rocket",   name:"Team Rocket",    icon:52,  swatch:"linear-gradient(90deg,#0a0a0a,#ff1744)" },
];

/* Regions: unlock by lifetime earnings; each has its own wild pool + encounter scene */
const REGIONS = [
  { id:"Kanto",   name:"Route 1",        icon:"🌿", unlock:0,      desc:"Where every journey begins. Balanced spawns." },
  { id:"forest",  name:"Viridian Forest",icon:"🌲", unlock:2000,   desc:"Bug- and grass-filled woods. Pikachu country." },
  { id:"cave",    name:"Mt. Moon",       icon:"🌙", unlock:8000,   desc:"Dark caves glittering with Moon Stones. Clefairy dance here." },
  { id:"safari",  name:"Safari Zone",    icon:"🦏", unlock:24500,  desc:"Wide savanna — rare grazers everywhere." },
  { id:"ocean",   name:"Seafoam Islands",icon:"🌊", unlock:60500,  desc:"Icy surf and splashing Water-types." },
  { id:"victory", name:"Victory Road",   icon:"🏆", unlock:144500, desc:"The road to the League. Only the strong wander here." },
  { id:"johto",   name:"Ecruteak City",  icon:"⛩️", unlock:2500000, desc:"Johto's ancient towers. New species roam here." },
  { id:"lake",    name:"Lake of Rage",   icon:"🔴", unlock:1000000000, desc:"Something red glitters beneath the surface…" },
  { id:"den",     name:"Dragon's Den",   icon:"🐉", unlock:10000000000000, desc:"Dragon tamers only. The air crackles with power." },
];
const isNight = () => { const h = new Date().getHours(); return h >= 19 || h < 7; };

/* ================= Game modes ================= */
const MODES = [
  { id:"classic",  icon:"🎮", name:"Classic",  desc:"The original journey. No twists, just vibes and clicking." },
  { id:"zen",      icon:"🧘", name:"Zen",      desc:"Peaceful: Pokémon never flee, no Rocket theft, +20% DPS, +10% clicks. Golden Magikarp visit more often." },
  { id:"speedrun", icon:"⏱️", name:"Speedrun", desc:"Unlocks the $100k speedrun timer below. Race your best time for glory (and prizes)." },
  { id:"nuzlocke", icon:"💀", name:"Nuzlocke", desc:"HARDCORE: 1 ball per encounter, break-free = it flees, losing a Gym battle faints a random duplicate — but +25% DPS for the brave." },
];
/* ================= Weather ================= */
const WEATHERS = [
  { id:"clear", icon:"☀️", name:"Clear skies",  dps:1,    click:1,    desc:"Perfect clicking weather." },
  { id:"sunny", icon:"🌞", name:"Harsh sunlight",dps:1.10, click:1.25, desc:"Clicks +25%, DPS +10%. Sunglasses advised." },
  { id:"rain",  icon:"🌧️", name:"Rain",         dps:1.05, click:1,    desc:"Catch rates +10% in encounters. Everything is damp." },
  { id:"storm", icon:"⛈️", name:"Thunderstorm", dps:1,    click:1.10, desc:"Crit chance doubled, ring moves FAST. Electric!" },
  { id:"snow",  icon:"❄️", name:"Snowfall",     dps:1.08, click:1,    desc:"Combo decays half as fast. Cozy." },
  { id:"wind",  icon:"🍃", name:"Tailwind",     dps:1,    click:1.05, desc:"The catch ring slows down — easier Excellent throws." },
  { id:"fog",   icon:"🌫️", name:"Dense fog",    dps:1,    click:1,    desc:"Rare & Legendary spawns up… but things flee more easily." },
];
const currentWeather = () => WEATHERS.find(w=>w.id===(state.weather&&state.weather.id)) || WEATHERS[0];
/* ================= Seasons ================= */
function currentSeason(){
  const m = new Date().getMonth();
  if (m === 9)  return { id:"halloween", icon:"🎃", name:"Spooky Season",   particle:"🦇", note:"Ghost-types are restless…" };
  if (m === 11) return { id:"winter",    icon:"🎄", name:"Delibird Days",   particle:"❄️", note:"Delibird is delivering gifts!" };
  if (m >= 2 && m <= 4) return { id:"spring", icon:"🌸", name:"Cherry Blossom", particle:"🌸", note:"Petals — and Oddish — everywhere." };
  if (m >= 5 && m <= 7) return { id:"summer", icon:"🏖️", name:"Alola Summer",  particle:"☀️", note:"Water-types are splashing about." };
  return { id:"autumn", icon:"🍂", name:"Autumn Leaves", particle:"🍂", note:"A crisp breeze blows through the tall grass." };
}
const SEASON_SPAWNS = { halloween:[92,93,94], winter:[86,225], spring:[43,69,102], summer:[72,98,120], autumn:[21,84] };
/* ================= Milestones & rivals ================= */
const MILESTONES = [
  { at:10000,     label:"Earn $10K lifetime",     reward:1000,   item:null },
  { at:100000,    label:"Earn $100K lifetime",    reward:8000,   item:"great" },
  { at:1000000,   label:"Earn $1M lifetime",      reward:60000,  item:"ultra" },
  { at:10000000,  label:"Earn $10M lifetime",     reward:500000, item:"ultra" },
  { at:100000000, label:"Earn $100M lifetime",    reward:0,      item:"master" },
  { at:1000000000,label:"Earn $1B lifetime",      reward:0,      item:"master" },
  { at:1e11, label:"Earn $100B lifetime",   reward:0, item:"master" }, { at:1e13, label:"Earn $10T lifetime",  reward:0, item:"master" },
  { at:1e15, label:"Earn $1Qa lifetime",    reward:0, item:"master" }, { at:1e17, label:"Earn $100Qa lifetime",reward:0, item:"master" },
  { at:1e19, label:"Earn $10Qi lifetime",   reward:0, item:"master" }, { at:1e20, label:"Earn $100Qi (1e20!) lifetime", reward:0, item:"master" },
];
const RIVALS = [
  { name:"Bug Catcher Joey", at:5000 }, { name:"Lass Nikki", at:25000 }, { name:"Hiker Bruno", at:80000 },
  { name:"Swimmer Marina", at:250000 }, { name:"Rocket Grunt Marco", at:750000 }, { name:"Ace Trainer Yuki", at:2000000 },
  { name:"Champion Cynthia (fan)", at:8000000 }, { name:"Actual Gary Oak", at:30000000 },
  { name:"Red (silent)", at:5e9 }, { name:"Cynthia (for real)", at:1e12 }, { name:"Professor Oak", at:1e15 },
  { name:"The Original One's intern", at:1e18 }, { name:"Arceus (part-time)", at:5e19 },
];
const fmtTime = ms => { if (!ms) return "—"; const s2 = Math.floor(ms/1000); return `${String(Math.floor(s2/60)).padStart(2,"0")}:${String(s2%60).padStart(2,"0")}`; };

const ITEM_SHOP = [
  { id:"berry", name:"Razz Berry", emoji:"🍓", sprite:SPRITE_ITEM("razz-berry"), cost:150,  blurb:"Encounter: ×1.45 catch chance for one throw." },
  { id:"great", name:"Great Ball", emoji:"🔵", sprite:SPRITE_ITEM("great-ball"), cost:300,  blurb:"Encounter: ×1.4 catch chance per throw." },
  { id:"ultra", name:"Ultra Ball", emoji:"🟡", sprite:SPRITE_ITEM("ultra-ball"), cost:1200, blurb:"Encounter: ×1.9 catch chance per throw." },
  { id:"egg",   name:"Mystery Egg", emoji:"🥚", sprite:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/egg.png", cost:5000, blurb:"Incubate it: hatches after 300 clicks into a random local Pokémon!" },
];
const BALL_TYPES = {
  poke:  { name:"Poké Ball",  mult:1.0, item:null },
  great: { name:"Great Ball", mult:1.4, item:"great" },
  ultra: { name:"Ultra Ball", mult:1.9, item:"ultra" },
  master:{ name:"Master Ball", mult:999, item:"master" },
};
const SAVE_KEY = "pokeclicker-save-v1";
const COST_GROWTH = 1.15;
const CLICKS_PER_CATCH = 100;
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;

/* ---------- Static data ---------- */
const BUILDINGS = [
  { id:"launcher", name:"Pokéball Launcher", emoji:"🎯", sprite:SPRITE_ITEM("poke-ball"),   baseCost:15,     baseDps:0.1, blurb:"Automated ball-flinging machine." },
  { id:"catcher",  name:"Auto-Catcher NPC",  emoji:"🧢", sprite:SPRITE_POKEMON(25),          baseCost:100,    baseDps:1,   blurb:"A keen kid with a butterfly net." },
  { id:"daycare",  name:"Daycare Center",    emoji:"🥚", sprite:SPRITE_POKEMON(113),         baseCost:1100,   baseDps:8,   blurb:"They raise profits while you walk." },
  { id:"gym",      name:"Pokémon Gym",       emoji:"🏟️", sprite:SPRITE_POKEMON(68),          baseCost:12000,  baseDps:47,  blurb:"Challengers pay PokéDollars to lose." },
  { id:"silph",    name:"Silph Co. Lab",     emoji:"🧪", sprite:SPRITE_POKEMON(137),         baseCost:130000, baseDps:260, blurb:"Cutting-edge click technology." },
  { id:"center",   name:"Pokémon Center",    emoji:"🏥", sprite:SPRITE_POKEMON(242),         baseCost:1500000, baseDps:1400, blurb:"Free healing, premium prices." },
  { id:"frontier", name:"Battle Frontier",   emoji:"🏯", sprite:SPRITE_POKEMON(376),         baseCost:18000000, baseDps:8500, blurb:"Seven facilities of pure profit." },
  { id:"hall",     name:"Champion's Hall",   emoji:"👑", sprite:SPRITE_POKEMON(149),         baseCost:250000000, baseDps:47000, blurb:"Only the elite click here." },
  { id:"hideout",  name:"Rocket Hideout",    emoji:"🚀", sprite:SPRITE_POKEMON(52),          baseCost:4000000000, baseDps:260000, blurb:"Totally legitimate business." },
  { id:"elite4",   name:"Elite Four Arena",  emoji:"🏛️", sprite:SPRITE_POKEMON(376),         baseCost:65000000000, baseDps:1600000, blurb:"Four chambers of nonstop challengers." },
  { id:"league",   name:"Pokémon League HQ", emoji:"🏆", sprite:SPRITE_POKEMON(65),          baseCost:1000000000000, baseDps:10000000, blurb:"Where Champions are minted." },
  { id:"tree",     name:"Battle Tree",       emoji:"🌳", sprite:SPRITE_POKEMON(103),         baseCost:18000000000000, baseDps:65000000, blurb:"Endless battles, endless tickets." },
  { id:"dome",     name:"World Tournament Dome", emoji:"🌐", sprite:SPRITE_POKEMON(121),     baseCost:300000000000000, baseDps:430000000, blurb:"Every region watches. Every region pays." },
  { id:"tower",    name:"Space-Time Tower",  emoji:"🕰️", sprite:SPRITE_POKEMON(483),         baseCost:5000000000000000, baseDps:2900000000, blurb:"Dialga handles the accounting across timelines." },
  { id:"ultra",    name:"Ultra Space Portal", emoji:"🌀", sprite:SPRITE_POKEMON(800),         baseCost:85000000000000000, baseDps:21000000000, blurb:"Tourists from other dimensions welcome." },
  { id:"dynamax",  name:"Dynamax Stadium",   emoji:"🏟️", sprite:SPRITE_POKEMON(884),         baseCost:1400000000000000000, baseDps:160000000000, blurb:"Bigger Pokémon. Bigger ticket prices." },
  { id:"tera",     name:"Terastal Observatory", emoji:"💠", sprite:SPRITE_POKEMON(1024),      baseCost:24000000000000000000, baseDps:1200000000000, blurb:"Crystallised profits, refracted daily." },
  { id:"shrine",   name:"Arceus Shrine",     emoji:"🌌", sprite:SPRITE_POKEMON(493),         baseCost:400000000000000000000, baseDps:9000000000000, blurb:"The Original One accepts your clicks as tribute." },
];

const UPGRADES = [ // Evolution items: one-time, ×2 to one building (or clicks)
  { id:"thunder-stone", name:"Thunder Stone", emoji:"⚡", sprite:SPRITE_ITEM("thunder-stone"), cost:2500,    target:"launcher", label:"Pokéball Launchers ×2" },
  { id:"leaf-stone",    name:"Leaf Stone",    emoji:"🍃", sprite:SPRITE_ITEM("leaf-stone"),    cost:15000,   target:"catcher",  label:"Auto-Catcher NPCs ×2" },
  { id:"water-stone",   name:"Water Stone",   emoji:"💧", sprite:SPRITE_ITEM("water-stone"),   cost:60000,   target:"daycare",  label:"Daycare Centers ×2" },
  { id:"fire-stone",    name:"Fire Stone",    emoji:"🔥", sprite:SPRITE_ITEM("fire-stone"),    cost:500000,  target:"gym",      label:"Pokémon Gyms ×2" },
  { id:"moon-stone",    name:"Moon Stone",    emoji:"🌙", sprite:SPRITE_ITEM("moon-stone"),    cost:5000000, target:"silph",    label:"Silph Co. Labs ×2" },
  { id:"rare-candy",    name:"Rare Candy",    emoji:"🍬", sprite:SPRITE_ITEM("rare-candy"),    cost:10000,   target:"click",    label:"Click power ×2" },
  { id:"dawn-stone",    name:"Dawn Stone",    emoji:"🌅", sprite:SPRITE_ITEM("dawn-stone"),    cost:25000000, target:"center",  label:"Pokémon Centers ×2" },
  { id:"dusk-stone",    name:"Dusk Stone",    emoji:"🌆", sprite:SPRITE_ITEM("dusk-stone"),    cost:300000000,target:"frontier", label:"Battle Frontiers ×2" },
  { id:"dragon-fang",   name:"Dragon Fang",   emoji:"🐉", sprite:SPRITE_ITEM("dragon-fang"),   cost:4000000000,target:"hall",    label:"Champion's Halls ×2" },
];

/* rarity: base catch chance per throw (before throw-quality/berry multipliers) + flee chance after a break-free */
const WILD_POKEMON = [
  { id:16,  name:"Pidgey",     rarity:"common",    rate:0.70, flee:0.10 }, { id:19,  name:"Rattata",   rarity:"common",    rate:0.70, flee:0.12 },
  { id:10,  name:"Caterpie",   rarity:"common",    rate:0.78, flee:0.06 }, { id:13,  name:"Weedle",    rarity:"common",    rate:0.78, flee:0.06 },
  { id:129, name:"Magikarp",   rarity:"common",    rate:0.82, flee:0.04 }, { id:74,  name:"Geodude",   rarity:"common",    rate:0.62, flee:0.08 },
  { id:25,  name:"Pikachu",    rarity:"uncommon",  rate:0.48, flee:0.12 }, { id:39,  name:"Jigglypuff",rarity:"uncommon",  rate:0.52, flee:0.10 },
  { id:54,  name:"Psyduck",    rarity:"uncommon",  rate:0.52, flee:0.10 }, { id:52,  name:"Meowth",    rarity:"uncommon",  rate:0.50, flee:0.16 },
  { id:66,  name:"Machop",     rarity:"uncommon",  rate:0.48, flee:0.10 }, { id:92,  name:"Gastly",    rarity:"uncommon",  rate:0.46, flee:0.14 },
  { id:37,  name:"Vulpix",     rarity:"uncommon",  rate:0.46, flee:0.12 }, { id:58,  name:"Growlithe", rarity:"uncommon",  rate:0.46, flee:0.12 },
  { id:35,  name:"Clefairy",   rarity:"uncommon",  rate:0.48, flee:0.10 }, { id:104, name:"Cubone",    rarity:"uncommon",  rate:0.48, flee:0.10 },
  { id:133, name:"Eevee",      rarity:"rare",      rate:0.34, flee:0.14 }, { id:4,   name:"Charmander",rarity:"rare",      rate:0.32, flee:0.12 },
  { id:7,   name:"Squirtle",   rarity:"rare",      rate:0.32, flee:0.12 }, { id:1,   name:"Bulbasaur", rarity:"rare",      rate:0.32, flee:0.12 },
  { id:132, name:"Ditto",      rarity:"rare",      rate:0.30, flee:0.10 }, { id:95,  name:"Onix",      rarity:"rare",      rate:0.30, flee:0.10 },
  { id:113, name:"Chansey",    rarity:"rare",      rate:0.28, flee:0.12 }, { id:131, name:"Lapras",    rarity:"rare",      rate:0.28, flee:0.10 },
  { id:147, name:"Dratini",    rarity:"rare",      rate:0.26, flee:0.14 }, { id:137, name:"Porygon",   rarity:"rare",      rate:0.30, flee:0.08 },
  { id:143, name:"Snorlax",    rarity:"rare",      rate:0.26, flee:0.05 },
  { id:150, name:"Mewtwo",     rarity:"legendary", rate:0.12, flee:0.25 }, { id:151, name:"Mew",       rarity:"legendary", rate:0.12, flee:0.25 },
];
const RARITY_WEIGHTS = { common:58, uncommon:27, rare:11, legendary:4 };
WILD_POKEMON.push(
  { id:21, name:"Spearow", rarity:"common", rate:0.70, flee:0.14, regions:["Kanto","forest"] }, { id:43, name:"Oddish", rarity:"common", rate:0.72, flee:0.08, regions:["forest","Kanto"] },
  { id:69, name:"Bellsprout", rarity:"common", rate:0.72, flee:0.08, regions:["forest"] }, { id:12, name:"Butterfree", rarity:"uncommon", rate:0.50, flee:0.10, regions:["forest"] },
  { id:15, name:"Beedrill", rarity:"uncommon", rate:0.50, flee:0.12, regions:["forest"] }, { id:23, name:"Ekans", rarity:"uncommon", rate:0.50, flee:0.12, regions:["forest","Kanto"] },
  { id:114, name:"Tangela", rarity:"rare", rate:0.32, flee:0.08, regions:["forest","safari"] }, { id:26, name:"Raichu", rarity:"rare", rate:0.30, flee:0.12, regions:["forest"] },
  { id:41, name:"Zubat", rarity:"common", rate:0.74, flee:0.10, regions:["cave","Kanto"] }, { id:46, name:"Paras", rarity:"common", rate:0.74, flee:0.07, regions:["cave","forest"] },
  { id:42, name:"Golbat", rarity:"uncommon", rate:0.48, flee:0.12, regions:["cave"] }, { id:47, name:"Parasect", rarity:"uncommon", rate:0.46, flee:0.08, regions:["cave"] },
  { id:142, name:"Aerodactyl", rarity:"rare", rate:0.24, flee:0.14, regions:["cave","victory"] },
  { id:84, name:"Doduo", rarity:"common", rate:0.68, flee:0.16, regions:["safari","Kanto"] }, { id:102, name:"Exeggcute", rarity:"common", rate:0.70, flee:0.08, regions:["safari","forest"] },
  { id:111, name:"Rhyhorn", rarity:"uncommon", rate:0.46, flee:0.08, regions:["safari","victory"] }, { id:128, name:"Tauros", rarity:"uncommon", rate:0.44, flee:0.18, regions:["safari"] },
  { id:115, name:"Kangaskhan", rarity:"rare", rate:0.28, flee:0.10, regions:["safari"] }, { id:123, name:"Scyther", rarity:"rare", rate:0.28, flee:0.16, regions:["safari","forest"] },
  { id:127, name:"Pinsir", rarity:"rare", rate:0.28, flee:0.14, regions:["safari"] },
  { id:72, name:"Tentacool", rarity:"common", rate:0.74, flee:0.08, regions:["ocean","Kanto"] }, { id:86, name:"Seel", rarity:"common", rate:0.70, flee:0.09, regions:["ocean"] },
  { id:90, name:"Shellder", rarity:"common", rate:0.70, flee:0.08, regions:["ocean"] }, { id:98, name:"Krabby", rarity:"common", rate:0.70, flee:0.12, regions:["ocean","Kanto"] },
  { id:116, name:"Horsea", rarity:"uncommon", rate:0.50, flee:0.10, regions:["ocean"] }, { id:120, name:"Staryu", rarity:"uncommon", rate:0.48, flee:0.10, regions:["ocean"] },
  { id:121, name:"Starmie", rarity:"rare", rate:0.30, flee:0.10, regions:["ocean"] }, { id:130, name:"Gyarados", rarity:"rare", rate:0.24, flee:0.12, regions:["ocean","victory"] },
  { id:68, name:"Machamp", rarity:"rare", rate:0.30, flee:0.06, regions:["victory"] }, { id:76, name:"Golem", rarity:"rare", rate:0.30, flee:0.05, regions:["victory","cave"] },
  { id:59, name:"Arcanine", rarity:"rare", rate:0.28, flee:0.14, regions:["victory"] }, { id:65, name:"Alakazam", rarity:"rare", rate:0.28, flee:0.12, regions:["victory"] },
  { id:94, name:"Gengar", rarity:"rare", rate:0.28, flee:0.12, regions:["victory","cave"] }, { id:149, name:"Dragonite", rarity:"rare", rate:0.22, flee:0.12, regions:["victory","ocean"] },
);
/* region tags for the original roster */
const SPECIES_REGIONS = { 25:["Kanto","forest"], 35:["cave","Kanto"], 74:["Kanto","cave","victory"], 95:["cave","victory","Kanto"], 92:["cave","Kanto"],
  129:["Kanto","ocean"], 131:["ocean","Kanto"], 133:["Kanto","forest","safari"], 143:["Kanto","safari"], 147:["ocean","victory"], 113:["safari","Kanto"], 137:["victory","Kanto"] };
WILD_POKEMON.forEach(m => { if (!m.regions) m.regions = SPECIES_REGIONS[m.id] || ["Kanto"]; });

/* Full Gen I (1-151) + Gen II (152-251) national dex */
const GEN1_NAMES = "Bulbasaur|Ivysaur|Venusaur|Charmander|Charmeleon|Charizard|Squirtle|Wartortle|Blastoise|Caterpie|Metapod|Butterfree|Weedle|Kakuna|Beedrill|Pidgey|Pidgeotto|Pidgeot|Rattata|Raticate|Spearow|Fearow|Ekans|Arbok|Pikachu|Raichu|Sandshrew|Sandslash|Nidoran F|Nidorina|Nidoqueen|Nidoran M|Nidorino|Nidoking|Clefairy|Clefable|Vulpix|Ninetales|Jigglypuff|Wigglytuff|Zubat|Golbat|Oddish|Gloom|Vileplume|Paras|Parasect|Venonat|Venomoth|Diglett|Dugtrio|Meowth|Persian|Psyduck|Golduck|Mankey|Primeape|Growlithe|Arcanine|Poliwag|Poliwhirl|Poliwrath|Abra|Kadabra|Alakazam|Machop|Machoke|Machamp|Bellsprout|Weepinbell|Victreebel|Tentacool|Tentacruel|Geodude|Graveler|Golem|Ponyta|Rapidash|Slowpoke|Slowbro|Magnemite|Magneton|Farfetch'd|Doduo|Dodrio|Seel|Dewgong|Grimer|Muk|Shellder|Cloyster|Gastly|Haunter|Gengar|Onix|Drowzee|Hypno|Krabby|Kingler|Voltorb|Electrode|Exeggcute|Exeggutor|Cubone|Marowak|Hitmonlee|Hitmonchan|Lickitung|Koffing|Weezing|Rhyhorn|Rhydon|Chansey|Tangela|Kangaskhan|Horsea|Seadra|Goldeen|Seaking|Staryu|Starmie|Mr. Mime|Scyther|Jynx|Electabuzz|Magmar|Pinsir|Tauros|Magikarp|Gyarados|Lapras|Ditto|Eevee|Vaporeon|Jolteon|Flareon|Porygon|Omanyte|Omastar|Kabuto|Kabutops|Aerodactyl|Snorlax|Articuno|Zapdos|Moltres|Dratini|Dragonair|Dragonite|Mewtwo|Mew".split("|");
const GEN2_NAMES = "Chikorita|Bayleef|Meganium|Cyndaquil|Quilava|Typhlosion|Totodile|Croconaw|Feraligatr|Sentret|Furret|Hoothoot|Noctowl|Ledyba|Ledian|Spinarak|Ariados|Crobat|Chinchou|Lanturn|Pichu|Cleffa|Igglybuff|Togepi|Togetic|Natu|Xatu|Mareep|Flaaffy|Ampharos|Bellossom|Marill|Azumarill|Sudowoodo|Politoed|Hoppip|Skiploom|Jumpluff|Aipom|Sunkern|Sunflora|Yanma|Wooper|Quagsire|Espeon|Umbreon|Murkrow|Slowking|Misdreavus|Unown|Wobbuffet|Girafarig|Pineco|Forretress|Dunsparce|Gligar|Steelix|Snubbull|Granbull|Qwilfish|Scizor|Shuckle|Heracross|Sneasel|Teddiursa|Ursaring|Slugma|Magcargo|Swinub|Piloswine|Corsola|Remoraid|Octillery|Delibird|Mantine|Skarmory|Houndour|Houndoom|Kingdra|Phanpy|Donphan|Porygon2|Stantler|Smeargle|Tyrogue|Hitmontop|Smoochum|Elekid|Magby|Miltank|Blissey|Raikou|Entei|Suicune|Larvitar|Pupitar|Tyranitar|Lugia|Ho-Oh|Celebi".split("|");
const LEGENDARY_IDS = new Set([144,145,146,150,151,243,244,245,249,250,251]);
const ALL_REGION_IDS = REGIONS.map(r=>r.id);
{
  const have = new Set(WILD_POKEMON.map(m=>m.id));
  const names = [...GEN1_NAMES, ...GEN2_NAMES];
  for (let id = 1; id <= 251; id++){
    if (have.has(id)) continue;
    const h = ((id * 2654435761) >>> 0) % 100;
    const rarity = LEGENDARY_IDS.has(id) ? "legendary" : h < 52 ? "common" : h < 82 ? "uncommon" : "rare";
    const rate = { common:0.72, uncommon:0.50, rare:0.30, legendary:0.10 }[rarity];
    const home = ALL_REGION_IDS[id % ALL_REGION_IDS.length];
    const regions = [...new Set([home, id <= 151 ? "Kanto" : "johto"])];
    WILD_POKEMON.push({ id, name:names[id-1], rarity, rate, flee:0.10, regions });
  }
  WILD_POKEMON.sort((a,b)=>a.id-b.id);
}

const GYM_LEADERS = [
  { id:"brock",   name:"Brock",   title:"Rock Solid",   ace:95,  aceName:"Onix",     power:30,   reward:800 },
  { id:"misty",   name:"Misty",   title:"Water Flowers",ace:121, aceName:"Starmie",  power:90,   reward:2400 },
  { id:"surge",   name:"Surge",   title:"Lightning",    ace:26,  aceName:"Raichu",   power:200,  reward:6000 },
  { id:"erika",   name:"Erika",   title:"Nature",       ace:114, aceName:"Tangela",  power:450,  reward:15000 },
  { id:"koga",    name:"Koga",    title:"Poison",       ace:42,  aceName:"Golbat",   power:1000, reward:40000 },
  { id:"sabrina", name:"Sabrina", title:"Psychic",      ace:65,  aceName:"Alakazam", power:2200, reward:110000 },
  { id:"blaine",  name:"Blaine",  title:"Hot-Headed",   ace:59,  aceName:"Arcanine", power:5000, reward:300000 },
  { id:"giovanni",name:"Giovanni",title:"Earth",        ace:111, aceName:"Rhyhorn",  power:11000,reward:900000 },
];
const RARITY_POWER = { common:10, uncommon:22, rare:45, legendary:100 };
function partyPower(){
  return Object.entries(state.pokedex).reduce((sum,[id,count])=>{
    const mon = WILD_POKEMON.find(m=>m.id===Number(id));
    return sum + (mon ? RARITY_POWER[mon.rarity]*count : 0);
  }, 0) + Math.min(trainerLevel(),200)*5 + state.badges*20;
}
/* Tier upgrades: owning N of a building unlocks a ×2 for it (Cookie Clicker style) */
const TIER_THRESHOLDS = [10, 25, 50, 100, 150, 200];
const TIER_NAMES = ["Reinforced", "Turbo", "Golden", "Plasma", "Quantum", "Mythic"];
const TIER_UPGRADES = [];
BUILDINGS.forEach(b=>{
  TIER_THRESHOLDS.forEach((th, i)=>{
    TIER_UPGRADES.push({ id:`tier-${b.id}-${th}`, building:b.id, threshold:th,
      name:`${TIER_NAMES[i]} ${b.name}`, emoji:b.emoji, sprite:b.sprite,
      cost: Math.ceil(b.baseCost * th * 10 * Math.pow(4, i)), label:`${b.name} ×2 (own ${th})` });
  });
});
/* Click upgrades: total-click milestones, each doubles click power */
const CLICK_UPGRADES = [
  { id:"click-1", name:"Macho Brace",      emoji:"💪", sprite:SPRITE_ITEM("macho-brace"),  clicks:100,     cost:600,          label:"Click power ×2" },
  { id:"click-2", name:"Power Bracer",     emoji:"🥊", sprite:SPRITE_ITEM("power-bracer"), clicks:500,     cost:30000,        label:"Click power ×2" },
  { id:"click-3", name:"Choice Band",      emoji:"🎗️", sprite:SPRITE_ITEM("choice-band"),  clicks:2000,    cost:1200000,      label:"Click power ×2" },
  { id:"click-4", name:"Adamant Orb",      emoji:"🔮", sprite:SPRITE_ITEM("adamant-orb"),  clicks:10000,   cost:60000000,     label:"Click power ×2" },
  { id:"click-5", name:"Soul Dew",         emoji:"💧", sprite:SPRITE_ITEM("soul-dew"),     clicks:50000,   cost:3000000000,   label:"Click power ×2" },
  { id:"click-6", name:"Meteorite Finger", emoji:"☄️", sprite:SPRITE_ITEM("thick-club"),   clicks:250000,  cost:150000000000, label:"Click power ×2" },
  { id:"click-7", name:"Arceus' Blessing", emoji:"🌌", sprite:SPRITE_ITEM("azure-flute"),  clicks:1000000, cost:8000000000000,label:"Click power ×2" },
];
/* Global research: lifetime milestones, each multiplies ALL production */
const GLOBAL_UPGRADES = [
  { id:"glob-1",  name:"Silph Scope Mk.II",  emoji:"🔭", sprite:SPRITE_ITEM("silph-scope"),  lifetime:50000,          cost:100000,           mult:1.3, label:"All production ×1.3" },
  { id:"glob-2",  name:"Amulet Coin Deluxe", emoji:"🪙", sprite:SPRITE_ITEM("amulet-coin"),  lifetime:500000,         cost:2000000,          mult:1.3, label:"All production ×1.3" },
  { id:"glob-3",  name:"Exp. Share Network", emoji:"📡", sprite:SPRITE_ITEM("exp-share"),    lifetime:5000000,        cost:40000000,         mult:1.35, label:"All production ×1.35" },
  { id:"glob-4",  name:"Lucky Incense",      emoji:"🍀", sprite:SPRITE_ITEM("luck-incense"), lifetime:50000000,       cost:800000000,        mult:1.35, label:"All production ×1.35" },
  { id:"glob-5",  name:"Master Ball Factory",emoji:"🟣", sprite:SPRITE_ITEM("master-ball"),  lifetime:1000000000,     cost:20000000000,      mult:1.4, label:"All production ×1.4" },
  { id:"glob-6",  name:"Time Gear Array",    emoji:"⚙️", sprite:SPRITE_ITEM("oval-stone"),   lifetime:50000000000,    cost:600000000000,     mult:1.4, label:"All production ×1.4" },
  { id:"glob-7",  name:"Ultra Wormhole Grid",emoji:"🌀", sprite:SPRITE_ITEM("enigmatic-card"),lifetime:5000000000000,  cost:20000000000000,   mult:1.45, label:"All production ×1.45" },
  { id:"glob-8",  name:"Creation Engine",    emoji:"🌌", sprite:SPRITE_ITEM("griseous-orb"), lifetime:1000000000000000,cost:1000000000000000, mult:1.5, label:"All production ×1.5" },
];
const LEGACY_UPGRADES = [
  { id:"legacy-click", icon:"👆", name:"Legacy Fingers",  cost:1,   desc:"Click power ×3, forever." },
  { id:"legacy-dps",   icon:"🏭", name:"Legacy Industry", cost:5,   desc:"All production ×3, forever." },
  { id:"legacy-start", icon:"💰", name:"Golden Start",    cost:10,  desc:"After prestiging, start with $50,000." },
  { id:"legacy-catch", icon:"🎣", name:"Legacy Lures",    cost:25,  desc:"Catch chances ×1.25, forever." },
  { id:"legacy-dex",   icon:"📖", name:"Living Legacy",   cost:60,  desc:"Collection bonus counts double." },
  { id:"legacy-gold",  icon:"🐟", name:"Golden Legacy",   cost:150, desc:"Golden Magikarp pay ×5." },
];
const SHINY_CHANCE = 1/32;

const NEWS = [
  "Wild Rattata spotted chewing on wires at Silph Co. — productivity mysteriously improves.",
  "Local trainer clicks Pokéball 10,000 times, doctors baffled, Pokémon delighted.",
  "Gym Leader denies losing on purpose for the entry fees. 'It's a business model,' he says.",
  "Daycare couple found a mysterious Egg. Again. It's always an Egg.",
  "Stock in Pokéball Launchers soars as everyone agrees clicking is the future.",
  "Team Rocket caught trying to steal PokéDollars. They were given a stern clicking.",
  "Professor Oak: 'There is a time and place for everything — and it's clicking, right now.'",
  "Magikarp investment fund splashes to an all-time high. Analysts remain confused.",
  "Eevee evolution futures volatile: Fire Stone up, Water Stone up, everything up.",
  "Breaking: tall grass rustling intensifies across the region. Trainers advised to keep clicking.",
  "Snorlax blocks Route 12 again; commuters pay toll in PokéDollars and snacks.",
  "Silph Co. unveils a button that clicks itself. 'We see no irony,' says CEO.",
];

const ACHIEVEMENTS = [
  { id:"first-click",  icon:"👆", name:"First Click!",        desc:"Click the Pokéball once.",            test:s=>s.totalClicks>=1 },
  { id:"click-500",    icon:"🖱️", name:"Carpal Tunnel Speed", desc:"Click 500 times.",                     test:s=>s.totalClicks>=500 },
  { id:"first-catch",  icon:"🎣", name:"First Catch",          desc:"Catch your first Pokémon.",            test:s=>s.totalCaught>=1 },
  { id:"catch-10",     icon:"🧺", name:"Bug Catcher",          desc:"Catch 10 Pokémon.",                    test:s=>s.totalCaught>=10 },
  { id:"dex-10",       icon:"📖", name:"Junior Researcher",    desc:"Register 10 unique species.",          test:s=>Object.keys(s.pokedex).length>=10 },
  { id:"builder-10",   icon:"🏗️", name:"Small Business Owner", desc:"Own 10 buildings in total.",           test:s=>totalBuildings(s)>=10 },
  { id:"builder-50",   icon:"🏙️", name:"Property Tycoon",      desc:"Own 50 buildings in total.",           test:s=>totalBuildings(s)>=50 },
  { id:"rich-1m",      icon:"💰", name:"Millionaire",          desc:"Earn $1M lifetime.",                   test:s=>s.lifetime>=1e6 },
  { id:"rich-1b",      icon:"🤑", name:"Poké Billionaire",     desc:"Earn $1B lifetime.",                   test:s=>s.lifetime>=1e9 },
  { id:"prestige-1",   icon:"🏅", name:"League Challenger",    desc:"Prestige at least once.",              test:s=>s.badges>=1 },
  { id:"excellent-1",  icon:"🎯", name:"Sharpshooter",         desc:"Land an Excellent throw.",             test:s=>s.excellentThrows>=1 },
  { id:"catch-25",     icon:"🗑️", name:"Route Champion",       desc:"Catch 25 Pokémon.",                    test:s=>s.totalCaught>=25 },
  { id:"shiny-1",      icon:"✨", name:"Shiny Hunter",          desc:"Catch a shiny Pokémon.",               test:s=>s.shinies>=1 },
  { id:"legendary-1",  icon:"🌟", name:"Legend Tamer",          desc:"Catch a Legendary Pokémon.",           test:s=>(s.legendaryCaught||0)>=1 },
  { id:"combo-25",     icon:"🔥", name:"On Fire",               desc:"Reach a ×25 click combo.",             test:s=>(s.maxCombo||0)>=25 },
  { id:"golden-1",     icon:"🐟", name:"Golden Touch",          desc:"Click a Golden Magikarp.",             test:s=>(s.goldenCaught||0)>=1 },
  { id:"buddy-1",      icon:"🐾", name:"Best Friends",          desc:"Choose a Buddy Pokémon.",              test:s=>!!s.buddyId },
  { id:"quest-5",      icon:"🔬", name:"Research Assistant",    desc:"Complete 5 Research Tasks.",           test:s=>(s.questsDone||0)>=5 },
  { id:"rich-1t",      icon:"🏦", name:"Poké Trillionaire",     desc:"Earn $1T lifetime.",                   test:s=>s.lifetime>=1e12 },
  { id:"gym-1",        icon:"🥊", name:"Badge Collector",       desc:"Defeat a Gym Leader.",                 test:s=>Object.keys(s.leadersDefeated||{}).length>=1 },
  { id:"gym-8",        icon:"👑", name:"True Champion",         desc:"Defeat all 8 Gym Leaders.",            test:s=>Object.keys(s.leadersDefeated||{}).length>=8 },
  { id:"egg-1",        icon:"🐣", name:"Daycare Graduate",      desc:"Hatch a Mystery Egg.",                 test:s=>(s.eggsHatched||0)>=1 },
  { id:"dex-25",       icon:"📚", name:"Professor's Pride",     desc:"Register 25 unique species.",          test:s=>Object.keys(s.pokedex).length>=25 },
  { id:"dex-all",      icon:"🌈", name:"Living Pokédex",        desc:"Register every species.",              test:s=>Object.keys(s.pokedex).length>=WILD_POKEMON.length },
  { id:"event-10",     icon:"🌍", name:"Citizen of the World",  desc:"Witness 10 world events.",             test:s=>(s.eventsSeen||0)>=10 },
  { id:"rocket-3",     icon:"🚀", name:"Rocket Repellent",      desc:"Repel 3 Team Rocket attacks.",         test:s=>(s.rocketWins||0)>=3 },
  { id:"snorlax-1",    icon:"💤", name:"Alarm Clock",           desc:"Move a blocking Snorlax.",             test:s=>(s.snorlaxMoved||0)>=1 },
  { id:"bred-1",       icon:"💕", name:"Matchmaker",            desc:"Breed a Pokémon at the Daycare.",      test:s=>(s.eggsBred||0)>=1 },
  { id:"jackpot-1",    icon:"🎰", name:"Jackpot!",              desc:"Hit the slot jackpot.",                test:s=>(s.slots&&s.slots.jackpots)>=1 },
  { id:"speedrun-1",   icon:"⏱️", name:"Speed Demon",           desc:"Complete a $100k speedrun.",           test:s=>(s.speedrun&&s.speedrun.runs)>=1 },
  { id:"milestone-3",  icon:"🏆", name:"Hall of Famer",         desc:"Claim 3 lifetime milestones.",         test:s=>(s.milestonesClaimed||[]).length>=3 },
  { id:"nuzlocke-win", icon:"💀", name:"Against All Odds",      desc:"Win a Gym battle in Nuzlocke mode.",   test:s=>(s.nuzWins||0)>=1 },
  { id:"rich-1e14",    icon:"🌌", name:"Galactic Tycoon",       desc:"Earn $100T lifetime.",                 test:s=>s.lifetime>=1e14 },
  { id:"rich-1e17",    icon:"🪐", name:"Universal Economy",     desc:"Earn $100Qa lifetime.",                test:s=>s.lifetime>=1e17 },
  { id:"rich-1e20",    icon:"♾️", name:"BEYOND MILLIONS (1e20)", desc:"Earn $1e20 lifetime. Your friend owes you lunch.", test:s=>s.lifetime>=1e20 },
  { id:"vault-10",     icon:"🏦", name:"Upgrade Collector",     desc:"Own 10 Vault upgrades.",               test:s=>s.upgrades.length>=10 },
  { id:"vault-50",     icon:"💹", name:"Compound Interest",     desc:"Own 50 Vault upgrades.",               test:s=>s.upgrades.length>=50 },
  { id:"buildings-300",icon:"🏙️", name:"Metropolis",            desc:"Own 300 buildings.",                   test:s=>totalBuildings(s)>=300 },
  { id:"buildings-1000",icon:"🌆", name:"Ecumenopolis",          desc:"Own 1,000 buildings.",                 test:s=>totalBuildings(s)>=1000 },
  { id:"dex-100",      icon:"🗂️", name:"Senior Researcher",      desc:"Register 100 unique species.",         test:s=>Object.keys(s.pokedex).length>=100 },
  { id:"dex-200",      icon:"🌏", name:"World-Class Researcher", desc:"Register 200 unique species.",         test:s=>Object.keys(s.pokedex).length>=200 },
];

/* ---------- Number formatting ---------- */
function formatNumber(n){
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + formatNumber(-n);
  const notation = (typeof state !== "undefined" && state.settings) ? state.settings.notation : "suffix";
  if (notation === "scientific" && n >= 10000) return n.toExponential(2);
  if (notation === "full") return Math.floor(n).toLocaleString("en-US");
  if (n < 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 }); // keep $0.1/s visible early game
  if (n < 1e6) return Math.floor(n).toLocaleString("en-US");
  const units = [[1e33,"Dc"],[1e30,"No"],[1e27,"Oc"],[1e24,"Sp"],[1e21,"Sx"],[1e18,"Qi"],[1e15,"Qa"],[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];
  for (const [v,u] of units) if (n >= v) {
    const x = n / v;
    return (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.0+$|(\.\d*[1-9])0+$/,"$1") + u;
  }
  return String(Math.floor(n));
}
const fmtMoney = n => "$" + formatNumber(n);
const fmtRate  = n => fmtMoney(n) + "/s";

/* ---------- State ---------- */
function defaultState(){
  return {
    version:1, balance:0, lifetime:0, runEarned:0,
    totalClicks:0, clicksSinceCatch:0, totalCaught:0,
    buildings:Object.fromEntries(BUILDINGS.map(b=>[b.id,0])),
    upgrades:[], pokedex:{}, shinyDex:{}, achievements:[], badges:0,
    bonusPct:0, encounters:0, throws:0, excellentThrows:0, shinies:0, legendaryCaught:0,
    revealedBuildings:[], revealedUpgrades:[], muted:false,
    settings:{ theme:"kanto", particles:true, shake:true, floatText:true, reduceMotion:false, notation:"suffix", eventFreq:"chill" },
    items:{ berry:3, great:0, ultra:0, master:0 },
    buddyId:null, maxCombo:0, goldenCaught:0, quests:[], questDay:"", questsDone:0,
    region:"Kanto", leadersDefeated:{}, battleCooldownUntil:0, egg:null, eggsHatched:0, leaderWins:0,
    mode:"classic", buffs:[], weather:{ id:"clear", until:0 }, lastDaily:"", milestonesClaimed:[], legacyUpgrades:[],
    bredDex:{}, eggsBred:0, slots:{ spins:0, won:0, jackpots:0 }, eventsSeen:0, rocketWins:0,
    snorlaxMoved:0, nuzWins:0, speedrun:{ active:false, startedAt:0, startEarned:0, bestMs:0, runs:0 },
    settingsExtra:0,
    lastSeen:Date.now(),
  };
}
let state = defaultState();

function totalBuildings(s=state){ return BUILDINGS.reduce((a,b)=>a+(s.buildings[b.id]||0),0); }
function buildingCost(b){ return Math.max(1, Math.ceil(b.baseCost * Math.pow(COST_GROWTH, state.buildings[b.id]||0) * costMult())); }
function buildingMultiplier(id){
  let mult = state.upgrades.includes(UPGRADES.find(u=>u.target===id)?.id) ? 2 : 1;
  for (const t of TIER_UPGRADES) if (t.building===id && state.upgrades.includes(t.id)) mult *= 2;
  return mult;
}
function clickTierMult(){ return Math.pow(2, CLICK_UPGRADES.filter(u=>state.upgrades.includes(u.id)).length); }
function globalUpgradeMult(){ return GLOBAL_UPGRADES.reduce((m,u)=> m * (state.upgrades.includes(u.id) ? u.mult : 1), 1); }
function legacyHas(id){ return state.legacyUpgrades.includes(id); }
function leaderBonus(){ return Object.keys(state.leadersDefeated).length * 0.02; }
function pruneBuffs(){ const now = Date.now(); state.buffs = (state.buffs||[]).filter(b=>b.expires > now); }
function addBuff(kind, mult, seconds, label, icon){
  pruneBuffs();
  state.buffs.push({ kind, mult, expires:Date.now() + seconds*1000, label, icon:icon||"✨" });
  renderEffects(); saveGame();
}
function buffMult(kind){
  pruneBuffs();
  return state.buffs.reduce((m,b)=> m * ((b.kind===kind || b.kind==="all") ? b.mult : 1), 1);
}
function costMult(){ return state.buffs.reduce((m,b)=> m * (b.kind==="sale" ? b.mult : 1), 1); }
function modeMult(){ return state.mode==="zen" ? 1.2 : state.mode==="nuzlocke" ? 1.25 : 1; }
function effectiveCatchClicks(){ return state.buffs.some(b=>b.kind==="swarm" && b.expires>Date.now()) ? 50 : CLICKS_PER_CATCH; }
function globalMultiplier(){ return (1 + state.badges * 0.10) * (1 + state.bonusPct * (legacyHas("legacy-dex") ? 0.02 : 0.01)) * (1 + leaderBonus()) * modeMult() * currentWeather().dps * buffMult("dps") * globalUpgradeMult() * (legacyHas("legacy-dps") ? 3 : 1); }
function trainerLevel(){ return Math.floor(Math.sqrt(state.lifetime / 500)) + 1; }
function getDPS(){
  const base = BUILDINGS.reduce((sum,b)=> sum + (state.buildings[b.id]||0) * b.baseDps * buildingMultiplier(b.id), 0);
  return base * globalMultiplier();
}
function buildingDPS(b){ return (state.buildings[b.id]||0) * b.baseDps * buildingMultiplier(b.id) * globalMultiplier(); }
function buddyBonus(){
  if (!state.buddyId) return 0;
  const mon = WILD_POKEMON.find(m=>m.id===state.buddyId); if (!mon) return 0;
  const base = { common:0.05, uncommon:0.12, rare:0.25, legendary:0.50 }[mon.rarity] || 0.05;
  return base + Math.max(0,(state.pokedex[mon.id]||1)-1) * 0.02 + (state.shinyDex[mon.id] ? 0.10 : 0);
}
function clickPower(){ return 1 * (state.upgrades.includes("rare-candy") ? 2 : 1) * (1 + state.badges * 0.10) * (1 + buddyBonus()) * currentWeather().click * buffMult("click") * (state.mode==="zen" ? 1.1 : 1) * clickTierMult() * (legacyHas("legacy-click") ? 3 : 1); }
function prestigePending(){ return Math.floor(state.runEarned / 1e6); }

function earn(amount){
  state.balance += amount; state.lifetime += amount; state.runEarned += amount;
}

/* ---------- Persistence ---------- */
const saveIndicator = document.getElementById("save-indicator");
function saveGame(){
  state.lastSeen = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveIndicator.classList.add("show");
    setTimeout(()=>saveIndicator.classList.remove("show"), 1200);
  } catch(e){ /* storage unavailable (private mode) — game still runs */ }
}
function loadGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    const fresh = defaultState();
    state = { ...fresh, ...parsed,
      buildings:{ ...fresh.buildings, ...(parsed.buildings||{}) },
      upgrades:Array.isArray(parsed.upgrades)?parsed.upgrades:[],
      pokedex:parsed.pokedex && typeof parsed.pokedex==="object"?parsed.pokedex:{},
      achievements:Array.isArray(parsed.achievements)?parsed.achievements:[],
      revealedBuildings:Array.isArray(parsed.revealedBuildings)?parsed.revealedBuildings:[],
      revealedUpgrades:Array.isArray(parsed.revealedUpgrades)?parsed.revealedUpgrades:[],
      shinyDex:parsed.shinyDex && typeof parsed.shinyDex==="object"?parsed.shinyDex:{},
      settings:{ ...fresh.settings, ...(parsed.settings||{}) },
      items:{ ...fresh.items, ...(parsed.items||{}) },
      quests:Array.isArray(parsed.quests)?parsed.quests:[],
      leadersDefeated:parsed.leadersDefeated && typeof parsed.leadersDefeated==="object"?parsed.leadersDefeated:{},
      egg:parsed.egg && typeof parsed.egg==="object"?parsed.egg:null,
      buffs:Array.isArray(parsed.buffs)?parsed.buffs:[],
      weather:parsed.weather && typeof parsed.weather==="object"?parsed.weather:fresh.weather,
      milestonesClaimed:Array.isArray(parsed.milestonesClaimed)?parsed.milestonesClaimed:[],
      bredDex:parsed.bredDex && typeof parsed.bredDex==="object"?parsed.bredDex:{},
      slots:{ ...fresh.slots, ...(parsed.slots||{}) },
      speedrun:{ ...fresh.speedrun, ...(parsed.speedrun||{}) },
      legacyUpgrades:Array.isArray(parsed.legacyUpgrades)?parsed.legacyUpgrades:[],
    };
    if (parsed.bonusPct === undefined) state.bonusPct = state.totalCaught; // pre-minigame saves: +1% per catch
    // Offline earnings: 50% rate, capped at 8h
    const elapsed = Math.min(Math.max((Date.now() - (state.lastSeen||Date.now()))/1000, 0), OFFLINE_CAP_SECONDS);
    const dps = getDPS();
    if (elapsed > 60 && dps > 0){
      const gained = dps * elapsed * 0.5;
      earn(gained);
      setTimeout(()=>toast(`🌙 While you were away (${Math.round(elapsed/60)} min), your team earned <b>${fmtMoney(gained)}</b>!`), 400);
    }
  } catch(e){ console.warn("Save load failed, starting fresh.", e); state = defaultState(); }
}

/* ---------- DOM refs ---------- */
const $ = id => document.getElementById(id);
const els = {
  balance:$("balance"), dps:$("dps-display"), clickPower:$("click-power-display"),
  ball:$("pokeball"), stage:$("pokeball-stage"),
  catchCount:$("catch-count"), catchBar:$("catch-bar"), banner:$("encounter-banner"),
  news:$("news-text"), buildingShop:$("building-shop"), upgradeShop:$("upgrade-shop"),
  pokedex:$("pokedex"), achievements:$("achievements"), prestigePending:$("prestige-pending"),
  btnPrestige:$("btn-prestige"), btnMute:$("btn-mute"),
  trainerLevel:$("trainer-level"), trainerNext:$("trainer-next"), trainerBar:$("trainer-bar"),
  modal:$("encounter-modal"), wildTitle:$("wild-title"), wildSprite:$("wild-sprite"), wildRarity:$("wild-rarity"),
  wildShiny:$("wild-shiny"), wildBalls:$("wild-balls"), catchRing:$("catch-ring"), throwBall:$("throw-ball"),
  burst:$("burst"), battleMsg:$("battle-message"), throwRating:$("throw-rating"),
  catchMeterFill:$("catch-meter-fill"), catchMeterLabel:$("catch-meter-label"),
  btnThrow:$("btn-throw"), btnBerry:$("btn-berry"), btnRun:$("btn-run"), btnCloseEncounter:$("btn-close-encounter"),
  buddyDisplay:$("buddy-display"), comboCount:$("combo-count"), comboBar:$("combo-bar"),
  questList:$("quest-list"), itemShop:$("item-shop"), settingsModal:$("settings-modal"), vaultGrid:$("vault-grid"),
  invGreat:$("inv-great"), invUltra:$("inv-ultra"), invBerry:$("inv-berry"),
  stat:{ balance:$("stat-balance"), dps:$("stat-dps"), lifetime:$("stat-lifetime"), run:$("stat-run"),
    clicks:$("stat-clicks"), buildings:$("stat-buildings"), caught:$("stat-caught"), dex:$("stat-dex"),
    collection:$("stat-collection-bonus"), badges:$("stat-badges"),
    seen:$("stat-seen"), throws:$("stat-throws"), excellent:$("stat-excellent"), shinies:$("stat-shinies"),
    events:$("stat-events"), rockets:$("stat-rockets"), snorlax:$("stat-snorlax"), bred:$("stat-bred"),
    slots:$("stat-slots"), speedrun:$("stat-speedrun"), rank:$("stat-rank") },
};
function toast(html){
  const t = document.createElement("div"); t.className="toast"; t.innerHTML=html;
  $("toast-stack").appendChild(t); setTimeout(()=>{ t.style.opacity="0"; setTimeout(()=>t.remove(),300); }, 4200);
}
function imgTag(src, emoji, alt){
  return `<img src="${src}" alt="${alt||""}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${emoji}',style:'font-size:1.9rem'}))">`;
}

/* ---------- Shop rendering (built once, updated in place) ---------- */
const buildingRows = {}, upgradeRows = {};
function buildShop(){
  for (const b of BUILDINGS){
    const btn = document.createElement("button");
    btn.type="button"; btn.className="shop-item hidden"; btn.id=`shop-${b.id}`;
    btn.innerHTML = `
      <span class="icon-box">${imgTag(b.sprite,b.emoji,b.name)}</span>
      <span><h3>${b.name}</h3><p class="sub">${b.blurb}</p>
      <p class="sub">Each: ${fmtRate(b.baseDps)} · Yours: <span data-role="contrib">${fmtRate(0)}</span></p></span>
      <span style="text-align:right"><span class="owned" data-role="owned">0</span><br><span class="cost" data-role="cost"></span></span>`;
    btn.addEventListener("click", ()=>buyBuilding(b.id));
    els.buildingShop.appendChild(btn);
    buildingRows[b.id] = { root:btn, owned:btn.querySelector('[data-role="owned"]'), cost:btn.querySelector('[data-role="cost"]'), contrib:btn.querySelector('[data-role="contrib"]') };
  }
  for (const u of UPGRADES){
    const btn = document.createElement("button");
    btn.type="button"; btn.className="shop-item hidden"; btn.id=`upgrade-${u.id}`;
    btn.innerHTML = `
      <span class="icon-box">${imgTag(u.sprite,u.emoji,u.name)}</span>
      <span><h3>${u.emoji} ${u.name}</h3><p class="sub">${u.label}</p></span>
      <span style="text-align:right"><span class="owned" data-role="owned"></span><br><span class="cost" data-role="cost">${fmtMoney(u.cost)}</span></span>`;
    btn.addEventListener("click", ()=>buyUpgrade(u.id));
    els.upgradeShop.appendChild(btn);
    upgradeRows[u.id] = { root:btn, owned:btn.querySelector('[data-role="owned"]'), cost:btn.querySelector('[data-role="cost"]') };
  }
  for (const it of ITEM_SHOP){
    const btn = document.createElement("button");
    btn.type="button"; btn.className="shop-item"; btn.id=`item-${it.id}`;
    btn.innerHTML = `
      <span class="icon-box">${imgTag(it.sprite,it.emoji,it.name)}</span>
      <span><h3>${it.emoji} ${it.name}</h3><p class="sub">${it.blurb}</p></span>
      <span style="text-align:right"><span class="item-count" data-role="count">×0</span><br><span class="cost" data-role="cost">${fmtMoney(it.cost)}</span></span>`;
    btn.addEventListener("click", ()=>buyItem(it.id));
    els.itemShop.appendChild(btn);
    itemRows[it.id] = { root:btn, count:btn.querySelector('[data-role="count"]'), cost:btn.querySelector('[data-role="cost"]') };
  }
}
const itemRows = {};
function buyItem(id){
  const it = ITEM_SHOP.find(x=>x.id===id);
  if (!it || state.balance < it.cost) return;
  if (id === "egg"){
    if (state.egg){ toast("🥚 An egg is already incubating!"); return; }
    state.balance -= it.cost; state.egg = { progress:0, target:300 };
    toast("🥚 <b>Mystery Egg</b> placed in the incubator — 300 clicks to hatch!");
    renderEgg(); refreshAll(); saveGame(); return;
  }
  state.balance -= it.cost; state.items[id] = (state.items[id]||0) + 1;
  toast(`🎒 Bought <b>${it.name}</b>! (${state.items[id]} held)`);
  refreshAll(); saveGame();
}
function refreshItems(){
  for (const it of ITEM_SHOP){
    const row = itemRows[it.id]; if (!row) continue;
    row.count.textContent = it.id === "egg" ? (state.egg ? "🥚…" : "—") : "×" + (state.items[it.id]||0);
    const afford = state.balance >= it.cost;
    row.root.disabled = !afford; row.root.classList.toggle("cant-afford", !afford);
    row.cost.classList.toggle("cant", !afford);
  }
  updateInventoryUI();
}
function updateInventoryUI(){
  if (els.invGreat) els.invGreat.textContent = state.items.great||0;
  if (els.invUltra) els.invUltra.textContent = state.items.ultra||0;
  if (els.invBerry) els.invBerry.textContent = state.items.berry||0;
  const im = $("inv-master"); if (im) im.textContent = state.items.master||0;
}

function refreshShop(){
  for (const b of BUILDINGS){
    const row = buildingRows[b.id], cost = buildingCost(b), owned = state.buildings[b.id]||0;
    // Reveal rule: only unhide once the player reaches 60% of the (current) cost — then stay revealed.
    if (owned>0 || state.balance >= cost*0.6) {
      if (!state.revealedBuildings.includes(b.id)) state.revealedBuildings.push(b.id);
    }
    const revealed = state.revealedBuildings.includes(b.id);
    row.owned.textContent = owned;
    row.cost.textContent = fmtMoney(cost);
    row.root.classList.toggle("hidden", !revealed);
    if (!revealed) continue;
    row.contrib.textContent = fmtRate(buildingDPS(b)) + (buildingMultiplier(b.id)>1 ? " (×2 stone!)" : "");
    row.cost.textContent = buyQty > 1 ? `${fmtMoney(bulkCost(b, buyQty))} ×${buyQty}` : fmtMoney(cost);
    const afford = state.balance >= bulkCost(b, buyQty);
    row.root.disabled = !afford;
    row.root.classList.toggle("cant-afford", !afford);
    row.cost.classList.toggle("cant", !afford);
  }
  for (const u of UPGRADES){
    const row = upgradeRows[u.id], owned = state.upgrades.includes(u.id);
    if (state.balance >= u.cost*0.6 && !state.revealedUpgrades.includes(u.id)) state.revealedUpgrades.push(u.id);
    const revealed = owned || state.revealedUpgrades.includes(u.id);
    row.root.classList.toggle("hidden", !revealed);
    if (!revealed) continue;
    row.owned.textContent = owned ? "✔" : "";
    row.cost.textContent = owned ? "Owned" : fmtMoney(u.cost);
    row.root.classList.toggle("purchased", owned);
    const afford = !owned && state.balance >= u.cost;
    row.root.disabled = owned || !afford;
    row.root.classList.toggle("cant-afford", !owned && !afford);
    row.cost.classList.toggle("cant", !owned && !afford);
  }
}

/* ---------- Upgrade Vault (tiers / click / global) ---------- */
const VAULT = [
  ...TIER_UPGRADES.map(u=>({ ...u, kind:"tier",  req:()=> (state.buildings[u.building]||0) >= u.threshold, reqLabel:`Own ${u.threshold} ${BUILDINGS.find(b=>b.id===u.building).name}` })),
  ...CLICK_UPGRADES.map(u=>({ ...u, kind:"click", req:()=> state.totalClicks >= u.clicks, reqLabel:`${formatNumber(u.clicks)} total clicks` })),
  ...GLOBAL_UPGRADES.map(u=>({ ...u, kind:"global", req:()=> state.lifetime >= u.lifetime, reqLabel:`${fmtMoney(u.lifetime)} lifetime` })),
];
const vaultRows = {};
function buildVault(){
  for (const u of VAULT){
    const btn = document.createElement("button");
    btn.type="button"; btn.className="vault-tile hidden"; btn.id=`vault-${u.id}`;
    btn.innerHTML = `${imgTag(u.sprite,u.emoji,u.name)}<b>${u.name}</b><small>${u.label}</small><small data-role="req"></small><span data-role="cost"></span>`;
    btn.addEventListener("click", ()=>buyVault(u.id));
    els.vaultGrid.appendChild(btn);
    vaultRows[u.id] = { root:btn, req:btn.querySelector('[data-role="req"]'), cost:btn.querySelector('[data-role="cost"]') };
  }
}
function refreshVault(){
  for (const u of VAULT){
    const row = vaultRows[u.id]; if (!row) continue;
    const owned = state.upgrades.includes(u.id);
    row.root.classList.toggle("hidden", owned);
    if (owned) continue;
    const reqMet = u.req();
    row.req.textContent = reqMet ? "✔ Ready" : `🔒 ${u.reqLabel}`;
    row.cost.textContent = fmtMoney(u.cost);
    const canBuy = reqMet && state.balance >= u.cost;
    row.root.disabled = !canBuy;
    row.root.classList.toggle("cant-afford", !canBuy);
    row.root.classList.toggle("ready", reqMet);
  }
}
function buyVault(id){
  const u = VAULT.find(x=>x.id===id);
  if (!u || state.upgrades.includes(id) || !u.req() || state.balance < u.cost) return;
  state.balance -= u.cost; state.upgrades.push(id);
  toast(`🏦 <b>${u.name}</b> purchased! ${u.label}.`);
  jingle([784,988,1175]);
  checkAchievements(); refreshAll(); saveGame();
}
/* ---------- Legacy shop (spend prestige badges) ---------- */
function renderLegacy(){
  const box = $("legacy-list"); if (!box) return;
  box.innerHTML = LEGACY_UPGRADES.map(u=>{
    const owned = legacyHas(u.id);
    return `<div class="milestone ${owned?"reached":""}"><span>${u.icon} <b>${u.name}</b> — ${u.desc}</span>
      ${owned?'<b>✔ Owned</b>':`<button type="button" class="btn btn-prestige" data-legacy="${u.id}" ${state.badges < u.cost?"disabled":""}>Buy · ${u.cost} 🏅</button>`}</div>`;
  }).join("");
}
$("legacy-list").addEventListener("click", e=>{
  const btn = e.target.closest("[data-legacy]"); if (!btn) return;
  const u = LEGACY_UPGRADES.find(x=>x.id===btn.dataset.legacy);
  if (!u || legacyHas(u.id) || state.badges < u.cost) return;
  if (!confirm(`Spend ${u.cost} Gym Badges on ${u.name}? (Unspent badges each give +10% earnings — this is permanent.)`)) return;
  state.badges -= u.cost; state.legacyUpgrades.push(u.id);
  toast(`🌟 Legacy upgrade: <b>${u.name}</b>!`);
  renderLegacy(); checkAchievements(); refreshAll(); saveGame();
});

/* ---------- Purchases ---------- */
let buyQty = 1;
document.querySelectorAll(".qty-btn").forEach(btn=>btn.addEventListener("click", ()=>{
  buyQty = Number(btn.dataset.qty) || 1;
  document.querySelectorAll(".qty-btn").forEach(b=>b.classList.toggle("active", b===btn));
  refreshShop();
}));
function bulkCost(b, qty){
  let total = 0; const owned = state.buildings[b.id]||0;
  for (let i=0;i<qty;i++) total += Math.ceil(b.baseCost * Math.pow(COST_GROWTH, owned+i));
  return Math.max(qty, Math.ceil(total * costMult()));
}
function buyBuilding(id){
  const b = BUILDINGS.find(x=>x.id===id), cost = bulkCost(b, buyQty);
  if (state.balance < cost) return;
  state.balance -= cost; state.buildings[id] += buyQty;
  pop(els.buildingShop); checkAchievements(); refreshAll(); saveGame();
}
function buyUpgrade(id){
  const u = UPGRADES.find(x=>x.id===id);
  if (!u || state.upgrades.includes(id) || state.balance < u.cost) return;
  state.balance -= u.cost; state.upgrades.push(id);
  toast(`✨ <b>${u.name}</b> used! ${u.label}.`);
  setNews(`A Pokémon evolved in power! ${u.label} — output doubled!`);
  checkAchievements(); refreshAll();
}
function pop(el){ el.animate([{transform:"scale(1)"},{transform:"scale(1.01)"},{transform:"scale(1)"}],{duration:120}); }

/* ---------- Clicking & catching ---------- */
let audioCtx = null;
function tone(freq, dur=0.1, type="sine", delay=0, vol=0.06){
  if (state.muted) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const t0 = audioCtx.currentTime + delay;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(audioCtx.destination); o.start(t0); o.stop(t0 + dur + .02);
  }catch(e){/* audio blocked — ignore */}
}
function clickSound(){ tone(620 + Math.random()*80, .08, "sine", 0, .05); }
function jingle(notes){ notes.forEach((f,i)=>tone(f, .16, "triangle", i*.11, .07)); }
function spawnFloatText(x, y, text, cls=""){
  if (!state.settings.floatText) return;
  const rect = els.stage.getBoundingClientRect();
  const el = document.createElement("span");
  el.className="float-text " + cls; el.textContent=text;
  el.style.left = (x - rect.left) + "px"; el.style.top = (y - rect.top) + "px";
  els.stage.appendChild(el); setTimeout(()=>el.remove(), 1000);
}
let combo = 0, lastClickAt = 0;
const comboMult = () => 1 + Math.min(combo, 50) * 0.02;
function updateComboUI(){
  els.comboCount.textContent = "×" + comboMult().toFixed(2) + (combo>1 ? ` (${combo} streak)` : "");
  els.comboBar.style.width = Math.min(100, combo/50*100) + "%";
}
els.ball.addEventListener("pointerdown", e => {
  const now = performance.now();
  combo = (now - lastClickAt < (currentWeather().id==="snow" ? 3000 : 1500)) ? combo + 1 : 1;
  lastClickAt = now;
  state.maxCombo = Math.max(state.maxCombo, combo);
  const crit = Math.random() < (currentWeather().id==="storm" ? 0.10 : 0.05);
  const gain = clickPower() * comboMult() * (crit ? 10 : 1);
  earn(gain);
  state.totalClicks++; state.clicksSinceCatch++;
  els.ball.classList.add("pressed"); setTimeout(()=>els.ball.classList.remove("pressed"), 90);
  spawnFloatText(e.clientX || rectCenter().x, e.clientY || rectCenter().y, "+" + fmtMoney(gain) + (crit ? " CRIT!" : ""), crit ? "crit" : "");
  if (crit && state.settings.shake){ els.stage.classList.remove("stage-shake"); void els.stage.offsetWidth; els.stage.classList.add("stage-shake"); jingle([880,1175,1568]); }
  else clickSound();
  updateComboUI();
  if (state.buddyId && state.totalClicks % 200 === 0){ state.items.berry++; toast("🐾 Your Buddy found a <b>🍓 Razz Berry</b>!"); updateInventoryUI(); }
  if (state.egg){ state.egg.progress++; if (state.egg.progress >= state.egg.target) hatchEgg(); else if (state.egg.progress % 25 === 0) renderEgg(); }
  if (state.clicksSinceCatch >= effectiveCatchClicks() && !encounter){ state.clicksSinceCatch = 0; startEncounter(); }
  checkAchievements(); refreshHUD();
});

/* ---------- Golden Magikarp event ---------- */
function scheduleGolden(){ setTimeout(spawnGolden, state.mode==="zen" ? 25000 + Math.random()*30000 : 45000 + Math.random()*60000); }
function spawnGolden(){
  scheduleGolden();
  if (encounter || document.hidden || els.stage.querySelector(".golden-mon")) return;
  const el = document.createElement("button");
  el.type="button"; el.className="golden-mon"; el.title="Golden Magikarp! Click it!";
  el.innerHTML = imgTag(ANIM_SPRITE(129, true), "🐟", "Golden Magikarp");
  el.addEventListener("click", ()=>{
    const reward = Math.max(100, getDPS()*60, clickPower()*25) * (legacyHas("legacy-gold") ? 5 : 1);
    earn(reward); state.goldenCaught++;
    toast(`🐟✨ Golden Magikarp! +<b>${fmtMoney(reward)}</b>!`);
    jingle([784,988,1175,1568]);
    el.remove(); checkAchievements(); refreshAll(); saveGame();
  });
  els.stage.appendChild(el);
  setTimeout(()=>el.remove(), 8200);
}
function rectCenter(){ const r = els.ball.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; }

/* ================= Catching minigame =================
   Every 100 clicks a wild Pokémon appears in a modal:
   time the shrinking ring against the target circle, throw one of
   3 balls, survive 3 shakes. Berries, rarities, shinies, fleeing. */
let encounter = null, ringRAF = null, encounterSeq = 0;
const wait = ms => new Promise(r=>setTimeout(r, ms));
const clamp01 = v => Math.min(0.95, Math.max(0.02, v));

function pickWild(){
  const weights = { ...RARITY_WEIGHTS };
  if (isNight()) weights.legendary *= 2; // moonlight draws out legends
  let local = WILD_POKEMON.filter(m=>m.regions.includes(state.region));
  const seasonIds = SEASON_SPAWNS[currentSeason().id] || [];
  if (seasonIds.length && Math.random() < 0.25){ const sg = local.filter(m=>seasonIds.includes(m.id)); if (sg.length) local = sg; }
  const pool = Object.entries(weights);
  let roll = Math.random() * pool.reduce((a,[,w])=>a+w,0), rarity = "common";
  for (const [r,w] of pool){ if ((roll -= w) <= 0){ rarity = r; break; } }
  const group = local.filter(m=>m.rarity===rarity);
  const fallback = group.length ? group : local;
  return fallback[Math.floor(Math.random()*fallback.length)];
}

function startEncounter(){
  const mon = pickWild();
  encounter = { ...mon, shiny:Math.random() < SHINY_CHANCE * (isNight() ? 2 : 1) * buffMult("shiny"), balls:(state.mode==="nuzlocke" ? 1 : 3), berry:false, bait:false, rock:false, busy:false, over:false, ringScale:1, ball:"poke", seq:++encounterSeq };
  state.encounters++;
  els.wildTitle.textContent = encounter.shiny ? `A wild ✨ ${mon.name} appeared!` : `A wild ${mon.name} appeared!`;
  els.wildRarity.textContent = mon.rarity; els.wildRarity.className = "rarity-badge " + mon.rarity;
  els.wildShiny.classList.toggle("hidden", !encounter.shiny);
  els.wildSprite.src = ANIM_SPRITE(mon.id, encounter.shiny);
  els.wildSprite.alt = mon.name;
  els.wildSprite.className = "wild-sprite animated";
  els.wildSprite.onerror = ()=>{ els.wildSprite.onerror = null; els.wildSprite.src = SPRITE_POKEMON(mon.id).replace("/pokemon/", encounter.shiny ? "/pokemon/shiny/" : "/pokemon/"); };
  $("battle-scene").className = "battle-scene region-" + state.region + (isNight() ? " night" : "");
  syncBallPicker(); updateInventoryUI();
  els.catchMeterFill.style.width = Math.round(mon.rate*100) + "%";
  els.catchMeterLabel.textContent = `${mon.rarity} · base ${Math.round(mon.rate*100)}%`;
  els.battleMsg.textContent = "Time your throw! Press THROW (or Space) when the shrinking ring meets the target circle.";
  els.throwRating.textContent = "";
  $("btn-bait").disabled = false; $("btn-rock").disabled = false;
  els.throwBall.className = "throw-ball hidden"; els.burst.innerHTML = "";
  setBattleControls(false);
  updateBallsDisplay();
  els.modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  jingle([523, 659, 784]);
  checkAchievements(); refreshHUD();
  startRing();
}
function updateBallsDisplay(){ els.wildBalls.textContent = encounter ? "●".repeat(encounter.balls) + "○".repeat(Math.max(0,3-encounter.balls)) : ""; }
function setBattleControls(over){
  const busy = !!(encounter && encounter.busy);
  els.btnThrow.disabled = over || busy;
  els.btnBerry.disabled = over || busy || !!(encounter && encounter.berry) || (state.items.berry||0) <= 0;
  els.btnRun.disabled = over || busy;
  els.btnCloseEncounter.classList.toggle("hidden", !over);
  els.btnThrow.classList.toggle("hidden", over);
  els.btnBerry.classList.toggle("hidden", over);
  els.btnRun.classList.toggle("hidden", over);
}
function startRing(){
  cancelRing();
  const t0 = performance.now(), PERIOD = currentWeather().id==="wind" ? 1450 : currentWeather().id==="storm" ? 900 : 1150;
  const step = now => {
    if (!encounter || encounter.over || encounter.busy) return;
    const phase = ((now - t0) % PERIOD) / PERIOD;
    encounter.ringScale = 1 - phase;
    els.catchRing.style.transform = `scale(${encounter.ringScale})`;
    const d = Math.abs(encounter.ringScale - 0.525);
    els.catchRing.classList.toggle("excellent", d <= 0.07);
    els.catchRing.classList.toggle("weak", d > 0.27);
    ringRAF = requestAnimationFrame(step);
  };
  ringRAF = requestAnimationFrame(step);
}
function cancelRing(){ if (ringRAF) cancelAnimationFrame(ringRAF); ringRAF = null; }
function rateThrow(scale){
  const d = Math.abs(scale - 0.525);
  if (d <= 0.07) return { label:"EXCELLENT!", mult:1.6, excellent:true };
  if (d <= 0.15) return { label:"Great!", mult:1.3 };
  if (d <= 0.27) return { label:"Nice", mult:1.0 };
  return { label:"Weak throw…", mult:0.55, bad:true };
}

async function throwBall(){
  if (!encounter || encounter.busy || encounter.over) return;
  const seq = encounter.seq, rating = rateThrow(encounter.ringScale);
  encounter.busy = true; state.throws++;
  if (rating.excellent) state.excellentThrows++;
  cancelRing();
  els.throwRating.textContent = rating.label;
  els.throwRating.classList.toggle("bad", !!rating.bad);
  setBattleControls(false);
  tone(300, .18, "sawtooth", 0, .03);
  els.throwBall.className = "throw-ball flying";
  els.battleMsg.textContent = `You threw a ${BALL_TYPES[encounter.ball].name} at ${encounter.name}!`;
  await wait(520); if (!encounter || encounter.seq !== seq) return;
  els.throwBall.className = "throw-ball landed";
  els.wildSprite.classList.add("captured");
  tone(180, .12, "square", 0, .04);
  await wait(420); if (!encounter || encounter.seq !== seq) return;

  const ballType = BALL_TYPES[encounter.ball] || BALL_TYPES.poke;
  if (ballType.item){
    if ((state.items[ballType.item]||0) > 0){ state.items[ballType.item]--; }
    else encounter.ball = "poke";
    updateInventoryUI(); syncBallPicker();
  }
  const safariMult = (encounter.bait ? 1.25 : 1) * (encounter.rock ? 1.5 : 1);
  const finalP = encounter.ball==="master" ? 1 : clamp01(encounter.rate * rating.mult * (encounter.berry ? 1.45 : 1) * (BALL_TYPES[encounter.ball] ? BALL_TYPES[encounter.ball].mult : 1) * (currentWeather().id==="rain" ? 1.10 : 1) * buffMult("catch") * safariMult * (legacyHas("legacy-catch") ? 1.25 : 1));
  const shakeP = encounter.ball==="master" ? 1 : Math.cbrt(finalP);
  let shakes = 0; while (shakes < 3 && Math.random() < shakeP) shakes++;
  for (let i=0;i<shakes;i++){
    els.throwBall.classList.remove("shaking"); void els.throwBall.offsetWidth; els.throwBall.classList.add("shaking");
    tone(1400, .05, "square", 0, .03);
    els.battleMsg.textContent = ["The ball wobbles…", "…and wobbles again…", "…one more wobble…"][i];
    await wait(580); if (!encounter || encounter.seq !== seq) return;
  }
  if (shakes === 3) return succeedCatch(seq);

  // Broke free!
  encounter.balls--; updateBallsDisplay();
  els.throwBall.className = "throw-ball hidden";
  els.wildSprite.classList.remove("captured"); els.wildSprite.classList.add("broke-free");
  setTimeout(()=>els.wildSprite.classList.remove("broke-free"), 500);
  jingle([392, 330, 262]);
  if (encounter.balls <= 0) return endEncounter(`${encounter.name} broke free — and you're out of balls! It wanders off…`, seq);
  const fleeChance = state.mode==="zen" ? 0 : state.mode==="nuzlocke" ? 1 : encounter.flee * (currentWeather().id==="fog" ? 1.5 : 1) * (encounter.bait ? 0.4 : 1) * (encounter.rock ? 1.8 : 1);
  if (Math.random() < fleeChance) return fleeEncounter(seq);
  encounter.busy = false; setBattleControls(false);
  els.battleMsg.textContent = `${encounter.name} broke free after ${shakes} shake${shakes===1?"":"s"}! ${encounter.balls} ball${encounter.balls===1?"":"s"} left — try again!`;
  checkAchievements(); refreshHUD(); startRing();
}
function starBurst(){
  if (!state.settings.particles) return;
  els.burst.innerHTML = "";
  for (let i=0;i<10;i++){
    const el = document.createElement("i");
    el.textContent = ["⭐","✨","💛","🌟"][i%4];
    el.style.setProperty("--dx", (Math.cos(i/10*6.28)*110) + "px");
    el.style.setProperty("--dy", (Math.sin(i/10*6.28)*90 - 20) + "px");
    els.burst.appendChild(el);
  }
}
function succeedCatch(seq){
  if (!encounter || encounter.seq !== seq) return;
  const mon = encounter, isNew = !state.pokedex[mon.id];
  state.pokedex[mon.id] = (state.pokedex[mon.id]||0) + 1;
  if (mon.shiny){ state.shinyDex[mon.id] = true; state.shinies++; }
  if (mon.rarity === "legendary") state.legendaryCaught++;
  state.totalCaught++;
  const bonus = mon.shiny ? 5 : 1;
  state.bonusPct += bonus;
  els.throwBall.className = "throw-ball landed caught-ball";
  starBurst(); jingle([523,659,784,1047,1319]);
  els.battleMsg.innerHTML = `<b>Gotcha! ${mon.shiny?"✨ ":""}${mon.name} was caught!</b><br>${isNew?"New Pokédex entry! ":`You now have ${state.pokedex[mon.id]} × ${mon.name}. `}+${bonus}% DPS forever (collection bonus now +${state.bonusPct}%).`;
  els.banner.classList.remove("hidden");
  els.banner.innerHTML = `${imgTag(SPRITE_POKEMON(mon.id),"🐾",mon.name)}<div><b>Gotcha! ${mon.shiny?"✨ ":""}${mon.name} was caught!</b><br>${isNew?"New Pokédex entry registered!":""} Collection bonus: <b>+${state.bonusPct}% DPS</b>.</div>`;
  setNews(`Wild ${mon.name} caught by a local trainer in a dramatic ball-shaking showdown. 'Worth it,' says trainer.`);
  toast(`🎉 Gotcha! <b>${mon.shiny?"✨ ":""}${mon.name}</b> was caught! (+${bonus}% DPS)`);
  encounter.over = true; setBattleControls(true);
  renderPokedex(); renderBuddy(); checkAchievements(); refreshHUD(); saveGame();
}
function fleeEncounter(seq){
  if (!encounter || encounter.seq !== seq) return;
  els.wildSprite.classList.add("fled");
  endEncounter(`Oh no — the wild ${encounter.name} fled into the tall grass!`, seq, true);
}
function endEncounter(msg, seq, alreadyFled=false){
  if (!encounter || encounter.seq !== seq) return;
  if (!alreadyFled && encounter.balls <= 0) { /* out of balls message already set */ }
  els.battleMsg.textContent = msg;
  encounter.over = true; cancelRing(); setBattleControls(true);
  jingle([330, 262, 196]);
  refreshHUD(); saveGame();
}
function closeEncounter(){
  encounterSeq++; encounter = null; cancelRing();
  els.modal.classList.add("hidden");
  document.body.style.overflow = "";
  refreshHUD();
}
function syncBallPicker(){
  document.querySelectorAll(".ball-choice[data-ball]").forEach(b=>{
    const type = BALL_TYPES[b.dataset.ball];
    const available = !type.item || (state.items[type.item]||0) > 0;
    b.classList.toggle("active", !!encounter && encounter.ball === b.dataset.ball);
    b.disabled = !available || !!(encounter && encounter.busy);
  });
}
document.querySelectorAll(".ball-choice[data-ball]").forEach(b=>b.addEventListener("click", ()=>{
  if (!encounter) return;
  encounter.ball = b.dataset.ball; syncBallPicker(); tone(700,.06,"sine",0,.04);
}));
els.btnThrow.addEventListener("click", throwBall);
els.btnBerry.addEventListener("click", ()=>{
  if (!encounter || encounter.busy || encounter.berry || (state.items.berry||0) <= 0) return;
  encounter.berry = true; state.items.berry--; updateInventoryUI();
  els.wildSprite.style.filter = "drop-shadow(0 10px 6px rgba(0,0,0,.3)) hue-rotate(-25deg) saturate(1.6)";
  setTimeout(()=>{ els.wildSprite.style.filter = ""; }, 900);
  els.battleMsg.textContent = `You tossed a Razz Berry! ${encounter.name} is distracted — catch chance boosted for your next throw.`;
  setBattleControls(false); tone(880, .12, "triangle", 0, .05);
});
$("btn-bait").addEventListener("click", ()=>{
  if (!encounter || encounter.busy || encounter.bait) return;
  encounter.bait = true; $("btn-bait").disabled = true;
  els.battleMsg.textContent = `You tossed bait! ${encounter.name} is munching happily — easier to catch, much less likely to flee.`;
  tone(760,.12,"triangle",0,.05);
});
$("btn-rock").addEventListener("click", ()=>{
  if (!encounter || encounter.busy || encounter.rock) return;
  encounter.rock = true; $("btn-rock").disabled = true;
  els.battleMsg.textContent = `You threw a rock! ${encounter.name} is furious — easier to catch, but it may bolt!`;
  tone(200,.15,"sawtooth",0,.05);
});
els.btnRun.addEventListener("click", ()=>{ if (encounter && !encounter.busy){ toast("🏃 You ran away safely!"); closeEncounter(); } });
els.btnCloseEncounter.addEventListener("click", closeEncounter);
document.addEventListener("keydown", e=>{
  if (!encounter || els.modal.classList.contains("hidden")) return;
  if (e.code === "Space"){ e.preventDefault(); throwBall(); }
  if (e.code === "Escape" && !encounter.busy) closeEncounter();
});

/* ---------- Pokédex / achievements / news ---------- */
let dexSearch = "", dexFilter = "all";
$("dex-search").addEventListener("input", e=>{ dexSearch = e.target.value.toLowerCase(); renderPokedex(); });
$("dex-filter").addEventListener("change", e=>{ dexFilter = e.target.value; renderPokedex(); });
function renderPokedex(){
  if (typeof renderBreeding === "function") renderBreeding();
  const label = $("dex-count-label"); if (label) label.textContent = `(${Object.keys(state.pokedex).length}/${WILD_POKEMON.length} caught)`;
  const list = WILD_POKEMON.filter(mon=>{
    const seen = (state.pokedex[mon.id]||0) > 0;
    if (dexSearch && !mon.name.toLowerCase().includes(dexSearch) && String(mon.id) !== dexSearch) return false;
    if (dexFilter === "caught") return seen;
    if (dexFilter === "missing") return !seen;
    if (dexFilter === "shiny") return !!state.shinyDex[mon.id];
    if (["common","uncommon","rare","legendary"].includes(dexFilter)) return mon.rarity === dexFilter;
    return true;
  });
  els.pokedex.innerHTML = list.length ? list.map(mon=>{
    const count = state.pokedex[mon.id]||0, seen = count>0, shiny = !!state.shinyDex[mon.id];
    const src = seen ? ANIM_SPRITE(mon.id, shiny) : SPRITE_POKEMON(mon.id);
    return `<div class="dex-entry ${seen?"":"unseen"} ${shiny?"shiny":""}">${count>1?`<span class="dex-count">×${count}</span>`:""}${imgTag(src,"❔",seen?mon.name:"Unknown")}<div>${seen?mon.name:"???"}${shiny?" ✨":""}</div><div class="rarity-tag">#${mon.id} · ${mon.rarity}</div>${seen?`<button type="button" class="dex-buddy-btn ${state.buddyId===mon.id?"is-buddy":""}" data-buddy="${mon.id}">${state.buddyId===mon.id?"🐾 Buddy":"Set Buddy"}</button>`:""}</div>`;
  }).join("") : `<p class="empty-note">No species match that filter.</p>`;
}
function renderAchievements(){
  els.achievements.innerHTML = ACHIEVEMENTS.map(a=>{
    const un = state.achievements.includes(a.id);
    return `<li class="${un?"unlocked":""}"><span class="ach-icon">${a.icon}</span><span><b>${a.name}</b><small>${a.desc}</small></span></li>`;
  }).join("");
}
function checkAchievements(){
  for (const a of ACHIEVEMENTS){
    if (!state.achievements.includes(a.id) && a.test(state)){
      state.achievements.push(a.id);
      toast(`🏆 Achievement unlocked: <b>${a.name}</b>`);
      renderAchievements();
    }
  }
}
let newsTimer = null;
function setNews(text){ els.news.textContent = text; restartNewsTimer(); }
function rotateNews(){ els.news.textContent = NEWS[Math.floor(Math.random()*NEWS.length)]; }
function restartNewsTimer(){ clearInterval(newsTimer); newsTimer = setInterval(rotateNews, 15000); }

/* ---------- Mystery Egg ---------- */
function renderEgg(){
  const card = $("egg-card"); if (!card) return;
  card.classList.toggle("hidden", !state.egg);
  if (!state.egg) return;
  $("egg-bar").style.width = Math.min(100, state.egg.progress/state.egg.target*100) + "%";
  $("egg-label").textContent = `${state.egg.progress} / ${state.egg.target} clicks — it wobbles more as it warms…`;
  card.classList.toggle("warm", state.egg.progress/state.egg.target > 0.7);
}
function hatchEgg(){
  const eggRef = state.egg;
  const mon = (eggRef && eggRef.speciesId && WILD_POKEMON.find(m=>m.id===eggRef.speciesId)) || pickWild();
  const shiny = Math.random() < SHINY_CHANCE * (eggRef && eggRef.bred ? 4 : 1);
  state.egg = null; state.eggsHatched++;
  if (eggRef && eggRef.bred){ state.bredDex[mon.id] = true; }
  const isNew = !state.pokedex[mon.id];
  state.pokedex[mon.id] = (state.pokedex[mon.id]||0) + 1;
  if (shiny){ state.shinyDex[mon.id] = true; state.shinies++; }
  if (mon.rarity === "legendary") state.legendaryCaught++;
  state.totalCaught++;
  const bonus = shiny ? 5 : 1; state.bonusPct += bonus;
  toast(`🐣 The egg hatched into <b>${shiny?"✨ ":""}${mon.name}</b>! (+${bonus}% DPS)`);
  setNews(`Mystery Egg hatches live on the PokéMart floor — it's a ${mon.name}! Crowds go wild.`);
  jingle([523,659,784,1047,1319]);
  renderEgg(); renderPokedex(); renderBuddy(); checkAchievements(); saveGame();
}

/* ---------- Research Tasks (daily quests) ---------- */
const QUEST_DEFS = [
  { type:"clicks",   label:"Click the Pokéball {t} times",      target:()=>[200,350,500][Math.floor(Math.random()*3)], counter:()=>state.totalClicks },
  { type:"catches",  label:"Catch {t} Pokémon",                 target:()=>2,                                          counter:()=>state.totalCaught },
  { type:"throws",   label:"Throw {t} balls in encounters",     target:()=>5,                                          counter:()=>state.throws },
  { type:"excellent",label:"Land {t} Excellent throws",         target:()=>2,                                          counter:()=>state.excellentThrows },
  { type:"buildings",label:"Own {t} buildings (total)",         target:()=>[10,25,50][Math.floor(Math.random()*3)],    counter:()=>totalBuildings() },
  { type:"golden",   label:"Click {t} Golden Magikarp",         target:()=>1,                                          counter:()=>state.goldenCaught },
];
function ensureQuests(){
  const today = new Date().toDateString();
  if (state.questDay === today && state.quests.length) return;
  const defs = [...QUEST_DEFS].sort(()=>Math.random()-0.5).slice(0,3);
  state.quests = defs.map(d=>{
    const t = d.target();
    return { type:d.type, label:d.label.replace("{t}", t), target:t, start:d.counter(),
             rewardMoney:Math.max(100, Math.round(getDPS()*60 + 250)), rewardBerry:(state.questsDone%2===0)?1:0, claimed:false };
  });
  state.questDay = today;
}
function questProgress(q){
  const def = QUEST_DEFS.find(d=>d.type===q.type);
  return def ? Math.min(q.target, Math.max(0, def.counter() - q.start)) : 0;
}
function renderQuests(){
  ensureQuests();
  els.questList.innerHTML = state.quests.map((q,i)=>{
    const prog = questProgress(q), done = prog >= q.target;
    return `<div class="quest ${done&&!q.claimed?"done":""}">
      <div class="quest-head"><b>${q.label}</b><span class="quest-reward">${fmtMoney(q.rewardMoney)}${q.rewardBerry?" + 🍓":""}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${prog/q.target*100}%"></div></div>
      <span class="quest-progress-label">${formatNumber(prog)} / ${formatNumber(q.target)}${q.claimed?" · ✔ claimed":""}</span>
      ${done&&!q.claimed?`<button type="button" class="btn btn-prestige quest-claim" data-claim="${i}">Claim reward!</button>`:""}
    </div>`;
  }).join("");
}
els.questList.addEventListener("click", e=>{
  const btn = e.target.closest("[data-claim]"); if (!btn) return;
  const q = state.quests[Number(btn.dataset.claim)];
  if (!q || q.claimed || questProgress(q) < q.target) return;
  q.claimed = true; state.questsDone++;
  earn(q.rewardMoney); if (q.rewardBerry) state.items.berry++;
  toast(`🔬 Task complete! +<b>${fmtMoney(q.rewardMoney)}</b>${q.rewardBerry?" + 🍓 Razz Berry":""}`);
  jingle([659,784,988]);
  renderQuests(); checkAchievements(); refreshAll(); saveGame();
});

/* ---------- Buddy Pokémon ---------- */
function renderBuddy(){
  if (!state.buddyId || !state.pokedex[state.buddyId]){
    els.buddyDisplay.innerHTML = `<span class="buddy-empty">No Buddy yet — catch a Pokémon, then pick one from your Pokédex! Your Buddy boosts click power and sniffs out berries. 🐾</span>`;
    return;
  }
  const mon = WILD_POKEMON.find(m=>m.id===state.buddyId), count = state.pokedex[mon.id]||1, shiny = !!state.shinyDex[mon.id];
  els.buddyDisplay.innerHTML = `${imgTag(ANIM_SPRITE(mon.id, shiny),"🐾",mon.name)}
    <span><span class="buddy-name">${shiny?"✨ ":""}${mon.name}</span> <span class="buddy-sub">Lv.${count} Buddy</span><br>
    <span class="buddy-sub">Click power +${Math.round(buddyBonus()*100)}% · finds a 🍓 every 200 clicks · duplicates level it up!</span></span>`;
}
function setBuddy(id){
  state.buddyId = id;
  const mon = WILD_POKEMON.find(m=>m.id===id);
  toast(`🐾 <b>${mon?mon.name:"Pokémon"}</b> is now your Buddy! (+${Math.round(buddyBonus()*100)}% click power)`);
  tone(988,.15,"triangle",0,.06);
  renderBuddy(); renderPokedex(); checkAchievements(); refreshHUD(); saveGame();
}
els.pokedex.addEventListener("click", e=>{
  const btn = e.target.closest("[data-buddy]"); if (btn) setBuddy(Number(btn.dataset.buddy));
});

/* ---------- Settings & themes ---------- */
function applySettings(){
  document.body.dataset.theme = state.settings.theme || "kanto";
  document.body.classList.toggle("reduce-motion", !!state.settings.reduceMotion);
  syncMuteBtn(); syncSettingsUI();
}
function buildSettings(){
  $("theme-grid").innerHTML = THEMES.map(t=>`
    <button type="button" class="theme-choice ${state.settings.theme===t.id?"active":""}" data-theme-choice="${t.id}">
      ${imgTag(ANIM_SPRITE(t.icon),"🎨",t.name)}${t.name}<span class="swatch" style="background:${t.swatch}"></span>
    </button>`).join("");
}
function syncSettingsUI(){
  const set = (id,val)=>{ const el=$(id); if (el) el.checked = !!val; };
  set("set-sound", !state.muted); set("set-particles", state.settings.particles);
  set("set-shake", state.settings.shake); set("set-floattext", state.settings.floatText);
  set("set-reduce-motion", state.settings.reduceMotion);
  document.querySelectorAll("[data-notation]").forEach(b=>b.classList.toggle("active", state.settings.notation===b.dataset.notation));
  document.querySelectorAll("[data-events]").forEach(b=>b.classList.toggle("active", (state.settings.eventFreq||"chill")===b.dataset.events));
  document.querySelectorAll("[data-theme-choice]").forEach(b=>b.classList.toggle("active", state.settings.theme===b.dataset.themeChoice));
}
$("btn-settings").addEventListener("click", ()=>{ buildSettings(); syncSettingsUI(); els.settingsModal.classList.remove("hidden"); });
$("btn-close-settings").addEventListener("click", ()=>els.settingsModal.classList.add("hidden"));
els.settingsModal.addEventListener("click", e=>{ if (e.target===els.settingsModal) els.settingsModal.classList.add("hidden"); });
$("theme-grid").addEventListener("click", e=>{
  const btn = e.target.closest("[data-theme-choice]"); if (!btn) return;
  state.settings.theme = btn.dataset.themeChoice;
  const t = THEMES.find(x=>x.id===state.settings.theme);
  toast(`🎨 Theme set to <b>${t?t.name:""}</b>!`);
  applySettings(); saveGame();
});
document.querySelectorAll("[data-notation]").forEach(b=>b.addEventListener("click", ()=>{
  state.settings.notation = b.dataset.notation; syncSettingsUI(); refreshAll(); saveGame();
}));
[["set-sound",v=>{ state.muted = !v; }],["set-particles",v=>{ state.settings.particles=v; }],
 ["set-shake",v=>{ state.settings.shake=v; }],["set-floattext",v=>{ state.settings.floatText=v; }],
 ["set-reduce-motion",v=>{ state.settings.reduceMotion=v; applySettings(); }]].forEach(([id,fn])=>{
  $(id).addEventListener("change", e=>{ fn(e.target.checked); syncMuteBtn(); refreshAll(); saveGame(); });
});

/* ---------- Regions ---------- */
function buildRegions(){
  $("region-list").innerHTML = REGIONS.map(r=>`
    <button type="button" class="region-btn" data-region="${r.id}" style="background:linear-gradient(160deg, ${ {Kanto:"#43a047",forest:"#2e7d32",cave:"#5e35b1",safari:"#c08a2d",ocean:"#0288d1",victory:"#b71c3f",johto:"#8e6e00",lake:"#c62828",den:"#4a148c"}[r.id] }, #2228)">${r.icon} ${r.name}</button>`).join("");
  $("region-list").addEventListener("click", e=>{
    const btn = e.target.closest("[data-region]"); if (!btn || btn.disabled) return;
    state.region = btn.dataset.region;
    const r = REGIONS.find(x=>x.id===state.region);
    toast(`🗺️ Travelling to <b>${r.name}</b>! ${r.desc}`);
    jingle([392,523,659]);
    updateRegions(); saveGame();
  });
  updateRegions();
}
function updateRegions(){
  document.querySelectorAll("[data-region]").forEach(btn=>{
    const r = REGIONS.find(x=>x.id===btn.dataset.region); if (!r) return;
    const unlocked = state.lifetime >= r.unlock;
    btn.disabled = !unlocked;
    btn.classList.toggle("active", state.region === r.id);
    btn.title = unlocked ? r.desc : `Unlocks at ${fmtMoney(r.unlock)} lifetime earned`;
    btn.textContent = unlocked ? `${r.icon} ${r.name}` : `🔒 ${r.name}`;
  });
  const cur = REGIONS.find(x=>x.id===state.region) || REGIONS[0];
  const el = $("region-desc"); if (el) el.textContent = `${cur.icon} ${cur.name}: ${cur.desc}`;
}

/* ---------- Gym Leader battles ---------- */
let battleBusy = false;
function buildGymList(){
  $("gym-list").innerHTML = GYM_LEADERS.map(l=>`
    <div class="gym-row" id="gym-${l.id}">
      ${imgTag(ANIM_SPRITE(l.ace), "🥊", l.aceName)}
      <span><h4>${l.name} <small>· ${l.title}</small></h4><p class="sub">Ace: ${l.aceName} · Party power needed ≈ ${formatNumber(l.power)} · Win: ${fmtMoney(l.reward)}</p></span>
      <button type="button" class="btn btn-throw" data-leader="${l.id}">Battle!</button>
    </div>`).join("");
  $("gym-list").addEventListener("click", e=>{
    const btn = e.target.closest("[data-leader]"); if (btn && !btn.disabled) startBattle(btn.dataset.leader);
  });
  refreshGym();
}
function refreshGym(){
  const pp = $("party-power"); if (pp) pp.textContent = formatNumber(partyPower());
  const cooling = Date.now() < state.battleCooldownUntil, hasMon = state.totalCaught > 0;
  GYM_LEADERS.forEach(l=>{
    const row = $(`gym-${l.id}`); if (!row) return;
    row.classList.toggle("defeated", !!state.leadersDefeated[l.id]);
    const btn = row.querySelector("[data-leader]");
    btn.disabled = battleBusy || cooling || !hasMon;
    btn.textContent = state.leadersDefeated[l.id] ? "Rematch" : "Battle!";
  });
}
/* ================= FULL TURN-BASED BATTLES =================
   Choose moves, type matchups, STAB, crits, accuracy, status,
   stat stages, priority, potions and switching — the works. */
const TYPE_LIST = ["Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"];
const TYPE_CHART = { // attacking -> defending multipliers (unlisted = 1)
  Fire:{Grass:2,Ice:2,Bug:2,Steel:2,Fire:.5,Water:.5,Rock:.5,Dragon:.5}, Water:{Fire:2,Ground:2,Rock:2,Water:.5,Grass:.5,Dragon:.5},
  Electric:{Water:2,Flying:2,Electric:.5,Grass:.5,Dragon:.5,Ground:0}, Grass:{Water:2,Ground:2,Rock:2,Fire:.5,Grass:.5,Poison:.5,Flying:.5,Bug:.5,Dragon:.5,Steel:.5},
  Ice:{Grass:2,Ground:2,Flying:2,Dragon:2,Fire:.5,Water:.5,Ice:.5,Steel:.5}, Fighting:{Normal:2,Ice:2,Rock:2,Dark:2,Steel:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Fairy:.5,Ghost:0},
  Poison:{Grass:2,Fairy:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0}, Ground:{Fire:2,Electric:2,Poison:2,Rock:2,Steel:2,Grass:.5,Bug:.5,Flying:0},
  Flying:{Grass:2,Fighting:2,Bug:2,Electric:.5,Rock:.5,Steel:.5}, Psychic:{Fighting:2,Poison:2,Psychic:.5,Steel:.5,Dark:0},
  Bug:{Grass:2,Psychic:2,Dark:2,Fire:.5,Fighting:.5,Poison:.5,Flying:.5,Ghost:.5,Steel:.5,Fairy:.5}, Rock:{Fire:2,Ice:2,Flying:2,Bug:2,Fighting:.5,Ground:.5,Steel:.5},
  Ghost:{Psychic:2,Ghost:2,Dark:.5,Normal:0}, Dragon:{Dragon:2,Steel:.5,Fairy:0}, Dark:{Psychic:2,Ghost:2,Fighting:.5,Dark:.5,Fairy:.5},
  Steel:{Ice:2,Rock:2,Fairy:2,Fire:.5,Water:.5,Electric:.5,Steel:.5}, Fairy:{Fighting:2,Dragon:2,Dark:2,Fire:.5,Poison:.5,Steel:.5},
  Normal:{Rock:.5,Steel:.5,Ghost:0},
};
const typeEff = (moveType, defTypes) => defTypes.reduce((m,t)=> m * ((TYPE_CHART[moveType]||{})[t] ?? 1), 1);
/* curated types for iconic species; others get a deterministic type so every species can battle */
const CURATED_TYPES = {1:["Grass","Poison"],2:["Grass","Poison"],3:["Grass","Poison"],4:["Fire"],5:["Fire"],6:["Fire","Flying"],7:["Water"],8:["Water"],9:["Water"],10:["Bug"],12:["Bug","Flying"],13:["Bug","Poison"],15:["Bug","Poison"],16:["Normal","Flying"],18:["Normal","Flying"],19:["Normal"],21:["Normal","Flying"],25:["Electric"],26:["Electric"],27:["Ground"],35:["Fairy"],37:["Fire"],38:["Fire"],39:["Normal","Fairy"],41:["Poison","Flying"],43:["Grass","Poison"],45:["Grass","Poison"],52:["Normal"],54:["Water"],55:["Water"],58:["Fire"],59:["Fire"],60:["Water"],62:["Water","Fighting"],63:["Psychic"],65:["Psychic"],66:["Fighting"],68:["Fighting"],69:["Grass","Poison"],71:["Grass","Poison"],72:["Water","Poison"],74:["Rock","Ground"],76:["Rock","Ground"],77:["Fire"],78:["Fire"],83:["Normal","Flying"],84:["Normal","Flying"],86:["Water"],87:["Water","Ice"],90:["Water"],91:["Water","Ice"],92:["Ghost","Poison"],94:["Ghost","Poison"],95:["Rock","Ground"],98:["Water"],100:["Electric"],101:["Electric"],102:["Grass","Psychic"],104:["Ground"],107:["Fighting"],108:["Normal"],109:["Poison"],110:["Poison"],111:["Ground","Rock"],112:["Ground","Rock"],113:["Normal"],114:["Grass"],115:["Normal"],116:["Water"],117:["Water"],118:["Water"],120:["Water"],121:["Water","Psychic"],122:["Psychic","Fairy"],123:["Bug","Flying"],124:["Ice","Psychic"],125:["Electric"],126:["Fire"],127:["Bug"],128:["Normal"],129:["Water"],130:["Water","Flying"],131:["Water","Ice"],132:["Normal"],133:["Normal"],134:["Water"],135:["Electric"],136:["Fire"],137:["Normal"],142:["Rock","Flying"],143:["Normal"],144:["Ice","Flying"],145:["Electric","Flying"],146:["Fire","Flying"],147:["Dragon"],149:["Dragon","Flying"],150:["Psychic"],151:["Psychic"],152:["Grass"],155:["Fire"],158:["Water"],160:["Water"],169:["Poison","Flying"],172:["Electric"],181:["Electric"],182:["Grass"],196:["Psychic"],197:["Dark"],198:["Dark","Flying"],208:["Steel","Ground"],212:["Bug","Steel"],214:["Bug","Fighting"],229:["Dark","Fire"],230:["Water","Dragon"],241:["Normal"],242:["Normal"],243:["Electric"],244:["Fire"],245:["Water"],246:["Rock","Ground"],248:["Rock","Dark"],249:["Psychic","Flying"],250:["Fire","Flying"],251:["Psychic","Grass"]};
function speciesTypes(mon){
  if (CURATED_TYPES[mon.id]) return CURATED_TYPES[mon.id];
  const t = TYPE_LIST[mon.id % TYPE_LIST.length];
  return t === "Normal" ? ["Normal"] : [t];
}
function mv(name, type, power, acc=100, opts={}){ return { name, type, power, acc, cat:opts.cat||(power>0?"phys":"status"), priority:opts.priority||0, status:opts.status||null, stage:opts.stage||null, chance:opts.chance??1 }; }
const TYPE_MOVES = {
  Normal:[mv("Body Slam","Normal",85,100,{status:"paralysis",chance:.3}), mv("Quick Attack","Normal",40,100,{priority:1}), mv("Swords Dance","Normal",0,100,{stage:["atk",2],cat:"status"})],
  Fire:[mv("Flamethrower","Fire",90,100,{cat:"spec",status:"burn",chance:.1}), mv("Fire Fang","Fire",65,95,{status:"burn",chance:.1}), mv("Will-O-Wisp","Fire",0,85,{status:"burn",cat:"status"})],
  Water:[mv("Surf","Water",90,100,{cat:"spec"}), mv("Aqua Tail","Water",90,90), mv("Aqua Ring","Water",0,100,{stage:["def",1],cat:"status"})],
  Electric:[mv("Thunderbolt","Electric",90,100,{cat:"spec",status:"paralysis",chance:.1}), mv("Spark","Electric",65,100,{status:"paralysis",chance:.3}), mv("Thunder Wave","Electric",0,90,{status:"paralysis",cat:"status"})],
  Grass:[mv("Giga Drain","Grass",75,100,{cat:"spec"}), mv("Razor Leaf","Grass",55,95), mv("Sleep Powder","Grass",0,75,{status:"paralysis",cat:"status"})],
  Ice:[mv("Ice Beam","Ice",90,100,{cat:"spec"}), mv("Ice Fang","Ice",65,95), mv("Hail Armor","Ice",0,100,{stage:["def",1],cat:"status"})],
  Fighting:[mv("Close Combat","Fighting",120,100), mv("Karate Chop","Fighting",50,100), mv("Bulk Up","Fighting",0,100,{stage:["atk",1],cat:"status"})],
  Poison:[mv("Sludge Bomb","Poison",90,100,{cat:"spec",status:"poison",chance:.3}), mv("Poison Fang","Poison",50,100,{status:"poison",chance:.5}), mv("Toxic","Poison",0,90,{status:"poison",cat:"status"})],
  Ground:[mv("Earthquake","Ground",100,100), mv("Mud Shot","Ground",55,95,{cat:"spec"}), mv("Sand Attack","Ground",0,100,{stage:["acc",-1],cat:"status"})],
  Flying:[mv("Air Slash","Flying",75,95,{cat:"spec"}), mv("Wing Attack","Flying",60,100), mv("Roost","Flying",0,100,{stage:["def",1],cat:"status"})],
  Psychic:[mv("Psychic","Psychic",90,100,{cat:"spec"}), mv("Zen Headbutt","Psychic",80,90), mv("Calm Mind","Psychic",0,100,{stage:["atk",1],cat:"status"})],
  Bug:[mv("X-Scissor","Bug",80,100), mv("Bug Buzz","Bug",90,100,{cat:"spec"}), mv("String Shot","Bug",0,95,{stage:["spd",-1],cat:"status"})],
  Rock:[mv("Rock Slide","Rock",75,90), mv("Stone Edge","Rock",100,80), mv("Rock Polish","Rock",0,100,{stage:["spd",2],cat:"status"})],
  Ghost:[mv("Shadow Ball","Ghost",80,100,{cat:"spec"}), mv("Shadow Claw","Ghost",70,100), mv("Curse","Ghost",0,100,{stage:["atk",1],cat:"status"})],
  Dragon:[mv("Dragon Claw","Dragon",80,100), mv("Dragon Pulse","Dragon",85,100,{cat:"spec"}), mv("Dragon Dance","Dragon",0,100,{stage:["atk",1],cat:"status"})],
  Dark:[mv("Crunch","Dark",80,100), mv("Night Slash","Dark",70,100), mv("Nasty Plot","Dark",0,100,{stage:["atk",2],cat:"status"})],
  Steel:[mv("Iron Head","Steel",80,100), mv("Flash Cannon","Steel",80,100,{cat:"spec"}), mv("Iron Defense","Steel",0,100,{stage:["def",2],cat:"status"})],
  Fairy:[mv("Moonblast","Fairy",95,100,{cat:"spec"}), mv("Play Rough","Fairy",90,90), mv("Charm","Fairy",0,100,{stage:["atkE",-1],cat:"status"})],
};
const GENERIC_MOVES = [mv("Tackle","Normal",40,100), mv("Bite","Dark",60,100), mv("Growl","Normal",0,100,{stage:["atkE",-1],cat:"status"})];
function movesFor(mon){
  const types = speciesTypes(mon), out = [];
  for (const t of types){ const pool = TYPE_MOVES[t]||[]; if (pool[0]) out.push(pool[0]); if (pool[1]) out.push(pool[1]); }
  if (types[0] && TYPE_MOVES[types[0]] && TYPE_MOVES[types[0]][2]) out.push(TYPE_MOVES[types[0]][2]);
  for (const g of GENERIC_MOVES) if (out.length < 4) out.push(g);
  return [...new Map(out.map(m=>[m.name,m])).values()].slice(0,4);
}
const BASE_STATS = { common:{hp:58,atk:52,def:50,spd:50}, uncommon:{hp:72,atk:68,def:64,spd:66}, rare:{hp:92,atk:92,def:86,spd:88}, legendary:{hp:120,atk:118,def:110,spd:112} };
function makeFighter(mon, level, count=1){
  const base = BASE_STATS[mon.rarity] || BASE_STATS.common;
  const stat = v => Math.floor(v * (1 + level*0.11)) + level + 4;
  const maxHp = Math.floor(base.hp * (1 + level*0.13)) + level*3 + 18;
  return { id:mon.id, name:mon.name, mon, level, count, types:speciesTypes(mon), moves:movesFor(mon),
    maxHp, hp:maxHp, atk:stat(base.atk), def:stat(base.def), spd:stat(base.spd) * (mon.id%7+8)/10,
    status:null, stages:{atk:0,def:0,spd:0,acc:0}, shiny:!!state.shinyDex[mon.id] };
}
const LEADER_TEAMS = {
  brock:[[74,10],[95,13],[76,12]], misty:[[120,17],[55,19],[121,20]], surge:[[100,24],[25,26],[26,28]],
  erika:[[71,31],[114,33],[45,34]], koga:[[109,38],[89,40],[110,42]], sabrina:[[64,45],[122,47],[65,49]],
  blaine:[[58,52],[78,54],[59,56]], giovanni:[[111,60],[53,62],[112,65]],
};
let battle = null, battleSeq = 0;
const stageMult = f => Math.max(0.25, 1 + (f.stages.atk||0)*0.5);
function battleLog(html){ $("vs-log").innerHTML = html; }
function fighterById(id){ return WILD_POKEMON.find(m=>m.id===id) || WILD_POKEMON[0]; }
function renderBattle(){
  if (!battle) return;
  const P = battle.player[battle.pActive], E = battle.enemy[battle.eActive];
  const pS = $("vs-player-sprite"), eS = $("vs-enemy-sprite");
  if (P){ pS.src = ANIM_SPRITE(P.id, P.shiny); pS.onerror=()=>{pS.onerror=null;pS.src=SPRITE_POKEMON(P.id);}; $("vs-player-name").textContent = `${P.shiny?"✨ ":""}${P.name} Lv.${P.level}${P.status?" · "+P.status.toUpperCase():""}`; $("hp-player").style.width = Math.max(0,P.hp/P.maxHp*100)+"%"; }
  if (E){ eS.src = ANIM_SPRITE(E.id, false); eS.onerror=()=>{eS.onerror=null;eS.src=SPRITE_POKEMON(E.id);}; $("vs-enemy-name").textContent = `${battle.leader.name}'s ${E.name} Lv.${E.level}${E.status?" · "+E.status.toUpperCase():""}`; $("hp-enemy").style.width = Math.max(0,E.hp/E.maxHp*100)+"%"; }
  $("vs-status").innerHTML = `<span>Your team: ${battle.player.map((f,i)=>`<span class="${f.hp<=0?"fainted-dot":""}">${i===battle.pActive?"▶":""}${f.name} ${Math.max(0,Math.ceil(f.hp))}/${f.maxHp}</span>`).join(" · ")}</span><br><span>${battle.leader.name}: ${battle.enemy.map((f,i)=>`<span class="${f.hp<=0?"fainted-dot":""}">${i===battle.eActive?"▶":""}${f.name} ${Math.max(0,Math.ceil(f.hp))}/${f.maxHp}</span>`).join(" · ")}</span>`;
  const mg = $("move-grid");
  if (battle.over || battle.busy || !P || P.hp<=0){ mg.innerHTML = ""; }
  else mg.innerHTML = P.moves.map((m,i)=>`<button type="button" class="move-btn type-${m.type.toLowerCase()}" data-move="${i}"><b>${m.name}</b><small>${m.type} · ${m.power?("Pow "+m.power):"Status"} · Acc ${m.acc}</small></button>`).join("");
  $("btn-potion").disabled = battle.over || battle.busy || battle.potions<=0 || !P || P.hp<=0 || P.hp>=P.maxHp;
  $("btn-potion").textContent = `🧪 Potion (×${battle.potions})`;
  $("btn-switch").disabled = battle.over || battle.busy;
  const sr = $("switch-row");
  if (battle.showSwitch && !battle.over){
    sr.classList.remove("hidden");
    sr.innerHTML = battle.player.map((f,i)=>`<button type="button" class="ball-choice" data-switch="${i}" ${f.hp<=0||i===battle.pActive?"disabled":""}>${f.name} Lv.${f.level} · ${Math.max(0,Math.ceil(f.hp))} HP</button>`).join("");
  } else sr.classList.add("hidden");
}
async function execMove(attacker, defender, move, seq, isPlayer){
  if (!battle || battle.seq !== seq) return;
  const sprite = isPlayer ? $("vs-player-sprite") : $("vs-enemy-sprite");
  const foeSprite = isPlayer ? $("vs-enemy-sprite") : $("vs-player-sprite");
  if (attacker.status === "paralysis" && Math.random() < 0.25){ battleLog(`⚡ <b>${attacker.name}</b> is paralysed and can't move!`); await wait(650); return; }
  if (Math.random()*100 > move.acc * (attacker.stages.acc<0 ? 0.7 : 1)){ battleLog(`<b>${attacker.name}</b> used ${move.name} — it missed!`); tone(200,.1,"sine",0,.03); await wait(650); return; }
  sprite.classList.add(isPlayer ? "lunge-r" : "lunge-l");
  tone(isPlayer?240:170,.12,"square",0,.05);
  await wait(240); if (!battle || battle.seq !== seq) return;
  sprite.classList.remove("lunge-r","lunge-l");
  if (move.power > 0){
    const eff = typeEff(move.type, defender.types);
    const stab = attacker.types.includes(move.type) ? 1.2 : 1;
    const burnCut = attacker.status === "burn" && move.cat === "phys" ? 0.5 : 1;
    const crit = Math.random() < 0.0625;
    const atkStat = attacker.atk * stageMult(attacker) * (move.cat==="spec" ? 1.05 : 1);
    const dmg = Math.max(1, Math.floor((((2*attacker.level/5 + 2) * move.power * atkStat / Math.max(1,defender.def)) / 50) + 2) * stab * eff * burnCut * (crit?1.5:1) * (0.85 + Math.random()*0.15));
    defender.hp -= dmg;
    const effText = eff === 0 ? " It had no effect!" : eff > 1 ? " <b>It's super effective!</b>" : eff < 1 ? " It's not very effective…" : "";
    battleLog(`<b>${attacker.name}</b> used <b>${move.name}</b> — ${formatNumber(dmg)} damage!${crit?" <b>A critical hit!</b>":""}${effText}`);
    if (move.status && defender.hp > 0 && !defender.status && Math.random() < (move.chance??1)){ defender.status = move.status; battleLog(`<b>${attacker.name}</b> used <b>${move.name}</b> — ${formatNumber(dmg)} damage! <b>${defender.name}</b> was afflicted with ${move.status}!`); }
  } else {
    if (move.stage){
      const [stat, delta] = move.stage;
      if (stat === "atkE"){ defender.stages.atk = Math.max(-3, defender.stages.atk + delta); battleLog(`<b>${attacker.name}</b> used <b>${move.name}</b> — ${defender.name}'s Attack fell!`); }
      else { attacker.stages[stat] = Math.min(3, (attacker.stages[stat]||0) + delta); battleLog(`<b>${attacker.name}</b> used <b>${move.name}</b> — its ${stat.toUpperCase()} rose!`); }
    } else battleLog(`<b>${attacker.name}</b> used <b>${move.name}</b>!`);
    tone(660,.12,"triangle",0,.04);
  }
  renderBattle();
  await wait(700);
}
function applyStatusDamage(f, seq){
  if (!f || f.hp<=0 || !f.status || (f.status !== "burn" && f.status !== "poison")) return false;
  const dmg = Math.max(1, Math.floor(f.maxHp/8));
  f.hp -= dmg;
  battleLog(`<b>${f.name}</b> is hurt by its ${f.status}! (-${dmg} HP)`);
  return true;
}
async function endTurnChecks(seq){
  if (!battle || battle.seq !== seq) return true;
  const P = battle.player[battle.pActive], E = battle.enemy[battle.eActive];
  if (P && P.hp > 0 && applyStatusDamage(P, seq)){ renderBattle(); await wait(500); }
  if (E && E.hp > 0 && battle && applyStatusDamage(E, seq)){ renderBattle(); await wait(500); }
  return await handleFaints(seq);
}
async function handleFaints(seq){
  if (!battle || battle.seq !== seq) return true;
  const P = battle.player[battle.pActive], E = battle.enemy[battle.eActive];
  if (E && E.hp <= 0){
    $("vs-enemy-sprite").classList.add("fainted");
    battleLog(`💫 Enemy <b>${E.name}</b> fainted!`);
    await wait(800); if (!battle || battle.seq !== seq) return true;
    const next = battle.enemy.findIndex(f=>f.hp>0);
    if (next === -1){ await finishBattle(true, seq); return true; }
    battle.eActive = next;
    $("vs-enemy-sprite").classList.remove("fainted");
    battleLog(`${battle.leader.name} sent out <b>${battle.enemy[next].name}</b>!`);
    renderBattle(); await wait(650);
  }
  if (P && P.hp <= 0){
    $("vs-player-sprite").classList.add("fainted");
    battleLog(`💫 Your <b>${P.name}</b> fainted! Choose your next Pokémon!`);
    if (!battle.player.some(f=>f.hp>0)){ await finishBattle(false, seq); return true; }
    battle.showSwitch = true; battle.busy = false; renderBattle();
    return true;
  }
  return false;
}
async function enemyTurn(seq){
  if (!battle || battle.seq !== seq || battle.over) return;
  const P = battle.player[battle.pActive], E = battle.enemy[battle.eActive];
  if (!P || !E || P.hp<=0 || E.hp<=0) return;
  const scored = E.moves.map(m=>({ m, score: m.power * typeEff(m.type, P.types) * (m.power?1:0.35) * Math.random() }));
  scored.sort((a,b)=>b.score-a.score);
  await execMove(E, P, scored[0].m, seq, false);
  await endTurnChecks(seq);
}
async function playerUseMove(moveIndex){
  if (!battle || battle.busy || battle.over) return;
  const seq = battle.seq, P = battle.player[battle.pActive], E = battle.enemy[battle.eActive];
  if (!P || P.hp<=0) return;
  const move = P.moves[moveIndex]; if (!move) return;
  battle.busy = true; battle.showSwitch = false; renderBattle();
  const playerFirst = move.priority > 0 || P.spd >= E.spd;
  if (playerFirst){
    await execMove(P, E, move, seq, true);
    if (await endTurnChecks(seq)) { if (battle && !battle.over && battle.player[battle.pActive].hp>0){ battle.busy=false; renderBattle(); } return; }
    await enemyTurn(seq);
  } else {
    await enemyTurn(seq);
    if (!battle || battle.over) { return; }
    if (battle.player[battle.pActive].hp > 0 && battle.enemy[battle.eActive].hp > 0){
      await execMove(battle.player[battle.pActive], battle.enemy[battle.eActive], move, seq, true);
      await endTurnChecks(seq);
    }
  }
  if (battle && !battle.over && battle.player[battle.pActive] && battle.player[battle.pActive].hp>0){ battle.busy = false; renderBattle(); }
}
async function finishBattle(won, seq){
  if (!battle || battle.seq !== seq) return;
  battle.over = true; battle.busy = false;
  const leader = battle.leader;
  state.battleCooldownUntil = Date.now() + 30000;
  if (won){
    const first = !state.leadersDefeated[leader.id];
    if (first) state.leadersDefeated[leader.id] = true;
    state.leaderWins++;
    if (state.mode === "nuzlocke") state.nuzWins++;
    const reward = Math.round(leader.reward * (first ? 1 : 0.3) * (1 + state.badges*0.1));
    earn(reward);
    battleLog(`🏆 <b>You defeated ${leader.name}!</b> +${fmtMoney(reward)}${first ? " · First win: permanent <b>+2% all earnings</b>!" : ""}`);
    toast(`🏆 Defeated <b>${leader.name}</b>! +${fmtMoney(reward)}${first ? " (+2% forever)" : ""}`);
    jingle([523,659,784,1047]);
    setNews(`Unknown challenger stuns Gym Leader ${leader.name} in a full six-on-six thriller!`);
  } else {
    battleLog(`💫 <b>Your team was wiped out!</b> ${leader.name}: "Train up and come back, kid." (30s cooldown)`);
    jingle([392,330,262,196]);
    if (state.mode === "nuzlocke"){
      const owned = Object.entries(state.pokedex).filter(([,c])=>c>0);
      if (owned.length){
        const [lostId] = owned[Math.floor(Math.random()*owned.length)];
        const lost = WILD_POKEMON.find(m=>m.id===Number(lostId));
        state.pokedex[lostId]--;
        if (state.pokedex[lostId] <= 0){ delete state.pokedex[lostId]; if (state.buddyId===Number(lostId)) state.buddyId = null; }
        state.bonusPct = Math.max(0, state.bonusPct - 1);
        battleLog(`💫 Your team was wiped out!<br>💀 <b>Nuzlocke:</b> a ${lost?lost.name:"Pokémon"} was lost… (-1% collection bonus)`);
        renderPokedex(); renderBuddy();
      }
    }
  }
  $("btn-close-battle").classList.remove("hidden");
  $("move-grid").innerHTML = ""; $("switch-row").classList.add("hidden");
  checkAchievements(); refreshAll(); refreshGym(); saveGame();
}
async function startBattle(leaderId){
  const leader = GYM_LEADERS.find(l=>l.id===leaderId);
  if (!leader || battleBusy || Date.now() < state.battleCooldownUntil || state.totalCaught <= 0) return;
  battleBusy = true;
  const entries = Object.entries(state.pokedex).map(([id,count])=>({ mon:WILD_POKEMON.find(m=>m.id===Number(id)), count })).filter(x=>x.mon);
  entries.sort((a,b)=>(RARITY_POWER[b.mon.rarity]*b.count) - (RARITY_POWER[a.mon.rarity]*a.count));
  const teamEntries = entries.slice(0,6);
  if (state.buddyId){ const bi = teamEntries.findIndex(x=>x.mon.id===state.buddyId); if (bi > 0){ const [b] = teamEntries.splice(bi,1); teamEntries.unshift(b); } }
  const player = teamEntries.map(x=>makeFighter(x.mon, 10 + x.count*2 + Math.min(40, Math.floor(trainerLevel()/2)), x.count));
  const enemy = (LEADER_TEAMS[leader.id]||[[leader.ace,20]]).map(([id,level])=>makeFighter(fighterById(id), level));
  battle = { leader, player, enemy, pActive:0, eActive:0, potions:2, busy:false, over:false, showSwitch:false, seq:++battleSeq };
  $("vs-player-name").textContent = ""; $("vs-enemy-name").textContent = "";
  $("gym-battle-title").textContent = `⚔️ You vs ${leader.name}, ${leader.title}!`;
  $("btn-close-battle").classList.add("hidden");
  $("battle-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("vs-player-sprite").classList.remove("fainted"); $("vs-enemy-sprite").classList.remove("fainted");
  battleLog(`${leader.name}: "Think you can take my team? Let's see!" — Choose a move!`);
  jingle([440,440,440,587]);
  refreshGym(); renderBattle();
}
$("move-grid").addEventListener("click", e=>{ const b = e.target.closest("[data-move]"); if (b) playerUseMove(Number(b.dataset.move)); });
$("btn-potion").addEventListener("click", async ()=>{
  if (!battle || battle.busy || battle.over || battle.potions<=0) return;
  const P = battle.player[battle.pActive]; if (!P || P.hp<=0) return;
  const seq = battle.seq;
  battle.potions--; battle.busy = true;
  const healed = Math.min(P.maxHp - P.hp, Math.floor(P.maxHp*0.45));
  P.hp += healed;
  battleLog(`🧪 You used a Potion! <b>${P.name}</b> recovered ${healed} HP.`);
  tone(880,.15,"triangle",0,.05); renderBattle();
  await wait(700);
  await enemyTurn(seq);
  if (battle && !battle.over){ battle.busy = false; renderBattle(); }
});
$("btn-switch").addEventListener("click", ()=>{ if (!battle || battle.busy || battle.over) return; battle.showSwitch = !battle.showSwitch; renderBattle(); });
$("switch-row").addEventListener("click", async e=>{
  const b = e.target.closest("[data-switch]"); if (!b || !battle || battle.over) return;
  const idx = Number(b.dataset.switch), wasFainted = battle.player[battle.pActive].hp <= 0;
  const seq = battle.seq;
  battle.pActive = idx; battle.showSwitch = false;
  $("vs-player-sprite").classList.remove("fainted");
  battleLog(`🔁 Go, <b>${battle.player[idx].name}</b>!`);
  if (wasFainted){ battle.busy = false; renderBattle(); return; }
  battle.busy = true; renderBattle();
  await wait(500);
  await enemyTurn(seq);
  if (battle && !battle.over){ battle.busy = false; renderBattle(); }
});
$("btn-close-battle").addEventListener("click", ()=>{
  battleSeq++; battle = null; battleBusy = false;
  $("battle-modal").classList.add("hidden");
  document.body.style.overflow = encounter ? "hidden" : "";
  refreshGym();
});

/* ---------- Active effects ---------- */
let lastEffectSecond = -1;
function renderEffects(){
  const sec = Math.floor(Date.now()/1000);
  if (sec === lastEffectSecond) return; lastEffectSecond = sec;
  pruneBuffs();
  const bar = $("effects-bar"); if (!bar) return;
  bar.innerHTML = state.buffs.map(b=>`<span class="effect-chip">${b.icon} ${b.label} · ${Math.max(0,Math.ceil((b.expires-Date.now())/1000))}s</span>`).join("");
}

/* ---------- Weather & seasons ---------- */
function ensureWeather(announce){
  const now = Date.now();
  if (state.weather && state.weather.until > now){
    const w = currentWeather();
    const el = $("weather-widget");
    if (el) el.textContent = `${w.icon} ${w.name} · ${Math.ceil((state.weather.until-now)/60000)}m — ${w.desc}`;
    document.body.dataset.weather = w.id;
    return;
  }
  const pool = ["clear","clear","sunny","rain","wind","snow","storm","fog"];
  const id = pool[Math.floor(Math.random()*pool.length)];
  state.weather = { id, until: now + (240 + Math.random()*180)*1000 };
  const w = currentWeather();
  document.body.dataset.weather = w.id;
  const el = $("weather-widget"); if (el) el.textContent = `${w.icon} ${w.name} — ${w.desc}`;
  if (announce){ toast(`🌦️ Weather changed: <b>${w.icon} ${w.name}</b> — ${w.desc}`); setNews(`Weather update: ${w.name.toLowerCase()} rolls over the region. ${w.desc}`); }
}
function renderSeason(){
  const season = currentSeason();
  document.body.dataset.season = season.id;
  const el = $("season-widget");
  if (el) el.textContent = `${season.icon} ${season.name} — ${season.note}`;
}
setInterval(()=>{ if (state.settings.particles && !document.hidden){
  let box = document.querySelector(".season-particles");
  if (!box){ box = document.createElement("div"); box.className="season-particles"; document.body.appendChild(box); }
  for (let i=0;i<3;i++){
    const el = document.createElement("i");
    el.textContent = currentSeason().particle;
    el.style.left = Math.random()*100 + "vw";
    el.style.animationDuration = (5 + Math.random()*5) + "s";
    el.style.fontSize = (14 + Math.random()*16) + "px";
    box.appendChild(el); setTimeout(()=>el.remove(), 11000);
  }
}}, 9000);

/* ---------- Game modes & speedrun ---------- */
function renderModes(){
  $("mode-list").innerHTML = MODES.map(m=>`
    <button type="button" class="mode-card ${state.mode===m.id?"active":""}" data-mode="${m.id}"><b>${m.icon} ${m.name}</b><p>${m.desc}</p></button>`).join("");
  $("mode-widget").textContent = (MODES.find(m=>m.id===state.mode)||MODES[0]).icon + " " + (MODES.find(m=>m.id===state.mode)||MODES[0]).name + " mode";
  $("speedrun-box").classList.toggle("hidden", state.mode !== "speedrun");
  updateSpeedrun();
}
$("mode-list").addEventListener("click", e=>{
  const card = e.target.closest("[data-mode]"); if (!card || card.dataset.mode === state.mode) return;
  if (card.dataset.mode === "nuzlocke" && !confirm("💀 NUZLOCKE MODE: 1 ball per encounter, anything that breaks free flees, and losing a Gym battle permanently loses a random Pokémon (and 1% collection bonus). +25% DPS. Are you sure?")) return;
  state.mode = card.dataset.mode;
  if (state.mode !== "speedrun" && state.speedrun.active) state.speedrun.active = false;
  toast(`🎮 Mode set to <b>${(MODES.find(m=>m.id===state.mode)||{}).name}</b>!`);
  renderModes(); checkAchievements(); refreshAll(); saveGame();
});
function updateSpeedrun(){
  const box = $("speedrun-status"), btn = $("btn-speedrun"); if (!box || !btn) return;
  const sr = state.speedrun;
  if (sr.active){
    const gained = state.lifetime - sr.startEarned, left = Math.max(0, 100000 - gained);
    box.textContent = `⏱️ ${fmtTime(Date.now()-sr.startedAt)} elapsed · ${fmtMoney(gained)} earned · ${fmtMoney(left)} to go!`;
    btn.textContent = "⏹ Abandon run";
  } else {
    box.textContent = sr.bestMs ? `Best: ${fmtTime(sr.bestMs)} · ${sr.runs} completed` : "No completed runs yet. Glory awaits.";
    btn.textContent = "▶ Start Speedrun";
  }
}
$("btn-speedrun").addEventListener("click", ()=>{
  const sr = state.speedrun;
  if (sr.active){ sr.active = false; toast("⏱️ Speedrun abandoned. The clock forgives you."); }
  else { sr.active = true; sr.startedAt = Date.now(); sr.startEarned = state.lifetime; toast("⏱️ <b>Speedrun started!</b> Earn $100,000 — GO GO GO!"); jingle([523,659,784,1047]); }
  updateSpeedrun(); saveGame();
});
function checkSpeedrun(){
  const sr = state.speedrun;
  if (!sr.active) return;
  updateSpeedrun();
  if (state.lifetime - sr.startEarned >= 100000){
    const ms = Date.now() - sr.startedAt;
    sr.active = false; sr.runs++;
    if (!sr.bestMs || ms < sr.bestMs) sr.bestMs = ms;
    earn(10000); state.items.ultra = (state.items.ultra||0) + 1;
    toast(`⏱️🏁 <b>Speedrun complete in ${fmtTime(ms)}!</b> +$10,000 + 🟡 Ultra Ball!`);
    jingle([523,659,784,1047,1319,1568]);
    checkAchievements(); updateSpeedrun(); saveGame();
  }
}

/* ---------- Daily gift, milestones, leaderboard ---------- */
$("btn-daily").addEventListener("click", ()=>{
  const today = new Date().toDateString();
  if (state.lastDaily === today){ toast("🎁 You've already claimed today's gift!"); return; }
  state.lastDaily = today;
  const money = Math.max(200, Math.round(getDPS()*120 + 200));
  earn(money); state.items.berry += 2;
  const season = currentSeason();
  let extra = "";
  if (season.id === "winter"){ state.items.ultra++; extra = " + 🟡 Ultra Ball (Delibird special!)"; }
  if (season.id === "halloween"){ state.items.great++; extra = " + 🔵 Great Ball (not haunted, probably)"; }
  toast(`🎁 Daily gift: <b>${fmtMoney(money)}</b> + 2 🍓${extra}!`);
  jingle([659,784,988,1319]);
  renderDaily(); refreshAll(); saveGame();
});
function renderDaily(){
  const el = $("daily-status"); if (!el) return;
  el.textContent = state.lastDaily === new Date().toDateString() ? "✔ Claimed today — come back tomorrow!" : "A fresh gift is waiting!";
  $("btn-daily").disabled = state.lastDaily === new Date().toDateString();
}
function checkMilestones(){
  let changed = false;
  for (const m of MILESTONES){
    if (state.lifetime >= m.at && !state.milestonesClaimed.includes(m.at)){
      state.milestonesClaimed.push(m.at); changed = true;
      if (m.reward) earn(m.reward);
      if (m.item) state.items[m.item] = (state.items[m.item]||0) + 1;
      toast(`🏆 Milestone: <b>${m.label}</b>! ${m.reward?`+${fmtMoney(m.reward)} `:""}${m.item?`+ 1 ${ITEM_SHOP.find(i=>i.id===m.item)?.name || (m.item==="master"?"Master Ball":m.item)}`:""}`);
      jingle([784,988,1175]);
    }
  }
  if (changed){ renderMilestones(); renderLeaderboard(); checkAchievements(); saveGame(); }
}
function renderMilestones(){
  $("milestone-list").innerHTML = MILESTONES.map(m=>{
    const done = state.milestonesClaimed.includes(m.at) || state.lifetime >= m.at;
    return `<div class="milestone ${done?"reached":""}"><span>${done?"🏆":"🔒"} ${m.label}</span><b>${m.reward?fmtMoney(m.reward):""}${m.item?" + item":""}</b></div>`;
  }).join("");
}
function renderLeaderboard(){
  const rows = [...RIVALS.map(r=>({ name:r.name, at:r.at, you:false })), { name:"⭐ YOU", at:state.lifetime, you:true }]
    .sort((a,b)=>b.at-a.at);
  $("leaderboard").innerHTML = rows.map(r=>`<li class="${r.you?"you":(state.lifetime>=r.at?"passed":"")}">${r.name} — ${fmtMoney(r.at)}${r.you?"":""}</li>`).join("");
  const rank = rows.findIndex(r=>r.you) + 1;
  if (els.stat.rank) els.stat.rank.textContent = `#${rank} of ${rows.length}`;
}

/* ---------- Daycare breeding ---------- */
/* ---------- Daycare breeding ---------- */
/* A Pokémon physically sits in each box: two DIFFERENT species need 1 copy each,
   but pairing a species with ITSELF needs 2 copies — no cloning one Pokémon. */
function breedingError(a, b){
  if (!a || !b) return "Choose two parents first.";
  const monA = WILD_POKEMON.find(m=>m.id===a), monB = WILD_POKEMON.find(m=>m.id===b);
  if (!monA || (state.pokedex[a]||0) < 1) return "Parent A isn't in your collection.";
  if (!monB || (state.pokedex[b]||0) < 1) return "Parent B isn't in your collection.";
  if (a === b && (state.pokedex[a]||0) < 2)
    return `You only have 1 × ${monA.name} — you need 2 copies to put one in each box. Catch another first!`;
  return null;
}
function renderBreeding(){
  const caught = WILD_POKEMON.filter(m=>(state.pokedex[m.id]||0) > 0);
  const selA = $("breed-a"), selB = $("breed-b");
  if (!selA || !selB) return;
  const prevA = Number(selA.value), prevB = Number(selB.value);
  const optTag = (m, blocked) => `<option value="${m.id}" ${blocked?"disabled":""}>${m.name} (×${state.pokedex[m.id]})${blocked?" — only ×1, can't fill both boxes":""}</option>`;
  const restore = (sel, prev) => {
    const opt = [...sel.options].find(o=>Number(o.value)===prev && !o.disabled);
    if (opt) { sel.value = opt.value; return; }
    const first = [...sel.options].find(o=>!o.disabled && o.value);
    sel.value = first ? first.value : "";
  };
  // Box A settles first: any caught species may sit in it (even your only copy).
  selA.innerHTML = caught.length ? caught.map(m=>optTag(m, false)).join("") : `<option value="">— catch something first —</option>`;
  restore(selA, prevA);
  const a = Number(selA.value);
  // Box B needs its OWN individual: A's species is blocked there unless you own ×2 of it.
  selB.innerHTML = caught.length ? caught.map(m=>optTag(m, m.id === a && (state.pokedex[m.id]||0) < 2)).join("") : `<option value="">— catch something first —</option>`;
  restore(selB, prevB);
  const b = Number(selB.value);
  let err = breedingError(a, b);
  if (a && !b && caught.length) err = `Box B is empty — you need a second Pokémon: catch another ${WILD_POKEMON.find(m=>m.id===a)?.name} (to own ×2) or any different species.`;
  const st = $("breed-status");
  if (st) st.textContent = state.egg ? "An egg is already incubating — hatch it first!"
    : !caught.length ? "Catch at least one Pokémon to breed."
    : err || `Ready: ${WILD_POKEMON.find(m=>m.id===a)?.name} 💕 ${WILD_POKEMON.find(m=>m.id===b)?.name} (same species needs ×2 — one per box).`;
  $("btn-breed").disabled = !!state.egg || !!err || state.balance < 2500;
}
$("breed-a").addEventListener("change", renderBreeding);
$("breed-b").addEventListener("change", renderBreeding);
$("btn-breed").addEventListener("click", ()=>{
  const a = Number($("breed-a").value), b = Number($("breed-b").value);
  if (state.egg || state.balance < 2500) return;
  const err = breedingError(a, b); // hard guard — even a forced click can't clone a lone Pokémon
  if (err){ toast(`💕 ${err}`); renderBreeding(); return; }
  state.balance -= 2500;
  const speciesId = Math.random() < 0.5 ? a : b;
  state.egg = { progress:0, target:300, speciesId, bred:true };
  state.eggsBred++;
  const mon = WILD_POKEMON.find(m=>m.id===speciesId);
  toast(`💕 The Daycare accepted your Pokémon! An egg is incubating — it may hatch into a <b>${mon?mon.name:"?"}</b> (×4 shiny odds)!`);
  jingle([784,880,1047]);
  renderEgg(); renderBreeding(); checkAchievements(); refreshAll(); saveGame();
});

/* ---------- Game Corner slots ---------- */
const SLOT_SYMBOLS = ["🍒","🍋","⭐","🔔","💎","✨","🟣"];
let slotsSpinning = false;
$("btn-slots").addEventListener("click", ()=>{
  if (slotsSpinning || state.balance < 100) return;
  slotsSpinning = true; state.balance -= 100; state.slots.spins++;
  const reels = $("slot-reels"); reels.classList.add("spinning");
  $("btn-slots").disabled = true; $("slots-status").textContent = "Spinning…";
  const spinInt = setInterval(()=>{ [...reels.children].forEach(c=>c.textContent = SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]); }, 90);
  setTimeout(()=>{
    clearInterval(spinInt); reels.classList.remove("spinning");
    const result = [0,1,2].map(()=> SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]);
    [...reels.children].forEach((c,i)=>c.textContent = result[i]);
    let payout = 0, msg = "No match. The house Meowth smirks.";
    const counts = {}; result.forEach(x=>counts[x]=(counts[x]||0)+1);
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    if (top[1] === 3 && top[0] === "✨"){ payout = 100*100; state.slots.jackpots++; state.items.master = (state.items.master||0)+1; msg = "✨✨✨ JACKPOT!!! +$10,000 and a 🟣 MASTER BALL!"; jingle([523,659,784,1047,1319,1568,2093]); }
    else if (top[1] === 3){ payout = 100*25; msg = `Three ${top[0]}! +${fmtMoney(payout)}!`; jingle([784,988,1175]); }
    else if (top[1] === 2){ payout = 100*4; msg = `A pair of ${top[0]}! +${fmtMoney(payout)}.`; tone(880,.15,"triangle",0,.06); }
    if (payout){ earn(payout); state.slots.won += payout; }
    $("slots-status").textContent = msg;
    slotsSpinning = false; $("btn-slots").disabled = false;
    checkAchievements(); refreshAll(); saveGame();
  }, 950);
  refreshHUD();
});

/* ---------- Random world events ---------- */
let eventCleanup = null;
function showEventCard({ cls="", title, body, buttonLabel, onAction, timeoutMs=14000 }){
  hideEventCard();
  const card = $("event-card");
  card.className = "event-card " + cls;
  card.innerHTML = `<h3>${title}</h3><p>${body}</p>${buttonLabel?`<button type="button" class="btn btn-throw" id="event-action">${buttonLabel}</button> <span class="event-count" id="event-count"></span>`:""}`;
  const btn = $("event-action");
  if (btn && onAction) btn.addEventListener("click", ()=>onAction(btn));
  const deadline = Date.now() + timeoutMs;
  const countEl = $("event-count");
  const int = setInterval(()=>{ if (countEl) countEl.textContent = Math.max(0, Math.ceil((deadline-Date.now())/1000)) + "s"; if (Date.now() >= deadline){ const wasRocket = card.dataset.unresolved === "rocket"; hideEventCard(); if (wasRocket) rocketSteal(); } }, 250);
  eventCleanup = ()=>clearInterval(int);
  setTimeout(hideEventCard, timeoutMs + 60);
  state.eventsSeen++;
}
function hideEventCard(){ const card = $("event-card"); if (card){ card.classList.add("hidden"); card.dataset.unresolved=""; } if (eventCleanup){ eventCleanup(); eventCleanup=null; } }
function rocketSteal(){
  if (state.mode === "zen") return;
  const stolen = Math.min(state.balance, Math.max(50, getDPS()*45, state.balance*0.05));
  if (stolen <= 0) return;
  state.balance = Math.max(0, state.balance - stolen);
  toast(`🚀 Team Rocket blasted off with <b>${fmtMoney(stolen)}</b>! Should've clicked faster…`);
  setNews("Team Rocket strikes a local trainer's wallet. Jessie demands a raise.");
  refreshAll(); saveGame();
}
function triggerWorldEvent(){
  if (document.hidden || encounter || battleBusy) return;
  const zen = state.mode === "zen";
  const pool = ["frenzy","meteor","sale","lucky","grant","joy","swarm","snorlax","ditto", ...(zen ? [] : ["rocket"])];
  const kind = pool[Math.floor(Math.random()*pool.length)];
  const scale = Math.max(100, getDPS()*60, clickPower()*30);
  if (kind === "frenzy"){ addBuff("all", 2, 30, "Double Frenzy ×2", "🔥"); showEventCard({ title:"🔥 DOUBLE FRENZY!", body:"Professor Oak spiked the PokéSnacks — <b>ALL earnings ×2 for 30s!</b> Click like you mean it!"}); jingle([660,880,990,1320]); }
  if (kind === "meteor"){ addBuff("shiny", 5, 60, "Meteor shiny ×5", "☄️"); addBuff("catch", 1.25, 60, "Meteor luck", "☄️"); showEventCard({ title:"☄️ Meteor Shower!", body:"Shooting stars over the region — <b>shiny odds ×5</b> and catch luck up for 60s! Hunt NOW!"}); }
  if (kind === "sale"){ addBuff("sale", 0.75, 60, "Mart Sale −25%", "🏷️"); showEventCard({ title:"🏷️ PokéMart Flash Sale!", body:"<b>All building prices −25% for 60s!</b> The Silph Co. CEO is crying. Buy buy buy!"}); refreshShop(); }
  if (kind === "lucky"){ addBuff("catch", 1.35, 90, "Lucky Hour", "🍀"); showEventCard({ title:"🍀 Lucky Hour!", body:"A Chansey crossed your path — <b>catch rates +35% for 90s</b>."}); }
  if (kind === "grant"){ earn(scale); showEventCard({ title:"🎓 Research Grant!", body:`Professor Oak approved your totally-legit research: <b>+${fmtMoney(scale)}</b>!`}); }
  if (kind === "joy"){ state.items.berry += 2; state.items.great += 1; showEventCard({ title:"💉 Nurse Joy's Rounds!", body:"Nurse Joy patched up your team and left <b>2 🍓 Razz Berries + 1 🔵 Great Ball</b>."}); updateInventoryUI(); }
  if (kind === "swarm"){ addBuff("swarm", 1, 120, "Swarm! encounters ×2 rate", "🐝"); showEventCard({ title:"🐝 Pokémon Swarm!", body:"The tall grass is RUSTLING — wild encounters arrive <b>twice as often for 2 minutes</b>!"}); }
  if (kind === "ditto"){
    showEventCard({ title:"🟣 Something's Off…", body:"That Pokéball over there has a face. Click it — quickly!", buttonLabel:"Poke the 'Pokéball'!", timeoutMs:10000,
      onAction:btn=>{ addBuff("catch", 1.5, 45, "Ditto luck", "🟣"); earn(scale/2); hideEventCard(); toast("🟣 It was a <b>Ditto</b>! It giggles and blesses your throws (+50% catch, 45s)."); } });
  }
  if (kind === "snorlax"){
    if (els.stage.querySelector(".snorlax-block")) return;
    let naps = 8;
    const el = document.createElement("button");
    el.type="button"; el.className="snorlax-block"; el.title="A Snorlax is asleep on your Pokéball!";
    el.innerHTML = imgTag(ANIM_SPRITE(143), "💤", "Sleeping Snorlax");
    el.addEventListener("click", ()=>{ naps--; tone(300+naps*40,.08,"sine",0,.04); el.style.transform = `translateX(-50%) rotate(${naps%2?6:-6}deg)`;
      if (naps <= 0){ state.snorlaxMoved++; state.items.berry += 3; earn(scale); el.remove(); toast(`💤 The Snorlax rolled away! +<b>${fmtMoney(scale)}</b> + 3 🍓 for your trouble.`); checkAchievements(); saveGame(); } });
    els.stage.appendChild(el);
    showEventCard({ title:"💤 SNORLAX ROADBLOCK!", body:"A Snorlax fell asleep on the path! <b>Click it in the arena (8 pokes)</b> to move it along.", timeoutMs:20000 });
    setTimeout(()=>el.remove(), 21000);
  }
  if (kind === "rocket"){
    let pokes = 5;
    showEventCard({ cls:"rocket", title:"🚀 TEAM ROCKET IS STEALING YOUR WALLET!", body:`"Prepare for trouble!" <b>Click 'Blast them off!' ${pokes} times</b> before the timer ends or they make off with some of your PokéDollars!`, buttonLabel:"💥 Blast them off!", timeoutMs:10000,
      onAction:btn=>{ pokes--; btn.textContent = pokes>0 ? `💥 Blast them off! (${pokes} more!)` : "💥 BLASTING OFF!"; tone(180+pokes*30,.1,"sawtooth",0,.05);
        if (pokes <= 0){ $("event-card").dataset.unresolved=""; state.rocketWins++; earn(scale/2); hideEventCard(); toast("🚀✨ Team Rocket's blasting off agaaain! Your wallet is safe."); checkAchievements(); saveGame(); } } });
    $("event-card").dataset.unresolved = "rocket";
  }
  checkAchievements(); refreshAll();
}
function scheduleWorldEvent(){
  const freq = state.settings.eventFreq || "chill";
  if (freq === "off") return;
  const delay = freq === "chaotic" ? 30000 + Math.random()*35000 : 75000 + Math.random()*70000;
  setTimeout(()=>{ triggerWorldEvent(); scheduleWorldEvent(); }, delay);
}
document.querySelectorAll("[data-events]").forEach(b=>b.addEventListener("click", ()=>{
  state.settings.eventFreq = b.dataset.events;
  document.querySelectorAll("[data-events]").forEach(x=>x.classList.toggle("active", x===b));
  toast(`🌍 World events: <b>${b.dataset.events}</b>`);
  saveGame();
}));

/* ---------- HUD refresh ---------- */
function refreshHUD(){
  const dps = getDPS();
  els.balance.textContent = fmtMoney(state.balance);
  els.dps.textContent = fmtMoney(dps);
  els.clickPower.textContent = fmtMoney(clickPower());
  els.catchBar.style.width = Math.min(100, state.clicksSinceCatch / effectiveCatchClicks() * 100) + "%";
  const chc = document.querySelector(".catch-progress-head span:last-child"); if (chc) chc.innerHTML = `<b>${state.clicksSinceCatch}</b> / ${effectiveCatchClicks()} clicks`;
  els.stat.balance.textContent = fmtMoney(state.balance);
  els.stat.dps.textContent = fmtRate(dps);
  els.stat.lifetime.textContent = fmtMoney(state.lifetime);
  els.stat.run.textContent = fmtMoney(state.runEarned);
  els.stat.clicks.textContent = formatNumber(state.totalClicks);
  els.stat.buildings.textContent = formatNumber(totalBuildings());
  els.stat.caught.textContent = formatNumber(state.totalCaught);
  els.stat.dex.textContent = `${Object.keys(state.pokedex).length} / ${WILD_POKEMON.length}`;
  els.stat.collection.textContent = `+${state.bonusPct}%`;
  els.stat.seen.textContent = formatNumber(state.encounters);
  els.stat.throws.textContent = formatNumber(state.throws);
  els.stat.excellent.textContent = formatNumber(state.excellentThrows);
  els.stat.shinies.textContent = formatNumber(state.shinies);
  if (els.stat.events) els.stat.events.textContent = formatNumber(state.eventsSeen);
  if (els.stat.rockets) els.stat.rockets.textContent = formatNumber(state.rocketWins);
  if (els.stat.snorlax) els.stat.snorlax.textContent = formatNumber(state.snorlaxMoved);
  if (els.stat.bred) els.stat.bred.textContent = formatNumber(state.eggsBred);
  if (els.stat.slots) els.stat.slots.textContent = `${formatNumber(state.slots.spins)} / ${fmtMoney(state.slots.won)}`;
  if (els.stat.speedrun) els.stat.speedrun.textContent = fmtTime(state.speedrun.bestMs);
  const lvl = trainerLevel(), prevAt = Math.pow(lvl-1,2)*500, nextAt = Math.pow(lvl,2)*500;
  els.trainerLevel.textContent = lvl;
  els.trainerNext.textContent = `next level at ${fmtMoney(nextAt)} lifetime`;
  els.trainerBar.style.width = Math.min(100, Math.max(0, (state.lifetime - prevAt) / Math.max(1,(nextAt - prevAt)) * 100)) + "%";
  els.stat.badges.textContent = formatNumber(state.badges);
  const tb = $("time-bonus"); if (tb) tb.textContent = isNight() ? "🌙 Night: Legendary & shiny odds ×2" : "☀️ Daytime hunting";
  els.prestigePending.textContent = formatNumber(prestigePending());
  els.btnPrestige.disabled = prestigePending() < 1;
  els.btnPrestige.textContent = prestigePending() >= 1
    ? `Challenge the League — earn ${formatNumber(prestigePending())} 🏅`
    : "Challenge the League (needs $1M this run)";
}
function refreshAll(){ refreshHUD(); refreshShop(); refreshItems(); refreshVault(); renderLegacy(); }

/* ---------- Prestige / reset / mute ---------- */
els.btnPrestige.addEventListener("click", ()=>{
  const pending = prestigePending(); if (pending < 1) return;
  if (!confirm(`Prestige now? You'll lose current dollars, buildings and evolution items, but gain ${pending} Gym Badge(s) (+${pending*10}% permanent earnings). Pokédex & achievements are kept.`)) return;
  state.badges += pending; state.balance = legacyHas("legacy-start") ? 50000 : 0; state.runEarned = 0;
  state.buildings = Object.fromEntries(BUILDINGS.map(b=>[b.id,0]));
  state.upgrades = []; state.revealedBuildings = []; state.revealedUpgrades = [];
  els.banner.classList.add("hidden");
  toast(`🏅 Prestige complete! You earned <b>${pending} Gym Badge(s)</b>.`);
  setNews("A trainer has challenged the League and returned stronger than ever!");
  checkAchievements(); buildUpgradeVisibilityReset(); refreshAll(); saveGame();
});
function buildUpgradeVisibilityReset(){ /* rows stay built; refreshShop re-evaluates hidden state */ }

$("btn-reset").addEventListener("click", ()=>{
  if (!confirm("Delete your ENTIRE save (including Pokédex, achievements and badges) and start over?")) return;
  if (encounter) closeEncounter();
  localStorage.removeItem(SAVE_KEY); state = defaultState();
  els.banner.classList.add("hidden"); renderPokedex(); renderAchievements(); refreshAll(); saveGame();
  toast("🧹 Save wiped. A new journey begins!");
});
function syncMuteBtn(){ els.btnMute.textContent = state.muted ? "🔇 Muted" : "🔊 Sound"; els.btnMute.setAttribute("aria-pressed", String(state.muted)); }
els.btnMute.addEventListener("click", ()=>{ state.muted = !state.muted; syncMuteBtn(); saveGame(); });

/* ---------- Main loops ---------- */
loadGame();
buildShop(); buildVault(); renderPokedex(); renderAchievements(); renderBuddy(); renderQuests(); buildSettings(); applySettings(); buildRegions(); buildGymList(); renderEgg(); renderModes(); renderDaily(); renderMilestones(); renderLeaderboard(); renderBreeding(); ensureWeather(false); renderSeason(); syncMuteBtn(); refreshAll(); rotateNews(); restartNewsTimer(); scheduleGolden(); scheduleWorldEvent();
checkAchievements(); refreshAll();

let lastTick = Date.now();
setInterval(()=>{ // 10 ticks/sec passive income, drift-corrected
  const now = Date.now(), dt = Math.min((now - lastTick)/1000, 1); lastTick = now;
  const dps = getDPS();
  if (dps > 0) earn(dps * dt);
  if (combo && performance.now() - lastClickAt > 1500){ combo = 0; updateComboUI(); }
  if (state.questDay !== new Date().toDateString()){ renderQuests(); renderDaily(); }
  ensureWeather(false); renderEffects(); checkMilestones(); checkSpeedrun();
  updateRegions(); refreshGym();
  refreshHUD(); refreshShop(); refreshItems();
}, 100);
setInterval(saveGame, 10000);                       // autosave every 10s
window.addEventListener("beforeunload", saveGame);  // …and on exit
document.addEventListener("visibilitychange", ()=>{ if (document.hidden) saveGame(); });
