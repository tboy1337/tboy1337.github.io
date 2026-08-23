/**
 * Native-language (endonym) labels for the Google Translate dropdown.
 *
 * Google localizes option text to the visitor's locale, which makes the list
 * unusable for anyone who cannot read that language. These labels stay in each
 * language's own name so visitors can always find it.
 */

import { getTranslateSelect } from './translate-widget.mjs';

export const TRANSLATE_PLACEHOLDER_LABEL = 'Select Language';

/**
 * Insertion order is the dropdown order passed to Google as includedLanguages.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const LANGUAGE_ENDONYMS = Object.freeze({
  ar: 'العربية',
  bg: 'Български',
  cs: 'Čeština',
  da: 'Dansk',
  nl: 'Nederlands',
  en: 'English',
  fi: 'Suomi',
  fr: 'Français',
  de: 'Deutsch',
  el: 'Ελληνικά',
  he: 'עברית',
  hi: 'हिन्दी',
  hu: 'Magyar',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  no: 'Norsk',
  pl: 'Polski',
  pt: 'Português',
  ro: 'Română',
  ru: 'Русский',
  sk: 'Slovenčina',
  es: 'Español',
  sv: 'Svenska',
  th: 'ไทย',
  tr: 'Türkçe',
  uk: 'Українська',
  vi: 'Tiếng Việt',
  'zh-CN': '中文（简体）',
  'zh-TW': '中文（繁體）'
});

export const INCLUDED_LANGUAGES = Object.keys(LANGUAGE_ENDONYMS).join(',');

/** @type {WeakSet<HTMLSelectElement>} */
const labeledSelects = new WeakSet();

/**
 * @param {string} code
 * @returns {string | undefined}
 */
export function getLanguageEndonym(code) {
  if (code === '') {
    return undefined;
  }

  const normalized = code.replaceAll('_', '-');
  const direct = LANGUAGE_ENDONYMS[normalized];
  if (direct) {
    return direct;
  }

  const lower = normalized.toLowerCase();
  for (const [key, value] of Object.entries(LANGUAGE_ENDONYMS)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }

  return undefined;
}

/**
 * @param {HTMLSelectElement} select
 */
function markUntranslated(select) {
  select.classList.add('notranslate');
  select.setAttribute('translate', 'no');
}

/**
 * @param {HTMLOptionElement} option
 */
function markOptionUntranslated(option) {
  option.classList.add('notranslate');
  option.setAttribute('translate', 'no');
}

/**
 * Rewrite Google Translate option labels to native names.
 *
 * @param {HTMLSelectElement | null} select
 * @returns {number} Number of option labels that changed
 */
export function applyTranslateLanguageLabels(select) {
  if (!(select instanceof HTMLSelectElement)) {
    console.warn('applyTranslateLanguageLabels: expected an HTMLSelectElement', {
      received: select === null ? 'null' : typeof select
    });
    return 0;
  }

  markUntranslated(select);

  const unknownCodes = [];
  let updated = 0;

  for (const option of select.options) {
    markOptionUntranslated(option);

    const code = option.value.trim();
    const label = code === '' ? TRANSLATE_PLACEHOLDER_LABEL : getLanguageEndonym(code);
    if (!label) {
      unknownCodes.push(code);
      continue;
    }

    if (option.textContent !== label) {
      const previousLabel = option.textContent;
      option.textContent = label;
      updated += 1;
      console.debug('Updated Google Translate option label', {
        code: code || '(placeholder)',
        previousLabel,
        label
      });
    }
  }

  if (unknownCodes.length > 0) {
    console.warn('Unknown Google Translate language codes; leaving those labels unchanged', {
      unknownCodes
    });
  }

  if (updated > 0) {
    console.info('Applied native language labels to Google Translate dropdown', {
      updated,
      totalOptions: select.options.length
    });
  }

  return updated;
}

/**
 * Apply native labels and keep them if Google later mutates the select.
 *
 * @param {ParentNode | null} [root]
 * @returns {boolean}
 */
export function attachTranslateLanguageLabels(root = document.getElementById('google_translate_element')) {
  if (!root) {
    console.warn('attachTranslateLanguageLabels: translate root is missing');
    return false;
  }

  if (root instanceof Element) {
    root.classList.add('notranslate');
    root.setAttribute('translate', 'no');
  }

  const select = getTranslateSelect(root);
  if (!select) {
    console.warn('attachTranslateLanguageLabels: language select is missing');
    return false;
  }

  applyTranslateLanguageLabels(select);

  if (labeledSelects.has(select)) {
    console.debug('Native language labels already attached to this Google Translate select');
    return true;
  }

  labeledSelects.add(select);

  const observer = new MutationObserver((mutations) => {
    console.debug('Google Translate select mutated; re-applying native language labels', {
      mutationCount: mutations.length
    });
    applyTranslateLanguageLabels(select);
  });

  observer.observe(select, {
    childList: true,
    subtree: true,
    characterData: true
  });

  console.info('Observing Google Translate select so native language labels persist');
  return true;
}
