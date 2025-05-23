/**
 * Website Translation Functionality
 * 
 * This script integrates Google Translate functionality into the website
 * allowing visitors to translate the content into their preferred language.
 * 
 * Supported languages include:
 * - Arabic (ar)
 * - Bulgarian (bg)
 * - Czech (cs)
 * - Danish (da)
 * - Dutch (nl)
 * - English (en)
 * - Finnish (fi)
 * - French (fr)
 * - German (de)
 * - Greek (el)
 * - Hebrew (he)
 * - Hindi (hi)
 * - Hungarian (hu)
 * - Indonesian (id)
 * - Italian (it)
 * - Japanese (ja)
 * - Korean (ko)
 * - Norwegian (no)
 * - Polish (pl)
 * - Portuguese (pt)
 * - Romanian (ro)
 * - Russian (ru)
 * - Slovak (sk)
 * - Spanish (es)
 * - Swedish (sv)
 * - Thai (th)
 * - Turkish (tr)
 * - Ukrainian (uk)
 * - Vietnamese (vi)
 * - Chinese (Simplified) (zh-CN)
 * - Chinese (Traditional) (zh-TW)
 */

// Initialize the Google Translate widget
function initGoogleTranslate() {
  // Create and insert Google Translate script
  const script = document.createElement('script');
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
  
  // Add the language switcher CSS
  addTranslateStyles();
}

// Callback function for Google Translate initialization
// This needs to be in the global scope as it's called by the Google Translate script
window.googleTranslateElementInit = function() {
  // The 'google' object is provided by the Google Translate script
  // eslint-disable-next-line no-undef
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    // eslint-disable-next-line no-undef
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay: false,
    // Include an expanded list of languages
    includedLanguages: 'ar,bg,cs,da,nl,en,fi,fr,de,el,he,hi,hu,id,it,ja,ko,no,pl,pt,ro,ru,sk,es,sv,th,tr,uk,vi,zh-CN,zh-TW',
  }, 'google_translate_element');
  
  // Apply additional styling and customization
  setTimeout(completeCustomization, 800);
};

// Custom function to replace the Google Translate dropdown with our own styled version
function completeCustomization() {
  // Get the Google Translate element
  const translateElement = document.getElementById('google_translate_element');
  if (!translateElement) return;
  
  // First, check if our custom button already exists
  if (translateElement.querySelector('.custom-translate-button')) {
    return;
  }
  
  // Make original elements' positions more absolute but keep them accessible
  const originalElements = translateElement.querySelectorAll('.goog-te-gadget, .goog-te-gadget-simple');
  originalElements.forEach(el => {
    el.style.opacity = '0.01'; // Almost invisible but still interactable
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.zIndex = '1'; // Above our custom button
    el.style.cursor = 'pointer';
  });
  
  // Create our custom language button (positioned below the original elements)
  const customButton = document.createElement('div');
  customButton.className = 'custom-translate-button';
  customButton.innerHTML = '<i class="fas fa-language"></i> <span>Language</span>';
  customButton.style.position = 'relative';
  customButton.style.zIndex = '0'; // Below the original but visible
  translateElement.appendChild(customButton);
  
  // Make sure the container has proper positioning for overlap
  translateElement.style.position = 'relative';
  translateElement.style.display = 'inline-block';
  
  // Log for debugging
  console.log('Translation button setup complete');
}

// Add custom styling for the language selector
function addTranslateStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Custom translation button styles */
    #google_translate_element {
      display: inline-block;
      position: relative;
    }
    
    .custom-translate-button {
      background-color: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: #e0e0e0;
      cursor: pointer;
      display: flex;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      gap: 8px;
      padding: 6px 12px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      pointer-events: none; /* Important: let clicks pass through to the actual control */
    }
    
    .custom-translate-button:hover {
      background-color: rgba(0, 0, 0, 0.6);
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    .custom-translate-button i {
      font-size: 16px;
    }
    
    /* Make sure original control doesn't interfere visually but remains clickable */
    #google_translate_element .goog-te-gadget-simple {
      cursor: pointer;
    }
    
    /* Styling for the Google dropdown */
    .goog-te-menu-frame {
      box-shadow: 0 3px 8px rgba(0,0,0,0.3) !important;
      border-radius: 4px !important;
      overflow: hidden !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    .goog-te-menu2 {
      background-color: #1a1a1a !important;
      border: none !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    
    .goog-te-menu2-item div, 
    .goog-te-menu2-item:link div, 
    .goog-te-menu2-item:visited div, 
    .goog-te-menu2-item:active div {
      color: #e0e0e0 !important;
      background-color: #1a1a1a !important;
      font-family: 'Inter', sans-serif !important;
      font-size: 14px !important;
      padding: 8px 12px !important;
    }
    
    .goog-te-menu2-item:hover div {
      background-color: #333 !important;
    }
    
    .goog-te-menu2-item-selected div {
      background-color: #302b63 !important;
    }
    
    /* Hide the Google translate toolbar at the top */
    .goog-te-banner-frame {
      display: none !important;
    }
    
    body {
      top: 0 !important;
    }
    
    /* Fix for the dropdown positioning */
    .goog-te-menu-frame {
      margin-top: 5px !important;
      left: auto !important;
      right: 0 !important;
    }
  `;
  document.head.appendChild(styleElement);
}

// Remove any Google-added elements from the page body
function cleanupGoogleElements() {
  // Remove the Google top banner if it exists
  const bannerFrame = document.querySelector('.goog-te-banner-frame');
  if (bannerFrame) {
    bannerFrame.remove();
  }
  
  // Reset the body position if Google altered it
  document.body.style.top = '0';
  document.body.classList.remove('translated-rtl');
  
  // Fix various Google injected styles
  const googleStyleElems = document.querySelectorAll('style[id^="goog-"]');
  googleStyleElems.forEach(el => {
    if (el.textContent.includes('top: -40px')) {
      el.textContent = el.textContent.replace('top: -40px', 'top: 0px');
    }
  });
}

// Initialize the translation functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initGoogleTranslate();
  
  // Clean up any Google elements periodically to ensure they don't interfere with the page
  setTimeout(cleanupGoogleElements, 1500);
  setInterval(cleanupGoogleElements, 5000);
  
  // Retry customization a few times to ensure it works
  for (let i = 1; i <= 5; i++) {
    setTimeout(completeCustomization, 1000 * i);
  }
}); 
