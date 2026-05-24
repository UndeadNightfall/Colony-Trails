    var gameStarted = false;
    var titleScreen = document.getElementById("titleScreen");
    var startButton = document.getElementById("startButton");
    var loadButton = document.getElementById("loadButton");

    function startFromTitle() {
      if (gameStarted) return;
      gameStarted = true;
      if (titleScreen) titleScreen.classList.add("hidden");
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
      loadButton.disabled = !hasSaveGame();
      loadButton.addEventListener("click", loadFromTitle);
      loadButton.addEventListener("touchend", event => {
        event.preventDefault();
        loadFromTitle();
      }, { passive: false });
    }

    bindSaveControls();
