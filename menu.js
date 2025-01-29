document.addEventListener('DOMContentLoaded', () => {
  const mainMenu = document.getElementById('main-menu');
  const gameContainer = document.getElementById('game-container');
  const singleplayerBtn = document.getElementById('singleplayer-btn');
  const multiplayerBtn = document.getElementById('multiplayer-btn');
  const multiplayerModal = document.getElementById('multiplayer-modal');
  const closeModalBtn = document.querySelector('.close-modal');
  const connectServerBtn = document.getElementById('connect-server-btn');
  const serverAddressInput = document.getElementById('server-address');
  const serverStatus = document.getElementById('server-status');

  singleplayerBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Trigger game initialization
    window.dispatchEvent(new Event('start-game'));
  });

  multiplayerBtn.addEventListener('click', () => {
    multiplayerModal.style.display = 'block';
  });

  closeModalBtn.addEventListener('click', () => {
    multiplayerModal.style.display = 'none';
  });

  connectServerBtn.addEventListener('click', () => {
    const serverAddress = serverAddressInput.value.trim();
    
    if (!serverAddress) {
      serverStatus.textContent = 'Please enter a server address';
      serverStatus.style.color = 'red';
      return;
    }

    // Simulate server connection (replace with actual WebSocket connection)
    try {
      // Validate server address format
      const urlPattern = /^(localhost|[\w.-]+)(?::\d+)?$/;
      if (!urlPattern.test(serverAddress)) {
        throw new Error('Invalid server address format');
      }

      // Here you would typically establish a WebSocket connection
      serverStatus.textContent = `Connecting to ${serverAddress}...`;
      serverStatus.style.color = 'yellow';

      // Simulated connection (replace with actual connection logic)
      setTimeout(() => {
        serverStatus.textContent = `Connected to ${serverAddress}`;
        serverStatus.style.color = 'green';

        // Optional: Hide modal and start multiplayer game
        multiplayerModal.style.display = 'none';
        mainMenu.style.display = 'none';
        gameContainer.style.display = 'block';

        // Trigger multiplayer game initialization (you'll need to implement this)
        window.dispatchEvent(new Event('start-multiplayer-game'));
      }, 1500);

    } catch (error) {
      serverStatus.textContent = error.message;
      serverStatus.style.color = 'red';
    }
  });

  // Optional: Add hover sound effect (commented out as no audio was provided)
  const menuButtons = document.querySelectorAll('.menu-button');
  
  menuButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      // Optionally add hover effect
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
  });
});