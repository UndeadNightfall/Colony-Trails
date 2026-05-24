    function draw() {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      ctx.clearRect(0, 0, screenW, screenH);
      ctx.save();
      ctx.translate(-world.cameraX, -world.cameraY);
      if (player.roomId === "nest") { drawNestRoomGround(); drawNestRoom(); }
      else { drawGround(); drawDecorations(); drawSafeTrails(); drawRoomExits(); drawCrumbs(); drawObstructions(); drawSpiders(); }
      drawSeasonOverlay();
      drawSoldierAwareness();
      drawCombatEffects();
      drawDeadAnts();
      drawHelpers();
      drawPlayer();
      ctx.restore();
      if (weather.active) drawRain();
    }
    function drawRakeDetails(item) {
      ctx.strokeStyle = "#4b3523";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(item.x + 16, item.y + item.height / 2);
      ctx.lineTo(item.x + item.width - 18, item.y + item.height / 2);
      ctx.stroke();
      for (let x = item.x + item.width - 34; x < item.x + item.width - 10; x += 8) { ctx.beginPath(); ctx.moveTo(x, item.y + item.height / 2); ctx.lineTo(x - 3, item.y + item.height / 2 - 10); ctx.stroke(); }
      ctx.fillStyle = "#b99259";
      roundRect(item.x - 54, item.y + 4, 72, 8, 4);
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

    function drawSofaDetails(item) {
      ctx.fillStyle = "rgba(255, 238, 220, 0.16)";
      ctx.fillRect(item.x + 18, item.y + 20, item.width - 36, 34);
      ctx.strokeStyle = "rgba(35, 21, 14, 0.35)";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(item.x + 22, item.y + item.height - 18, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(item.x + item.width - 22, item.y + item.height - 18, 12, 0, Math.PI * 2); ctx.stroke();
    }

    function drawCoffeeTableDetails(item) {
      ctx.fillStyle = "rgba(255, 240, 220, 0.12)";
      roundRect(item.x + 20, item.y + 16, item.width - 40, item.height - 32, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(54, 34, 18, 0.36)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(item.x + 24, item.y + item.height / 2); ctx.lineTo(item.x + item.width - 24, item.y + item.height / 2); ctx.stroke();
    }

    function drawDiningTableDetails(item) {
      ctx.fillStyle = "rgba(255, 240, 220, 0.14)";
      roundRect(item.x + 24, item.y + 22, item.width - 48, item.height - 44, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(60, 36, 24, 0.32)";
      ctx.lineWidth = 4;
      for (const [dx, dy] of [[18, 18], [item.width - 18, 18], [18, item.height - 18], [item.width - 18, item.height - 18]]) {
        ctx.beginPath();
        ctx.moveTo(item.x + dx, item.y + dy);
        ctx.lineTo(item.x + dx + (dx < item.width / 2 ? -8 : 8), item.y + dy + (dy < item.height / 2 ? -18 : 18));
        ctx.stroke();
      }
    }

    function drawRugDetails(item) {
      ctx.fillStyle = "rgba(255, 238, 220, 0.1)";
      ctx.fillRect(item.x + 14, item.y + 14, item.width - 28, item.height - 28);
      ctx.strokeStyle = "rgba(82, 40, 24, 0.28)";
      ctx.lineWidth = 2;
      for (let y = item.y + 20; y < item.y + item.height - 20; y += 22) {
        ctx.beginPath();
        ctx.moveTo(item.x + 24, y);
        ctx.lineTo(item.x + item.width - 24, y);
        ctx.stroke();
      }
    }

    function drawBookshelfDetails(item) {
      ctx.fillStyle = "rgba(255, 238, 220, 0.12)";
      for (let y = item.y + 18; y < item.y + item.height - 18; y += 48) {
        ctx.fillRect(item.x + 18, y, item.width - 36, 10);
      }
      ctx.strokeStyle = "rgba(40, 24, 14, 0.34)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(item.x + item.width / 2, item.y + 12); ctx.lineTo(item.x + item.width / 2, item.y + item.height - 12); ctx.stroke();
    }

    function drawPottedPlantDetails(item) {
      ctx.fillStyle = "#4b7a42";
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9;
        ctx.beginPath();
        ctx.ellipse(item.x + Math.cos(a) * 20, item.y - 34 + Math.sin(a) * 9, 9, 28, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#6d4024";
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawLampDetails(item) {
      ctx.fillStyle = "rgba(255, 249, 216, 0.78)";
      ctx.beginPath();
      ctx.arc(item.x, item.y - 8, item.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4c4338";
      ctx.fillRect(item.x - 4, item.y + 10, 8, 42);
    }


    function drawRoomExits() {
      for (const exit of getRoomExits(player.roomId)) drawExit(exit.x, exit.y, exit.radius, exit.label);
    }

    function drawSafeTrails() {
      if (typeof getSafeTrailRoutes !== "function" || typeof getSafeTrailRadius !== "function") return;
      const routes = getSafeTrailRoutes(player.roomId);
      if (routes.length === 0) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const route of routes) {
        if (route.length < 2) continue;
        ctx.strokeStyle = "rgba(184, 151, 92, 0.24)";
        ctx.lineWidth = getSafeTrailRadius() * 2;
        ctx.beginPath();
        ctx.moveTo(route[0].x, route[0].y);
        for (let i = 1; i < route.length; i++) ctx.lineTo(route[i].x, route[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawExit(x, y, radius, label) {
      if (label === "Nest" && nestGatewayImage && nestGatewayImage.complete && nestGatewayImage.naturalWidth > 0) {
        const targetWidth = radius * 2.6;
        const targetHeight = targetWidth * (nestGatewayImage.naturalHeight / Math.max(1, nestGatewayImage.naturalWidth));
        const entranceAnchorX = targetWidth * 0.45;
        const entranceAnchorY = targetHeight * 0.67;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin((x + y) * 0.02) * 0.03);
        ctx.drawImage(
          nestGatewayImage,
          -entranceAnchorX,
          -entranceAnchorY,
          targetWidth,
          targetHeight
        );
        ctx.restore();
        return;
      }
      if (label === "Exit" && player.roomId === "nest" && outworldGatewayImage && outworldGatewayImage.complete && outworldGatewayImage.naturalWidth > 0) {
        const targetWidth = radius * 2.55;
        const targetHeight = targetWidth * (outworldGatewayImage.naturalHeight / Math.max(1, outworldGatewayImage.naturalWidth));
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(
          outworldGatewayImage,
          -targetWidth * 0.5,
          -targetHeight * 0.5,
          targetWidth,
          targetHeight
        );
        ctx.restore();
        return;
      }
      if (label === "Garden" && gardenGatewayImage && gardenGatewayImage.complete && gardenGatewayImage.naturalWidth > 0) {
        const targetWidth = radius * 2.55;
        const targetHeight = targetWidth * (gardenGatewayImage.naturalHeight / Math.max(1, gardenGatewayImage.naturalWidth));
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(
          gardenGatewayImage,
          -targetWidth * 0.5,
          -targetHeight * 0.5,
          targetWidth,
          targetHeight
        );
        ctx.restore();
        return;
      }
      if (label === "Sandpit" && sandpitGatewayImage && sandpitGatewayImage.complete && sandpitGatewayImage.naturalWidth > 0) {
        const targetWidth = radius * 2.55;
        const targetHeight = targetWidth * (sandpitGatewayImage.naturalHeight / Math.max(1, sandpitGatewayImage.naturalWidth));
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(
          sandpitGatewayImage,
          -targetWidth * 0.5,
          -targetHeight * 0.5,
          targetWidth,
          targetHeight
        );
        ctx.restore();
        return;
      }
      if (label === "Patio" && patioGatewayImage && patioGatewayImage.complete && patioGatewayImage.naturalWidth > 0) {
        const targetWidth = radius * 2.55;
        const targetHeight = targetWidth * (patioGatewayImage.naturalHeight / Math.max(1, patioGatewayImage.naturalWidth));
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(
          patioGatewayImage,
          -targetWidth * 0.5,
          -targetHeight * 0.5,
          targetWidth,
          targetHeight
        );
        ctx.restore();
        return;
      }
      if (label === "House" && houseGatewayImage && houseGatewayImage.complete && houseGatewayImage.naturalWidth > 0) {
        const targetWidth = radius * 2.55;
        const targetHeight = targetWidth * (houseGatewayImage.naturalHeight / Math.max(1, houseGatewayImage.naturalWidth));
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(
          houseGatewayImage,
          -targetWidth * 0.5,
          -targetHeight * 0.5,
          targetWidth,
          targetHeight
        );
        ctx.restore();
        return;
      }
      if (label === "Yard" && backyardGatewayImage && backyardGatewayImage.complete && backyardGatewayImage.naturalWidth > 0) {
        const targetWidth = radius * 2.55;
        const targetHeight = targetWidth * (backyardGatewayImage.naturalHeight / Math.max(1, backyardGatewayImage.naturalWidth));
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(
          backyardGatewayImage,
          -targetWidth * 0.5,
          -targetHeight * 0.5,
          targetWidth,
          targetHeight
        );
        ctx.restore();
        return;
      }
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
      if (label !== "Nest") drawText(label, x, y - radius - 14);
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

    function drawHelpers() { for (const ant of helpers) if (!ant.dead && !ant.carriedBy && ant.roomId === player.roomId) drawAnt(ant.x, ant.y, ant.angle, ant.radius, getRoleStats(ant.role || "worker").color, ant.carrying, ant.role, ant.job, ant.sick); }
    function drawPlayer() { const flash = player.invulnerable > 0 && Math.floor(performance.now() / 90) % 2 === 0; if (!flash) drawAnt(player.x, player.y, player.angle, player.radius, "#120c0a", player.carrying, "worker", "", player.sick); }

    function drawAnt(x, y, angle, size, color, carrying, role = "worker", job = "", sick = false) {
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
      } else if (role === "middenworker" && (job === "cleaning_midden" || job === "waiting_midden" || job === "midden_patrolling")) {
        ctx.strokeStyle = "rgba(255, 221, 162, 0.42)";
        ctx.lineWidth = 2;
        const pulse = Math.sin(performance.now() / 120 + x * 0.04) * 4;
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 2 * i) / 4 + performance.now() / 600;
          ctx.beginPath();
          ctx.arc(-size * 1.12 + Math.cos(a) * 4, Math.sin(a) * 4, 2 + (i % 2), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-size * 1.2, -size * 0.04 + pulse * 0.1);
        ctx.lineTo(-size * 1.6, -size * 0.12);
        ctx.moveTo(-size * 1.2, size * 0.04 - pulse * 0.1);
        ctx.lineTo(-size * 1.6, size * 0.12);
        ctx.stroke();
      } else if (role === "nurse" && job === "nursing") {
        ctx.strokeStyle = "rgba(255, 226, 163, 0.38)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-size * 1.1, 0, size * 0.95, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 241, 195, 0.7)";
        for (let i = 0; i < 3; i++) {
          const a = performance.now() / 420 + i * (Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.arc(-size * 1.15 + Math.cos(a) * 7, Math.sin(a) * 4, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (role === "middenworker" && (job === "cleaning_midden" || job === "healing_midden" || job === "waiting_midden" || job === "fussing_player")) {
        ctx.strokeStyle = "rgba(162, 230, 142, 0.32)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-size * 1.08, 0, size * 0.92, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(182, 242, 172, 0.68)";
        for (let i = 0; i < 4; i++) {
          const a = performance.now() / 360 + i * (Math.PI / 2);
          ctx.beginPath();
          ctx.arc(-size * 1.12 + Math.cos(a) * 6, Math.sin(a) * 4, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (job === "resting") {
        ctx.save();
        ctx.rotate(-angle - Math.PI);
        ctx.translate(0, -size * 1.35);
        ctx.fillStyle = "rgba(255, 241, 204, 0.72)";
        ctx.font = "800 12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("zzz", Math.sin(performance.now() / 800 + x * 0.02) * 3, 0);
        ctx.restore();
      }
      if (sick) {
        ctx.fillStyle = "rgba(120, 200, 98, 0.28)";
        ctx.beginPath(); ctx.ellipse(-size * 0.85, 0, size * 0.58, size * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, size * 0.62, size * 0.54, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(size * 0.92, 0, size * 0.74, size * 0.57, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (carrying === "dead") drawDeadAnt(-size * 1.8, 0, size * 0.58);
      else if (carrying === "sick") { ctx.fillStyle = "rgba(121, 201, 102, 0.78)"; ctx.beginPath(); ctx.ellipse(-size * 1.8, 0, size * 0.55, size * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(43, 82, 31, 0.5)"; ctx.lineWidth = 2; ctx.stroke(); }
      else if (carrying === "egg") { ctx.fillStyle = "#f7dfaa"; ctx.beginPath(); ctx.ellipse(-size * 1.8, 0, size * 0.5, size * 0.72, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (carrying) { ctx.fillStyle = "#e5b45d"; ctx.beginPath(); ctx.ellipse(-size * 1.8, 0, size * 0.55, size * 0.42, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }

    function drawQueen(x, y, scale) {
      const sway = Math.sin(performance.now() / 1200 + queen.swayPhase) * 0.03;
      const bob = Math.sin(performance.now() / 550 + queen.swayPhase) * 2.2 + queen.feedPulse * 1.4 + queen.layPulse * 2.1;
      const pulse = 1 + Math.sin(performance.now() / 240 + queen.swayPhase) * 0.02 + queen.feedPulse * 0.05 + queen.layPulse * 0.07;
      ctx.save(); ctx.translate(x, y + bob); ctx.scale(scale * pulse, scale * pulse); ctx.rotate(sway);
      ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(10, 38, 78, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8f522f"; ctx.beginPath(); ctx.ellipse(38, 0, 60, 39, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#b46b39"; ctx.beginPath(); ctx.ellipse(-16, 0, 42, 32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d89958"; ctx.beginPath(); ctx.ellipse(-58, 0, 30, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(40, 18, 10, 0.42)"; ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        const phase = performance.now() / 640 + i * 0.8 + queen.swayPhase * 0.6;
        ctx.beginPath();
        ctx.moveTo(-44, i * 16);
        ctx.lineTo(-76 - Math.sin(phase) * 10, i * 16 + Math.cos(phase) * 8);
        ctx.stroke();
      }
      ctx.fillStyle = "#1b0d08"; ctx.beginPath(); ctx.arc(-72, -7, 4, 0, Math.PI * 2); ctx.arc(-72, 7, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255, 235, 176, 0.12)";
      ctx.beginPath();
      ctx.ellipse(-6, 0, 28 + queen.feedPulse * 4, 18 + queen.layPulse * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawRain() {
      if (!isOutdoorRoom(player.roomId)) return;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = "#9fc7da";
      ctx.lineWidth = 2;
      for (let i = 0; i < 130; i++) {
        const x = (i * 67 + Math.floor(performance.now() * 0.42)) % (screenW + 120) - 60;
        const y = (i * 41 + Math.floor(performance.now() * 1.18)) % (screenH + 120) - 60;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 12, y + 24);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(80, 110, 132, 0.08)";
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();
    }
