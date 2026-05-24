    function getNestObjective() {
      const requiredFood = getEggFoodRequirement();
      const foodText = `Food: ${colony.food}/${requiredFood}`;
      if (colony.eggs.length > 0 && !colony.eggs[0].inNursery) return `${foodText} | Move the queen's egg to the nursery so it can incubate.`;
      if (colony.eggs.length > 0) return `${foodText} | Egg incubating: ${Math.ceil(colony.eggs[0].time)}s until a ${formatRoleLabel(colony.eggs[0].role)} hatches.`;
      return `${foodText} | Collect ${Math.max(0, requiredFood - colony.food)} more crumb${requiredFood - colony.food === 1 ? "" : "s"} so the queen can lay an egg.`;
    }

    function getNestFoodStatusText() {
      const foodText = `Food: ${colony.food}/${getEggFoodRequirement()}`;
      if (colony.eggs.length === 0) return foodText;
      const egg = colony.eggs[0];
      if (!egg.inNursery) return `${foodText} | Egg pending`;
      return `${foodText} | Egg: ${Math.ceil(egg.time)}s ${egg.role}`;
    }

    function getEggFoodRequirement() {
      return Math.max(2, (colony.ants || 0) * 2);
    }

    function syncColonyRoleCounts() {
      const counts = { worker: 0, soldier: 0, nurse: 0, middenworker: 0 };
      for (const ant of helpers) {
        if (!ant.dead && Object.prototype.hasOwnProperty.call(counts, ant.role)) counts[ant.role] += 1;
      }
      colony.roles = Object.assign({ worker: 0, soldier: 0, nurse: 0, middenworker: 0 }, counts);
      return colony.roles;
    }

    function syncEggFoodRequirement() {
      colony.crumbsForEgg = getEggFoodRequirement();
      return colony.crumbsForEgg;
    }

    function deliverFood() {
      player.carrying = false;
      colony.food += 1;
      queen.feedPulse = 1.1;
      playGiveSound();
      checkEggProduction();
      scheduleCrumbRespawnIfNeeded();
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
      if (roll < 0.56) return "worker";
      if (roll < 0.74) return "soldier";
      if (roll < 0.9) return "nurse";
      return "middenworker";
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

    function spawnColonyAnt(role, spawnX, spawnY) {
      const stats = getRoleStats(role);
      const angle = randomBetween(0, Math.PI * 2);
      const x = typeof spawnX === "number" ? spawnX : queen.x + randomBetween(-40, 40);
      const y = typeof spawnY === "number" ? spawnY : queen.y + randomBetween(-35, 35);
      helpers.push({ id: nextAntId++, role, health: 3, x, y, angle, targetAngle: angle, timer: randomBetween(0.4, 1.6), radius: stats.radius, speed: randomBetween(stats.speedMin, stats.speedMax), roomId: "nest", carrying: false, targetCrumb: null, targetCorpse: null, targetSickAnt: null, job: role === "nurse" ? "nursing" : role === "middenworker" ? "midden_patrolling" : "leaving_nest", restTimer: randomBetween(14, 28), restDuration: 0, restTarget: null, needsRest: false, restTunnelIndex: null, restSlotIndex: null, sick: false, sickTimer: 0, sickProgress: 0, sickExposure: 0, atMidden: false, carriedBy: null, sickCarrierId: null, sickCaretakerId: null, sickSourceId: null });
    }

    function updateQueen(delta) {
      queen.feedPulse = Math.max(0, queen.feedPulse - delta);
      queen.layPulse = Math.max(0, queen.layPulse - delta);
      queen.swayPhase += delta;
    }

    function getRoleStats(role) {
      if (role === "soldier") return { radius: 12, speedMin: 50, speedMax: 66, color: "#1d1412" };
      if (role === "nurse") return { radius: 9, speedMin: 32, speedMax: 46, color: "#251916" };
      if (role === "middenworker") return { radius: 10, speedMin: 36, speedMax: 50, color: "#2a211d" };
      return { radius: 10, speedMin: 48, speedMax: 72, color: "#120c0a" };
    }

    function formatRoleLabel(role) {
      if (role === "middenworker") return "midden worker";
      return (role || "").replace(/_/g, " ");
    }
