/**
 * Snake game logic helpers.
 */

/**
 * @param {string} direction
 * @param {string} nextDirection
 * @returns {boolean}
 */
export function isDirectionQueueAvailable(direction, nextDirection) {
  return direction === nextDirection;
}

/**
 * @param {string} currentDirection
 * @param {string} newDirection
 * @returns {boolean}
 */
export function isValidDirectionChange(currentDirection, newDirection) {
  return (
    (newDirection === 'up' && currentDirection !== 'down')
    || (newDirection === 'down' && currentDirection !== 'up')
    || (newDirection === 'left' && currentDirection !== 'right')
    || (newDirection === 'right' && currentDirection !== 'left')
  );
}

/**
 * @param {string} direction
 * @param {string} nextDirection
 * @param {string} newDirection
 * @returns {string}
 */
export function resolveDirectionChange(direction, nextDirection, newDirection) {
  if (!isDirectionQueueAvailable(direction, nextDirection)) {
    return nextDirection;
  }
  return isValidDirectionChange(direction, newDirection) ? newDirection : nextDirection;
}

/**
 * @param {string} key
 * @param {string} direction
 * @param {string} nextDirection
 * @returns {string}
 */
export function resolveKeyboardDirection(key, direction, nextDirection) {
  /** @type {Record<string, string>} */
  const keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  };
  const newDirection = keyMap[key];
  if (!newDirection) {
    return nextDirection;
  }
  return resolveDirectionChange(direction, nextDirection, newDirection);
}

/**
 * @param {{ x: number; y: number }} head
 * @param {string} direction
 * @param {number} snakeSize
 * @returns {{ x: number; y: number }}
 */
export function getNextHead(head, direction, snakeSize) {
  const next = { x: head.x, y: head.y };
  switch (direction) {
    case 'up':
      next.y -= snakeSize;
      break;
    case 'down':
      next.y += snakeSize;
      break;
    case 'left':
      next.x -= snakeSize;
      break;
    case 'right':
      next.x += snakeSize;
      break;
    default:
      break;
  }
  return next;
}

/**
 * @param {{ x: number; y: number }} head
 * @param {{ x: number; y: number }} food
 * @returns {boolean}
 */
export function isFoodEaten(head, food) {
  return head.x === food.x && head.y === food.y;
}

/**
 * @param {{ x: number; y: number }} head
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {boolean}
 */
export function hitsWall(head, canvasWidth, canvasHeight) {
  return head.x < 0 || head.y < 0 || head.x >= canvasWidth || head.y >= canvasHeight;
}

/**
 * @param {{ x: number; y: number }} head
 * @param {{ x: number; y: number }[]} snakeBody
 * @returns {boolean}
 */
export function hitsSelf(head, snakeBody) {
  for (let i = 1; i < snakeBody.length; i += 1) {
    const segment = snakeBody[i];
    if (segment && head.x === segment.x && head.y === segment.y) {
      return true;
    }
  }
  return false;
}

/**
 * @param {{ x: number; y: number }} head
 * @param {{ x: number; y: number }[]} snakeBody
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {boolean}
 */
export function hasCollision(head, snakeBody, canvasWidth, canvasHeight) {
  return hitsWall(head, canvasWidth, canvasHeight) || hitsSelf(head, snakeBody);
}

/**
 * @param {boolean} foodEaten
 * @returns {boolean}
 */
export function shouldRemoveTail(foodEaten) {
  return !foodEaten;
}
