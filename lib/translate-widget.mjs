/**
 * Google Translate widget helpers — readiness checks, safe branding cleanup,
 * and click forwarding for the native language select.
 */

export const TRANSLATE_SELECT_SELECTOR = 'select.goog-te-combo';
export const READY_POLL_INTERVAL_MS = 100;
export const READY_POLL_MAX_MS = 10000;

/**
 * @param {ParentNode} [root]
 * @returns {HTMLSelectElement | null}
 */
export function getTranslateSelect(root = document) {
  const select = root.querySelector(TRANSLATE_SELECT_SELECTOR);
  return select instanceof HTMLSelectElement ? select : null;
}

/**
 * @param {HTMLSelectElement | null} select
 * @returns {boolean}
 */
export function isTranslateSelectVisible(select) {
  if (!select) {
    return false;
  }

  const style = window.getComputedStyle(select);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  const parentSpan = select.closest('span');
  if (parentSpan) {
    const parentStyle = window.getComputedStyle(parentSpan);
    if (parentStyle.display === 'none') {
      return false;
    }
  }

  return select.offsetParent !== null || select.getClientRects().length > 0;
}

/**
 * @param {ParentNode} [root]
 * @returns {boolean}
 */
export function isTranslateSelectReady(root = document) {
  const select = getTranslateSelect(root);
  if (!select || select.disabled) {
    return false;
  }

  if (select.options.length <= 1) {
    return false;
  }

  return isTranslateSelectVisible(select);
}

/**
 * Remove Google branding without deleting the language select.
 *
 * @param {ParentNode | null} [root]
 */
export function cleanupTranslateBranding(root = document.getElementById('google_translate_element')) {
  if (!root) {
    return;
  }

  root.querySelectorAll('a[href*="translate.google.com"]').forEach((anchor) => {
    const parentSpan = anchor.closest('span');
    if (parentSpan?.querySelector(TRANSLATE_SELECT_SELECTOR)) {
      anchor.remove();
      return;
    }

    (parentSpan ?? anchor).remove();
  });

  root.querySelectorAll('.goog-te-gadget, .goog-te-gadget-simple').forEach((gadget) => {
    Array.from(gadget.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && /\S/.test(node.textContent ?? '')) {
        node.remove();
      }
    });
  });
}

/**
 * @param {ParentNode | null} [root]
 * @returns {boolean}
 */
export function openTranslateSelect(root = document.getElementById('google_translate_element')) {
  if (!root) {
    return false;
  }

  const select = getTranslateSelect(root);
  if (!select) {
    return false;
  }

  select.focus();
  if (typeof select.showPicker === 'function') {
    try {
      select.showPicker();
      return true;
    } catch {
      // showPicker can throw when not triggered by a user gesture.
    }
  }

  select.click();
  return true;
}

/** @type {WeakSet<ParentNode>} */
const clickFallbackRoots = new WeakSet();

/**
 * Forward gadget clicks to the native select (Firefox hit-target safety net).
 *
 * @param {ParentNode | null} [root]
 */
export function attachTranslateClickFallback(root = document.getElementById('google_translate_element')) {
  if (!root || clickFallbackRoots.has(root)) {
    return;
  }

  clickFallbackRoots.add(root);
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.classList.contains('goog-te-combo')) {
      return;
    }

    const gadget = target instanceof Element
      ? target.closest('.goog-te-gadget, .goog-te-gadget-simple')
      : null;
    if (!gadget) {
      return;
    }

    openTranslateSelect(root);
  });
}

/**
 * Poll until the language select is interactive or the timeout elapses.
 *
 * @param {(root: ParentNode) => void} onReady
 * @param {(root: ParentNode) => void} [onTimeout]
 * @param {ParentNode | null} [root]
 */
export function waitForTranslateSelectReady(onReady, onTimeout, root = document.getElementById('google_translate_element')) {
  if (!root) {
    onTimeout?.(document);
    return;
  }

  const startedAt = Date.now();

  const poll = () => {
    if (isTranslateSelectReady(root)) {
      onReady(root);
      return;
    }

    if (Date.now() - startedAt >= READY_POLL_MAX_MS) {
      onTimeout?.(root);
      return;
    }

    setTimeout(poll, READY_POLL_INTERVAL_MS);
  };

  poll();
}
