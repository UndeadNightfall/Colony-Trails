    const SAVE_KEY = "colonyTrailsSaveV1";

    function createSaveData() {
      return {
        version: 1,
        savedAt: Date.now(),
        world: { roomId: player.roomId },
        player: { ...player },
        colony: JSON.parse(JSON.stringify(colony)),
        nest: { radius: nest.radius },
        foodSpawn: JSON.parse(JSON.stringify(foodSpawn)),
        crumbs: crumbs.map(crumb => ({ ...crumb })),
        helpers: helpers.filter(ant => !ant.dead).map(ant => ({
          ...ant,
          targetCrumb: null,
          targetSpider: null,
          targetCorpse: null,
          restTarget: ant.restTarget ? { ...ant.restTarget } : null
        })),
        spiders: spiders.map(spider => ({ ...spider })),
        deadAnts: deadAnts.map(corpse => ({ ...corpse }))
      };
    }

    function saveGame(showMessage = true) {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(createSaveData()));
        if (showMessage) objectiveText.textContent = "Game saved.";
        return true;
      } catch (error) {
        objectiveText.textContent = "Save failed. Storage may be blocked.";
        return false;
      }
    }

    function hasSaveGame() {
      return !!localStorage.getItem(SAVE_KEY);
    }

    function loadGame() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
          objectiveText.textContent = "No saved game found.";
          return false;
        }
        const data = JSON.parse(raw);
        if (!data || data.version !== 1) {
          objectiveText.textContent = "Save file is not compatible.";
          return false;
        }
        applySaveData(data);
        objectiveText.textContent = "Game loaded.";
        return true;
      } catch (error) {
        objectiveText.textContent = "Load failed. Save data may be damaged.";
        return false;
      }
    }

    function applySaveData(data) {
      Object.assign(player, data.player);
      Object.assign(colony, data.colony);
      Object.assign(foodSpawn, data.foodSpawn || foodSpawn);
      nest.radius = data.nest?.radius || nest.radius;
      replaceArray(crumbs, data.crumbs || []);
      replaceArray(helpers, data.helpers || []);
      replaceArray(spiders, data.spiders || []);
      replaceArray(deadAnts, data.deadAnts || []);
      world.room = rooms[player.roomId] || rooms.nest;
      player.roomId = world.room.id;
      updateCamera();
      updateHud();
    }

    function replaceArray(target, values) {
      target.length = 0;
      for (const value of values) target.push(value);
    }

    function updateAutosave(delta) {
      if (!gameStarted) return;
      saveState.autosaveTimer -= delta;
      if (saveState.autosaveTimer > 0) return;
      saveState.autosaveTimer = 20;
      saveGame(false);
    }

    function bindSaveControls() {
      if (saveButton) saveButton.addEventListener("click", () => saveGame(true));
    }
