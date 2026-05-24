    var musicButton = document.getElementById("musicButton");

    function setJoystickFromPointer(event) {
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const maxDistance = rect.width * 0.34;
      const distance = Math.hypot(dx, dy);
      const limited = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);
      input.x = Math.cos(angle) * (limited / maxDistance);
      input.y = Math.sin(angle) * (limited / maxDistance);
      stick.style.transform = `translate(calc(-50% + ${Math.cos(angle) * limited}px), calc(-50% + ${Math.sin(angle) * limited}px))`;
    }

    joystick.addEventListener("pointerdown", event => { input.active = true; input.pointerId = event.pointerId; joystick.setPointerCapture(event.pointerId); setJoystickFromPointer(event); });
    joystick.addEventListener("pointermove", event => { if (input.active && input.pointerId === event.pointerId) setJoystickFromPointer(event); });
    function releaseJoystick(event) { if (input.pointerId !== event.pointerId) return; input.active = false; input.pointerId = null; input.x = 0; input.y = 0; stick.style.transform = "translate(-50%, -50%)"; }
    joystick.addEventListener("pointerup", releaseJoystick);
    joystick.addEventListener("pointercancel", releaseJoystick);
    actionButton.addEventListener("click", () => {
      if (player.carrying === "dead") objectiveText.textContent = "Carry the dead ant body back to the midden.";
      else if (player.carrying) objectiveText.textContent = "Carry the food back to the queen.";
      else objectiveText.textContent = "Explore the grass and touch a crumb or dead ant to pick it up.";
    });
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    if (musicButton) {
      musicButton.addEventListener("pointerup", event => {
        event.preventDefault();
        toggleMusic();
      });
      musicButton.textContent = musicEnabled ? "Music: On" : "Music: Off";
    }

    function resetInputControls() {
      input.active = false;
      input.pointerId = null;
      input.x = 0;
      input.y = 0;
      if (stick) stick.style.transform = "translate(-50%, -50%)";
    }
