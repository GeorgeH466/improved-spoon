# PokéClicker 🖱️⚪

A Pokémon-themed homage to Cookie Clicker — click the Pokéball, earn PokéDollars ($),
buy automated catchers & buildings, catch wild Pokémon every 100 clicks, evolve your
output with Evolution Stones, and prestige for Gym Badges.

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
| **Catch 'em** | Every **100 manual clicks** a random wild Pokémon is caught (30 species, real sprites). Each catch = permanent **+1% DPS**; duplicates count. Tracked in your Pokédex. |
| **Evolution Items** | One-time stones ×2 a building type: Thunder→Launchers, Leaf→Catchers, Water→Daycare, Fire→Gyms, Moon→Silph Labs, plus Rare Candy ×2 click power. |
| **Prestige** | Reset dollars/buildings/stones for **Gym Badges** (1 per $1M earned that run), each worth a permanent **+10%** to all earnings. Pokédex & achievements survive. |
| **News ticker** | Rotates every 15 seconds; catches, evolutions and prestiges push their own headlines. |
| **Achievements** | 10 unlockables, from *First Click!* to *Poké Billionaire*. |
| **Autosave** | Saves to `localStorage` every **10 seconds**, on tab-hide and on exit. Offline earnings at 50% rate, capped at 8 hours. "Reset Save" in the header wipes everything. |
| **Numbers** | Formatted gracefully past a million: `1.5M`, `2.3B`, `T`, `Qa`… |

## Tech notes

- Tailwind CSS via CDN for utilities, with a full custom stylesheet so the layout
  stays intact even if the CDN is unreachable.
- Pure-CSS Pokéball (no image asset to break), `pointerdown` handling for mouse + touch,
  drift-corrected 100 ms income ticks, and shop rows built once and updated in place.
