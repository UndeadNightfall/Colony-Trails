    var gameStarted = false;
    var titleScreen = document.getElementById("titleScreen");
    var startButton = document.getElementById("startButton");
    var loadButton = document.getElementById("loadButton");

    function showTitleScreen() {
      if (titleScreen) titleScreen.classList.remove("hidden");
      updateTitleLoadState();
    }

    function hideTitleScreen() {
      if (titleScreen) titleScreen.classList.add("hidden");
    }

    function updateTitleLoadState() {
      if (loadButton) loadButton.disabled = !hasSaveGame();
    }

    function beginGameplay() {
      if (gameStarted) return;
      gameStarted = true;
      if (typeof hidePauseMenu === "function") hidePauseMenu();
      hideTitleScreen();
      playBackgroundMusic();
    }

    function startFromTitle() {
      if (gameStarted) return;
      if (hasSaveGame()) {
        const keepSave = window.confirm("A saved colony exists. Load it instead of starting a new game?");
        if (keepSave) { loadFromTitle(); return; }
        const startNew = window.confirm("Start a new colony? Autosave will eventually replace the current autosave, but your manual save will be kept.");
        if (!startNew) return;
      }
      backupAutosaveBeforeNewGame();
      beginGameplay();
      startGame();
      markFreshGameAutosaveDelay();
    }

    function loadFromTitle() {
      if (gameStarted) return;
      beginGameplay();
      if (!loadGame()) {
        gameStarted = false;
        showTitleScreen();
        return;
      }
      gameStarted = true;
      gamePaused = false;
      lastTime = performance.now();
      resizeCanvas();
      updateCamera();
      draw();
      requestAnimationFrame(gameLoop);
      markMeaningfulProgress();
    }

    if (startButton) {
      startButton.addEventListener("click", startFromTitle);
      startButton.addEventListener("touchend", event => {
        event.preventDefault();
        startFromTitle();
      }, { passive: false });
    }

    if (loadButton) {
      updateTitleLoadState();
      loadButton.addEventListener("click", loadFromTitle);
      loadButton.addEventListener("touchend", event => {
        event.preventDefault();
        loadFromTitle();
      }, { passive: false });
    }

    bindSaveControls();
