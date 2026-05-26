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
        if (spider.kind === "frog") {
          updateFrogMovement(spider, delta);
        } else if (spider.aggro && spider.targetMode === "soldier" && soldierTarget) {
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
        if (spider.kind !== "frog" && preventSpiderTrailCrossing(spider, oldX, oldY)) {
          spider.x = oldX;
          spider.y = oldY;
          spider.angle += Math.PI * 0.85;
        }
        if (spider.kind !== "frog") {
          if (typeof keepSpiderOffSafeTrails === "function") keepSpiderOffSafeTrails(spider);
          resolveOverworldObstructions(spider);
        }
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
        if (!["idle", "crouching", "leaping", "landing"].includes(enemy.jumpState)) enemy.jumpState = "idle";
        if (typeof enemy.jumpTimer !== "number") enemy.jumpTimer = randomBetween(1.8, 3.2);
        if (typeof enemy.jumpElapsed !== "number") enemy.jumpElapsed = 0;
        if (typeof enemy.jumpDuration !== "number") enemy.jumpDuration = 0.3;
        if (typeof enemy.jumpStartX !== "number") enemy.jumpStartX = enemy.x;
        if (typeof enemy.jumpStartY !== "number") enemy.jumpStartY = enemy.y;
        if (typeof enemy.jumpTargetX !== "number") enemy.jumpTargetX = enemy.x;
        if (typeof enemy.jumpTargetY !== "number") enemy.jumpTargetY = enemy.y;
      }
    }

    function updateFrogMovement(frog, delta) {
      normalizeEnemyState(frog);
      if (frog.roomId !== "garden") return;
      if (frog.jumpState === "idle") {
        frog.jumpTimer -= delta;
        if (frog.jumpTimer <= 0) {
          frog.jumpState = "crouching";
          frog.jumpTimer = 0.25;
        }
        return;
      }
      if (frog.jumpState === "crouching") {
        frog.jumpTimer -= delta;
        if (frog.jumpTimer <= 0) {
          startFrogLeap(frog);
        }
        return;
      }
      if (frog.jumpState === "leaping") {
        frog.jumpElapsed = Math.min(frog.jumpDuration, frog.jumpElapsed + delta);
        const t = frog.jumpDuration > 0 ? frog.jumpElapsed / frog.jumpDuration : 1;
        frog.x = frog.jumpStartX + (frog.jumpTargetX - frog.jumpStartX) * t;
        frog.y = frog.jumpStartY + (frog.jumpTargetY - frog.jumpStartY) * t;
        if (t >= 1) {
          frog.x = frog.jumpTargetX;
          frog.y = frog.jumpTargetY;
          frog.jumpState = "landing";
          frog.jumpTimer = 0.5;
        }
        return;
      }
      if (frog.jumpState === "landing") {
        frog.jumpTimer -= delta;
        if (frog.jumpTimer <= 0) {
          frog.jumpState = "idle";
          frog.jumpTimer = randomBetween(1.8, 3.2);
          frog.jumpStartX = frog.x;
          frog.jumpStartY = frog.y;
          frog.jumpTargetX = frog.x;
          frog.jumpTargetY = frog.y;
        }
      }
    }

    function startFrogLeap(frog) {
      const jumpAngle = randomBetween(0, Math.PI * 2);
      const jumpDistance = randomBetween(60, 150);
      const margin = 30;
      frog.jumpStartX = frog.x;
      frog.jumpStartY = frog.y;
      frog.jumpTargetX = clamp(frog.x + Math.cos(jumpAngle) * jumpDistance, margin, rooms.garden.width - margin);
      frog.jumpTargetY = clamp(frog.y + Math.sin(jumpAngle) * jumpDistance, margin, rooms.garden.height - margin);
      frog.jumpElapsed = 0;
      frog.jumpDuration = 0.3;
      frog.jumpTimer = 0.3;
      frog.jumpState = "leaping";
      frog.angle = Math.atan2(frog.jumpTargetY - frog.jumpStartY, frog.jumpTargetX - frog.jumpStartX);
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
      const leaping = frog.jumpState === "leaping";
      const crouching = frog.jumpState === "crouching";
      const landing = frog.jumpState === "landing";
      const leapT = leaping && frog.jumpDuration > 0 ? frog.jumpElapsed / frog.jumpDuration : 0;
      const lift = leaping ? Math.sin(leapT * Math.PI) * 9 : 0;
      const squash = crouching ? 1 : landing ? 0.55 : 0;
      const legSpread = crouching ? 0.65 : leaping ? 1.22 : 1;
      ctx.save();
      ctx.translate(frog.x, frog.y - lift + squash * 2);
      ctx.rotate(frog.angle + Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(4, 24 + lift * 0.45, 36, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#315f2f";
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(13, side * 24 * legSpread, 18, 8, side * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(31, side * 28 * legSpread, 16, 6, side * -0.18, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#4f8c45";
      ctx.beginPath();
      ctx.ellipse(8, 0, 31, 23 - squash * 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#6ea660";
      ctx.beginPath();
      ctx.ellipse(-20, 0, 26, 18 - squash * 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#d8e8b7";
      ctx.beginPath();
      ctx.ellipse(5, 8, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#355f2f";
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(-6, side * 17, 14, 5.5, side * -0.28, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#e9f4cf";
      ctx.beginPath();
      ctx.arc(-35, -10, 7, 0, Math.PI * 2);
      ctx.arc(-35, 10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1b2114";
      ctx.beginPath();
      ctx.arc(-37, -10, 3.1, 0, Math.PI * 2);
      ctx.arc(-37, 10, 3.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(36, 74, 35, 0.72)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-29, 0, 11, -0.55, 0.55);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,230,0.26)";
      ctx.beginPath();
      ctx.ellipse(-5, -8, 18, 5, -0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.beginPath();
      ctx.arc(-39, -12, 1.5, 0, Math.PI * 2);
      ctx.arc(-39, 8, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
