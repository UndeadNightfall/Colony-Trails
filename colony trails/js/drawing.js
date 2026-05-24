    function draw() {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      ctx.clearRect(0, 0, screenW, screenH);
      ctx.save();
      ctx.translate(-world.cameraX, -world.cameraY);
      if (player.roomId === "nest") { drawNestRoomGround(); drawNestRoom(); }
      else { drawGround(); drawDecorations(); drawRoomExits(); drawCrumbs(); drawObstructions(); drawSpiders(); }
      drawSoldierAwareness();
      drawCombatEffects();
      drawDeadAnts();
      drawHelpers();
      drawPlayer();
      ctx.restore();
    }
    function drawRakeDetails(item) {
      ctx.strokeStyle = "#4b3523";
      ctx.lineWidth = 3;
      for (let x = item.x + item.width - 62; x < item.x + item.width - 12; x += 10) { ctx.beginPath(); ctx.moveTo(x, item.y + 2); ctx.lineTo(x - 6, item.y - 28); ctx.stroke(); }
      ctx.fillStyle = "#b99259";
      roundRect(item.x - 62, item.y + 6, 86, 10, 5);
      ctx.fill();
    }

    function drawChairDetails(item) {
      ctx.strokeStyle = "rgba(35, 45, 42, 0.62)";
      ctx.lineWidth = 7;
      for (const [x, y] of [[18, 18], [item.width - 18, 18], [18, item.height - 18], [item.width - 18, item.height - 18]]) {
        ctx.beginPath(); ctx.arc(item.x + x, item.y + y, 9, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(230, 240, 232, 0.32)";
      ctx.lineWidth = 4;
      for (let y = item.y + 32; y < item.y + item.height - 18; y += 22) { ctx.beginPath(); ctx.moveTo(item.x + 18, y); ctx.lineTo(item.x + item.width - 18, y); ctx.stroke(); }
    }

    function drawBoardDetails(item) {
      ctx.strokeStyle = "rgba(70, 40, 22, 0.62)";
      ctx.lineWidth = 3;
      for (let x = item.x + 28; x < item.x + item.width; x += 46) { ctx.beginPath(); ctx.moveTo(x, item.y + 5); ctx.lineTo(x - 10, item.y + item.height - 5); ctx.stroke(); }
    }

    function drawSoccerBallDetails(item) {
      ctx.fillStyle = "#202020";
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; ctx.beginPath(); ctx.arc(item.x + Math.cos(a) * 18, item.y + Math.sin(a) * 18, 7, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawPlantPotDetails(item) {
      ctx.fillStyle = "#3d6f2d";
      for (let i = 0; i < 7; i++) { const a = i * 0.9; ctx.beginPath(); ctx.ellipse(item.x + Math.cos(a) * 18, item.y - 30 + Math.sin(a) * 8, 8, 28, a, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "#5b2f1e"; ctx.beginPath(); ctx.arc(item.x, item.y, item.radius * 0.6, 0, Math.PI * 2); ctx.fill();
    }

    function drawWateringCanDetails(item) {
      ctx.strokeStyle = "#41645f";
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(item.x + 28, item.y, 28, -1.2, 1.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(item.x - 38, item.y - 12); ctx.lineTo(item.x - 78, item.y - 34); ctx.stroke();
    }

    function drawGardenLightDetails(item) {
      ctx.fillStyle = "#d9d59d"; ctx.beginPath(); ctx.arc(item.x, item.y - 5, item.radius * 0.48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3d453c"; ctx.fillRect(item.x - 4, item.y + 14, 8, 38);
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

    function drawDeadAnts() {
      for (const corpse of deadAnts) {
        if (corpse.carried || corpse.roomId !== player.roomId) continue;
        drawDeadAnt(corpse.x, corpse.y, corpse.radius);
      }
    }

    function drawDeadAnt(x, y, size) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.65);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(0, size * 0.55, size * 1.1, size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a3a2a";
      ctx.beginPath(); ctx.ellipse(-size * 0.6, 0, size * 0.48, size * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, size * 0.5, size * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(size * 0.65, 0, size * 0.55, size * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawSoldierAwareness() {
      for (const ant of helpers) {
        if (ant.dead || ant.role !== "soldier" || ant.roomId !== player.roomId) continue;
        if (ant.job === "attacking_spider" && ant.targetSpider && ant.targetSpider.alive) {
          ctx.strokeStyle = "rgba(255, 96, 66, 0.52)";
          ctx.lineWidth = 3;
          ctx.setLineDash([7, 6]);
          ctx.beginPath();
          ctx.moveTo(ant.x, ant.y);
          ctx.lineTo(ant.targetSpider.x, ant.targetSpider.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = "rgba(255, 96, 66, 0.34)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ant.targetSpider.x, ant.targetSpider.y, ant.targetSpider.radius + 14 + Math.sin(performance.now() / 120) * 4, 0, Math.PI * 2);
          ctx.stroke();
        } else if (ant.job === "patrolling") {
          ctx.strokeStyle = "rgba(255, 202, 94, 0.2)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ant.x, ant.y, 34 + Math.sin(performance.now() / 280 + ant.x) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    function drawCombatEffects() {
      for (const effect of combatEffects) {
        const t = clamp(effect.time / effect.maxTime, 0, 1);
        ctx.save();
        ctx.globalAlpha = t;
        ctx.strokeStyle = effect.type === "hit" ? "#ffd166" : effect.type === "danger" ? "#ff5c45" : "#fff1b8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 8 + (1 - t) * 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawHelpers() { for (const ant of helpers) if (!ant.dead && ant.roomId === player.roomId) drawAnt(ant.x, ant.y, ant.angle, ant.radius, getRoleStats(ant.role || "worker").color, ant.carrying, ant.role, ant.job); }
    function drawPlayer() { const flash = player.invulnerable > 0 && Math.floor(performance.now() / 90) % 2 === 0; if (!flash) drawAnt(player.x, player.y, player.angle, player.radius, "#3a180d", player.carrying); }

    function drawAnt(x, y, angle, size, color, carrying, role = "worker", job = "") {
      const walk = performance.now() / 130 + x * 0.03 + y * 0.02;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(0, size * 0.8, size * 1.35, size * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(-size * 0.85, 0, size * 0.55, size * 0.48, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, size * 0.58, size * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(size * 0.9, 0, size * 0.72, size * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        const lx = i * size * 0.25;
        const phase = walk + i * 1.7;
        const topSwing = Math.sin(phase) * size * 0.18;
        const bottomSwing = Math.sin(phase + Math.PI) * size * 0.18;
        ctx.beginPath();
        ctx.moveTo(lx, -size * 0.2);
        ctx.lineTo(lx - size * 0.55 + topSwing, -size * 0.8 - Math.abs(topSwing) * 0.25);
        ctx.moveTo(lx, size * 0.2);
        ctx.lineTo(lx - size * 0.55 + bottomSwing, size * 0.8 + Math.abs(bottomSwing) * 0.25);
        ctx.stroke();
      }
      ctx.fillStyle = "#fff1c4"; ctx.beginPath(); ctx.arc(-size * 1.02, -size * 0.14, 2, 0, Math.PI * 2); ctx.arc(-size * 1.02, size * 0.14, 2, 0, Math.PI * 2); ctx.fill();
      if (role === "soldier") {
        ctx.strokeStyle = job === "attacking_spider" ? "#ffcf65" : "#c58c42";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size * 1.35, -size * 0.22);
        ctx.lineTo(-size * 1.75, -size * 0.52);
        ctx.moveTo(-size * 1.35, size * 0.22);
        ctx.lineTo(-size * 1.75, size * 0.52);
        ctx.stroke();
      }
      if (carrying === "dead") drawDeadAnt(-size * 1.8, 0, size * 0.58);
      else if (carrying) { ctx.fillStyle = "#e5b45d"; ctx.beginPath(); ctx.ellipse(-size * 1.8, 0, size * 0.55, size * 0.42, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }

    function drawQueen(x, y, scale) {
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(10, 34, 72, 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#a96335"; ctx.beginPath(); ctx.ellipse(34, 0, 54, 35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ce8750"; ctx.beginPath(); ctx.ellipse(-18, 0, 34, 29, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e2a05c"; ctx.beginPath(); ctx.ellipse(-55, 0, 27, 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#1b0d08"; ctx.beginPath(); ctx.arc(-64, -7, 3, 0, Math.PI * 2); ctx.arc(-64, 7, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
