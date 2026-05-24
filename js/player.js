    function updatePlayer(delta) {
      if (player.invulnerable > 0) player.invulnerable -= delta;
      updateDefenseCall(delta);
      const length = Math.hypot(input.x, input.y);
      if (length > 0.05) {
        const moveX = input.x / Math.max(1, length);
        const moveY = input.y / Math.max(1, length);
        const blocked = moveNestEntity(player, moveX * player.speed * delta, moveY * player.speed * delta);
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

      if (player.roomId === "nest" && player.carrying && distance(player, queen) < queen.radius + 30) deliverFood();
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
