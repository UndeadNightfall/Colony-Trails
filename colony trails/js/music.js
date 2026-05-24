    var backgroundMusic = new Audio("morning meadow.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.preload = "metadata";
    backgroundMusic.volume = soundVolumes.music;

    function playBackgroundMusic() {
      if (!musicEnabled) return Promise.resolve(false);
      if (!backgroundMusic.paused) return Promise.resolve(true);
      backgroundMusic.currentTime = backgroundMusic.currentTime || 0;
      return backgroundMusic.play().catch(() => false);
    }

    function pauseBackgroundMusic() {
      backgroundMusic.pause();
    }

    function stopBackgroundMusic() {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }

    function setMusicEnabled(enabled) {
      musicEnabled = enabled;
      if (!musicButton) return;
      musicButton.textContent = enabled ? "Music: On" : "Music: Off";
      if (!enabled) stopBackgroundMusic();
      else playBackgroundMusic();
    }

    function toggleMusic() {
      setMusicEnabled(!musicEnabled);
    }
