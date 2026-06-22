/**
 * Run callback when the document is ready, including after dynamic script injection.
 * @param {() => void} callback
 */
export function onDomReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}
