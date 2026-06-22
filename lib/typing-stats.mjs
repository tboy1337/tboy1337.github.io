/**
 * Typing speed test statistics helpers.
 */

/**
 * @param {number} totalCorrectCharacters
 * @param {number} correctTyped
 * @param {number} elapsedMs
 * @returns {number}
 */
export function calculateWpm(totalCorrectCharacters, correctTyped, elapsedMs) {
  const timeInMinutes = elapsedMs / 1000 / 60;
  if (timeInMinutes <= 0) {
    return 0;
  }
  const totalCorrectWords = (totalCorrectCharacters + correctTyped) / 5;
  return Math.round(totalCorrectWords / timeInMinutes) || 0;
}

/**
 * @param {number} totalCharactersTyped
 * @param {number} totalTyped
 * @param {number} totalCorrectCharacters
 * @param {number} correctTyped
 * @returns {number}
 */
export function calculateAccuracy(totalCharactersTyped, totalTyped, totalCorrectCharacters, correctTyped) {
  const totalCharsSoFar = totalCharactersTyped + totalTyped;
  const totalCorrectSoFar = totalCorrectCharacters + correctTyped;
  return totalCharsSoFar > 0 ? Math.round((totalCorrectSoFar / totalCharsSoFar) * 100) : 0;
}

/**
 * @param {number} totalCorrectCharacters
 * @param {number} totalCharactersTyped
 * @param {number} elapsedMs
 * @returns {{ wpm: number; accuracy: number }}
 */
export function calculateFinalStats(totalCorrectCharacters, totalCharactersTyped, elapsedMs) {
  const wpm = calculateWpm(totalCorrectCharacters, 0, elapsedMs);
  const accuracy = totalCharactersTyped > 0
    ? Math.round((totalCorrectCharacters / totalCharactersTyped) * 100)
    : 0;
  return { wpm, accuracy };
}
