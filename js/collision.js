    function resolveOverworldObstructions(entity) {
      if (!isOutdoorRoom(entity.roomId)) return;
      for (const item of obstructions) {
        if (item.roomId !== entity.roomId) continue;
        if (item.solid === false || item.name === "fallen rake") continue;
        if (item.type === "circle") resolveCircleAgainstCircle(entity, item);
        else resolveCircleAgainstRect(entity, item);
      }
      entity.x = clamp(entity.x, 30, rooms[entity.roomId].width - 30);
      entity.y = clamp(entity.y, 30, rooms[entity.roomId].height - 30);
    }
    function resolveCircleAgainstCircle(entity, item) {
      const dx = entity.x - item.x;
      const dy = entity.y - item.y;
      const minDistance = entity.radius + item.radius;
      const d = Math.hypot(dx, dy);
      if (d <= 0 || d >= minDistance) return;
      entity.x += (dx / d) * (minDistance - d);
      entity.y += (dy / d) * (minDistance - d);
    }

    function resolveCircleAgainstRect(entity, item) {
      if (entity.x > item.x && entity.x < item.x + item.width && entity.y > item.y && entity.y < item.y + item.height) {
        const left = entity.x - item.x;
        const right = item.x + item.width - entity.x;
        const top = entity.y - item.y;
        const bottom = item.y + item.height - entity.y;
        const min = Math.min(left, right, top, bottom);
        if (min === left) entity.x = item.x - entity.radius;
        else if (min === right) entity.x = item.x + item.width + entity.radius;
        else if (min === top) entity.y = item.y - entity.radius;
        else entity.y = item.y + item.height + entity.radius;
        return;
      }
      const nearestX = clamp(entity.x, item.x, item.x + item.width);
      const nearestY = clamp(entity.y, item.y, item.y + item.height);
      let dx = entity.x - nearestX;
      let dy = entity.y - nearestY;
      let d = Math.hypot(dx, dy);
      if (d >= entity.radius) return;
      if (d === 0) {
        const left = Math.abs(entity.x - item.x);
        const right = Math.abs(item.x + item.width - entity.x);
        const top = Math.abs(entity.y - item.y);
        const bottom = Math.abs(item.y + item.height - entity.y);
        const min = Math.min(left, right, top, bottom);
        if (min === left) { dx = -1; dy = 0; d = left; }
        else if (min === right) { dx = 1; dy = 0; d = right; }
        else if (min === top) { dx = 0; dy = -1; d = top; }
        else { dx = 0; dy = 1; d = bottom; }
      }
      const push = entity.radius - d;
      const length = Math.max(1, Math.hypot(dx, dy));
      entity.x += (dx / length) * push;
      entity.y += (dy / length) * push;
    }

    function roundRect(x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    }

    function getRoomExits(roomId) {
      return Object.values(exits).filter(exit => exit.roomId === roomId);
    }

    function getRandomRoomExit(roomId) {
      const options = getRoomExits(roomId);
      return options[Math.floor(Math.random() * options.length)];
    }

    function getHomewardExit(roomId) {
      if (roomId === "nest") return null;
      if (roomId === "patio") return exits.patioToOverworld;
      if (roomId === "house") return exits.houseToPatio;
      if (roomId === "sandpit") return exits.sandpitToOverworld;
      if (roomId === "garden") return exits.gardenToOverworld;
      return exits.overworldToNest;
    }

    function pointTowardExit(entity, exit) {
      if (!exit) return;
      entity.angle = Math.atan2(exit.y - entity.y, exit.x - entity.x);
    }

    function isOutdoorRoom(roomId) {
      return roomId !== "nest" && roomId !== "house";
    }

    function getSafeTrailRoutes(roomId) {
      if (roomId === "overworld") {
        return [
          [{ x: 115, y: 590 }, { x: 420, y: 590 }, { x: 700, y: 730 }, { x: 940, y: 1100 }],
          [{ x: 700, y: 730 }, { x: 520, y: 880 }, { x: 280, y: 1080 }],
          [{ x: 700, y: 730 }, { x: 1040, y: 560 }, { x: 1370, y: 390 }, { x: 1720, y: 270 }]
        ];
      }
      if (roomId === "patio") return [[{ x: 70, y: 470 }, { x: 390, y: 470 }, { x: 820, y: 470 }, { x: 1120, y: 470 }, { x: 1410, y: 470 }]];
      if (roomId === "sandpit") return [[{ x: 675, y: 58 }, { x: 675, y: 240 }, { x: 675, y: 470 }, { x: 675, y: 720 }]];
      if (roomId === "garden") return [[{ x: 725, y: 55 }, { x: 725, y: 260 }, { x: 560, y: 470 }, { x: 700, y: 680 }, { x: 1030, y: 760 }]];
      return [];
    }

    function getSafeTrailRadius() {
      return 76;
    }

    function getWorkerTrailForageRadius() {
      return 360;
    }

    function getNearestSafeTrailPoint(roomId, x, y) {
      let nearest = null;
      let nearestDistance = Infinity;
      for (const route of getSafeTrailRoutes(roomId)) {
        for (let i = 0; i < route.length - 1; i++) {
          const point = getNearestPointOnSegment(x, y, route[i], route[i + 1]);
          const d = Math.hypot(x - point.x, y - point.y);
          if (d < nearestDistance) {
            nearest = point;
            nearestDistance = d;
          }
        }
      }
      return nearest ? { x: nearest.x, y: nearest.y, distance: nearestDistance } : null;
    }

    function getNearestPointOnSegment(x, y, a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq === 0 ? 0 : clamp(((x - a.x) * dx + (y - a.y) * dy) / lengthSq, 0, 1);
      return { x: a.x + dx * t, y: a.y + dy * t };
    }

    function isOnSafeTrail(entity, extraRadius = 0) {
      if (!isOutdoorRoom(entity.roomId)) return false;
      const nearest = getNearestSafeTrailPoint(entity.roomId, entity.x, entity.y);
      return !!nearest && nearest.distance <= getSafeTrailRadius() + extraRadius;
    }

    function getSafeTrailNavigationNodes(roomId) {
      const cache = getSafeTrailNavigationNodes.cache || (getSafeTrailNavigationNodes.cache = {});
      if (cache[roomId]) return cache[roomId];
      const nodes = [];
      function addNode(point) {
        let index = nodes.findIndex(node => Math.hypot(node.x - point.x, node.y - point.y) < 4);
        if (index < 0) {
          index = nodes.length;
          nodes.push({ x: point.x, y: point.y, links: [] });
        }
        return index;
      }
      for (const route of getSafeTrailRoutes(roomId)) {
        for (let i = 0; i < route.length; i++) {
          const current = addNode(route[i]);
          if (i === 0) continue;
          const previous = addNode(route[i - 1]);
          if (!nodes[current].links.includes(previous)) nodes[current].links.push(previous);
          if (!nodes[previous].links.includes(current)) nodes[previous].links.push(current);
        }
      }
      cache[roomId] = nodes;
      return nodes;
    }

    function getNextSafeTrailWaypoint(entity, target) {
      if (!isOutdoorRoom(entity.roomId) || !target) return target;
      const entityTrail = getNearestSafeTrailPoint(entity.roomId, entity.x, entity.y);
      const targetTrail = getNearestSafeTrailPoint(entity.roomId, target.x, target.y);
      if (!entityTrail || !targetTrail) return target;
      if (entityTrail.distance > getSafeTrailRadius() + 28) return entityTrail;
      if (targetTrail.distance > getSafeTrailRadius() + getWorkerTrailForageRadius() && distance(entity, target) > 120) return entityTrail;
      if (targetTrail.distance > getSafeTrailRadius() && Math.hypot(entity.x - targetTrail.x, entity.y - targetTrail.y) < 36) return target;
      const nodes = getSafeTrailNavigationNodes(entity.roomId);
      const start = findNearestTrailNode(entityTrail, nodes);
      const goal = findNearestTrailNode(targetTrail, nodes);
      if (start < 0 || goal < 0) return targetTrail;
      const path = findTrailNodePath(nodes, start, goal);
      if (path.length < 2) return targetTrail.distance <= getSafeTrailRadius() + 18 ? target : targetTrail;
      const waypoint = nodes[path[1]];
      if (Math.hypot(entity.x - waypoint.x, entity.y - waypoint.y) < 28 && path.length > 2) return nodes[path[2]];
      return waypoint;
    }

    function findNearestTrailNode(point, nodes) {
      let best = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const d = Math.hypot(point.x - nodes[i].x, point.y - nodes[i].y);
        if (d < bestDistance) {
          best = i;
          bestDistance = d;
        }
      }
      return best;
    }

    function findTrailNodePath(nodes, start, goal) {
      const queue = [start];
      const previous = new Array(nodes.length).fill(-1);
      previous[start] = start;
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor];
        if (current === goal) break;
        for (const next of nodes[current].links) {
          if (previous[next] !== -1) continue;
          previous[next] = current;
          queue.push(next);
        }
      }
      if (previous[goal] === -1) return [];
      const path = [];
      for (let at = goal; at !== start; at = previous[at]) path.push(at);
      path.push(start);
      return path.reverse();
    }

    function getTrailRoamPoint(entity) {
      const nodes = getSafeTrailNavigationNodes(entity.roomId);
      if (nodes.length === 0) return null;
      const homeExit = getHomewardExit(entity.roomId);
      const homePoint = homeExit ? { x: homeExit.toX, y: homeExit.toY } : null;
      const ranked = nodes.slice().sort((a, b) => {
        const aDistance = homePoint ? Math.hypot(a.x - homePoint.x, a.y - homePoint.y) : 0;
        const bDistance = homePoint ? Math.hypot(b.x - homePoint.x, b.y - homePoint.y) : 0;
        return bDistance - aDistance;
      });
      const spread = Math.max(1, Math.min(4, ranked.length));
      const index = Math.abs(Math.floor((entity.id || 0) * 7 + performance.now() / 2400)) % spread;
      return ranked[index];
    }

    function getTrailPatrolPoint(ant) {
      const nodes = getSafeTrailNavigationNodes(ant.roomId);
      if (nodes.length === 0) return null;
      const soldiers = helpers.filter(helper => !helper.dead && helper.role === "soldier" && helper.roomId === ant.roomId);
      const order = Math.max(0, soldiers.findIndex(helper => helper.id === ant.id));
      const node = nodes[(order * 2 + Math.floor(performance.now() / 4200)) % nodes.length];
      const next = nodes[(order * 2 + Math.floor(performance.now() / 4200) + 1) % nodes.length] || node;
      const angle = Math.atan2(next.y - node.y, next.x - node.x) + Math.PI / 2;
      const side = order % 2 === 0 ? 1 : -1;
      return {
        x: node.x + Math.cos(angle) * getSafeTrailRadius() * 1.35 * side,
        y: node.y + Math.sin(angle) * getSafeTrailRadius() * 1.35 * side
      };
    }

    function keepSpiderOffSafeTrails(spider) {
      if (!isOutdoorRoom(spider.roomId)) return;
      const nearest = getNearestSafeTrailPoint(spider.roomId, spider.x, spider.y);
      if (!nearest) return;
      const minDistance = getSafeTrailRadius() + spider.radius + 18;
      if (nearest.distance >= minDistance) return;
      const angle = Math.atan2(spider.y - nearest.y, spider.x - nearest.x) || spider.angle || 0;
      const push = minDistance - nearest.distance;
      spider.x += Math.cos(angle) * push;
      spider.y += Math.sin(angle) * push;
    }

    function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function randomBetween(min, max) { return min + Math.random() * (max - min); }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
