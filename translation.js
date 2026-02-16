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
  try {
    // Add the language switcher CSS first
    addTranslateStyles();
        
    // Create and insert Google Translate script
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
        
    // Add error handling for script loading
    script.onerror = function() {
      console.warn('Google Translate failed to load. Translation feature will be unavailable.');
      showTranslateError();
    };
        
    script.onload = function() {
      console.log('Google Translate script loaded successfully');
      // Set a timeout to initialize if googleTranslateElementInit hasn't been called
      setTimeout(() => {
        if (!window.googleTranslateInitialized) {
          console.warn('Google Translate initialization timeout');
          showTranslateError();
        }
      }, 10000);
    };
        
    document.body.appendChild(script);
  } catch (error) {
    console.error('Error initializing Google Translate:', error);
    showTranslateError();
  }
}

// Show error message when Google Translate fails
function showTranslateError() {
  const translateElement = document.getElementById('google_translate_element');
  if (translateElement) {
    translateElement.innerHTML = `
            <div class="translate-error" title="Translation service unavailable">
                <i class="fas fa-exclamation-triangle"></i>
                <span style="display: none;">Translation unavailable</span>
            </div>
        `;
    // Show the element even in error state
    translateElement.classList.add('customized');
  }
}

// Store the mutation observer globally so it can be disconnected if needed
window.googleTranslateMutationObserver = null;

// Callback function for Google Translate initialization
// This needs to be in the global scope as it's called by the Google Translate script
window.googleTranslateElementInit = function() {
  try {
    // Mark as initialized to prevent timeout error
    window.googleTranslateInitialized = true;
        
    // The 'google' object is provided by the Google Translate script
     
    new google.translate.TranslateElement({
      pageLanguage: 'en',
       
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false,
      // Include an expanded list of languages
      includedLanguages: 'ar,bg,cs,da,nl,en,fi,fr,de,el,he,hi,hu,id,it,ja,ko,no,pl,pt,ro,ru,sk,es,sv,th,tr,uk,vi,zh-CN,zh-TW',
    }, 'google_translate_element');
    
    // Apply additional styling and customization immediately
    setTimeout(completeCustomization, 100);
        
    console.log('Google Translate initialized successfully');
  } catch (error) {
    console.error('Error during Google Translate initialization:', error);
    showTranslateError();
  }
};

// Force Google Translate styling with maximum specificity
function completeCustomization() {
  const translateElement = document.getElementById('google_translate_element');
  if (!translateElement) {
    setTimeout(completeCustomization, 50);
    return;
  }
    
  // Wait for Google Translate to fully load
  const checkAndStyle = () => {
    const gadgets = translateElement.querySelectorAll('.goog-te-gadget, .goog-te-gadget-simple');
    const selects = translateElement.querySelectorAll('select');
    const spans = translateElement.querySelectorAll('span');
    const links = translateElement.querySelectorAll('a');
        
    if (gadgets.length === 0) {
      setTimeout(checkAndStyle, 10);
      return;
    }
        
    // Apply aggressive styling to override Google's CSS
    const applyForceStyle = (element, styles) => {
      Object.keys(styles).forEach(property => {
        element.style.setProperty(property, styles[property], 'important');
      });
    };
        
    // Style all gadget elements
    gadgets.forEach(gadget => {
      // Force the correct layout first
      applyForceStyle(gadget, {
        'display': 'inline-flex',
        'flex-direction': 'row',
        'align-items': 'center',
        'justify-content': 'center',
        'white-space': 'nowrap',
        'gap': '0px'
      });
            
      // Apply visual styling
      applyForceStyle(gadget, {
        'background': 'linear-gradient(135deg, rgba(15, 12, 41, 0.9), rgba(36, 36, 62, 0.9))',
        'border': '1px solid rgba(255, 255, 255, 0.3)',
        'border-radius': '6px',
        'padding': '10px 12px',
        'margin': '0',
        'color': '#ffffff',
        'font-family': 'Inter, sans-serif',
        'font-size': '14px',
        'font-weight': '500',
        'box-shadow': '0 2px 12px rgba(0, 0, 0, 0.3)',
        'backdrop-filter': 'blur(10px)',
        '-webkit-backdrop-filter': 'blur(10px)',
        'transition': 'all 0.3s ease',
        'min-height': 'auto',
        'line-height': '1.2',
        'vertical-align': 'middle'
      });
            
      // Replace text with SVG globe icon immediately and aggressively
      const replaceWithIcon = () => {
        // Find the main text element that contains the actual text to replace
        const textElements = gadget.querySelectorAll('span');
        let replaced = false;
                
        textElements.forEach(textEl => {
          if (!replaced && textEl.textContent && textEl.textContent.trim() && !textEl.querySelector('svg')) {
            const text = textEl.textContent.trim().toLowerCase();
            // Only replace the main text element that contains the default Google Translate text
            if (text.includes('select') || text.includes('language') || text.includes('translate')) {
              textEl.innerHTML = '<svg style="width: 20px; height: 20px; color: #ffffff; display: inline-block; vertical-align: middle;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg><span style="color: #ffffff; font-size: 12px; margin-left: 4px;">&#9660;</span>';
              replaced = true; // Only replace once
              gadget.setAttribute('data-custom-styled', 'true'); // Mark as processed
                            
              // Show the translate element now that we've replaced the text
              translateElement.classList.add('customized');
            }
          }
        });
      };
            
      // Replace immediately and once more after a short delay
      replaceWithIcon();
      setTimeout(replaceWithIcon, 100);
            
      // Force all child elements into proper layout
      const childElements = gadget.querySelectorAll('*');
      childElements.forEach(child => {
        applyForceStyle(child, {
          'display': 'inline-block',
          'vertical-align': 'middle',
          'margin': '0',
          'padding': '0'
        });
      });
            
      // Hide Google's original dropdown arrow images since we have our own
      const arrowImages = gadget.querySelectorAll('img');
      arrowImages.forEach(img => {
        applyForceStyle(img, {
          'display': 'none'
        });
      });
            
      // Mark this gadget as processed to prevent duplicate processing
      gadget.setAttribute('data-custom-styled', 'true');
    });
        
    // Style select elements
    selects.forEach(select => {
      applyForceStyle(select, {
        'background': 'transparent',
        'border': 'none',
        'color': '#ffffff',
        'font-family': 'Inter, sans-serif',
        'font-size': '14px',
        'font-weight': '500',
        'outline': 'none',
        'cursor': 'pointer'
      });
    });
        
    // Style all text elements
    [...spans, ...links].forEach(element => {
      applyForceStyle(element, {
        'color': '#ffffff',
        'font-family': 'Inter, sans-serif',
        'font-size': '14px',
        'font-weight': '500',
        'text-decoration': 'none'
      });
    });
        
    // Add hover effects via event listeners since CSS might not work
    gadgets.forEach(gadget => {
      gadget.addEventListener('mouseenter', () => {
        applyForceStyle(gadget, {
          'transform': 'translateY(-1px)',
          'box-shadow': '0 4px 18px rgba(0, 0, 0, 0.5)',
          'background': 'linear-gradient(135deg, rgba(48, 43, 99, 0.9), rgba(79, 70, 229, 0.9))'
        });
      });
            
      gadget.addEventListener('mouseleave', () => {
        applyForceStyle(gadget, {
          'transform': 'translateY(0)',
          'box-shadow': '0 2px 12px rgba(0, 0, 0, 0.3)',
          'background': 'linear-gradient(135deg, rgba(15, 12, 41, 0.9), rgba(36, 36, 62, 0.9))'
        });
      });
    });
        
    // Disconnect any existing observer before creating a new one
    if (window.googleTranslateMutationObserver) {
      window.googleTranslateMutationObserver.disconnect();
    }
        
    // Set up a mutation observer to reapply styles if Google overrides them
    window.googleTranslateMutationObserver = new MutationObserver(() => {
      setTimeout(() => {
        const currentGadgets = translateElement.querySelectorAll('.goog-te-gadget, .goog-te-gadget-simple');
        currentGadgets.forEach(gadget => {
          // Only reapply if it hasn't been processed and doesn't already have our styling
          if (!gadget.getAttribute('data-custom-styled') && (!gadget.style.background || !gadget.style.background.includes('linear-gradient')) && !gadget.querySelector('svg')) {
            // Fix layout first
            applyForceStyle(gadget, {
              'display': 'inline-flex',
              'flex-direction': 'row',
              'align-items': 'center',
              'justify-content': 'center',
              'white-space': 'nowrap'
            });
                        
            // Apply styling
            applyForceStyle(gadget, {
              'background': 'linear-gradient(135deg, rgba(15, 12, 41, 0.9), rgba(36, 36, 62, 0.9))',
              'border': '1px solid rgba(255, 255, 255, 0.3)',
              'border-radius': '6px',
              'padding': '10px 12px',
              'margin': '0',
              'color': '#ffffff',
              'font-family': 'Inter, sans-serif',
              'font-size': '14px',
              'font-weight': '500',
              'box-shadow': '0 2px 12px rgba(0, 0, 0, 0.3)',
              'min-height': 'auto',
              'line-height': '1.2'
            });
                        
            // Replace text with SVG globe icon
            const textElements = gadget.querySelectorAll('span');
            let replaced = false;
                        
            textElements.forEach(textEl => {
              if (!replaced && textEl.textContent && textEl.textContent.trim() && !textEl.querySelector('svg')) {
                const text = textEl.textContent.trim().toLowerCase();
                // Only replace the main text element that contains language selection text
                if (text.includes('select') || text.includes('language') || text.includes('translate') || text === 'powered by google' || text.length > 8) {
                  textEl.innerHTML = '<svg style="width: 20px; height: 20px; color: #ffffff; display: inline-block; vertical-align: middle;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg><span style="color: #ffffff; font-size: 12px; margin-left: 4px;">&#9660;</span>';
                  replaced = true; // Only replace once
                                    
                  // Show the translate element now that we've replaced the text
                  translateElement.classList.add('customized');
                }
              }
            });
                        
            // Fix child elements
            const childElements = gadget.querySelectorAll('*');
            childElements.forEach(child => {
              applyForceStyle(child, {
                'display': 'inline-block',
                'vertical-align': 'middle',
                'margin': '0',
                'padding': '0'
              });
            });
                        
            // Hide Google's original arrow images since we have our own
            const arrowImages = gadget.querySelectorAll('img');
            arrowImages.forEach(img => {
              applyForceStyle(img, {
                'display': 'none'
              });
            });
                        
            // Mark this gadget as processed
            gadget.setAttribute('data-custom-styled', 'true');
          }
        });
      }, 200);
    });
        
    window.googleTranslateMutationObserver.observe(translateElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
        
    console.log('Google Translate styling forcefully applied with observer');
  };
    
  checkAndStyle();
}

// Cleanup function to disconnect observer when page unloads
window.addEventListener('beforeunload', () => {
  if (window.googleTranslateMutationObserver) {
    window.googleTranslateMutationObserver.disconnect();
    window.googleTranslateMutationObserver = null;
  }
});

// Add custom styling for the language selector
function addTranslateStyles() {
  const styleElement = document.createElement('style');
  styleElement.id = 'custom-translate-styles';
  styleElement.textContent = `
        /* Initially hide the translate element to prevent text flash */
        #google_translate_element {
            visibility: hidden !important;
            opacity: 0 !important;
            transition: opacity 0.3s ease !important;
        }
        
        /* Show the element only after customization is complete */
        #google_translate_element.customized {
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* Ensure proper display of SVG globe icon */
        #google_translate_element .goog-te-gadget span,
        #google_translate_element .goog-te-gadget-simple span {
            opacity: 1 !important;
            display: inline-block !important;
            vertical-align: middle !important;
        }
        
        /* ULTRA HIGH SPECIFICITY Google Translate overrides */
        html body div#google_translate_element .goog-te-gadget,
        html body div#google_translate_element .goog-te-gadget-simple,
        body div#google_translate_element .goog-te-gadget,
        body div#google_translate_element .goog-te-gadget-simple,
        #google_translate_element .goog-te-gadget,
        #google_translate_element .goog-te-gadget-simple {
            background: linear-gradient(135deg, rgba(15, 12, 41, 0.95), rgba(36, 36, 62, 0.95)) !important;
            border: 1px solid rgba(255, 255, 255, 0.4) !important;
            border-radius: 6px !important;
            padding: 10px 12px !important;
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
            text-decoration: none !important;
            display: inline-flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: nowrap !important;
            gap: 0px !important;
            min-height: auto !important;
            vertical-align: middle !important;
        }
        
        html body div#google_translate_element .goog-te-gadget:hover,
        html body div#google_translate_element .goog-te-gadget-simple:hover,
        body div#google_translate_element .goog-te-gadget:hover,
        body div#google_translate_element .goog-te-gadget-simple:hover {
            background: linear-gradient(135deg, rgba(48, 43, 99, 0.95), rgba(79, 70, 229, 0.95)) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(255, 255, 255, 0.6) !important;
        }
        
        html body div#google_translate_element .goog-te-gadget *,
        html body div#google_translate_element .goog-te-gadget-simple *,
        body div#google_translate_element .goog-te-gadget *,
        body div#google_translate_element .goog-te-gadget-simple *,
        #google_translate_element .goog-te-gadget *,
        #google_translate_element .goog-te-gadget-simple *,
        #google_translate_element select,
        #google_translate_element span,
        #google_translate_element a {
            background: transparent !important;
            border: none !important;
            color: #ffffff !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            text-decoration: none !important;
            outline: none !important;
            box-shadow: none !important;
            display: inline-block !important;
            vertical-align: middle !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        /* Hide Google's original dropdown arrow since we have our own */
        #google_translate_element img,
        #google_translate_element .goog-te-gadget img,
        #google_translate_element .goog-te-gadget-simple img {
            display: none !important;
        }
        
        /* Ensure SVG globe icon is properly styled */
        #google_translate_element svg,
        #google_translate_element .goog-te-gadget svg,
        #google_translate_element .goog-te-gadget-simple svg {
            display: inline-block !important;
            vertical-align: middle !important;
            width: 20px !important;
            height: 20px !important;
            color: #ffffff !important;
            flex-shrink: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        /* Note: Dropdown arrow styling is applied inline via JavaScript */
        

        
        /* Styling for the Google dropdown */
        .goog-te-menu-frame {
            box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
        }
        
        .goog-te-menu2 {
            background: linear-gradient(135deg, rgba(15, 12, 41, 0.95), rgba(26, 26, 26, 0.95)) !important;
            border: none !important;
            padding: 4px !important;
            overflow: hidden !important;
        }
        
        .goog-te-menu2-item div, 
        .goog-te-menu2-item:link div, 
        .goog-te-menu2-item:visited div, 
        .goog-te-menu2-item:active div {
            color: #e0e0e0 !important;
            background: transparent !important;
            font-family: 'Inter', sans-serif !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            padding: 10px 16px !important;
            border-radius: 4px !important;
            margin: 2px !important;
            transition: all 0.2s ease !important;
        }
        
        .goog-te-menu2-item:hover div {
            background: rgba(48, 43, 99, 0.4) !important;
            color: #ffffff !important;
        }
        
        .goog-te-menu2-item-selected div {
            background: linear-gradient(135deg, rgba(48, 43, 99, 0.6), rgba(79, 70, 229, 0.6)) !important;
            color: #ffffff !important;
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
        
        /* Error state styling */
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
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
            #google_translate_element {
                margin-right: 0;
            }
            
            #google_translate_element .goog-te-gadget-simple,
            #google_translate_element .goog-te-gadget {
                font-size: 13px !important;
                padding: 8px 10px !important;
                min-height: auto !important;
                border-radius: 5px !important;
                line-height: 1.2 !important;
            }
            
            .goog-te-menu-frame {
                right: 0 !important;
                left: auto !important;
                max-width: 250px !important;
            }
        }
        
        @media (max-width: 480px) {
            #google_translate_element .goog-te-gadget-simple,
            #google_translate_element .goog-te-gadget {
                padding: 9px 10px !important;
                min-width: 32px !important;
                min-height: auto !important;
                border-radius: 6px !important;
                line-height: 1.2 !important;
            }
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
    
  // Retry customization multiple times very quickly to catch the text replacement
  setTimeout(completeCustomization, 50);
  setTimeout(completeCustomization, 100);
  setTimeout(completeCustomization, 200);
  setTimeout(completeCustomization, 300);
    
  // Safety timeout: Show the element after 3 seconds even if customization didn't complete
  setTimeout(() => {
    const translateElement = document.getElementById('google_translate_element');
    if (translateElement && !translateElement.classList.contains('customized')) {
      console.warn('Google Translate customization timeout - showing element anyway');
      translateElement.classList.add('customized');
    }
  }, 3000);
});
