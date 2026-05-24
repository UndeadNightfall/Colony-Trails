    function generateMapDecorations() {
      grassClumps.length = 0;
      pebbles.length = 0;
      for (const roomId of ["overworld", "garden"]) {
        const room = rooms[roomId];
        for (let i = 0; i < 70; i++) grassClumps.push({ roomId, x: randomBetween(80, room.width - 80), y: randomBetween(110, room.height - 80), size: randomBetween(18, 44), sway: randomBetween(0, Math.PI * 2) });
      }
      for (const roomId of ["overworld", "patio", "sandpit", "garden"]) {
        const room = rooms[roomId];
        for (let i = 0; i < 22; i++) pebbles.push({ roomId, x: randomBetween(80, room.width - 80), y: randomBetween(90, room.height - 80), rx: randomBetween(10, 28), ry: randomBetween(7, 20), angle: randomBetween(0, Math.PI) });
      }
    }

    function spawnCrumbs() {
      crumbs.length = 0;
      for (const roomId of Object.keys(foodSpawn.rooms)) {
        for (let i = 0; i < foodSpawn.rooms[roomId].initial; i++) spawnCrumbInRoom(roomId);
      }
    }

    function updateFoodSpawns(delta) {
      foodSpawn.timer -= delta;
      if (foodSpawn.timer > 0) return;
      foodSpawn.timer = foodSpawn.interval;
      removeCollectedCrumbs();
      for (const roomId of Object.keys(foodSpawn.rooms)) {
        const active = countActiveCrumbs(roomId);
        if (active < foodSpawn.rooms[roomId].cap) spawnCrumbInRoom(roomId);
      }
    }

    function scheduleCrumbRespawnIfNeeded() {
      removeCollectedCrumbs();
      foodSpawn.timer = Math.min(foodSpawn.timer, 1.2);
    }

    function spawnCrumbInRoom(roomId) {
      const room = rooms[roomId];
      for (let attempt = 0; attempt < 40; attempt++) {
        const crumb = {
          roomId,
          x: randomBetween(90, room.width - 90),
          y: randomBetween(95, room.height - 90),
          radius: 16,
          collected: false
        };
        if (!isCrumbSpawnClear(crumb)) continue;
        crumbs.push(crumb);
        return true;
      }
      return false;
    }

    function isCrumbSpawnClear(crumb) {
      for (const other of crumbs) {
        if (other.collected || other.roomId !== crumb.roomId) continue;
        if (distance(crumb, other) < 95) return false;
      }
      for (const exit of getRoomExits(crumb.roomId)) {
        if (distance(crumb, exit) < exit.radius + 80) return false;
      }
      for (const item of obstructions) {
        if (item.roomId !== crumb.roomId) continue;
        if (item.type === "circle" && distance(crumb, item) < item.radius + 55) return false;
        if (item.type === "rect") {
          const nearestX = clamp(crumb.x, item.x, item.x + item.width);
          const nearestY = clamp(crumb.y, item.y, item.y + item.height);
          if (Math.hypot(crumb.x - nearestX, crumb.y - nearestY) < 60) return false;
        }
      }
      return true;
    }

    function countActiveCrumbs(roomId) {
      return crumbs.filter(crumb => crumb.roomId === roomId && !crumb.collected).length;
    }

    function removeCollectedCrumbs() {
      for (let i = crumbs.length - 1; i >= 0; i--) {
        if (crumbs[i].collected) crumbs.splice(i, 1);
      }
    }

    function spawnSpiders() {
      spiders.length = 0;
      spiders.push({ roomId: "overworld", x: 1040, y: 510, homeX: 1040, homeY: 510, radius: 24, angle: 0, speed: 70, aggro: false, alive: true, respawnTimer: 0 });
      spiders.push({ roomId: "sandpit", x: 920, y: 420, homeX: 920, homeY: 420, radius: 24, angle: 2, speed: 62, aggro: false, alive: true, respawnTimer: 0 });
      spiders.push({ roomId: "garden", x: 720, y: 650, homeX: 720, homeY: 650, radius: 24, angle: 1, speed: 64, aggro: false, alive: true, respawnTimer: 0 });
    }
    function handleRoomTransitions(entity) {
      for (const exit of getRoomExits(entity.roomId)) {
        if (distance(entity, exit) >= exit.radius + entity.radius) continue;
        entity.roomId = exit.to;
        entity.x = exit.toX;
        entity.y = exit.toY;
        if (entity === player) {
          world.room = rooms[entity.roomId];
          objectiveText.textContent = getRoomObjective(entity.roomId);
        }
        return;
      }
    }

    function getRoomObjective(roomId) {
      if (roomId === "nest") return player.carrying ? "Bring the crumb to the queen." : getNestObjective();
      if (roomId === "patio") return "Search the concrete patio. Crumbs collect near chairs and doorways.";
      if (roomId === "sandpit") return "Cross the sandpit carefully. The open sand slows the search and hides crumbs.";
      if (roomId === "garden") return "Explore the garden bed. Pots, soil, and roots make this a dense foraging room.";
      return "Explore the backyard paths. Use exits to reach the patio, sandpit, and garden bed.";
    }
    function drawGround() {
      const room = rooms[player.roomId];
      if (room.ground === "patio") drawPatioGround(room);
      else if (room.ground === "sand") drawSandpitGround(room);
      else if (room.ground === "soil") drawGardenGround(room);
      else drawBackyardGround(room);
    }

    function drawBackyardGround(room) {
      ctx.fillStyle = "#5d7f35";
      ctx.fillRect(0, 0, room.width, room.height);
      ctx.fillStyle = "rgba(88, 58, 34, 0.2)";
      for (let y = 0; y < room.height; y += 70) for (let x = 0; x < room.width; x += 85) if ((x + y) % 3 === 0) { ctx.beginPath(); ctx.ellipse(x + 20, y + 30, 34, 17, 0.3, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawPatioGround(room) {
      ctx.fillStyle = "#9a9a90";
      ctx.fillRect(0, 0, room.width, room.height);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      for (let x = 90; x < room.width; x += 95) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 28, room.height); ctx.stroke(); }
      for (let y = 82; y < room.height; y += 82) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(room.width, y); ctx.stroke(); }
    }

    function drawSandpitGround(room) {
      ctx.fillStyle = "#d7b26b";
      ctx.fillRect(0, 0, room.width, room.height);
      ctx.fillStyle = "rgba(122, 83, 42, 0.16)";
      for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.arc(24 + (i * 67) % (room.width - 48), 22 + (i * 43) % (room.height - 44), 2 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    }

    function drawGardenGround(room) {
      ctx.fillStyle = "#4f3324";
      ctx.fillRect(0, 0, room.width, room.height);
      ctx.fillStyle = "rgba(104, 70, 44, 0.55)";
      ctx.strokeStyle = "rgba(104, 70, 44, 0.55)";
      ctx.lineWidth = 8;
      for (let y = 40; y < room.height; y += 42) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(room.width - 30, y - 18); ctx.stroke(); }
    }
    function drawDecorations() {
      for (const grass of grassClumps) {
        if (grass.roomId !== player.roomId) continue;
        ctx.save(); ctx.translate(grass.x, grass.y); ctx.rotate(Math.sin(performance.now() / 900 + grass.sway) * 0.08); ctx.fillStyle = "#416d2d";
        for (let i = 0; i < 5; i++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -grass.size * 0.45, grass.size * 0.11, grass.size * 0.48, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      for (const pebble of pebbles) {
        if (pebble.roomId !== player.roomId) continue;
        ctx.save(); ctx.translate(pebble.x, pebble.y); ctx.rotate(pebble.angle); ctx.fillStyle = "#8a745c"; ctx.beginPath(); ctx.ellipse(0, 0, pebble.rx, pebble.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    function drawObstructions() {
      for (const item of obstructions) {
        if (item.roomId !== player.roomId) continue;
        ctx.save();
        ctx.fillStyle = item.color;
        ctx.strokeStyle = "rgba(30, 20, 12, 0.36)";
        ctx.lineWidth = 4;
        if (item.type === "rect") {
          roundRect(item.x, item.y, item.width, item.height, item.radius);
          ctx.fill();
          ctx.stroke();
          if (item.name === "fallen rake") drawRakeDetails(item);
          if (item.name === "patio chair") drawChairDetails(item);
          if (item.name === "fence board") drawBoardDetails(item);
        } else {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (item.name === "soccer ball") drawSoccerBallDetails(item);
          if (item.name === "plant pot") drawPlantPotDetails(item);
          if (item.name === "watering can") drawWateringCanDetails(item);
          if (item.name === "garden light") drawGardenLightDetails(item);
        }
        ctx.restore();
      }
    }
    function drawRoomExits() {
      for (const exit of getRoomExits(player.roomId)) drawExit(exit.x, exit.y, exit.radius, exit.label);
    }

    function drawExit(x, y, radius, label) {
      ctx.fillStyle = "rgba(43, 24, 13, 0.92)"; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255, 213, 142, 0.3)"; ctx.lineWidth = 5; ctx.stroke();
      drawText(label, x, y - radius - 14);
    }

    function drawText(text, x, y) { ctx.fillStyle = "rgba(255, 232, 182, 0.82)"; ctx.font = "800 17px system-ui"; ctx.textAlign = "center"; ctx.fillText(text, x, y); }

    function drawCrumbs() {
      for (const crumb of crumbs) {
        if (crumb.collected || crumb.roomId !== player.roomId) continue;
        ctx.fillStyle = "#e4b55e"; ctx.beginPath(); ctx.ellipse(crumb.x, crumb.y, crumb.radius, crumb.radius * 0.75, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.arc(crumb.x - 5, crumb.y - 4, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
