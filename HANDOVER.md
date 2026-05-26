# HANDOVER

## Current task

Storageworker central tunnel shaking fix completed by Codex. No further implementation task active.

## Platform recommendation

Use the existing project as-is. All JS is vanilla browser script, loaded via `<script>` tags in `index.html`. Load order matters — see dependency notes below.

## Files changed (this diff)

**JS (behavior):**
- `js/state.js` — added `storage` chamber object, `carryingFood[]` on player/ants, `storagePile[]`/`storagePiles{}` on colony, `queenFeedTimer`/`queenHungry`, `gardenPuddles[]`, `storageworker` role in role counts
- `js/colony.js` — new food storage pipeline: `depositFoodToStorage`, `sortOneStoredFood`, `takeFoodForQueen`, `feedQueenStoredFood`; `getEggFoodRequirement` fixed at 5; `ensureMinimumRolePopulation`; multi-food carry helpers (`addFoodToCarrier`, `canCarryMoreFood`, `getCarriedFoodCount`)
- `js/ants.js` — `storageworker` role AI (sorting, taking/delivering queen food, patrolling); ant hunger system (`hungerTimer`, `eatTimer`); foraging room selection (`chooseForageRoom`); `shouldUseNestStuckRecovery`; navigation clearance 8→14; delivering now targets `storage` not `queen`; slot-index fix for `getStorageWorkPoint`/`getStorageMealPoint`
- `js/world.js` — `crumbPalette` (5 food types: seed, berry, leaf, petal, grain); `getCrumbStyle/Color/Highlight`; garden puddles block crumb spawning; `gardenPuddles` drawing; sprinkler decoration; richer flower rendering; frog replaces spider #3
- `js/nest.js` — `storage` and `nursery` chambers now circular; chamber gateways; `drawStorageChamberContents`; `drawNestDirtTexture`; tunnel routes updated; `moveNestEntity` fast-path for unblocked moves; improved `findNearestNestSafeSpot`
- `js/save.js` — normalizes `carryingFood`, `storageworker` role migration, calls `normalizeStorageState`/`normalizeAntHungerState`/`ensureMinimumRolePopulation`/`normalizeEnemyState` on load
- `js/player.js` — multi-crumb pickup (up to 3); deposit to `storage` not `queen`; `carryingFood[]` cleared on reset/deposit
- `js/drawing.js` — `drawCarriedFoodStack` (shows up to 3 colored crumbs); typed crumb colors; `storageworker` visual marker; action button shows `Food X/3`
- `js/collision.js` — `resolveGardenPuddles` blocks player/ants at puddles; frog/`canEnterPuddles` entities bypass; `getWorkerTrailForageRadius` 360→520
- `js/lifecycle.js` — `spawnHelperAnt` → `spawnStartingColonyAnts` (spawns soldier, middenworker, storageworker, nurse); `carryingFood[]` cleared on death reset; `ensureMinimumRolePopulation` called on death
- `js/spiders.js` — `getEnemyLabel`; `normalizeEnemyState` for frog; `drawFrog`

**Assets:**
- All PNGs recompressed (significant size reduction: e.g. backyard 4MB→408KB)
- `sw.js` cache version v10→v18

## Script load order (dependency-sensitive)

```
state.js → collision.js → world.js → colony.js → player.js → ants.js
→ spiders.js → nest.js → drawing.js → lifecycle.js → ... → save.js → main.js
```

`crumbPalette` is declared in world.js and used in colony.js (`normalizeStorageState`) — load order is correct.

## Known risks

### Fixed this handoff

**Storageworker shaking against central nest tunnel wall** (`js/ants.js`, `getNextNestWaypoint`) — fixed.

First fix (patrol slot index) was correct but exposed a deeper, pre-existing navigation bug.

Root cause: `getNextNestWaypoint` sets `ant.nestRouteIndex = 1` when a route is first computed, skipping the start node and immediately targeting the second node in the path. The false assumption is that the ant is already *at* the start node — it is only *visible to* it, which can mean 30–40px away. When a storageworker is hardReset into the central entrance tunnel (~1095, 490) and recomputes its route, the nearest visible node is the junction (1080, 520), and the 2-node path is `[junction → storage]`. With `nestRouteIndex = 1`, the ant immediately aims at storage (1390, 610) — a direction that points through the right wall of the diagonal central tunnel. The blocked handler clears the route, recomputes, gets the same result, and the ant shakes at 60fps.

**Fix applied in `js/ants.js`:**
- In `getNextNestWaypoint`, changed `ant.nestRouteIndex = 1;` to `ant.nestRouteIndex = 0;`
- This makes the ant navigate to its nearest visible node first before advancing to the next waypoint. The existing `distance < 24` advance loop handles the rest correctly.

Note: this bug affects all ant roles, but is most visible on storageworkers because they are hardReset into the central tunnel more often than other nest-only roles.

### Fixed in previous handoff

**Storageworker patrol slot cycling** (`js/ants.js`) — fixed.
`getStorageWorkPoint` and `getStorageMealPoint` used `performance.now()` in their index, cycling targets every 3–5 seconds and invalidating the nav route cache mid-navigation. Fixed by using `ant.id % slots.length` only.

### Medium priority
1. **`ensureMinimumRolePopulation` on save load** — Loading an old save will silently spawn up to 4 ants if any NPC role is missing. Expected behavior but may surprise players who saved with a small colony.
2. **Multi-step queen feeding pipeline** — If the storageworker dies and isn't replaced before `queenFeedTimer` runs out, egg production stalls. `ensureMinimumRolePopulation` on death mitigates this but does not guarantee instant replacement.
3. **Navigation clearance change (8→14)** — `isNestWalkable` adds clearance to corridor width (not subtract), so higher clearance makes tunnels MORE lenient in LOS checks. Risk is lower than originally assessed; not a cause of any known bug.

### Low priority
4. **`normalizeCarryingFood` for `queen_food`** — Returns the raw food object (not an array) for ants mid-delivery after a save/load. `drawCarriedFoodStack` wraps it correctly; no crash, but carry state is briefly inconsistent until delivery completes.
5. **`nursery.rx` used for `inNursery` check in ants.js** — After the change, `nursery.rx = 96` (was 132), shrinking the nurse's at-rest zone from ~90px to ~65px. Intentional but nurses may oscillate at the zone boundary more than before.
6. **HUD `foodDisplay` shows `colony.food`** — Counter only increments when a storage worker feeds the queen, not on deposit. Players see `Food: 0` until a storage worker acts. Objective text shows `Stored: X` to compensate but may confuse new players.

## Tests performed

- `node --check` passed on all 11 modified JS files (no syntax errors)
- `node --check js/ants.js` passed after the storageworker slot-index fix
- `node --check js/ants.js` passed after the nest route index fix
- Diff reviewed in full — no obvious runtime errors found
- Image compression verified via git diff --stat

## Next recommended action

Play-test the storageworker route fix, then resume the goals backlog.

**Goals backlog (not yet started):**
1. Frog redesign — believable appearance, jumping locomotion
2. Beetles — new enemy type across all outdoor rooms
3. Dead enemies become food — workers drag corpses to storage, worth 5 food each
4. Dead enemy corpse resizing — shrink to fit nest tunnels when being dragged

## Prompt for Codex

No pending Codex implementation prompt.
