    var soundVolumes = {
      music: 0.32,
      rain: 0.22,
      pickup: 0.42,
      give: 0.46
    };

    function createAudioPool(src, volume, poolSize) {
      const pool = [];
      for (let i = 0; i < poolSize; i++) {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = volume;
        pool.push(audio);
      }
      return pool;
    }

    function playPooledSound(pool) {
      const audio = pool.find(item => item.paused || item.ended) || pool[0];
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    var pickupSoundPool = createAudioPool("item pickup.mp3", soundVolumes.pickup, 3);
    var giveSoundPool = createAudioPool("item give.mp3", soundVolumes.give, 3);

    function playPickupSound() {
      playPooledSound(pickupSoundPool);
    }

    function playGiveSound() {
      playPooledSound(giveSoundPool);
    }
