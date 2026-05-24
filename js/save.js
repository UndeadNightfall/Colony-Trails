    const SAVE_KEY = "colonyTrailsSaveV1";
    const PREFS_KEY = "colonyTrailsPrefsV1";
    var saveToast = document.getElementById("saveToast");
    var saveToastTimer = 0;

    function createSaveData() {
      return {
        version: 1,
        savedAt: Date.now(),
        world: { roomId: player.roomId },
        player: { ...player },
        colony: JSON.parse(JSON.stringify(colony)),
        settings: { musicEnabled, autosaveEnabled },
        weather: JSON.parse(JSON.stringify(weather)),
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
        if (showMessage) showSaveFeedback("Saved");
        return true;
      } catch (error) {
        showSaveFeedback("Save failed");
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
      if (typeof data.settings?.musicEnabled === "boolean") setMusicEnabled(data.settings.musicEnabled);
      if (typeof data.settings?.autosaveEnabled === "boolean") {
        autosaveEnabled = data.settings.autosaveEnabled;
        savePrefs();
      }
      Object.assign(weather, data.weather || weather);
      Object.assign(foodSpawn, data.foodSpawn || foodSpawn);
      nest.radius = data.nest?.radius || nest.radius;
      replaceArray(crumbs, data.crumbs || []);
      replaceArray(helpers, data.helpers || []);
      replaceArray(spiders, data.spiders || []);
      replaceArray(deadAnts, data.deadAnts || []);
      nextAntId = helpers.reduce((max, ant) => Math.max(max, ant.id || 0), 0) + 1;
      world.room = rooms[player.roomId] || rooms.nest;
      player.roomId = world.room.id;
      if (weather.active) playRainSound();
      else stopRainSound();
      updateCamera();
      updateHud();
    }

    function replaceArray(target, values) {
      target.length = 0;
      for (const value of values) target.push(value);
    }

    function updateAutosave(delta) {
      if (!gameStarted || !autosaveEnabled) return;
      saveState.autosaveTimer -= delta;
      if (saveState.autosaveTimer > 0) return;
      saveState.autosaveTimer = 20;
      saveGame(false);
    }

    function updateSaveToast(delta) {
      if (!saveToast || saveToastTimer <= 0) return;
      saveToastTimer -= delta;
      if (saveToastTimer <= 0) {
        saveToastTimer = 0;
        saveToast.classList.remove("visible");
      }
    }

    function bindSaveControls() {
      if (saveButton) saveButton.addEventListener("click", () => saveGame(true));
    }

    function loadPrefs() {
      try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (typeof data?.autosaveEnabled === "boolean") autosaveEnabled = data.autosaveEnabled;
      } catch (error) {}
    }

    function savePrefs() {
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ autosaveEnabled }));
      } catch (error) {}
    }

    function toggleAutosaveEnabled() {
      autosaveEnabled = !autosaveEnabled;
      savePrefs();
      updatePauseAutosaveButton();
      return autosaveEnabled;
    }

    function updatePauseAutosaveButton() {
      if (!pauseAutosaveButton) return;
      pauseAutosaveButton.textContent = autosaveEnabled ? "Autosave: On" : "Autosave: Off";
    }

    loadPrefs();

    function showSaveFeedback(text) {
      if (!saveToast) return;
      saveToast.textContent = text;
      saveToastTimer = 1.6;
      saveToast.classList.add("visible");
    }
