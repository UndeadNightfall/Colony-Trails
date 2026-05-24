    function getNestObjective() {
      if (colony.eggs.length > 0 && !colony.eggs[0].inNursery) return "Move the queen's egg to the nursery so it can incubate.";
      if (colony.eggs.length > 0) return `Egg incubating: ${Math.ceil(colony.eggs[0].time)}s until a ${formatRoleLabel(colony.eggs[0].role)} hatches.`;
      return `Collect ${Math.max(0, colony.crumbsForEgg - colony.food)} more crumb${colony.crumbsForEgg - colony.food === 1 ? "" : "s"} so the queen can lay an egg.`;
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
      if (colony.eggs.length === 0 && colony.food >= colony.crumbsForEgg) {
        colony.food -= colony.crumbsForEgg;
        colony.eggs.push({ role: chooseEggRole(), time: colony.incubationDuration, inNursery: false, carriedBy: null, x: queen.x + 54, y: queen.y + 20 });
        colony.crumbsForEgg += 1;
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
      spawnColonyAnt(role);
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

    function spawnColonyAnt(role) {
      const stats = getRoleStats(role);
      const angle = randomBetween(0, Math.PI * 2);
      helpers.push({ id: nextAntId++, role, health: 3, x: queen.x + randomBetween(-40, 40), y: queen.y + randomBetween(-35, 35), angle, targetAngle: angle, timer: randomBetween(0.4, 1.6), radius: stats.radius, speed: randomBetween(stats.speedMin, stats.speedMax), roomId: "nest", carrying: false, targetCrumb: null, targetCorpse: null, targetSickAnt: null, job: role === "nurse" ? "nursing" : role === "middenworker" ? "midden_patrolling" : "leaving_nest", restTimer: randomBetween(14, 28), restDuration: 0, restTarget: null, needsRest: false, restTunnelIndex: null, restSlotIndex: null, sick: false, sickTimer: 0, sickProgress: 0, sickExposure: 0, atMidden: false, carriedBy: null, sickCarrierId: null, sickCaretakerId: null, sickSourceId: null });
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
