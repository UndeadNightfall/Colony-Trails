    function updateHelpers(delta) {
      for (let i = helpers.length - 1; i >= 0; i--) {
        const ant = helpers[i];
        if (ant.dead) { helpers.splice(i, 1); continue; }
        updateAntRestState(ant, delta);
        updateHelperJob(ant);
        if (ant.job === "moving_to_rest" || ant.job === "resting") {
          chooseHelperDirection(ant);
        } else {
          ant.timer -= delta;
          if (ant.timer <= 0) { ant.timer = randomBetween(0.4, 1.2); chooseHelperDirection(ant); }
        }
        const oldX = ant.x;
        const oldY = ant.y;
        const moveSpeed = ant.job === "resting" ? 0 : ant.speed;
        ant.x += Math.cos(ant.angle) * moveSpeed * delta;
        ant.y += Math.sin(ant.angle) * moveSpeed * delta;
        const room = rooms[ant.roomId];
        ant.x = clamp(ant.x, 30, room.width - 30);
        ant.y = clamp(ant.y, 30, room.height - 30);
        resolveOverworldObstructions(ant);
        resolveNestWalls(ant, oldX, oldY);
        const oldRoom = ant.roomId;
        handleRoomTransitions(ant);
        if (oldRoom !== ant.roomId) ant.angle += Math.PI + randomBetween(-0.35, 0.35);
        handleHelperForaging(ant);
        handleSoldierCombat(ant, delta);
      }
    }

    function updateAntRestState(ant, delta) {
      if (ant.role === "nurse") return;
      if (ant.job === "resting") {
        ant.restDuration -= delta;
        if (ant.restDuration <= 0) {
          ant.needsRest = false;
          ant.restTarget = null;
          ant.restTimer = randomBetween(18, 36);
          ant.job = "leaving_nest";
        }
        return;
      }
      if (ant.carrying || ant.needsRest) return;
      ant.restTimer -= delta;
      if (ant.restTimer <= 0) {
        ant.needsRest = true;
        ant.restTarget = getNestRestSpot(ant);
      }
    }

    function updateHelperJob(ant) {
      if (ant.role === "nurse") { ant.job = "nursing"; return; }
      if (ant.needsRest && !ant.carrying) {
        if (ant.roomId !== "nest") { ant.job = "returning_home"; return; }
        if (!ant.restTarget) ant.restTarget = getNestRestSpot(ant);
        ant.job = distance(ant, ant.restTarget) < 18 ? "resting" : "moving_to_rest";
        if (ant.job === "resting" && ant.restDuration <= 0) ant.restDuration = randomBetween(5, 10);
        return;
      }
      if (ant.carrying === "dead") { ant.job = ant.roomId === "nest" ? "delivering_dead" : "returning_home"; return; }
      if (ant.carrying) { ant.job = ant.roomId === "nest" ? "delivering" : "returning_home"; return; }
      if (ant.roomId === "nest") { ant.job = "leaving_nest"; return; }
      if (ant.role === "soldier") {
        const spider = findNearestLiveSpider(ant, 520);
        if (spider) { ant.targetSpider = spider; ant.job = "attacking_spider"; return; }
        ant.job = "patrolling";
        return;
      }
      if (ant.role === "worker") {
        const corpse = findNearestRecoverableDeadAnt(ant, 360);
        if (corpse) { ant.targetCorpse = corpse; ant.job = "recovering_dead"; return; }
      }
      const target = findNearestAvailableCrumb(ant, 260);
      ant.targetCrumb = target;
      ant.job = target ? "foraging" : "roaming";
    }

    function chooseHelperDirection(ant) {
      if (ant.job === "leaving_nest") pointTowardExit(ant, exits.nestToOverworld);
      else if (ant.job === "returning_home") pointTowardExit(ant, getHomewardExit(ant.roomId));
      else if (ant.job === "delivering") ant.angle = Math.atan2(queen.y - ant.y, queen.x - ant.x);
      else if (ant.job === "delivering_dead") ant.angle = Math.atan2(midden.y - ant.y, midden.x - ant.x);
      else if (ant.job === "nursing") ant.angle = Math.atan2(queen.y + 92 - ant.y, queen.x - 116 - ant.x) + randomBetween(-0.35, 0.35);
      else if (ant.job === "moving_to_rest" && ant.restTarget) ant.angle = Math.atan2(ant.restTarget.y - ant.y, ant.restTarget.x - ant.x);
      else if (ant.job === "resting") ant.angle += Math.sin(performance.now() / 900 + ant.x) * 0.08;
      else if (ant.job === "attacking_spider" && ant.targetSpider && ant.targetSpider.alive) ant.angle = Math.atan2(ant.targetSpider.y - ant.y, ant.targetSpider.x - ant.x);
      else if (ant.job === "recovering_dead" && ant.targetCorpse && !ant.targetCorpse.carried) ant.angle = Math.atan2(ant.targetCorpse.y - ant.y, ant.targetCorpse.x - ant.x);
      else if (ant.job === "foraging" && ant.targetCrumb && !ant.targetCrumb.collected) ant.angle = Math.atan2(ant.targetCrumb.y - ant.y, ant.targetCrumb.x - ant.x);
      else if (ant.job === "patrolling" && isOutdoorRoom(ant.roomId) && Math.random() < 0.28) pointTowardExit(ant, getRandomRoomExit(ant.roomId));
      else if (isOutdoorRoom(ant.roomId) && Math.random() < 0.12) pointTowardExit(ant, getRandomRoomExit(ant.roomId));
      else ant.angle += randomBetween(-1.9, 1.9);
    }

    function handleHelperForaging(ant) {
      if (isOutdoorRoom(ant.roomId) && ant.role === "worker" && !ant.carrying && ant.targetCorpse && !ant.targetCorpse.carried && distance(ant, ant.targetCorpse) < ant.radius + ant.targetCorpse.radius + 8) {
        ant.targetCorpse.carried = true;
        ant.carrying = "dead";
        pointTowardExit(ant, getHomewardExit(ant.roomId));
      }
      if (isOutdoorRoom(ant.roomId) && !ant.carrying && ant.targetCrumb && ant.targetCrumb.roomId === ant.roomId && !ant.targetCrumb.collected && distance(ant, ant.targetCrumb) < ant.radius + ant.targetCrumb.radius + 6) {
        ant.targetCrumb.collected = true;
        ant.carrying = "food";
        ant.targetCrumb = null;
        pointTowardExit(ant, getHomewardExit(ant.roomId));
      }
      if (ant.roomId === "nest" && ant.carrying === "dead" && distance(ant, midden) < midden.radius + 18) {
        if (ant.targetCorpse) {
          const index = deadAnts.indexOf(ant.targetCorpse);
          if (index >= 0) deadAnts.splice(index, 1);
        }
        ant.carrying = false;
        ant.targetCorpse = null;
        colony.recoveredDead += 1;
        objectiveText.textContent = "A worker carried a dead ant to the midden.";
        saveGame(false);
      }
      if (ant.roomId === "nest" && ant.carrying && distance(ant, queen) < queen.radius + 34) {
        if (ant.carrying !== "food") return;
        ant.carrying = false;
        colony.food += 1;
        objectiveText.textContent = "A worker brought food home for the queen.";
        checkEggProduction();
        scheduleCrumbRespawnIfNeeded();
      }
    }

    function handleSoldierCombat(ant, delta) {
      if (ant.role !== "soldier" || ant.job !== "attacking_spider" || !ant.targetSpider || !ant.targetSpider.alive) return;
      if (distance(ant, ant.targetSpider) > ant.radius + ant.targetSpider.radius + 12) return;
      if (!ant.attackCooldown || ant.attackCooldown <= 0) {
        const team = countSoldiersNearSpider(ant.targetSpider, 95);
        const successChance = clamp(0.28 + team * 0.22, 0.28, 0.92);
        if (Math.random() < successChance) {
          addCombatEffect(ant.targetSpider.x, ant.targetSpider.y, "hit");
          killSpider(ant.targetSpider);
          ant.targetSpider = null;
          ant.job = "patrolling";
        } else if (Math.random() < 0.22 / Math.max(1, team)) {
          addCombatEffect(ant.x, ant.y, "danger");
          killAnt(ant, ant.targetSpider);
        } else {
          addCombatEffect(ant.targetSpider.x, ant.targetSpider.y, "clash");
        }
        ant.attackCooldown = randomBetween(0.8, 1.4);
      } else {
        ant.attackCooldown -= delta;
      }
    }

    function addCombatEffect(x, y, type) {
      combatEffects.push({ x, y, type, time: 0.55, maxTime: 0.55 });
    }

    function killAnt(ant, source) {
      ant.dead = true;
      colony.ants = Math.max(0, colony.ants - 1);
      if (colony.roles[ant.role] > 0) colony.roles[ant.role] -= 1;
      deadAnts.push({ roomId: ant.roomId, x: ant.x, y: ant.y, radius: ant.radius, role: ant.role, carried: false });
      if (source) source.aggro = false;
      objectiveText.textContent = `A ${ant.role} died. Workers will recover the body.`;
      saveGame(false);
    }

    function findNearestLiveSpider(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const spider of spiders) {
        if (!spider.alive || spider.roomId !== entity.roomId) continue;
        const d = distance(entity, spider);
        if (d < nearestDistance) { nearest = spider; nearestDistance = d; }
      }
      return nearest;
    }

    function findNearestRecoverableDeadAnt(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const corpse of deadAnts) {
        if (corpse.carried || corpse.roomId !== entity.roomId) continue;
        const d = distance(entity, corpse);
        if (d < nearestDistance) { nearest = corpse; nearestDistance = d; }
      }
      return nearest;
    }

    function countSoldiersNearSpider(spider, range) {
      return helpers.filter(ant => !ant.dead && ant.role === "soldier" && ant.roomId === spider.roomId && distance(ant, spider) < range).length;
    }

    function getNestRestSpot(ant) {
      const tunnels = getNestTunnelPlan().slice(0, colony.nestStage);
      if (tunnels.length === 0) return { x: queen.x + randomBetween(-50, 80), y: queen.y + randomBetween(-45, 45) };
      const index = Math.abs(Math.floor((ant.x * 7 + ant.y * 11 + helpers.indexOf(ant) * 13))) % tunnels.length;
      const tunnel = tunnels[index];
      const along = randomBetween(95, Math.max(110, tunnel.length - 45));
      const side = randomBetween(-tunnel.width * 0.28, tunnel.width * 0.28);
      return {
        x: queen.x + Math.cos(tunnel.angle) * along - Math.sin(tunnel.angle) * side,
        y: queen.y + Math.sin(tunnel.angle) * along + Math.cos(tunnel.angle) * side
      };
    }

    function findNearestAvailableCrumb(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const crumb of crumbs) {
        if (crumb.collected || crumb.roomId !== entity.roomId) continue;
        const d = distance(entity, crumb);
        if (d < nearestDistance) { nearest = crumb; nearestDistance = d; }
      }
      return nearest;
    }
