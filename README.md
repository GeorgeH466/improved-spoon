# PokéClicker 🖱️⚪

A Pokémon-themed homage to Cookie Clicker — click the Pokéball, earn PokéDollars ($),
buy automated catchers & buildings, battle-catch wild Pokémon in a timing minigame every
100 clicks, evolve your output with Evolution Stones, and prestige for Gym Badges.

Fan-made for fun. Not affiliated with Nintendo, Game Freak, or The Pokémon Company.
Sprites come from [PokeAPI/sprites](https://github.com/PokeAPI/sprites).

## Run it

No build step — it's plain HTML/CSS/JS:

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` in a browser.

## Structure

```
.
├── index.html      # 3-column layout: arena | news & stats | shop
├── css/
│   └── style.css   # Pokéball, animations, responsive layout, toasts
└── js/
    └── game.js     # all game logic (state, DPS, shop, catching, prestige, saves)
```

## How to play

| Mechanic | Details |
|---|---|
| **Click** | Click the Pokéball for $1 (floating `+$` popup at your cursor, squish animation, optional pop sound). |
| **Buildings** | Pokéball Launcher $15 (+0.1/s) · Auto-Catcher NPC $100 (+1/s) · Daycare Center $1,100 (+8/s) · Pokémon Gym $12,000 (+47/s) · Silph Co. Lab $130,000 (+260/s). Each purchase multiplies that building's next cost by **1.15^owned**. |
| **Shop reveal** | Buildings/upgrades stay hidden until your balance reaches **60% of their cost**, and grey out when unaffordable. |
| **Catch 'em (minigame!)** | Every **100 manual clicks** a wild Pokémon appears in a battle modal. Time the shrinking ring against the target circle and throw — Excellent throws are worth ×1.6 catch chance — then survive **3 ball shakes**. You get **3 balls** and **1 Razz Berry** (×1.45) per encounter; if it breaks free it may **flee**. 29 species across Common/Uncommon/Rare/Legendary rarities (weighted spawns, real per-species catch rates), plus a 1/32 **✨ shiny** chance (shiny sprite, +5% DPS instead of +1%). Every catch is a permanent DPS bonus; duplicates count. `Space` throws, `Esc` runs. |
| **Evolution Items** | One-time stones ×2 a building type: Thunder→Launchers, Leaf→Catchers, Water→Daycare, Fire→Gyms, Moon→Silph Labs, plus Rare Candy ×2 click power. |
| **Prestige** | Reset dollars/buildings/stones for **Gym Badges** (1 per $1M earned that run), each worth a permanent **+10%** to all earnings. Pokédex & achievements survive. |
| **News ticker** | Rotates every 15 seconds; catches, evolutions and prestiges push their own headlines. |
| **Achievements** | 25 unlockables, from *First Click!* to *Poké Billionaire* — now including *Sharpshooter*, *Shiny Hunter* and *Legend Tamer*. |
| **Endgame scaling (1e20+)** | 18 buildings up to the **Arceus Shrine** ($4×10²⁰, 9T/s base), number formatting to Dc (1e33), milestones/rivals extended to 1e20, and prestige badges that scale quadratically into the septillions. This will take your friend a *while*. |
| **Upgrade Vault** | Cookie-Clicker-style generated upgrades: **108 building tiers** (own 10/25/50/100/150/200 of any building → ×2 each), **7 click upgrades** (total-click milestones → click ×2 each), **8 global research upgrades** (lifetime milestones → ×1.3–1.5 *all* production, compounding). Plus the original evolution stones. |
| **Legacy Shop** | Spend prestige badges on 6 permanent perks that survive prestiging (×3 clicks, ×3 production, Golden Start, better lures, double collection bonus, ×5 Golden Magikarp) — at the cost of the badges' own +10% each. |
| **Almost-full Pokédex** | All **251 Gen I + Gen II Pokémon** are catchable (names, rarities, sprites — hand-written roster plus a generated national dex), with Pokédex search and rarity/caught/shiny filters. New regions too: Ecruteak City, Lake of Rage, Dragon's Den. |
| **Full Pokémon battles** | Gym battles are now real turn-based Pokémon battles: pick from **4 moves per Pokémon** with an 18-type effectiveness chart, STAB, crits, accuracy, priority, stat stages, burn/poison/paralysis, speed order, **team switching**, **potions**, enemy AI, and enemy *teams* of 3 per leader. Your top-6 collection (Buddy leads) vs theirs. |
| **Bulk buying** | Shop has a ×1 / ×10 / ×100 toggle with true geometric bulk pricing. |
| **Buddy Pokémon** | Set any caught species as your Buddy (button in the Pokédex): it appears, animated, beside the Pokéball, boosts click power by rarity (+5% common → +50% legendary, +2% per duplicate level, +10% if shiny) and finds a Razz Berry every 200 clicks. |
| **Combo & crits** | Clicking fast builds a combo meter (up to ×2 click value at a 50 streak); every click has a 5% chance to CRIT for ×10 with a gold burst and screen shake. |
| **Golden Magikarp** | Every ~45–105s a shiny golden Magikarp swims across the arena — click it before it escapes for a big payout. |
| **Research Tasks** | 3 daily Professor's Research Tasks (clicks, catches, excellent throws, buildings, goldens…) with progress bars and claimable $/berry rewards. |
| **Items & ball tiers** | Buy Razz Berries, Great Balls (×1.4) and Ultra Balls (×1.9) in the Items shop; pick your ball in the encounter before throwing — inventory is consumed per throw. |
| **More endgame** | 3 new buildings (Pokémon Center, Battle Frontier, Champion's Hall) and 3 new ×2 evolution items (Dawn/Dusk Stone, Dragon Fang). |
| **Animated sprites** | Encounters, Buddies, Pokédex entries and the Golden Magikarp use the animated Gen-V sprites from PokeAPI/sprites (with static/emoji fallbacks). |
| **Game modes** | 4 switchable modes: **Classic**, **Zen** (never flee, no theft, +20% DPS), **Speedrun** (timed $100k race vs your best time, prizes for finishing), **Nuzlocke** 💀 (1 ball per encounter, break-free = flee, gym losses permanently lose a Pokémon — for +25% DPS). |
| **Random world events** | A living world rolls events every ~1–2 min (frequency adjustable in Settings: Off/Chill/Chaotic): 🚀 **Team Rocket invasions** (click to blast them off or they steal your wallet!), ☄️ **meteor showers** (shiny ×5), 🔥 **Double Frenzy** (all earnings ×2), 🏷️ **Mart flash sales** (−25% buildings), 🍀 Lucky Hour, 🐝 swarms (encounters ×2 rate), 💤 clickable **Snorlax roadblocks** (8 pokes to move), 🟣 Ditto ambushes, Nurse Joy visits, research grants. Active buffs show as countdown chips. |
| **Weather** | Rotating weather (clear/sun/rain/storm/snow/wind/fog) every few minutes, each bending the game: storm doubles crits but speeds the catch ring, tailwind slows it, snow preserves combos, fog lures rares but raises fleeing… Widget in the arena. |
| **Seasons** | Real-calendar seasons with spawn biases, arena particles (🦇🎃/❄️/🌸/🍂), and seasonal daily-gift bonuses. October is Spooky Season — Ghost-types prowl. |
| **Daycare breeding** | Breed any two caught species for $2,500: a predetermined egg (×4 shiny odds, inherits a parent's species) goes into the incubator. |
| **Daily gifts & milestones** | Claim a daily gift ($ + berries + seasonal items), chase 6 lifetime milestones (Master Balls at $100M/$1B!), and climb the local **Hall of Fame** leaderboard past 8 rival trainers. |
| **Game Corner slots** | $100 spins, animated reels: pairs pay ×4, triples ×25, ✨✨✨ jackpot pays $10,000 + a Master Ball. |
| **Safari actions & Master Ball** | Encounters gain Bait (catch↑ flee↓↓) and Rock (catch↑↑ flee↑↑) throws, and the never-fail Master Ball as a ball tier (earned from milestones/jackpots). |
| **More achievements** | 32 total, incl. Rocket Repellent, Alarm Clock, Matchmaker, Jackpot!, Speed Demon, Against All Odds. |
| **Regions** | 6 hunting regions (Route 1 → Viridian Forest → Mt. Moon → Safari Zone → Seafoam Islands → Victory Road) unlock with lifetime earnings. Each has its own wild pool (Pokédex now **63 species**), encounter scenery, and flavour — Victory Road is where the monsters live. |
| **Gym Leader Battles** | Animated VS battles vs all 8 Kanto leaders (lunge attacks, floating damage, HP bars, your Buddy/strongest species fights for you). Party power = rarity × duplicates. First win per leader: permanent **+2% all earnings**; rematches pay cash. 30s cooldown. |
| **Mystery Eggs** | Buy an egg ($5,000), incubate it with 300 clicks (it wobbles faster as it warms), and hatch a random regional Pokémon — shiny chance included. |
| **Day/night cycle** | Real-world clock: at night (19:00–07:00) Legendary and shiny odds **double**, and the encounter scene darkens. |
| **Themes & settings** | ⚙️ Settings: 6 Pokémon themes (Kanto Classic, Charizard Ember, Bulbasaur Forest, Squirtle Ocean, Pikachu Volt, Gengar Midnight, Eevee Sunset, Articuno Glacier, Team Rocket — 9 total) with animated sprite previews, plus toggles for sound, particles, screen shake, floating text, reduce-motion, and 3 number formats (1.5M / full / scientific). All persisted in your save. |
| **Trainer Level** | Level grows with lifetime earnings (progress bar in the stats column). |
| **Pokédex** | Full 29-slot grid: unseen species show as silhouettes, caught ones show rarity, shinies sparkle. |
| **Autosave** | Saves to `localStorage` every **10 seconds**, on tab-hide and on exit. Offline earnings at 50% rate, capped at 8 hours. "Reset Save" in the header wipes everything. |
| **Numbers** | Formatted gracefully past a million: `1.5M`, `2.3B`, `T`, `Qa`… |

## Tech notes

- Tailwind CSS via CDN for utilities, with a full custom stylesheet so the layout
  stays intact even if the CDN is unreachable.
- Pure-CSS Pokéball (no image asset to break), `pointerdown` handling for mouse + touch,
  drift-corrected 100 ms income ticks, and shop rows built once and updated in place.
