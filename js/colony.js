    function getNestObjective() {
      const requiredFood = getEggFoodRequirement();
      const stored = getStoragePileCount();
      const hungerText = colony.queenHungry ? " | Queen hungry" : ` | Queen eats in ${Math.ceil(colony.queenFeedTimer || 0)}s`;
      const foodText = `Food: ${colony.food}/${requiredFood} | Stored: ${stored}${hungerText}`;
      if (colony.eggs.length > 0 && !colony.eggs[0].inNursery) return `${foodText} | Move the queen's egg to the nursery so it can incubate.`;
      if (colony.eggs.length > 0) return `${foodText} | Egg incubating: ${Math.ceil(colony.eggs[0].time)}s until a ${formatRoleLabel(colony.eggs[0].role)} hatches.`;
      return `${foodText} | Bring crumbs to storage so storage workers can feed the queen.`;
    }

    function getNestFoodStatusText() {
      const hungerText = colony.queenHungry ? "Hungry" : `${Math.ceil(colony.queenFeedTimer || 0)}s`;
      const foodText = `Food: ${colony.food}/${getEggFoodRequirement()} | Stored: ${getStoragePileCount()} | Queen: ${hungerText}`;
      if (colony.eggs.length === 0) return foodText;
      const egg = colony.eggs[0];
      if (!egg.inNursery) return `${foodText} | Egg pending`;
      return `${foodText} | Egg: ${Math.ceil(egg.time)}s ${egg.role}`;
    }

    function getEggFoodRequirement() {
      return 5;
    }

    function syncColonyRoleCounts() {
      const counts = { worker: 0, soldier: 0, nurse: 0, middenworker: 0, storageworker: 0 };
      let helperCount = 0;
      for (const ant of helpers) {
        if (ant.dead) continue;
        helperCount += 1;
        if (Object.prototype.hasOwnProperty.call(counts, ant.role)) counts[ant.role] += 1;
      }
      if ((colony.ants || 0) > helperCount) counts.worker += 1;
      colony.roles = Object.assign({ worker: 0, soldier: 0, nurse: 0, middenworker: 0, storageworker: 0 }, counts);
      return colony.roles;
    }

    function ensureMinimumRolePopulation() {
      const requiredRoles = ["soldier", "nurse", "middenworker", "storageworker"];
      colony.ants = Math.max(colony.ants || 0, helpers.filter(ant => !ant.dead).length + 1);
      let counts = syncColonyRoleCounts();
      for (const role of requiredRoles) {
        if ((counts[role] || 0) >= 1) continue;
        spawnColonyAnt(role, getRoleFallbackSpawnX(role), getRoleFallbackSpawnY(role));
        counts = syncColonyRoleCounts();
      }
      if ((counts.worker || 0) < 1) {
        colony.ants = helpers.filter(ant => !ant.dead).length + 1;
        counts = syncColonyRoleCounts();
      }
      return counts;
    }

    function syncEggFoodRequirement() {
      colony.crumbsForEgg = getEggFoodRequirement();
      normalizeStorageState();
      return colony.crumbsForEgg;
    }

    function deliverFood() {
      depositFoodToStorage(player);
      playGiveSound();
      objectiveText.textContent = "You dropped food in the storage room.";
      scheduleCrumbRespawnIfNeeded();
      saveGame(false);
    }

    function depositFoodToStorage(carrier) {
      if (!Array.isArray(colony.storagePile)) colony.storagePile = [];
      for (const food of getCarriedFoodItems(carrier)) colony.storagePile.push(food || createStoredFoodFromCrumb(null));
      carrier.carrying = false;
      carrier.carryingFood = [];
    }

    function depositEnemyCorpseToStorage(ant) {
      normalizeStorageState();
      for (let i = 0; i < 5; i++) {
        colony.storagePiles["corpse"].push({
          type: "corpse",
          color: "#3d2a1e",
          highlight: "rgba(80,50,30,0.25)"
        });
      }
      ant.carrying = false;
      ant.carryingFood = [];
    }

    function createStoredFoodFromCrumb(crumb) {
      const style = typeof getCrumbStyle === "function" ? getCrumbStyle(crumb) : { color: "#e4b55e", highlight: "rgba(255,255,255,0.18)" };
      return {
        type: crumb?.type || "seed",
        color: style.color,
        highlight: style.highlight
      };
    }

    function getStoragePileCount() {
      normalizeStorageState();
      let total = colony.storagePile.length;
      for (const pile of Object.values(colony.storagePiles)) total += pile.length;
      return total;
    }

    function getFoodCarryLimit() {
      return 3;
    }

    function getCarriedFoodItems(carrier) {
      if (!carrier || carrier.carrying !== "food") return [];
      if (Array.isArray(carrier.carryingFood)) return carrier.carryingFood;
      if (carrier.carryingFood) return [carrier.carryingFood];
      return [];
    }

    function getCarriedFoodCount(carrier) {
      return getCarriedFoodItems(carrier).length;
    }

    function canCarryMoreFood(carrier) {
      return !carrier.carrying || (carrier.carrying === "food" && getCarriedFoodCount(carrier) < getFoodCarryLimit());
    }

    function addFoodToCarrier(carrier, crumb) {
      if (!Array.isArray(carrier.carryingFood)) carrier.carryingFood = getCarriedFoodItems(carrier).slice();
      carrier.carryingFood.push(createStoredFoodFromCrumb(crumb));
      carrier.carrying = "food";
      return carrier.carryingFood.length;
    }

    function normalizeStorageState() {
      if (!Array.isArray(colony.storagePile)) colony.storagePile = [];
      if (!colony.storagePiles || typeof colony.storagePiles !== "object" || Array.isArray(colony.storagePiles)) colony.storagePiles = {};
      for (const item of crumbPalette || []) {
        if (!Array.isArray(colony.storagePiles[item.type])) colony.storagePiles[item.type] = [];
      }
      if (!Array.isArray(colony.storagePiles["corpse"])) colony.storagePiles["corpse"] = [];
      if (typeof colony.queenFeedTimer !== "number") colony.queenFeedTimer = 30;
      if (typeof colony.queenHungry !== "boolean") colony.queenHungry = false;
    }

    function getStoredPileTypes() {
      normalizeStorageState();
      return [...(crumbPalette || []).map(item => item.type), "corpse"];
    }

    function getStorageCentralPoint() {
      return { x: storage.x, y: storage.y + 4 };
    }

    function getStoragePilePoint(type) {
      if (type === "corpse") return { x: storage.x, y: storage.y + storage.radius * 0.54 };
      const foodTypes = (crumbPalette || []).map(item => item.type);
      const index = Math.max(0, foodTypes.indexOf(type));
      const angle = -Math.PI * 0.78 + index * (Math.PI * 1.56 / Math.max(1, foodTypes.length - 1));
      return {
        x: storage.x + Math.cos(angle) * storage.radius * 0.56,
        y: storage.y + Math.sin(angle) * storage.radius * 0.42
      };
    }

    function sortOneStoredFood() {
      normalizeStorageState();
      if (colony.storagePile.length <= 0) return null;
      const food = colony.storagePile.shift();
      const type = food.type || "seed";
      if (!Array.isArray(colony.storagePiles[type])) colony.storagePiles[type] = [];
      colony.storagePiles[type].push(food);
      return food;
    }

    function takeFoodForQueen(preferredType) {
      normalizeStorageState();
      const type = preferredType && colony.storagePiles[preferredType]?.length > 0 ? preferredType : getAvailableQueenFoodType();
      if (!type) return null;
      return colony.storagePiles[type].pop();
    }

    function takeFoodForAntMeal() {
      normalizeStorageState();
      if (colony.storagePile.length > 0) return colony.storagePile.shift();
      if (!colony.queenHungry) {
        const type = getAvailableQueenFoodType();
        if (type) return colony.storagePiles[type].pop();
      }
      return null;
    }

    function getAvailableQueenFoodType() {
      normalizeStorageState();
      for (const type of getStoredPileTypes()) {
        const pile = colony.storagePiles[type];
        if (pile && pile.length > 0) return type;
      }
      return null;
    }

    function hasSortedFoodForQueen() {
      normalizeStorageState();
      return getStoredPileTypes().some(type => colony.storagePiles[type].length > 0);
    }

    function feedQueenStoredFood(carrier) {
      carrier.carrying = false;
      carrier.carryingFood = [];
      colony.food += 1;
      colony.queenHungry = false;
      colony.queenFeedTimer = 30;
      queen.feedPulse = 1.1;
      objectiveText.textContent = "A storage worker fed the queen.";
      checkEggProduction();
    }

    function checkEggProduction() {
      const requiredFood = syncEggFoodRequirement();
      if (colony.eggs.length === 0 && colony.food >= requiredFood) {
        colony.food -= requiredFood;
        colony.eggs.push({ role: chooseEggRole(), time: colony.incubationDuration, inNursery: false, carriedBy: null, x: queen.x + 54, y: queen.y + 20 });
        queen.layPulse = 1.4;
        objectiveText.textContent = `The queen laid an egg. Nurses will tend it in the nursery.`;
        saveGame(false);
      } else {
        objectiveText.textContent = getNestObjective();
      }
    }

    function chooseEggRole() {
      const roll = Math.random();
      if (roll < 0.5) return "worker";
      if (roll < 0.66) return "soldier";
      if (roll < 0.82) return "nurse";
      if (roll < 0.92) return "middenworker";
      return "storageworker";
    }

    function updateIncubation(delta) {
      if (colony.eggs.length <= 0 || !colony.eggs[0].inNursery) return;
      colony.eggs[0].time -= delta * getIncubationRate();
      if (colony.eggs[0].time > 0) return;
      const egg = colony.eggs.shift();
      hatchAnt(egg.role);
    }

    function getIncubationRate() {
      return 1 + colony.roles.nurse * 0.18;
    }

    function hatchAnt(role) {
      colony.ants += 1;
      colony.roles[role] = (colony.roles[role] || 0) + 1;
      if (typeof syncColonyRoleCounts === "function") syncColonyRoleCounts();
      syncEggFoodRequirement();
      spawnColonyAnt(role, nursery.x - 12, nursery.y + 10);
      objectiveText.textContent = `A ${formatRoleLabel(role)} hatched. The colony has more help.`;
      saveGame(false);
    }

    function updateNestGrowth() {
      return false;
    }

    function getNestCapacity() {
      return 80;
    }

    function updateExcavation(delta) {
      colony.excavation.active = false;
      colony.excavation.progress = 0;
    }

    function spawnHelperAnt() {
      spawnColonyAnt("worker");
    }

    function spawnStartingColonyAnts() {
      spawnColonyAnt("soldier", nest.x + 18, nest.y - 26);
      spawnColonyAnt("middenworker", midden.x - 18, midden.y + 10);
      spawnColonyAnt("storageworker", storage.x - 18, storage.y + 8);
      spawnColonyAnt("storageworker", storage.x + 18, storage.y + 8);
      spawnColonyAnt("nurse", nursery.x - 18, nursery.y + 8);
    }

    function getRoleFallbackSpawnX(role) {
      if (role === "storageworker") return storage.x - 18;
      if (role === "middenworker") return midden.x - 18;
      if (role === "nurse") return nursery.x - 18;
      if (role === "soldier") return nest.x + 18;
      return queen.x + 80;
    }

    function getRoleFallbackSpawnY(role) {
      if (role === "storageworker") return storage.y + 8;
      if (role === "middenworker") return midden.y + 10;
      if (role === "nurse") return nursery.y + 8;
      if (role === "soldier") return nest.y - 26;
      return queen.y;
    }

    function spawnColonyAnt(role, spawnX, spawnY) {
      const stats = getRoleStats(role);
      const angle = randomBetween(0, Math.PI * 2);
      const x = typeof spawnX === "number" ? spawnX : queen.x + randomBetween(-40, 40);
      const y = typeof spawnY === "number" ? spawnY : queen.y + randomBetween(-35, 35);
      const id = nextAntId++;
      helpers.push({ id, role, health: 3, x, y, angle, targetAngle: angle, timer: randomBetween(0.4, 1.6), radius: stats.radius, speed: randomBetween(stats.speedMin, stats.speedMax), roomId: "nest", carrying: false, carryingFood: [], targetCrumb: null, targetCorpse: null, targetEnemyCorpse: null, targetSickAnt: null, job: getInitialAntJob(role), hungerTimer: randomBetween(20, 95) + (id * 17) % 37, eatTimer: 0, returnJobAfterMeal: null, restTimer: randomBetween(14, 28), restDuration: 0, restTarget: null, needsRest: false, restTunnelIndex: null, restSlotIndex: null, sick: false, sickTimer: 0, sickProgress: 0, sickExposure: 0, atMidden: false, carriedBy: null, sickCarrierId: null, sickCaretakerId: null, sickSourceId: null });
    }

    function getInitialAntJob(role) {
      if (role === "nurse") return "nursing";
      if (role === "middenworker") return "midden_patrolling";
      if (role === "storageworker") return "storage_patrolling";
      return "leaving_nest";
    }

    function updateQueen(delta) {
      normalizeStorageState();
      queen.feedPulse = Math.max(0, queen.feedPulse - delta);
      queen.layPulse = Math.max(0, queen.layPulse - delta);
      queen.swayPhase += delta;
      if (colony.queenHungry) return;
      colony.queenFeedTimer -= delta;
      if (colony.queenFeedTimer <= 0) {
        colony.queenFeedTimer = 0;
        colony.queenHungry = true;
      }
    }

    function getRoleStats(role) {
      if (role === "soldier") return { radius: 12, speedMin: 50, speedMax: 66, color: "#1d1412" };
      if (role === "nurse") return { radius: 9, speedMin: 32, speedMax: 46, color: "#251916" };
      if (role === "middenworker") return { radius: 10, speedMin: 36, speedMax: 50, color: "#2a211d" };
      if (role === "storageworker") return { radius: 10, speedMin: 38, speedMax: 52, color: "#120c0a" };
      return { radius: 10, speedMin: 48, speedMax: 72, color: "#120c0a" };
    }

    function formatRoleLabel(role) {
      if (role === "middenworker") return "midden worker";
      if (role === "storageworker") return "storage worker";
      return (role || "").replace(/_/g, " ");
    }
