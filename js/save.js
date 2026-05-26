    const LEGACY_SAVE_KEY = "colonyTrailsSaveV1";
    const MANUAL_SAVE_KEY = "colonyTrailsManualSaveV1";
    const AUTOSAVE_KEY = "colonyTrailsAutosaveV1";
    const BACKUP_AUTOSAVE_KEY = "colonyTrailsBackupAutosaveV1";
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
        season: JSON.parse(JSON.stringify(seasonState)),
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

    function saveGame(showMessage = true, slot = "manual") {
      try {
        localStorage.setItem(getSaveKey(slot), JSON.stringify(createSaveData()));
        if (showMessage) showSaveFeedback("Saved");
        return true;
      } catch (error) {
        showSaveFeedback("Save failed");
        return false;
      }
    }

    function hasSaveGame() {
      migrateLegacySave();
      return !!getBestSaveRaw();
    }

    function loadGame() {
      try {
        migrateLegacySave();
        const raw = getBestSaveRaw();
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

    function getSaveKey(slot) {
      return slot === "autosave" ? AUTOSAVE_KEY : MANUAL_SAVE_KEY;
    }

    function getBestSaveRaw() {
      return localStorage.getItem(MANUAL_SAVE_KEY) || localStorage.getItem(AUTOSAVE_KEY);
    }

    function migrateLegacySave() {
      try {
        const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
        if (!legacy) return;
        if (!localStorage.getItem(MANUAL_SAVE_KEY)) localStorage.setItem(MANUAL_SAVE_KEY, legacy);
        localStorage.removeItem(LEGACY_SAVE_KEY);
      } catch (error) {}
    }

    function backupAutosaveBeforeNewGame() {
      try {
        const autosave = localStorage.getItem(AUTOSAVE_KEY);
        if (autosave) localStorage.setItem(BACKUP_AUTOSAVE_KEY, autosave);
      } catch (error) {}
    }

    function markFreshGameAutosaveDelay() {
      saveState.autosaveBlockedUntilProgress = true;
      saveState.autosaveTimer = 20;
    }

    function markMeaningfulProgress() {
      saveState.autosaveBlockedUntilProgress = false;
    }

    function applySaveData(data) {
      Object.assign(player, data.player);
      player.carryingFood = normalizeCarryingFood(player);
      normalizeSicknessState(player);
      Object.assign(colony, data.colony);
      if (typeof normalizeStorageState === "function") normalizeStorageState();
      colony.roles = Object.assign({ worker: 0, soldier: 0, nurse: 0, middenworker: 0, storageworker: 0 }, colony.roles || {});
      if (typeof colony.roles.midden_worker === "number") {
        colony.roles.middenworker = colony.roles.midden_worker;
        delete colony.roles.midden_worker;
      }
      if (typeof colony.roles.storage_worker === "number") {
        colony.roles.storageworker = colony.roles.storage_worker;
        delete colony.roles.storage_worker;
      }
      if (typeof data.settings?.musicEnabled === "boolean") setMusicEnabled(data.settings.musicEnabled);
      if (typeof data.settings?.autosaveEnabled === "boolean") {
        autosaveEnabled = data.settings.autosaveEnabled;
        savePrefs();
      }
      Object.assign(weather, data.weather || weather);
      Object.assign(seasonState, data.season || seasonState);
      if (!Array.isArray(seasonState.order) || seasonState.order.length !== 4) {
        seasonState.order = ["summer", "autumn", "winter", "spring"];
      }
      if (typeof seasonState.currentIndex !== "number" || seasonState.currentIndex < 0 || seasonState.currentIndex >= seasonState.order.length) seasonState.currentIndex = 0;
      if (typeof seasonState.pendingIndex !== "number" && seasonState.pendingIndex !== null) seasonState.pendingIndex = null;
      if (typeof seasonState.elapsed !== "number") seasonState.elapsed = 0;
      if (typeof seasonState.duration !== "number") seasonState.duration = 900;
      Object.assign(foodSpawn, data.foodSpawn || foodSpawn);
      nest.radius = data.nest?.radius || nest.radius;
      if (typeof syncEggFoodRequirement === "function") syncEggFoodRequirement();
      replaceArray(crumbs, data.crumbs || []);
      replaceArray(helpers, data.helpers || []);
      replaceArray(spiders, data.spiders || []);
      if (typeof normalizeEnemyState === "function") for (const spider of spiders) normalizeEnemyState(spider);
      if (typeof ensureBeetleSpawns === "function") ensureBeetleSpawns();
      replaceArray(deadAnts, data.deadAnts || []);
      for (const ant of helpers) normalizeSicknessState(ant);
      for (const ant of helpers) {
        ant.carryingFood = normalizeCarryingFood(ant);
        if (typeof normalizeAntHungerState === "function") normalizeAntHungerState(ant);
        if (ant.roomId !== "nest") continue;
        if (typeof ant.nestBlockedCount !== "number") ant.nestBlockedCount = 0;
        if (typeof ant.nestStuckTime !== "number") ant.nestStuckTime = 0;
        if (!isNestWalkable(ant.x, ant.y, ant.radius || 10)) {
          recoverNestEntityPosition(ant, ant.x, ant.y);
          ant.nestRouteKey = null;
          ant.nestRoute = null;
          ant.nestRouteIndex = 0;
          ant.nestBlockedCount = 0;
          ant.nestStuckTime = 0;
        }
      }
      for (const egg of colony.eggs || []) normalizeEggState(egg);
      nextAntId = helpers.reduce((max, ant) => Math.max(max, ant.id || 0), 0) + 1;
      if (typeof ensureMinimumRolePopulation === "function") ensureMinimumRolePopulation();
      world.room = rooms[player.roomId] || rooms.nest;
      player.roomId = world.room.id;
      if (typeof syncEggFoodRequirement === "function") syncEggFoodRequirement();
      if (weather.active) playRainSound();
      else stopRainSound();
      updateCamera();
      updateHud();
    }

    function replaceArray(target, values) {
      target.length = 0;
      for (const value of values) target.push(value);
    }

    function normalizeCarryingFood(entity) {
      if (!entity) return [];
      if (entity.carrying === "queen_food") return entity.carryingFood || null;
      if (entity.carrying !== "food") return [];
      if (Array.isArray(entity.carryingFood)) return entity.carryingFood;
      if (entity.carryingFood) return [entity.carryingFood];
      return [];
    }

    function normalizeEggState(egg) {
      if (typeof egg.inNursery !== "boolean") egg.inNursery = true;
      if (typeof egg.carriedBy === "undefined") egg.carriedBy = null;
      if (typeof egg.x !== "number") egg.x = egg.inNursery ? nursery.x - 36 : queen.x + 54;
      if (typeof egg.y !== "number") egg.y = egg.inNursery ? nursery.y - 4 : queen.y + 20;
    }

    function updateAutosave(delta) {
      if (!gameStarted || !autosaveEnabled) return;
      if (saveState.autosaveBlockedUntilProgress) return;
      saveState.autosaveTimer -= delta;
      if (saveState.autosaveTimer > 0) return;
      saveState.autosaveTimer = 20;
      saveGame(false, "autosave");
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
    migrateLegacySave();

    function showSaveFeedback(text) {
      if (!saveToast) return;
      saveToast.textContent = text;
      saveToastTimer = 3;
      saveToast.classList.add("visible");
    }
