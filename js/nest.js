    function drawNestRoomGround() {
      ctx.fillStyle = "#21120b";
      ctx.fillRect(0, 0, rooms.nest.width, rooms.nest.height);
      drawNestTunnels();
    }

    function getNestChambers() {
      return [
        { id: "entrance", label: "Entrance", x: 1120, y: 210, rx: 96, ry: 54, angle: 0.05, fill: "#392112" },
        { id: "junction", label: "", x: 1080, y: 520, rx: 82, ry: 58, angle: -0.08, fill: "#342012" },
        { id: "nursery", label: "Nursery", x: nursery.x, y: nursery.y, rx: nursery.rx, ry: nursery.ry, angle: -0.12, fill: "#2b190d" },
        { id: "queen", label: "Queen", x: queen.x, y: queen.y, rx: 128, ry: 82, angle: 0.08, fill: "#301b0f" },
        { id: "storeA", label: "Stores", x: 1390, y: 610, rx: 94, ry: 58, angle: 0.18, fill: "#352113" },
        { id: "restA", label: "", x: 690, y: 470, rx: 100, ry: 56, angle: -0.22, fill: "#342012" },
        { id: "restB", label: "", x: 1480, y: 900, rx: 112, ry: 60, angle: 0.12, fill: "#342012" },
        { id: "midden", label: "Midden", x: midden.x, y: midden.y, rx: midden.radius, ry: midden.radius * 0.78, angle: 0.1, fill: "#24150d" }
      ];
    }

    function getNestTunnelRoutes() {
      return [
        { width: 74, points: [{ x: exits.nestToOverworld.x, y: exits.nestToOverworld.y }, { x: 1120, y: 210 }, { x: 1080, y: 520 }] },
        { width: 58, points: [{ x: 1080, y: 520 }, { x: 900, y: 620 }, { x: nursery.x, y: nursery.y }] },
        { width: 64, points: [{ x: 1080, y: 520 }, { x: 1030, y: 780 }, { x: queen.x, y: queen.y }] },
        { width: 54, points: [{ x: 1080, y: 520 }, { x: 1280, y: 570 }, { x: 1390, y: 610 }] },
        { width: 52, points: [{ x: 900, y: 620 }, { x: 760, y: 540 }, { x: 690, y: 470 }] },
        { width: 56, points: [{ x: queen.x, y: queen.y }, { x: 1290, y: 930 }, { x: 1480, y: 900 }] },
        { width: 56, points: [{ x: 1080, y: 520 }, { x: 1240, y: 420 }, { x: midden.x, y: midden.y }] },
        { width: 44, points: [{ x: nursery.x, y: nursery.y }, { x: 850, y: 990 }, { x: queen.x - 70, y: queen.y - 20 }] }
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
      for (const chamber of getNestChambers()) drawChamber(chamber.x, chamber.y, chamber.rx, chamber.ry, chamber.angle, chamber.fill, chamber.label);
      drawNurseryContents();
      drawMiddenChamberContents();
      drawQueen(queen.x, queen.y, 1.15);
      drawExit(exits.nestToOverworld.x, exits.nestToOverworld.y, exits.nestToOverworld.radius, "Exit");
    }

    function drawNurseryContents() {
      ctx.fillStyle = "rgba(255, 235, 176, 0.16)";
      ctx.beginPath();
      ctx.ellipse(nursery.x, nursery.y, nursery.rx * 0.72, nursery.ry * 0.58, -0.12, 0, Math.PI * 2);
      ctx.fill();
      drawPendingQueenEggs();
      if (colony.eggs.length <= 0) return;
      ctx.fillStyle = "#f7dfaa";
      const nurseryEggs = colony.eggs.filter(egg => egg.inNursery);
      for (let i = 0; i < nurseryEggs.length; i++) {
        ctx.beginPath();
        ctx.ellipse(nursery.x - 36 + i * 22, nursery.y - 4 + (i % 2) * 18, 14, 20, -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      if (nurseryEggs.length > 0) drawText(`${Math.ceil(nurseryEggs[0].time)}s ${nurseryEggs[0].role}`, nursery.x, nursery.y + nursery.ry + 28);
    }

    function drawPendingQueenEggs() {
      const pendingEggs = colony.eggs.filter(egg => !egg.inNursery);
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
    }

    function drawChamber(x, y, rx, ry, angle, fill, label) {
      ctx.fillStyle = "rgba(52, 31, 18, 0.98)";
      ctx.beginPath();
      ctx.ellipse(x, y, rx + 8, ry + 8, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
      ctx.fill();
      if (label) drawText(label, x, y - ry - 16);
    }

    function moveNestEntity(entity, dx, dy) {
      if (entity.roomId !== "nest") {
        entity.x += dx;
        entity.y += dy;
        return false;
      }
      const startX = entity.x;
      const startY = entity.y;
      let blocked = false;

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
        const safeSpot = findNearestNestSafeSpot(entity, startX, startY);
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

    function findNearestNestSafeSpot(entity, oldX, oldY) {
      const anchors = [
        { x: oldX, y: oldY },
        { x: entity.x, y: entity.y },
        ...getNestChambers().map(chamber => ({ x: chamber.x, y: chamber.y })),
        ...getNestTunnelRoutes().flatMap(route => route.points)
      ];
      const offsets = [0, 12, 24, 38, 54, 72];
      let best = null;
      let bestScore = Infinity;
      for (const anchor of anchors) {
        for (const radius of offsets) {
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const candidate = { x: anchor.x + Math.cos(angle) * radius, y: anchor.y + Math.sin(angle) * radius };
            if (!isNestWalkable(candidate.x, candidate.y, entity.radius)) continue;
            const score = Math.hypot(candidate.x - oldX, candidate.y - oldY);
            if (score < bestScore) {
              bestScore = score;
              best = candidate;
            }
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
