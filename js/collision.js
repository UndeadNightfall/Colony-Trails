    function resolveOverworldObstructions(entity) {
      if (!isOutdoorRoom(entity.roomId)) return;
      for (const item of obstructions) {
        if (item.roomId !== entity.roomId) continue;
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

    function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function randomBetween(min, max) { return min + Math.random() * (max - min); }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
