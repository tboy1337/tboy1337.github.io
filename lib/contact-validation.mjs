/**
 * Contact form validation helpers shared by index.html and unit tests.
 */

/**
 * @param {string} name
 * @returns {boolean}
 */
export function validateName(name) {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50 && /^\p{L}[\p{L}\s'-]*$/u.test(trimmed);
}

/**
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * @param {string} subject
 * @returns {boolean}
 */
export function validateSubject(subject) {
  const trimmed = subject.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}

/**
 * @param {string} message
 * @returns {boolean}
 */
export function validateMessage(message) {
  const trimmed = message.trim();
  return trimmed.length >= 10 && trimmed.length <= 1000;
}
