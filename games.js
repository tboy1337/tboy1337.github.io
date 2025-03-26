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
  
  function startGame() {
    if (isGameActive) return;
    
    isGameActive = true;
    score = 0;
    timeLeft = 60;
    scoreElement.textContent = score;
    timeElement.textContent = timeLeft;
    
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
    cardIcons.forEach((icon, index) => {
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
    
    cards.forEach(card => {
      card.classList.remove('flipped', 'matched');
      card.addEventListener('click', flipCard);
    });
    
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
    
    // Show final score
    alert(`Game Over! Your score: ${score}`);
    
    startButton.disabled = false;
    resetButton.disabled = true;
  }
  
  // Event listeners
  startButton.addEventListener('click', startGame);
  resetButton.addEventListener('click', resetGame);
}); 
