"use strict";
/* ============================================================
   PokéClicker — incremental game logic (no dependencies)
   Sprites: https://github.com/PokeAPI/sprites
   ============================================================ */
const SPRITE_POKEMON = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_ITEM = name => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
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
];

const UPGRADES = [ // Evolution items: one-time, ×2 to one building (or clicks)
  { id:"thunder-stone", name:"Thunder Stone", emoji:"⚡", sprite:SPRITE_ITEM("thunder-stone"), cost:2500,    target:"launcher", label:"Pokéball Launchers ×2" },
  { id:"leaf-stone",    name:"Leaf Stone",    emoji:"🍃", sprite:SPRITE_ITEM("leaf-stone"),    cost:15000,   target:"catcher",  label:"Auto-Catcher NPCs ×2" },
  { id:"water-stone",   name:"Water Stone",   emoji:"💧", sprite:SPRITE_ITEM("water-stone"),   cost:60000,   target:"daycare",  label:"Daycare Centers ×2" },
  { id:"fire-stone",    name:"Fire Stone",    emoji:"🔥", sprite:SPRITE_ITEM("fire-stone"),    cost:500000,  target:"gym",      label:"Pokémon Gyms ×2" },
  { id:"moon-stone",    name:"Moon Stone",    emoji:"🌙", sprite:SPRITE_ITEM("moon-stone"),    cost:5000000, target:"silph",    label:"Silph Co. Labs ×2" },
  { id:"rare-candy",    name:"Rare Candy",    emoji:"🍬", sprite:SPRITE_ITEM("rare-candy"),    cost:10000,   target:"click",    label:"Click power ×2" },
];

const WILD_POKEMON = [
  [16,"Pidgey"],[19,"Rattata"],[10,"Caterpie"],[13,"Weedle"],[25,"Pikachu"],[39,"Jigglypuff"],
  [74,"Geodude"],[92,"Gastly"],[133,"Eevee"],[4,"Charmander"],[7,"Squirtle"],[1,"Bulbasaur"],
  [52,"Meowth"],[54,"Psyduck"],[66,"Machop"],[129,"Magikarp"],[132,"Ditto"],[143,"Snorlax"],
  [147,"Dratini"],[150,"Mewtwo"],[151,"Mew"],[35,"Clefairy"],[37,"Vulpix"],[58,"Growlithe"],
  [95,"Onix"],[104,"Cubone"],[113,"Chansey"],[131,"Lapras"],[137,"Porygon"],
];

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
];

/* ---------- Number formatting ---------- */
function formatNumber(n){
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + formatNumber(-n);
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
    upgrades:[], pokedex:{}, achievements:[], badges:0,
    revealedBuildings:[], revealedUpgrades:[], muted:false,
    lastSeen:Date.now(),
  };
}
let state = defaultState();

function totalBuildings(s=state){ return BUILDINGS.reduce((a,b)=>a+(s.buildings[b.id]||0),0); }
function buildingCost(b){ return Math.ceil(b.baseCost * Math.pow(COST_GROWTH, state.buildings[b.id]||0)); }
function buildingMultiplier(id){ return state.upgrades.includes(UPGRADES.find(u=>u.target===id)?.id) ? 2 : 1; }
function globalMultiplier(){ return (1 + state.badges * 0.10) * (1 + state.totalCaught * 0.01); }
function getDPS(){
  const base = BUILDINGS.reduce((sum,b)=> sum + (state.buildings[b.id]||0) * b.baseDps * buildingMultiplier(b.id), 0);
  return base * globalMultiplier();
}
function buildingDPS(b){ return (state.buildings[b.id]||0) * b.baseDps * buildingMultiplier(b.id) * globalMultiplier(); }
function clickPower(){ return 1 * (state.upgrades.includes("rare-candy") ? 2 : 1) * (1 + state.badges * 0.10); }
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
    };
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
  stat:{ balance:$("stat-balance"), dps:$("stat-dps"), lifetime:$("stat-lifetime"), run:$("stat-run"),
    clicks:$("stat-clicks"), buildings:$("stat-buildings"), caught:$("stat-caught"), dex:$("stat-dex"),
    collection:$("stat-collection-bonus"), badges:$("stat-badges") },
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
    const afford = state.balance >= cost;
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
function buyBuilding(id){
  const b = BUILDINGS.find(x=>x.id===id), cost = buildingCost(b);
  if (state.balance < cost) return;
  state.balance -= cost; state.buildings[id]++;
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
function clickSound(){
  if (state.muted) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type="sine"; o.frequency.setValueAtTime(620 + Math.random()*80, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + .08);
    g.gain.setValueAtTime(.06, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .09);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + .1);
  }catch(e){/* audio blocked — ignore */}
}
function spawnFloatText(x, y, text){
  const rect = els.stage.getBoundingClientRect();
  const el = document.createElement("span");
  el.className="float-text"; el.textContent=text;
  el.style.left = (x - rect.left) + "px"; el.style.top = (y - rect.top) + "px";
  els.stage.appendChild(el); setTimeout(()=>el.remove(), 1000);
}
els.ball.addEventListener("pointerdown", e => {
  const gain = clickPower();
  earn(gain);
  state.totalClicks++; state.clicksSinceCatch++;
  els.ball.classList.add("pressed"); setTimeout(()=>els.ball.classList.remove("pressed"), 90);
  spawnFloatText(e.clientX || rectCenter().x, e.clientY || rectCenter().y, "+" + fmtMoney(gain));
  clickSound();
  if (state.clicksSinceCatch >= CLICKS_PER_CATCH){ state.clicksSinceCatch = 0; catchPokemon(); }
  checkAchievements(); refreshHUD();
});
function rectCenter(){ const r = els.ball.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; }

function catchPokemon(){
  const [id,name] = WILD_POKEMON[Math.floor(Math.random()*WILD_POKEMON.length)];
  const isNew = !state.pokedex[id];
  state.pokedex[id] = (state.pokedex[id]||0) + 1;
  state.totalCaught++;
  els.ball.classList.remove("wiggle"); void els.ball.offsetWidth; els.ball.classList.add("wiggle");
  els.banner.classList.remove("hidden");
  els.banner.innerHTML = `${imgTag(SPRITE_POKEMON(id),"🐾",name)}
    <div><b>Gotcha! ${name} was caught!</b><br>
    ${isNew ? "New Pokédex entry registered!" : `You now have ${state.pokedex[id]} × ${name}.`}
    Every catch adds a permanent <b>+1% DPS</b> (now +${state.totalCaught}%).</div>`;
  setNews(`Wild ${name} caught by a local trainer after exactly 100 clicks. 'Worth it,' says trainer.`);
  toast(`🎉 Gotcha! <b>${name}</b> was caught! (+1% DPS)`);
  renderPokedex(); checkAchievements(); saveGame();
}

/* ---------- Pokédex / achievements / news ---------- */
function renderPokedex(){
  const entries = Object.entries(state.pokedex).sort((a,b)=>a[0]-b[0]);
  els.pokedex.innerHTML = entries.length ? entries.map(([id,count])=>{
    const mon = WILD_POKEMON.find(p=>p[0]==id); const name = mon ? mon[1] : `#${id}`;
    return `<div class="dex-entry">${count>1?`<span class="dex-count">×${count}</span>`:""}${imgTag(SPRITE_POKEMON(id),"🐾",name)}<div>${name}</div></div>`;
  }).join("") : `<p class="empty-note">No Pokémon yet. Keep clicking — something rustles in the tall grass…</p>`;
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
  els.stat.collection.textContent = `+${state.totalCaught}%`;
  els.stat.badges.textContent = formatNumber(state.badges);
  els.prestigePending.textContent = formatNumber(prestigePending());
  els.btnPrestige.disabled = prestigePending() < 1;
  els.btnPrestige.textContent = prestigePending() >= 1
    ? `Challenge the League — earn ${formatNumber(prestigePending())} 🏅`
    : "Challenge the League (needs $1M this run)";
}
function refreshAll(){ refreshHUD(); refreshShop(); }

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
  localStorage.removeItem(SAVE_KEY); state = defaultState();
  els.banner.classList.add("hidden"); renderPokedex(); renderAchievements(); refreshAll(); saveGame();
  toast("🧹 Save wiped. A new journey begins!");
});
function syncMuteBtn(){ els.btnMute.textContent = state.muted ? "🔇 Muted" : "🔊 Sound"; els.btnMute.setAttribute("aria-pressed", String(state.muted)); }
els.btnMute.addEventListener("click", ()=>{ state.muted = !state.muted; syncMuteBtn(); saveGame(); });

/* ---------- Main loops ---------- */
loadGame();
buildShop(); renderPokedex(); renderAchievements(); syncMuteBtn(); refreshAll(); rotateNews(); restartNewsTimer();
checkAchievements(); refreshAll();

let lastTick = Date.now();
setInterval(()=>{ // 10 ticks/sec passive income, drift-corrected
  const now = Date.now(), dt = Math.min((now - lastTick)/1000, 1); lastTick = now;
  const dps = getDPS();
  if (dps > 0) earn(dps * dt);
  refreshHUD(); refreshShop();
}, 100);
setInterval(saveGame, 10000);                       // autosave every 10s
window.addEventListener("beforeunload", saveGame);  // …and on exit
document.addEventListener("visibilitychange", ()=>{ if (document.hidden) saveGame(); });
