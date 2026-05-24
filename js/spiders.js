    function updateSpiders(delta) {
      for (const spider of spiders) {
        if (!spider.alive) {
          spider.respawnTimer -= delta;
          if (spider.respawnTimer <= 0) respawnSpider(spider);
          continue;
        }
        if (spider.roomId !== player.roomId) continue;
        const dToPlayer = distance(spider, player);
        const aggroRange = 260;
        const giveUpRange = 430;
        const soldierTarget = getSpiderSoldierTarget(spider);
        let targetAngle;
        if (spider.soldierFocusTimer > 0) spider.soldierFocusTimer -= delta;
        if (soldierTarget) {
          spider.aggro = true;
          spider.targetMode = "soldier";
          spider.targetAntId = soldierTarget.id;
        } else if (dToPlayer < aggroRange && spider.targetMode !== "soldier") {
          spider.aggro = true;
        }
        if (spider.targetMode === "soldier" && spider.soldierFocusTimer <= 0 && !soldierTarget) {
          spider.targetMode = null;
          spider.targetAntId = null;
        }
        if (dToPlayer > giveUpRange && spider.targetMode !== "soldier") spider.aggro = false;
        if (spider.aggro && spider.targetMode === "soldier" && soldierTarget) {
          targetAngle = Math.atan2(soldierTarget.y - spider.y, soldierTarget.x - spider.x);
          spider.angle = targetAngle;
          spider.x += Math.cos(targetAngle) * spider.speed * 1.25 * delta;
          spider.y += Math.sin(targetAngle) * spider.speed * 1.25 * delta;
        } else if (spider.aggro) {
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
        resolveOverworldObstructions(spider);
        const targetSoldier = soldierTarget || getSpiderSoldierTarget(spider);
        if (targetSoldier && distance(spider, targetSoldier) < spider.radius + targetSoldier.radius) {
          spider.aggro = true;
          spider.targetMode = "soldier";
          spider.targetAntId = targetSoldier.id;
        }
        if (distance(spider, player) < spider.radius + player.radius && player.invulnerable <= 0) {
          player.health -= 1;
          player.invulnerable = 1.2;
          objectiveText.textContent = "Ouch! Avoid the goofy spiders or run back to the nest.";
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
      objectiveText.textContent = "Soldiers cleared a spider. The area is safer for now.";
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

    function drawSpiders() {
      for (const spider of spiders) {
        const walk = performance.now() / 155 + spider.x * 0.02 + spider.y * 0.02;
        if (!spider.alive || spider.roomId !== player.roomId) continue;
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
