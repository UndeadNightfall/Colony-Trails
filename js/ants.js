    function normalizeSicknessState(entity) {
      if (typeof entity.sick !== "boolean") entity.sick = false;
      if (typeof entity.sickTimer !== "number") entity.sickTimer = entity.sick ? 28 : 0;
      if (typeof entity.sickProgress !== "number") entity.sickProgress = 0;
      if (typeof entity.sickExposure !== "number") entity.sickExposure = 0;
      if (typeof entity.atMidden !== "boolean") entity.atMidden = false;
      if (typeof entity.carriedBy === "undefined") entity.carriedBy = null;
      if (typeof entity.sickCarrierId === "undefined") entity.sickCarrierId = null;
      if (typeof entity.sickCaretakerId === "undefined") entity.sickCaretakerId = null;
      if (typeof entity.sickSourceId === "undefined") entity.sickSourceId = null;
    }

    function updateSickness(delta) {
      normalizeSicknessState(player);
      if (player.sick) updateSickEntity(player, delta, true);
      for (const ant of helpers) {
        if (ant.dead) continue;
        normalizeSicknessState(ant);
        if (ant.sick) updateSickEntity(ant, delta, false);
      }

      const activeEntities = [player, ...helpers.filter(ant => !ant.dead)];
      for (const source of activeEntities) {
        if (!source.sick) {
          if (Math.random() < delta * 0.00015) infectEntity(source, null);
          continue;
        }
        if (source.carriedBy) continue;
        const contagiousRange = source.atMidden ? 42 : 58;
        const contagiousChance = delta * (source.atMidden ? 0.012 : 0.03);
        if (Math.random() > contagiousChance) continue;
        const targets = activeEntities.filter(target => target !== source && !target.dead && !target.sick && !target.carriedBy && target.roomId === source.roomId && distance(source, target) < contagiousRange);
        if (targets.length === 0) continue;
        infectEntity(targets[Math.floor(Math.random() * targets.length)], source);
      }
    }

    function updateSickEntity(entity, delta, isPlayer) {
      if (entity.atMidden) {
        if (entity.roomId !== "nest") entity.atMidden = false;
        if (entity.roomId === "nest" && colony.roles.middenworker > 0) {
          entity.sickProgress += delta * (1 + colony.roles.middenworker * 0.55);
          if (entity.sickProgress >= 6) {
            recoverSickEntity(entity, isPlayer);
          }
          return;
        }
      }
      entity.sickTimer -= delta;
      if (entity.sickTimer > 0) return;
      if (isPlayer) {
        objectiveText.textContent = "The sickness overtook you. Another ant takes your place.";
        resetAfterFaint();
      } else {
        killSickEntity(entity);
      }
    }

    function infectEntity(entity, source) {
      if (!entity || entity.dead || entity.sick) return false;
      normalizeSicknessState(entity);
      entity.sick = true;
      entity.sickTimer = Math.max(entity.sickTimer, 28);
      entity.sickProgress = 0;
      entity.sickExposure = 0;
      entity.atMidden = false;
      entity.sickCarrierId = null;
      if (source && source.id) entity.sickSourceId = source.id;
      if (entity === player) objectiveText.textContent = "You feel sick. Get to the midden and keep away from the colony.";
      return true;
    }

    function recoverSickEntity(entity, isPlayer = false) {
      releaseSickCarrier(entity);
      entity.sick = false;
      entity.sickTimer = 0;
      entity.sickProgress = 0;
      entity.sickExposure = 0;
      entity.atMidden = false;
      entity.sickCarrierId = null;
      entity.sickCaretakerId = null;
      if (isPlayer) objectiveText.textContent = "The midden worker cleared your sickness.";
      else objectiveText.textContent = `A ${formatRoleLabel(entity.role)} recovered at the midden.`;
      saveGame(false);
    }

    function killSickEntity(entity) {
      releaseSickCarrier(entity);
      if (entity === player) {
        objectiveText.textContent = "The sickness killed you.";
        resetAfterFaint();
        return;
      }
      killAnt(entity, null);
      objectiveText.textContent = "A sick ant died before it could recover.";
    }

    function releaseSickCarrier(entity) {
      if (!entity || entity.carriedBy == null) return;
      if (entity.carriedBy === "player") {
        player.carrying = false;
      } else {
        const carrier = helpers.find(ant => ant.id === entity.carriedBy);
        if (carrier) {
          carrier.carrying = false;
          carrier.targetSickAnt = null;
        }
      }
      entity.carriedBy = null;
      entity.carried = false;
    }

    function updateHelpers(delta) {
      for (let i = helpers.length - 1; i >= 0; i--) {
        const ant = helpers[i];
        if (ant.dead) { helpers.splice(i, 1); continue; }
        normalizeSicknessState(ant);
        normalizeAntHungerState(ant);
        if (ant.carriedBy) continue;
        if (ant.roomId === "nest" && ((!isNestWalkable(ant.x, ant.y, ant.radius)) || (ant.nestBlockedCount || 0) >= 3)) {
          recoverNestEntityPosition(ant, ant.x, ant.y);
          ant.nestRouteKey = null;
          ant.nestRoute = null;
          ant.nestRouteIndex = 0;
          ant.nestBlockedCount = 0;
        }
        updateAntRestState(ant, delta);
        updateAntHungerState(ant, delta);
        updateHelperJob(ant);
        if (ant.job === "moving_to_rest" || ant.job === "resting") {
          chooseHelperDirection(ant);
        } else {
          ant.timer -= delta;
          if (ant.timer <= 0) { ant.timer = randomBetween(0.4, 1.2); chooseHelperDirection(ant); }
        }
        if (typeof ant.targetAngle !== "number") ant.targetAngle = ant.angle;
        const turnRate = ant.job === "resting" ? 2.2 : ant.roomId === "nest" ? 18 : 7.5;
        ant.angle = approachAngle(ant.angle, ant.targetAngle, delta * turnRate);
        const oldX = ant.x;
        const oldY = ant.y;
        const inNursery = ant.role === "nurse" && distance(ant, nursery) < nursery.rx * 0.68;
        const inMidden = ant.role === "middenworker" && distance(ant, midden) < midden.radius + 20;
        const inStorage = ant.role === "storageworker" && distance(ant, storage) < storage.radius * 0.7;
        const moveSpeed = ant.job === "resting" || ant.atMidden ? 0 : ((ant.role === "nurse" && ant.job === "nursing" && inNursery) || (ant.role === "middenworker" && (ant.job === "midden_patrolling" || ant.job === "waiting_midden") && inMidden) || (ant.job === "storage_patrolling" && inStorage) ? 0 : ant.speed * (ant.sick && !ant.atMidden ? 0.62 : 1));
        const blocked = moveNestEntity(ant, Math.cos(ant.angle) * moveSpeed * delta, Math.sin(ant.angle) * moveSpeed * delta);
        const room = rooms[ant.roomId];
        ant.x = clamp(ant.x, 30, room.width - 30);
        ant.y = clamp(ant.y, 30, room.height - 30);
        resolveOverworldObstructions(ant);
        const oldRoom = ant.roomId;
        handleRoomTransitions(ant);
        if (oldRoom !== ant.roomId) ant.targetAngle = ant.angle + Math.PI + randomBetween(-0.35, 0.35);
        else if (blocked && ant.roomId === "nest" && ant.job !== "resting") {
          ant.nestRouteKey = null;
          ant.nestRoute = null;
          ant.nestRouteIndex = 0;
          ant.nestBlockedCount = (ant.nestBlockedCount || 0) + 1;
          let escaped = false;
          if (ant.nestBlockedCount >= 5) {
            hardResetNestAnt(ant, oldX, oldY);
            escaped = true;
          } else if (ant.nestBlockedCount >= 2) {
            const escape = findNearestNestSafeSpot(ant, oldX, oldY);
            if (escape) {
              ant.targetAngle = Math.atan2(escape.y - ant.y, escape.x - ant.x);
              escaped = true;
            } else {
              ant.targetAngle = ant.angle + randomBetween(0.8, 1.4);
            }
            ant.timer = randomBetween(0.2, 0.5);
            ant.nestBlockedCount = 0;
          }
          if (!escaped) chooseHelperDirection(ant);
        } else if (Math.abs(ant.x - oldX) > 0.35 || Math.abs(ant.y - oldY) > 0.35) {
          ant.nestBlockedCount = 0;
        }
        const nestMoved = Math.hypot(ant.x - oldX, ant.y - oldY);
        if (ant.roomId === "nest" && shouldUseNestStuckRecovery(ant)) {
          if (nestMoved < 0.08) {
            ant.nestStuckTime = (ant.nestStuckTime || 0) + delta;
            if (ant.nestStuckTime >= 1.5) hardResetNestAnt(ant, oldX, oldY);
          } else {
            ant.nestStuckTime = 0;
          }
        } else {
          ant.nestStuckTime = 0;
        }
        syncCarriedSickAnt(ant);
        syncCarriedDeadAnt(ant);
        handleHelperForaging(ant);
        handleMiddenWork(ant, delta);
        handleSoldierCombat(ant, delta);
      }
    }

    function hardResetNestAnt(ant, oldX, oldY) {
      const spawn = typeof getNestRecoverySpawnPoint === "function" ? getNestRecoverySpawnPoint(ant) : null;
      const fallback = spawn || recoverNestEntityPosition(ant, oldX, oldY) || { x: ant.x, y: ant.y };
      ant.x = fallback.x;
      ant.y = fallback.y;
      ant.nestRouteKey = null;
      ant.nestRoute = null;
      ant.nestRouteIndex = 0;
      ant.nestBlockedCount = 0;
      ant.nestStuckTime = 0;
      if (ant.job === "moving_to_rest" || ant.job === "resting") {
        ant.needsRest = false;
        ant.restTarget = null;
        ant.restTunnelIndex = null;
        ant.restSlotIndex = null;
        ant.restDuration = 0;
        ant.restMoveTimer = 0;
        ant.restTimer = randomBetween(18, 36);
      }
      if (!ant.carrying) {
        if (ant.role === "nurse") ant.job = "nursing";
        else if (ant.role === "middenworker") ant.job = "midden_patrolling";
        else if (ant.role === "soldier") ant.job = "leaving_nest";
        else if (ant.role === "storageworker") ant.job = "storage_patrolling";
        else if (ant.role === "worker") ant.job = "leaving_nest";
        ant.returnJobAfterMeal = null;
      }
      ant.timer = randomBetween(0.15, 0.45);
      ant.targetAngle = ant.angle + randomBetween(-0.4, 0.4);
    }

    function shouldUseNestStuckRecovery(ant) {
      return ant.job === "leaving_nest" ||
        ant.job === "returning_home" ||
        ant.job === "delivering" ||
        ant.job === "delivering_dead" ||
        ant.job === "delivering_sick" ||
        ant.job === "delivering_egg" ||
        ant.job === "delivering_queen_food" ||
        ant.job === "recovering_enemy_corpse" ||
        ant.job === "going_to_storage_food" ||
        ant.job === "sorting_storage" ||
        ant.job === "taking_queen_food" ||
        (ant.job === "storage_patrolling" && distance(ant, storage) >= storage.radius * 0.7) ||
        ant.job === "moving_to_rest" ||
        ant.job === "recovering_sick" ||
        ant.job === "recovering_dead" ||
        ant.job === "recovering_egg";
    }

    function updateAntRestState(ant, delta) {
      if (ant.role === "nurse" || ant.role === "middenworker" || ant.role === "storageworker") {
        ant.needsRest = false;
        ant.restTarget = null;
        ant.restTunnelIndex = null;
        ant.restSlotIndex = null;
        ant.restDuration = 0;
        ant.restMoveTimer = 0;
        return;
      }
      if (ant.job === "resting") {
        ant.restDuration -= delta;
        if (ant.restDuration <= 0) {
          ant.needsRest = false;
          ant.restTarget = null;
          ant.restTunnelIndex = null;
          ant.restSlotIndex = null;
          ant.restTimer = randomBetween(18, 36);
          ant.job = "leaving_nest";
        }
        return;
      }
      if (ant.job === "moving_to_rest") {
        ant.restMoveTimer = (ant.restMoveTimer || 0) + delta;
        if (ant.restMoveTimer > 8) {
          ant.needsRest = false;
          ant.restTarget = null;
          ant.restTunnelIndex = null;
          ant.restSlotIndex = null;
          ant.restMoveTimer = 0;
          ant.restTimer = randomBetween(12, 24);
          ant.job = ant.roomId === "nest" ? "leaving_nest" : "exploring";
          return;
        }
      } else {
        ant.restMoveTimer = 0;
      }
      if (ant.carrying || ant.needsRest) return;
      ant.restTimer -= delta;
      if (ant.restTimer <= 0) {
        ant.needsRest = true;
        ant.restTarget = getNestRestSpot(ant);
        ant.restTunnelIndex = ant.restTarget.tunnelIndex;
        ant.restSlotIndex = ant.restTarget.slotIndex;
      }
    }

    function normalizeAntHungerState(ant) {
      if (typeof ant.hungerTimer !== "number") ant.hungerTimer = getNextAntHungerInterval(ant, true);
      if (typeof ant.eatTimer !== "number") ant.eatTimer = 0;
      if (typeof ant.returnJobAfterMeal === "undefined") ant.returnJobAfterMeal = null;
    }

    function updateAntHungerState(ant, delta) {
      if (ant.dead || ant.carriedBy || ant.sick || ant.atMidden) return;
      if (ant.job === "eating_storage_food") {
        ant.eatTimer -= delta;
        if (ant.eatTimer > 0) return;
        finishAntMeal(ant);
        return;
      }
      if (ant.job === "going_to_storage_food") return;
      if (!canTrackAntMealNeed(ant)) return;
      ant.hungerTimer -= delta;
      if (ant.hungerTimer > 0 || getStoragePileCount() <= 0) return;
      if (ant.roomId !== "nest") {
        ant.returnJobAfterMeal = getMealReturnJob(ant);
        ant.job = "returning_home";
        ant.timer = randomBetween(0.05, 0.2);
        return;
      }
      if (!canInterruptForAntMeal(ant)) return;
      ant.returnJobAfterMeal = getMealReturnJob(ant);
      ant.job = "going_to_storage_food";
      ant.nestRouteKey = null;
      ant.nestRoute = null;
      ant.nestRouteIndex = 0;
      ant.timer = randomBetween(0.05, 0.2);
    }

    function canTrackAntMealNeed(ant) {
      if (ant.carrying || ant.needsRest || ant.sick || ant.atMidden) return false;
      if (ant.job === "attacking_spider" || ant.job === "recovering_sick" || ant.job === "recovering_dead" || ant.job === "recovering_enemy_corpse" || ant.job === "recovering_egg") return false;
      if (ant.job === "delivering_dead" || ant.job === "delivering_sick" || ant.job === "delivering_egg" || ant.job === "delivering_queen_food") return false;
      if (ant.role === "storageworker" && (colony.queenHungry || Array.isArray(colony.storagePile) && colony.storagePile.length > 0)) return false;
      return true;
    }

    function canInterruptForAntMeal(ant) {
      return ant.roomId === "nest" && canTrackAntMealNeed(ant);
    }

    function getMealReturnJob(ant) {
      if (ant.role === "nurse") return "nursing";
      if (ant.role === "middenworker") return "midden_patrolling";
      if (ant.role === "storageworker") return "storage_patrolling";
      if (ant.role === "soldier") return "leaving_nest";
      return "leaving_nest";
    }

    function finishAntMeal(ant) {
      ant.eatTimer = 0;
      ant.hungerTimer = getNextAntHungerInterval(ant);
      ant.job = ant.returnJobAfterMeal || getMealReturnJob(ant);
      ant.returnJobAfterMeal = null;
      ant.nestRouteKey = null;
      ant.nestRoute = null;
      ant.nestRouteIndex = 0;
    }

    function getNextAntHungerInterval(ant, initial = false) {
      const offset = ((ant.id || 1) * 17) % 37;
      const base = randomBetween(75, 130) + offset;
      return initial ? randomBetween(20, base) : base;
    }

    function updateHelperJob(ant) {
      if (ant.role === "soldier" && ant.targetSpider && (!ant.targetSpider.alive || ant.targetSpider.roomId !== ant.roomId)) {
        ant.targetSpider = null;
        if (ant.job === "attacking_spider") ant.job = ant.roomId === "nest" ? "leaving_nest" : "exploring";
      }
      if (weather.active && ant.roomId !== "nest") {
        ant.job = "returning_home";
        return;
      }
      if (ant.role === "worker" && shouldWorkerRetreatFromSpider(ant)) {
        ant.job = "retreating";
        return;
      }
      if (ant.role === "soldier" && defenseCall.active && ant.roomId === player.roomId) {
        const target = findDefenseCallTarget();
        if (target) {
          ant.targetSpider = target;
          ant.job = "attacking_spider";
          return;
        }
      }
      if (ant.job === "going_to_storage_food" || ant.job === "eating_storage_food") return;
      if (ant.hungerTimer <= 0 && ant.roomId !== "nest" && getStoragePileCount() > 0 && canTrackAntMealNeed(ant)) {
        ant.job = "returning_home";
        return;
      }
      if (ant.needsRest && !ant.carrying) {
        if (ant.roomId !== "nest") { ant.job = "returning_home"; return; }
        if (!ant.restTarget) {
          ant.restTarget = getNestRestSpot(ant);
          ant.restTunnelIndex = ant.restTarget.tunnelIndex;
          ant.restSlotIndex = ant.restTarget.slotIndex;
        }
        ant.job = distance(ant, ant.restTarget) < 18 ? "resting" : "moving_to_rest";
        if (ant.job === "resting" && ant.restDuration <= 0) ant.restDuration = 10;
        return;
      }
      if (ant.sick && ant.atMidden) { ant.job = colony.roles.middenworker > 0 ? "healing_midden" : "sick_at_midden"; return; }
      if ((ant.role === "worker" || ant.role === "nurse") && !ant.carrying && ant.roomId === "nest") {
        const egg = findAssignedPendingEgg(ant);
        if (egg) { ant.targetEgg = egg; ant.job = "recovering_egg"; return; }
      }
      if (ant.role === "nurse") {
        if (ant.roomId !== "nest") { ant.job = "returning_home"; return; }
        ant.job = "nursing";
        return;
      }
      const playerNeedsMiddenCare = player.roomId === "nest" && distance(player, midden) < midden.radius + 18 && player.health < 3;
      if (ant.role === "middenworker") {
        if (ant.roomId !== "nest") { ant.job = "returning_home"; return; }
        if (playerNeedsMiddenCare) {
          const playerMiddenCaretaker = getPlayerMiddenCaretaker() || claimPlayerMiddenWorker();
          if (playerMiddenCaretaker) {
            ant.targetPlayer = player;
            ant.job = playerMiddenCaretaker.id === ant.id ? "fussing_player" : "waiting_player_midden";
            return;
          }
          return;
        }
        const sickAnt = findNearestMiddenSickAnt(ant, 1200);
        if (sickAnt) {
          ant.targetSickAnt = sickAnt;
          ant.job = sickAnt.sickCaretakerId && sickAnt.sickCaretakerId !== ant.id ? "waiting_midden" : "healing_midden";
          return;
        }
        ant.targetSickAnt = null;
        const corpse = findNearestMiddenCorpse(ant, 1200);
        if (corpse) {
          ant.targetCorpse = corpse;
          ant.job = corpse.processingBy && corpse.processingBy !== ant.id ? "waiting_midden" : "cleaning_midden";
          return;
        }
        ant.targetCorpse = null;
        ant.job = "midden_patrolling";
        return;
      }
      if (ant.role === "storageworker") {
        if (ant.roomId !== "nest") { ant.job = "returning_home"; return; }
        if (ant.carrying === "queen_food") { ant.job = "delivering_queen_food"; return; }
        if (colony.queenHungry && hasSortedFoodForQueen()) {
          ant.targetStorageType = getAvailableQueenFoodType();
          ant.job = "taking_queen_food";
          return;
        }
        if (Array.isArray(colony.storagePile) && colony.storagePile.length > 0) {
          ant.job = "sorting_storage";
          return;
        }
        ant.job = "storage_patrolling";
        return;
      }
      if (ant.carrying === "food" && getCarriedFoodCount(ant) >= getFoodCarryLimit()) { ant.job = ant.roomId === "nest" ? "delivering" : "returning_home"; return; }
      if (ant.carrying === "dead") { ant.job = ant.roomId === "nest" ? "delivering_dead" : "returning_home"; return; }
      if (ant.carrying === "sick") { ant.job = ant.roomId === "nest" ? "delivering_sick" : "returning_home"; return; }
      if (ant.carrying === "egg") { ant.job = ant.roomId === "nest" ? "delivering_egg" : "returning_home"; return; }
      if (ant.carrying === "enemy_corpse") { ant.job = "recovering_enemy_corpse"; return; }
      if (ant.carrying && ant.carrying !== "food") { ant.job = ant.roomId === "nest" ? "delivering" : "returning_home"; return; }
      if (ant.role === "worker" && !ant.carrying && ant.roomId === "nest") {
        const enemyCorpse = findNearestRecoverableDeadEnemy(ant, 800);
        if (enemyCorpse && enemyCorpse.corpse && enemyCorpse.corpseCarrierId == null) { ant.targetEnemyCorpse = enemyCorpse; ant.job = "recovering_enemy_corpse"; return; }
      }
      if (ant.role === "middenworker" && playerNeedsMiddenCare) {
        const playerMiddenCaretaker = getPlayerMiddenCaretaker() || claimPlayerMiddenWorker();
        if (playerMiddenCaretaker) {
          ant.targetPlayer = player;
          ant.job = playerMiddenCaretaker.id === ant.id ? "fussing_player" : "waiting_player_midden";
          return;
        }
      }
      if ((ant.role === "worker" || ant.role === "soldier") && ant.roomId === "nest") {
        ant.targetCrumb = null;
        ant.targetCorpse = null;
        ant.targetEnemyCorpse = null;
        ant.targetSickAnt = null;
        if (ant.role === "worker" && (!ant.targetForageRoom || Math.random() < 0.18)) ant.targetForageRoom = chooseForageRoom(ant);
        ant.job = weather.active ? "roaming" : "leaving_nest";
        return;
      }
      if (ant.role === "soldier") {
        const spider = findNearestLiveSpider(ant, 360);
        if (spider) { ant.targetSpider = spider; ant.job = "attacking_spider"; return; }
        ant.targetSpider = null;
        ant.job = isOutdoorRoom(ant.roomId) ? "patrolling" : "leaving_nest";
        return;
      }
      if (ant.role === "worker") {
        const sickAnt = !ant.carrying ? findNearestRecoverableSickAnt(ant, 720) : null;
        if (sickAnt) { ant.targetSickAnt = sickAnt; ant.job = "recovering_sick"; return; }
        const corpseRange = weather.cleanupPriority ? 1400 : 360;
        const corpse = !ant.carrying ? findNearestRecoverableDeadAnt(ant, corpseRange) : null;
        if (corpse) { ant.targetCorpse = corpse; ant.job = "recovering_dead"; return; }
        const enemyCorpse = !ant.carrying ? findNearestRecoverableDeadEnemy(ant, 800) : null;
        if (enemyCorpse) { ant.targetEnemyCorpse = enemyCorpse; ant.job = "recovering_enemy_corpse"; return; }
        ant.targetEnemyCorpse = null;
        const crumbRange = isOutdoorRoom(ant.roomId) ? 1800 : 520;
        const target = isOutdoorRoom(ant.roomId) ? findNearestTrailReachableCrumb(ant, crumbRange) : findNearestAvailableCrumb(ant, crumbRange);
        if (target) {
          ant.targetCrumb = target;
          ant.targetForageRoom = null;
          ant.job = "foraging";
          return;
        }
        ant.targetCrumb = null;
        if (ant.carrying === "food" && getCarriedFoodCount(ant) > 0 && countAllAvailableCrumbs() === 0) {
          ant.job = ant.roomId === "nest" ? "delivering" : "returning_home";
          return;
        }
        if (!ant.targetForageRoom || ant.targetForageRoom === ant.roomId || Math.random() < 0.12) ant.targetForageRoom = chooseForageRoom(ant);
        ant.job = isOutdoorRoom(ant.roomId) ? "exploring" : "leaving_nest";
        return;
      }
      const target = findNearestAvailableCrumb(ant, 260);
      ant.targetCrumb = target;
      ant.job = target ? "foraging" : "roaming";
    }

    function chooseHelperDirection(ant) {
      if (ant.job === "leaving_nest") pointAlongNestRoute(ant, exits.nestToOverworld);
      else if (ant.job === "returning_home") {
        const exit = getHomewardExit(ant.roomId);
        if (exit) pointAlongOutdoorTrail(ant, exit);
      } else if (ant.job === "delivering") pointAlongNestRoute(ant, storage);
      else if (ant.job === "delivering_dead") pointAlongNestRoute(ant, midden);
      else if (ant.job === "delivering_sick") pointAlongNestRoute(ant, midden);
      else if (ant.job === "delivering_egg") pointAlongNestRoute(ant, nursery);
      else if (ant.job === "nursing") {
        const nurseryPoint = getNurseryPoint(ant);
        pointAlongNestRoute(ant, nurseryPoint);
      }
      else if (ant.job === "moving_to_rest" && ant.restTarget) pointAlongNestRoute(ant, ant.restTarget);
      else if (ant.job === "resting") ant.targetAngle = ant.angle;
      else if ((ant.job === "fussing_player" || ant.job === "waiting_player_midden") && player.roomId === "nest") {
        const healPoint = getMiddenWorkPoint(ant, 0);
        pointAlongNestRoute(ant, healPoint);
      }
      else if ((ant.job === "cleaning_midden" || ant.job === "waiting_midden" || ant.job === "midden_patrolling") && ant.targetCorpse) {
        const point = getMiddenWorkPoint(ant, 1);
        pointAlongNestRoute(ant, point);
      }
      else if ((ant.job === "healing_midden" || ant.job === "waiting_midden") && ant.targetSickAnt) {
        const point = getMiddenWorkPoint(ant, 2);
        pointAlongNestRoute(ant, point);
      }
      else if (ant.job === "midden_patrolling") {
        const patrolPoint = getMiddenWorkPoint(ant, 3);
        pointAlongNestRoute(ant, patrolPoint);
        ant.targetAngle += Math.sin(performance.now() / 700 + ant.x) * 0.12;
      }
      else if (ant.job === "storage_patrolling") {
        pointAlongNestRoute(ant, getStorageWorkPoint(ant));
        ant.targetAngle += Math.sin(performance.now() / 680 + ant.x) * 0.12;
      }
      else if (ant.job === "going_to_storage_food") pointAlongNestRoute(ant, getStorageMealPoint(ant));
      else if (ant.job === "eating_storage_food") ant.targetAngle = ant.angle;
      else if (ant.job === "sorting_storage") pointAlongNestRoute(ant, getStorageCentralPoint());
      else if (ant.job === "taking_queen_food") pointAlongNestRoute(ant, getStoragePilePoint(ant.targetStorageType || getAvailableQueenFoodType() || "seed"));
      else if (ant.job === "delivering_queen_food") pointAlongNestRoute(ant, queen);
      else if (ant.job === "attacking_spider" && ant.targetSpider && ant.targetSpider.alive && ant.targetSpider.roomId === ant.roomId) ant.targetAngle = Math.atan2(ant.targetSpider.y - ant.y, ant.targetSpider.x - ant.x);
      else if (ant.job === "retreating") pointAlongOutdoorTrail(ant, getWorkerRetreatPoint(ant));
      else if (ant.job === "recovering_sick" && ant.targetSickAnt && !ant.targetSickAnt.atMidden) pointAlongNestRoute(ant, ant.targetSickAnt);
      else if (ant.job === "recovering_dead" && ant.targetCorpse && !ant.targetCorpse.carried) pointAlongNestRoute(ant, ant.targetCorpse);
      else if (ant.job === "recovering_enemy_corpse") {
        if (ant.roomId === "nest" && ant.carrying === "enemy_corpse") pointAlongNestRoute(ant, storage);
        else if (ant.roomId === "nest" && ant.targetEnemyCorpse && ant.targetEnemyCorpse.corpse && ant.targetEnemyCorpse.roomId === "nest") pointAlongNestRoute(ant, ant.targetEnemyCorpse);
        else if (ant.carrying === "enemy_corpse") {
          const exit = getHomewardExit(ant.roomId);
          if (exit) pointAlongOutdoorTrail(ant, exit);
        } else if (ant.targetEnemyCorpse && ant.targetEnemyCorpse.corpse && ant.targetEnemyCorpse.roomId === ant.roomId) {
          ant.targetAngle = Math.atan2(ant.targetEnemyCorpse.y - ant.y, ant.targetEnemyCorpse.x - ant.x);
        } else {
          ant.targetEnemyCorpse = null;
          ant.job = ant.roomId === "nest" ? (ant.role === "worker" ? "leaving_nest" : getMealReturnJob(ant)) : "returning_home";
        }
      }
      else if (ant.job === "foraging" && ant.targetCrumb && !ant.targetCrumb.collected) ant.targetAngle = Math.atan2(ant.targetCrumb.y - ant.y, ant.targetCrumb.x - ant.x);
      else if (ant.job === "recovering_egg" && ant.targetEgg && !ant.targetEgg.carriedBy) pointAlongNestRoute(ant, ant.targetEgg);
      else if (ant.job === "exploring" && isOutdoorRoom(ant.roomId)) {
        const forageExit = getForageTravelExit(ant);
        pointAlongOutdoorTrail(ant, forageExit || getSafeOutdoorRoamPoint(ant));
      }
      else if (ant.job === "patrolling" && isOutdoorRoom(ant.roomId)) {
        pointAlongOutdoorTrail(ant, getSafeOutdoorPatrolPoint(ant));
      } else if (isOutdoorRoom(ant.roomId) && Math.random() < 0.12) {
        pointAlongOutdoorTrail(ant, getSafeOutdoorRoamPoint(ant));
      } else {
        ant.targetAngle = ant.angle + randomBetween(-0.8, 0.8);
      }
    }

    function handleHelperForaging(ant) {
      if ((ant.role === "worker" || ant.role === "nurse") && !ant.carrying && ant.targetEgg && ant.targetEgg.carriedBy == null && !ant.targetEgg.inNursery && distance(ant, ant.targetEgg) < ant.radius + 18) {
        ant.targetEgg.carriedBy = ant.id;
        ant.carrying = "egg";
      }
      if (ant.role === "worker" && !ant.carrying && ant.targetSickAnt && !ant.targetSickAnt.atMidden && !ant.targetSickAnt.carriedBy && ant.targetSickAnt.roomId === ant.roomId && distance(ant, ant.targetSickAnt) < ant.radius + ant.targetSickAnt.radius + 8) {
        ant.targetSickAnt.carried = true;
        ant.targetSickAnt.carriedBy = ant.id;
        ant.carrying = "sick";
        pointTowardExit(ant, getHomewardExit(ant.roomId));
      }
      if (ant.role === "worker" && !ant.carrying && ant.targetCorpse && ant.targetCorpse.roomId === ant.roomId && !ant.targetCorpse.carried && distance(ant, ant.targetCorpse) < ant.radius + ant.targetCorpse.radius + 8) {
        ant.targetCorpse.carried = true;
        ant.targetCorpse.carriedBy = ant.id;
        ant.carrying = "dead";
        pointTowardExit(ant, getHomewardExit(ant.roomId));
      }
      if (ant.role === "worker" && !ant.carrying && ant.targetEnemyCorpse && ant.targetEnemyCorpse.corpse && ant.targetEnemyCorpse.corpseCarrierId == null && ant.targetEnemyCorpse.roomId === ant.roomId && distance(ant, ant.targetEnemyCorpse) < ant.radius + ant.targetEnemyCorpse.radius + 10) {
        ant.targetEnemyCorpse.corpseCarrierId = ant.id;
        ant.carrying = "enemy_corpse";
        ant.carryingFood = { kind: ant.targetEnemyCorpse.kind || "spider" };
        if (ant.roomId === "nest") pointAlongNestRoute(ant, storage);
        else pointTowardExit(ant, getHomewardExit(ant.roomId));
      }
      if (isOutdoorRoom(ant.roomId) && canCarryMoreFood(ant) && ant.targetCrumb && ant.targetCrumb.roomId === ant.roomId && !ant.targetCrumb.collected && distance(ant, ant.targetCrumb) < ant.radius + ant.targetCrumb.radius + 6) {
        addFoodToCarrier(ant, ant.targetCrumb);
        ant.targetCrumb.collected = true;
        ant.targetCrumb = null;
        if (getCarriedFoodCount(ant) >= getFoodCarryLimit()) pointTowardExit(ant, getHomewardExit(ant.roomId));
      }
      if (ant.roomId === "nest" && ant.carrying === "dead" && distance(ant, midden) < midden.radius + 18) {
        if (ant.targetCorpse) {
          const index = deadAnts.indexOf(ant.targetCorpse);
          if (index >= 0) {
            const corpse = deadAnts[index];
            corpse.carried = false;
            corpse.carriedBy = null;
            corpse.atMidden = true;
            corpse.roomId = "nest";
            corpse.processingBy = null;
            corpse.middenProgress = 0;
            const pileIndex = deadAnts.filter(item => item.atMidden && item !== corpse).length;
            corpse.x = midden.x - 28 + (pileIndex * 13) % 56;
            corpse.y = midden.y - 12 + Math.floor(pileIndex / 5) * 9;
            colony.recoveredDead += 1;
          }
        }
        ant.carrying = false;
        ant.targetCorpse = null;
        objectiveText.textContent = "A worker carried a dead ant to the midden.";
        saveGame(false);
      }
      if (ant.roomId === "nest" && ant.carrying === "sick" && distance(ant, midden) < midden.radius + 18) {
        if (ant.targetSickAnt) {
          ant.targetSickAnt.carried = false;
          ant.targetSickAnt.carriedBy = null;
          ant.targetSickAnt.atMidden = true;
          ant.targetSickAnt.sickMiddenProgress = 0;
          ant.targetSickAnt.sickTimer = Math.max(ant.targetSickAnt.sickTimer, 12);
          ant.targetSickAnt.roomId = "nest";
          ant.targetSickAnt.x = midden.x - 12;
          ant.targetSickAnt.y = midden.y + 12;
        }
        ant.carrying = false;
        ant.targetSickAnt = null;
        objectiveText.textContent = "A worker carried a sick ant to the midden.";
        saveGame(false);
      }
      if (ant.roomId === "nest" && ant.carrying === "egg" && distance(ant, nursery) < nursery.rx + 18) {
        depositEggInNursery(ant.id);
        ant.carrying = false;
        ant.targetEgg = null;
        objectiveText.textContent = "An ant carried the queen's egg to the nursery.";
        saveGame(false);
      }
      if (ant.roomId === "nest" && ant.carrying === "food" && distance(ant, storage) < storage.radius + 18) {
        depositFoodToStorage(ant);
        objectiveText.textContent = "A worker dropped food in the storage room.";
        scheduleCrumbRespawnIfNeeded();
        saveGame(false);
      }
      if (ant.roomId === "nest" && ant.carrying === "enemy_corpse" && distance(ant, storage) < storage.radius + 18) {
        const corpse = ant.targetEnemyCorpse || spiders.find(enemy => enemy.corpse && enemy.corpseCarrierId === ant.id);
        if (corpse) startEnemyRespawn(corpse);
        depositEnemyCorpseToStorage(ant);
        ant.targetEnemyCorpse = null;
        objectiveText.textContent = "A worker stored an enemy corpse as food.";
        saveGame(false);
      }
      if (ant.roomId === "nest" && ant.job === "going_to_storage_food" && distance(ant, getStorageMealPoint(ant)) < ant.radius + 16) {
        const meal = takeFoodForAntMeal();
        if (meal) {
          ant.job = "eating_storage_food";
          ant.eatTimer = randomBetween(2.2, 4.2);
          objectiveText.textContent = `A ${formatRoleLabel(ant.role)} ate from storage.`;
          saveGame(false);
        } else {
          finishAntMeal(ant);
        }
      }
      if (ant.role === "storageworker" && ant.roomId === "nest" && ant.job === "sorting_storage" && !ant.carrying && distance(ant, getStorageCentralPoint()) < ant.radius + 18) {
        const food = sortOneStoredFood();
        if (food) {
          ant.targetStorageType = food.type || "seed";
          objectiveText.textContent = "A storage worker sorted food by colour.";
        }
      }
      if (ant.role === "storageworker" && ant.roomId === "nest" && ant.job === "taking_queen_food" && !ant.carrying) {
        const point = getStoragePilePoint(ant.targetStorageType || getAvailableQueenFoodType() || "seed");
        if (distance(ant, point) < ant.radius + 18) {
          const food = takeFoodForQueen(ant.targetStorageType);
          if (food) {
            ant.carrying = "queen_food";
            ant.carryingFood = food;
            ant.job = "delivering_queen_food";
          }
        }
      }
      if (ant.role === "storageworker" && ant.roomId === "nest" && ant.carrying === "queen_food" && distance(ant, queen) < queen.radius + 34) {
        feedQueenStoredFood(ant);
        saveGame(false);
      }
    }

    function pointAlongOutdoorTrail(ant, target) {
      if (!target) {
        ant.targetAngle = ant.angle + randomBetween(-0.5, 0.5);
        return;
      }
      if (!isOutdoorRoom(ant.roomId)) {
        ant.targetAngle = Math.atan2(target.y - ant.y, target.x - ant.x);
        return;
      }
      if (typeof getNextSafeTrailWaypoint !== "function") {
        ant.targetAngle = Math.atan2(target.y - ant.y, target.x - ant.x);
        return;
      }
      const waypoint = getNextSafeTrailWaypoint(ant, target);
      ant.targetAngle = Math.atan2(waypoint.y - ant.y, waypoint.x - ant.x);
    }

    function getSafeOutdoorRoamPoint(ant) {
      return typeof getTrailRoamPoint === "function" ? getTrailRoamPoint(ant) : getRandomRoomExit(ant.roomId);
    }

    function chooseForageRoom(ant) {
      const candidates = ["overworld", "patio", "sandpit", "garden"];
      const scored = candidates
        .map(roomId => ({ roomId, count: countAvailableCrumbsInRoom(roomId) }))
        .filter(item => item.count > 0);
      if (scored.length === 0) return "overworld";
      scored.sort((a, b) => b.count - a.count);
      const spread = Math.min(3, scored.length);
      const index = Math.abs(((ant.id || 0) + Math.floor(performance.now() / 5000))) % spread;
      return scored[index].roomId;
    }

    function countAvailableCrumbsInRoom(roomId) {
      let total = 0;
      for (const crumb of crumbs) {
        if (!crumb.collected && crumb.roomId === roomId) total += 1;
      }
      return total;
    }

    function countAllAvailableCrumbs() {
      let total = 0;
      for (const crumb of crumbs) {
        if (!crumb.collected) total += 1;
      }
      return total;
    }

    function getForageTravelExit(ant) {
      if (!ant.targetForageRoom || ant.targetForageRoom === ant.roomId) return null;
      if (ant.roomId === "overworld") {
        if (ant.targetForageRoom === "patio") return exits.overworldToPatio;
        if (ant.targetForageRoom === "sandpit") return exits.overworldToSandpit;
        if (ant.targetForageRoom === "garden") return exits.overworldToGarden;
      }
      if (ant.roomId === "patio") return exits.patioToOverworld;
      if (ant.roomId === "sandpit") return exits.sandpitToOverworld;
      if (ant.roomId === "garden") return exits.gardenToOverworld;
      return null;
    }

    function getSafeOutdoorPatrolPoint(ant) {
      return typeof getTrailPatrolPoint === "function" ? getTrailPatrolPoint(ant) : getRandomRoomExit(ant.roomId);
    }

    function entityIsOnSafeTrail(entity, extraRadius = 0) {
      return typeof isOnSafeTrail === "function" && isOnSafeTrail(entity, extraRadius);
    }

    function markWorkerThreatenedBySpider(worker, spider) {
      if (!worker || worker.dead || worker.role !== "worker" || !spider || !spider.alive) return;
      if (worker.roomId !== spider.roomId || entityIsOnSafeTrail(worker, worker.radius)) return;
      worker.threatSpiderId = spider.id;
      worker.retreatUntil = performance.now() + 3600;
      worker.job = "retreating";
      worker.timer = 0;
      summonSoldierForWorkerThreat(worker, spider);
    }

    function shouldWorkerRetreatFromSpider(worker) {
      const spider = getWorkerThreatSpider(worker);
      if (!spider) {
        worker.threatSpiderId = null;
        worker.retreatUntil = 0;
        return false;
      }
      const safeDistance = 380;
      if (entityIsOnSafeTrail(worker, worker.radius) && distance(worker, spider) > safeDistance) {
        worker.threatSpiderId = null;
        worker.retreatUntil = 0;
        return false;
      }
      return performance.now() < (worker.retreatUntil || 0) || distance(worker, spider) < safeDistance;
    }

    function getWorkerThreatSpider(worker) {
      if (!worker.threatSpiderId) return null;
      for (const spider of spiders) {
        if (spider.id === worker.threatSpiderId && spider.alive && spider.roomId === worker.roomId) return spider;
      }
      return null;
    }

    function getWorkerRetreatPoint(worker) {
      const spider = getWorkerThreatSpider(worker);
      if (!isOutdoorRoom(worker.roomId)) return getHomewardExit(worker.roomId);
      if (typeof getSafeTrailNavigationNodes !== "function") return getHomewardExit(worker.roomId);
      const nodes = getSafeTrailNavigationNodes(worker.roomId);
      if (nodes.length === 0) return getHomewardExit(worker.roomId);
      let best = null;
      let bestScore = Infinity;
      for (const node of nodes) {
        const spiderDistance = spider ? distance(node, spider) : Infinity;
        if (spider && spiderDistance < 330) continue;
        const score = distance(worker, node) - Math.min(spiderDistance, 520) * 0.35;
        if (score < bestScore) {
          best = node;
          bestScore = score;
        }
      }
      if (best) return best;
      const nearestTrail = typeof getNearestSafeTrailPoint === "function" ? getNearestSafeTrailPoint(worker.roomId, worker.x, worker.y) : null;
      return nearestTrail || getHomewardExit(worker.roomId);
    }

    function summonSoldierForWorkerThreat(worker, spider) {
      if (!spider || !spider.alive) return null;
      let nearest = null;
      let nearestDistance = Infinity;
      let fallback = null;
      let fallbackDistance = Infinity;
      for (const soldier of helpers) {
        if (soldier.dead || soldier.role !== "soldier" || soldier.roomId !== spider.roomId || soldier.carriedBy) continue;
        const d = distance(worker, soldier);
        if (soldier.job === "attacking_spider" && soldier.targetSpider && soldier.targetSpider.alive) {
          if (d < fallbackDistance) {
            fallback = soldier;
            fallbackDistance = d;
          }
          continue;
        }
        if (d < nearestDistance) {
          nearest = soldier;
          nearestDistance = d;
        }
      }
      const soldier = nearest || fallback;
      if (!soldier) return null;
      soldier.targetSpider = spider;
      soldier.job = "attacking_spider";
      soldier.timer = 0;
      spider.targetMode = "soldier";
      spider.targetAntId = soldier.id;
      spider.soldierFocusTimer = 5;
      if (worker.roomId === player.roomId) objectiveText.textContent = `A worker cried for help. A soldier is intercepting the ${typeof getEnemyLabel === "function" ? getEnemyLabel(spider) : "enemy"}.`;
      return soldier;
    }

    function pointAlongNestRoute(ant, target) {
      if (!target) {
        ant.targetAngle = ant.angle + randomBetween(-0.8, 0.8);
        return;
      }
      if (ant.roomId !== "nest") {
        ant.targetAngle = Math.atan2(target.y - ant.y, target.x - ant.x);
        return;
      }
      const waypoint = getNextNestWaypoint(ant, target);
      ant.targetAngle = Math.atan2(waypoint.y - ant.y, waypoint.x - ant.x);
    }

    function getNextNestWaypoint(ant, target) {
      const nodes = getNestNavigationNodes();
      const targetKey = getNestRouteKey(target);
      if (ant.nestRouteKey !== targetKey || !Array.isArray(ant.nestRoute) || ant.nestRoute.length === 0) {
        let startIndex = findNearestVisibleNestNode(ant, nodes);
        let goalIndex = findNearestVisibleNestNode(target, nodes);
        if (startIndex < 0) startIndex = findNearestNestNode(ant, nodes);
        if (goalIndex < 0) goalIndex = findNearestNestNode(target, nodes);
        if (startIndex < 0 || goalIndex < 0) return target;
        const path = findNestPath(nodes, startIndex, goalIndex);
        if (path.length < 2) return target;
        ant.nestRouteKey = targetKey;
        ant.nestRoute = path;
        ant.nestRouteIndex = 0;
      }
      const route = ant.nestRoute;
      if (!route || ant.nestRouteIndex >= route.length) return target;
      let waypoint = nodes[route[ant.nestRouteIndex]];
      while (waypoint && distance(ant, waypoint) < 24 && ant.nestRouteIndex < route.length - 1) {
        ant.nestRouteIndex += 1;
        waypoint = nodes[route[ant.nestRouteIndex]];
      }
      if (!waypoint) return target;
      return waypoint;
    }

    function getNestRouteKey(target) {
      return `${Math.round(target.x)}:${Math.round(target.y)}:${target.roomId || "nest"}`;
    }

    function getNestNavigationNodes() {
      const key = `${rooms.nest.width}:${rooms.nest.height}:${midden.x}:${midden.y}:${storage.x}:${storage.y}:${nursery.radius}`;
      if (getNestNavigationNodes.cacheKey === key && getNestNavigationNodes.cache) return getNestNavigationNodes.cache;
      const nodes = [];
      for (const chamber of getNestChambers()) nodes.push({ x: chamber.x, y: chamber.y, links: [] });
      for (const route of getNestTunnelRoutes()) {
        for (const point of route.points) {
          let index = nodes.findIndex(node => Math.hypot(node.x - point.x, node.y - point.y) < 6);
          if (index < 0) {
            index = nodes.length;
            nodes.push({ x: point.x, y: point.y, links: [] });
          }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (!hasNestLineOfSight(nodes[i], nodes[j], getNestNavigationClearance())) continue;
          nodes[i].links.push(j);
          nodes[j].links.push(i);
        }
      }
      getNestNavigationNodes.cacheKey = key;
      getNestNavigationNodes.cache = nodes;
      return nodes;
    }

    function findNearestVisibleNestNode(entity, nodes) {
      let best = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        if (!hasNestLineOfSight(entity, nodes[i], entity.radius || 10)) continue;
        const d = distance(entity, nodes[i]);
        if (d < bestDistance) {
          best = i;
          bestDistance = d;
        }
      }
      return best;
    }

    function getNestNavigationClearance() {
      return 14;
    }

    function findNearestNestNode(entity, nodes) {
      let best = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const d = distance(entity, nodes[i]);
        if (d < bestDistance) {
          best = i;
          bestDistance = d;
        }
      }
      return best;
    }

    function findNestPath(nodes, startIndex, goalIndex) {
      const queue = [startIndex];
      const previous = new Array(nodes.length).fill(-1);
      previous[startIndex] = startIndex;
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor];
        if (current === goalIndex) break;
        for (const next of nodes[current].links) {
          if (previous[next] !== -1) continue;
          previous[next] = current;
          queue.push(next);
        }
      }
      if (previous[goalIndex] === -1) return [];
      const path = [];
      for (let at = goalIndex; at !== startIndex; at = previous[at]) path.push(at);
      path.push(startIndex);
      return path.reverse();
    }

    function hasNestLineOfSight(a, b, radius) {
      const steps = Math.max(4, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 28));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        if (!isNestWalkable(x, y, radius)) return false;
      }
      return true;
    }

    function handleSoldierCombat(ant, delta) {
      if (ant.role !== "soldier" || ant.job !== "attacking_spider" || !ant.targetSpider) return;
      if (!ant.targetSpider.alive || ant.targetSpider.roomId !== ant.roomId) {
        ant.targetSpider = null;
        ant.job = ant.roomId === "nest" ? "leaving_nest" : "exploring";
        return;
      }
      if (distance(ant, ant.targetSpider) > ant.radius + ant.targetSpider.radius + 12) return;
      ant.targetSpider.targetMode = "soldier";
      ant.targetSpider.targetAntId = ant.id;
      ant.targetSpider.soldierFocusTimer = 4;
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

    function handleMiddenWork(ant, delta) {
      if (ant.role !== "middenworker" || ant.roomId !== "nest") return;
      const playerNeedsMiddenCare = player.roomId === "nest" && distance(player, midden) < midden.radius + 18 && player.health < 3;
      if (playerNeedsMiddenCare) {
        if (!player.middenCaretakerId) player.middenCaretakerId = ant.id;
        if (player.middenCaretakerId !== ant.id) {
          ant.job = "waiting_player_midden";
          ant.targetPlayer = player;
          return;
        }
        const healPoint = getMiddenWorkPoint(ant, 0);
        ant.targetPlayer = player;
        if (distance(ant, healPoint) > ant.radius + 10) {
          ant.job = "fussing_player";
          return;
        }
        ant.job = "fussing_player";
        return;
      }
      if (player.middenCaretakerId === ant.id) {
        player.middenCaretakerId = null;
        player.middenHealProgress = 0;
      }
      const sickAnt = ant.targetSickAnt && ant.targetSickAnt.atMidden ? ant.targetSickAnt : findNearestMiddenSickAnt(ant, 1200);
      if (sickAnt) {
        if (sickAnt.sickCaretakerId && sickAnt.sickCaretakerId !== ant.id) {
          ant.job = "waiting_midden";
          ant.targetSickAnt = sickAnt;
          return;
        }
        sickAnt.sickCaretakerId = ant.id;
        ant.targetSickAnt = sickAnt;
        const point = getMiddenWorkPoint(ant, 2);
        if (distance(ant, point) > ant.radius + 12) return;
        ant.job = "healing_midden";
        sickAnt.sickMiddenProgress = (sickAnt.sickMiddenProgress || 0) + delta;
        if (sickAnt.sickMiddenProgress < 5) return;
        recoverSickEntity(sickAnt, false);
        ant.targetSickAnt = null;
        objectiveText.textContent = "A midden worker healed a sick ant.";
        return;
      }
      const corpse = ant.targetCorpse && ant.targetCorpse.atMidden ? ant.targetCorpse : findNearestMiddenCorpse(ant, 1200);
      if (!corpse) {
        ant.targetCorpse = null;
        return;
      }
      if (corpse.processingBy && corpse.processingBy !== ant.id) {
        ant.job = "waiting_midden";
        ant.targetCorpse = corpse;
        return;
      }
      corpse.processingBy = ant.id;
      ant.targetCorpse = corpse;
      const point = getMiddenWorkPoint(ant, 1);
      if (distance(ant, point) > ant.radius + 12) return;
      ant.job = "cleaning_midden";
      corpse.middenProgress = (corpse.middenProgress || 0) + delta;
      if (corpse.middenProgress < 4) return;
      const index = deadAnts.indexOf(corpse);
      if (index >= 0) deadAnts.splice(index, 1);
      colony.recoveredDead = Math.max(0, colony.recoveredDead - 1);
      ant.targetCorpse = null;
      objectiveText.textContent = "A midden worker cleared a dead ant from the midden.";
      saveGame(false);
    }

    function addCombatEffect(x, y, type) {
      combatEffects.push({ x, y, type, time: 0.55, maxTime: 0.55 });
    }

    function killAnt(ant, source) {
      if (ant.carrying === "sick" && ant.targetSickAnt) {
        const sick = ant.targetSickAnt;
        sick.carried = false;
        sick.carriedBy = null;
        sick.roomId = ant.roomId;
        sick.x = ant.x;
        sick.y = ant.y;
        sick.atMidden = false;
        sick.sickCaretakerId = null;
        ant.targetSickAnt = null;
      }
      if (ant.carrying === "enemy_corpse") {
        const corpse = ant.targetEnemyCorpse || spiders.find(enemy => enemy.corpse && enemy.corpseCarrierId === ant.id);
        if (corpse) {
          corpse.corpseCarrierId = null;
          corpse.roomId = ant.roomId;
          corpse.x = ant.x;
          corpse.y = ant.y;
        }
        ant.targetEnemyCorpse = null;
      }
      ant.dead = true;
      colony.ants = Math.max(0, colony.ants - 1);
      if (colony.roles[ant.role] > 0) colony.roles[ant.role] -= 1;
      if (typeof ensureMinimumRolePopulation === "function") ensureMinimumRolePopulation();
      else if (typeof syncColonyRoleCounts === "function") syncColonyRoleCounts();
      if (typeof syncEggFoodRequirement === "function") syncEggFoodRequirement();
      deadAnts.push(createRecoverableDeadAnt(ant.roomId, ant.x, ant.y, ant.radius, ant.role));
      if (source) source.aggro = false;
      objectiveText.textContent = `A ${formatRoleLabel(ant.role)} died. Workers will recover the body.`;
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

    function createRecoverableDeadAnt(roomId, x, y, radius, role) {
      const corpse = { roomId, x, y, radius, role, carried: false, carriedBy: null, atMidden: false };
      if (roomId === "nest" && !isNestWalkable(x, y, radius)) {
        const safeSpot = findNearestNestSafeSpot({ roomId, x, y, radius }, x, y);
        if (safeSpot) {
          corpse.x = safeSpot.x;
          corpse.y = safeSpot.y;
        }
      }
      return corpse;
    }

    function findNearestRecoverableDeadAnt(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const corpse of deadAnts) {
        if (corpse.carried || corpse.atMidden || corpse.roomId !== entity.roomId) continue;
        if (corpse.roomId === "nest" && !isNestWalkable(corpse.x, corpse.y, corpse.radius || 10)) {
          const safeSpot = findNearestNestSafeSpot({ roomId: "nest", x: corpse.x, y: corpse.y, radius: corpse.radius || 10 }, corpse.x, corpse.y);
          if (safeSpot) {
            corpse.x = safeSpot.x;
            corpse.y = safeSpot.y;
          }
        }
        const d = distance(entity, corpse);
        if (d < nearestDistance) { nearest = corpse; nearestDistance = d; }
      }
      return nearest;
    }

    function findNearestRecoverableDeadEnemy(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const enemy of spiders) {
        if (!enemy.corpse || enemy.corpseCarrierId != null || enemy.roomId !== entity.roomId) continue;
        const d = distance(entity, enemy);
        if (d < nearestDistance) { nearest = enemy; nearestDistance = d; }
      }
      return nearest;
    }

    function findNearestRecoverableSickAnt(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const ant of helpers) {
        if (ant.dead || ant === entity || ant.carriedBy || ant.atMidden || !ant.sick || ant.roomId !== entity.roomId) continue;
        const d = distance(entity, ant);
        if (d < nearestDistance) { nearest = ant; nearestDistance = d; }
      }
      return nearest;
    }

    function findNearestMiddenCorpse(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const corpse of deadAnts) {
        if (!corpse.atMidden || corpse.carried) continue;
        if (corpse.processingBy && corpse.processingBy !== entity.id) continue;
        const d = distance(entity, corpse);
        if (d < nearestDistance) { nearest = corpse; nearestDistance = d; }
      }
      return nearest;
    }

    function findNearestMiddenSickAnt(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const ant of helpers) {
        if (ant.dead || !ant.sick || !ant.atMidden) continue;
        if (ant.sickCaretakerId && ant.sickCaretakerId !== entity.id) continue;
        const d = distance(entity, ant);
        if (d < nearestDistance) { nearest = ant; nearestDistance = d; }
      }
      return nearest;
    }

    function getPlayerMiddenCaretaker() {
      if (player.middenCaretakerId == null) return null;
      const caretaker = helpers.find(ant => !ant.dead && ant.id === player.middenCaretakerId && ant.role === "middenworker");
      if (caretaker) return caretaker;
      player.middenCaretakerId = null;
      player.middenHealProgress = 0;
      return null;
    }

    function claimPlayerMiddenWorker() {
      if (player.health >= 3 || player.roomId !== "nest" || distance(player, midden) >= midden.radius + 18) return null;
      const candidate = findAvailableMiddenWorkerForPlayer();
      if (!candidate) return null;
      player.middenCaretakerId = candidate.id;
      return candidate;
    }

    function findAvailableMiddenWorkerForPlayer() {
      let nearest = null;
      let nearestDistance = Infinity;
      for (const ant of helpers) {
        if (ant.dead || ant.role !== "middenworker" || ant.roomId !== "nest") continue;
        if (ant.carrying || ant.needsRest) continue;
        if (ant.job === "cleaning_midden" || ant.job === "healing_midden" || ant.job === "waiting_midden" || ant.job === "fussing_player") continue;
        const d = distance(ant, player);
        if (d < nearestDistance) {
          nearest = ant;
          nearestDistance = d;
        }
      }
      return nearest;
    }

    function getMiddenPatrolPoint() {
      return getMiddenWorkPoint(null, 3);
    }

    function getMiddenHealPoint() {
      return getMiddenWorkPoint(null, 0);
    }

    function getMiddenWorkPoint(ant, offset = 0) {
      const slots = [
        { x: midden.x - 12, y: midden.y + 2 },
        { x: midden.x + 4, y: midden.y - 8 },
        { x: midden.x + 10, y: midden.y + 10 }
      ];
      const index = Math.abs(((ant && ant.id) || 0) + offset) % slots.length;
      return slots[index];
    }

    function getStorageWorkPoint(ant) {
      const slots = [
        { x: storage.x - 18, y: storage.y + 4 },
        { x: storage.x + 8, y: storage.y - 10 },
        { x: storage.x + 18, y: storage.y + 12 }
      ];
      const index = Math.abs((ant && ant.id) || 0) % slots.length;
      return slots[index];
    }

    function getStorageMealPoint(ant) {
      const slots = [
        { x: storage.x - 32, y: storage.y - 18 },
        { x: storage.x - 12, y: storage.y + 28 },
        { x: storage.x + 24, y: storage.y + 18 },
        { x: storage.x + 32, y: storage.y - 16 },
        { x: storage.x, y: storage.y - 36 }
      ];
      const index = Math.abs((ant && ant.id) || 0) % slots.length;
      return slots[index];
    }

    function getNurseryPoint(ant) {
      const slots = [
        { x: nursery.x - 10, y: nursery.y + 2 },
        { x: nursery.x + 4, y: nursery.y - 6 },
        { x: nursery.x + 12, y: nursery.y + 10 }
      ];
      return slots[Math.abs((ant && ant.id) || 0) % slots.length];
    }

    function syncCarriedSickAnt(carrier) {
      if (carrier.carrying !== "sick" || !carrier.targetSickAnt) return;
      const sickAnt = carrier.targetSickAnt;
      sickAnt.roomId = carrier.roomId;
      sickAnt.x = carrier.x - Math.cos(carrier.angle) * 20;
      sickAnt.y = carrier.y - Math.sin(carrier.angle) * 20;
      sickAnt.sickCarrierId = carrier.id;
      sickAnt.carriedBy = carrier.id;
    }

    function syncCarriedDeadAnt(carrier) {
      if (carrier.carrying !== "dead" || !carrier.targetCorpse) return;
      const corpse = carrier.targetCorpse;
      corpse.roomId = carrier.roomId;
      corpse.x = carrier.x - Math.cos(carrier.angle) * 20;
      corpse.y = carrier.y - Math.sin(carrier.angle) * 20;
      corpse.carriedBy = carrier.id;
    }

    function findAvailableQueenEgg(entity, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const egg of colony.eggs) {
        if (egg.inNursery || egg.carriedBy != null) continue;
        const d = Math.hypot(entity.x - egg.x, entity.y - egg.y);
        if (d < nearestDistance) { nearest = egg; nearestDistance = d; }
      }
      return nearest;
    }

    function findAssignedPendingEgg(ant) {
      const egg = findAvailableQueenEgg(ant, Infinity);
      if (!egg) return null;
      let assigned = null;
      let assignedDistance = Infinity;
      for (const helper of helpers) {
        if (helper.dead || helper.roomId !== "nest" || helper.carrying || helper.needsRest) continue;
        if (helper.role !== "worker" && helper.role !== "nurse") continue;
        const d = distance(helper, egg);
        if (d < assignedDistance) {
          assigned = helper;
          assignedDistance = d;
        }
      }
      return assigned && assigned.id === ant.id ? egg : null;
    }

    function depositEggInNursery(carrierId) {
      const egg = colony.eggs.find(item => item.carriedBy === carrierId && !item.inNursery);
      if (!egg) return false;
      egg.carriedBy = null;
      egg.inNursery = true;
      egg.x = nursery.x - 36;
      egg.y = nursery.y - 4;
      player.carrying = player.carrying === "egg" && carrierId === "player" ? false : player.carrying;
      objectiveText.textContent = "The egg is safe in the nursery and has begun incubating.";
      saveGame(false);
      return true;
    }

    function findNearestSoldierForSpider(spider, range) {
      let nearest = null;
      let nearestDistance = range;
      for (const ant of helpers) {
        if (ant.dead || ant.role !== "soldier" || ant.roomId !== spider.roomId) continue;
        const d = distance(spider, ant);
        if (d < nearestDistance) { nearest = ant; nearestDistance = d; }
      }
      return nearest;
    }

    function findDefenseCallTarget() {
      if (!defenseCall.active || !defenseCall.targetSpiderId) return null;
      for (const spider of spiders) {
        if (spider.id !== defenseCall.targetSpiderId || !spider.alive || spider.roomId !== player.roomId) continue;
        return spider;
      }
      return null;
    }

    function countSoldiersNearSpider(spider, range) {
      return helpers.filter(ant => !ant.dead && ant.role === "soldier" && ant.roomId === spider.roomId && distance(ant, spider) < range).length;
    }

    function approachAngle(current, target, maxStep) {
      const delta = normalizeAngle(target - current);
      if (Math.abs(delta) <= maxStep) return target;
      return current + Math.sign(delta) * maxStep;
    }

    function normalizeAngle(angle) {
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      return angle;
    }

    function getNestRestSpot(ant) {
      const tunnels = getVisibleNestTunnels().filter(tunnel => !tunnel.excavating);
      if (tunnels.length === 0) return getNestFallbackRestSpot();
      const assignments = collectNestRestAssignments();
      const freeSlots = [];

      for (let tunnelIndex = 0; tunnelIndex < tunnels.length; tunnelIndex++) {
        const tunnel = tunnels[tunnelIndex];
        const capacity = getNestRestCapacity(tunnel);
        for (let slotIndex = 0; slotIndex < capacity; slotIndex++) {
          if (assignments.has(`${tunnelIndex}:${slotIndex}`)) continue;
          freeSlots.push(createNestRestSlot(tunnel, tunnelIndex, slotIndex));
        }
      }

      const usableSlots = freeSlots.filter(slot => distance(slot, midden) > 240 && slot.x < midden.x - 80);
      const slotPool = usableSlots.length > 0 ? usableSlots : freeSlots.slice().sort((a, b) => distance(b, midden) - distance(a, midden));
      if (slotPool.length > 0) {
        const start = Math.abs((ant.id || 0) * 7 + helpers.indexOf(ant) * 13) % slotPool.length;
        return slotPool[(start + 1) % slotPool.length];
      }

      return getNestQueuedRestSpot(tunnels, assignments, ant);
    }

    function collectNestRestAssignments() {
      const assignments = new Set();
      for (const helper of helpers) {
        if (helper.dead || helper.roomId !== "nest") continue;
        if (!helper.restTarget || helper.job !== "resting" && helper.job !== "moving_to_rest") continue;
        if (typeof helper.restTunnelIndex !== "number" || typeof helper.restSlotIndex !== "number") continue;
        assignments.add(`${helper.restTunnelIndex}:${helper.restSlotIndex}`);
      }
      return assignments;
    }

    function getNestRestCapacity(tunnel) {
      return Math.max(2, Math.floor(tunnel.length / 64));
    }

    function createNestRestSlot(tunnel, tunnelIndex, slotIndex) {
      const alongStart = 92;
      const alongStep = 48;
      const alongLimit = Math.max(112, tunnel.length - 34);
      const along = Math.min(alongLimit, alongStart + slotIndex * alongStep);
      return {
        tunnelIndex,
        slotIndex,
        x: tunnel.originX + Math.cos(tunnel.angle) * along,
        y: tunnel.originY + Math.sin(tunnel.angle) * along
      };
    }

    function getNestQueuedRestSpot(tunnels, assignments, ant) {
      let bestTunnel = tunnels[0];
      let bestRatio = Infinity;
      let bestIndex = 0;
      for (let i = 0; i < tunnels.length; i++) {
        const tunnel = tunnels[i];
        const capacity = getNestRestCapacity(tunnel);
        let occupied = 0;
        for (let slot = 0; slot < capacity; slot++) {
          if (assignments.has(`${i}:${slot}`)) occupied += 1;
        }
        const ratio = occupied / capacity;
        if (ratio < bestRatio) {
          bestRatio = ratio;
          bestTunnel = tunnel;
          bestIndex = i;
        }
      }
      const occupiedCount = [...assignments].filter(value => value.startsWith(`${bestIndex}:`)).length;
      const slotIndex = occupiedCount;
      const slot = createNestRestSlot(bestTunnel, bestIndex, slotIndex);
      return slot;
    }

    function getNestFallbackRestSpot() {
      return {
        tunnelIndex: -1,
        slotIndex: -1,
        x: queen.x + 220,
        y: queen.y + 6
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

    function findNearestTrailReachableCrumb(entity, range) {
      if (typeof getNearestSafeTrailPoint !== "function" || typeof getWorkerTrailForageRadius !== "function") return findNearestAvailableCrumb(entity, range);
      let nearest = null;
      let nearestDistance = range;
      for (const crumb of crumbs) {
        if (crumb.collected || crumb.roomId !== entity.roomId) continue;
        const trailPoint = getNearestSafeTrailPoint(crumb.roomId, crumb.x, crumb.y);
        if (!trailPoint || trailPoint.distance > getWorkerTrailForageRadius()) continue;
        const d = distance(entity, crumb) + trailPoint.distance * 0.35;
        if (d < nearestDistance) {
          nearest = crumb;
          nearestDistance = d;
        }
      }
      return nearest;
    }
