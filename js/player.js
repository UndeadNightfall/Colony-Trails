    function updatePlayer(delta) {
      if (player.invulnerable > 0) player.invulnerable -= delta;
      const oldX = player.x;
      const oldY = player.y;
      const length = Math.hypot(input.x, input.y);
      if (length > 0.05) {
        const moveX = input.x / Math.max(1, length);
        const moveY = input.y / Math.max(1, length);
        player.x += moveX * player.speed * delta;
        player.y += moveY * player.speed * delta;
        player.angle = Math.atan2(moveY, moveX);
      }
      player.x = clamp(player.x, 35, world.room.width - 35);
      player.y = clamp(player.y, 35, world.room.height - 35);
      resolveOverworldObstructions(player);
      resolveNestWalls(player, oldX, oldY);
      handleRoomTransitions(player);

      if (isOutdoorRoom(player.roomId) && !player.carrying) {
        for (const crumb of crumbs) {
          if (crumb.roomId === player.roomId && !crumb.collected && distance(player, crumb) < player.radius + crumb.radius + 8) {
            crumb.collected = true;
            player.carrying = true;
            objectiveText.textContent = "Good! Follow the exits back to the nest and bring the crumb to the queen.";
            break;
          }
        }
      }

      if (player.roomId === "nest" && player.carrying && distance(player, queen) < queen.radius + 30) deliverFood();
    }
