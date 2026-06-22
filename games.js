// Game Menu System

/**
 * @param {EventTarget | null} element
 * @returns {element is HTMLSelectElement}
 */
function isSelectElement(element) {
  return element instanceof HTMLSelectElement;
}

/**
 * @param {string} id
 * @returns {HTMLElement | null}
 */
function getHtmlElement(id) {
  const element = document.getElementById(id);
  return element instanceof HTMLElement ? element : null;
}

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
function queryRequired(id) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing #${id}`);
  }
  return element;
}

/**
 * @template {HTMLElement} T
 * @param {T | null} element
 * @returns {T}
 */
function assertPresent(element) {
  return /** @type {T} */ (element);
}

/**
 * @param {HTMLElement} element
 * @returns {HTMLInputElement}
 */
function asInput(element) {
  return /** @type {HTMLInputElement} */ (element);
}

/**
 * @param {HTMLElement} element
 * @returns {HTMLButtonElement}
 */
function asButton(element) {
  return /** @type {HTMLButtonElement} */ (element);
}

/**
 * @param {EventTarget | null} target
 * @returns {HTMLInputElement | null}
 */
function getInputTarget(target) {
  return target instanceof HTMLInputElement ? target : null;
}

/**
 * @typedef {'memory' | 'snake' | 'typing' | 'arrow'} GameName
 */

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
  
    /**
     * @param {GameName} gameName
     */
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
        if (window.typingTimerInterval) {
          clearInterval(window.typingTimerInterval);
        }
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
      const gameSection = queryRequired(`${gameName}-section`);
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
      item.addEventListener('click', (event) => {
        try {
          const target = event.currentTarget;
          if (!(target instanceof HTMLElement)) {
            return;
          }
          const gameName = target.getAttribute('data-game');
          if (gameName === 'memory' || gameName === 'snake' || gameName === 'typing' || gameName === 'arrow') {
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
    const gameContainer = getHtmlElement('memory-game');
    const startButton = getHtmlElement('start-game');
    const resetButton = getHtmlElement('reset-game');
    const scoreElement = getHtmlElement('score');
    const timeElement = getHtmlElement('time');
    
    if (!gameContainer || !startButton || !resetButton || !scoreElement || !timeElement) {
      console.warn('Memory game elements not found');
      return;
    }

    const memoryContainer = assertPresent(gameContainer);
    const memoryStartButton = asButton(startButton);
    const memoryResetButton = asButton(resetButton);
    const memoryScoreElement = assertPresent(scoreElement);
    const memoryTimeElement = assertPresent(timeElement);
  
    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    /** @type {HTMLElement | null} */
    let firstCard = null;
    /** @type {HTMLElement | null} */
    let secondCard = null;
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
      memoryContainer.classList.add('centered-content');
    
      memoryContainer.innerHTML = `
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
      memoryScoreElement.textContent = String(score);
      memoryTimeElement.textContent = String(timeLeft);
    
      // Remove the centered-content class before creating the grid
      memoryContainer.classList.remove('centered-content');
    
      // Create cards
      createCards();
    
      // Start timer
      window.memoryGameTimer = setInterval(() => {
        timeLeft--;
        memoryTimeElement.textContent = String(timeLeft);
      
        if (timeLeft <= 0) {
          endGame(false); // Game lost - time ran out
        }
      }, 1000);
    
      memoryStartButton.disabled = true;
      memoryResetButton.disabled = false;
    }
  
    function createCards() {
      memoryContainer.innerHTML = '';
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
        memoryContainer.appendChild(card);
        cards.push(card);
      });
    }
  
    /** @param {MouseEvent} event */
    function flipCard(event) {
      if (lockBoard) return;
      const card = event.currentTarget;
      if (!(card instanceof HTMLElement)) {
        return;
      }
      if (card === firstCard) return;

      card.classList.add('flipped');

      if (!hasFlippedCard) {
      // First card flipped
        hasFlippedCard = true;
        firstCard = card;
        return;
      }

      // Second card flipped
      secondCard = card;
      checkForMatch();
    }
  
    function checkForMatch() {
      if (!firstCard || !secondCard) {
        return;
      }
      const isMatch = window.MemoryGameUtils.isMemoryMatch(
        firstCard.dataset.icon ?? '',
        secondCard.dataset.icon ?? ''
      );

      if (isMatch) {
        disableCards();
        score = window.MemoryGameUtils.updateMemoryScore(score, true);
        memoryScoreElement.textContent = String(score);
      } else {
        unflipCards();
      }
    }
  
    function disableCards() {
      if (!firstCard || !secondCard) {
        return;
      }
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
      if (!firstCard || !secondCard) {
        return;
      }
      lockBoard = true;
      const first = firstCard;
      const second = secondCard;

      setTimeout(() => {
        first.classList.remove('flipped');
        second.classList.remove('flipped');

        resetBoard();
      }, 1000);
    }
  
    function resetBoard() {
      [hasFlippedCard, lockBoard] = [false, false];
      [firstCard, secondCard] = [null, null];
    }
  
    function resetGame() {
      if (window.memoryGameTimer) {
        clearInterval(window.memoryGameTimer);
      }
      window.memoryGameActive = false;
    
      // Reset to initial display
      initializeGameDisplay();
    
      memoryStartButton.disabled = false;
      memoryResetButton.disabled = true;
    
      score = 0;
      timeLeft = 60;
      memoryScoreElement.textContent = String(score);
      memoryTimeElement.textContent = String(timeLeft);
    
      resetBoard();
    }
  
    function endGame(won = false) {
      if (window.memoryGameTimer) {
        clearInterval(window.memoryGameTimer);
      }
      window.memoryGameActive = false;
      lockBoard = true;
    
      // Show result message
      memoryContainer.classList.add('centered-content');
      if (won) {
        memoryContainer.innerHTML = `
        <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
          <p class="text-2xl mb-4 text-green-400">🎉 You Won!</p>
          <p class="text-lg mb-2">All cards matched!</p>
          <p>Final Score: <strong>${score}</strong></p>
          <p>Time Remaining: <strong>${timeLeft}s</strong></p>
          <p class="mt-4 text-gray-300">Click "Reset" to play again</p>
        </div>
      `;
      } else {
        memoryContainer.innerHTML = `
        <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
          <p class="text-2xl mb-4 text-red-400">⏰ Time's Up!</p>
          <p class="text-lg mb-2">Better luck next time!</p>
          <p>Final Score: <strong>${score}</strong></p>
          <p class="mt-4 text-gray-300">Click "Reset" to try again</p>
        </div>
      `;
      }
    
      memoryStartButton.disabled = false;
      memoryResetButton.disabled = false; // Enable reset so user can play again
    }
  
    // Event listeners
    memoryStartButton.addEventListener('click', startGame);
    memoryResetButton.addEventListener('click', resetGame);
  
  } catch (error) {
    console.error('Error initializing memory game:', error);
  }
}); 

// Snake Game
document.addEventListener('DOMContentLoaded', () => {
  try {
    const snakeContainerEl = getHtmlElement('snake-game');
    const snakeStartButtonEl = getHtmlElement('start-snake');
    const snakeResetButtonEl = getHtmlElement('reset-snake');
    const snakeScoreElementEl = getHtmlElement('snake-score');
    
    if (!snakeContainerEl || !snakeStartButtonEl || !snakeResetButtonEl || !snakeScoreElementEl) {
      console.warn('Snake game elements not found');
      return;
    }

    const snakeContainer = assertPresent(snakeContainerEl);
    const snakeStartButton = asButton(assertPresent(snakeStartButtonEl));
    const snakeResetButton = asButton(assertPresent(snakeResetButtonEl));
    const snakeScoreElement = assertPresent(snakeScoreElementEl);
  
    /** @type {HTMLCanvasElement | undefined} */
    let canvas;
    /** @type {CanvasRenderingContext2D | null | undefined} */
    let ctx;
    /** @type {Array<{ x: number; y: number }>} */
    let snake = [];
    /** @type {{ x: number; y: number }} */
    let food = { x: 0, y: 0 };
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
      if (!ctx) {
        console.warn('Canvas 2D context unavailable');
        return;
      }
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
      snakeScoreElement.textContent = String(snakeScore);
    
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
        btn.addEventListener('click', (event) => {
          const target = event.currentTarget;
          if (!(target instanceof HTMLButtonElement)) {
            return;
          }
          const dir = target.getAttribute('data-direction');
          if (dir) {
            handleDirectionChange(dir);
          }
        });
        touchControlsContainer.appendChild(btn);
      });
    
      snakeContainer.appendChild(touchControlsContainer);
    }
  
    function handleDirectionChange(/** @type {string} */ newDirection) {
      nextDirection = window.SnakeLogic.resolveDirectionChange(
        direction,
        nextDirection,
        newDirection
      );
    }
  
    /** @param {KeyboardEvent} e */
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
      if (!window.snakeGameActive || !canvas || !ctx) return;
    
      // Apply queued direction change at the start of each game loop
      direction = nextDirection;
    
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    
      // Move snake
      moveSnake();
    
      // Check if food eaten (before collision check to avoid issues)
      let foodEaten = false;
      if (window.SnakeLogic.isFoodEaten(snake[0] ?? { x: -1, y: -1 }, food)) {
      // Increase score
        snakeScore += 10;
        snakeScoreElement.textContent = String(snakeScore);
      
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
      const headCell = snake[0];
      if (!headCell) {
        return;
      }
      const head = window.SnakeLogic.getNextHead(headCell, direction, snakeSize);
      snake.unshift(head);
    }

    function checkCollision() {
      const headCell = snake[0];
      if (!headCell || !canvas) {
        return true;
      }
      return window.SnakeLogic.hasCollision(headCell, snake, canvas.width, canvas.height);
    }
  
    function createFood() {
      if (!canvas) {
        return;
      }
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
          const segment = snake[i];
          if (!segment) {
            continue;
          }
          if (food.x === segment.x && food.y === segment.y) {
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
      const context = ctx;
      if (!context) {
        return;
      }
      snake.forEach((segment, index) => {
      // Make head a different color
        if (index === 0) {
          context.fillStyle = '#22c55e'; // Green
        } else {
          context.fillStyle = '#4ade80'; // Light green
        }
      
        context.fillRect(segment.x, segment.y, snakeSize, snakeSize);
      
        // Add border
        context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        context.strokeRect(segment.x, segment.y, snakeSize, snakeSize);
      });
    }
  
    function drawFood() {
      if (!ctx) {
        return;
      }
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
      food = { x: 0, y: 0 };
      snakeScore = 0;
      snakeScoreElement.textContent = String(snakeScore);
      direction = 'right';
      nextDirection = 'right';
      gameSpeed = 150;
    
      snakeStartButton.disabled = false;
      snakeResetButton.disabled = true;
    }
  
    function endSnakeGame() {
      if (window.snakeGameInterval) {
        clearInterval(window.snakeGameInterval);
      }
    
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
    const typingContainerEl = getHtmlElement('typing-game');
    const typingStartButtonEl = getHtmlElement('start-typing');
    const typingResetButtonEl = getHtmlElement('reset-typing');
    const wpmElementEl = getHtmlElement('typing-wpm');
    const accuracyElementEl = getHtmlElement('typing-accuracy');
    
    if (!typingContainerEl || !typingStartButtonEl || !typingResetButtonEl || !wpmElementEl || !accuracyElementEl) {
      console.warn('Typing game elements not found');
      return;
    }

    const typingContainer = assertPresent(typingContainerEl);
    const typingStartButton = asButton(assertPresent(typingStartButtonEl));
    const typingResetButton = asButton(assertPresent(typingResetButtonEl));
    const wpmElement = assertPresent(wpmElementEl);
    const accuracyElement = assertPresent(accuracyElementEl);
  
    /** @type {Date | undefined} */
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
      const typingInput = asInput(queryRequired('typing-input'));
      const timerDisplay = queryRequired('timer-display');
    
      // Enable input and focus
      typingInput.disabled = false;
      typingInput.value = '';
      typingInput.focus();
    
      // Start timer (60 seconds)
      let timeLeft = 60;
      timerDisplay.textContent = String(timeLeft);
    
      startTime = new Date();
      window.typingTimerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = String(timeLeft);
      
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
      const textDisplay = queryRequired('text-display');
      const typingInput = asInput(queryRequired('typing-input'));
    
      // Select random prompt
      const randomIndex = Math.floor(Math.random() * textPrompts.length);
      const currentPrompt = textPrompts[randomIndex] ?? textPrompts[0] ?? '';
      if (!currentPrompt) {
        return;
      }
    
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
      const textDisplay = queryRequired('text-display');
      const typingInput = asInput(queryRequired('typing-input'));
    
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
        const sentenceCounter = queryRequired('sentence-counter');
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
      const elapsedMs = startTime ? Date.now() - startTime.getTime() : 0;
      const wpm = window.TypingStats.calculateWpm(totalCorrectCharacters, correctTyped, elapsedMs);
      const accuracy = window.TypingStats.calculateAccuracy(
        totalCharactersTyped,
        totalTyped,
        totalCorrectCharacters,
        correctTyped
      );
    
      // Update displays
      wpmElement.textContent = String(wpm);
      accuracyElement.textContent = String(accuracy);
    }
  
    function resetTypingGame() {
      if (window.typingTimerInterval) {
        clearInterval(window.typingTimerInterval);
      }
    
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
      if (window.typingTimerInterval) {
        clearInterval(window.typingTimerInterval);
      }
      window.typingGameActive = false;
    
      const typingInput = asInput(queryRequired('typing-input'));
      if (typingInput) {
        typingInput.disabled = true;
        typingInput.removeEventListener('input', checkTyping);
      }
    
      // Add current sentence stats to totals if user was in middle of typing
      totalCharactersTyped += totalTyped;
      totalCorrectCharacters += correctTyped;
    
      // Final statistics calculation
      const elapsedMs = startTime ? Date.now() - startTime.getTime() : 0;
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
      wpmElement.textContent = String(finalWpm);
      accuracyElement.textContent = String(finalAccuracy);
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
    const startButtonEl = getHtmlElement('start-arrow');
    const resetButtonEl = getHtmlElement('reset-arrow');
    const gameContainerEl = getHtmlElement('arrow-game');
    
    if (!gameContainerEl || !startButtonEl || !resetButtonEl) {
      console.warn('Music studio elements not found');
      return;
    }

    const gameContainer = assertPresent(gameContainerEl);
    const startButton = asButton(assertPresent(startButtonEl));
    const resetButton = asButton(assertPresent(resetButtonEl));
  
    let isGameActive = false;
    window.arrowGameAudioContext = null;
    let notesPlayed = 0;
  
    // Define comprehensive note frequencies (full chromatic scale with multiple octaves)
    /** @type {Record<string, number>} */
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
    /** @type {Record<string, string>} */
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
    /** @type {{
     *   reverb: { enabled: boolean; roomSize: number; damping: number; wetness: number };
     *   delay: { enabled: boolean; time: number; feedback: number; wetness: number };
     *   chorus: { enabled: boolean; rate: number; depth: number; wetness: number };
     *   distortion: { enabled: boolean; amount: number; wetness: number };
     *   filter: { enabled: boolean; frequency: number; Q: number; type: BiquadFilterType };
     * }} */
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
    /** @type {Array<{ note: string; time: number }>} */
    let recordedNotes = [];
    let recordingStartTime = 0;
    let isLooping = false;
    /** @type {ReturnType<typeof setInterval> | null} */
    let loopInterval = null;
    let currentTempo = 120; // BPM
    let masterVolume = 0.3;
  
    // Multi-layer loop system with individual tempos
    /** @type {Array<{ notes: Array<{ note: string; time: number }>; name?: string }>} */
    let loopLayers = [];
    let activeLoopLayers = new Set(); // Which layers are currently playing
    let maxLoopLayers = 4; // Maximum number of simultaneous loops
    let layerTempos = [120, 120, 120, 120]; // Individual BPM for each layer
    let currentLayerIndex = 0;
    let isPlayingPlayback = false;
    /** @type {HTMLElement | null} */
    let compositionPanelTrigger = null;
    let lastTouchNote = '';
    let lastTouchTime = 0;
    /** @type {ReturnType<typeof setTimeout>[]} */
    let playbackTimeouts = [];

    const pianoKeyConfig = {
      whiteKeys: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      blackKeys: [['C#4'], ['D#4'], [], ['F#4'], ['G#4'], ['A#4'], [], []]
    };

    const noteToKeyLabel = /** @type {Record<string, string>} */ ({
      'C4': 'A', 'D4': 'S', 'E4': 'D', 'F4': 'F', 'G4': 'G', 'A4': 'H', 'B4': 'J', 'C5': 'K',
      'C#4': 'W', 'D#4': 'E', 'F#4': 'T', 'G#4': 'Y', 'A#4': 'U', 'C#5': 'O', 'D#5': 'P'
    });

    /** @param {HTMLElement | null} button @param {string} label */
    function setBtnLabel(button, label) {
      if (!button) return;
      button.textContent = label;
      button.setAttribute('aria-label', label);
    }

    // Initialize the advanced music studio
    function initArrowDisplay() {
      gameContainer.classList.add('centered-content');
      gameContainer.innerHTML = `
      <div class="welcome-box bg-black/60 p-8 text-center rounded-lg">
        <p class="text-xl mb-4">🎹 Advanced Music Studio</p>
        <p class="mb-2">Create music with a full chromatic keyboard!</p>
        <p class="mb-2">🎵 Use A-K keys for white notes, W E T Y U O P for black notes</p>
        <p class="mb-2">🎛️ Apply effects: reverb, delay, chorus & more</p>
        <p class="mb-2">🔄 Record and loop your compositions</p>
        <p class="mt-4">Click "Start Studio" to begin composing!</p>
      </div>
    `;
    }
  
    // Initialize when loaded
    initArrowDisplay();
  
    // Initialize notes counter
    const notesElement = queryRequired('arrow-notes');
    if (notesElement) {
      notesElement.textContent = '0';
    }
  
    // Create the advanced music studio UI
    function createArrowGameUI() {
      gameContainer.classList.remove('centered-content');
    
      gameContainer.innerHTML = `
      <div class="music-studio">
        <div id="audio-unavailable-banner" class="audio-unavailable-banner hidden" role="alert">
          Audio unavailable in this browser. Recording and playback are disabled.
        </div>
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
              <label for="instrument-select">🎼 Instrument:</label>
              <select id="instrument-select" class="control-select">
                <option value="synth">🎹 Synthesizer</option>
                <option value="piano">🎵 Piano</option>
                <option value="strings">🎻 Strings</option>
                <option value="bass">🎸 Bass</option>
              </select>
            </div>
            <div class="control-group">
              <label for="volume-slider">🔊 Volume:</label>
              <input type="range" id="volume-slider" min="0" max="100" value="30" class="control-slider">
              <span id="volume-display">30%</span>
            </div>
            <div class="control-group">
              <label for="tempo-slider">⏱️ Tempo:</label>
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
            <div class="recording-controls recording-controls-primary">
              <button id="record-btn" class="record-btn" aria-label="⏺️ Record Layer">⏺️ Record Layer</button>
              <button id="play-btn" class="play-btn" disabled aria-label="▶️ Play">▶️ Play</button>
              <button id="loop-btn" class="loop-btn" disabled aria-label="🔄 Loop Current">🔄 Loop Current</button>
              <button id="loop-all-btn" class="loop-btn" disabled aria-label="🔄 Loop All">🔄 Loop All</button>
            </div>
            <div class="recording-controls recording-controls-secondary">
              <button id="clear-btn" class="clear-btn" disabled aria-label="🗑️ Clear Current">🗑️ Clear Current</button>
              <button id="clear-all-btn" class="clear-btn" disabled aria-label="🗑️ Clear All">🗑️ Clear All</button>
              <button id="save-btn" class="save-btn" disabled aria-label="💾 Save">💾 Save</button>
              <button id="load-btn" class="load-btn" aria-label="📁 Load">📁 Load</button>
            </div>
            <div id="composition-panel" class="composition-panel hidden" role="dialog" aria-modal="true" aria-labelledby="composition-panel-title" aria-hidden="true">
              <div class="composition-panel-header">
                <h3 id="composition-panel-title" class="composition-panel-title">Composition Library</h3>
                <button type="button" id="composition-panel-close" class="composition-panel-close" aria-label="Close composition library">×</button>
              </div>
              <div id="composition-panel-error" class="composition-panel-error hidden" role="alert" aria-live="polite"></div>
              <div id="composition-save-view" class="composition-view hidden">
                <label for="composition-name-input">Composition name</label>
                <input type="text" id="composition-name-input" class="composition-name-input" maxlength="100" autocomplete="off">
                <div class="composition-panel-actions">
                  <button type="button" id="composition-save-confirm" class="composition-action-btn" aria-label="Save composition">Save composition</button>
                  <button type="button" id="composition-cancel-btn" class="composition-action-btn composition-cancel-btn" aria-label="Cancel">Cancel</button>
                </div>
              </div>
              <div id="composition-load-view" class="composition-view hidden">
                <p id="composition-empty-message" class="composition-empty hidden">No saved compositions yet</p>
                <ul id="composition-list" class="composition-list" role="listbox" aria-label="Saved compositions"></ul>
                <div class="composition-panel-actions">
                  <button type="button" id="composition-cancel-load-btn" class="composition-action-btn composition-cancel-btn" aria-label="Cancel">Cancel</button>
                </div>
              </div>
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
              <span id="recording-status" aria-live="polite">Ready to record layer 1</span>
              <span id="recording-length">0:00</span>
            </div>
            <div class="layers-display" id="layers-display">
              <!-- Layer indicators will be added here -->
            </div>
          </div>
        </div>
        
        <!-- Keyboard Legend -->
        <div class="keyboard-legend" aria-label="Keyboard mapping legend">
          <div class="legend-row legend-white-keys">
            <span class="legend-key" data-key="a">A</span>
            <span class="legend-key" data-key="s">S</span>
            <span class="legend-key" data-key="d">D</span>
            <span class="legend-key" data-key="f">F</span>
            <span class="legend-key" data-key="g">G</span>
            <span class="legend-key" data-key="h">H</span>
            <span class="legend-key" data-key="j">J</span>
            <span class="legend-key" data-key="k">K</span>
          </div>
          <div class="legend-row legend-black-keys">
            <span class="legend-key legend-key-black" data-key="w">W</span>
            <span class="legend-key legend-key-black" data-key="e">E</span>
            <span class="legend-key legend-key-spacer"></span>
            <span class="legend-key legend-key-black" data-key="t">T</span>
            <span class="legend-key legend-key-black" data-key="y">Y</span>
            <span class="legend-key legend-key-black" data-key="u">U</span>
            <span class="legend-key legend-key-spacer"></span>
            <span class="legend-key legend-key-black" data-key="o">O</span>
            <span class="legend-key legend-key-black" data-key="p">P</span>
          </div>
          <div class="legend-row legend-octave-keys">
            <span class="legend-key" data-key="1">1</span>
            <span class="legend-key" data-key="2">2</span>
            <span class="legend-key" data-key="3">3</span>
            <span class="legend-key" data-key="4">4</span>
            <span class="legend-key" data-key="5">5</span>
            <span class="legend-key" data-key="6">6</span>
            <span class="legend-key" data-key="7">7</span>
            <span class="legend-key legend-key-label">Octave 3</span>
          </div>
          <div class="legend-row legend-arrow-keys">
            <span class="legend-key" data-key="ArrowLeft">←</span>
            <span class="legend-key" data-key="ArrowDown">↓</span>
            <span class="legend-key" data-key="ArrowUp">↑</span>
            <span class="legend-key" data-key="ArrowRight">→</span>
            <span class="legend-key legend-key-label">Shortcuts</span>
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
            <div class="touch-key-row" id="touch-piano-keyboard">
              <!-- Touch keys generated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

      // Generate piano keyboard visual
      generatePianoKeyboard();
      generateTouchPiano();
    
      // Setup control event listeners
      setupControlListeners();
      setupCompositionPanel();

      initializeEffectStates();
    }
  
    function ensureAudioResumed() {
      const context = window.arrowGameAudioContext;
      if (context && context.state === 'suspended') {
        context.resume().catch((err) => {
          console.warn('Failed to resume audio context:', err);
        });
      }
    }

    function showAudioUnavailableBanner() {
      const banner = getHtmlElement('audio-unavailable-banner');
      if (banner) {
        banner.classList.remove('hidden');
      }
      disableAudioControlsForFailure();
    }

    function hideAudioUnavailableBanner() {
      const banner = getHtmlElement('audio-unavailable-banner');
      if (banner) {
        banner.classList.add('hidden');
      }
    }

    function disableAudioControlsForFailure() {
      ['record-btn', 'play-btn', 'loop-btn', 'loop-all-btn'].forEach((id) => {
        const button = getHtmlElement(id);
        if (button instanceof HTMLButtonElement) {
          button.disabled = true;
        }
      });
    }

    function requireAudioContext() {
      const context = window.arrowGameAudioContext;
      if (!context) {
        throw new Error('Audio context not initialized');
      }
      return context;
    }

    /** @param {TouchEvent | MouseEvent} event */
    function handleTouchStart(event) {
      if (!isGameActive) return;

      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      // Prevent default behavior to avoid scrolling
      event.preventDefault();

      const noteName = target.dataset.note;
      if (!noteName) return;

      const now = Date.now();
      if (noteName === lastTouchNote && now - lastTouchTime < 150) {
        return;
      }
      lastTouchNote = noteName;
      lastTouchTime = now;

      // Visual effect for button press
      target.classList.add('active');
      setTimeout(() => {
        target.classList.remove('active');
      }, 100);

      // Play the note
      playNoteByName(noteName);

      // Add visual feedback animation
      target.classList.add('correct');
      setTimeout(() => target.classList.remove('correct'), 300);

      // Record if recording is active
      if (isRecording) {
        recordNote(noteName);
      }
    }

    /** @param {KeyboardEvent} event */
    function handleKeyPress(event) {
      if (!isGameActive) return;

      const mappingKey = keyboardMapping[event.key] !== undefined
        ? event.key
        : keyboardMapping[event.key.toLowerCase()] !== undefined
          ? event.key.toLowerCase()
          : null;

      if (!mappingKey) return;

      event.preventDefault();

      const noteName = keyboardMapping[mappingKey];
      if (!noteName) {
        return;
      }

      playNoteByName(noteName);
      highlightKey(mappingKey, noteName);

      if (isRecording) {
        recordNote(noteName);
      }
    }
  
    // Initialize Web Audio API
    function initAudio() {
      try {
        window.arrowGameAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Resume audio context if it's suspended (required by browser policies)
        if (requireAudioContext().state === 'suspended') {
          requireAudioContext().resume().catch(err => {
            console.warn('Failed to resume audio context:', err);
          });
        }
        hideAudioUnavailableBanner();
      } catch (error) {
        console.warn('Web Audio API not supported in this browser:', error);
        window.arrowGameAudioContext = null;
        showAudioUnavailableBanner();
      }
    }
  
    // Play a note by name with advanced synthesis
    /** @param {string} noteName */
    function playNoteByName(noteName) {
      if (!window.arrowGameAudioContext) return;

      ensureAudioResumed();
    
      // Update notes counter
      notesPlayed++;
      const notesElement = queryRequired('arrow-notes');
      if (notesElement) {
        notesElement.textContent = String(notesPlayed);
      }
    
      const frequency = noteFrequencies[noteName];
      if (!frequency) return;
    
      // Create base oscillator based on instrument type
      const oscillator = createInstrumentOscillator(frequency);
    
      // Create effect chain
      const effectChain = createEffectChain();

      // Create master gain
      const masterGain = requireAudioContext().createGain();
      masterGain.gain.value = masterVolume;

      // Connect the audio chain
      oscillator.connect(effectChain.input);
      effectChain.output.connect(masterGain);
      masterGain.connect(requireAudioContext().destination);

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
        if (effectChain.chorusLFO) {
          try {
            effectChain.chorusLFO.stop();
          } catch {
          // LFO may have already stopped
          }
        }
      }, noteDuration);
    }
  
    // Create oscillator based on instrument type
    function createInstrumentOscillator(/** @type {number} */ frequency) {
      const oscillator = requireAudioContext().createOscillator();
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
      let input = requireAudioContext().createGain();
      let output = input;
      let chorusLFO = null;
    
      // Filter
      if (currentEffects.filter.enabled) {
        const filter = requireAudioContext().createBiquadFilter();
        filter.type = currentEffects.filter.type;
        filter.frequency.value = currentEffects.filter.frequency;
        filter.Q.value = currentEffects.filter.Q;
      
        // Add filter envelope for sweep effect
        filter.frequency.setValueAtTime(currentEffects.filter.frequency * 0.5, requireAudioContext().currentTime);
        filter.frequency.exponentialRampToValueAtTime(
          currentEffects.filter.frequency * 2, 
          requireAudioContext().currentTime + 0.1
        );
        filter.frequency.exponentialRampToValueAtTime(
          currentEffects.filter.frequency, 
          requireAudioContext().currentTime + 0.3
        );
      
        output.connect(filter);
        output = filter;
      }
    
      // Distortion with proper wet/dry mix
      if (currentEffects.distortion.enabled) {
        const distortion = requireAudioContext().createWaveShaper();
        distortion.curve = makeDistortionCurve(currentEffects.distortion.amount);
        distortion.oversample = '4x';
      
        const dryGain = requireAudioContext().createGain();
        const wetGain = requireAudioContext().createGain();
        const mixGain = requireAudioContext().createGain();
      
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
        const delayNode = requireAudioContext().createDelay(1);
        const delayGain = requireAudioContext().createGain();
        const feedbackGain = requireAudioContext().createGain();
        const wetGain = requireAudioContext().createGain();
        const dryGain = requireAudioContext().createGain();
        const mixGain = requireAudioContext().createGain();
      
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
        const reverbGain = requireAudioContext().createGain();
        const dryGain = requireAudioContext().createGain();
        const mixGain = requireAudioContext().createGain();
      
        reverbGain.gain.value = currentEffects.reverb.wetness;
        dryGain.gain.value = 1 - currentEffects.reverb.wetness;
      
        // Create multiple short delays to simulate reverb
        [0.03, 0.05, 0.07, 0.09].forEach((time) => {
          const delay = requireAudioContext().createDelay();
          const gain = requireAudioContext().createGain();
          delay.delayTime.value = time * currentEffects.reverb.roomSize;
          gain.gain.value = 0.3 * (1 - currentEffects.reverb.damping);

          output.connect(delay);
          delay.connect(gain);
          gain.connect(reverbGain);
        });
      
        // Mix dry and wet
        output.connect(dryGain);
        dryGain.connect(mixGain);
        reverbGain.connect(mixGain);
        output = mixGain;
      
      }
    
      // Simple chorus effect (using modulated delay)
      if (currentEffects.chorus.enabled) {
        const chorusDelay = requireAudioContext().createDelay(0.05);
        chorusLFO = requireAudioContext().createOscillator();
        const chorusGain = requireAudioContext().createGain();
        const chorusDepth = requireAudioContext().createGain();
        const dryGain = requireAudioContext().createGain();
        const mixGain = requireAudioContext().createGain();

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

      return { input, output, chorusLFO };
    }
  
    // Create distortion curve
    function makeDistortionCurve(/** @type {number} */ amount) {
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
    function applyEnvelope(/** @type {GainNode} */ gainNode, /** @type {string} */ instrument) {
      const now = requireAudioContext().currentTime;
    
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
    function getNoteDuration(/** @type {string} */ instrument) {
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
      const tempoDisplay = queryRequired('tempo-display');
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
      const pianoKeyboard = queryRequired('piano-keyboard');
      if (!pianoKeyboard) return;

      const { whiteKeys, blackKeys } = pianoKeyConfig;

      pianoKeyboard.innerHTML = '';

      whiteKeys.forEach((note, index) => {
        const key = document.createElement('div');
        key.className = 'piano-key white-key';
        key.dataset.note = note;
        key.setAttribute('aria-label', `Play ${note}`);

        const noteLabel = document.createElement('span');
        noteLabel.className = 'piano-note-name';
        noteLabel.textContent = note;
        key.appendChild(noteLabel);

        const keyLabel = noteToKeyLabel[note];
        if (keyLabel) {
          const labelSpan = document.createElement('span');
          labelSpan.className = 'key-label';
          labelSpan.textContent = keyLabel;
          key.appendChild(labelSpan);
        }

        if (blackKeys[index] && blackKeys[index].length > 0) {
          const blackNote = blackKeys[index][0];
          if (blackNote) {
            const blackKey = document.createElement('div');
            blackKey.className = 'piano-key black-key';
            blackKey.dataset.note = blackNote;
            blackKey.setAttribute('aria-label', `Play ${blackNote}`);

            const blackNoteLabel = document.createElement('span');
            blackNoteLabel.className = 'piano-note-name';
            blackNoteLabel.textContent = blackNote;
            blackKey.appendChild(blackNoteLabel);

            const blackKeyLabel = noteToKeyLabel[blackNote];
            if (blackKeyLabel) {
              const blackLabelSpan = document.createElement('span');
              blackLabelSpan.className = 'key-label';
              blackLabelSpan.textContent = blackKeyLabel;
              blackKey.appendChild(blackLabelSpan);
            }

            key.appendChild(blackKey);
          }
        }

        pianoKeyboard.appendChild(key);
      });

      pianoKeyboard.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const pianoKey = target.closest('.piano-key');
        if (!(pianoKey instanceof HTMLElement)) return;

        const noteName = pianoKey.dataset.note;
        if (noteName) {
          playNoteByName(noteName);
          highlightPianoKey(noteName);

          if (isRecording) {
            recordNote(noteName);
          }
        }
      });
    }

    function generateTouchPiano() {
      const touchKeyboard = queryRequired('touch-piano-keyboard');
      if (!touchKeyboard) return;

      const { whiteKeys, blackKeys } = pianoKeyConfig;
      touchKeyboard.innerHTML = '';

      whiteKeys.forEach((note, index) => {
        const key = document.createElement('div');
        key.className = 'touch-key white-key';
        key.dataset.note = note;
        key.setAttribute('aria-label', `Play ${note}`);
        key.textContent = note.replace('4', '');

        if (blackKeys[index] && blackKeys[index].length > 0) {
          const blackNote = blackKeys[index][0];
          if (blackNote) {
            const blackKey = document.createElement('div');
            blackKey.className = 'touch-key black-key';
            blackKey.dataset.note = blackNote;
            blackKey.setAttribute('aria-label', `Play ${blackNote}`);
            blackKey.textContent = blackNote.replace('4', '#');
            key.appendChild(blackKey);
          }
        }

        touchKeyboard.appendChild(key);
      });

      setupTouchControls();
    }

    // Start the music maker
    function startArrowGame() {
      if (isGameActive) return;
    
      isGameActive = true;
    
      // Reset notes counter
      notesPlayed = 0;
      const notesElement = queryRequired('arrow-notes');
      if (notesElement) {
        notesElement.textContent = String(notesPlayed);
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
  
    /** @typedef {'reverb' | 'delay' | 'chorus' | 'distortion' | 'filter'} EffectName */

    // Setup control panel event listeners
    function setupControlListeners() {
    // Instrument selector
      const instrumentSelect = queryRequired('instrument-select');
      if (isSelectElement(instrumentSelect)) {
        instrumentSelect.addEventListener('change', (e) => {
          const target = e.target;
          if (!isSelectElement(target)) {
            return;
          }
          currentInstrument = target.value;
        });
      }
    
      // Volume control
      const volumeSlider = asInput(queryRequired('volume-slider'));
      const volumeDisplay = queryRequired('volume-display');
      volumeSlider.addEventListener('input', (e) => {
        const target = getInputTarget(e.target);
        if (!target) {
          return;
        }
        masterVolume = Number(target.value) / 100;
        volumeDisplay.textContent = `${target.value}%`;
      });
    
      // Tempo control
      const tempoSlider = asInput(queryRequired('tempo-slider'));
      const tempoDisplay = queryRequired('tempo-display');
      tempoSlider.addEventListener('input', (e) => {
        const target = getInputTarget(e.target);
        if (!target) {
          return;
        }
        currentTempo = parseInt(target.value, 10);
        tempoDisplay.textContent = `${target.value} BPM`;
        addTempoFeedback(); // Start visual tempo feedback
      });
    
      // Effect toggles and sliders
      setupEffectControls();
    
      // Recording controls
      setupRecordingControls();
    }
  
    /** @param {EffectName} effect @param {HTMLInputElement} slider */
    function syncEffectSlider(effect, slider) {
      if (!slider || !currentEffects[effect]) return;

      if (effect === 'distortion') {
        slider.value = String(currentEffects[effect].amount);
      } else if (effect === 'filter') {
        slider.value = String(currentEffects[effect].frequency / 50);
      } else {
        slider.value = String(currentEffects[effect].wetness * 100);
      }
    }

    // Initialize effect states after DOM is ready
    function initializeEffectStates() {
      /** @type {EffectName[]} */
      const effects = ['reverb', 'delay', 'chorus', 'distortion', 'filter'];

      effects.forEach((effect) => {
        const toggle = asInput(queryRequired(`${effect}-toggle`));
        const slider = asInput(queryRequired(`${effect}-amount`));

        toggle.checked = currentEffects[effect].enabled;
        slider.disabled = !currentEffects[effect].enabled;
        syncEffectSlider(effect, slider);
      });
    }

    // Setup effect controls (event listeners only)
    function setupEffectControls() {
      /** @type {EffectName[]} */
      const effects = ['reverb', 'delay', 'chorus', 'distortion', 'filter'];
    
      effects.forEach((effect) => {
        const toggle = asInput(queryRequired(`${effect}-toggle`));
        const slider = asInput(queryRequired(`${effect}-amount`));
      
        toggle.addEventListener('change', (e) => {
          const target = getInputTarget(e.target);
          if (!target) {
            return;
          }
          currentEffects[effect].enabled = target.checked;
          slider.disabled = !target.checked;
        });
      
        slider.addEventListener('input', (e) => {
          const target = getInputTarget(e.target);
          if (!target) {
            return;
          }
          const value = Number(target.value) / 100;
          if (effect === 'distortion') {
            currentEffects[effect].amount = parseInt(target.value, 10);
            currentEffects[effect].wetness = value;
          } else if (effect === 'filter') {
            currentEffects[effect].frequency = parseInt(target.value, 10) * 50;
          } else {
            currentEffects[effect].wetness = value;
          }
        });
      });
    }

    function stopAllLoops() {
      [...activeLoopLayers].forEach(layerIndex => {
        stopLayerLoop(layerIndex);
      });

      const loopAllBtn = getHtmlElement('loop-all-btn');
      if (loopAllBtn) {
        setBtnLabel(loopAllBtn, '🔄 Loop All');
        loopAllBtn.classList.remove('active');
      }
    }

    function clearPlaybackTimeouts() {
      playbackTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      playbackTimeouts = [];
      isPlayingPlayback = false;

      const playBtn = getHtmlElement('play-btn');
      if (playBtn) {
        setBtnLabel(playBtn, '▶️ Play');
        playBtn.classList.remove('playing');
      }
    }

    function resetMusicStudioState() {
      stopAllLoops();
      clearPlaybackTimeouts();
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
      if (window.arrowGameAudioContext && requireAudioContext().state !== 'closed') {
        requireAudioContext().close().catch(err => {
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

      if (isGameActive) {
        resetMusicStudioState();
      } else {
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
      }

      closeMusicStudioAudio();
      isGameActive = false;
      compositionPanelTrigger = null;

      notesPlayed = 0;
      const notesElement = queryRequired('arrow-notes');
      if (notesElement) {
        notesElement.textContent = '0';
      }

      initArrowDisplay();
      startButton.disabled = false;
      resetButton.disabled = true;
    }

    window.cleanupMusicStudio = cleanupMusicStudio;

    // Reset the music maker
    function resetArrowGame() {
      cleanupMusicStudio();
      notesPlayed = 0;

      const notesElement = queryRequired('arrow-notes');
      if (notesElement) {
        notesElement.textContent = '0';
      }

      initArrowDisplay();

      startButton.disabled = false;
      resetButton.disabled = true;
    }
  
    // Setup recording controls
    function setupRecordingControls() {
      const recordBtn = queryRequired('record-btn');
      const playBtn = queryRequired('play-btn');
      const loopBtn = queryRequired('loop-btn');
      const loopAllBtn = queryRequired('loop-all-btn');
      const clearBtn = queryRequired('clear-btn');
      const clearAllBtn = queryRequired('clear-all-btn');
      const saveBtn = queryRequired('save-btn');
      const loadBtn = queryRequired('load-btn');
      const prevLayerBtn = queryRequired('prev-layer-btn');
      const nextLayerBtn = queryRequired('next-layer-btn');

      setBtnLabel(prevLayerBtn, '◀ Prev');
      setBtnLabel(nextLayerBtn, 'Next ▶');
    
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
      const layerTempoSlider = queryRequired('layer-tempo-slider');
      if (layerTempoSlider) {
        const tempoHandler = (/** @type {Event} */ e) => {
          const target = getInputTarget(e.target);
          if (!target) {
            return;
          }
          const newTempo = parseInt(target.value, 10);
          layerTempos[currentLayerIndex] = newTempo;
          const layerTempoDisplay = queryRequired('layer-tempo');
          layerTempoDisplay.textContent = String(newTempo);

          if (activeLoopLayers.has(currentLayerIndex)) {
            stopLayerLoop(currentLayerIndex);

            const currentLayer = loopLayers[currentLayerIndex];
            const notesToPlay = recordedNotes.length > 0 ? recordedNotes :
              (currentLayer ? currentLayer.notes : []);

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
      const useTouch = 'ontouchstart' in window;
      document.querySelectorAll('.touch-key').forEach((key) => {
        key.addEventListener(useTouch ? 'touchstart' : 'click', (event) => {
          handleTouchStart(/** @type {MouseEvent | TouchEvent} */ (event));
        });
      });
    }
  
    // Highlight key visual feedback
    /** @param {string} keyCode @param {string} noteName */
    function highlightKey(keyCode, noteName) {
      const keyElement = document.querySelector(`[data-key="${keyCode}"]`);
      if (keyElement) {
        keyElement.classList.add('active');
        setTimeout(() => keyElement.classList.remove('active'), 100);
      }

      highlightPianoKey(noteName);
    }
  
    // Highlight piano key
    /** @param {string} noteName */
    function highlightPianoKey(noteName) {
      const pianoKey = document.querySelector(`[data-note="${noteName}"]`);
      if (pianoKey) {
        pianoKey.classList.add('active');
        setTimeout(() => pianoKey.classList.remove('active'), 200);
      }
    }
  
    // Recording functions
    function toggleRecording() {
      const recordBtn = queryRequired('record-btn');
      const statusElement = queryRequired('recording-status');
    
      if (isRecording) {
      // Stop recording and save to current layer
        isRecording = false;
        setBtnLabel(recordBtn, '⏺️ Record Layer');
        recordBtn.classList.remove('recording');
      
        // Save the current recording to the layer
        if (recordedNotes.length > 0) {
          saveCurrentRecordingToLayer();
          statusElement.textContent = `Layer ${currentLayerIndex + 1}: ${recordedNotes.length} notes recorded`;
        
          // Enable controls
          queryRequired('play-btn').disabled = false;
          queryRequired('loop-btn').disabled = false;
          queryRequired('loop-all-btn').disabled = false;
          queryRequired('clear-btn').disabled = false;
          queryRequired('save-btn').disabled = false;
        }
      } else {
      // Start recording new layer
        isRecording = true;
        recordedNotes = [];
        recordingStartTime = Date.now();
        setBtnLabel(recordBtn, '⏹️ Stop Recording');
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
      const currentLayer = loopLayers[currentLayerIndex];
      if (currentLayer) {
        currentLayer.notes = [...recordedNotes];
      }
    
      updateLayerDisplay();
      updateLayerCounts();
    }
  
    function updateLayerDisplay() {
      const layersDisplay = queryRequired('layers-display');
      if (!layersDisplay) return;

      layersDisplay.innerHTML = '';

      loopLayers.forEach((layer, index) => {
        const layerElement = document.createElement('div');
        layerElement.className = `layer-indicator ${index === currentLayerIndex ? 'current' : ''}`;
        layerElement.setAttribute('role', 'button');
        layerElement.setAttribute('tabindex', '0');
        layerElement.setAttribute('aria-label', `Switch to layer ${index + 1}`);
        layerElement.innerHTML = `
        <span class="layer-number">${index + 1}</span>
        <span class="layer-notes">${layer.notes.length} notes</span>
        <span class="layer-status ${activeLoopLayers.has(index) ? 'playing' : 'stopped'}">
          ${activeLoopLayers.has(index) ? '▶️' : '⏸️'}
        </span>
      `;

        layerElement.addEventListener('click', () => switchToLayer(index));
        layerElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            switchToLayer(index);
          }
        });

        layersDisplay.appendChild(layerElement);
      });
    }
  
    function updateLayerCounts() {
      queryRequired('current-layer').textContent = String(currentLayerIndex + 1);
      queryRequired('total-layers').textContent = String(loopLayers.length);
    
      // Update navigation buttons
      queryRequired('prev-layer-btn').disabled = currentLayerIndex === 0;
      queryRequired('next-layer-btn').disabled = currentLayerIndex >= maxLoopLayers - 1;
      queryRequired('clear-all-btn').disabled = loopLayers.length === 0;
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
  
    /** @param {number} layerIndex */
    function switchToLayer(layerIndex) {
      currentLayerIndex = layerIndex;
    
      // Load the layer's recorded notes
      const targetLayer = loopLayers[layerIndex];
      if (targetLayer) {
        recordedNotes = [...targetLayer.notes];
      } else {
        recordedNotes = [];
      }
    
      // Update UI
      updateLayerDisplay();
      updateLayerCounts();
    
      // Update layer tempo display and slider
      const layerTempo = layerTempos[layerIndex] || 120;
      queryRequired('layer-tempo').textContent = String(layerTempo);
      const layerTempoSlider = queryRequired('layer-tempo-slider');
      layerTempoSlider.value = String(layerTempo);
    
      const statusElement = queryRequired('recording-status');
      if (recordedNotes.length > 0) {
        statusElement.textContent = `Layer ${layerIndex + 1}: ${recordedNotes.length} notes @ ${layerTempo} BPM`;
        queryRequired('play-btn').disabled = false;
        queryRequired('loop-btn').disabled = false;
        queryRequired('clear-btn').disabled = false;
      } else {
        statusElement.textContent = `Ready to record layer ${layerIndex + 1} @ ${layerTempo} BPM`;
        queryRequired('play-btn').disabled = true;
        queryRequired('loop-btn').disabled = true;
        queryRequired('clear-btn').disabled = true;
      }
    
      // Update loop button state
      const loopBtn = queryRequired('loop-btn');
      if (activeLoopLayers.has(layerIndex)) {
        setBtnLabel(loopBtn, '⏹️ Stop Current');
        loopBtn.classList.add('active');
        isLooping = true;
      } else {
        setBtnLabel(loopBtn, '🔄 Loop Current');
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
        const currentLayer = loopLayers[currentLayerIndex];
        if (currentLayer) {
          currentLayer.notes = [];
        }
        recordedNotes = [];
      
        // Update UI
        updateLayerDisplay();
        queryRequired('recording-status').textContent = `Layer ${currentLayerIndex + 1} cleared`;
        queryRequired('play-btn').disabled = true;
        queryRequired('loop-btn').disabled = true;
        queryRequired('clear-btn').disabled = true;
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
        const recordBtn = queryRequired('record-btn');
        setBtnLabel(recordBtn, '⏺️ Record Layer');
        recordBtn.classList.remove('recording');
      
        updateLayerDisplay();
        updateLayerCounts();
      
        queryRequired('recording-status').textContent = 'All layers cleared - ready to record layer 1';
        queryRequired('play-btn').disabled = true;
        queryRequired('loop-btn').disabled = true;
        queryRequired('loop-all-btn').disabled = true;
        queryRequired('clear-btn').disabled = true;
        queryRequired('clear-all-btn').disabled = true;
        queryRequired('save-btn').disabled = true;
      }
    }
  
    /** @param {string} noteName */
    function recordNote(noteName) {
      if (!isRecording) return;
    
      const timestamp = Date.now() - recordingStartTime;
      recordedNotes.push({ note: noteName, time: timestamp });
    
      // Update recording length display
      const lengthElement = queryRequired('recording-length');
      if (lengthElement) {
        const seconds = Math.floor(timestamp / 1000);
        const minutes = Math.floor(seconds / 60);
        lengthElement.textContent = `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
      }
    }
  
    function playRecording() {
      if (recordedNotes.length === 0) return;

      const playBtn = queryRequired('play-btn');

      if (isPlayingPlayback) {
        clearPlaybackTimeouts();
        if (playBtn) {
          playBtn.disabled = recordedNotes.length === 0;
        }
        return;
      }

      isPlayingPlayback = true;
      if (playBtn) {
        setBtnLabel(playBtn, '⏸️ Stop');
        playBtn.classList.add('playing');
      }

      const layerTempo = layerTempos[currentLayerIndex] || 120;
      const tempoScale = 120 / layerTempo;

      recordedNotes.forEach(({ note, time }) => {
        const adjustedTime = time * tempoScale;
        const timeoutId = setTimeout(() => {
          if (!isPlayingPlayback) return;
          playNoteByName(note);
          highlightPianoKey(note);
        }, adjustedTime);
        playbackTimeouts.push(timeoutId);
      });

      const lastRecordedNote = recordedNotes[recordedNotes.length - 1];
      const totalDuration = lastRecordedNote
        ? (lastRecordedNote.time * tempoScale) + 1000
        : 1000;
      const endTimeoutId = setTimeout(() => {
        clearPlaybackTimeouts();
        if (playBtn) {
          playBtn.disabled = false;
        }
      }, totalDuration);
      playbackTimeouts.push(endTimeoutId);
    }
  
    // Multi-layer loop management
    function toggleLoop() {
      const loopBtn = queryRequired('loop-btn');
    
    
      if (isLooping) {
      // Stop current layer loop
        stopLayerLoop(currentLayerIndex);
        isLooping = false;
        setBtnLabel(loopBtn, '🔄 Loop Current');
        loopBtn.classList.remove('active');
      } else {
      // Start current layer loop
        const activeLayer = loopLayers[currentLayerIndex];
        const notesToPlay = recordedNotes.length > 0 ? recordedNotes :
          (activeLayer ? activeLayer.notes : []);

        if (notesToPlay.length === 0) {
          return;
        }

        startLayerLoop(currentLayerIndex, notesToPlay);
        isLooping = true;
        setBtnLabel(loopBtn, '⏹️ Stop Current');
        loopBtn.classList.add('active');
      }
    }
  
    function toggleLoopAll() {
      const loopAllBtn = queryRequired('loop-all-btn');
    
      if (activeLoopLayers.size > 0) {
      // Stop all loops
        stopAllLoops();
        setBtnLabel(loopAllBtn, '🔄 Loop All');
        loopAllBtn.classList.remove('active');
      } else {
      // Start all layer loops
        if (loopLayers.length === 0) return;
        startAllLoops();
        setBtnLabel(loopAllBtn, '⏹️ Stop All');
        loopAllBtn.classList.add('active');
      }
    }
  
    /** @param {number} layerIndex @param {Array<{ note: string; time: number }>} notes */
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
      const lastNote = notes[notes.length - 1];
      if (!lastNote) {
        return;
      }

      const loopDuration = window.GameUtils.calculateLoopDuration(
        layerTempo,
        lastNote.time
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
  
    /** @param {number} layerIndex */
    function stopLayerLoop(layerIndex) {
      activeLoopLayers.delete(layerIndex);
    
      if (window.layerIntervals && window.layerIntervals.has(layerIndex)) {
        clearInterval(window.layerIntervals.get(layerIndex));
        window.layerIntervals.delete(layerIndex);
      }
    
      if (layerIndex === currentLayerIndex) {
        isLooping = false;
        const loopBtn = queryRequired('loop-btn');
        if (loopBtn) {
          setBtnLabel(loopBtn, '🔄 Loop Current');
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

    /** @returns {unknown[] | null} */
    function getSavedCompositionsFromStorage() {
      try {
        const saved = JSON.parse(localStorage.getItem('musicCompositions') || '[]');
        return Array.isArray(saved) ? saved : [];
      } catch {
        return null;
      }
    }

    /** @param {string} message */
    function showCompositionPanelError(message) {
      const errorElement = getHtmlElement('composition-panel-error');
      if (!errorElement) {
        return;
      }
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
    }

    function clearCompositionPanelError() {
      const errorElement = getHtmlElement('composition-panel-error');
      if (!errorElement) {
        return;
      }
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }

    /** @param {KeyboardEvent} event */
    function handleCompositionPanelKeydown(event) {
      if (event.key !== 'Escape') {
        return;
      }
      const panel = getHtmlElement('composition-panel');
      if (!panel || panel.classList.contains('hidden')) {
        return;
      }
      event.preventDefault();
      closeCompositionPanel();
    }

    function closeCompositionPanel() {
      const panel = getHtmlElement('composition-panel');
      const saveView = getHtmlElement('composition-save-view');
      const loadView = getHtmlElement('composition-load-view');

      if (panel) {
        panel.classList.add('hidden');
        panel.setAttribute('aria-hidden', 'true');
      }
      if (saveView) {
        saveView.classList.add('hidden');
      }
      if (loadView) {
        loadView.classList.add('hidden');
      }

      clearCompositionPanelError();
      document.removeEventListener('keydown', handleCompositionPanelKeydown);

      if (compositionPanelTrigger) {
        compositionPanelTrigger.focus();
        compositionPanelTrigger = null;
      }
    }

    /** @param {'save' | 'load'} mode @param {HTMLElement} trigger */
    function openCompositionPanel(mode, trigger) {
      const panel = getHtmlElement('composition-panel');
      const saveView = getHtmlElement('composition-save-view');
      const loadView = getHtmlElement('composition-load-view');
      const title = getHtmlElement('composition-panel-title');
      const nameInputEl = getHtmlElement('composition-name-input');
      const nameInput = nameInputEl ? asInput(nameInputEl) : null;

      if (!panel || !saveView || !loadView || !title) {
        return;
      }

      compositionPanelTrigger = trigger;
      clearCompositionPanelError();
      panel.classList.remove('hidden');
      panel.setAttribute('aria-hidden', 'false');
      saveView.classList.add('hidden');
      loadView.classList.add('hidden');
      document.addEventListener('keydown', handleCompositionPanelKeydown);

      if (mode === 'save') {
        title.textContent = 'Save Composition';
        saveView.classList.remove('hidden');
        if (nameInput) {
          nameInput.value = '';
          nameInput.focus();
        }
        return;
      }

      title.textContent = 'Load Composition';
      loadView.classList.remove('hidden');
      renderCompositionList();
    }

    function renderCompositionList() {
      const list = getHtmlElement('composition-list');
      const emptyMessage = getHtmlElement('composition-empty-message');
      if (!list || !emptyMessage) {
        return;
      }

      list.innerHTML = '';
      const saved = getSavedCompositionsFromStorage();

      if (saved === null) {
        emptyMessage.classList.add('hidden');
        showCompositionPanelError('Failed to load compositions.');
        return;
      }

      if (saved.length === 0) {
        emptyMessage.classList.remove('hidden');
        return;
      }

      emptyMessage.classList.add('hidden');

      saved.forEach((composition, index) => {
        if (!composition || typeof composition !== 'object' || !('name' in composition)) {
          return;
        }

        const comp = /** @type {{ name: string; timestamp?: string }} */ (composition);
        const item = document.createElement('li');
        item.className = 'composition-list-item';
        item.setAttribute('role', 'option');
        item.setAttribute('tabindex', '0');
        const timestamp = comp.timestamp ? new Date(comp.timestamp).toLocaleString() : 'Unknown date';
        item.setAttribute('aria-label', `${comp.name}, saved ${timestamp}`);
        item.innerHTML = `
          <span class="composition-list-name">${comp.name}</span>
          <span class="composition-list-date">${timestamp}</span>
        `;

        const loadAtIndex = () => {
          loadCompositionAtIndex(index);
        };

        item.addEventListener('click', loadAtIndex);
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            loadAtIndex();
          }
        });

        list.appendChild(item);
      });

      const firstItem = list.querySelector('.composition-list-item');
      if (firstItem instanceof HTMLElement) {
        firstItem.focus();
      }
    }

    function confirmSaveComposition() {
      const nameInputEl = getHtmlElement('composition-name-input');
      const nameInput = nameInputEl ? asInput(nameInputEl) : null;
      const name = nameInput?.value.trim() ?? '';

      if (!name) {
        showCompositionPanelError('Please enter a composition name.');
        nameInput?.focus();
        return;
      }

      if (!hasRecordableContent()) {
        showCompositionPanelError('Nothing to save. Record at least one note first.');
        return;
      }

      if (recordedNotes.length > 0) {
        saveCurrentRecordingToLayer();
      }

      const composition = window.GameUtils.buildCompositionPayload({
        name,
        loopLayers: loopLayers.map((layer, layerIndex) => ({
          notes: layer.notes,
          name: layer.name ?? `Layer ${layerIndex + 1}`
        })),
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
        closeCompositionPanel();
        queryRequired('recording-status').textContent = `Composition "${name}" saved successfully!`;
      } catch {
        showCompositionPanelError('Failed to save composition. Storage may be full.');
      }
    }

    /** @param {number} index */
    function loadCompositionAtIndex(index) {
      const saved = getSavedCompositionsFromStorage();
      if (saved === null || index < 0 || index >= saved.length) {
        showCompositionPanelError('Failed to load compositions.');
        return;
      }

      const composition = /** @type {{ name: string; instrument: string; effects: typeof currentEffects; tempo: number }} */ (saved[index]);
      applyLoadedComposition(composition);
      closeCompositionPanel();
      queryRequired('recording-status').textContent = `Loaded "${composition.name}" successfully!`;
    }

    /** @param {{ name: string; instrument: string; effects: typeof currentEffects; tempo: number }} composition */
    function applyLoadedComposition(composition) {
      const restored = window.GameUtils.restoreCompositionState(composition);
      loopLayers = /** @type {typeof loopLayers} */ (restored.loopLayers);
      layerTempos = restored.layerTempos;
      currentLayerIndex = restored.currentLayerIndex;
      recordedNotes = /** @type {typeof recordedNotes} */ (restored.recordedNotes);

      currentInstrument = composition.instrument || currentInstrument;
      currentTempo = composition.tempo || currentTempo;

      /** @type {EffectName[]} */
      const effectNames = ['reverb', 'delay', 'chorus', 'distortion', 'filter'];
      if (composition.effects) {
        effectNames.forEach((effect) => {
          const saved = composition.effects[effect];
          if (saved) {
            Object.assign(currentEffects[effect], saved);
          }
        });
      }

      queryRequired('instrument-select').value = currentInstrument;
      queryRequired('tempo-slider').value = String(currentTempo);
      queryRequired('tempo-display').textContent = `${currentTempo} BPM`;

      effectNames.forEach((effect) => {
        const toggle = asInput(queryRequired(`${effect}-toggle`));
        const slider = asInput(queryRequired(`${effect}-amount`));

        toggle.checked = currentEffects[effect].enabled;
        slider.disabled = !currentEffects[effect].enabled;
        syncEffectSlider(effect, slider);
      });

      queryRequired('play-btn').disabled = false;
      queryRequired('loop-btn').disabled = false;
      queryRequired('loop-all-btn').disabled = loopLayers.length === 0;
      queryRequired('clear-btn').disabled = false;
      queryRequired('clear-all-btn').disabled = loopLayers.length === 0;
      queryRequired('save-btn').disabled = false;
      queryRequired('prev-layer-btn').disabled = currentLayerIndex === 0;
      queryRequired('next-layer-btn').disabled = currentLayerIndex >= maxLoopLayers - 1;

      const layerTempoSlider = queryRequired('layer-tempo-slider');
      const layerTempo = layerTempos[currentLayerIndex] || currentTempo;
      layerTempoSlider.value = String(layerTempo);
      queryRequired('layer-tempo').textContent = String(layerTempo);

      updateLayerDisplay();
      updateLayerCounts();

      const notesForDuration = recordedNotes.length > 0
        ? recordedNotes
        : (loopLayers[currentLayerIndex]?.notes || []);
      if (notesForDuration.length > 0) {
        const lastNote = notesForDuration[notesForDuration.length - 1];
        if (lastNote) {
          queryRequired('recording-length').textContent =
            window.GameUtils.formatRecordingLength(lastNote.time);
        }
      } else {
        queryRequired('recording-length').textContent = '0:00';
      }
    }

    function setupCompositionPanel() {
      const saveConfirmBtn = getHtmlElement('composition-save-confirm');
      const cancelSaveBtn = getHtmlElement('composition-cancel-btn');
      const cancelLoadBtn = getHtmlElement('composition-cancel-load-btn');
      const closeBtn = getHtmlElement('composition-panel-close');
      const nameInputEl = getHtmlElement('composition-name-input');
      const nameInput = nameInputEl ? asInput(nameInputEl) : null;

      if (saveConfirmBtn) {
        saveConfirmBtn.addEventListener('click', confirmSaveComposition);
      }
      if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', closeCompositionPanel);
      }
      if (cancelLoadBtn) {
        cancelLoadBtn.addEventListener('click', closeCompositionPanel);
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', closeCompositionPanel);
      }
      if (nameInput) {
        nameInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            confirmSaveComposition();
          }
        });
      }
    }

    function saveRecording() {
      if (!hasRecordableContent()) return;
      const saveBtn = getHtmlElement('save-btn');
      if (saveBtn) {
        openCompositionPanel('save', saveBtn);
      }
    }
  
    function loadRecording() {
      const loadBtn = getHtmlElement('load-btn');
      if (loadBtn) {
        openCompositionPanel('load', loadBtn);
      }
    }

    // Event listeners
    startButton.addEventListener('click', startArrowGame);
    resetButton.addEventListener('click', resetArrowGame);
  
  } catch (error) {
    console.error('Error initializing arrow game:', error);
  }
}); 
