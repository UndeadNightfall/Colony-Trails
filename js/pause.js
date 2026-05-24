    var pauseScreen = document.getElementById("pauseScreen");
    var pauseSeasonCountdown = document.getElementById("pauseSeasonCountdown");
    var resumeButton = document.getElementById("resumeButton");
    var pauseSaveButton = document.getElementById("pauseSaveButton");
    var pauseAutosaveButton = document.getElementById("pauseAutosaveButton");
    var menuButton = document.getElementById("menuButton");

    function formatSeasonCountdown() {
      if (typeof seasonState === "undefined") return "Season: Summer | Next change in 15:00";
      var order = Array.isArray(seasonState.order) && seasonState.order.length ? seasonState.order : ["summer", "autumn", "winter", "spring"];
      var index = typeof seasonState.currentIndex === "number" ? seasonState.currentIndex : 0;
      if (index < 0 || index >= order.length) index = 0;
      var currentSeason = order[index] || "summer";
      var duration = typeof seasonState.duration === "number" ? seasonState.duration : 900;
      var elapsed = typeof seasonState.elapsed === "number" ? seasonState.elapsed : 0;
      var remaining = Math.max(0, Math.ceil(duration - elapsed));
      var minutes = Math.floor(remaining / 60).toString();
      var seconds = (remaining % 60).toString().padStart(2, "0");
      if (seasonState.pendingIndex != null) {
        var pendingSeason = order[seasonState.pendingIndex] || order[(index + 1) % order.length] || "summer";
        return `Season: ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} | Next change in 0:00 (${pendingSeason.charAt(0).toUpperCase() + pendingSeason.slice(1)} pending nest entry)`;
      }
      return `Season: ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} | Next change in ${minutes}:${seconds}`;
    }

    function updatePauseSeasonCountdown() {
      if (!pauseSeasonCountdown) return;
      pauseSeasonCountdown.textContent = formatSeasonCountdown();
    }

    function setPauseButtonVisible(visible) {
      if (!pauseButton) return;
      pauseButton.hidden = !visible;
    }

    function showPauseMenu() {
      if (!gameStarted) return;
      gamePaused = true;
      if (pauseScreen) pauseScreen.classList.remove("hidden");
      updatePauseSeasonCountdown();
      setPauseButtonVisible(false);
      resetInputControls();
      pauseRainSound();
    }

    function hidePauseMenu() {
      gamePaused = false;
      if (pauseScreen) pauseScreen.classList.add("hidden");
      setPauseButtonVisible(gameStarted);
      playBackgroundMusic();
      if (weather.active) playRainSound();
    }

    function togglePauseMenu() {
      if (!gameStarted) return;
      if (gamePaused) hidePauseMenu();
      else showPauseMenu();
    }

    function returnToMenu() {
      if (!gameStarted) return;
      gameStarted = false;
      gamePaused = false;
      if (pauseScreen) pauseScreen.classList.add("hidden");
      setPauseButtonVisible(false);
      resetInputControls();
      stopBackgroundMusic();
      stopRainSound();
      showTitleScreen();
    }

    function bindPauseControls() {
      setPauseButtonVisible(false);
      if (pauseButton) {
        pauseButton.addEventListener("click", togglePauseMenu);
        pauseButton.addEventListener("touchend", event => {
          event.preventDefault();
          togglePauseMenu();
        }, { passive: false });
      }
      if (pauseAutosaveButton) {
        pauseAutosaveButton.addEventListener("pointerup", event => {
          event.preventDefault();
          const enabled = toggleAutosaveEnabled();
          pauseAutosaveButton.textContent = enabled ? "Autosave: On" : "Autosave: Off";
          showSaveFeedback(enabled ? "Autosave on" : "Autosave off");
        });
      }
      updatePauseAutosaveButton();
      if (resumeButton) {
        resumeButton.addEventListener("click", hidePauseMenu);
        resumeButton.addEventListener("touchend", event => {
          event.preventDefault();
          hidePauseMenu();
        }, { passive: false });
      }
      if (pauseSaveButton) {
        pauseSaveButton.addEventListener("click", () => saveGame(true));
        pauseSaveButton.addEventListener("touchend", event => {
          event.preventDefault();
          saveGame(true);
        }, { passive: false });
      }
      if (menuButton) {
        menuButton.addEventListener("click", returnToMenu);
        menuButton.addEventListener("touchend", event => {
          event.preventDefault();
          returnToMenu();
        }, { passive: false });
      }
      window.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!gameStarted) return;
        event.preventDefault();
        togglePauseMenu();
      });
      document.addEventListener("visibilitychange", () => {
        if (!gameStarted || document.visibilityState === "visible") return;
        forcePauseGame();
      });
      window.addEventListener("blur", () => {
        if (!gameStarted) return;
        forcePauseGame();
      });
      window.addEventListener("pagehide", () => {
        if (!gameStarted) return;
        forcePauseGame();
      });
    }

    function forcePauseGame() {
      if (!gameStarted || gamePaused) return;
      gamePaused = true;
      if (pauseScreen) pauseScreen.classList.remove("hidden");
      updatePauseSeasonCountdown();
      setPauseButtonVisible(false);
      resetInputControls();
      pauseBackgroundMusic();
      pauseRainSound();
    }

    bindPauseControls();
