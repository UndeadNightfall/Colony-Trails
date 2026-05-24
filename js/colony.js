    function getNestObjective() {
      if (colony.excavation.active) return `Workers are expanding tunnel ${colony.excavation.targetStage}.`;
      if (colony.eggs.length > 0) return `Egg incubating: ${Math.ceil(colony.eggs[0].time)}s until a ${colony.eggs[0].role} hatches.`;
      return `Collect ${Math.max(0, colony.crumbsForEgg - colony.food)} more crumb${colony.crumbsForEgg - colony.food === 1 ? "" : "s"} so the queen can lay an egg. Nest capacity: ${getNestCapacity()} ants.`;
    }

    function deliverFood() {
      player.carrying = false;
      colony.food += 1;
      playGiveSound();
      checkEggProduction();
      scheduleCrumbRespawnIfNeeded();
    }

    function checkEggProduction() {
      if (colony.eggs.length === 0 && colony.food >= colony.crumbsForEgg) {
        colony.food -= colony.crumbsForEgg;
        colony.eggs.push({ role: chooseEggRole(), time: colony.incubationDuration });
        colony.crumbsForEgg += 1;
        objectiveText.textContent = `The queen laid an egg. It may hatch into a ${colony.eggs[0].role}.`;
        saveGame(false);
      } else {
        objectiveText.textContent = getNestObjective();
      }
    }

    function chooseEggRole() {
      const roll = Math.random();
      if (roll < 0.6) return "worker";
      if (roll < 0.82) return "soldier";
      return "nurse";
    }

    function updateIncubation(delta) {
      if (colony.eggs.length <= 0) return;
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
      colony.roles[role] += 1;
      spawnColonyAnt(role);
      const started = updateNestGrowth();
      objectiveText.textContent = started ? `A ${role} hatched. Workers started expanding tunnel ${colony.excavation.targetStage}.` : `A ${role} hatched. The colony has more help.`;
      saveGame(false);
    }

    function updateNestGrowth() {
      const nextStage = colony.nestStage + 1;
      if (colony.ants <= getNestCapacity() || nextStage > colony.tunnelCapacity.length || colony.excavation.active || colony.roles.worker < 2) return false;
      colony.excavation.active = true;
      colony.excavation.targetStage = nextStage;
      colony.excavation.progress = 0;
      return true;
    }

    function getNestCapacity() {
      return colony.tunnelCapacity[colony.nestStage - 1] || colony.tunnelCapacity[colony.tunnelCapacity.length - 1];
    }

    function updateExcavation(delta) {
      if (!colony.excavation.active) return;
      colony.excavation.progress += delta * Math.max(1, colony.roles.worker);
      if (colony.excavation.progress < colony.excavation.duration) return;
      colony.nestStage = colony.excavation.targetStage;
      colony.excavation.active = false;
      colony.excavation.progress = 0;
      nest.radius = 145 + (colony.nestStage - 1) * 34;
      objectiveText.textContent = `Tunnel ${colony.nestStage} is open. The nest has more room to explore.`;
      updateNestGrowth();
      saveGame(false);
    }

    function spawnHelperAnt() {
      spawnColonyAnt("worker");
    }

    function spawnColonyAnt(role) {
      const stats = getRoleStats(role);
      const angle = randomBetween(0, Math.PI * 2);
      helpers.push({ id: nextAntId++, role, health: 3, x: queen.x + randomBetween(-40, 40), y: queen.y + randomBetween(-35, 35), angle, targetAngle: angle, timer: randomBetween(0.4, 1.6), radius: stats.radius, speed: randomBetween(stats.speedMin, stats.speedMax), roomId: "nest", carrying: false, targetCrumb: null, job: role === "nurse" ? "nursing" : "leaving_nest", restTimer: randomBetween(14, 28), restDuration: 0, restTarget: null, needsRest: false });
    }

    function getRoleStats(role) {
      if (role === "soldier") return { radius: 12, speedMin: 50, speedMax: 66, color: "#4a2114" };
      if (role === "nurse") return { radius: 9, speedMin: 32, speedMax: 46, color: "#7b4b2f" };
      return { radius: 10, speedMin: 48, speedMax: 72, color: "#2c140b" };
    }
