/**
 * Memory card game helpers.
 */

/**
 * @param {string} firstIcon
 * @param {string} secondIcon
 * @returns {boolean}
 */
export function isMemoryMatch(firstIcon, secondIcon) {
  return firstIcon === secondIcon;
}

/**
 * @param {number} currentScore
 * @param {boolean} matched
 * @returns {number}
 */
export function updateMemoryScore(currentScore, matched) {
  return matched ? currentScore + 10 : currentScore;
}

/**
 * @param {number} matchedCount
 * @param {number} totalCards
 * @returns {boolean}
 */
export function isMemoryGameComplete(matchedCount, totalCards) {
  return matchedCount === totalCards;
}

/**
 * @param {string[]} cardIcons
 * @returns {[number, number]}
 */
export function findMismatchedCardIndexes(cardIcons) {
  for (let first = 0; first < cardIcons.length; first += 1) {
    for (let second = first + 1; second < cardIcons.length; second += 1) {
      if (!isMemoryMatch(cardIcons[first] ?? '', cardIcons[second] ?? '')) {
        return [first, second];
      }
    }
  }
  return [0, 1];
}
