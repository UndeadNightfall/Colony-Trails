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

    function startFromTitle() {
      if (gameStarted) return;
      gameStarted = true;
      if (typeof hidePauseMenu === "function") hidePauseMenu();
      hideTitleScreen();
      playBackgroundMusic();
      startGame();
    }

    function loadFromTitle() {
      if (gameStarted) return;
      startFromTitle();
      loadGame();
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
