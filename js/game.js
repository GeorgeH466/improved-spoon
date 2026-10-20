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
];

const ITEM_SHOP = [
  { id:"berry", name:"Razz Berry", emoji:"🍓", sprite:SPRITE_ITEM("razz-berry"), cost:150,  blurb:"Encounter: ×1.45 catch chance for one throw." },
  { id:"great", name:"Great Ball", emoji:"🔵", sprite:SPRITE_ITEM("great-ball"), cost:300,  blurb:"Encounter: ×1.4 catch chance per throw." },
  { id:"ultra", name:"Ultra Ball", emoji:"🟡", sprite:SPRITE_ITEM("ultra-ball"), cost:1200, blurb:"Encounter: ×1.9 catch chance per throw." },
];
const BALL_TYPES = {
  poke:  { name:"Poké Ball",  mult:1.0, item:null },
  great: { name:"Great Ball", mult:1.4, item:"great" },
  ultra: { name:"Ultra Ball", mult:1.9, item:"ultra" },
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
  const units = [[1e15,"Qa"],[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];
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
    settings:{ theme:"kanto", particles:true, shake:true, floatText:true, reduceMotion:false, notation:"suffix" },
    items:{ berry:3, great:0, ultra:0 },
    buddyId:null, maxCombo:0, goldenCaught:0, quests:[], questDay:"", questsDone:0,
    lastSeen:Date.now(),
  };
}
let state = defaultState();

function totalBuildings(s=state){ return BUILDINGS.reduce((a,b)=>a+(s.buildings[b.id]||0),0); }
function buildingCost(b){ return Math.ceil(b.baseCost * Math.pow(COST_GROWTH, state.buildings[b.id]||0)); }
function buildingMultiplier(id){ return state.upgrades.includes(UPGRADES.find(u=>u.target===id)?.id) ? 2 : 1; }
function globalMultiplier(){ return (1 + state.badges * 0.10) * (1 + state.bonusPct * 0.01); }
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
function clickPower(){ return 1 * (state.upgrades.includes("rare-candy") ? 2 : 1) * (1 + state.badges * 0.10) * (1 + buddyBonus()); }
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
  questList:$("quest-list"), itemShop:$("item-shop"), settingsModal:$("settings-modal"),
  invGreat:$("inv-great"), invUltra:$("inv-ultra"), invBerry:$("inv-berry"),
  stat:{ balance:$("stat-balance"), dps:$("stat-dps"), lifetime:$("stat-lifetime"), run:$("stat-run"),
    clicks:$("stat-clicks"), buildings:$("stat-buildings"), caught:$("stat-caught"), dex:$("stat-dex"),
    collection:$("stat-collection-bonus"), badges:$("stat-badges"),
    seen:$("stat-seen"), throws:$("stat-throws"), excellent:$("stat-excellent"), shinies:$("stat-shinies") },
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
  state.balance -= it.cost; state.items[id] = (state.items[id]||0) + 1;
  toast(`🎒 Bought <b>${it.name}</b>! (${state.items[id]} held)`);
  refreshAll(); saveGame();
}
function refreshItems(){
  for (const it of ITEM_SHOP){
    const row = itemRows[it.id]; if (!row) continue;
    row.count.textContent = "×" + (state.items[it.id]||0);
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
  return total;
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
  combo = (now - lastClickAt < 1500) ? combo + 1 : 1;
  lastClickAt = now;
  state.maxCombo = Math.max(state.maxCombo, combo);
  const crit = Math.random() < 0.05;
  const gain = clickPower() * comboMult() * (crit ? 10 : 1);
  earn(gain);
  state.totalClicks++; state.clicksSinceCatch++;
  els.ball.classList.add("pressed"); setTimeout(()=>els.ball.classList.remove("pressed"), 90);
  spawnFloatText(e.clientX || rectCenter().x, e.clientY || rectCenter().y, "+" + fmtMoney(gain) + (crit ? " CRIT!" : ""), crit ? "crit" : "");
  if (crit && state.settings.shake){ els.stage.classList.remove("stage-shake"); void els.stage.offsetWidth; els.stage.classList.add("stage-shake"); jingle([880,1175,1568]); }
  else clickSound();
  updateComboUI();
  if (state.buddyId && state.totalClicks % 200 === 0){ state.items.berry++; toast("🐾 Your Buddy found a <b>🍓 Razz Berry</b>!"); updateInventoryUI(); }
  if (state.clicksSinceCatch >= CLICKS_PER_CATCH && !encounter){ state.clicksSinceCatch = 0; startEncounter(); }
  checkAchievements(); refreshHUD();
});

/* ---------- Golden Magikarp event ---------- */
function scheduleGolden(){ setTimeout(spawnGolden, 45000 + Math.random()*60000); }
function spawnGolden(){
  scheduleGolden();
  if (encounter || document.hidden || els.stage.querySelector(".golden-mon")) return;
  const el = document.createElement("button");
  el.type="button"; el.className="golden-mon"; el.title="Golden Magikarp! Click it!";
  el.innerHTML = imgTag(ANIM_SPRITE(129, true), "🐟", "Golden Magikarp");
  el.addEventListener("click", ()=>{
    const reward = Math.max(100, getDPS()*60, clickPower()*25);
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
  const pool = Object.entries(RARITY_WEIGHTS);
  let roll = Math.random() * pool.reduce((a,[,w])=>a+w,0), rarity = "common";
  for (const [r,w] of pool){ if ((roll -= w) <= 0){ rarity = r; break; } }
  const group = WILD_POKEMON.filter(m=>m.rarity===rarity);
  return group[Math.floor(Math.random()*group.length)];
}

function startEncounter(){
  const mon = pickWild();
  encounter = { ...mon, shiny:Math.random() < SHINY_CHANCE, balls:3, berry:false, busy:false, over:false, ringScale:1, ball:"poke", seq:++encounterSeq };
  state.encounters++;
  els.wildTitle.textContent = encounter.shiny ? `A wild ✨ ${mon.name} appeared!` : `A wild ${mon.name} appeared!`;
  els.wildRarity.textContent = mon.rarity; els.wildRarity.className = "rarity-badge " + mon.rarity;
  els.wildShiny.classList.toggle("hidden", !encounter.shiny);
  els.wildSprite.src = ANIM_SPRITE(mon.id, encounter.shiny);
  els.wildSprite.alt = mon.name;
  els.wildSprite.className = "wild-sprite animated";
  els.wildSprite.onerror = ()=>{ els.wildSprite.onerror = null; els.wildSprite.src = SPRITE_POKEMON(mon.id).replace("/pokemon/", encounter.shiny ? "/pokemon/shiny/" : "/pokemon/"); };
  syncBallPicker(); updateInventoryUI();
  els.catchMeterFill.style.width = Math.round(mon.rate*100) + "%";
  els.catchMeterLabel.textContent = `${mon.rarity} · base ${Math.round(mon.rate*100)}%`;
  els.battleMsg.textContent = "Time your throw! Press THROW (or Space) when the shrinking ring meets the target circle.";
  els.throwRating.textContent = "";
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
  const t0 = performance.now(), PERIOD = 1150;
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
  const finalP = clamp01(encounter.rate * rating.mult * (encounter.berry ? 1.45 : 1) * (BALL_TYPES[encounter.ball] ? BALL_TYPES[encounter.ball].mult : 1));
  const shakeP = Math.cbrt(finalP);
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
  if (Math.random() < encounter.flee) return fleeEncounter(seq);
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
  document.querySelectorAll(".ball-choice").forEach(b=>{
    const type = BALL_TYPES[b.dataset.ball];
    const available = !type.item || (state.items[type.item]||0) > 0;
    b.classList.toggle("active", !!encounter && encounter.ball === b.dataset.ball);
    b.disabled = !available || !!(encounter && encounter.busy);
  });
}
document.querySelectorAll(".ball-choice").forEach(b=>b.addEventListener("click", ()=>{
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
els.btnRun.addEventListener("click", ()=>{ if (encounter && !encounter.busy){ toast("🏃 You ran away safely!"); closeEncounter(); } });
els.btnCloseEncounter.addEventListener("click", closeEncounter);
document.addEventListener("keydown", e=>{
  if (!encounter || els.modal.classList.contains("hidden")) return;
  if (e.code === "Space"){ e.preventDefault(); throwBall(); }
  if (e.code === "Escape" && !encounter.busy) closeEncounter();
});

/* ---------- Pokédex / achievements / news ---------- */
function renderPokedex(){
  els.pokedex.innerHTML = WILD_POKEMON.map(mon=>{
    const count = state.pokedex[mon.id]||0, seen = count>0, shiny = !!state.shinyDex[mon.id];
    const src = seen ? ANIM_SPRITE(mon.id, shiny) : SPRITE_POKEMON(mon.id);
    return `<div class="dex-entry ${seen?"":"unseen"} ${shiny?"shiny":""}">${count>1?`<span class="dex-count">×${count}</span>`:""}${imgTag(src,"❔",seen?mon.name:"Unknown")}<div>${seen?mon.name:"???"}${shiny?" ✨":""}</div><div class="rarity-tag">${mon.rarity}</div>${seen?`<button type="button" class="dex-buddy-btn ${state.buddyId===mon.id?"is-buddy":""}" data-buddy="${mon.id}">${state.buddyId===mon.id?"🐾 Buddy":"Set Buddy"}</button>`:""}</div>`;
  }).join("");
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

/* ---------- HUD refresh ---------- */
function refreshHUD(){
  const dps = getDPS();
  els.balance.textContent = fmtMoney(state.balance);
  els.dps.textContent = fmtMoney(dps);
  els.clickPower.textContent = fmtMoney(clickPower());
  els.catchCount.textContent = state.clicksSinceCatch;
  els.catchBar.style.width = (state.clicksSinceCatch / CLICKS_PER_CATCH * 100) + "%";
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
  const lvl = trainerLevel(), prevAt = Math.pow(lvl-1,2)*500, nextAt = Math.pow(lvl,2)*500;
  els.trainerLevel.textContent = lvl;
  els.trainerNext.textContent = `next level at ${fmtMoney(nextAt)} lifetime`;
  els.trainerBar.style.width = Math.min(100, Math.max(0, (state.lifetime - prevAt) / Math.max(1,(nextAt - prevAt)) * 100)) + "%";
  els.stat.badges.textContent = formatNumber(state.badges);
  els.prestigePending.textContent = formatNumber(prestigePending());
  els.btnPrestige.disabled = prestigePending() < 1;
  els.btnPrestige.textContent = prestigePending() >= 1
    ? `Challenge the League — earn ${formatNumber(prestigePending())} 🏅`
    : "Challenge the League (needs $1M this run)";
}
function refreshAll(){ refreshHUD(); refreshShop(); refreshItems(); }

/* ---------- Prestige / reset / mute ---------- */
els.btnPrestige.addEventListener("click", ()=>{
  const pending = prestigePending(); if (pending < 1) return;
  if (!confirm(`Prestige now? You'll lose current dollars, buildings and evolution items, but gain ${pending} Gym Badge(s) (+${pending*10}% permanent earnings). Pokédex & achievements are kept.`)) return;
  state.badges += pending; state.balance = 0; state.runEarned = 0;
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
buildShop(); renderPokedex(); renderAchievements(); renderBuddy(); renderQuests(); buildSettings(); applySettings(); syncMuteBtn(); refreshAll(); rotateNews(); restartNewsTimer(); scheduleGolden();
checkAchievements(); refreshAll();

let lastTick = Date.now();
setInterval(()=>{ // 10 ticks/sec passive income, drift-corrected
  const now = Date.now(), dt = Math.min((now - lastTick)/1000, 1); lastTick = now;
  const dps = getDPS();
  if (dps > 0) earn(dps * dt);
  if (combo && performance.now() - lastClickAt > 1500){ combo = 0; updateComboUI(); }
  if (state.questDay !== new Date().toDateString()) renderQuests();
  refreshHUD(); refreshShop(); refreshItems();
}, 100);
setInterval(saveGame, 10000);                       // autosave every 10s
window.addEventListener("beforeunload", saveGame);  // …and on exit
document.addEventListener("visibilitychange", ()=>{ if (document.hidden) saveGame(); });
