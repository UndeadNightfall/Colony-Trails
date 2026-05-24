    function updatePlayer(delta) {
      normalizeSicknessState(player);
      normalizeMiddenRecoveryState();
      if (player.invulnerable > 0) player.invulnerable -= delta;
      updateDefenseCall(delta);
      const length = Math.hypot(input.x, input.y);
      if (length > 0.05) {
        const moveX = input.x / Math.max(1, length);
        const moveY = input.y / Math.max(1, length);
        const blocked = moveNestEntity(player, moveX * player.speed * (player.sick ? 0.62 : 1) * delta, moveY * player.speed * (player.sick ? 0.62 : 1) * delta);
        player.angle = Math.atan2(moveY, moveX);
        if (blocked) {
          // Keep the player from vibrating against nest walls.
          player.x = clamp(player.x, 35, world.room.width - 35);
          player.y = clamp(player.y, 35, world.room.height - 35);
        }
      }
      player.x = clamp(player.x, 35, world.room.width - 35);
      player.y = clamp(player.y, 35, world.room.height - 35);
      resolveOverworldObstructions(player);
      handleRoomTransitions(player);
      syncPlayerCarriedEgg();
      syncPlayerCarriedSickAnt();
      syncPlayerCarriedDeadAnt();
      updatePlayerMiddenState(delta);

      if (player.sick) {
        if (player.roomId === "nest" && distance(player, midden) < midden.radius + 18 && colony.roles.middenworker > 0) {
          player.sickProgress = (player.sickProgress || 0) + delta * (1 + colony.roles.middenworker * 0.55);
          if (player.sickProgress >= 6) {
            player.sick = false;
            player.sickTimer = 0;
            player.sickProgress = 0;
            objectiveText.textContent = "The midden worker cleared your sickness.";
            saveGame(false);
          }
        } else {
          player.sickTimer -= delta;
          if (player.sickTimer <= 0) {
            objectiveText.textContent = "The sickness overtook you. Another ant takes your place.";
            resetAfterFaint();
            return;
          }
        }
      }

      if (isOutdoorRoom(player.roomId) && !player.carrying) {
        const sick = findNearestRecoverableSickAnt(player, 90);
        if (sick && distance(player, sick) < player.radius + sick.radius + 8) {
          sick.carried = true;
          sick.carriedBy = "player";
          player.carrying = "sick";
          playPickupSound();
          objectiveText.textContent = "You picked up a sick ant. Return it to the midden.";
        }
      }

      if (!player.carrying) {
        const egg = findAvailableQueenEgg(player, 90);
        if (egg && distance(player, egg) < player.radius + 22) {
          egg.carriedBy = "player";
          player.carrying = "egg";
          playPickupSound();
          objectiveText.textContent = "You picked up the queen's egg. Carry it to the nursery.";
        }
      }

      if (!player.carrying) {
        const corpse = findNearestRecoverableDeadAnt(player, 90);
        if (corpse && distance(player, corpse) < player.radius + corpse.radius + 8) {
          corpse.carried = true;
          corpse.carriedBy = "player";
          player.carrying = "dead";
          playPickupSound();
          objectiveText.textContent = "You picked up a dead ant. Return it to the midden.";
        }
      }

      if (isOutdoorRoom(player.roomId) && !player.carrying) {
        for (const crumb of crumbs) {
          if (crumb.roomId === player.roomId && !crumb.collected && distance(player, crumb) < player.radius + crumb.radius + 8) {
            crumb.collected = true;
            player.carrying = true;
            playPickupSound();
            objectiveText.textContent = "Good! Follow the exits back to the nest and bring the crumb to the queen.";
            break;
          }
        }
      }

      if (player.roomId === "nest" && player.carrying === "sick" && distance(player, midden) < midden.radius + 18) depositSickBody();
      if (player.roomId === "nest" && player.carrying === "dead" && distance(player, midden) < midden.radius + 18) depositDeadBody();
      if (player.roomId === "nest" && player.carrying === "egg" && distance(player, nursery) < nursery.rx + 18) depositEggInNursery("player");
      if (player.roomId === "nest" && player.carrying === true && distance(player, queen) < queen.radius + 30) deliverFood();
    }

    function normalizeMiddenRecoveryState() {
      if (typeof player.middenHealProgress !== "number") player.middenHealProgress = 0;
      if (typeof player.middenCaretakerId === "undefined") player.middenCaretakerId = null;
    }

    function updatePlayerMiddenState(delta) {
      const atMidden = player.roomId === "nest" && distance(player, midden) < midden.radius + 18;
      player.atMidden = atMidden;
      if (player.health >= 3 || !atMidden) {
        player.middenHealProgress = 0;
        if (player.middenCaretakerId != null) {
          const caretaker = helpers.find(ant => !ant.dead && ant.id === player.middenCaretakerId);
          if (caretaker) {
            caretaker.job = "midden_patrolling";
            caretaker.targetPlayer = null;
          }
          player.middenCaretakerId = null;
        }
        return;
      }
      if (player.middenCaretakerId == null) {
        const caretaker = helpers.find(ant => !ant.dead && ant.role === "middenworker" && ant.roomId === "nest" && !ant.carrying && !ant.needsRest && ant.job !== "cleaning_midden" && ant.job !== "healing_midden" && ant.job !== "waiting_midden");
        if (caretaker) player.middenCaretakerId = caretaker.id;
      }
      if (player.middenCaretakerId == null) return;
      player.middenHealProgress = (player.middenHealProgress || 0) + delta;
      if (player.middenHealProgress < 4) return;
      player.health = 3;
      player.middenHealProgress = 0;
      const caretaker = helpers.find(ant => !ant.dead && ant.id === player.middenCaretakerId);
      if (caretaker) caretaker.job = "midden_patrolling";
      player.middenCaretakerId = null;
      objectiveText.textContent = "A midden worker fussed over you and restored you to full health.";
      saveGame(false);
    }

    function depositSickBody() {
      const sick = helpers.find(item => item.carried && item.carriedBy === "player" && item.sick);
      if (!sick) return;
      sick.carried = false;
      sick.carriedBy = null;
      sick.atMidden = true;
      sick.sickProgress = 0;
      sick.sickCaretakerId = null;
      sick.roomId = "nest";
      sick.x = midden.x - 12;
      sick.y = midden.y + 12;
      player.carrying = false;
      objectiveText.textContent = "You carried a sick ant to the midden.";
      saveGame(false);
    }

    function syncPlayerCarriedSickAnt() {
      if (player.carrying !== "sick") return;
      const sick = helpers.find(item => item.carried && item.carriedBy === "player" && item.sick);
      if (!sick) return;
      sick.roomId = player.roomId;
      sick.x = player.x - Math.cos(player.angle) * 20;
      sick.y = player.y - Math.sin(player.angle) * 20;
    }

    function syncPlayerCarriedEgg() {
      if (player.carrying !== "egg") return;
      const egg = colony.eggs.find(item => item.carriedBy === "player" && !item.inNursery);
      if (!egg) return;
      egg.x = player.x - Math.cos(player.angle) * 20;
      egg.y = player.y - Math.sin(player.angle) * 20;
    }

    function syncPlayerCarriedDeadAnt() {
      if (player.carrying !== "dead") return;
      const corpse = deadAnts.find(item => item.carried && item.carriedBy === "player" && !item.atMidden);
      if (!corpse) return;
      corpse.roomId = player.roomId;
      corpse.x = player.x - Math.cos(player.angle) * 20;
      corpse.y = player.y - Math.sin(player.angle) * 20;
    }

    function depositDeadBody() {
      const corpse = deadAnts.find(item => item.carried && item.carriedBy === "player" && !item.atMidden);
      if (!corpse) return;
      const pileIndex = deadAnts.filter(item => item.atMidden && item !== corpse).length;
      corpse.carried = false;
      corpse.carriedBy = null;
      corpse.atMidden = true;
      corpse.roomId = "nest";
      corpse.processingBy = null;
      corpse.middenProgress = 0;
      corpse.x = midden.x - 28 + (pileIndex * 13) % 56;
      corpse.y = midden.y - 12 + Math.floor(pileIndex / 5) * 9;
      player.carrying = false;
      colony.recoveredDead += 1;
      objectiveText.textContent = "You carried a dead ant to the midden.";
      saveGame(false);
    }

    function updateDefenseCall(delta) {
      if (defenseCall.active) {
        defenseCall.timeLeft -= delta;
        if (defenseCall.timeLeft <= 0) resetDefenseCall();
      }
      if (!player.roomId || player.roomId === "nest") return;
      const threat = findNearestThreatToPlayer(150);
      if (!threat) return;
      if (performance.now() / 1000 - defenseCall.lastCallAt < 6) return;
      defenseCall.active = true;
      defenseCall.timeLeft = 7;
      defenseCall.lastCallAt = performance.now() / 1000;
      defenseCall.targetSpiderId = threat.id;
    }

    function findNearestThreatToPlayer(range) {
      let nearest = null;
      let nearestDistance = range;
      for (const spider of spiders) {
        if (!spider.alive || spider.roomId !== player.roomId) continue;
        const d = distance(player, spider);
        if (d < nearestDistance) { nearest = spider; nearestDistance = d; }
      }
      return nearest;
    }
