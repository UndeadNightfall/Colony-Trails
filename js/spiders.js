    function updateSpiders(delta) {
      for (const spider of spiders) {
        if (!spider.alive) {
          spider.respawnTimer -= delta;
          if (spider.respawnTimer <= 0) respawnSpider(spider);
          continue;
        }
        const oldX = spider.x;
        const oldY = spider.y;
        const sameRoomAsPlayer = spider.roomId === player.roomId;
        const playerProtected = sameRoomAsPlayer && typeof isOnSafeTrail === "function" && isOnSafeTrail(player, player.radius);
        const dToPlayer = sameRoomAsPlayer ? distance(spider, player) : Infinity;
        const aggroRange = 260;
        const giveUpRange = 430;
        const soldierTarget = getSpiderSoldierTarget(spider);
        const workerTarget = soldierTarget ? null : getSpiderWorkerTarget(spider, aggroRange);
        let targetAngle;
        if (spider.soldierFocusTimer > 0) spider.soldierFocusTimer -= delta;
        if (soldierTarget) {
          spider.aggro = true;
          spider.targetMode = "soldier";
          spider.targetAntId = soldierTarget.id;
        } else if (workerTarget) {
          spider.aggro = true;
          spider.targetMode = "worker";
          spider.targetAntId = workerTarget.id;
          markWorkerThreatenedBySpider(workerTarget, spider);
        } else if (!playerProtected && dToPlayer < aggroRange && spider.targetMode !== "soldier") {
          spider.aggro = true;
        }
        if ((spider.targetMode === "soldier" && spider.soldierFocusTimer <= 0 && !soldierTarget) || (spider.targetMode === "worker" && !workerTarget)) {
          spider.targetMode = null;
          spider.targetAntId = null;
        }
        if (dToPlayer > giveUpRange && spider.targetMode !== "soldier") spider.aggro = false;
        if (spider.aggro && spider.targetMode === "soldier" && soldierTarget) {
          targetAngle = Math.atan2(soldierTarget.y - spider.y, soldierTarget.x - spider.x);
          spider.angle = targetAngle;
          spider.x += Math.cos(targetAngle) * spider.speed * 1.25 * delta;
          spider.y += Math.sin(targetAngle) * spider.speed * 1.25 * delta;
        } else if (spider.aggro && spider.targetMode === "worker" && workerTarget) {
          targetAngle = Math.atan2(workerTarget.y - spider.y, workerTarget.x - spider.x);
          spider.angle = targetAngle;
          spider.x += Math.cos(targetAngle) * spider.speed * 1.16 * delta;
          spider.y += Math.sin(targetAngle) * spider.speed * 1.16 * delta;
        } else if (spider.aggro && sameRoomAsPlayer && !playerProtected) {
          targetAngle = Math.atan2(player.y - spider.y, player.x - spider.x);
          spider.angle = targetAngle;
          spider.x += Math.cos(targetAngle) * spider.speed * 1.25 * delta;
          spider.y += Math.sin(targetAngle) * spider.speed * 1.25 * delta;
        } else {
          const homeAngle = Math.atan2(spider.homeY - spider.y, spider.homeX - spider.x);
          const homeDistance = Math.hypot(spider.x - spider.homeX, spider.y - spider.homeY);
          if (homeDistance > 120) spider.angle = homeAngle;
          else spider.angle += Math.sin(performance.now() / 900 + spider.homeX) * 0.018;
          spider.x += Math.cos(spider.angle) * spider.speed * 0.62 * delta;
          spider.y += Math.sin(spider.angle) * spider.speed * 0.62 * delta;
        }
        if (preventSpiderTrailCrossing(spider, oldX, oldY)) {
          spider.x = oldX;
          spider.y = oldY;
          spider.angle += Math.PI * 0.85;
        }
        if (typeof keepSpiderOffSafeTrails === "function") keepSpiderOffSafeTrails(spider);
        resolveOverworldObstructions(spider);
        const targetSoldier = soldierTarget || getSpiderSoldierTarget(spider);
        if (targetSoldier && distance(spider, targetSoldier) < spider.radius + targetSoldier.radius) {
          spider.aggro = true;
          spider.targetMode = "soldier";
          spider.targetAntId = targetSoldier.id;
        }
        const contactedWorker = getSpiderWorkerTarget(spider, spider.radius + 20);
        if (contactedWorker) markWorkerThreatenedBySpider(contactedWorker, spider);
        if (sameRoomAsPlayer && !playerProtected && distance(spider, player) < spider.radius + player.radius && player.invulnerable <= 0) {
          player.health -= 1;
          player.invulnerable = 1.2;
          objectiveText.textContent = `Ouch! Avoid the ${getEnemyLabel(spider)} or run back to the nest.`;
          const knockback = Math.atan2(player.y - spider.y, player.x - spider.x);
          player.x += Math.cos(knockback) * 48;
          player.y += Math.sin(knockback) * 48;
          if (player.health <= 0) resetAfterFaint();
        }
      }
    }

    function killSpider(spider) {
      spider.alive = false;
      spider.aggro = false;
      spider.targetMode = null;
      spider.targetAntId = null;
      spider.soldierFocusTimer = 0;
      spider.respawnTimer = randomBetween(28, 46);
      if (defenseCall.targetSpiderId === spider.id) resetDefenseCall();
      objectiveText.textContent = `Soldiers cleared a ${getEnemyLabel(spider)}. The area is safer for now.`;
    }

    function respawnSpider(spider) {
      spider.alive = true;
      spider.x = spider.homeX;
      spider.y = spider.homeY;
      spider.angle = randomBetween(0, Math.PI * 2);
      spider.aggro = false;
      spider.targetMode = null;
      spider.targetAntId = null;
      spider.soldierFocusTimer = 0;
    }

    function getEnemyLabel(enemy) {
      if (enemy?.kind === "frog") return "frog";
      return "spider";
    }

    function normalizeEnemyState(enemy) {
      if (!enemy) return;
      if (enemy.id === 3 && enemy.roomId === "garden") enemy.kind = "frog";
      if (enemy.kind === "frog") {
        enemy.canEnterPuddles = true;
        enemy.radius = enemy.radius || 30;
        enemy.speed = enemy.speed || 56;
        if (typeof enemy.homeX !== "number") enemy.homeX = 1015;
        if (typeof enemy.homeY !== "number") enemy.homeY = 365;
      }
    }

    function getSpiderSoldierTarget(spider) {
      if (spider.targetMode !== "soldier" && spider.soldierFocusTimer <= 0) return null;
      if (spider.targetAntId) {
        for (const ant of helpers) {
          if (ant.dead || ant.role !== "soldier" || ant.roomId !== spider.roomId) continue;
          if (ant.id === spider.targetAntId) return ant;
        }
      }
      return findNearestSoldierForSpider(spider, 220);
    }

    function getSpiderWorkerTarget(spider, range) {
      let nearest = null;
      let nearestDistance = range;
      if (spider.targetMode === "worker" && spider.targetAntId) {
        for (const ant of helpers) {
          if (ant.dead || ant.role !== "worker" || ant.roomId !== spider.roomId || ant.carriedBy) continue;
          if (ant.id !== spider.targetAntId || typeof isOnSafeTrail === "function" && isOnSafeTrail(ant, ant.radius)) continue;
          return ant;
        }
      }
      for (const ant of helpers) {
        if (ant.dead || ant.role !== "worker" || ant.roomId !== spider.roomId || ant.carriedBy) continue;
        if (typeof isOnSafeTrail === "function" && isOnSafeTrail(ant, ant.radius)) continue;
        const d = distance(spider, ant);
        if (d < nearestDistance) {
          nearest = ant;
          nearestDistance = d;
        }
      }
      return nearest;
    }

    function preventSpiderTrailCrossing(spider, oldX, oldY) {
      if (!isOutdoorRoom(spider.roomId) || typeof getNearestSafeTrailPoint !== "function") return false;
      const before = getNearestSafeTrailPoint(spider.roomId, oldX, oldY);
      const after = getNearestSafeTrailPoint(spider.roomId, spider.x, spider.y);
      if (!before || !after) return false;
      const limit = getSafeTrailRadius() + spider.radius + 18;
      return before.distance > limit && after.distance <= limit;
    }

    function drawSpiders() {
      for (const spider of spiders) {
        const walk = performance.now() / 155 + spider.x * 0.02 + spider.y * 0.02;
        if (!spider.alive || spider.roomId !== player.roomId) continue;
        if (spider.kind === "frog") {
          drawFrog(spider, walk);
          continue;
        }
        ctx.save(); ctx.translate(spider.x, spider.y); ctx.rotate(spider.angle + Math.PI);
        ctx.fillStyle = "rgba(0,0,0,0.23)"; ctx.beginPath(); ctx.ellipse(0, 20, 34, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#2a1a14"; ctx.lineWidth = 4;
        for (let i = -1; i <= 1; i++) {
          const phase = walk + i * 1.25;
          const topSwing = Math.sin(phase) * 8;
          const bottomSwing = Math.sin(phase + Math.PI) * 8;
          ctx.beginPath();
          ctx.moveTo(i * 10, -6);
          ctx.lineTo(i * 22 - 24 + topSwing, -24 - Math.abs(topSwing) * 0.35);
          ctx.moveTo(i * 10, 6);
          ctx.lineTo(i * 22 - 24 + bottomSwing, 24 + Math.abs(bottomSwing) * 0.35);
          ctx.stroke();
        }
        ctx.fillStyle = "#4a2a22"; ctx.beginPath(); ctx.ellipse(8, 0, 25, 21, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#6d3d31"; ctx.beginPath(); ctx.ellipse(-18, 0, 19, 17, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff1c4"; ctx.beginPath(); ctx.arc(-27, -6, 3, 0, Math.PI * 2); ctx.arc(-27, 6, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    function drawFrog(frog, walk) {
      const crouch = Math.sin(walk * 0.8) * 2.5;
      ctx.save();
      ctx.translate(frog.x, frog.y + crouch);
      ctx.rotate(frog.angle + Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(0, 22, 38, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4f8b45";
      ctx.beginPath();
      ctx.ellipse(8, 0, 34, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#69a85c";
      ctx.beginPath();
      ctx.ellipse(-22, 0, 24, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d9f0bf";
      ctx.beginPath();
      ctx.ellipse(12, 8, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2f5f31";
      for (const y of [-16, 16]) {
        ctx.beginPath();
        ctx.ellipse(4, y, 24, 8, y < 0 ? -0.48 : 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(34, y * 0.82, 22, 7, y < 0 ? 0.42 : -0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f6ffd9";
      ctx.beginPath();
      ctx.arc(-34, -8, 5, 0, Math.PI * 2);
      ctx.arc(-34, 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#171c12";
      ctx.beginPath();
      ctx.arc(-36, -8, 2.1, 0, Math.PI * 2);
      ctx.arc(-36, 8, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(32, 74, 36, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-29, 0, 12, -0.65, 0.65);
      ctx.stroke();
      ctx.restore();
    }
