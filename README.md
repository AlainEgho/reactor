# Fission

*Fuel the core. Don't go critical.* A digging puzzle set in a nuclear plant, in one file. Open `index.html` to play. There is no build step for playing and no install.

Iso is a droid in a hazard-yellow shell. It digs through Graphite, collects enough fuel Pellets to start the Reactor, and keeps out from under falling Lead. Gammas patrol the corridors. A Neutron blown apart splits into nine Pellets.

The rules follow the classic game Supaplex, and Fission can play its `LEVELS.DAT` files (see below). Everything a player sees uses Fission's own names and art. The engine code still uses the classic tile names (`BASE`, `ZONK`, `MURPHY`…), so those files map tile for tile.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The game: engine, renderer, menus. The level list inside it is generated, so don't edit that block by hand. |
| `levels/NNN-name.txt` | One file per Fission level: a short header, `---`, then the map. These are the source of truth. |
| `build.mjs` | Checks every level file and writes the level list into `index.html`. |
| `tools/design-batch-1.mjs` … `design-batch-7.mjs` | One-off scripts that drew levels 010–019, 020–034, 035–049, 050–080, 081–111, and the bonus sets 112–121 (reactor wing) and 122–131 (lower plant). The `.txt` files have replaced them as the source. Running one again overwrites its levels. |
| `tools/board.mjs` | Drawing helpers the design scripts share: shapes, seeded scatter, Neutron farms, mazes, and a rough reachability check. |
| `tools/profile-set.mjs` | Profiles a level set by numbers only (counts, flags, Pellet targets), so new levels can follow the same difficulty curve. Writes no maps or names. |
| `tools/dat-export.mjs` | Exports a `LEVELS.DAT` to readable text files, for study. Keep the output out of `levels/`. |
| `tests/` | Engine tests, the search-based solver, the classic-file smoke test, and the browser smoke test. |

## Level file format

```
name: Free Fall
need: 13
hint: One sentence shown when the level starts.
gravity: on                      (optional)
freeze-zonks: on                 (optional; freezes the Lead)
special: 30,6 gravity on         (optional, repeatable; must sit on an airlock)
---
############################################################
#@......                                                   #
...
```

| Char | Tile | Char | Tile |
|---|---|---|---|
| space | empty | `S` | Gamma (patrols, kills on touch) |
| `.` | Graphite (dig through it) | `e` | Neutron (blow it up for nine Pellets) |
| `#` | Concrete (nothing breaks it) | `B` | Hot spot (Graphite that flares) |
| `R` | Cask (a blast breaks it; Lead rolls off it) | `o` | orange canister (blows when it lands) |
| `O` | Lead (falls and crushes) | `y` | yellow canister (blown by the Initiator) |
| `*` | Pellet | `d` | red canister (carry it, drop it as a bomb) |
| `@` | Iso | `T` | Initiator |
| `X` | Reactor (the exit) | `> < ^ v` | one-way airlocks |
| | | `-` `\|` / `+` | two-way / four-way airlocks |

## Arcade layer

The rules are the classic ones; everything below sits on top and never changes how a level plays.

- **Score.** A Pellet pays 100 × the combo; a Pellet taken within 2 s of the last one raises the combo. Red canister 50, a Neutron split 500, a destroyed Gamma 250, starting the Reactor 1,000, plus a time bonus of 5 points per second under 10 minutes. Best score per level in the grid, the total on the menu.
- **Stars.** Three per level: cleared; fast (under par: 30 s + 2 s per Pellet needed, +60 s on a full-size board); chain (a combo of ×5, or ×need on a tiny level). The win tally names the par and the chain goal.
- **Streak.** Levels cleared without dying, shown on the win tally and the menu; a death ends it.
- **Meltdown.** One run on floors made up as you go: 60 s on the clock, +2 s per Pellet, +10 s per floor finished; floors get bigger and add Hot spots (round 3), Gammas in sealed pockets (round 5) and orange canisters (round 7). At zero the core blows at Iso's feet. Best score and round are kept.
- **Juice.** Camera shake and a short freeze on blasts and deaths, flashes, particle bursts, a counting tally. All motion effects respect `prefers-reduced-motion`.

## Saved progress

Cleared levels, best times, best scores, stars, the streak, the best Meltdown run, the sound setting and the chosen set are saved in a `fission_progress` cookie that lasts 400 days and is renewed on every save. The format is compact (`v2~sound~set~fission~classic~streak.best~meltScore.meltRound`, each set as `level.bestSeconds.bestScore.stars` in base 36 joined by `_`), so even both full sets fit well under a cookie's 4 KB. A `v1` cookie from before scoring is still read.

Browsers ignore cookies on a page opened straight from disk (`file://`), so the same progress is also kept in `localStorage`. The cookie wins when both exist. A loaded `LEVELS.DAT` is too big for a cookie and stays in `localStorage` only.

## Classic levels

In the menu, choose **Classic** and load a `LEVELS.DAT` from your own copy of Supaplex. The file is read in the browser and remembered only in that browser. It is never copied into this folder or the published page.

## Commands

```
node build.mjs                                  # rebuild index.html after editing levels/
node tests/engine.test.mjs                      # rules, level checks, scripted solutions
node --max-old-space-size=6144 tests/solve-levels.mjs [from] [to]   # prove Fission levels can be won
node tests/original-levels.mjs path\to\LEVELS.DAT                   # load and smoke-test a classic set
node tests/ui-smoke.mjs [path\to\LEVELS.DAT] [screenshot dir]       # drive the page in Chromium
node build.mjs --artifact path\to\copy.html     # also write the copy used for publishing
```

`ui-smoke.mjs` borrows `playwright-core` from another local checkout. Set `PLAYWRIGHT_FROM` to a `package.json` whose project has it installed.
