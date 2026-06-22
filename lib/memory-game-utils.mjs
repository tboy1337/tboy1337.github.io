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
