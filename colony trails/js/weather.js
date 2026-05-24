    var rainSound = new Audio("Rain sound.mp3");
    rainSound.loop = true;
    rainSound.preload = "metadata";
    rainSound.volume = soundVolumes.rain;

    function playRainSound() {
      if (!weather.active) return Promise.resolve(false);
      if (!rainSound.paused) return Promise.resolve(true);
      rainSound.currentTime = rainSound.currentTime || 0;
      return rainSound.play().catch(() => false);
    }

    function pauseRainSound() {
      rainSound.pause();
    }

    function stopRainSound() {
      rainSound.pause();
      rainSound.currentTime = 0;
    }

    function updateWeather(delta) {
      if (!weather.active) {
        if (weather.cleanupPriority && deadAnts.length === 0) {
          weather.cleanupPriority = false;
          objectiveText.textContent = "The colony cleared the dead bodies left by the storm.";
        }
        weather.nextStorm -= delta;
        if (weather.nextStorm > 0) return;
        startRainStorm();
        return;
      }

      weather.timeLeft -= delta;
      if (weather.timeLeft <= 0) {
        endRainStorm();
        return;
      }

      if (!isOutdoorRoom(player.roomId)) weather.exposureSeconds = 0;
      else handleRainExposure(player, delta, true);

      for (const ant of helpers) {
        if (ant.dead) continue;
        if (!isOutdoorRoom(ant.roomId)) {
          ant.rainExposure = 0;
          continue;
        }
        handleRainExposure(ant, delta, false);
      }
    }

    function startRainStorm() {
      weather.active = true;
      weather.timeLeft = 20 + Math.random() * 15;
      weather.exposureSeconds = 0;
      weather.killCount = 0;
      playRainSound();
      objectiveText.textContent = "Rain has started. Return to the nest and stay dry until it passes.";
    }

    function endRainStorm() {
      weather.active = false;
      weather.nextStorm = 300 + Math.random() * 120;
      weather.cleanupPriority = weather.killCount > 0;
      weather.exposureSeconds = 0;
      stopRainSound();
      objectiveText.textContent = weather.cleanupPriority
        ? "The rain passed. Workers are prioritizing dead bodies left outside."
        : "The rain passed. The colony can forage again.";
    }

    function handleRainExposure(entity, delta, isPlayer) {
      if (!weather.active || !isOutdoorRoom(entity.roomId)) {
        entity.rainExposure = 0;
        return;
      }
      if (typeof entity.health !== "number") entity.health = 3;
      entity.rainExposure = (entity.rainExposure || 0) + delta;
      while (entity.rainExposure >= 10) {
        entity.rainExposure -= 10;
        entity.health -= 1;
        if (isPlayer) {
          player.health = entity.health;
          objectiveText.textContent = player.health > 0
            ? "Rain is wearing you down. Get back to the nest."
            : "The rain took you down. Another ant takes your place.";
        }
        if (entity.health > 0) continue;
        weather.killCount += 1;
        entity.rainExposure = 0;
        if (isPlayer) resetAfterFaint();
        else killAnt(entity, null);
        break;
      }
    }
