    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    var roomDisplay = document.getElementById("roomDisplay");
    var foodDisplay = document.getElementById("foodDisplay");
    var colonyDisplay = document.getElementById("colonyDisplay");
    var healthDisplay = document.getElementById("healthDisplay");
    var objectiveText = document.getElementById("objectiveText");
    var joystick = document.getElementById("joystick");
    var stick = document.getElementById("stick");
    var actionButton = document.getElementById("actionButton");
    var saveButton = document.getElementById("saveButton");

    var rooms = {
      nest: { id: "nest", name: "Nest", width: 1200, height: 760 },
      overworld: { id: "overworld", name: "Backyard", width: 1900, height: 1200, ground: "grass" },
      patio: { id: "patio", name: "Concrete Patio", width: 1500, height: 950, ground: "patio" },
      sandpit: { id: "sandpit", name: "Sandpit", width: 1350, height: 900, ground: "sand" },
      garden: { id: "garden", name: "Garden Bed", width: 1450, height: 1000, ground: "soil" }
    };

    var world = { room: rooms.nest, cameraX: 0, cameraY: 0 };
    var input = { x: 0, y: 0, active: false, pointerId: null };

    var player = { x: 430, y: 380, radius: 14, speed: 190, angle: 0, carrying: false, health: 3, invulnerable: 0, roomId: "nest" };
    var queen = { x: 260, y: 380, radius: 48, roomId: "nest" };
    var nest = { x: 260, y: 380, radius: 145, roomId: "nest" };

    var exits = {
      nestToOverworld: { roomId: "nest", x: 1040, y: 380, radius: 48, to: "overworld", toX: 220, toY: 590, label: "Exit" },
      overworldToNest: { roomId: "overworld", x: 115, y: 590, radius: 58, to: "nest", toX: 958, toY: 380, label: "Nest" },
      overworldToPatio: { roomId: "overworld", x: 1720, y: 270, radius: 58, to: "patio", toX: 160, toY: 470, label: "Patio" },
      patioToOverworld: { roomId: "patio", x: 70, y: 470, radius: 58, to: "overworld", toX: 1640, toY: 270, label: "Yard" },
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
      nestStage: 1,
      tunnelCapacity: [4, 8, 14, 22],
      roles: { worker: 1, soldier: 0, nurse: 0 },
      recoveredDead: 0,
      excavation: { active: false, targetStage: 1, progress: 0, duration: 22 }
    };
    var crumbs = [];
    var helpers = [];
    var spiders = [];
    var deadAnts = [];
    var combatEffects = [];
    var grassClumps = [];
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
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 120, y: 105, width: 440, height: 34, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 790, y: 105, width: 440, height: 34, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 120, y: 760, width: 1110, height: 34, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 120, y: 105, width: 34, height: 690, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "rect", name: "timber sleeper", x: 1196, y: 105, width: 34, height: 690, radius: 14, color: "#7b4a28" },
      { roomId: "sandpit", type: "circle", name: "bucket", x: 360, y: 360, radius: 44, color: "#d6613b" },
      { roomId: "sandpit", type: "rect", name: "toy spade", x: 790, y: 515, width: 190, height: 26, radius: 12, color: "#437ab0" },
      { roomId: "overworld", type: "rect", name: "fallen rake", x: 600, y: 565, width: 260, height: 24, radius: 10, color: "#8d6841" },
      { roomId: "overworld", type: "rect", name: "fence board", x: 1360, y: 720, width: 250, height: 44, radius: 12, color: "#8a5b36" },
      { roomId: "overworld", type: "circle", name: "soccer ball", x: 390, y: 690, radius: 36, color: "#eee8d4" },
      { roomId: "overworld", type: "circle", name: "garden light", x: 970, y: 640, radius: 26, color: "#7f8a75" },
      { roomId: "garden", type: "circle", name: "plant pot", x: 350, y: 360, radius: 54, color: "#9a5734" },
      { roomId: "garden", type: "circle", name: "plant pot", x: 920, y: 570, radius: 48, color: "#9a5734" },
      { roomId: "garden", type: "rect", name: "fence board", x: 150, y: 800, width: 360, height: 44, radius: 12, color: "#8a5b36" },
      { roomId: "garden", type: "rect", name: "fallen rake", x: 970, y: 270, width: 250, height: 24, radius: 10, color: "#8d6841" }
    ];

    var lastTime = performance.now();
    var midden = { x: 170, y: 535, radius: 58 };
    var saveState = { autosaveTimer: 0 };
