    function resizeCanvas() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function startGame() {
      generateMapDecorations();
      spawnCrumbs();
      spawnSpiders();
      spawnHelperAnt();
      resizeCanvas();
      requestAnimationFrame(gameLoop);
    }
    function gameLoop(now) {
      const delta = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      update(delta);
      draw();
      requestAnimationFrame(gameLoop);
    }

    function update(delta) {
      updatePlayer(delta);
      updateHelpers(delta);
      updateSpiders(delta);
      updateIncubation(delta);
      updateExcavation(delta);
      updateFoodSpawns(delta);
      updateCombatEffects(delta);
      updateAutosave(delta);
      updateCamera();
      updateHud();
    }

    function updateCombatEffects(delta) {
      for (let i = combatEffects.length - 1; i >= 0; i--) {
        combatEffects[i].time -= delta;
        if (combatEffects[i].time <= 0) combatEffects.splice(i, 1);
      }
    }
    function resetAfterFaint() {
      deadAnts.push({ roomId: player.roomId, x: player.x, y: player.y, radius: player.radius, role: "worker", carried: false });
      colony.ants = Math.max(0, colony.ants - 1);
      player.roomId = "nest";
      world.room = rooms.nest;
      player.x = queen.x + 115;
      player.y = queen.y;
      player.health = 3;
      player.carrying = false;
      objectiveText.textContent = colony.ants > 0 ? "Another ant takes your place at the queen. Workers will recover the fallen body." : "The last ant has fallen. The queen waits, but the colony has no workers left.";
      saveGame(false);
    }

    function updateCamera() {
      world.room = rooms[player.roomId];
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      world.cameraX = clamp(player.x - screenW / 2, 0, Math.max(0, world.room.width - screenW));
      world.cameraY = clamp(player.y - screenH / 2, 0, Math.max(0, world.room.height - screenH));
    }

    function updateHud() {
      roomDisplay.textContent = `Room: ${world.room.name}`;
      foodDisplay.textContent = colony.eggs.length > 0 ? `Egg: ${Math.ceil(colony.eggs[0].time)}s ${colony.eggs[0].role}` : `Food: ${colony.food}/${colony.crumbsForEgg}`;
      colonyDisplay.textContent = `Colony: ${colony.ants}`;
      healthDisplay.textContent = `Health: ${player.health}`;
      actionButton.textContent = player.carrying ? "Carry" : "Find";
    }
