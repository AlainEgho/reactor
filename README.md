# Fission

*Fuel the core. Don't go critical.* A digging puzzle set in a nuclear plant, in one file. Open `index.html` to play. There is no build step for playing and no install.

Iso is a droid in a hazard-yellow shell. It digs through Graphite, collects enough fuel Pellets to start the Reactor, and keeps out from under falling Lead. Gammas patrol the corridors. A Neutron blown apart splits into nine Pellets.

The rules follow the classic game Supaplex, and Fission can play its `LEVELS.DAT` files (see below). Everything a player sees uses Fission's own names and art. The engine code still uses the classic tile names (`BASE`, `ZONK`, `MURPHY`…), so those files map tile for tile.

## Upgrades

Levels 132–141, the Upgrade Wing, add nine things a classic level file cannot contain, so the first 131 levels and every classic set play exactly as before. Three are **gadgets**: Iso has one gadget slot, the last pickup equips it, and `Shift` (the Gadget button on phones) spends a charge. Six are **tiles**.

| Pickup / tile | Char | What it does |
|---|---|---|
| Thruster | `J` | `Shift` + direction dashes through open space until something blocks. Lifts Iso out of a pit when gravity is on. 3 charges. |
| Tractor | `%` | `Shift` + direction steps Iso one cell and drags the Lead ball or canister behind it into the cell it left. 3 charges. |
| Stasis | `Z` | `Shift` freezes every Gamma, Drone and falling object for 5 s. 1 charge. |
| Teleport pad | `W` | Step in and come out beside the next pad on the level (reading order, wrapping), on the side you were travelling if it is free. |
| Blast door | `D` | A wall until Iso carrying a Keycard walks in; one card per door. Blast-proof. |
| Keycard | `K` | Opens one door. Counted on the HUD. |
| Laser emitter | `l` `i` | Pulses a beam along its row (`l`) or column (`i`): live 1 s in every 4. The beam stops at the first solid thing; Iso, Gammas and Drones in it are blown up, a Neutron is split. |
| Drone | `G` | Hunts Iso through open space, one step every other tick, and cannot dig. Dies like a Gamma. |
| Fuel rod | `U` | Worth three Pellets; falls and rolls like one, and crushes. |
| Shield | `H` | Takes one hit (blast or touch) for Iso; whatever hit it is destroyed. |

A second pickup of the same gadget adds its charges; a different gadget replaces the slot. Keycards, gadgets and the Shield score 50, 50 and 100 points. Meltdown adds them from round 2 on (rods and a Thruster), with a Shield at 3, Drones and Stasis at 4, teleport pads at 5 and lasers from 6.

## The Element Wings

Levels 142–241 add a hundred floors in four wings of twenty-five: the **Physics Wing** (142–166), the **Chemistry Wing** (167–191), the **Nuclear Wing** (192–216) and the **Deep Core** (217–241), which mixes everything. Each wing opens with hand-drawn levels that introduce one idea at a time, then builds up to a finals level. Twenty-two new tiles and two level options come with them; none of it changes how the first 141 levels or a classic set play.

**Physics**

| Tile | Char | What it does |
|---|---|---|
| Ice | `I` | A floor. Step on it and Iso slides until he leaves the ice or something stops him; input is ignored meanwhile. Pellets, pickups and the Reactor are taken in passing; Graphite stops the slide. |
| Conveyor belt | `[` `]` | Carries whatever rests on it (Lead, Pellets, canisters, crates, Iso) one cell left or right every other tick. Blast-proof. |
| Magnet | `M` | Every other tick, pulls the nearest Lead, Fuel rod or Plutonium in each direction one cell closer through open space, up to six cells away. A ball under a magnet or touching it is held; one dragged sideways still drops where the floor ends. Blast-proof. |
| Mirror | `/` `\` | Turns a laser beam through a right angle. Pushes in all four directions, one tick a push. A blast breaks it. |
| Switch | `s` | Walking into it, or Lead landing on it, flips every Gate on the level. Blast-proof. |
| Gate | `g` `q` | Closed (`g`) it is a wall; open (`q`) Iso steps through it to the cell beyond, like an airlock. Blast-proof. |
| Crate | `c` | Pushes in all four directions and never falls. Stops a beam; a blast breaks it. |
| Alpha particle | `A` `V` | Flies straight (rightward or downward to start), turns round when it hits anything, kills Iso on contact. Dies like a Gamma, worth 250. |

**Chemistry**

| Tile | Char | What it does |
|---|---|---|
| Acid | `a` | Dissolves anything that falls in, and Iso if he steps in. Never fills. A blast clears it. |
| Fuse | `,` | Lies in the Graphite and can be eaten (that cuts it). A blast, a laser beam or a neutron lights it; the fire runs cell to cell and sets off every canister, Neutron and Plutonium it touches. |
| Coolant | `~` | Liquid sodium. Creeps into an open neighbour every 2 s per cell, swallows what falls in, and cannot be dug. When no cell of it borders open floor or Graphite it sets into Graphite. A blast clears it. |
| Hydrogen cell | `F` | Rises through open space and bursts where it stops. Pushes sideways; Lead landing on it, a beam or a blast sets it off. |
| Antipellet | `!` | Looks like a violet Pellet with a minus. Taking one cancels a Pellet (never below zero). Falls and rolls like a Pellet. |
| Fallout | `r` | A floor. Every tick Iso stands on it raises his dose (the HUD shows it); at full dose he dies. Off it the dose drains. |
| Iodine pill | `p` | Clears the dose and blocks it for 10 s. |

**Nuclear**

| Tile | Char | What it does |
|---|---|---|
| Plutonium | `P` | Falls, rolls and crushes like Lead and pushes like it. Two spheres at rest side by side go critical: a fission blast that leaves Pellets, and the neighbour follows. A blast, a beam or a neutron splits one too. |
| Isotope pellet | `h` | Worth two Pellets, but it decays: 50 s after the level starts it is gone. Its ring shows the time left. |
| Neutron gun | `N` | Gadget, 3 charges. `Shift` + direction fires along the line to the first thing it meets: enemies, canisters, Casks, crates and mirrors blow up; a Neutron or Plutonium is split; a fuse is lit. |
| Quantum tunnel | `Q` | Gadget, 3 charges. `Shift` + direction takes Iso through one solid cell when the cell beyond is open. |
| Air tank | `t` | On a level with an `air:` header, adds 30 s of air. |
| Lamp | `L` | On a `dark: on` level, each Lamp carried widens the light by two cells. |

Two level headers go with them: `air: 40` gives Iso forty seconds of air (the HUD counts it down; at zero the suit is empty), and `dark: on` lights only a few cells around Iso. Meltdown brings the new tiles in by round: isotopes at 2, crates at 3, acid, antimatter and a Neutron gun at 5, Alphas at 6, Plutonium, hydrogen and a tunnel at 7, fallout and iodine at 8, magnets at 9 and coolant from 10.

## The Gamma Wing

Levels 242–253 are twelve floors about Gammas, built on the Gamma patterns of the classic game in new layouts. No new tiles: the wing plays on one rule. A Gamma keeps the wall on its left, so a Gamma beside a post circles it forever and never turns into an opening on its right. A Pellet on a post is therefore a Pellet *inside* the Gamma's circle.

| Level | Pattern |
|---|---|
| 242 Orbit | One Gamma circling each Pellet post. Dig up to the ring, let it pass, reach in. |
| 243 Sleepers | Gammas sealed in the Graphite beside Pellets. Opening a Gamma's cell sets it loose in your tunnels. |
| 244 The Compound | Vaults of Pellets behind airlocks, each ringed by a train of Gammas; each vault's train is busier than the last. |
| 245 Run For Life | Fifty Gammas sealed along the floor with the last Pellets lying on them. Each one taken lets a Gamma out. |
| 246 Carousel | Long shelves of Pellets with trains of two to four Gammas going round. |
| 247 Hornets' Nest | A Cask hall of guarded posts, airlocks in, red canisters to thin the Gammas. |
| 248 Head Count | Tall posts with two or three Gammas to a ring. |
| 249 Clockwork | An open hall of Graphite islands, a Gamma round each, Pellets on top. |
| 250 Inner Sanctum | Past the ring, the vault's Pellets lie beside sleeping Gammas. |
| 251 Shuttle Run | Six long lanes with one Gamma shuttling in each and Pellets in floor niches. Every lane is walked end to end. |
| 252 Rush Hour | The Reactor sits in a vault behind two rings that take different times to go round. One Stasis. |
| 253 Gamma Finals | All of the above on one floor. |

## The Classic Wing

Levels 254–265 each take one piece of puzzle logic from the classic game and build a new floor round it. Again no new tiles: every level uses tiles the first 131 levels already have.

| Level | Classic logic |
|---|---|
| 254 Bang | Each Pellet is caged in Casks with a Gamma pocketed beside it. Drop the Lead above the pocket onto the Gamma and its blast breaks the cage; drop it at the wrong moment and the Gamma gets out. |
| 255 No Pellets | Not one Pellet on the floor. Every one comes from a Neutron in a pocket, fed a Lead ball; half the balls must be pushed over first. |
| 256 Shaft Drop | A Neutron runs up and down each Cask shaft under a Lead ball. Drop it while the Neutron is low. |
| 257 Demolition Count | Seven red canisters for six pairs of capsules and the sealed Reactor. One in the gap between a pair opens both; none spare. |
| 258 Up and Down | Gravity on, start at the bottom, Reactor at the top. Climbing eats the Graphite, so every column climbed is only a way down afterwards. |
| 259 Terminal | Push each yellow canister against a cage, then one press of the Terminal blows them all. |
| 260 Orange Drop | Push orange canisters off ledges down open shafts; each blows the roof off the cage it lands on. |
| 261 Hot Spot Field | Pellets buried in bands of Hot spots. Cross on the cold ones. |
| 262 Airlock Maze | One-cell rooms joined by airlocks, many of them one way; the Pellets are in the gaps. |
| 263 Silos | Cask silos packed with Lead and Pellets. Take a floor cell from the side and the silo pours out. |
| 264 Chain Reaction | Sealed tubes of Neutrons. One canister at a tube's corner splits the whole line into Pellets. |
| 265 Classic Finals | Most of the above on one floor, with just enough canisters. |

## What's here

| Path | What it is |
|---|---|
| `index.html` | The game: engine, renderer, menus. The level list inside it is generated, so don't edit that block by hand. |
| `levels/NNN-name.txt` | One file per Fission level: a short header, `---`, then the map. These are the source of truth. |
| `build.mjs` | Checks every level file and writes the level list into `index.html`. |
| `tools/design-batch-1.mjs` … `design-batch-13.mjs` | One-off scripts that drew levels 010–019, 020–034, 035–049, 050–080, 081–111, the bonus sets 112–121 (reactor wing) and 122–131 (lower plant), the Element Wings' generated levels: 149–166 (batch 8), 173–191 (batch 9), 198–216 (batch 10) and 217–241 (batch 11), the Gamma Wing, 242–253 (batch 12), and the Classic Wing, 254–265 (batch 13). The `.txt` files have replaced them as the source. Running one again overwrites its levels. Levels 132–141 (the Upgrade Wing) and the wing introductions 142–148, 167–172 and 192–197 were drawn by hand. |
| `tools/board.mjs` | Drawing helpers the design scripts share: shapes, seeded scatter, Neutron farms, mazes, Alpha lanes, belts, rinks, pools, hydrogen stores, and a rough reachability check. |
| `tools/needs.mjs`, `tools/tighten-needs.mjs` | The tightened Pellet needs. Every level asks for close to what the search player proved it can collect: one Pellet in twenty spare, never more than the engine test's supply count. `tighten-needs` turns a `--most` probe log into the table and writes it into the level files; `Board.save()` reads the table, so redrawing a generated set keeps them. |
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
air: 40                          (optional; seconds of air, see the Element Wings)
dark: on                         (optional; only a few cells around Iso are lit)
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

The upgrade tiles (`J % Z W D K l i G U H`) are listed under **Upgrades** above and the Element Wings' tiles (`I [ ] M / \ s g q c A V a , ~ F ! r p P h N Q t L`) under **The Element Wings**. `build.mjs` counts a Fuel rod as three Pellets of supply, an Isotope pellet as two and a pair of Plutonium spheres as nine, and refuses a level with a single teleport pad, gates without a switch, a switch without gates, air tanks without an `air:` header or lamps without `dark: on`.

## Arcade layer

The rules are the classic ones; everything below sits on top and never changes how a level plays.

- **Score.** A Pellet pays 100 × the combo; a Pellet taken within 2 s of the last one raises the combo. Red canister 50, a Neutron split 500, a destroyed Gamma 250, starting the Reactor 1,000, plus a time bonus of 5 points per second under 10 minutes. Best score per level in the grid, the total on the menu.
- **Stars.** Three per level: cleared; fast (under par: 30 s + 2 s per Pellet needed, +60 s on a full-size board); chain (a combo of ×5, or ×need on a tiny level). The win tally names the par and the chain goal.
- **Streak.** Levels cleared without dying, shown on the win tally and the menu; a death ends it.
- **Meltdown.** One run on floors made up as you go: 60 s on the clock, +2 s per Pellet, +10 s per floor finished; floors get bigger and add Hot spots (round 3), Gammas in sealed pockets (round 5), orange canisters (round 7), the upgrades and the Element Wings' tiles (see above). At zero the core blows at Iso's feet. Best score and round are kept.
- **Categories.** The Fission tab opens on eleven category cards: four sectors of the main plant (Fuel Hall 1–33, Turbine Hall 34–66, Coolant Works 67–99, Containment 100–131), then the Upgrade, Physics, Chemistry and Nuclear Wings, the Deep Core, the Gamma Wing and the Classic Wing. Each card shows its range, what it is about, a progress bar and its stars; Continue (or `Enter`) plays the first uncleared level. A category lists only its own levels; `Enter` there plays its next uncleared one and `Esc` goes back. **Levels** during play opens the category being played. The categories are the `CATS` table in `index.html`, and each wears the theme with the same index.
- **Components.** The **Components** tab (or the button beside Continue) lists all 46 components, each drawn in the colours of the category that brings it in, with what it does and a link to the first level that has it. The level each one first appears in is found by scanning the levels, so it stays right when levels change. The text is the `PARTS` table in `index.html`. Each category card also shows a miniature of its showcase level (the window of it with the most kinds of thing in it, drawn with the game's own sprites) and a row of the components it brings in, or, when it brings in nothing new, the ones it uses most.
- **Colour themes.** Every part of the plant has its own floor and wall colours: the main plant runs through steel blue (1–33), teal (34–66), amber (67–99) and rust (100–131), then the Upgrade Wing is green, Physics cyan, Chemistry lime, Nuclear yellow, Deep Core crimson, Gamma violet and Classic sand. Classic files and Meltdown rounds take the themes in turn. Each level card in the menu carries its wing colour on the left edge. The themes are the `THEMES` table in `index.html`.
- **Motion.** Nothing on the floor is lit beyond what the tiles draw themselves; the life is in how things move. Iso eases into each step, leans into sidesteps, breathes when standing and chomps as he bites; Graphite throws chips in the floor's colour when it is eaten; Lead, Plutonium and orange canisters roll a quarter turn per cell, stretch a little as they fall and land with a squash and a puff of dust; each Pellet taken flies up to the counter, which bumps as it arrives; Gammas, Drones and Alphas turn smoothly; an airlock's wheel spins after Iso passes, a blast door slides open, gates swing on a switch and the Reactor's iris opens when it comes online. Every level opens on a title strip in its category's colour while the floor builds in from Iso outward (any key skips it). A death drains the colour from the board and slows the clock before the dialog rises; the finale pulls the camera in and the tally's rows and stars arrive one by one with a chime each; pause blurs the board. A generated score plays underneath (**Music** or `M` turns it off; that choice is kept in this browser only).
- **Sound.** Everything is synthesized, through a small mixer: effects and music on their own buses, a short generated room, a limiter on the way out. Effects sit in the stereo field where they happen on the board; digging crunches and never sounds quite the same twice; steps on open floor are soft footfalls; landings sound by weight (Lead and Plutonium heavy, a Rod lighter, a Pellet light). The score is made up as it plays and has a key and mode per part of the plant; it thickens as the Pellet count nears the need, a dry pulse creeps in while a Gamma, Neutron, Drone or Alpha is close, the Reactor coming online brightens it and adds a hum and a kick, and it ducks under a death, the finale and the dialogs. Menu buttons tick, and categories open and close with a breath of air.
- **Juice.** Camera shake and a short freeze on blasts and deaths, flashes, particle bursts, a counting tally, a rolling score. **Reduced motion:** when the system asks for it (and it is read live), all of the above is off or still: linear movement, no chips, dust, flights, intro build-in, slow motion, zoom, blur or dialog animation; the intro strip and the colour change on death stay, flashes are short and faint, and nothing on a sprite wobbles or spins.
- **Phone.** On a touch screen a d-pad and two buttons (Gadget, Snap · Drop) sit under the board, and the board itself takes swipes: drag and Iso walks that way until the finger lifts, turning as the drag turns; a quick tap on a cell next to him snaps at it. Short haptic pulses mark digging, landings, blasts, death and the finale on devices that vibrate. The HUD collapses to icons and values at phone width.

## Saved progress

Cleared levels, best times, best scores, stars, the streak, the best Meltdown run, the sound setting and the chosen set are saved in a `fission_progress` cookie that lasts 400 days and is renewed on every save. The format is compact (`v2~sound~set~fission~classic~streak.best~meltScore.meltRound`, each set as `level.bestSeconds.bestScore.stars` in base 36 joined by `_`), so even both full sets fit well under a cookie's 4 KB. A `v1` cookie from before scoring is still read.

Browsers ignore cookies on a page opened straight from disk (`file://`), so the same progress is also kept in `localStorage`. The cookie wins when both exist. A loaded `LEVELS.DAT` is too big for a cookie and stays in `localStorage` only.

## Classic levels

In the menu, choose **Classic** and load a `LEVELS.DAT` from your own copy of Supaplex. The file is read in the browser and remembered only in that browser. It is never copied into this folder or the published page.

While a file is loaded, every Fission category gains **bonus floors**: the file's levels from the eleventh on (the first ten are warm-ups), each flipped left to right, built in the browser from the file (airlock arrows and lying two-cell Casks swap sides; nothing else changes), dealt out in order across the eleven categories, nine or ten each, and listed under each category's own levels with a silver mark. They are the hardest floors in the game. Gammas keep the wall on their left, so on a mirrored floor every patrol runs the other way round and no remembered route works, and par for the fast star is seven tenths of the usual time. A bonus floor wears its category's colours and music; its progress is kept apart from the Classic set's. `Enter` on a category page plays its next uncleared level, then its next uncleared bonus floor.

## Commands

```
node build.mjs                                  # rebuild index.html after editing levels/
node tests/engine.test.mjs                      # rules (classic, upgrades, Element Wings), level checks, scripted solutions
node tools/design-batch-11.mjs                  # redraw one generated set (overwrites its levels/*.txt)
node --max-old-space-size=6144 tests/solve-levels.mjs [from] [to]   # prove Fission levels can be won
node --max-old-space-size=6144 tests/solve-levels.mjs [from] [to] --most > most.log   # how many Pellets each level gives up
node tools/tighten-needs.mjs most.log           # raise needs to match (no log: apply tools/needs.mjs)
node tests/original-levels.mjs path\to\LEVELS.DAT                   # load and smoke-test a classic set
node tests/ui-smoke.mjs [path\to\LEVELS.DAT] [screenshot dir]       # drive the page in Chromium
node build.mjs --artifact path\to\copy.html     # also write the copy used for publishing
```

`ui-smoke.mjs` borrows `playwright-core` from another local checkout. Set `PLAYWRIGHT_FROM` to a `package.json` whose project has it installed.
