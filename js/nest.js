    function drawNestRoomGround() {
      ctx.fillStyle = "#21120b";
      ctx.fillRect(0, 0, rooms.nest.width, rooms.nest.height);
      drawNestDirtTexture();
      drawNestTunnels();
    }

    function drawNestDirtTexture() {
      const room = rooms.nest;
      ctx.save();
      for (let i = 0; i < 150; i++) {
        const seed = i * 97 + 41;
        const x = 28 + ((seed * 53) % (room.width - 56));
        const y = 26 + ((seed * 71) % (room.height - 52));
        const size = 2 + (i % 5);
        ctx.fillStyle = i % 3 === 0 ? "rgba(95, 65, 45, 0.28)" : "rgba(18, 10, 7, 0.22)";
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 46; i++) {
        const seed = i * 131 + 19;
        const x = 36 + ((seed * 47) % (room.width - 72));
        const y = 34 + ((seed * 83) % (room.height - 68));
        const rx = 7 + (i % 4) * 2.8;
        const ry = 4 + (i % 3) * 2.2;
        const angle = (seed % 11) * 0.28;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = i % 2 === 0 ? "rgba(93, 70, 54, 0.48)" : "rgba(56, 39, 29, 0.52)";
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(148, 115, 87, 0.16)";
        ctx.beginPath();
        ctx.ellipse(-rx * 0.25, -ry * 0.25, rx * 0.35, ry * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    function getNestChambers() {
      return [
        { id: "entrance", label: "Entrance", x: 1120, y: 210, rx: 96, ry: 54, angle: 0.05, fill: "#392112" },
        { id: "junction", label: "", x: 1080, y: 520, rx: 82, ry: 58, angle: -0.08, fill: "#342012" },
        { id: "nursery", label: "Nursery", x: nursery.x, y: nursery.y, rx: nursery.radius, ry: nursery.radius, angle: 0, fill: "#2b190d", gateway: getNestChamberGateway("nursery") },
        { id: "queen", label: "Queen", x: queen.x, y: queen.y, rx: 128, ry: 82, angle: 0.08, fill: "#301b0f" },
        { id: "storage", label: "Storage", x: storage.x, y: storage.y, rx: storage.radius, ry: storage.radius, angle: 0, fill: "#352113", gateway: getNestChamberGateway("storage") },
        { id: "restA", label: "", x: 690, y: 470, rx: 100, ry: 56, angle: -0.22, fill: "#342012" },
        { id: "restB", label: "", x: 1480, y: 900, rx: 112, ry: 60, angle: 0.12, fill: "#342012" },
        { id: "midden", label: "Midden", x: midden.x, y: midden.y, rx: midden.radius, ry: midden.radius, angle: 0, fill: "#24150d", gateway: getNestChamberGateway("midden") }
      ];
    }

    function getNestChamberGateway(id) {
      if (id === "nursery") return { x: nursery.x + 70, y: nursery.y - 48, radius: 28 };
      if (id === "storage") return { x: storage.x - 70, y: storage.y - 28, radius: 28 };
      if (id === "midden") return { x: midden.x - 62, y: midden.y + 18, radius: 27 };
      return null;
    }

    function getNestTunnelRoutes() {
      const nurseryGate = getNestChamberGateway("nursery");
      const storageGate = getNestChamberGateway("storage");
      const middenGate = getNestChamberGateway("midden");
      return [
        { width: 74, points: [{ x: exits.nestToOverworld.x, y: exits.nestToOverworld.y }, { x: 1120, y: 210 }, { x: 1080, y: 520 }] },
        { width: 58, points: [{ x: 1080, y: 520 }, { x: 900, y: 620 }, nurseryGate, { x: nursery.x, y: nursery.y }] },
        { width: 64, points: [{ x: 1080, y: 520 }, { x: 1030, y: 780 }, { x: queen.x, y: queen.y }] },
        { width: 54, points: [{ x: 1080, y: 520 }, { x: 1280, y: 570 }, storageGate, { x: storage.x, y: storage.y }] },
        { width: 52, points: [{ x: 900, y: 620 }, { x: 760, y: 540 }, { x: 690, y: 470 }] },
        { width: 56, points: [{ x: queen.x, y: queen.y }, { x: 1290, y: 930 }, { x: 1480, y: 900 }] },
        { width: 56, points: [{ x: 1080, y: 520 }, { x: 1240, y: 420 }, middenGate, { x: midden.x, y: midden.y }] },
        { width: 44, points: [{ x: nursery.x, y: nursery.y }, nurseryGate, { x: 850, y: 990 }, { x: queen.x - 70, y: queen.y - 20 }] }
      ];
    }

    function getVisibleNestTunnels() {
      const segments = [];
      for (const route of getNestTunnelRoutes()) {
        for (let i = 0; i < route.points.length - 1; i++) {
          const a = route.points[i];
          const b = route.points[i + 1];
          segments.push({
            originX: a.x,
            originY: a.y,
            angle: Math.atan2(b.y - a.y, b.x - a.x),
            length: Math.hypot(b.x - a.x, b.y - a.y),
            width: route.width,
            currentLength: Math.hypot(b.x - a.x, b.y - a.y),
            excavating: false
          });
        }
      }
      return segments;
    }

    function getMiddenRoute() {
      return getNestTunnelRoutes().find(route => route.points[route.points.length - 1].x === midden.x)?.points || [];
    }

    function drawNestTunnels() {
      for (const route of getNestTunnelRoutes()) drawBurrowPath(route.points, route.width, "rgba(52, 31, 18, 0.98)");
    }

    function drawBurrowPath(points, width, fillStyle) {
      if (!points || points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = fillStyle;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.restore();
    }

    function drawNestRoom() {
      for (const chamber of getNestChambers()) drawChamber(chamber);
      drawNurseryContents();
      drawStorageChamberContents();
      drawMiddenChamberContents();
      drawQueen(queen.x, queen.y, 1.15);
      drawPendingQueenEggs();
      drawExit(exits.nestToOverworld.x, exits.nestToOverworld.y, exits.nestToOverworld.radius, "Exit");
    }

    function drawNurseryContents() {
      ctx.fillStyle = "rgba(255, 235, 176, 0.16)";
      ctx.beginPath();
      ctx.arc(nursery.x, nursery.y, nursery.radius * 0.62, 0, Math.PI * 2);
      ctx.fill();
      if (colony.eggs.length <= 0) return;
      ctx.fillStyle = "#f7dfaa";
      const nurseryEggs = colony.eggs.filter(egg => egg.inNursery);
      for (let i = 0; i < nurseryEggs.length; i++) {
        ctx.beginPath();
        ctx.ellipse(nursery.x - 36 + i * 22, nursery.y - 4 + (i % 2) * 18, 14, 20, -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      if (nurseryEggs.length > 0) drawText(`${Math.ceil(nurseryEggs[0].time)}s ${nurseryEggs[0].role}`, nursery.x, nursery.y + nursery.ry + 28);
      drawNurseryFussEffects(nurseryEggs);
    }

    function drawStorageChamberContents() {
      const pile = Array.isArray(colony.storagePile) ? colony.storagePile : [];
      if (typeof normalizeStorageState === "function") normalizeStorageState();
      ctx.fillStyle = "rgba(202, 151, 76, 0.18)";
      ctx.beginPath();
      ctx.arc(storage.x, storage.y, storage.radius * 0.46, 0, Math.PI * 2);
      ctx.fill();
      const visibleCount = Math.max(4, Math.min(18, pile.length || 4));
      for (let i = 0; i < visibleCount; i++) {
        const stored = pile[i % Math.max(1, pile.length)] || null;
        const angle = i * 1.7;
        const radius = 6 + (i % 4) * 7;
        ctx.fillStyle = stored?.color || "rgba(229, 180, 93, 0.62)";
        ctx.beginPath();
        ctx.ellipse(storage.x + Math.cos(angle) * radius, storage.y + Math.sin(angle) * radius, 9, 6, angle * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const type of getStoredPileTypes()) {
        const sorted = colony.storagePiles[type] || [];
        if (sorted.length <= 0) continue;
        const point = getStoragePilePoint(type);
        for (let i = 0; i < Math.min(7, sorted.length); i++) {
          const food = sorted[i];
          const angle = i * 1.4;
          const radius = 4 + (i % 3) * 5;
          ctx.fillStyle = food.color || "#e4b55e";
          ctx.beginPath();
          ctx.ellipse(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius, 7, 5, angle * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
        drawText(`${sorted.length}`, point.x, point.y + 24);
      }
      if (pile.length > 0) drawText(`${pile.length}`, storage.x, storage.y + storage.radius + 25);
    }

    function drawPendingQueenEggs() {
      const pendingEggs = colony.eggs.filter(egg => !egg.inNursery && !egg.carriedBy);
      if (pendingEggs.length === 0) return;
      ctx.fillStyle = "#f7dfaa";
      for (const egg of pendingEggs) {
        ctx.beginPath();
        ctx.ellipse(egg.x, egg.y, 14, 20, -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawMiddenChamberContents() {
      ctx.fillStyle = "rgba(80, 56, 42, 0.72)";
      ctx.beginPath();
      ctx.ellipse(midden.x - 12, midden.y - 2, 34, 18, 0.12, 0, Math.PI * 2);
      ctx.fill();
      if (colony.recoveredDead > 0) {
        ctx.fillStyle = "rgba(101, 74, 56, 0.72)";
        ctx.beginPath();
        ctx.ellipse(midden.x + 10, midden.y - 6, 18, 10, -0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      drawMiddenFussEffects();
    }

    function drawNurseryFussEffects(nurseryEggs) {
      const nurses = helpers.filter(ant => !ant.dead && ant.roomId === "nest" && ant.role === "nurse" && ant.job === "nursing");
      if (nurses.length === 0 || nurseryEggs.length === 0) return;
      ctx.save();
      for (const egg of nurseryEggs) {
        const nurse = nurses.reduce((best, ant) => !best || distance(ant, egg) < distance(best, egg) ? ant : best, null);
        const pulse = 1 + Math.sin(performance.now() / 180 + egg.x * 0.01) * 0.12;
        ctx.strokeStyle = "rgba(255, 231, 168, 0.42)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(egg.x, egg.y, 24 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        if (nurse) {
          ctx.strokeStyle = "rgba(255, 225, 160, 0.22)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(nurse.x, nurse.y);
          ctx.lineTo(egg.x, egg.y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255, 244, 205, 0.78)";
        for (let i = 0; i < 4; i++) {
          const a = performance.now() / 500 + i * (Math.PI / 2);
          ctx.beginPath();
          ctx.arc(egg.x + Math.cos(a) * 18, egg.y + Math.sin(a) * 12, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawMiddenFussEffects() {
      const workers = helpers.filter(ant => !ant.dead && ant.roomId === "nest" && ant.role === "middenworker" && (ant.job === "healing_midden" || ant.job === "cleaning_midden" || ant.job === "waiting_midden" || ant.job === "fussing_player"));
      if (workers.length === 0) return;
      const sickTargets = helpers.filter(ant => !ant.dead && ant.roomId === "nest" && ant.sick && ant.atMidden);
      const corpses = deadAnts.filter(corpse => corpse.roomId === "nest" && corpse.atMidden && !corpse.carried);
      if (sickTargets.length === 0 && corpses.length === 0) return;
      ctx.save();
      for (const sick of sickTargets) {
        const worker = workers.reduce((best, ant) => !best || distance(ant, sick) < distance(best, sick) ? ant : best, null);
        const pulse = 1 + Math.sin(performance.now() / 160 + sick.x * 0.02) * 0.12;
        ctx.strokeStyle = "rgba(140, 230, 132, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sick.x, sick.y, 22 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        if (worker) {
          ctx.strokeStyle = "rgba(140, 230, 132, 0.2)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(worker.x, worker.y);
          ctx.lineTo(sick.x, sick.y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(180, 245, 170, 0.7)";
        for (let i = 0; i < 3; i++) {
          const a = performance.now() / 430 + i * (Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.arc(sick.x + Math.cos(a) * 16, sick.y + Math.sin(a) * 11, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const corpse of corpses) {
        const worker = workers.reduce((best, ant) => !best || distance(ant, corpse) < distance(best, corpse) ? ant : best, null);
        const pulse = 1 + Math.sin(performance.now() / 140 + corpse.x * 0.02) * 0.12;
        ctx.strokeStyle = "rgba(216, 190, 152, 0.38)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(corpse.x, corpse.y, 20 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        if (worker) {
          ctx.strokeStyle = "rgba(216, 190, 152, 0.18)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(worker.x, worker.y);
          ctx.lineTo(corpse.x, corpse.y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(230, 214, 186, 0.56)";
        for (let i = 0; i < 4; i++) {
          const a = performance.now() / 510 + i * (Math.PI / 2);
          ctx.beginPath();
          ctx.arc(corpse.x + Math.cos(a) * 14, corpse.y + Math.sin(a) * 10, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawChamber(chamber) {
      const { x, y, rx, ry, angle, fill, label, gateway } = chamber;
      ctx.fillStyle = "rgba(52, 31, 18, 0.98)";
      ctx.beginPath();
      ctx.ellipse(x, y, rx + 8, ry + 8, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
      ctx.fill();
      if (gateway) drawChamberGateway(gateway, fill);
      if (label) drawText(label, x, y - ry - 16);
    }

    function drawChamberGateway(gateway, fill) {
      ctx.fillStyle = "rgba(52, 31, 18, 0.98)";
      ctx.beginPath();
      ctx.arc(gateway.x, gateway.y, gateway.radius + 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(gateway.x, gateway.y, gateway.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(225, 184, 117, 0.18)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gateway.x, gateway.y, gateway.radius - 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    function moveNestEntity(entity, dx, dy) {
      if (entity.roomId !== "nest") {
        entity.x += dx;
        entity.y += dy;
        return false;
      }
      const startX = entity.x;
      const startY = entity.y;
      const targetX = startX + dx;
      const targetY = startY + dy;
      let blocked = false;

      if (isNestWalkable(targetX, targetY, entity.radius)) {
        entity.x = targetX;
        entity.y = targetY;
        return false;
      }

      if (dx !== 0) {
        entity.x = startX + dx;
        if (!isNestWalkable(entity.x, startY, entity.radius)) {
          entity.x = startX;
          blocked = true;
        }
      }

      if (dy !== 0) {
        entity.y = startY + dy;
        if (!isNestWalkable(entity.x, entity.y, entity.radius)) {
          entity.y = startY;
          blocked = true;
        }
      }

      if (!isNestWalkable(entity.x, entity.y, entity.radius)) {
        const safeSpot = findNearestNestSafeSpot(entity, startX, startY, targetX, targetY);
        if (safeSpot) {
          entity.x = safeSpot.x;
          entity.y = safeSpot.y;
        } else {
          entity.x = startX;
          entity.y = startY;
        }
        blocked = true;
      }

      return blocked;
    }

    function recoverNestEntityPosition(entity, oldX, oldY) {
      if (!entity || entity.roomId !== "nest") return null;
      const routePoint = getNearestNestRoutePoint(entity.x, entity.y);
      const safeSpot = findNearestNestSafeSpot(entity, oldX ?? entity.x, oldY ?? entity.y);
      const prefersRoute = (!entity.carrying || entity.carrying === "food" || entity.carrying === "queen_food") && (
        entity.job === "leaving_nest" ||
        entity.job === "exploring" ||
        entity.job === "roaming" ||
        entity.job === "returning_home" ||
        entity.job === "retreating" ||
        entity.job === "delivering" ||
        entity.job === "going_to_storage_food" ||
        entity.job === "storage_patrolling" ||
        entity.job === "sorting_storage" ||
        entity.job === "taking_queen_food" ||
        entity.job === "delivering_queen_food"
      );
      if (prefersRoute && routePoint) {
        entity.x = routePoint.x;
        entity.y = routePoint.y;
        return routePoint;
      }
      const routeScore = routePoint ? routePoint.distance : Infinity;
      const safeScore = safeSpot ? Math.hypot(safeSpot.x - entity.x, safeSpot.y - entity.y) : Infinity;
      const chosen = routePoint && routeScore <= safeScore ? routePoint : safeSpot;
      if (!chosen) return null;
      entity.x = chosen.x;
      entity.y = chosen.y;
      return chosen;
    }

    function getNestRecoverySpawnPoint(entity) {
      const routes = getNestTunnelRoutes();
      if (routes.length === 0) return null;
      const route = routes[0];
      if (!route || !Array.isArray(route.points) || route.points.length < 3) return null;
      const a = route.points[1];
      const b = route.points[2];
      const candidate = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (isNestWalkable(candidate.x, candidate.y, entity?.radius || 10)) return candidate;
      const routePoint = getNearestNestRoutePoint(candidate.x, candidate.y);
      return routePoint ? { x: routePoint.x, y: routePoint.y } : null;
    }

    function findNearestNestSafeSpot(entity, oldX, oldY, preferredX = oldX, preferredY = oldY) {
      const anchors = [
        { x: preferredX, y: preferredY },
        { x: oldX, y: oldY },
        { x: entity.x, y: entity.y },
        getNearestNestRoutePoint(preferredX, preferredY),
        getNearestNestRoutePoint(entity.x, entity.y),
        ...getNestChambers().map(chamber => ({ x: chamber.x, y: chamber.y })),
        ...getNestTunnelRoutes().flatMap(route => route.points)
      ].filter(Boolean);
      const offsets = [0, 8, 16, 26, 38, 54, 72, 96];
      let best = null;
      let bestScore = Infinity;
      for (const anchor of anchors) {
        for (const radius of offsets) {
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const candidate = { x: anchor.x + Math.cos(angle) * radius, y: anchor.y + Math.sin(angle) * radius };
            if (!isNestWalkable(candidate.x, candidate.y, entity.radius)) continue;
            const score = Math.hypot(candidate.x - preferredX, candidate.y - preferredY) + Math.hypot(candidate.x - oldX, candidate.y - oldY) * 0.25;
            if (score < bestScore) {
              bestScore = score;
              best = candidate;
            }
          }
        }
      }
      return best;
    }

    function getNearestNestRoutePoint(x, y) {
      const routes = getNestTunnelRoutes();
      let best = null;
      for (const route of routes) {
        for (let i = 0; i < route.points.length - 1; i++) {
          const a = route.points[i];
          const b = route.points[i + 1];
          const point = getNearestPointOnSegment(x, y, a, b);
          const distanceToPoint = Math.hypot(point.x - x, point.y - y);
          if (!best || distanceToPoint < best.distance) {
            best = { x: point.x, y: point.y, distance: distanceToPoint };
          }
        }
      }
      return best;
    }

    function isNestWalkable(x, y, radius) {
      for (const chamber of getNestChambers()) {
        if (pointInEllipse(x, y, chamber.x, chamber.y, chamber.rx - radius * 0.15, chamber.ry - radius * 0.15, chamber.angle)) return true;
      }
      for (const route of getNestTunnelRoutes()) {
        for (let i = 0; i < route.points.length - 1; i++) {
          const a = route.points[i];
          const b = route.points[i + 1];
          if (pointInCorridor(x, y, a.x, a.y, b.x, b.y, route.width + radius * 1.6)) return true;
        }
      }
      return false;
    }

    function pointInEllipse(x, y, cx, cy, rx, ry, angle) {
      const dx = x - cx;
      const dy = y - cy;
      const localX = Math.cos(-angle) * dx - Math.sin(-angle) * dy;
      const localY = Math.sin(-angle) * dx + Math.cos(-angle) * dy;
      return (localX * localX) / (rx * rx) + (localY * localY) / (ry * ry) <= 1;
    }

    function pointInRotatedTunnel(x, y, originX, originY, angle, length, width) {
      const dx = x - originX;
      const dy = y - originY;
      const localX = Math.cos(-angle) * dx - Math.sin(-angle) * dy;
      const localY = Math.sin(-angle) * dx + Math.cos(-angle) * dy;
      return localX >= 0 && localX <= length && Math.abs(localY) <= width / 2;
    }

    function pointInCorridor(x, y, ax, ay, bx, by, width) {
      const vx = bx - ax;
      const vy = by - ay;
      const lengthSq = vx * vx + vy * vy;
      const t = clamp(((x - ax) * vx + (y - ay) * vy) / lengthSq, 0, 1);
      const px = ax + vx * t;
      const py = ay + vy * t;
      return Math.hypot(x - px, y - py) <= width / 2;
    }

    function getNearestPointOnSegment(x, y, a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq === 0 ? 0 : clamp(((x - a.x) * dx + (y - a.y) * dy) / lengthSq, 0, 1);
      return { x: a.x + dx * t, y: a.y + dy * t };
    }
