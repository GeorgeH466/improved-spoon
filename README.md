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
| **Achievements** | 15 unlockables, from *First Click!* to *Poké Billionaire* — now including *Sharpshooter*, *Shiny Hunter* and *Legend Tamer*. |
| **Bulk buying** | Shop has a ×1 / ×10 / ×100 toggle with true geometric bulk pricing. |
| **Trainer Level** | Level grows with lifetime earnings (progress bar in the stats column). |
| **Pokédex** | Full 29-slot grid: unseen species show as silhouettes, caught ones show rarity, shinies sparkle. |
| **Autosave** | Saves to `localStorage` every **10 seconds**, on tab-hide and on exit. Offline earnings at 50% rate, capped at 8 hours. "Reset Save" in the header wipes everything. |
| **Numbers** | Formatted gracefully past a million: `1.5M`, `2.3B`, `T`, `Qa`… |

## Tech notes

- Tailwind CSS via CDN for utilities, with a full custom stylesheet so the layout
  stays intact even if the CDN is unreachable.
- Pure-CSS Pokéball (no image asset to break), `pointerdown` handling for mouse + touch,
  drift-corrected 100 ms income ticks, and shop rows built once and updated in place.
