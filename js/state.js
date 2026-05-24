    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    var roomDisplay = document.getElementById("roomDisplay");
    var foodDisplay = document.getElementById("foodDisplay");
    var colonyDisplay = document.getElementById("colonyDisplay");
    var colonyPanel = document.getElementById("colonyPanel");
    var colonyDropdown = document.getElementById("colonyDropdown");
    var healthDisplay = document.getElementById("healthDisplay");
    var musicButton = document.getElementById("musicButton");
    var objectiveText = document.getElementById("objectiveText");
    var joystick = document.getElementById("joystick");
    var stick = document.getElementById("stick");
    var actionButton = document.getElementById("actionButton");
    var saveButton = document.getElementById("saveButton");
    var pauseButton = document.getElementById("pauseButton");
    var nestGatewayImage = new Image();
    nestGatewayImage.src = "nest_clean.png";
    var outworldGatewayImage = new Image();
    outworldGatewayImage.src = "outworld.png.png";
    var gardenGatewayImage = new Image();
    gardenGatewayImage.src = "garden_clean.png";
    var sandpitGatewayImage = new Image();
    sandpitGatewayImage.src = "sandpit_clean.png";
    var patioGatewayImage = new Image();
    patioGatewayImage.src = "patio_clean.png";
    var houseGatewayImage = new Image();
    houseGatewayImage.src = "house.png";
    var backyardGatewayImage = new Image();
    backyardGatewayImage.src = "backyard.png";

    var rooms = {
      nest: { id: "nest", name: "Nest", width: 2200, height: 1500 },
      overworld: { id: "overworld", name: "Backyard", width: 1900, height: 1200, ground: "grass" },
      patio: { id: "patio", name: "Concrete Patio", width: 1500, height: 950, ground: "patio" },
      house: { id: "house", name: "House", width: 1500, height: 950, ground: "house" },
      sandpit: { id: "sandpit", name: "Sandpit", width: 1350, height: 900, ground: "sand" },
      garden: { id: "garden", name: "Garden Bed", width: 1450, height: 1000, ground: "soil" }
    };

    var world = { room: rooms.nest, cameraX: 0, cameraY: 0 };
    var input = { x: 0, y: 0, active: false, pointerId: null };

    var player = { x: 1180, y: 980, radius: 14, speed: 190, angle: 0, carrying: false, health: 3, invulnerable: 0, roomId: "nest", sick: false, sickTimer: 0, sickProgress: 0, sickExposure: 0, atMidden: false, carriedBy: null, sickCaretakerId: null, sickCarrierId: null, sickSourceId: null, middenHealProgress: 0, middenCaretakerId: null };
    var queen = { x: 1050, y: 980, radius: 48, roomId: "nest", feedPulse: 0, layPulse: 0, swayPhase: 0 };
    var nursery = { x: 650, y: 760, rx: 132, ry: 78, roomId: "nest" };
    var nest = { x: 1080, y: 520, radius: 82, roomId: "nest" };

    var exits = {
      nestToOverworld: { roomId: "nest", x: 1120, y: 92, radius: 48, to: "overworld", toX: 220, toY: 590, label: "Exit" },
      overworldToNest: { roomId: "overworld", x: 115, y: 590, radius: 58, to: "nest", toX: 1120, toY: 210, label: "Nest" },
      overworldToPatio: { roomId: "overworld", x: 1720, y: 270, radius: 58, to: "patio", toX: 160, toY: 470, label: "Patio" },
      patioToOverworld: { roomId: "patio", x: 70, y: 470, radius: 58, to: "overworld", toX: 1640, toY: 270, label: "Yard" },
      patioToHouse: { roomId: "patio", x: 1410, y: 470, radius: 58, to: "house", toX: 160, toY: 470, label: "House" },
      houseToPatio: { roomId: "house", x: 70, y: 470, radius: 58, to: "patio", toX: 1330, toY: 470, label: "Patio" },
      overworldToSandpit: { roomId: "overworld", x: 940, y: 1100, radius: 58, to: "sandpit", toX: 675, toY: 170, label: "Sandpit" },
      sandpitToOverworld: { roomId: "sandpit", x: 675, y: 58, radius: 58, to: "overworld", toX: 940, toY: 1018, label: "Yard" },
      overworldToGarden: { roomId: "overworld", x: 280, y: 1080, radius: 58, to: "garden", toX: 725, toY: 140, label: "Garden" },
      gardenToOverworld: { roomId: "garden", x: 725, y: 55, radius: 58, to: "overworld", toX: 280, toY: 998, label: "Yard" }
    };

    var colony = {
      food: 0,
      ants: 2,
      eggs: [],
      crumbsForEgg: 3,
      incubationDuration: 18,
      nestStage: 4,
      tunnelCapacity: [80],
      roles: { worker: 1, soldier: 0, nurse: 0, middenworker: 0 },
      recoveredDead: 0,
      excavation: { active: false, targetStage: 4, progress: 0, duration: 0 }
    };
    var crumbs = [];
    var helpers = [];
    var spiders = [];
    var deadAnts = [];
    var combatEffects = [];
    var grassClumps = [];
    var seasonFlowers = [];
    var pebbles = [];
    var foodSpawn = {
      timer: 0,
      interval: 5,
      rooms: {
        overworld: { cap: 5, initial: 3 },
        patio: { cap: 4, initial: 2 },
        sandpit: { cap: 4, initial: 2 },
        garden: { cap: 5, initial: 3 }
      }
    };
    var obstructions = [
      { roomId: "patio", type: "rect", name: "patio chair", x: 420, y: 250, width: 170, height: 120, radius: 16, color: "#6f807b" },
      { roomId: "patio", type: "rect", name: "patio chair", x: 760, y: 540, width: 170, height: 120, radius: 16, color: "#6f807b" },
      { roomId: "patio", type: "rect", name: "doormat", x: 1080, y: 180, width: 240, height: 120, radius: 18, color: "#6d4b30" },
      { roomId: "patio", type: "circle", name: "watering can", x: 1140, y: 680, radius: 42, color: "#5b857f" },
      { roomId: "house", type: "rect", name: "sofa", x: 180, y: 190, width: 360, height: 160, radius: 24, color: "#7b5b46" },
      { roomId: "house", type: "rect", name: "coffee table", x: 610, y: 340, width: 180, height: 100, radius: 18, color: "#8d6841" },
      { roomId: "house", type: "rect", name: "dining table", x: 950, y: 180, width: 300, height: 180, radius: 22, color: "#9d7a58" },
      { roomId: "house", type: "rect", name: "rug", x: 500, y: 520, width: 420, height: 180, radius: 32, color: "#b56c4c" },
      { roomId: "house", type: "circle", name: "potted plant", x: 1210, y: 620, radius: 48, color: "#8d5a31" },
      { roomId: "house", type: "rect", name: "bookshelf", x: 120, y: 560, width: 220, height: 240, radius: 18, color: "#6e4e35" },
      { roomId: "house", type: "circle", name: "lamp", x: 1270, y: 680, radius: 34, color: "#d5c7a0" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 120, y: 105, width: 440, height: 34, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 790, y: 105, width: 440, height: 34, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 120, y: 760, width: 1110, height: 34, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 120, y: 105, width: 34, height: 690, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 1196, y: 105, width: 34, height: 690, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "circle", name: "bucket", x: 360, y: 360, radius: 44, color: "#d6613b" },
      { roomId: "sandpit", type: "rect", name: "toy spade", x: 790, y: 515, width: 190, height: 26, radius: 12, color: "#437ab0" },
      { roomId: "overworld", type: "rect", name: "fallen rake", solid: false, x: 610, y: 568, width: 220, height: 12, radius: 8, color: "#8d6841" },
      { roomId: "overworld", type: "rect", name: "fence board", x: 1360, y: 720, width: 250, height: 44, radius: 12, color: "#8a5b36" },
      { roomId: "overworld", type: "circle", name: "garden light", x: 970, y: 640, radius: 26, color: "#7f8a75" },
      { roomId: "garden", type: "circle", name: "plant pot", x: 350, y: 360, radius: 54, color: "#9a5734" },
      { roomId: "garden", type: "circle", name: "plant pot", x: 920, y: 570, radius: 48, color: "#9a5734" },
      { roomId: "garden", type: "rect", name: "fence board", x: 150, y: 800, width: 360, height: 44, radius: 12, color: "#8a5b36" },
      { roomId: "garden", type: "rect", name: "fallen rake", solid: false, x: 980, y: 273, width: 210, height: 12, radius: 8, color: "#8d6841" }
    ];

    var lastTime = performance.now();
    var midden = { x: 1390, y: 350, radius: 72 };
    var saveState = { autosaveTimer: 0 };
    var gamePaused = false;
    var musicEnabled = true;
    var autosaveEnabled = true;
    var nextAntId = 1;
    var weather = {
      active: false,
      timeLeft: 0,
      nextStorm: 24,
      exposureSeconds: 0,
      cleanupPriority: false,
      killCount: 0
    };
    var seasonState = {
      order: ["summer", "autumn", "winter", "spring"],
      currentIndex: 0,
      pendingIndex: null,
      elapsed: 0,
      duration: 900,
      beesSeed: Math.random() * Math.PI * 2
    };
    var defenseCall = {
      active: false,
      targetSpiderId: null,
      timeLeft: 0,
      lastCallAt: -10
    };
    var colonyDropdownOpen = false;

    function getColonyRoleCounts() {
      var roles = colony.roles || {};
      return {
        worker: roles.worker || 0,
        soldier: roles.soldier || 0,
        nurse: roles.nurse || 0,
        middenworker: roles.middenworker || 0
      };
    }

    function updateColonyDropdown() {
      if (!colonyDropdown) return;
      var counts = getColonyRoleCounts();
      colonyDropdown.innerHTML = `
        <div class="dropdown-title">Ant breakdown</div>
        <div class="dropdown-row"><span>Total</span><span>${colony.ants}</span></div>
        <div class="dropdown-row"><span>Workers</span><span>${counts.worker}</span></div>
        <div class="dropdown-row"><span>Soldiers</span><span>${counts.soldier}</span></div>
        <div class="dropdown-row"><span>Nurses</span><span>${counts.nurse}</span></div>
        <div class="dropdown-row"><span>Midden workers</span><span>${counts.middenworker}</span></div>
      `;
    }

    function showColonyDropdown() {
      if (!colonyDropdown) return;
      updateColonyDropdown();
      colonyDropdown.classList.remove("hidden");
      colonyDropdown.setAttribute("aria-hidden", "false");
      colonyDropdownOpen = true;
    }

    function hideColonyDropdown() {
      if (!colonyDropdown) return;
      colonyDropdown.classList.add("hidden");
      colonyDropdown.setAttribute("aria-hidden", "true");
      colonyDropdownOpen = false;
    }

    function toggleColonyDropdown() {
      if (colonyDropdownOpen) hideColonyDropdown();
      else showColonyDropdown();
    }

    if (colonyDisplay) {
      colonyDisplay.addEventListener("pointerup", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleColonyDropdown();
      });
    }

    document.addEventListener("pointerdown", event => {
      if (!colonyDropdownOpen) return;
      if (colonyPanel && colonyPanel.contains(event.target)) return;
      hideColonyDropdown();
    });

    function resetGameState() {
      world.room = rooms.nest;
      world.cameraX = 0;
      world.cameraY = 0;
      input.x = 0;
      input.y = 0;
      input.active = false;
      input.pointerId = null;
      Object.assign(player, { x: 1180, y: 980, radius: 14, speed: 190, angle: 0, carrying: false, health: 3, invulnerable: 0, roomId: "nest", sick: false, sickTimer: 0, sickProgress: 0, sickExposure: 0, atMidden: false, carriedBy: null, sickCaretakerId: null, sickCarrierId: null, sickSourceId: null, middenHealProgress: 0, middenCaretakerId: null });
      Object.assign(queen, { x: 1050, y: 980, radius: 48, roomId: "nest", feedPulse: 0, layPulse: 0, swayPhase: 0 });
      Object.assign(nursery, { x: 650, y: 760, rx: 132, ry: 78, roomId: "nest" });
      Object.assign(nest, { x: 1080, y: 520, radius: 82, roomId: "nest" });
      Object.assign(colony, {
        food: 0,
        ants: 2,
        eggs: [],
        crumbsForEgg: 3,
        incubationDuration: 18,
        nestStage: 4,
        tunnelCapacity: [80],
        roles: { worker: 1, soldier: 0, nurse: 0, middenworker: 0 },
        recoveredDead: 0,
        excavation: { active: false, targetStage: 4, progress: 0, duration: 0 }
      });
      if (typeof syncEggFoodRequirement === "function") syncEggFoodRequirement();
      crumbs.length = 0;
      helpers.length = 0;
      spiders.length = 0;
      deadAnts.length = 0;
      combatEffects.length = 0;
      grassClumps.length = 0;
      pebbles.length = 0;
      saveState.autosaveTimer = 20;
      resetWeatherState();
      resetDefenseCall();
      nextAntId = 1;
      if (typeof resetSeasonState === "function") resetSeasonState();
      stopRainSound();
      gamePaused = false;
      lastTime = performance.now();
      objectiveText.textContent = "Leave the nest, find crumbs, and bring food back to the queen.";
      if (stick) stick.style.transform = "translate(-50%, -50%)";
    }

    function resetWeatherState() {
      weather.active = false;
      weather.timeLeft = 0;
      weather.nextStorm = 300 + Math.random() * 120;
      weather.exposureSeconds = 0;
      weather.cleanupPriority = false;
      weather.killCount = 0;
    }

    function resetDefenseCall() {
      defenseCall.active = false;
      defenseCall.targetSpiderId = null;
      defenseCall.timeLeft = 0;
      defenseCall.lastCallAt = -10;
    }
