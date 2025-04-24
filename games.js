// Game Menu System
document.addEventListener('DOMContentLoaded', () => {
  const menuItems = document.querySelectorAll('.game-menu-item');
  const gameSections = document.querySelectorAll('.game-section');
  
  // Global reference to the snake keyboard handler
  window.snakeKeyboardHandler = null;
  
  // Function to switch between games
  function switchGame(gameName) {
    // Hide all game sections
    gameSections.forEach(section => {
      section.classList.add('hidden');
    });
    
    // Deactivate all menu items
    menuItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Show selected game and activate menu item
    document.getElementById(`${gameName}-section`).classList.remove('hidden');
    document.querySelector(`.game-menu-item[data-game="${gameName}"]`).classList.add('active');
    
    // If we're switching away from Snake game, make sure to clean up event listeners
    if (gameName !== 'snake' && window.snakeKeyboardHandler) {
      document.removeEventListener('keydown', window.snakeKeyboardHandler);
    }
  }
  
  // Add click event listeners to menu items
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      const gameName = this.getAttribute('data-game');
      switchGame(gameName);
    });
  });
});

// Memory Card Game
document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.getElementById('memory-game');
  const startButton = document.getElementById('start-game');
  const resetButton = document.getElementById('reset-game');
  const scoreElement = document.getElementById('score');
  const timeElement = document.getElementById('time');
  
  let cards = [];
  let hasFlippedCard = false;
  let lockBoard = false;
  let firstCard, secondCard;
  let score = 0;
  let timeLeft = 60;
  let timer;
  let isGameActive = false;
  
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
    if (isGameActive) return;
    
    isGameActive = true;
    score = 0;
    timeLeft = 60;
    scoreElement.textContent = score;
    timeElement.textContent = timeLeft;
    
    // Remove the centered-content class before creating the grid
    gameContainer.classList.remove('centered-content');
    
    // Create cards
    createCards();
    
    // Start timer
    timer = setInterval(() => {
      timeLeft--;
      timeElement.textContent = timeLeft;
      
      if (timeLeft <= 0 || document.querySelectorAll('.memory-card.matched').length === cards.length) {
        endGame();
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
    shuffleArray(cardIcons);
    
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
    const isMatch = firstCard.dataset.icon === secondCard.dataset.icon;
    
    if (isMatch) {
      disableCards();
      score += 10;
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
    if (document.querySelectorAll('.memory-card.matched').length === cards.length) {
      endGame();
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
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  function resetGame() {
    clearInterval(timer);
    isGameActive = false;
    
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
  
  function endGame() {
    clearInterval(timer);
    isGameActive = false;
    lockBoard = true;
    
    startButton.disabled = false;
    resetButton.disabled = true;
  }
  
  // Event listeners
  if (startButton && resetButton) {
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
  }
}); 

// Snake Game
document.addEventListener('DOMContentLoaded', () => {
  const snakeContainer = document.getElementById('snake-game');
  const snakeStartButton = document.getElementById('start-snake');
  const snakeResetButton = document.getElementById('reset-snake');
  const snakeScoreElement = document.getElementById('snake-score');
  
  if (!snakeContainer) return;
  
  let canvas, ctx;
  let snake = [];
  let food = {};
  let direction = 'right';
  let gameSpeed = 150;
  let snakeSize = 20;
  let snakeScore = 0;
  let gameInterval;
  let isSnakeGameActive = false;
  
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
    
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    canvas.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    canvas.style.borderRadius = '0.25rem';
    
    ctx = canvas.getContext('2d');
    snakeContainer.innerHTML = '';
    snakeContainer.appendChild(canvas);
    
    // Initialize snake
    snake = [
      { x: 100, y: 100 },
      { x: 80, y: 100 },
      { x: 60, y: 100 }
    ];
    
    // Create first food
    createFood();
  }
  
  function startSnakeGame() {
    if (isSnakeGameActive) return;
    
    isSnakeGameActive = true;
    snakeScore = 0;
    snakeScoreElement.textContent = snakeScore;
    
    // Initial setup
    initSnakeGame();
    
    // Define and store the keyboard handler
    window.snakeKeyboardHandler = changeDirection;
    
    // Add keyboard controls
    document.addEventListener('keydown', window.snakeKeyboardHandler);
    
    // Add touch controls for mobile
    addTouchControls();
    
    // Start game loop
    gameInterval = setInterval(gameLoop, gameSpeed);
    
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
    if (
      (newDirection === 'up' && direction !== 'down') ||
      (newDirection === 'down' && direction !== 'up') ||
      (newDirection === 'left' && direction !== 'right') ||
      (newDirection === 'right' && direction !== 'left')
    ) {
      direction = newDirection;
    }
  }
  
  function changeDirection(e) {
    // Prevent default browser scrolling behavior for arrow keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
    }
    
    if (e.key === 'ArrowUp' && direction !== 'down') {
      direction = 'up';
    } else if (e.key === 'ArrowDown' && direction !== 'up') {
      direction = 'down';
    } else if (e.key === 'ArrowLeft' && direction !== 'right') {
      direction = 'left';
    } else if (e.key === 'ArrowRight' && direction !== 'left') {
      direction = 'right';
    }
  }
  
  function gameLoop() {
    if (!isSnakeGameActive) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Move snake
    moveSnake();
    
    // Check collisions
    if (checkCollision()) {
      endSnakeGame();
      return;
    }
    
    // Check if food eaten
    if (snake[0].x === food.x && snake[0].y === food.y) {
      // Increase score
      snakeScore += 10;
      snakeScoreElement.textContent = snakeScore;
      
      // Grow snake (don't remove tail)
      createFood();
    } else {
      // Move normally (remove tail)
      snake.pop();
    }
    
    // Draw food
    drawFood();
    
    // Draw snake
    drawSnake();
  }
  
  function moveSnake() {
    // Calculate new head position
    const head = { x: snake[0].x, y: snake[0].y };
    
    switch (direction) {
      case 'up':
        head.y -= snakeSize;
        break;
      case 'down':
        head.y += snakeSize;
        break;
      case 'left':
        head.x -= snakeSize;
        break;
      case 'right':
        head.x += snakeSize;
        break;
    }
    
    // Add new head to beginning of snake array
    snake.unshift(head);
  }
  
  function checkCollision() {
    const head = snake[0];
    
    // Check wall collision
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= canvas.width ||
      head.y >= canvas.height
    ) {
      return true;
    }
    
    // Check self collision (skip the head)
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    
    return false;
  }
  
  function createFood() {
    // Create food at random position (aligned to grid)
    const gridWidth = canvas.width / snakeSize;
    const gridHeight = canvas.height / snakeSize;
    
    food = {
      x: Math.floor(Math.random() * gridWidth) * snakeSize,
      y: Math.floor(Math.random() * gridHeight) * snakeSize
    };
    
    // Make sure food doesn't appear on snake
    for (let i = 0; i < snake.length; i++) {
      if (food.x === snake[i].x && food.y === snake[i].y) {
        createFood(); // Recursively try again
        return;
      }
    }
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
    
    snakeScore = 0;
    snakeScoreElement.textContent = snakeScore;
    direction = 'right';
    
    snakeStartButton.disabled = false;
    snakeResetButton.disabled = true;
  }
  
  function endSnakeGame() {
    clearInterval(gameInterval);
    
    // Remove keyboard event listener
    if (window.snakeKeyboardHandler) {
      document.removeEventListener('keydown', window.snakeKeyboardHandler);
    }
    
    isSnakeGameActive = false;
    
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
    snakeResetButton.disabled = true;
  }
  
  // Event listeners
  if (snakeStartButton && snakeResetButton) {
    snakeStartButton.addEventListener('click', startSnakeGame);
    snakeResetButton.addEventListener('click', resetSnakeGame);
  }
});

// Typing Speed Test Game
document.addEventListener('DOMContentLoaded', () => {
  const typingContainer = document.getElementById('typing-game');
  const typingStartButton = document.getElementById('start-typing');
  const typingResetButton = document.getElementById('reset-typing');
  const wpmElement = document.getElementById('typing-wpm');
  const accuracyElement = document.getElementById('typing-accuracy');
  
  if (!typingContainer) return;
  
  let startTime;
  let timerInterval;
  let isTypingGameActive = false;
  let totalTyped = 0;
  let correctTyped = 0;
  
  // Collection of text prompts for typing test
  const textPrompts = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.",
    "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall. -Nelson Mandela",
    "Good code is its own best documentation. As you're about to add a comment, ask yourself if you can improve the code instead.",
    "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. -Martin Fowler"
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
    
    // Append elements
    gameWrapper.appendChild(textDisplay);
    gameWrapper.appendChild(typingInput);
    gameWrapper.appendChild(timerDisplay);
    typingContainer.appendChild(gameWrapper);
  }
  
  function startTypingGame() {
    if (isTypingGameActive) return;
    
    isTypingGameActive = true;
    totalTyped = 0;
    correctTyped = 0;
    
    // Initialize game
    initTypingGame();
    
    // Get elements
    const textDisplay = document.getElementById('text-display');
    const typingInput = document.getElementById('typing-input');
    const timerDisplay = document.getElementById('timer-display');
    
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
    
    // Enable input and focus
    typingInput.disabled = false;
    typingInput.value = '';
    typingInput.focus();
    
    // Start timer (60 seconds)
    let timeLeft = 60;
    timerDisplay.textContent = timeLeft;
    
    startTime = new Date();
    timerInterval = setInterval(() => {
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
    
    // If all characters are correct, end the test
    if (correct && arrayValue.length === arrayPrompt.length) {
      endTypingGame();
    }
    
    // Update stats in real-time
    updateStats();
  }
  
  function updateStats() {
    // Calculate words per minute (WPM)
    // Assuming 5 characters = 1 word, which is a common standard
    const timeInMinutes = (new Date() - startTime) / 1000 / 60;
    const wordsTyped = correctTyped / 5;
    const wpm = Math.round(wordsTyped / timeInMinutes) || 0;
    
    // Calculate accuracy
    const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0;
    
    // Update displays
    wpmElement.textContent = wpm;
    accuracyElement.textContent = accuracy;
  }
  
  function resetTypingGame() {
    clearInterval(timerInterval);
    
    isTypingGameActive = false;
    typingStartButton.disabled = false;
    typingResetButton.disabled = true;
    
    // Reset to initial display
    initTypingDisplay();
    
    // Reset statistics
    wpmElement.textContent = '0';
    accuracyElement.textContent = '0';
  }
  
  function endTypingGame() {
    clearInterval(timerInterval);
    
    const typingInput = document.getElementById('typing-input');
    if (typingInput) {
      typingInput.disabled = true;
      typingInput.removeEventListener('input', checkTyping);
    }
    
    isTypingGameActive = false;
    typingStartButton.disabled = false;
    typingResetButton.disabled = true;
    
    // Final statistics update
    updateStats();
  }
  
  // Event listeners
  if (typingStartButton && typingResetButton) {
    typingStartButton.addEventListener('click', startTypingGame);
    typingResetButton.addEventListener('click', resetTypingGame);
  }
}); 
