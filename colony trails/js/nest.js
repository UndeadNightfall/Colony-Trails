    function drawNestRoomGround() {
      const gradient = ctx.createRadialGradient(queen.x, queen.y, 20, queen.x, queen.y, 620);
      gradient.addColorStop(0, "#6a3c23");
      gradient.addColorStop(0.62, "#3d2114");
      gradient.addColorStop(1, "#1d0f09");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rooms.nest.width, rooms.nest.height);
      drawNestWallTexture();
      ctx.fillStyle = "rgba(255, 210, 130, 0.08)";
      for (let i = 0; i < 70; i++) { const x = (i * 83) % rooms.nest.width; const y = (i * 47) % rooms.nest.height; ctx.beginPath(); ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2); ctx.fill(); }
      drawNestTunnels();
    }

    function drawNestWallTexture() {
      ctx.fillStyle = "rgba(12, 7, 4, 0.2)";
      for (let i = 0; i < 95; i++) {
        const x = (i * 97) % rooms.nest.width;
        const y = (i * 53) % rooms.nest.height;
        ctx.beginPath();
        ctx.ellipse(x, y, 18 + (i % 5) * 7, 8 + (i % 3) * 4, i * 0.31, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawNestTunnels() {
      const tunnels = getVisibleNestTunnels();
      for (const tunnel of tunnels) {
        ctx.save();
        ctx.translate(queen.x, queen.y);
        ctx.rotate(tunnel.angle);
        ctx.strokeStyle = tunnel.excavating ? "rgba(255, 196, 95, 0.35)" : "rgba(255, 219, 150, 0.26)";
        ctx.lineWidth = 13;
        roundRect(20, -tunnel.width / 2, tunnel.currentLength, tunnel.width, tunnel.width / 2);
        ctx.stroke();
        ctx.fillStyle = tunnel.excavating ? "rgba(84, 48, 26, 0.82)" : "rgba(44, 24, 13, 0.92)";
        roundRect(20, -tunnel.width / 2, tunnel.currentLength, tunnel.width, tunnel.width / 2);
        ctx.fill();
        ctx.strokeStyle = tunnel.excavating ? "rgba(255, 235, 160, 0.34)" : "rgba(255, 228, 170, 0.16)";
        ctx.lineWidth = 3;
        roundRect(20, -tunnel.width / 2, tunnel.currentLength, tunnel.width, tunnel.width / 2);
        ctx.stroke();
        if (tunnel.excavating) drawExcavationFace(tunnel.currentLength, tunnel.width);
        ctx.restore();
      }
    }

    function drawExcavationFace(length, width) {
      const pulse = Math.sin(performance.now() / 180) * 0.18 + 0.62;
      ctx.fillStyle = `rgba(216, 142, 66, ${pulse})`;
      ctx.beginPath();
      ctx.ellipse(length + 20, 0, 18, width * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 225, 150, 0.46)";
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(length + 6, i * width * 0.18);
        ctx.lineTo(length + 30, i * width * 0.08);
        ctx.stroke();
      }
    }

    function getNestTunnelPlan() {
      return [
        { angle: 0, length: 770, width: 74 },
        { angle: -0.82, length: 380, width: 58 },
        { angle: 0.86, length: 430, width: 58 },
        { angle: Math.PI, length: 250, width: 52 }
      ];
    }

    function getVisibleNestTunnels() {
      const tunnels = getNestTunnelPlan().slice(0, colony.nestStage).map(tunnel => ({ ...tunnel, currentLength: tunnel.length, excavating: false }));
      if (colony.excavation.active) {
        const next = getNestTunnelPlan()[colony.excavation.targetStage - 1];
        if (next) tunnels.push({ ...next, currentLength: Math.max(60, next.length * Math.min(1, colony.excavation.progress / colony.excavation.duration)), excavating: true });
      }
      return tunnels;
    }

    function drawNestRoom() {
      drawMainNestChamber();
      drawQueen(queen.x, queen.y, 1.15);
      drawEggChamber();
      drawMiddenChamber();
      drawExit(exits.nestToOverworld.x, exits.nestToOverworld.y, exits.nestToOverworld.radius, "Exit");
      drawText("Queen", queen.x, queen.y - 74);
    }

    function drawMainNestChamber() {
      ctx.fillStyle = "rgba(52, 29, 16, 0.96)";
      ctx.beginPath();
      ctx.arc(nest.x, nest.y, nest.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 224, 158, 0.34)";
      ctx.lineWidth = 9;
      ctx.stroke();
      ctx.strokeStyle = "rgba(28, 14, 8, 0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(nest.x, nest.y, nest.radius - 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawMiddenChamber() {
      drawChamber(midden.x, midden.y, midden.radius, midden.radius * 0.72, 0.1, "#24150d", "Midden");
      ctx.fillStyle = "rgba(80, 56, 42, 0.78)";
      for (let i = 0; i < colony.recoveredDead; i++) {
        ctx.beginPath();
        ctx.ellipse(midden.x - 28 + (i * 13) % 56, midden.y - 12 + Math.floor(i / 5) * 9, 8, 4, i * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawEggChamber() {
      drawChamber(queen.x - 126, queen.y + 96, 76, 46, -0.25, "#2c170c", "Eggs");
      ctx.fillStyle = "rgba(255, 235, 176, 0.18)";
      ctx.beginPath();
      ctx.ellipse(queen.x - 126, queen.y + 96, 58, 30, -0.2, 0, Math.PI * 2);
      ctx.fill();
      if (colony.eggs.length <= 0) return;
      ctx.fillStyle = "#f7dfaa";
      for (let i = 0; i < colony.eggs.length; i++) {
        ctx.beginPath();
        ctx.ellipse(queen.x - 138 + i * 22, queen.y + 94, 14, 20, -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      drawText(`${Math.ceil(colony.eggs[0].time)}s ${colony.eggs[0].role}`, queen.x - 126, queen.y + 150);
    }

    function drawChamber(x, y, rx, ry, angle, fill, label) {
      ctx.fillStyle = "rgba(255, 218, 150, 0.22)";
      ctx.beginPath();
      ctx.ellipse(x, y, rx + 8, ry + 8, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 226, 170, 0.28)";
      ctx.lineWidth = 4;
      ctx.stroke();
      drawText(label, x, y - ry - 14);
    }
    function drawNestRoom() {
      ctx.fillStyle = "rgba(45, 25, 13, 0.78)"; ctx.beginPath(); ctx.arc(nest.x, nest.y, nest.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255, 213, 142, 0.24)"; ctx.lineWidth = 5; ctx.stroke();
      drawQueen(queen.x, queen.y, 1.15);
      drawEggChamber();
      drawExit(exits.nestToOverworld.x, exits.nestToOverworld.y, exits.nestToOverworld.radius, "Exit");
      drawText("Queen", queen.x, queen.y - 74);
    }

    function drawEggChamber() {
      ctx.fillStyle = "rgba(36, 18, 9, 0.74)";
      ctx.beginPath();
      ctx.ellipse(queen.x - 126, queen.y + 96, 76, 46, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 213, 142, 0.18)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 235, 176, 0.18)";
      ctx.beginPath();
      ctx.ellipse(queen.x - 126, queen.y + 96, 58, 30, -0.2, 0, Math.PI * 2);
      ctx.fill();
      if (colony.eggs.length <= 0) return;
      ctx.fillStyle = "#f7dfaa";
      for (let i = 0; i < colony.eggs.length; i++) {
        ctx.beginPath();
        ctx.ellipse(queen.x - 138 + i * 22, queen.y + 94, 14, 20, -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      drawText(`${Math.ceil(colony.eggs[0].time)}s ${colony.eggs[0].role}`, queen.x - 126, queen.y + 150);
    }
    function resolveNestWalls(entity, oldX, oldY) {
      if (entity.roomId !== "nest" || isNestWalkable(entity.x, entity.y, entity.radius)) return;
      entity.x = oldX;
      entity.y = oldY;
      if (!isNestWalkable(entity.x, entity.y, entity.radius)) {
        entity.x = queen.x + 80;
        entity.y = queen.y;
      }
      entity.angle += Math.PI + randomBetween(-0.35, 0.35);
    }

    function isNestWalkable(x, y, radius) {
      const chamberRadius = 136 + (colony.nestStage - 1) * 14;
      if (Math.hypot(x - queen.x, y - queen.y) <= chamberRadius - radius * 0.2) return true;
      if (Math.hypot(x - (queen.x - 126), y - (queen.y + 96)) <= 70 - radius * 0.2) return true;
      if (Math.hypot(x - midden.x, y - midden.y) <= midden.radius + radius * 0.2) return true;
      if (pointInCorridor(x, y, queen.x - 126, queen.y + 96, queen.x - 52, queen.y + 44, 34 + radius)) return true;
      if (pointInCorridor(x, y, midden.x, midden.y, queen.x - 78, queen.y + 58, 32 + radius)) return true;
      for (const tunnel of getVisibleNestTunnels()) {
        if (pointInRotatedTunnel(x, y, queen.x, queen.y, tunnel.angle, tunnel.currentLength + 26, tunnel.width + radius * 1.4)) return true;
      }
      return false;
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
