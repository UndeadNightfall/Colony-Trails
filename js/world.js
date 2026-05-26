    var crumbPalette = [
      { type: "seed", color: "#e4b55e", highlight: "rgba(255,255,255,0.18)" },
      { type: "berry", color: "#c95745", highlight: "rgba(255,226,218,0.22)" },
      { type: "leaf", color: "#76a85a", highlight: "rgba(230,255,210,0.22)" },
      { type: "petal", color: "#d88cc6", highlight: "rgba(255,232,252,0.24)" },
      { type: "grain", color: "#f0d78b", highlight: "rgba(255,255,236,0.2)" }
    ];

    function generateMapDecorations() {
      grassClumps.length = 0;
      seasonFlowers.length = 0;
      pebbles.length = 0;
      for (const roomId of ["overworld", "garden"]) {
        const room = rooms[roomId];
        for (let i = 0; i < 70; i++) grassClumps.push({ roomId, x: randomBetween(80, room.width - 80), y: randomBetween(110, room.height - 80), size: randomBetween(18, 44), sway: randomBetween(0, Math.PI * 2) });
      }
      for (const roomId of ["overworld", "garden"]) {
        const room = rooms[roomId];
        const flowerHues = roomId === "garden" ? [12, 36, 54, 154, 204, 282, 326] : [22, 48, 132, 188, 238, 292, 338];
        const flowerCount = roomId === "garden" ? 58 : 76;
        for (let i = 0; i < flowerCount; i++) {
          const hue = flowerHues[Math.floor(randomBetween(0, flowerHues.length))] + randomBetween(-8, 8);
          seasonFlowers.push({
            roomId,
            x: randomBetween(90, room.width - 90),
            y: randomBetween(95, room.height - 95),
            size: randomBetween(0.55, 1.08),
            hue,
            accentHue: hue + randomBetween(-24, 24),
            petals: Math.floor(randomBetween(4, 8)),
            cluster: Math.floor(randomBetween(1, 4)),
            sway: randomBetween(0, Math.PI * 2)
          });
        }
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
          type: getRandomCrumbType(),
          collected: false
        };
        applyCrumbColor(crumb);
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
      if (crumb.roomId === "garden") {
        for (const puddle of gardenPuddles) {
          if (distance(crumb, puddle) < puddle.radius + 52) return false;
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

    function getRandomCrumbType() {
      return crumbPalette[Math.floor(Math.random() * crumbPalette.length)].type;
    }

    function applyCrumbColor(crumb) {
      const style = getCrumbStyle(crumb);
      crumb.color = style.color;
      crumb.highlight = style.highlight;
      return crumb;
    }

    function getCrumbStyle(crumb) {
      const fallback = crumbPalette[0];
      if (!crumb) return fallback;
      if (crumb.color) return { color: crumb.color, highlight: crumb.highlight || fallback.highlight };
      return crumbPalette.find(item => item.type === crumb.type) || fallback;
    }

    function getCrumbColor(crumb) {
      return getCrumbStyle(crumb).color;
    }

    function getCrumbHighlight(crumb) {
      return getCrumbStyle(crumb).highlight;
    }

    function spawnSpiders() {
      spiders.length = 0;
      spiders.push({ id: 1, roomId: "overworld", x: 1040, y: 510, homeX: 1040, homeY: 510, radius: 24, angle: 0, speed: 70, aggro: false, alive: true, respawnTimer: 0, targetMode: null, targetAntId: null, soldierFocusTimer: 0 });
      spiders.push({ id: 2, roomId: "sandpit", x: 920, y: 420, homeX: 920, homeY: 420, radius: 24, angle: 2, speed: 62, aggro: false, alive: true, respawnTimer: 0, targetMode: null, targetAntId: null, soldierFocusTimer: 0 });
      spiders.push({ id: 3, kind: "frog", canEnterPuddles: true, roomId: "garden", x: 1015, y: 365, homeX: 1015, homeY: 365, radius: 30, angle: 1, speed: 56, aggro: false, alive: true, respawnTimer: 0, targetMode: null, targetAntId: null, soldierFocusTimer: 0 });
      ensureBeetleSpawns();
    }

    function getBeetleSpawnSpecs() {
      return [
        { id: 4, roomId: "overworld", x: 380, y: 280, angle: 0.8 },
        { id: 5, roomId: "patio", x: 620, y: 310, angle: 2.4 },
        { id: 6, roomId: "sandpit", x: 480, y: 550, angle: 4.1 },
        { id: 7, roomId: "garden", x: 300, y: 580, angle: 5.2 }
      ];
    }

    function createBeetleEnemy(spec) {
      return { id: spec.id, kind: "beetle", roomId: spec.roomId, x: spec.x, y: spec.y, homeX: spec.x, homeY: spec.y, radius: 20, angle: spec.angle, speed: 45, aggro: false, alive: true, respawnTimer: 0, targetMode: null, targetAntId: null, soldierFocusTimer: 0 };
    }

    function ensureBeetleSpawns() {
      for (const spec of getBeetleSpawnSpecs()) {
        if (!spiders.some(enemy => enemy.id === spec.id)) spiders.push(createBeetleEnemy(spec));
      }
      if (typeof normalizeEnemyState === "function") {
        for (const enemy of spiders) normalizeEnemyState(enemy);
      }
    }
    function handleRoomTransitions(entity) {
      for (const exit of getRoomExits(entity.roomId)) {
        if (distance(entity, exit) >= exit.radius + entity.radius) continue;
        if (entity !== player && weather.active && entity.roomId === "nest" && exit.to !== "nest") {
          entity.x = clamp(entity.x, 80, rooms.nest.width - 80);
          entity.y = clamp(entity.y, 80, rooms.nest.height - 80);
          return;
        }
        entity.roomId = exit.to;
        entity.x = exit.toX;
        entity.y = exit.toY;
        if (entity !== player && entity.targetForageRoom === entity.roomId) entity.targetForageRoom = null;
        if (entity === player) {
          world.room = rooms[entity.roomId];
          objectiveText.textContent = getRoomObjective(entity.roomId);
          if (entity.roomId === "nest" && typeof commitSeasonTransition === "function") commitSeasonTransition();
        }
        return;
      }
    }

    function getRoomObjective(roomId) {
      if (roomId === "nest") return player.carrying === "food" ? "Drop the crumb in the storage room." : getNestObjective();
      if (roomId === "patio") return "Search the concrete patio. The house beside it is a dry shelter when rain starts.";
      if (roomId === "house") return "The house stays dry. Shelter here when rain starts, then return to the yard when it passes.";
      if (roomId === "sandpit") return "Cross the sandpit carefully. The open sand slows the search and hides crumbs.";
      if (roomId === "garden") return "Explore the garden bed. Pots, soil, and roots make this a dense foraging room.";
      return "Explore the backyard paths. Use exits to reach the patio, sandpit, and garden bed.";
    }
    function drawGround() {
      const room = rooms[player.roomId];
      if (room.ground === "patio") drawPatioGround(room);
      else if (room.ground === "house") drawHouseGround(room);
      else if (room.ground === "sand") drawSandpitGround(room);
      else if (room.ground === "soil") drawGardenGround(room);
      else drawBackyardGround(room);
    }

    function drawBackyardGround(room) {
      const palette = getSeasonPalette();
      ctx.fillStyle = palette.backyard;
      ctx.fillRect(0, 0, room.width, room.height);
      if ((seasonState.order[seasonState.currentIndex] || "summer") === "autumn") drawAutumnLeafTexture(room);
      ctx.fillStyle = palette.backyardVein;
      for (let y = 0; y < room.height; y += 70) for (let x = 0; x < room.width; x += 85) if ((x + y) % 3 === 0) { ctx.beginPath(); ctx.ellipse(x + 20, y + 30, 34, 17, 0.3, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawPatioGround(room) {
      const palette = getSeasonPalette();
      ctx.fillStyle = palette.patio;
      ctx.fillRect(0, 0, room.width, room.height);
      if ((seasonState.order[seasonState.currentIndex] || "summer") === "autumn") drawAutumnLeafTexture(room);
      ctx.strokeStyle = palette.patioLines;
      ctx.lineWidth = 2;
      for (let x = 90; x < room.width; x += 95) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 28, room.height); ctx.stroke(); }
      for (let y = 82; y < room.height; y += 82) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(room.width, y); ctx.stroke(); }
    }

    function drawHouseGround(room) {
      ctx.fillStyle = "#8c7764";
      ctx.fillRect(0, 0, room.width, room.height);
      ctx.fillStyle = "#7a6553";
      for (let y = 0; y < room.height; y += 60) {
        for (let x = 0; x < room.width; x += 150) {
          ctx.fillRect(x, y, 150, 60);
        }
      }
      ctx.strokeStyle = "rgba(40, 27, 20, 0.2)";
      ctx.lineWidth = 2;
      for (let x = 0; x < room.width; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, room.height); ctx.stroke(); }
      for (let y = 0; y < room.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(room.width, y); ctx.stroke(); }
      ctx.fillStyle = "rgba(255, 238, 214, 0.08)";
      ctx.fillRect(0, 0, room.width, room.height);
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.fillRect(0, 0, room.width, 24);
      ctx.fillRect(0, room.height - 24, room.width, 24);
    }

    function drawSandpitGround(room) {
      const palette = getSeasonPalette();
      ctx.fillStyle = palette.sand;
      ctx.fillRect(0, 0, room.width, room.height);
      if ((seasonState.order[seasonState.currentIndex] || "summer") === "autumn") drawAutumnLeafTexture(room);
      ctx.fillStyle = palette.sandSpeckle;
      for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.arc(24 + (i * 67) % (room.width - 48), 22 + (i * 43) % (room.height - 44), 2 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    }

    function drawGardenGround(room) {
      const palette = getSeasonPalette();
      ctx.fillStyle = palette.garden;
      ctx.fillRect(0, 0, room.width, room.height);
      if ((seasonState.order[seasonState.currentIndex] || "summer") === "autumn") drawAutumnLeafTexture(room);
      ctx.fillStyle = palette.gardenVein;
      ctx.strokeStyle = palette.gardenVein;
      ctx.lineWidth = 8;
      for (let y = 40; y < room.height; y += 42) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(room.width - 30, y - 18); ctx.stroke(); }
      drawGardenWaterFeatures();
    }

    function drawGardenWaterFeatures() {
      if (player.roomId !== "garden") return;
      drawGardenSprinkler();
      for (const puddle of gardenPuddles) drawGardenPuddle(puddle);
    }

    function drawGardenSprinkler() {
      const x = 780;
      const y = 420;
      const pulse = performance.now() / 520;
      ctx.save();
      ctx.strokeStyle = "rgba(146, 202, 219, 0.38)";
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 12]);
      for (let i = 0; i < 8; i++) {
        const angle = i * (Math.PI / 4) + Math.sin(pulse) * 0.08;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * 26, y + Math.sin(angle) * 18);
        ctx.quadraticCurveTo(x + Math.cos(angle) * 130, y + Math.sin(angle) * 72 - 30, x + Math.cos(angle) * 230, y + Math.sin(angle) * 104);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = "#4f6b63";
      ctx.beginPath();
      ctx.ellipse(x, y, 28, 18, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e403d";
      ctx.fillRect(x - 7, y - 38, 14, 42);
      ctx.fillStyle = "#78968c";
      ctx.beginPath();
      ctx.arc(x, y - 42, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawGardenPuddle(puddle) {
      ctx.save();
      ctx.translate(puddle.x, puddle.y);
      ctx.rotate(puddle.angle || 0);
      ctx.fillStyle = "rgba(70, 137, 151, 0.62)";
      ctx.beginPath();
      ctx.ellipse(0, 0, puddle.rx, puddle.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(155, 219, 229, 0.22)";
      ctx.beginPath();
      ctx.ellipse(-puddle.rx * 0.24, -puddle.ry * 0.18, puddle.rx * 0.38, puddle.ry * 0.22, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(30, 72, 78, 0.34)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, puddle.rx, puddle.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    function drawDecorations() {
      for (const grass of grassClumps) {
        if (grass.roomId !== player.roomId) continue;
        ctx.save(); ctx.translate(grass.x, grass.y); ctx.rotate(Math.sin(performance.now() / 900 + grass.sway) * 0.08); ctx.fillStyle = getSeasonDecorationGrassColor();
        for (let i = 0; i < 5; i++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -grass.size * 0.45, grass.size * 0.11, grass.size * 0.48, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      if (seasonState.order[seasonState.currentIndex] === "spring") drawSpringFlowers();
      for (const pebble of pebbles) {
        if (pebble.roomId !== player.roomId) continue;
        ctx.save(); ctx.translate(pebble.x, pebble.y); ctx.rotate(pebble.angle); ctx.fillStyle = getSeasonPebbleColor(); ctx.beginPath(); ctx.ellipse(0, 0, pebble.rx, pebble.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    function getSeasonPalette() {
      const season = seasonState.order[seasonState.currentIndex] || "summer";
      if (season === "autumn") {
        return {
          backyard: "#8c6a2a",
          backyardVein: "rgba(145, 96, 40, 0.24)",
          patio: "#a38d70",
          patioLines: "rgba(255, 226, 180, 0.12)",
          sand: "#d3a55d",
          sandSpeckle: "rgba(130, 86, 36, 0.18)",
          garden: "#6a472b",
          gardenVein: "rgba(145, 98, 56, 0.52)"
        };
      }
      if (season === "winter") {
        return {
          backyard: "#dce9f6",
          backyardVein: "rgba(255, 255, 255, 0.18)",
          patio: "#d4dde7",
          patioLines: "rgba(255, 255, 255, 0.2)",
          sand: "#e7eef7",
          sandSpeckle: "rgba(190, 206, 224, 0.22)",
          garden: "#d5e2ef",
          gardenVein: "rgba(176, 197, 216, 0.54)"
        };
      }
      if (season === "spring") {
        return {
          backyard: "#618540",
          backyardVein: "rgba(95, 126, 70, 0.2)",
          patio: "#9f9e92",
          patioLines: "rgba(255, 255, 255, 0.15)",
          sand: "#d7b86f",
          sandSpeckle: "rgba(126, 94, 54, 0.16)",
          garden: "#44642d",
          gardenVein: "rgba(95, 132, 69, 0.56)"
        };
      }
      return {
        backyard: "#5d7f35",
        backyardVein: "rgba(88, 58, 34, 0.2)",
        patio: "#9a9a90",
        patioLines: "rgba(255, 255, 255, 0.15)",
        sand: "#d7b26b",
        sandSpeckle: "rgba(122, 83, 42, 0.16)",
        garden: "#4f3324",
        gardenVein: "rgba(104, 70, 44, 0.55)"
      };
    }

    function getSeasonDecorationGrassColor() {
      const season = seasonState.order[seasonState.currentIndex] || "summer";
      if (season === "autumn") return "#9d6f2c";
      if (season === "winter") return "#e9f2fb";
      if (season === "spring") return "#4d8637";
      return "#416d2d";
    }

    function getSeasonPebbleColor() {
      const season = seasonState.order[seasonState.currentIndex] || "summer";
      if (season === "autumn") return "#a07f52";
      if (season === "winter") return "#c8d6e5";
      if (season === "spring") return "#8f9e83";
      return "#8a745c";
    }

    function drawSpringFlowers() {
      for (const flower of seasonFlowers) {
        if (flower.roomId !== player.roomId) continue;
        const time = performance.now();
        const sway = Math.sin(time / 900 + flower.sway + flower.x * 0.01) * 1.8;
        ctx.save();
        ctx.translate(flower.x, flower.y);
        ctx.rotate(Math.sin(time / 1100 + flower.sway) * 0.08);
        ctx.strokeStyle = "rgba(66, 106, 44, 0.78)";
        ctx.lineWidth = Math.max(1, 1.4 * flower.size);
        const cluster = flower.cluster || 1;
        for (let bloom = 0; bloom < cluster; bloom++) {
          const offsetAngle = flower.sway + bloom * 2.35;
          const offsetX = Math.cos(offsetAngle) * bloom * 7 * flower.size;
          const offsetY = -Math.sin(offsetAngle * 1.3) * bloom * 3 * flower.size;
          ctx.beginPath();
          ctx.moveTo(offsetX * 0.35, 10 * flower.size);
          ctx.quadraticCurveTo(offsetX * 0.2 + sway * 0.2, 3 * flower.size, offsetX, offsetY - 3 * flower.size);
          ctx.stroke();
          ctx.save();
          ctx.translate(offsetX, offsetY - 5 * flower.size);
          ctx.rotate((bloom - 1) * 0.16 + sway * 0.018);
          const petals = flower.petals || 5;
          ctx.fillStyle = `hsl(${bloom % 2 ? flower.accentHue : flower.hue} 82% 66%)`;
          for (let i = 0; i < petals; i++) {
            const a = (Math.PI * 2 * i) / petals;
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * 4.8 * flower.size, Math.sin(a) * 4.2 * flower.size, 3.2 * flower.size, 5.4 * flower.size, a, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#f7e9a7";
          ctx.beginPath();
          ctx.arc(0, 0, 2.1 * flower.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "rgba(82, 132, 52, 0.72)";
        ctx.beginPath();
        ctx.ellipse(-4 * flower.size, 8 * flower.size, 2.1 * flower.size, 5 * flower.size, -0.8, 0, Math.PI * 2);
        ctx.ellipse(5 * flower.size, 7 * flower.size, 2.1 * flower.size, 5 * flower.size, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawAutumnLeafTexture(room) {
      ctx.save();
      const leafCount = Math.max(40, Math.floor((room.width * room.height) / 50000));
      for (let i = 0; i < leafCount; i++) {
        const seed = i * 97 + room.width * 0.13 + room.height * 0.19;
        const x = 36 + ((seed * 53) % (room.width - 72));
        const y = 28 + ((seed * 71) % (room.height - 56));
        const size = 5 + (i % 4) * 1.9;
        const angle = (seed % 1) * Math.PI * 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = i % 3 === 0 ? "rgba(214, 142, 45, 0.72)" : i % 3 === 1 ? "rgba(234, 180, 70, 0.68)" : "rgba(142, 92, 36, 0.62)";
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.quadraticCurveTo(-size * 0.4, -size * 0.95, size * 0.7, -size * 0.2);
        ctx.quadraticCurveTo(size * 0.95, size * 0.1, size * 0.1, size * 0.75);
        ctx.quadraticCurveTo(-size * 0.7, size * 0.5, -size, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(92, 54, 20, 0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-size * 0.55, -size * 0.05);
        ctx.lineTo(size * 0.55, size * 0.25);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    function drawSeasonOverlay() {
      const season = seasonState.order[seasonState.currentIndex] || "summer";
      if (!isOutdoorRoom(player.roomId)) return;
      if (season === "autumn") drawAutumnLeaves();
      else if (season === "winter") drawWinterSnow();
      else if (season === "spring") drawSpringBees();
    }

    function drawAutumnLeaves() {
      ctx.save();
      ctx.fillStyle = "rgba(205, 132, 44, 0.84)";
      const count = 16;
      for (let i = 0; i < count; i++) {
        const t = performance.now() / 1800 + i * 0.73;
        const x = (Math.sin(t * 0.9) * 0.5 + 0.5) * world.room.width + Math.sin(t * 1.9) * 36;
        const y = (t * 90 + i * 110) % (world.room.height + 160) - 80;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 2.2) * 0.9);
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.quadraticCurveTo(-2, -7, 8, 0);
        ctx.quadraticCurveTo(-2, 7, -7, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    function drawWinterSnow() {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
      const count = 28;
      for (let i = 0; i < count; i++) {
        const t = performance.now() / 2300 + i * 0.41;
        const x = ((Math.sin(t * 0.7) * 0.5 + 0.5) * world.room.width + Math.sin(t * 3.1) * 12) % world.room.width;
        const y = (t * 80 + i * 40) % (world.room.height + 80) - 40;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawSpringBees() {
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const t = performance.now() / 1200 + i * 0.8 + seasonState.beesSeed;
        const x = (Math.sin(t * 0.8) * 0.45 + 0.5) * world.room.width + Math.sin(t * 2.3) * 70;
        const y = (Math.cos(t * 0.9) * 0.35 + 0.5) * world.room.height + Math.cos(t * 1.9) * 45;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 3.2) * 0.2);
        ctx.fillStyle = "#2c2318";
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f2c84b";
        ctx.beginPath();
        ctx.ellipse(-1, 0, 3.4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -2);
        ctx.lineTo(-6, -7);
        ctx.moveTo(0, -2);
        ctx.lineTo(3, -7);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    function commitSeasonTransition() {
      if (seasonState.pendingIndex == null) return false;
      seasonState.currentIndex = seasonState.pendingIndex;
      seasonState.pendingIndex = null;
      seasonState.elapsed = 0;
      return true;
    }

    function resetSeasonState() {
      seasonState.currentIndex = 0;
      seasonState.pendingIndex = null;
      seasonState.elapsed = 0;
      seasonState.beesSeed = Math.random() * Math.PI * 2;
    }

    function updateSeasons(delta) {
      if (seasonState.pendingIndex != null) {
        if (player.roomId === "nest") commitSeasonTransition();
        return;
      }
      seasonState.elapsed += delta;
      if (seasonState.elapsed < seasonState.duration) return;
      seasonState.elapsed = seasonState.duration;
      seasonState.pendingIndex = (seasonState.currentIndex + 1) % seasonState.order.length;
      if (player.roomId === "nest") commitSeasonTransition();
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
          if (item.name === "sofa") drawSofaDetails(item);
          if (item.name === "coffee table") drawCoffeeTableDetails(item);
          if (item.name === "dining table") drawDiningTableDetails(item);
          if (item.name === "rug") drawRugDetails(item);
          if (item.name === "bookshelf") drawBookshelfDetails(item);
          if (item.name === "fence board") drawBoardDetails(item);
        } else {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (item.name === "soccer ball") drawSoccerBallDetails(item);
          if (item.name === "plant pot") drawPlantPotDetails(item);
          if (item.name === "watering can") drawWateringCanDetails(item);
          if (item.name === "potted plant") drawPottedPlantDetails(item);
          if (item.name === "lamp") drawLampDetails(item);
          if (item.name === "garden light") drawGardenLightDetails(item);
        }
        ctx.restore();
      }
    }
    function drawRoomExits() {
      for (const exit of getRoomExits(player.roomId)) drawExit(exit.x, exit.y, exit.radius, exit.label);
    }

    function drawExit(x, y, radius, label) {
      const moundW = radius * 1.9;
      const moundH = radius * 1.25;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin((x + y) * 0.02) * 0.06);
      ctx.fillStyle = "rgba(72, 44, 25, 0.95)";
      ctx.beginPath();
      ctx.ellipse(0, 0, moundW, moundH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(97, 63, 36, 0.98)";
      ctx.beginPath();
      ctx.ellipse(0, 1, moundW * 0.82, moundH * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(21, 10, 7, 0.96)";
      ctx.beginPath();
      ctx.ellipse(0, 1, radius * 0.7, radius * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 224, 168, 0.18)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 1, radius * 0.7, radius * 0.52, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(52, 30, 16, 0.42)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = -1.1 + i * 0.55;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * moundW * 0.65, Math.sin(a) * moundH * 0.28);
        ctx.lineTo(Math.cos(a) * moundW * 0.9, Math.sin(a) * moundH * 0.38 + 2);
        ctx.stroke();
      }
      ctx.restore();
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
