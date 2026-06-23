/**
 * Website Translation Functionality
 *
 * Integrates the Google Translate widget. Styling is CSS-only so the native
 * language <select> stays interactive.
 */

import {
  restoreHashScroll
} from './lib/hash-scroll.mjs';

const INCLUDED_LANGUAGES = 'ar,bg,cs,da,nl,en,fi,fr,de,el,he,hi,hu,id,it,ja,ko,no,pl,pt,ro,ru,sk,es,sv,th,tr,uk,vi,zh-CN,zh-TW';
const INIT_TIMEOUT_MS = 10000;
const READY_FALLBACK_MS = 5000;

/** @type {ReturnType<typeof setInterval> | null} */
let cleanupIntervalId = null;

/** @param {HTMLElement | null} translateElement */
function markTranslateReady(translateElement) {
  if (!translateElement) {
    return;
  }

  if (!translateElement.classList.contains('customized')) {
    translateElement.classList.add('customized');
  }

  restoreHashScroll();
}

function showTranslateError() {
  const translateElement = document.getElementById('google_translate_element');
  if (!translateElement) {
    return;
  }

  translateElement.innerHTML = `
    <div class="translate-error" title="Translation service unavailable">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      <span>Translation unavailable</span>
    </div>
  `;
  markTranslateReady(translateElement);
}

// Register before element.js loads — Google calls this callback by name.
window.googleTranslateElementInit = function googleTranslateElementInit() {
  try {
    window.googleTranslateInitialized = true;

    new google.translate.TranslateElement({
      pageLanguage: 'en',
      layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
      autoDisplay: false,
      includedLanguages: INCLUDED_LANGUAGES
    }, 'google_translate_element');

    markTranslateReady(document.getElementById('google_translate_element'));
    setTimeout(cleanupGoogleElements, 100);
  } catch (error) {
    console.error('Error during Google Translate initialization:', error);
    showTranslateError();
  }
};

function initGoogleTranslate() {
  try {
    addTranslateStyles();

    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;

    script.onerror = () => {
      console.warn('Google Translate failed to load. Translation feature will be unavailable.');
      showTranslateError();
    };

    script.onload = () => {
      setTimeout(() => {
        if (!window.googleTranslateInitialized) {
          console.warn('Google Translate initialization timeout');
          showTranslateError();
        }
      }, INIT_TIMEOUT_MS);
    };

    document.body.appendChild(script);
  } catch (error) {
    console.error('Error initializing Google Translate:', error);
    showTranslateError();
  }
}

function cleanupGoogleElements() {
  const bannerFrame = document.querySelector('.goog-te-banner-frame');
  if (bannerFrame) {
    bannerFrame.remove();
  }

  document.body.style.top = '0';
  document.body.classList.remove('translated-rtl');

  const googleStyleElems = document.querySelectorAll('style[id^="goog-"]');
  googleStyleElems.forEach((el) => {
    if (el.textContent.includes('top: -40px')) {
      el.textContent = el.textContent.replace('top: -40px', 'top: 0px');
    }
  });
}

function startCleanupInterval() {
  if (cleanupIntervalId !== null) {
    return;
  }
  cleanupIntervalId = setInterval(cleanupGoogleElements, 15000);
}

function stopCleanupInterval() {
  if (cleanupIntervalId === null) {
    return;
  }
  clearInterval(cleanupIntervalId);
  cleanupIntervalId = null;
}

function addTranslateStyles() {
  if (document.getElementById('custom-translate-styles')) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'custom-translate-styles';
  styleElement.textContent = `
    #google_translate_element {
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    #google_translate_element.customized {
      opacity: 1;
    }

    #google_translate_element .goog-te-gadget,
    #google_translate_element .goog-te-gadget-simple {
      background: linear-gradient(135deg, rgba(15, 12, 41, 0.95), rgba(36, 36, 62, 0.95)) !important;
      border: 1px solid rgba(255, 255, 255, 0.4) !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      margin: 0 !important;
      color: #ffffff !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      line-height: 1.2 !important;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      cursor: pointer !important;
      display: inline-flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      white-space: nowrap !important;
      vertical-align: middle !important;
      position: relative !important;
    }

    #google_translate_element .goog-te-gadget::before,
    #google_translate_element .goog-te-gadget-simple::before {
      content: '';
      display: inline-block;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E");
      pointer-events: none;
    }

    #google_translate_element .goog-te-gadget:hover,
    #google_translate_element .goog-te-gadget-simple:hover {
      background: linear-gradient(135deg, rgba(48, 43, 99, 0.95), rgba(79, 70, 229, 0.95)) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5) !important;
      border-color: rgba(255, 255, 255, 0.6) !important;
    }

    #google_translate_element .goog-te-gadget span.goog-te-menu2,
    #google_translate_element .goog-te-gadget .goog-te-menu-value span:first-child,
    #google_translate_element .goog-te-gadget-simple span:not(:has(select)) {
      font-size: 0 !important;
      line-height: 0 !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
    }

    #google_translate_element select.goog-te-combo {
      background: transparent !important;
      border: none !important;
      color: #ffffff !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      outline: none !important;
      cursor: pointer !important;
      margin: 0 !important;
      padding: 0 4px 0 0 !important;
      min-width: 0 !important;
      max-width: 120px !important;
      pointer-events: auto !important;
      opacity: 1 !important;
      appearance: auto !important;
      -webkit-appearance: menulist !important;
    }

    #google_translate_element img,
    #google_translate_element .goog-te-gadget img {
      display: none !important;
    }

    .goog-te-menu-frame {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
      border-radius: 8px !important;
      overflow: hidden !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      margin-top: 5px !important;
      left: auto !important;
      right: 0 !important;
    }

    .goog-te-menu2 {
      background: linear-gradient(135deg, rgba(15, 12, 41, 0.95), rgba(26, 26, 26, 0.95)) !important;
      border: none !important;
      padding: 4px !important;
    }

    .goog-te-menu2-item div,
    .goog-te-menu2-item:link div,
    .goog-te-menu2-item:visited div,
    .goog-te-menu2-item:active div {
      color: #e0e0e0 !important;
      background: transparent !important;
      font-family: 'Inter', sans-serif !important;
      font-size: 14px !important;
      padding: 10px 16px !important;
    }

    .goog-te-menu2-item:hover div {
      background: rgba(48, 43, 99, 0.4) !important;
      color: #ffffff !important;
    }

    .goog-te-banner-frame {
      display: none !important;
    }

    body {
      top: 0 !important;
    }

    .translate-error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 6px;
      color: #fca5a5;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: default;
    }

    @media (max-width: 768px) {
      #google_translate_element .goog-te-gadget-simple {
        font-size: 13px !important;
        padding: 8px 10px !important;
      }

      #google_translate_element select.goog-te-combo {
        max-width: 90px !important;
        font-size: 13px !important;
      }

      .goog-te-menu-frame {
        max-width: 250px !important;
      }
    }
  `;
  document.head.appendChild(styleElement);
}

document.addEventListener('DOMContentLoaded', () => {
  initGoogleTranslate();

  setTimeout(cleanupGoogleElements, 1500);
  startCleanupInterval();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopCleanupInterval();
      return;
    }
    cleanupGoogleElements();
    startCleanupInterval();
  });

  setTimeout(() => {
    const translateElement = document.getElementById('google_translate_element');
    if (translateElement && !translateElement.classList.contains('customized')) {
      markTranslateReady(translateElement);
    } else {
      restoreHashScroll();
    }
  }, READY_FALLBACK_MS);
});

window.addEventListener('beforeunload', () => {
  stopCleanupInterval();
});
