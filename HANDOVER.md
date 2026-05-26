# HANDOVER

## Current task

Game file-size optimization audit completed by Codex. No implementation change active.

## Platform recommendation

Use the existing project as-is. All JS is vanilla browser script, loaded via `<script>` tags in `index.html`. Load order matters — see dependency notes below.

## Files changed (this diff)

**JS (behavior):**
- `js/state.js` — added `storage` chamber object, `carryingFood[]` on player/ants, `storagePile[]`/`storagePiles{}` on colony, `queenFeedTimer`/`queenHungry`, `gardenPuddles[]`, `storageworker` role in role counts
- `js/colony.js` — new food storage pipeline: `depositFoodToStorage`, `depositEnemyCorpseToStorage`, `sortOneStoredFood`, `takeFoodForQueen`, `feedQueenStoredFood`; `getEggFoodRequirement` fixed at 5; `ensureMinimumRolePopulation`; multi-food carry helpers (`addFoodToCarrier`, `canCarryMoreFood`, `getCarriedFoodCount`)
- `js/ants.js` — `storageworker` role AI (sorting, taking/delivering queen food, patrolling); ant hunger system (`hungerTimer`, `eatTimer`); foraging room selection (`chooseForageRoom`); enemy corpse recovery job; `shouldUseNestStuckRecovery`; navigation clearance 8→14; delivering now targets `storage` not `queen`; slot-index fix for `getStorageWorkPoint`/`getStorageMealPoint`
- `js/world.js` — `crumbPalette` (5 food types: seed, berry, leaf, petal, grain); `getCrumbStyle/Color/Highlight`; garden puddles block crumb spawning; `gardenPuddles` drawing; sprinkler decoration; richer flower rendering; frog replaces spider #3; beetle spawn helpers for ids 4-7
- `js/nest.js` — `storage` and `nursery` chambers now circular; chamber gateways; `drawStorageChamberContents`; `drawNestDirtTexture`; tunnel routes updated; `moveNestEntity` fast-path for unblocked moves; improved `findNearestNestSafeSpot`; enemy corpse carry added to route recovery preference
- `js/save.js` — normalizes `carryingFood`, `storageworker` role migration, calls `normalizeStorageState`/`normalizeAntHungerState`/`ensureMinimumRolePopulation`/`normalizeEnemyState` on load; calls `ensureBeetleSpawns` so old saves receive beetles; drops in-progress enemy corpse carries on load
- `js/player.js` — multi-crumb pickup (up to 3); enemy corpse pickup/deposit; deposit to `storage` not `queen`; `carryingFood[]` cleared on reset/deposit
- `js/drawing.js` — `drawCarriedFoodStack` (shows up to 3 colored crumbs); carried enemy corpse marker; typed crumb colors; `storageworker` visual marker; action button shows `Food X/3`
- `js/collision.js` — `resolveGardenPuddles` blocks player/ants at puddles; frog/`canEnterPuddles` entities bypass; `getWorkerTrailForageRadius` 360→520
- `js/lifecycle.js` — `spawnHelperAnt` → `spawnStartingColonyAnts` (spawns soldier, middenworker, storageworker, nurse); `carryingFood[]` cleared on death reset; `ensureMinimumRolePopulation` called on death
- `js/spiders.js` — `getEnemyLabel`; `normalizeEnemyState` for frog, beetle, and corpse state; `drawFrog`; `drawBeetle`; corpse rendering/despawn/respawn flow; restores enemy home room before respawn; frog jump state machine (`idle`, `crouching`, `leaping`, `landing`)

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

**File-size optimization audit** — completed, no gameplay files changed.

Findings:
- No tracked junk/backup/temp files were found outside `.git`.
- All tracked PNGs, MP3s, and JS files are referenced by `index.html`, `manifest.webmanifest`, `sw.js`, or runtime JS.
- Biggest assets are `morning meadow.mp3` (~3.46MB), `title_screen.png` (~2.77MB), `app_icon.png` (~743KB), and the room/gateway PNGs (~278-432KB each).
- Windows built-in PNG re-save was tested on copies. It saved only 13 bytes on most PNGs and made `title_screen.png` larger, so it was not applied.

Recommended next action:
- Use dedicated asset tools (`ffmpeg` for MP3 bitrate reduction; `oxipng`/`pngquant` or WebP conversion for images) or ask Claude to review a broader PWA asset/cache strategy before changing shipped asset formats.

### Fixed this handoff

**Enemy corpse food has a dedicated storage pile** (`js/colony.js`, `js/nest.js`) — implemented.

Enemy corpse deposits now bypass the unsorted storage buffer and add 5 `"corpse"` food items directly to `colony.storagePiles["corpse"]`. `normalizeStorageState()` guarantees the corpse pile exists, `getStoredPileTypes()` exposes it to the existing queen delivery pipeline, and `getStoragePilePoint("corpse")` pins it to the bottom of the storage chamber. `drawStorageChamberContents()` renders corpse food as dark flattened ovals so it is visually distinct from regular crumb food.

### Fixed this handoff

**Storage food drain — ants eating queen food** (`js/colony.js`) — fixed.

Root cause: `takeFoodForAntMeal()` called `getAvailableQueenFoodType()` first, consuming from `colony.storagePiles` (the sorted, queen-destined food) before the unsorted `colony.storagePile` buffer. With 8+ ants each eating every 75–130 seconds, the sorted pile was drained faster than the storageworker could replenish it, leaving the queen unable to be fed.

Fix applied:
- `takeFoodForAntMeal()` now tries `colony.storagePile` (unsorted) first.
- Falls back to `colony.storagePiles` only if the unsorted buffer is empty AND `colony.queenHungry` is false.
- Sorted food is now reserved for the queen whenever she is hungry.

### Fixed this handoff

**Worker wall-sticking after enemy corpse target disappears** (`js/ants.js`) — fixed.

Root cause: workers with `job === "recovering_enemy_corpse"` had no direction fallback when their corpse target became invalid, so they could keep a stale job until the reset timer fired. The early nest corpse recovery path also assigned the job without rechecking that the found corpse was still unclaimed.

Fix applied:
- `chooseHelperDirection()` now clears stale enemy-corpse targets and sends the worker back to the appropriate nest/outdoor recovery job when no valid corpse route applies.
- The early nest worker corpse check now confirms the corpse still exists and has no carrier before assigning `recovering_enemy_corpse`.

### Fixed in previous handoff

**Player taking damage inside the nest** (`js/spiders.js`) — fixed.

Root cause: enemy corpses follow their carrier by setting `enemy.roomId` to the carrier's current room. When a corpse was delivered to storage, `startEnemyRespawn()` cleared corpse state and started the respawn timer while leaving `roomId = "nest"`. When the timer finished, `respawnSpider()` made the enemy alive in the nest, allowing the shared enemy contact damage logic to hit the player inside the nest.

Fix applied:
- Added/normalized `homeRoomId` for enemies.
- `startEnemyRespawn()` restores `roomId` to the enemy's home outdoor room before starting the timer.
- `respawnSpider()` also restores `roomId` to the home room before reviving.
- `normalizeEnemyState()` relocates any already-live saved enemy found in the nest back to its home room and clears aggro/targets.

### Fixed in previous handoff

**Player can carry enemy corpses** (`js/player.js`, `js/save.js`) — fixed.

The original dead-enemy food implementation let worker ants recover enemy corpses, but the player had no pickup/deposit path. Codex added player support matching the worker flow:
- Player can claim nearby uncarried enemy corpses.
- Carried enemy corpse follows the player across room transitions.
- Player deposits enemy corpses at storage for the same 5 food value.
- Save/load drops in-progress player enemy corpse carries safely.

### Fixed in previous handoff

**Dead enemies become storage food** (`js/spiders.js`, `js/ants.js`, `js/colony.js`, `js/drawing.js`, `js/save.js`, `js/nest.js`) — implemented.

Enemy death now enters a corpse phase instead of immediately starting respawn. Corpses remain in the room for about 60 seconds if unclaimed, then start the normal respawn timer. Workers can recover spider/frog/beetle corpses, drag them to the storage chamber, and convert each corpse into 5 earthy food items in `colony.storagePile`.

Implementation notes:
- `killSpider` marks `corpse = true`, clears aggro/targets, and delays respawn.
- `startEnemyRespawn` clears corpse state and starts the normal 28-46s respawn timer.
- `drawSpiders` renders uncarried corpses flattened/on-side at 60% scale using existing enemy drawing functions.
- Worker ants use `recovering_enemy_corpse`, claim corpses with `corpseCarrierId`, carry generic corpse visuals, and deposit at storage.
- Save/load normalizes corpse fields, resets in-progress corpse carries, and avoids serializing ant `targetEnemyCorpse` references.

### Fixed in previous handoff

**Beetles not appearing from existing saves** (`js/world.js`, `js/save.js`) — fixed.

Root cause: beetles were added only in `spawnSpiders()`, which runs for new games. Existing saves restore the saved `spiders` array, so saves made before beetles existed loaded only the previous spiders/frog. `loadGame()` normalized existing enemies but did not add missing enemy ids.

Fix applied:
- `js/world.js`: moved beetle definitions into reusable spawn helpers and added `ensureBeetleSpawns()`.
- `js/save.js`: calls `ensureBeetleSpawns()` after loading and normalizing saved enemies.

Existing saves should now receive missing beetles ids 4-7 without resetting existing spider/frog state.

### Fixed in previous handoff

**Frog redesign and jumping locomotion** (`js/spiders.js`) — fixed.

Codex replaced the placeholder frog drawing with a small garden frog silhouette: squat rounded body, wide head, top-set eyes, folded back legs, pale belly, and wet-skin highlights. Frog enemy #3 now bypasses shared spider locomotion and uses a frog-only jump state machine:
- `idle`: waits 1.8-3.2 seconds.
- `crouching`: pauses for 0.25 seconds with compressed legs.
- `leaping`: interpolates directly to a random garden point 60-150px away over 0.3 seconds.
- `landing`: pauses for 0.5 seconds before idling again.

Landing targets are clamped inside `rooms.garden` with a 30px margin. Frog radius, aggro, combat, and respawn logic were intentionally left unchanged.

### Fixed earlier

**Storageworker shaking against central nest tunnel wall** (`js/ants.js`, `getNextNestWaypoint`) — fixed.

First fix (patrol slot index) was correct but exposed a deeper, pre-existing navigation bug.

Root cause: `getNextNestWaypoint` sets `ant.nestRouteIndex = 1` when a route is first computed, skipping the start node and immediately targeting the second node in the path. The false assumption is that the ant is already *at* the start node — it is only *visible to* it, which can mean 30–40px away. When a storageworker is hardReset into the central entrance tunnel (~1095, 490) and recomputes its route, the nearest visible node is the junction (1080, 520), and the 2-node path is `[junction → storage]`. With `nestRouteIndex = 1`, the ant immediately aims at storage (1390, 610) — a direction that points through the right wall of the diagonal central tunnel. The blocked handler clears the route, recomputes, gets the same result, and the ant shakes at 60fps.

**Fix applied in `js/ants.js`:**
- In `getNextNestWaypoint`, changed `ant.nestRouteIndex = 1;` to `ant.nestRouteIndex = 0;`
- This makes the ant navigate to its nearest visible node first before advancing to the next waypoint. The existing `distance < 24` advance loop handles the rest correctly.

Note: this bug affects all ant roles, but is most visible on storageworkers because they are hardReset into the central tunnel more often than other nest-only roles.

### Fixed earlier

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
7. **`carryingFood` type inconsistency during enemy corpse carry** — On corpse pickup, `ant.carryingFood` is set to `{ kind: "spider" }` (plain object) instead of an array. Harmless: `drawing.js` branches on `carrying === "enemy_corpse"` before touching `carryingFood`, and `depositEnemyCorpseToStorage` restores `[]`. Same tier as risk #4.
8. **Outdoor workers may flood to enemy corpse recovery in heavy combat** — `findNearestRecoverableDeadEnemy` is checked before crumb foraging in the outdoor job branch. With multiple corpses available, all free workers prioritize corpse collection. Not a bug — gameplay to observe during playtesting; could reduce food yield during active fights.
9. **Ants can eat from the corpse pile as a last resort** — `takeFoodForAntMeal` falls back to `getAvailableQueenFoodType()` when the unsorted buffer is empty and the queen is not hungry. `getAvailableQueenFoodType` now iterates all types including "corpse", so ants can consume corpse-derived food. Acceptable behaviour (food is food), but worth knowing if corpse food ever needs to be queen-exclusive.

## Tests performed

- `node --check` passed on all 11 modified JS files (no syntax errors)
- `node --check js/ants.js` passed after the storageworker slot-index fix
- `node --check js/ants.js` passed after the nest route index fix
- `node --check js/spiders.js` passed after the frog redesign and jumping locomotion update
- `node --check js/world.js`, `node --check js/save.js`, and `node --check js/spiders.js` passed after the beetle save-load migration fix
- `node --check js/spiders.js`, `js/colony.js`, `js/ants.js`, `js/drawing.js`, `js/save.js`, and `js/nest.js` passed after the dead-enemy food-source update
- `node --check js/player.js`, `js/save.js`, `js/spiders.js`, `js/colony.js`, `js/ants.js`, `js/drawing.js`, and `js/nest.js` passed after player enemy-corpse carry support
- `node --check js/spiders.js`, `js/player.js`, `js/save.js`, `js/ants.js`, `js/colony.js`, `js/drawing.js`, and `js/nest.js` passed after the enemy respawn-in-nest fix
- Diff reviewed in full — no obvious runtime errors found
- Image compression verified via git diff --stat

## Next recommended action

Play-test the enemy corpse loop:
1. Have soldiers kill a spider, frog, and beetle.
2. Confirm each corpse appears flattened/on-side at 60% scale and does not immediately respawn.
3. Confirm both the player and a worker can claim and carry corpses to storage.
4. Confirm storage gains 5 food items per delivered corpse from either carrier.
5. Confirm an unclaimed corpse despawns after ~60 seconds and then respawns normally.
6. Save/load during a corpse phase — confirm no crash; in-progress carries should drop safely.
7. Confirm carried corpse draws as a small shape behind the worker and navigates through nest tunnels without issues.
8. After delivering an enemy corpse to storage, remain in the nest past the respawn window and confirm no enemy respawns in the nest or damages the player.

**Goals backlog: empty.** All four goals delivered this session.

Note on Goal 4 (corpse resizing): assessed as complete. Tunnel fit is not a physics problem — the worker ant navigates using its own collision radius (10px). The visual resize is covered: uncarried corpses render at 60% scale flattened on the ground; carried corpses render as a small oval behind the ant. No further work required unless playtesting reveals a visual issue.

## Prompt for Codex

No pending Codex implementation prompt.
