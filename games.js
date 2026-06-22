// Game Menu System
document.addEventListener('DOMContentLoaded', () => {
  try {
    const menuItems = document.querySelectorAll('.game-menu-item');
    const gameSections = document.querySelectorAll('.game-section');
    
    if (!menuItems.length || !gameSections.length) {
      console.warn('Game menu elements not found');
      return;
    }
  
    // Global reference to the snake keyboard handler
    window.snakeKeyboardHandler = null;
  
    // Function to switch between games
    function switchGame(gameName) {
    // Stop all active games before switching
    // Memory game cleanup
      if (gameName !== 'memory' && window.memoryGameTimer) {
        clearInterval(window.memoryGameTimer);
        window.memoryGameTimer = null;
        window.memoryGameActive = false;
      }

      // Snake game cleanup
      if (gameName !== 'snake') {
        if (window.snakeGameInterval) {
          clearInterval(window.snakeGameInterval);
          window.snakeGameInterval = null;
        }
        if (window.snakeKeyboardHandler) {
          document.removeEventListener('keydown', window.snakeKeyboardHandler);
          window.snakeKeyboardHandler = null;
        }
        window.snakeGameActive = false;
      }

      // Typing game cleanup
      if (gameName !== 'typing' && window.typingTimerInterval) {
        clearInterval(window.typingTimerInterval);
        window.typingTimerInterval = null;
        window.typingGameActive = false;
      }

      // Music Studio cleanup
      if (gameName !== 'arrow') {
        if (typeof window.cleanupMusicStudio === 'function') {
          window.cleanupMusicStudio();
        }
      }

      // Hide all game sections
      gameSections.forEach(section => {
        section.classList.add('hidden');
      });

      // Deactivate all menu items and update aria-pressed
      menuItems.forEach(item => {
        item.classList.remove('active');
        const button = item.querySelector('button');
        if (button) {
          button.setAttribute('aria-pressed', 'false');
        }
      });

      // Show selected game and activate menu item
      const gameSection = document.getElementById(`${gameName}-section`);
      if (gameSection) {
        gameSection.classList.remove('hidden');
      }

      const activeMenuItem = document.querySelector(`.game-menu-item[data-game="${gameName}"]`);
      if (activeMenuItem) {
        activeMenuItem.classList.add('active');

        // Update aria-pressed for active button
        const activeButton = activeMenuItem.querySelector('button');
        if (activeButton) {
          activeButton.setAttribute('aria-pressed', 'true');
          activeButton.focus();
        }
      }
    }
  
    // Add click event listeners to menu items
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        try {
          const gameName = this.getAttribute('data-game');
          if (gameName) {
            switchGame(gameName);
          }
        } catch (error) {
          console.error('Error switching games:', error);
        }
      });
    });
  
  } catch (error) {
    console.error('Error initializing game menu:', error);
  }
});

// Memory Card Game
document.addEventListener('DOMContentLoaded', () => {
  try {
    const gameContainer = document.getElementById('memory-game');
    const startButton = document.getElementById('start-game');
    const resetButton = document.getElementById('reset-game');
    const scoreElement = document.getElementById('score');
    const timeElement = document.getElementById('time');
    
    if (!gameContainer || !startButton || !resetButton || !scoreElement || !timeElement) {
      console.warn('Memory game elements not found');
      return;
    }
  
    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let score = 0;
    let timeLeft = 60;
    window.memoryGameTimer = null;
    window.memoryGameActive = false;
  
    // Card icons (using Font Awesome 6 naming)
    const icons = [
      { name: 'code', prefix: 'fa-solid' },
      { name: 'terminal', prefix: 'fa-solid' },
      { name: 'database', prefix: 'fa-solid' },
      { name: 'cloud', prefix: 'fa-solid' },
      { name: 'square-js', prefix: 'fa-brands' }, // javascript
      { name: 'html5', prefix: 'fa-brands' },
      { name: 'css3-alt', prefix: 'fa-brands' }, // css3
      { name: 'github', prefix: 'fa-brands' }     // git replacement
    ];
  
    // Initialize with a centered start message instead of the grid
    function initializeGameDisplay() {
    // First add the centered-content class to change the display mode
      gameContainer.classList.add('centered-content');
    
      gameContainer.innerHTML = `
      <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
        <p class="text-xl mb-4">Memory Card Game</p>
        <p>Test your memory by matching pairs of tech icons!</p>
        <p class="mt-4">Click "Start Game" to begin</p>
      </div>
    `;
    }
  
    // Run initialization
    initializeGameDisplay();
  
    function startGame() {
      if (window.memoryGameActive) return;

      window.memoryGameActive = true;
      score = 0;
      timeLeft = 60;
      scoreElement.textContent = score;
      timeElement.textContent = timeLeft;
    
      // Remove the centered-content class before creating the grid
      gameContainer.classList.remove('centered-content');
    
      // Create cards
      createCards();
    
      // Start timer
      window.memoryGameTimer = setInterval(() => {
        timeLeft--;
        timeElement.textContent = timeLeft;
      
        if (timeLeft <= 0) {
          endGame(false); // Game lost - time ran out
        }
      }, 1000);
    
      startButton.disabled = true;
      resetButton.disabled = false;
    }
  
    function createCards() {
      gameContainer.innerHTML = '';
      cards = [];
    
      // Double the icons to create pairs
      const cardIcons = [...icons, ...icons];
    
      // Shuffle the icons
      window.GameUtils.shuffleArray(cardIcons);
    
      // Create card elements
      cardIcons.forEach((icon) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.icon = icon.name;
      
        // Create front face (icon)
        const frontFace = document.createElement('div');
        frontFace.classList.add('card-front');
        const frontIcon = document.createElement('i');
        frontIcon.className = `${icon.prefix} fa-${icon.name}`;
        frontFace.appendChild(frontIcon);
      
        // Create back face (question mark)
        const backFace = document.createElement('div');
        backFace.classList.add('card-back');
        const backIcon = document.createElement('i');
        backIcon.className = 'fa-solid fa-question';
        backFace.appendChild(backIcon);
      
        // Add faces to card
        card.appendChild(frontFace);
        card.appendChild(backFace);
      
        card.addEventListener('click', flipCard);
        gameContainer.appendChild(card);
        cards.push(card);
      });
    }
  
    function flipCard() {
      if (lockBoard) return;
      if (this === firstCard) return;
    
      this.classList.add('flipped');
    
      if (!hasFlippedCard) {
      // First card flipped
        hasFlippedCard = true;
        firstCard = this;
        return;
      }
    
      // Second card flipped
      secondCard = this;
      checkForMatch();
    }
  
    function checkForMatch() {
      const isMatch = window.MemoryGameUtils.isMemoryMatch(
        firstCard.dataset.icon,
        secondCard.dataset.icon
      );

      if (isMatch) {
        disableCards();
        score = window.MemoryGameUtils.updateMemoryScore(score, true);
        scoreElement.textContent = score;
      } else {
        unflipCards();
      }
    }
  
    function disableCards() {
      firstCard.removeEventListener('click', flipCard);
      secondCard.removeEventListener('click', flipCard);
    
      firstCard.classList.add('matched');
      secondCard.classList.add('matched');
    
      resetBoard();
    
      // Check if all cards are matched
      if (window.MemoryGameUtils.isMemoryGameComplete(
        document.querySelectorAll('.memory-card.matched').length,
        cards.length
      )) {
        endGame(true); // Game won - all cards matched
      }
    }
  
    function unflipCards() {
      lockBoard = true;
    
      setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
      
        resetBoard();
      }, 1000);
    }
  
    function resetBoard() {
      [hasFlippedCard, lockBoard] = [false, false];
      [firstCard, secondCard] = [null, null];
    }
  
    function resetGame() {
      clearInterval(window.memoryGameTimer);
      window.memoryGameActive = false;
    
      // Reset to initial display
      initializeGameDisplay();
    
      startButton.disabled = false;
      resetButton.disabled = true;
    
      score = 0;
      timeLeft = 60;
      scoreElement.textContent = score;
      timeElement.textContent = timeLeft;
    
      resetBoard();
    }
  
    function endGame(won = false) {
      clearInterval(window.memoryGameTimer);
      window.memoryGameActive = false;
      lockBoard = true;
    
      // Show result message
      gameContainer.classList.add('centered-content');
      if (won) {
        gameContainer.innerHTML = `
        <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
          <p class="text-2xl mb-4 text-green-400">🎉 You Won!</p>
          <p class="text-lg mb-2">All cards matched!</p>
          <p>Final Score: <strong>${score}</strong></p>
          <p>Time Remaining: <strong>${timeLeft}s</strong></p>
          <p class="mt-4 text-gray-300">Click "Reset" to play again</p>
        </div>
      `;
      } else {
        gameContainer.innerHTML = `
        <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
          <p class="text-2xl mb-4 text-red-400">⏰ Time's Up!</p>
          <p class="text-lg mb-2">Better luck next time!</p>
          <p>Final Score: <strong>${score}</strong></p>
          <p class="mt-4 text-gray-300">Click "Reset" to try again</p>
        </div>
      `;
      }
    
      startButton.disabled = false;
      resetButton.disabled = false; // Enable reset so user can play again
    }
  
    // Event listeners
    if (startButton && resetButton) {
      startButton.addEventListener('click', startGame);
      resetButton.addEventListener('click', resetGame);
    }
  
  } catch (error) {
    console.error('Error initializing memory game:', error);
  }
}); 

// Snake Game
document.addEventListener('DOMContentLoaded', () => {
  try {
    const snakeContainer = document.getElementById('snake-game');
    const snakeStartButton = document.getElementById('start-snake');
    const snakeResetButton = document.getElementById('reset-snake');
    const snakeScoreElement = document.getElementById('snake-score');
    
    if (!snakeContainer || !snakeStartButton || !snakeResetButton || !snakeScoreElement) {
      console.warn('Snake game elements not found');
      return;
    }
  
    let canvas, ctx;
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right'; // Buffer for next direction change
    let gameSpeed = 150;
    let snakeSize = 20;
    let snakeScore = 0;
    window.snakeGameInterval = null;
    window.snakeGameActive = false;
  
    // Initialize with a centered start message
    function initSnakeDisplay() {
      snakeContainer.classList.add('centered-content');
      snakeContainer.innerHTML = `
      <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
        <p class="text-xl mb-4">Snake Game</p>
        <p>Control the snake using arrow keys or touch controls</p>
        <p>Eat the red food to grow and earn points!</p>
        <p class="mt-4">Click "Start Game" to begin</p>
      </div>
    `;
    }
  
    function initSnakeGame() {
    // Remove the centered-content class
      snakeContainer.classList.remove('centered-content');
    
      // Calculate responsive canvas size
      const containerWidth = snakeContainer.offsetWidth || 400; // Fallback if container not ready
      const maxCanvasSize = Math.min(400, containerWidth - 40); // 40px for padding
      const canvasSize = Math.max(snakeSize * 10, Math.floor(maxCanvasSize / snakeSize) * snakeSize); // Ensure minimum size
    
      // Create canvas
      canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      canvas.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      canvas.style.borderRadius = '0.25rem';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
    
      ctx = canvas.getContext('2d');
      snakeContainer.innerHTML = '';
      snakeContainer.appendChild(canvas);
    
      // Initialize snake (ensure it's properly aligned to grid)
      snake = [
        { x: 3 * snakeSize, y: 3 * snakeSize },
        { x: 2 * snakeSize, y: 3 * snakeSize },
        { x: 1 * snakeSize, y: 3 * snakeSize }
      ];
    
      // Reset direction
      direction = 'right';
      nextDirection = 'right';
    
      // Create first food
      createFood();
    }
  
    function startSnakeGame() {
      if (window.snakeGameActive) return;
    
      window.snakeGameActive = true;
      snakeScore = 0;
      snakeScoreElement.textContent = snakeScore;
    
      // Reset direction to ensure consistent start
      direction = 'right';
      nextDirection = 'right';
    
      // Initial setup
      initSnakeGame();
    
      // Define and store the keyboard handler
      window.snakeKeyboardHandler = changeDirection;
    
      // Add keyboard controls
      document.addEventListener('keydown', window.snakeKeyboardHandler);
    
      // Add touch controls for mobile
      addTouchControls();
    
      // Start game loop
      window.snakeGameInterval = setInterval(gameLoop, gameSpeed);
    
      snakeStartButton.disabled = true;
      snakeResetButton.disabled = false;
    }
  
    function addTouchControls() {
      const touchControlsContainer = document.createElement('div');
      touchControlsContainer.className = 'touch-controls';
    
      const directions = [
        { dir: 'up', icon: 'fa-arrow-up' },
        { dir: 'left', icon: 'fa-arrow-left' },
        { dir: 'right', icon: 'fa-arrow-right' },
        { dir: 'down', icon: 'fa-arrow-down' }
      ];
    
      directions.forEach(d => {
        const btn = document.createElement('button');
        btn.className = 'touch-btn';
        btn.innerHTML = `<i class="fas ${d.icon}"></i>`;
        btn.setAttribute('data-direction', d.dir);
        btn.addEventListener('click', function() {
          const dir = this.getAttribute('data-direction');
          handleDirectionChange(dir);
        });
        touchControlsContainer.appendChild(btn);
      });
    
      snakeContainer.appendChild(touchControlsContainer);
    }
  
    function handleDirectionChange(newDirection) {
      nextDirection = window.SnakeLogic.resolveDirectionChange(
        direction,
        nextDirection,
        newDirection
      );
    }
  
    function changeDirection(e) {
    // Prevent default browser scrolling behavior for arrow keys
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }
    
      nextDirection = window.SnakeLogic.resolveKeyboardDirection(
        e.key,
        direction,
        nextDirection
      );
    }
  
    function gameLoop() {
      if (!window.snakeGameActive) return;
    
      // Apply queued direction change at the start of each game loop
      const previousDirection = direction;
      direction = nextDirection;
      if (previousDirection !== direction) {
      }
    
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    
      // Move snake
      moveSnake();
    
      // Check if food eaten (before collision check to avoid issues)
      let foodEaten = false;
      if (window.SnakeLogic.isFoodEaten(snake[0], food)) {
      // Increase score
        snakeScore += 10;
        snakeScoreElement.textContent = snakeScore;
      
        // Create new food
        createFood();
        foodEaten = true;
      }
    
      // Check collisions
      if (checkCollision()) {
        endSnakeGame();
        return;
      }
    
      // Remove tail only if no food was eaten (this makes snake grow when food eaten)
      if (!foodEaten) {
        snake.pop();
      }
    
      // Draw food
      drawFood();
    
      // Draw snake
      drawSnake();
    }
  
    function moveSnake() {
      const head = window.SnakeLogic.getNextHead(snake[0], direction, snakeSize);
      snake.unshift(head);
    }

    function checkCollision() {
      return window.SnakeLogic.hasCollision(snake[0], snake, canvas.width, canvas.height);
    }
  
    function createFood() {
    // Create food at random position (aligned to grid)
      const gridWidth = canvas.width / snakeSize;
      const gridHeight = canvas.height / snakeSize;
    
      let attempts = 0;
      const maxAttempts = gridWidth * gridHeight; // Prevent infinite recursion
    
      do {
        food = {
          x: Math.floor(Math.random() * gridWidth) * snakeSize,
          y: Math.floor(Math.random() * gridHeight) * snakeSize
        };
        attempts++;
      
        // Check if food position conflicts with snake
        let conflictFound = false;
        for (let i = 0; i < snake.length; i++) {
          if (food.x === snake[i].x && food.y === snake[i].y) {
            conflictFound = true;
            break;
          }
        }
      
        if (!conflictFound) {
          return; // Found valid position
        }
      
      } while (attempts < maxAttempts);
    
      // If we can't find a valid position (game nearly won), place food at 0,0
      food = { x: 0, y: 0 };
    }
  
    function drawSnake() {
      snake.forEach((segment, index) => {
      // Make head a different color
        if (index === 0) {
          ctx.fillStyle = '#22c55e'; // Green
        } else {
          ctx.fillStyle = '#4ade80'; // Light green
        }
      
        ctx.fillRect(segment.x, segment.y, snakeSize, snakeSize);
      
        // Add border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeRect(segment.x, segment.y, snakeSize, snakeSize);
      });
    }
  
    function drawFood() {
      ctx.fillStyle = '#f87171'; // Red
      ctx.fillRect(food.x, food.y, snakeSize, snakeSize);
    
      // Add border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.strokeRect(food.x, food.y, snakeSize, snakeSize);
    }
  
    function resetSnakeGame() {
      endSnakeGame();
    
      // Reset to initial display
      initSnakeDisplay();
    
      // Reset game state
      snake = [];
      food = {};
      snakeScore = 0;
      snakeScoreElement.textContent = snakeScore;
      direction = 'right';
      nextDirection = 'right';
      gameSpeed = 150;
    
      snakeStartButton.disabled = false;
      snakeResetButton.disabled = true;
    }
  
    function endSnakeGame() {
      clearInterval(window.snakeGameInterval);
    
      // Remove keyboard event listener
      if (window.snakeKeyboardHandler) {
        document.removeEventListener('keydown', window.snakeKeyboardHandler);
      }
    
      window.snakeGameActive = false;
    
      if (canvas && ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText(`Score: ${snakeScore}`, canvas.width / 2, canvas.height / 2 + 20);
      }
    
      snakeStartButton.disabled = false;
      snakeResetButton.disabled = false; // Keep reset button enabled so user can reset after game over
    }
  
    // Event listeners
    if (snakeStartButton && snakeResetButton) {
      snakeStartButton.addEventListener('click', startSnakeGame);
      snakeResetButton.addEventListener('click', resetSnakeGame);
    }
  
  } catch (error) {
    console.error('Error initializing snake game:', error);
  }
});

// Typing Speed Test Game
document.addEventListener('DOMContentLoaded', () => {
  try {
    const typingContainer = document.getElementById('typing-game');
    const typingStartButton = document.getElementById('start-typing');
    const typingResetButton = document.getElementById('reset-typing');
    const wpmElement = document.getElementById('typing-wpm');
    const accuracyElement = document.getElementById('typing-accuracy');
    
    if (!typingContainer || !typingStartButton || !typingResetButton || !wpmElement || !accuracyElement) {
      console.warn('Typing game elements not found');
      return;
    }
  
    let startTime;
    window.typingTimerInterval = null;
    window.typingGameActive = false;
    let totalTyped = 0;
    let correctTyped = 0;
    let sentencesCompleted = 0;
    let totalCharactersTyped = 0;
    let totalCorrectCharacters = 0;
  
    // Collection of text prompts for typing test
    const textPrompts = [
      'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.',
      'Programming is the process of creating a set of instructions that tell a computer how to perform a task.',
      'The greatest glory in living lies not in never falling, but in rising every time we fall. -Nelson Mandela',
      "Good code is its own best documentation. As you're about to add a comment, ask yourself if you can improve the code instead.",
      'Any fool can write code that a computer can understand. Good programmers write code that humans can understand. -Martin Fowler'
    ];
  
    // Initialize with a centered start message
    function initTypingDisplay() {
      typingContainer.classList.add('centered-content');
      typingContainer.innerHTML = `
      <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
        <p class="text-xl mb-4">Typing Speed Test</p>
        <p>Test your typing speed and accuracy!</p>
        <p class="mt-4">Click "Start Test" to begin</p>
      </div>
    `;
    }
  
    function initTypingGame() {
    // Remove the centered-content class
      typingContainer.classList.remove('centered-content');
      typingContainer.innerHTML = '';
    
      // Create typing game elements
      const gameWrapper = document.createElement('div');
      gameWrapper.className = 'typing-wrapper';
    
      // Text display area
      const textDisplay = document.createElement('div');
      textDisplay.id = 'text-display';
      textDisplay.className = 'text-display';
    
      // Typing input
      const typingInput = document.createElement('input');
      typingInput.type = 'text';
      typingInput.id = 'typing-input';
      typingInput.className = 'typing-input';
      typingInput.disabled = true;
      typingInput.placeholder = 'Type here when the game starts...';
    
      // Timer display
      const timerDisplay = document.createElement('div');
      timerDisplay.id = 'timer-display';
      timerDisplay.className = 'timer-display';
      timerDisplay.textContent = '60';
    
      // Sentences counter display
      const sentenceCounter = document.createElement('div');
      sentenceCounter.id = 'sentence-counter';
      sentenceCounter.className = 'sentence-counter';
      sentenceCounter.textContent = 'Sentences: 0';
    
      // Create a stats row for timer and counter
      const statsRow = document.createElement('div');
      statsRow.className = 'typing-stats-row';
      statsRow.appendChild(timerDisplay);
      statsRow.appendChild(sentenceCounter);
    
      // Append elements
      gameWrapper.appendChild(textDisplay);
      gameWrapper.appendChild(typingInput);
      gameWrapper.appendChild(statsRow);
      typingContainer.appendChild(gameWrapper);
    }
  
    function startTypingGame() {
      if (window.typingGameActive) return;
    
      window.typingGameActive = true;
      totalTyped = 0;
      correctTyped = 0;
      sentencesCompleted = 0;
      totalCharactersTyped = 0;
      totalCorrectCharacters = 0;
    
      // Initialize game
      initTypingGame();
    
      // Load first sentence
      loadNewSentence();
    
      // Get elements
      const typingInput = document.getElementById('typing-input');
      const timerDisplay = document.getElementById('timer-display');
    
      // Enable input and focus
      typingInput.disabled = false;
      typingInput.value = '';
      typingInput.focus();
    
      // Start timer (60 seconds)
      let timeLeft = 60;
      timerDisplay.textContent = timeLeft;
    
      startTime = new Date();
      window.typingTimerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
      
        if (timeLeft <= 0) {
          endTypingGame();
        }
      }, 1000);
    
      // Add input event listener
      typingInput.addEventListener('input', checkTyping);
    
      typingStartButton.disabled = true;
      typingResetButton.disabled = false;
    }
  
    function loadNewSentence() {
      const textDisplay = document.getElementById('text-display');
      const typingInput = document.getElementById('typing-input');
    
      // Select random prompt
      const randomIndex = Math.floor(Math.random() * textPrompts.length);
      const currentPrompt = textPrompts[randomIndex];
    
      // Display text character by character with spans for tracking
      textDisplay.innerHTML = '';
      currentPrompt.split('').forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        textDisplay.appendChild(charSpan);
      });
    
      // Clear input for new sentence
      if (typingInput) {
        typingInput.value = '';
        totalTyped = 0;
        correctTyped = 0;
      }
    }
  
    function checkTyping() {
      const textDisplay = document.getElementById('text-display');
      const typingInput = document.getElementById('typing-input');
    
      const arrayPrompt = textDisplay.querySelectorAll('span');
      const arrayValue = typingInput.value.split('');
    
      let correct = true;
    
      totalTyped = arrayValue.length;
      correctTyped = 0;
    
      arrayPrompt.forEach((characterSpan, index) => {
        const character = arrayValue[index];
      
        // If character hasn't been typed yet
        if (character == null) {
          characterSpan.classList.remove('correct');
          characterSpan.classList.remove('incorrect');
          correct = false;
        }
        // If character is correct
        else if (character === characterSpan.textContent) {
          characterSpan.classList.add('correct');
          characterSpan.classList.remove('incorrect');
          correctTyped++;
        }
        // If character is incorrect
        else {
          characterSpan.classList.remove('correct');
          characterSpan.classList.add('incorrect');
          correct = false;
        }
      });
    
      // If all characters are correct, load new sentence instead of ending
      if (correct && arrayValue.length === arrayPrompt.length) {
      // Update cumulative stats
        totalCharactersTyped += totalTyped;
        totalCorrectCharacters += correctTyped;
        sentencesCompleted++;
      
        // Update sentence counter display
        const sentenceCounter = document.getElementById('sentence-counter');
        if (sentenceCounter) {
          sentenceCounter.textContent = `Sentences: ${sentencesCompleted}`;
        }
      
        // Load new sentence if game is still active
        if (window.typingGameActive) {
          setTimeout(() => {
            loadNewSentence();
          }, 500); // Brief pause before new sentence
        }
      }
    
      // Update stats in real-time
      updateStats();
    }
  
    function updateStats() {
    // Calculate words per minute (WPM) based on cumulative stats
    // Assuming 5 characters = 1 word, which is a common standard
      const elapsedMs = new Date() - startTime;
      const wpm = window.TypingStats.calculateWpm(totalCorrectCharacters, correctTyped, elapsedMs);
      const accuracy = window.TypingStats.calculateAccuracy(
        totalCharactersTyped,
        totalTyped,
        totalCorrectCharacters,
        correctTyped
      );
    
      // Update displays
      wpmElement.textContent = wpm;
      accuracyElement.textContent = accuracy;
    }
  
    function resetTypingGame() {
      clearInterval(window.typingTimerInterval);
    
      window.typingGameActive = false;
      typingStartButton.disabled = false;
      typingResetButton.disabled = true;
    
      // Reset to initial display
      initTypingDisplay();
    
      // Reset statistics
      wpmElement.textContent = '0';
      accuracyElement.textContent = '0';
    }
  
    function endTypingGame() {
      clearInterval(window.typingTimerInterval);
      window.typingGameActive = false;
    
      const typingInput = document.getElementById('typing-input');
      if (typingInput) {
        typingInput.disabled = true;
        typingInput.removeEventListener('input', checkTyping);
      }
    
      // Add current sentence stats to totals if user was in middle of typing
      totalCharactersTyped += totalTyped;
      totalCorrectCharacters += correctTyped;
    
      // Final statistics calculation
      const elapsedMs = new Date() - startTime;
      const { wpm: finalWpm, accuracy: finalAccuracy } = window.TypingStats.calculateFinalStats(
        totalCorrectCharacters,
        totalCharactersTyped,
        elapsedMs
      );
    
      // Show final score display
      typingContainer.classList.add('centered-content');
      typingContainer.innerHTML = `
      <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
        <p class="text-2xl mb-4 text-blue-400">🎯 Typing Test Complete!</p>
        <div class="text-lg space-y-2">
          <p><strong>Final WPM:</strong> ${finalWpm}</p>
          <p><strong>Final Accuracy:</strong> ${finalAccuracy}%</p>
          <p><strong>Sentences Completed:</strong> ${sentencesCompleted}</p>
          <p><strong>Total Characters Typed:</strong> ${totalCharactersTyped}</p>
          <p><strong>Correct Characters:</strong> ${totalCorrectCharacters}</p>
        </div>
        <div class="mt-6">
          ${finalWpm >= 60 ? '<p class="text-green-400">🎉 Excellent typing speed!</p>' : 
    finalWpm >= 40 ? '<p class="text-yellow-400">⭐ Good typing speed!</p>' : 
      '<p class="text-blue-400">📝 Keep practicing to improve!</p>'}
        </div>
        <p class="mt-4 text-gray-300">Click "Reset" to try again</p>
      </div>
    `;
    
      typingStartButton.disabled = false;
      typingResetButton.disabled = false;
    
      // Update final displays one more time
      wpmElement.textContent = finalWpm;
      accuracyElement.textContent = finalAccuracy;
    }
  
    // Event listeners
    if (typingStartButton && typingResetButton) {
      typingStartButton.addEventListener('click', startTypingGame);
      typingResetButton.addEventListener('click', resetTypingGame);
    }
  
  } catch (error) {
    console.error('Error initializing typing game:', error);
  }
}); 

// Advanced Music Studio
document.addEventListener('DOMContentLoaded', () => {
  try {
    const startButton = document.getElementById('start-arrow');
    const resetButton = document.getElementById('reset-arrow');
    const gameContainer = document.getElementById('arrow-game');
    
    if (!startButton || !resetButton || !gameContainer) {
      console.warn('Music studio elements not found');
      return;
    }
  
    let isGameActive = false;
    window.arrowGameAudioContext = null;
    let notesPlayed = 0;
  
    // Define comprehensive note frequencies (full chromatic scale with multiple octaves)
    const noteFrequencies = {
    // Octave 3
      'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
      'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65,
      'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
      // Octave 4 (Middle)
      'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30,
      'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
      // Octave 5
      'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
      'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61,
      'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77
    };

    // Enhanced keyboard mapping for piano-style playing
    const keyboardMapping = {
    // Lower row (white keys) - Major scale starting from C4
      'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5',
      // Upper row (black keys) - Sharps/flats
      'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4', 'o': 'C#5', 'p': 'D#5',
      // Number row for octave 3
      '1': 'C3', '2': 'D3', '3': 'E3', '4': 'F3', '5': 'G3', '6': 'A3', '7': 'B3',
      // Arrow keys for special effects and octave 5
      'ArrowUp': 'C5', 'ArrowLeft': 'G4', 'ArrowDown': 'E4', 'ArrowRight': 'A4'
    };

    // Effect types and parameters - ALL ENABLED BY DEFAULT
    let currentEffects = {
      reverb: { enabled: true, roomSize: 0.3, damping: 0.5, wetness: 0.3 },
      delay: { enabled: true, time: 0.3, feedback: 0.3, wetness: 0.3 },
      chorus: { enabled: true, rate: 1.5, depth: 0.3, wetness: 0.5 },
      distortion: { enabled: true, amount: 25, wetness: 0.5 },
      filter: { enabled: true, frequency: 1000, Q: 8, type: 'lowpass' }
    };

    // Current instrument type
    let currentInstrument = 'synth'; // synth, piano, strings, bass

    // Multi-layer recording system
    let isRecording = false;
    let recordedNotes = [];
    let recordingStartTime = 0;
    let isLooping = false;
    let loopInterval = null;
    let currentTempo = 120; // BPM
    let masterVolume = 0.3;
  
    // Multi-layer loop system with individual tempos
    let loopLayers = []; // Array of loop tracks with individual tempo settings
    let activeLoopLayers = new Set(); // Which layers are currently playing
    let maxLoopLayers = 4; // Maximum number of simultaneous loops
    let layerTempos = [120, 120, 120, 120]; // Individual BPM for each layer
    let currentLayerIndex = 0;
  
    // Initialize the advanced music studio
    function initArrowDisplay() {
      gameContainer.classList.add('centered-content');
      gameContainer.innerHTML = `
      <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
        <p class="text-xl mb-4">🎹 Advanced Music Studio</p>
        <p class="mb-2">Create music with a full chromatic keyboard!</p>
        <p class="mb-2">🎵 Use A-K keys for white notes, Q-P for black notes</p>
        <p class="mb-2">🎛️ Apply effects: reverb, delay, chorus & more</p>
        <p class="mb-2">🔄 Record and loop your compositions</p>
        <p class="mt-4">Click "Start" to begin composing!</p>
      </div>
    `;
    }
  
    // Initialize when loaded
    initArrowDisplay();
  
    // Initialize notes counter
    const notesElement = document.getElementById('arrow-notes');
    if (notesElement) {
      notesElement.textContent = '0';
    }
  
    // Create the advanced music studio UI
    function createArrowGameUI() {
      gameContainer.classList.remove('centered-content');
    
      gameContainer.innerHTML = `
      <div class="music-studio">
        <!-- Piano Keyboard Visual -->
        <div class="piano-container">
          <div class="piano-keyboard" id="piano-keyboard">
            <!-- Keys will be generated dynamically -->
          </div>
        </div>
        
        <!-- Control Panel -->
        <div class="control-panel">
          <div class="control-row">
            <div class="control-group">
              <label>🎼 Instrument:</label>
              <select id="instrument-select" class="control-select">
                <option value="synth">🎹 Synthesizer</option>
                <option value="piano">🎵 Piano</option>
                <option value="strings">🎻 Strings</option>
                <option value="bass">🎸 Bass</option>
              </select>
            </div>
            <div class="control-group">
              <label>🔊 Volume:</label>
              <input type="range" id="volume-slider" min="0" max="100" value="30" class="control-slider">
              <span id="volume-display">30%</span>
            </div>
            <div class="control-group">
              <label>⏱️ Tempo:</label>
              <input type="range" id="tempo-slider" min="60" max="180" value="120" class="control-slider">
              <span id="tempo-display">120 BPM</span>
            </div>
          </div>
          
          <!-- Effects Panel -->
          <div class="effects-panel">
            <div class="effects-title">🎛️ Effects</div>
            <div class="effects-grid">
              <div class="effect-control">
                <input type="checkbox" id="reverb-toggle" class="effect-toggle" checked>
                <label for="reverb-toggle">🌊 Reverb</label>
                <input type="range" id="reverb-amount" min="0" max="100" value="30" class="effect-slider">
              </div>
              <div class="effect-control">
                <input type="checkbox" id="delay-toggle" class="effect-toggle" checked>
                <label for="delay-toggle">🔄 Delay</label>
                <input type="range" id="delay-amount" min="0" max="100" value="30" class="effect-slider">
              </div>
              <div class="effect-control">
                <input type="checkbox" id="chorus-toggle" class="effect-toggle" checked>
                <label for="chorus-toggle">🌈 Chorus</label>
                <input type="range" id="chorus-amount" min="0" max="100" value="50" class="effect-slider">
              </div>
              <div class="effect-control">
                <input type="checkbox" id="distortion-toggle" class="effect-toggle" checked>
                <label for="distortion-toggle">⚡ Distortion</label>
                <input type="range" id="distortion-amount" min="0" max="100" value="50" class="effect-slider">
              </div>
              <div class="effect-control">
                <input type="checkbox" id="filter-toggle" class="effect-toggle" checked>
                <label for="filter-toggle">🎛️ Filter</label>
                <input type="range" id="filter-amount" min="0" max="100" value="80" class="effect-slider">
              </div>
            </div>
          </div>
          
          <!-- Recording Panel -->
          <div class="recording-panel">
            <div class="recording-title">🎙️ Multi-Layer Recording</div>
            <div class="recording-controls">
              <button id="record-btn" class="record-btn">⏺️ Record Layer</button>
              <button id="play-btn" class="play-btn" disabled>▶️ Play</button>
              <button id="loop-btn" class="loop-btn" disabled>🔄 Loop Current</button>
              <button id="loop-all-btn" class="loop-btn" disabled>🔄 Loop All</button>
              <button id="clear-btn" class="clear-btn" disabled>🗑️ Clear Current</button>
              <button id="clear-all-btn" class="clear-btn" disabled>🗑️ Clear All</button>
              <button id="save-btn" class="save-btn" disabled>💾 Save</button>
              <button id="load-btn" class="load-btn">📁 Load</button>
            </div>
            <div class="layer-status">
              <div class="layer-info">
                <span>Current Layer: <span id="current-layer">1</span></span>
                <span>Total Layers: <span id="total-layers">0</span></span>
                <span>Layer Tempo: <span id="layer-tempo">120</span> BPM</span>
              </div>
              <div class="layer-controls">
                <button id="prev-layer-btn" class="layer-nav-btn" disabled>◀ Prev</button>
                <button id="next-layer-btn" class="layer-nav-btn" disabled>Next ▶</button>
                <input type="range" id="layer-tempo-slider" min="60" max="200" value="120" class="tempo-slider-small">
              </div>
            </div>
            <div class="recording-info">
              <span id="recording-status">Ready to record layer 1</span>
              <span id="recording-length">0:00</span>
            </div>
            <div class="layers-display" id="layers-display">
              <!-- Layer indicators will be added here -->
            </div>
          </div>
        </div>
        
        <!-- Keyboard Instruction -->
        <div class="keyboard-help">
          <p class="mb-2">🎹 <strong>Keyboard Controls:</strong></p>
          <p>White keys: A S D F G H J K | Black keys: W E T Y U O P</p>
          <p>Lower octave: 1-7 | Higher octave: Arrow keys</p>
        </div>
        
        <!-- Mobile Touch Controls -->
        <div class="mobile-controls">
          <div class="touch-piano-container">
            <div class="touch-key-row">
              <div class="touch-key white-key" data-note="C4">C</div>
              <div class="touch-key black-key" data-note="C#4">C#</div>
              <div class="touch-key white-key" data-note="D4">D</div>
              <div class="touch-key black-key" data-note="D#4">D#</div>
              <div class="touch-key white-key" data-note="E4">E</div>
              <div class="touch-key white-key" data-note="F4">F</div>
              <div class="touch-key black-key" data-note="F#4">F#</div>
              <div class="touch-key white-key" data-note="G4">G</div>
              <div class="touch-key black-key" data-note="G#4">G#</div>
              <div class="touch-key white-key" data-note="A4">A</div>
              <div class="touch-key black-key" data-note="A#4">A#</div>
              <div class="touch-key white-key" data-note="B4">B</div>
            </div>
          </div>
        </div>
      </div>
    `;

      // Generate piano keyboard visual
      generatePianoKeyboard();
    
      // Setup control event listeners
      setupControlListeners();
    
      // Setup touch controls for mobile
      setupTouchControls();
    
      // IMPORTANT: Initialize effects after DOM elements are created
      setTimeout(() => {
        initializeEffectStates();
      }, 100);
    }
  
    // Handle touch events for mobile
    function handleTouchStart(event) {
      if (!isGameActive) return;
    
      // Prevent default behavior to avoid scrolling
      event.preventDefault();
    
      const noteName = this.dataset.note;
      if (!noteName) return;
    
      // Visual effect for button press
      this.classList.add('active');
      setTimeout(() => {
        this.classList.remove('active');
      }, 100);
    
      // Play the note
      playNoteByName(noteName);
    
      // Add visual feedback animation
      this.classList.add('correct');
      setTimeout(() => this.classList.remove('correct'), 300);
    
      // Record if recording is active
      if (isRecording) {
        recordNote(noteName);
      }
    }
  
    // Handle enhanced key press events
    function handleKeyPress(event) {
      if (!isGameActive) return;
    
      const key = event.key.toLowerCase();
    
      // Check if key is mapped to a note
      if (keyboardMapping[key]) {
      // Prevent default browser behavior
        event.preventDefault();
      
        const noteName = keyboardMapping[key];
      
        // Play the note
        playNoteByName(noteName);
      
        // Visual feedback
        highlightKey(key, noteName);
      
        // Record if recording is active
        if (isRecording) {
          recordNote(noteName);
        }
      }
    }
  
    // Initialize Web Audio API
    function initAudio() {
      try {
        window.arrowGameAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Resume audio context if it's suspended (required by browser policies)
        if (window.arrowGameAudioContext.state === 'suspended') {
          window.arrowGameAudioContext.resume().catch(err => {
            console.warn('Failed to resume audio context:', err);
          });
        }
      } catch (error) {
        console.warn('Web Audio API not supported in this browser:', error);
        window.arrowGameAudioContext = null;
      }
    }
  
    // Play a note by name with advanced synthesis
    function playNoteByName(noteName) {
      if (!window.arrowGameAudioContext) return;
    
      // Update notes counter
      notesPlayed++;
      const notesElement = document.getElementById('arrow-notes');
      if (notesElement) {
        notesElement.textContent = notesPlayed;
      }
    
      const frequency = noteFrequencies[noteName];
      if (!frequency) return;
    
      // Create base oscillator based on instrument type
      const oscillator = createInstrumentOscillator(frequency);
    
      // Create effect chain
      const effectChain = createEffectChain();
    
      // Create master gain
      const masterGain = window.arrowGameAudioContext.createGain();
      masterGain.gain.value = masterVolume;
    
      // Connect the audio chain
      oscillator.connect(effectChain.input);
      effectChain.output.connect(masterGain);
      masterGain.connect(window.arrowGameAudioContext.destination);
    
      // Start the oscillator
      oscillator.start();
    
      // Apply envelope based on instrument type
      applyEnvelope(effectChain.output, currentInstrument);
    
      // Stop the oscillator after note duration
      const noteDuration = getNoteDuration(currentInstrument);
      setTimeout(() => {
        try {
          oscillator.stop();
        } catch {
        // Oscillator may have already stopped
        }
      }, noteDuration);
    }
  
    // Create oscillator based on instrument type
    function createInstrumentOscillator(frequency) {
      const oscillator = window.arrowGameAudioContext.createOscillator();
      oscillator.frequency.value = frequency;
    
      switch (currentInstrument) {
        case 'piano':
          oscillator.type = 'triangle';
          break;
        case 'strings':
          oscillator.type = 'sawtooth';
          break;
        case 'bass':
          oscillator.type = 'square';
          break;
        case 'synth':
        default:
          oscillator.type = 'sawtooth';
          break;
      }
    
      return oscillator;
    }
  
    // Create comprehensive effect chain
    function createEffectChain() {
      let input = window.arrowGameAudioContext.createGain();
      let output = input;
    
      // Filter
      if (currentEffects.filter.enabled) {
        const filter = window.arrowGameAudioContext.createBiquadFilter();
        filter.type = currentEffects.filter.type;
        filter.frequency.value = currentEffects.filter.frequency;
        filter.Q.value = currentEffects.filter.Q;
      
        // Add filter envelope for sweep effect
        filter.frequency.setValueAtTime(currentEffects.filter.frequency * 0.5, window.arrowGameAudioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(
          currentEffects.filter.frequency * 2, 
          window.arrowGameAudioContext.currentTime + 0.1
        );
        filter.frequency.exponentialRampToValueAtTime(
          currentEffects.filter.frequency, 
          window.arrowGameAudioContext.currentTime + 0.3
        );
      
        output.connect(filter);
        output = filter;
      }
    
      // Distortion with proper wet/dry mix
      if (currentEffects.distortion.enabled) {
        const distortion = window.arrowGameAudioContext.createWaveShaper();
        distortion.curve = makeDistortionCurve(currentEffects.distortion.amount);
        distortion.oversample = '4x';
      
        const dryGain = window.arrowGameAudioContext.createGain();
        const wetGain = window.arrowGameAudioContext.createGain();
        const mixGain = window.arrowGameAudioContext.createGain();
      
        dryGain.gain.value = 1 - currentEffects.distortion.wetness;
        wetGain.gain.value = currentEffects.distortion.wetness;
      
        // Split signal
        output.connect(dryGain);
        output.connect(distortion);
        distortion.connect(wetGain);
      
        // Mix back together
        dryGain.connect(mixGain);
        wetGain.connect(mixGain);
        output = mixGain;
      
      }
    
      // Delay effect (FIXED: tempo should NOT affect delay characteristics)
      if (currentEffects.delay.enabled) {
        const delayTime = currentEffects.delay.time; // Fixed delay time, not tempo-dependent
        const delayNode = window.arrowGameAudioContext.createDelay(1);
        const delayGain = window.arrowGameAudioContext.createGain();
        const feedbackGain = window.arrowGameAudioContext.createGain();
        const wetGain = window.arrowGameAudioContext.createGain();
        const dryGain = window.arrowGameAudioContext.createGain();
        const mixGain = window.arrowGameAudioContext.createGain();
      
        delayNode.delayTime.value = Math.min(delayTime, 0.8);
        wetGain.gain.value = currentEffects.delay.wetness;
        dryGain.gain.value = 1 - currentEffects.delay.wetness;
        feedbackGain.gain.value = currentEffects.delay.feedback;
      
        // Create delay chain
        output.connect(dryGain);
        output.connect(delayGain);
        delayGain.connect(delayNode);
        delayNode.connect(wetGain);
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayGain); // Feedback loop
      
        // Mix signals
        dryGain.connect(mixGain);
        wetGain.connect(mixGain);
        output = mixGain;
      
      }
    
      // Simple reverb (using multiple delays)
      if (currentEffects.reverb.enabled) {
        const reverbGain = window.arrowGameAudioContext.createGain();
        const dryGain = window.arrowGameAudioContext.createGain();
        const mixGain = window.arrowGameAudioContext.createGain();
      
        reverbGain.gain.value = currentEffects.reverb.wetness;
        dryGain.gain.value = 1 - currentEffects.reverb.wetness;
      
        // Create multiple short delays to simulate reverb
        void [0.03, 0.05, 0.07, 0.09].map(time => {
          const delay = window.arrowGameAudioContext.createDelay();
          const gain = window.arrowGameAudioContext.createGain();
          delay.delayTime.value = time * currentEffects.reverb.roomSize;
          gain.gain.value = 0.3 * (1 - currentEffects.reverb.damping);
        
          output.connect(delay);
          delay.connect(gain);
          gain.connect(reverbGain);
          return { delay, gain };
        });
      
        // Mix dry and wet
        output.connect(dryGain);
        dryGain.connect(mixGain);
        reverbGain.connect(mixGain);
        output = mixGain;
      
      }
    
      // Simple chorus effect (using modulated delay)
      if (currentEffects.chorus.enabled) {
        const chorusDelay = window.arrowGameAudioContext.createDelay(0.05);
        const chorusLFO = window.arrowGameAudioContext.createOscillator();
        const chorusGain = window.arrowGameAudioContext.createGain();
        const chorusDepth = window.arrowGameAudioContext.createGain();
        const dryGain = window.arrowGameAudioContext.createGain();
        const mixGain = window.arrowGameAudioContext.createGain();
      
        // Set up LFO for chorus modulation
        chorusLFO.frequency.value = currentEffects.chorus.rate;
        chorusLFO.type = 'sine';
        chorusDepth.gain.value = currentEffects.chorus.depth * 0.002; // Small modulation
      
        // Connect LFO to delay time
        chorusLFO.connect(chorusDepth);
        chorusDepth.connect(chorusDelay.delayTime);
      
        // Set base delay time
        chorusDelay.delayTime.value = 0.02;
      
        // Set gains
        chorusGain.gain.value = currentEffects.chorus.wetness;
        dryGain.gain.value = 1 - currentEffects.chorus.wetness;
      
        // Connect audio path
        output.connect(chorusDelay);
        chorusDelay.connect(chorusGain);
        output.connect(dryGain);
      
        // Mix signals
        dryGain.connect(mixGain);
        chorusGain.connect(mixGain);
      
        // Start LFO
        chorusLFO.start();
      
        output = mixGain;
      }
    
      return { input, output };
    }
  
    // Create distortion curve
    function makeDistortionCurve(amount) {
      const k = typeof amount === 'number' ? amount : 50;
      const samples = 44100;
      const curve = new Float32Array(samples);
      const deg = Math.PI / 180;
    
      for (let i = 0; i < samples; ++i) {
        const x = (i * 2 / samples) - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
    
      return curve;
    }
  
    // Apply envelope based on instrument type (FIXED: tempo should NOT affect sound quality)
    function applyEnvelope(gainNode, instrument) {
      const now = window.arrowGameAudioContext.currentTime;
    
      switch (instrument) {
        case 'piano':
          gainNode.gain.setValueAtTime(0.01, now);
          gainNode.gain.exponentialRampToValueAtTime(1, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2);
          break;
        case 'strings':
          gainNode.gain.setValueAtTime(0.01, now);
          gainNode.gain.exponentialRampToValueAtTime(0.8, now + 0.3);
          gainNode.gain.exponentialRampToValueAtTime(0.6, now + 1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 3);
          break;
        case 'bass':
          gainNode.gain.setValueAtTime(0.01, now);
          gainNode.gain.exponentialRampToValueAtTime(0.9, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
          break;
        case 'synth':
        default:
          gainNode.gain.setValueAtTime(0.01, now);
          gainNode.gain.exponentialRampToValueAtTime(0.8, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          break;
      }
    }
  
    // Get note duration based on instrument (FIXED: tempo should NOT affect individual note length)
    function getNoteDuration(instrument) {
      switch (instrument) {
        case 'piano': return 2000;
        case 'strings': return 3000;
        case 'bass': return 1000;
        case 'synth':
        default: return 800;
      }
    }
  
    // Tempo-based metronome click (visual feedback)
    function addTempoFeedback() {
      const tempoDisplay = document.getElementById('tempo-display');
      if (tempoDisplay && currentTempo > 0) {
        const beatInterval = 60000 / currentTempo; // ms per beat
      
        // Clear existing tempo feedback
        if (window.tempoFeedbackInterval) {
          clearInterval(window.tempoFeedbackInterval);
        }
      
        // Add visual beat indicator
        window.tempoFeedbackInterval = setInterval(() => {
          if (tempoDisplay) {
            tempoDisplay.style.color = '#4ade80';
            setTimeout(() => {
              if (tempoDisplay) {
                tempoDisplay.style.color = '#e0e0e0';
              }
            }, 100);
          }
        }, beatInterval);
      }
    }
  
    // Generate piano keyboard visual
    function generatePianoKeyboard() {
      const pianoKeyboard = document.getElementById('piano-keyboard');
      if (!pianoKeyboard) return;
    
      const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      const blackKeys = [['C#4'], ['D#4'], [], ['F#4'], ['G#4'], ['A#4'], []];
    
      pianoKeyboard.innerHTML = '';
    
      // Create white keys
      whiteKeys.forEach((note, index) => {
        const key = document.createElement('div');
        key.className = 'piano-key white-key';
        key.dataset.note = note;
        key.textContent = note;
      
        // Add black key if it exists
        if (blackKeys[index] && blackKeys[index].length > 0) {
          const blackKey = document.createElement('div');
          blackKey.className = 'piano-key black-key';
          blackKey.dataset.note = blackKeys[index][0];
          blackKey.textContent = blackKeys[index][0];
          key.appendChild(blackKey);
        }
      
        pianoKeyboard.appendChild(key);
      });
    
      // Add click event listeners to piano keys
      pianoKeyboard.addEventListener('click', (e) => {
        if (e.target.classList.contains('piano-key')) {
          const noteName = e.target.dataset.note;
          if (noteName) {
            playNoteByName(noteName);
            highlightPianoKey(noteName);
          
            if (isRecording) {
              recordNote(noteName);
            }
          }
        }
      });
    }

    // Start the music maker
    function startArrowGame() {
      if (isGameActive) return;
    
      isGameActive = true;
    
      // Reset notes counter
      notesPlayed = 0;
      const notesElement = document.getElementById('arrow-notes');
      if (notesElement) {
        notesElement.textContent = notesPlayed;
      }
    
      // Create the UI
      createArrowGameUI();
    
      // Init audio context
      initAudio();
    
      // Set up keyboard event handler
      window.arrowKeyboardHandler = handleKeyPress;
      document.addEventListener('keydown', window.arrowKeyboardHandler);
    
      // Start tempo feedback
      addTempoFeedback();
    
      // Log initial state for debugging
    
      startButton.disabled = true;
      resetButton.disabled = false;
    }
  
    // Setup control panel event listeners
    function setupControlListeners() {
    // Instrument selector
      const instrumentSelect = document.getElementById('instrument-select');
      if (instrumentSelect) {
        instrumentSelect.addEventListener('change', (e) => {
          currentInstrument = e.target.value;
        });
      }
    
      // Volume control
      const volumeSlider = document.getElementById('volume-slider');
      const volumeDisplay = document.getElementById('volume-display');
      if (volumeSlider && volumeDisplay) {
        volumeSlider.addEventListener('input', (e) => {
          masterVolume = e.target.value / 100;
          volumeDisplay.textContent = e.target.value + '%';
        });
      }
    
      // Tempo control
      const tempoSlider = document.getElementById('tempo-slider');
      const tempoDisplay = document.getElementById('tempo-display');
      if (tempoSlider && tempoDisplay) {
        tempoSlider.addEventListener('input', (e) => {
          currentTempo = parseInt(e.target.value);
          tempoDisplay.textContent = e.target.value + ' BPM';
          addTempoFeedback(); // Start visual tempo feedback
        });
      }
    
      // Effect toggles and sliders
      setupEffectControls();
    
      // Recording controls
      setupRecordingControls();
    }
  
    // Initialize effect states after DOM is ready
    function initializeEffectStates() {
      const effects = ['reverb', 'delay', 'chorus', 'distortion', 'filter'];
    
    
      effects.forEach(effect => {
        const toggle = document.getElementById(`${effect}-toggle`);
        const slider = document.getElementById(`${effect}-amount`);
      
        if (toggle && currentEffects[effect]) {
        // Set toggle to match currentEffects state
          toggle.checked = currentEffects[effect].enabled;
        
          if (slider) {
          // Set slider state based on toggle
            slider.disabled = !currentEffects[effect].enabled;
          
            // Set slider value
            if (effect === 'distortion') {
              slider.value = currentEffects[effect].amount;
            } else if (effect === 'filter') {
              slider.value = currentEffects[effect].frequency / 50;
            } else {
              slider.value = currentEffects[effect].wetness * 100;
            }
          }
        } else {
        }
      });
    }

    // Setup effect controls (event listeners only)
    function setupEffectControls() {
      const effects = ['reverb', 'delay', 'chorus', 'distortion', 'filter'];
    
      effects.forEach(effect => {
        const toggle = document.getElementById(`${effect}-toggle`);
        const slider = document.getElementById(`${effect}-amount`);
      
        if (toggle) {
          toggle.addEventListener('change', (e) => {
            currentEffects[effect].enabled = e.target.checked;
            if (slider) {
              slider.disabled = !e.target.checked;
            }
          });
        }
      
        if (slider) {
          slider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            if (effect === 'distortion') {
              currentEffects[effect].amount = parseInt(e.target.value);
              currentEffects[effect].wetness = value;
            } else if (effect === 'filter') {
              currentEffects[effect].frequency = parseInt(e.target.value) * 50;
            } else {
              currentEffects[effect].wetness = value;
            }
          });
        }
      });
    }

    function stopAllLoops() {
      [...activeLoopLayers].forEach(layerIndex => {
        stopLayerLoop(layerIndex);
      });

      const loopAllBtn = document.getElementById('loop-all-btn');
      if (loopAllBtn) {
        loopAllBtn.textContent = '🔄 Loop All';
        loopAllBtn.classList.remove('active');
      }
    }

    function resetMusicStudioState() {
      stopAllLoops();
      activeLoopLayers.clear();

      if (window.layerIntervals) {
        window.layerIntervals.forEach(intervalId => clearInterval(intervalId));
        window.layerIntervals.clear();
      }

      if (loopInterval) {
        clearInterval(loopInterval);
        loopInterval = null;
      }

      if (window.tempoFeedbackInterval) {
        clearInterval(window.tempoFeedbackInterval);
        window.tempoFeedbackInterval = null;
      }

      loopLayers = [];
      layerTempos = [120, 120, 120, 120];
      currentLayerIndex = 0;
      recordedNotes = [];
      isLooping = false;
      isRecording = false;
    }

    function closeMusicStudioAudio() {
      if (window.arrowGameAudioContext && window.arrowGameAudioContext.state !== 'closed') {
        window.arrowGameAudioContext.close().catch(err => {
          console.warn('Failed to close music studio audio context:', err);
        });
        window.arrowGameAudioContext = null;
      }
    }

    function cleanupMusicStudio() {
      if (window.arrowKeyboardHandler) {
        document.removeEventListener('keydown', window.arrowKeyboardHandler);
        window.arrowKeyboardHandler = null;
      }

      resetMusicStudioState();
      closeMusicStudioAudio();
      isGameActive = false;
    }

    window.cleanupMusicStudio = cleanupMusicStudio;

    // Reset the music maker
    function resetArrowGame() {
      cleanupMusicStudio();
      notesPlayed = 0;

      const notesElement = document.getElementById('arrow-notes');
      if (notesElement) {
        notesElement.textContent = '0';
      }

      initArrowDisplay();

      startButton.disabled = false;
      resetButton.disabled = true;
    }
  
    // Setup recording controls
    function setupRecordingControls() {
      const recordBtn = document.getElementById('record-btn');
      const playBtn = document.getElementById('play-btn');
      const loopBtn = document.getElementById('loop-btn');
      const loopAllBtn = document.getElementById('loop-all-btn');
      const clearBtn = document.getElementById('clear-btn');
      const clearAllBtn = document.getElementById('clear-all-btn');
      const saveBtn = document.getElementById('save-btn');
      const loadBtn = document.getElementById('load-btn');
      const prevLayerBtn = document.getElementById('prev-layer-btn');
      const nextLayerBtn = document.getElementById('next-layer-btn');
    
      if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
      }
      if (playBtn) {
        playBtn.addEventListener('click', playRecording);
      }
      if (loopBtn) {
        loopBtn.addEventListener('click', toggleLoop);
      }
      if (loopAllBtn) {
        loopAllBtn.addEventListener('click', toggleLoopAll);
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', clearCurrentLayer);
      }
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllLayers);
      }
      if (saveBtn) {
        saveBtn.addEventListener('click', saveRecording);
      }
      if (loadBtn) {
        loadBtn.addEventListener('click', loadRecording);
      }
      if (prevLayerBtn) {
        prevLayerBtn.addEventListener('click', switchToPrevLayer);
      }
      if (nextLayerBtn) {
        nextLayerBtn.addEventListener('click', switchToNextLayer);
      }
    
      // Layer tempo control
      const layerTempoSlider = document.getElementById('layer-tempo-slider');
      if (layerTempoSlider) {
        const tempoHandler = (e) => {
          const newTempo = parseInt(e.target.value, 10);
          layerTempos[currentLayerIndex] = newTempo;
          const layerTempoDisplay = document.getElementById('layer-tempo');
          if (layerTempoDisplay) {
            layerTempoDisplay.textContent = newTempo;
          }

          if (activeLoopLayers.has(currentLayerIndex)) {
            stopLayerLoop(currentLayerIndex);

            const notesToPlay = recordedNotes.length > 0 ? recordedNotes :
              (loopLayers[currentLayerIndex] ? loopLayers[currentLayerIndex].notes : []);

            if (notesToPlay.length > 0) {
              setTimeout(() => {
                startLayerLoop(currentLayerIndex, notesToPlay);
              }, 200);
            }
          }
        };

        layerTempoSlider.addEventListener('input', tempoHandler);
        layerTempoSlider.addEventListener('change', tempoHandler);
      }
    }
  
    // Setup touch controls for mobile
    function setupTouchControls() {
      document.querySelectorAll('.touch-key').forEach(key => {
        key.addEventListener('touchstart', handleTouchStart);
        key.addEventListener('click', handleTouchStart);
      });
    }
  
    // Highlight key visual feedback
    function highlightKey(keyCode, noteName) {
    // Highlight keyboard key mapping visualization if present
      const keyElement = document.querySelector(`[data-key=\"${keyCode}\"]`);
      if (keyElement) {
        keyElement.classList.add('active');
        setTimeout(() => keyElement.classList.remove('active'), 100);
      }
    
      // Highlight piano key
      highlightPianoKey(noteName);
    }
  
    // Highlight piano key
    function highlightPianoKey(noteName) {
      const pianoKey = document.querySelector(`[data-note=\"${noteName}\"]`);
      if (pianoKey) {
        pianoKey.classList.add('active');
        setTimeout(() => pianoKey.classList.remove('active'), 200);
      }
    }
  
    // Recording functions
    function toggleRecording() {
      const recordBtn = document.getElementById('record-btn');
      const statusElement = document.getElementById('recording-status');
    
      if (isRecording) {
      // Stop recording and save to current layer
        isRecording = false;
        recordBtn.textContent = '⏺️ Record Layer';
        recordBtn.classList.remove('recording');
      
        // Save the current recording to the layer
        if (recordedNotes.length > 0) {
          saveCurrentRecordingToLayer();
          statusElement.textContent = `Layer ${currentLayerIndex + 1}: ${recordedNotes.length} notes recorded`;
        
          // Enable controls
          document.getElementById('play-btn').disabled = false;
          document.getElementById('loop-btn').disabled = false;
          document.getElementById('loop-all-btn').disabled = false;
          document.getElementById('clear-btn').disabled = false;
          document.getElementById('save-btn').disabled = false;
        }
      } else {
      // Start recording new layer
        isRecording = true;
        recordedNotes = [];
        recordingStartTime = Date.now();
        recordBtn.textContent = '⏹️ Stop Recording';
        recordBtn.classList.add('recording');
        statusElement.textContent = `Recording layer ${currentLayerIndex + 1}...`;
      }
    }
  
    function saveCurrentRecordingToLayer() {
    // Ensure we have enough layers
      while (loopLayers.length <= currentLayerIndex) {
        loopLayers.push({ notes: [], name: `Layer ${loopLayers.length + 1}` });
      }
    
      // Save current recording to the layer
      loopLayers[currentLayerIndex].notes = [...recordedNotes];
    
      updateLayerDisplay();
      updateLayerCounts();
    }
  
    function updateLayerDisplay() {
      const layersDisplay = document.getElementById('layers-display');
      if (!layersDisplay) return;
    
      layersDisplay.innerHTML = '';
    
      loopLayers.forEach((layer, index) => {
        const layerElement = document.createElement('div');
        layerElement.className = `layer-indicator ${index === currentLayerIndex ? 'current' : ''}`;
        layerElement.innerHTML = `
        <span class="layer-number">${index + 1}</span>
        <span class="layer-notes">${layer.notes.length} notes</span>
        <span class="layer-status ${activeLoopLayers.has(index) ? 'playing' : 'stopped'}">
          ${activeLoopLayers.has(index) ? '▶️' : '⏸️'}
        </span>
      `;
        layersDisplay.appendChild(layerElement);
      });
    }
  
    function updateLayerCounts() {
      document.getElementById('current-layer').textContent = currentLayerIndex + 1;
      document.getElementById('total-layers').textContent = loopLayers.length;
    
      // Update navigation buttons
      document.getElementById('prev-layer-btn').disabled = currentLayerIndex === 0;
      document.getElementById('next-layer-btn').disabled = currentLayerIndex >= maxLoopLayers - 1;
      document.getElementById('clear-all-btn').disabled = loopLayers.length === 0;
    }
  
    function switchToPrevLayer() {
      if (currentLayerIndex > 0) {
        currentLayerIndex--;
        switchToLayer(currentLayerIndex);
      }
    }
  
    function switchToNextLayer() {
      if (currentLayerIndex < maxLoopLayers - 1) {
        currentLayerIndex++;
        switchToLayer(currentLayerIndex);
      }
    }
  
    function switchToLayer(layerIndex) {
      currentLayerIndex = layerIndex;
    
      // Load the layer's recorded notes
      if (loopLayers[layerIndex]) {
        recordedNotes = [...loopLayers[layerIndex].notes];
      } else {
        recordedNotes = [];
      }
    
      // Update UI
      updateLayerDisplay();
      updateLayerCounts();
    
      // Update layer tempo display and slider
      const layerTempo = layerTempos[layerIndex] || 120;
      document.getElementById('layer-tempo').textContent = layerTempo;
      const layerTempoSlider = document.getElementById('layer-tempo-slider');
      if (layerTempoSlider) {
        layerTempoSlider.value = layerTempo;
      }
    
      const statusElement = document.getElementById('recording-status');
      if (recordedNotes.length > 0) {
        statusElement.textContent = `Layer ${layerIndex + 1}: ${recordedNotes.length} notes @ ${layerTempo} BPM`;
        document.getElementById('play-btn').disabled = false;
        document.getElementById('loop-btn').disabled = false;
        document.getElementById('clear-btn').disabled = false;
      } else {
        statusElement.textContent = `Ready to record layer ${layerIndex + 1} @ ${layerTempo} BPM`;
        document.getElementById('play-btn').disabled = true;
        document.getElementById('loop-btn').disabled = true;
        document.getElementById('clear-btn').disabled = true;
      }
    
      // Update loop button state
      const loopBtn = document.getElementById('loop-btn');
      if (activeLoopLayers.has(layerIndex)) {
        loopBtn.textContent = '⏹️ Stop Current';
        loopBtn.classList.add('active');
        isLooping = true;
      } else {
        loopBtn.textContent = '🔄 Loop Current';
        loopBtn.classList.remove('active');
        isLooping = false;
      }
    
    }
  
    function clearCurrentLayer() {
      if (confirm(`Clear layer ${currentLayerIndex + 1}?`)) {
      // Stop loop if playing
        if (activeLoopLayers.has(currentLayerIndex)) {
          stopLayerLoop(currentLayerIndex);
        }
      
        // Clear the layer
        if (loopLayers[currentLayerIndex]) {
          loopLayers[currentLayerIndex].notes = [];
        }
        recordedNotes = [];
      
        // Update UI
        updateLayerDisplay();
        document.getElementById('recording-status').textContent = `Layer ${currentLayerIndex + 1} cleared`;
        document.getElementById('play-btn').disabled = true;
        document.getElementById('loop-btn').disabled = true;
        document.getElementById('clear-btn').disabled = true;
      }
    }
  
    function clearAllLayers() {
      if (confirm('Clear all layers? This cannot be undone!')) {
      // Stop all loops
        stopAllLoops();
      
        // Clear all data
        loopLayers = [];
        recordedNotes = [];
        currentLayerIndex = 0;
        isRecording = false;
      
        // Reset UI
        const recordBtn = document.getElementById('record-btn');
        recordBtn.textContent = '⏺️ Record Layer';
        recordBtn.classList.remove('recording');
      
        updateLayerDisplay();
        updateLayerCounts();
      
        document.getElementById('recording-status').textContent = 'All layers cleared - ready to record layer 1';
        document.getElementById('play-btn').disabled = true;
        document.getElementById('loop-btn').disabled = true;
        document.getElementById('loop-all-btn').disabled = true;
        document.getElementById('clear-btn').disabled = true;
        document.getElementById('clear-all-btn').disabled = true;
        document.getElementById('save-btn').disabled = true;
      }
    }
  
    function recordNote(noteName) {
      if (!isRecording) return;
    
      const timestamp = Date.now() - recordingStartTime;
      recordedNotes.push({ note: noteName, time: timestamp });
    
      // Update recording length display
      const lengthElement = document.getElementById('recording-length');
      if (lengthElement) {
        const seconds = Math.floor(timestamp / 1000);
        const minutes = Math.floor(seconds / 60);
        lengthElement.textContent = `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
      }
    }
  
    function playRecording() {
      if (recordedNotes.length === 0) return;
    
      const playBtn = document.getElementById('play-btn');
      playBtn.textContent = '⏸️ Stop';
      playBtn.disabled = true;
    
      // Use current layer's tempo instead of global tempo
      const layerTempo = layerTempos[currentLayerIndex] || 120;
      const tempoScale = 120 / layerTempo;
    
      // Play each recorded note at tempo-adjusted time
      recordedNotes.forEach(({ note, time }) => {
        const adjustedTime = time * tempoScale;
        setTimeout(() => {
          playNoteByName(note);
          highlightPianoKey(note);
        }, adjustedTime);
      });
    
      // Reset play button after playback (also tempo-adjusted)
      const totalDuration = (recordedNotes[recordedNotes.length - 1].time * tempoScale) + 1000;
      setTimeout(() => {
        playBtn.textContent = '▶️ Play';
        playBtn.disabled = false;
      }, totalDuration);
    
    }
  
    // Multi-layer loop management
    function toggleLoop() {
      const loopBtn = document.getElementById('loop-btn');
    
    
      if (isLooping) {
      // Stop current layer loop
        stopLayerLoop(currentLayerIndex);
        isLooping = false;
        loopBtn.textContent = '🔄 Loop Current';
        loopBtn.classList.remove('active');
      } else {
      // Start current layer loop
        const notesToPlay = recordedNotes.length > 0 ? recordedNotes :
          (loopLayers[currentLayerIndex] ? loopLayers[currentLayerIndex].notes : []);

        if (notesToPlay.length === 0) {
          return;
        }

        startLayerLoop(currentLayerIndex, notesToPlay);
        isLooping = true;
        loopBtn.textContent = '⏹️ Stop Current';
        loopBtn.classList.add('active');
      }
    }
  
    function toggleLoopAll() {
      const loopAllBtn = document.getElementById('loop-all-btn');
    
      if (activeLoopLayers.size > 0) {
      // Stop all loops
        stopAllLoops();
        loopAllBtn.textContent = '🔄 Loop All';
        loopAllBtn.classList.remove('active');
      } else {
      // Start all layer loops
        if (loopLayers.length === 0) return;
        startAllLoops();
        loopAllBtn.textContent = '⏹️ Stop All';
        loopAllBtn.classList.add('active');
      }
    }
  
    function startLayerLoop(layerIndex, notes) {
      if (activeLoopLayers.has(layerIndex)) {
        stopLayerLoop(layerIndex);
        return;
      }
      if (!notes || notes.length === 0) {
        return;
      }
    
      activeLoopLayers.add(layerIndex);
    
      // Use layer-specific tempo instead of global tempo
      const layerTempo = layerTempos[layerIndex] || 120;

      const playLoop = () => {
        if (!activeLoopLayers.has(layerIndex)) return; // Stop if layer was disabled

        notes.forEach(({ note, time }) => {
          const adjustedTime = window.GameUtils.scaleNoteTime(time, layerTempo);
          setTimeout(() => {
            if (activeLoopLayers.has(layerIndex)) {
              playNoteByName(note);
              highlightPianoKey(note);
            }
          }, adjustedTime);
        });
      };
    
      // Start immediately
      playLoop();
    
      // Set up interval for looping (tempo-adjusted)
      const loopDuration = window.GameUtils.calculateLoopDuration(
        layerTempo,
        notes[notes.length - 1].time
      );
    
      const intervalId = setInterval(() => {
        if (activeLoopLayers.has(layerIndex)) {
          playLoop();
        } else {
          clearInterval(intervalId);
        }
      }, loopDuration);
    
      // Store interval ID for this layer
      if (!window.layerIntervals) window.layerIntervals = new Map();
      window.layerIntervals.set(layerIndex, intervalId);
    
      updateLayerDisplay();
    }
  
    function stopLayerLoop(layerIndex) {
      activeLoopLayers.delete(layerIndex);
    
      if (window.layerIntervals && window.layerIntervals.has(layerIndex)) {
        clearInterval(window.layerIntervals.get(layerIndex));
        window.layerIntervals.delete(layerIndex);
      }
    
      if (layerIndex === currentLayerIndex) {
        isLooping = false;
        const loopBtn = document.getElementById('loop-btn');
        if (loopBtn) {
          loopBtn.textContent = '🔄 Loop Current';
          loopBtn.classList.remove('active');
        }
      }
    
      updateLayerDisplay();
    }
  
    function startAllLoops() {
      loopLayers.forEach((layer, index) => {
        if (layer.notes.length > 0) {
          startLayerLoop(index, layer.notes);
        }
      });
    }

    function hasRecordableContent() {
      return window.GameUtils.hasRecordableContent(loopLayers, recordedNotes);
    }

    function saveRecording() {
      if (!hasRecordableContent()) return;

      const name = prompt('Enter a name for your composition:');
      if (!name) return;

      if (recordedNotes.length > 0) {
        saveCurrentRecordingToLayer();
      }

      const composition = window.GameUtils.buildCompositionPayload({
        name,
        loopLayers,
        layerTempos,
        currentLayerIndex,
        instrument: currentInstrument,
        effects: currentEffects,
        tempo: currentTempo,
        timestamp: new Date().toISOString()
      });

      try {
        const saved = JSON.parse(localStorage.getItem('musicCompositions') || '[]');
        saved.push(composition);
        localStorage.setItem('musicCompositions', JSON.stringify(saved));
        alert(`Composition "${name}" saved successfully!`);
      } catch {
        alert('Failed to save composition. Storage may be full.');
      }
    }
  
    function loadRecording() {
      try {
        const saved = JSON.parse(localStorage.getItem('musicCompositions') || '[]');
      
        if (saved.length === 0) {
          alert('No saved compositions found.');
          return;
        }
      
        const names = saved.map((comp, index) => `${index + 1}. ${comp.name} (${new Date(comp.timestamp).toLocaleString()})`);
        const choice = prompt(`Select a composition to load:\n\n${names.join('\n')}\n\nEnter the number:`);
      
        const index = window.GameUtils.parseCompositionSelection(choice, saved.length);
        if (index === null) {
          alert('Invalid selection.');
          return;
        }
      
        const composition = saved[index];
        const restored = window.GameUtils.restoreCompositionState(composition);
        loopLayers = restored.loopLayers;
        layerTempos = restored.layerTempos;
        currentLayerIndex = restored.currentLayerIndex;
        recordedNotes = restored.recordedNotes;

        currentInstrument = composition.instrument;
        currentEffects = composition.effects;
        currentTempo = composition.tempo;
      
        // Update UI
        document.getElementById('instrument-select').value = currentInstrument;
        document.getElementById('tempo-slider').value = currentTempo;
        document.getElementById('tempo-display').textContent = currentTempo + ' BPM';
      
        // Update effect controls
        Object.keys(currentEffects).forEach(effect => {
          const toggle = document.getElementById(`${effect}-toggle`);
          const slider = document.getElementById(`${effect}-amount`);
        
          if (toggle) {
            toggle.checked = currentEffects[effect].enabled;
            if (slider) {
              slider.disabled = !currentEffects[effect].enabled;
            }
          }
        
          if (slider && effect === 'distortion') {
            slider.value = currentEffects[effect].amount;
          } else if (slider) {
            slider.value = currentEffects[effect].wetness * 100;
          }
        });
      
        // Enable playback buttons
        document.getElementById('play-btn').disabled = false;
        document.getElementById('loop-btn').disabled = false;
        document.getElementById('loop-all-btn').disabled = loopLayers.length === 0;
        document.getElementById('clear-btn').disabled = false;
        document.getElementById('clear-all-btn').disabled = loopLayers.length === 0;
        document.getElementById('save-btn').disabled = false;
        document.getElementById('prev-layer-btn').disabled = currentLayerIndex === 0;
        document.getElementById('next-layer-btn').disabled = currentLayerIndex >= maxLoopLayers - 1;

        const layerTempoSlider = document.getElementById('layer-tempo-slider');
        const layerTempo = layerTempos[currentLayerIndex] || currentTempo;
        if (layerTempoSlider) {
          layerTempoSlider.value = layerTempo;
        }
        const layerTempoDisplay = document.getElementById('layer-tempo');
        if (layerTempoDisplay) {
          layerTempoDisplay.textContent = layerTempo;
        }

        updateLayerDisplay();
        updateLayerCounts();

        document.getElementById('recording-status').textContent = `Loaded "${composition.name}"`;

        const notesForDuration = recordedNotes.length > 0
          ? recordedNotes
          : (loopLayers[currentLayerIndex]?.notes || []);
        if (notesForDuration.length > 0) {
          const totalTime = notesForDuration[notesForDuration.length - 1].time;
          document.getElementById('recording-length').textContent =
          window.GameUtils.formatRecordingLength(totalTime);
        } else {
          document.getElementById('recording-length').textContent = '0:00';
        }
      
        alert(`Composition "${composition.name}" loaded successfully!`);
      } catch {
        alert('Failed to load compositions.');
      }
    }

    // Event listeners
    startButton.addEventListener('click', startArrowGame);
    resetButton.addEventListener('click', resetArrowGame);
  
  } catch (error) {
    console.error('Error initializing arrow game:', error);
  }
}); 
