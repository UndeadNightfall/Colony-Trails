    var pauseScreen = document.getElementById("pauseScreen");
    var resumeButton = document.getElementById("resumeButton");
    var pauseSaveButton = document.getElementById("pauseSaveButton");
    var pauseAutosaveButton = document.getElementById("pauseAutosaveButton");
    var menuButton = document.getElementById("menuButton");

    function setPauseButtonVisible(visible) {
      if (!pauseButton) return;
      pauseButton.hidden = !visible;
    }

    function showPauseMenu() {
      if (!gameStarted) return;
      gamePaused = true;
      if (pauseScreen) pauseScreen.classList.remove("hidden");
      setPauseButtonVisible(false);
      resetInputControls();
      pauseBackgroundMusic();
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
      setPauseButtonVisible(false);
      resetInputControls();
      pauseBackgroundMusic();
    }

    bindPauseControls();
