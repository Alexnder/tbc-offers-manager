// TBC Offers Manager - Content Script

const STORAGE_KEY = 'tbc_hidden_offers';
let hiddenOffers = new Set();
let autoLoadButton = null;
let isAutoLoading = false;

// Initialize the extension
async function init() {
  await loadHiddenOffers();
  addControlButton();
  observeOffers();
  processExistingOffers();
}

// Load hidden offers from storage
async function loadHiddenOffers() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      hiddenOffers = new Set(result[STORAGE_KEY] || []);
      resolve();
    });
  });
}

// Save hidden offers to storage
async function saveHiddenOffers() {
  return new Promise((resolve) => {
    chrome.storage.sync.set({
      [STORAGE_KEY]: Array.from(hiddenOffers)
    }, resolve);
  });
}

// Normalize offer URL by removing language prefix and page-specific paths
function normalizeOfferUrl(url) {
  if (!url) return null;

  // Remove language prefix (en, ka, etc.) and page paths (offers, all-offers)
  // Examples:
  // /en/offers/5xrD86h/name -> /5xrD86h/name
  // /ka/offers/all-offers/5xrD86h/name -> /5xrD86h/name
  // /en/offers/all-offers/5xrD86h/name -> /5xrD86h/name

  // Match pattern: /[lang]/offers(/all-offers)?/[id]/[name]
  // Extract just: /[id]/[name]
  const match = url.match(/\/[a-z]{2}\/offers(?:\/all-offers)?\/(.*)/);
  if (match) {
    return '/' + match[1]; // Return /[id]/[name]
  }

  return url; // Return original if pattern doesn't match
}

// Check if offer has ended
function isOfferEnded(offerLink) {
  const card = offerLink.querySelector('tbcx-pw-card');
  if (!card) return false;

  // Look for "Ended" text in the card
  const textElements = card.querySelectorAll('.tbcx-pw-card__text-with-icon-info');
  for (const element of textElements) {
    if (element.textContent.trim().toLowerCase() === 'ended') {
      return true;
    }
  }
  return false;
}

// Add eye icon to offer cards
function addEyeIcon(offerLink) {
  // Check if icon already exists
  if (offerLink.querySelector('.tbc-offer-toggle-icon')) {
    return;
  }

  // The link itself should have href
  const offerUrl = offerLink.getAttribute('href');
  if (!offerUrl || !offerUrl.includes('/offers/')) return;

  // Normalize the URL before checking storage
  const normalizedUrl = normalizeOfferUrl(offerUrl);
  if (!normalizedUrl) return;

  // Check if offer has ended - auto-hide ended offers
  const hasEnded = isOfferEnded(offerLink);
  let isHidden = hiddenOffers.has(normalizedUrl);

  // Auto-hide ended offers if not already in storage
  if (hasEnded && !hiddenOffers.has(normalizedUrl)) {
    isHidden = true;
  }

  // Create the eye icon container
  const iconContainer = document.createElement('div');
  iconContainer.className = 'tbc-offer-toggle-icon';
  iconContainer.title = 'Toggle offer visibility';

  // Create the eye icon (SVG)
  iconContainer.innerHTML = getEyeIconSVG(isHidden);

  // Apply hidden state if needed
  if (isHidden) {
    applyHiddenState(offerLink);
  }

  // Add click handler
  iconContainer.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleOfferVisibility(offerLink, normalizedUrl, iconContainer);
  });

  // Find the card element inside the link and append icon
  const card = offerLink.querySelector('tbcx-pw-card');
  if (card) {
    // Make sure the first div inside card is relative positioned
    const cardInner = card.querySelector('div[class*="tbcx-pw-card"]');
    if (cardInner) {
      cardInner.style.position = 'relative';
      cardInner.appendChild(iconContainer);
    }
  }
}

// Get eye icon SVG based on state
function getEyeIconSVG(isHidden) {
  if (isHidden) {
    // Eye slash icon (hidden)
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3L21 21M10.584 10.587C10.2087 10.9624 9.99778 11.4708 9.99756 12.0013C9.99734 12.5319 10.2078 13.0404 10.5828 13.4161C10.9578 13.7917 11.4661 14.0027 11.9967 14.0029C12.5272 14.0031 13.0357 13.7926 13.4113 13.4176M10.584 10.587L13.4113 13.4176M10.584 10.587L7.36197 7.36201M13.4113 13.4176L7.36197 7.36201M7.36197 7.36201C5.68663 8.49031 4.27451 10.0545 3.27197 11.902C2.90801 12.5772 2.90801 13.4228 3.27197 14.098C5.22297 17.338 8.53597 19.5 11.998 19.5C13.5642 19.5037 15.1062 19.1165 16.49 18.371M19.558 16.558C20.6746 15.4109 21.5784 14.0615 22.222 12.582C22.908 11.098 22.908 9.402 22.222 7.918C20.271 4.678 16.958 2.5 13.496 2.5C12.3516 2.49847 11.217 2.70063 10.144 3.098" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  } else {
    // Eye icon (visible)
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5C8.53798 5 5.22498 7.163 3.27398 10.403C2.90998 11.078 2.90998 11.922 3.27398 12.597C5.22498 15.837 8.53798 18 12 18C15.462 18 18.775 15.837 20.726 12.597C21.09 11.922 21.09 11.078 20.726 10.403C18.775 7.163 15.462 5 12 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}

// Toggle offer visibility
async function toggleOfferVisibility(offerElement, offerUrl, iconContainer) {
  const isCurrentlyHidden = hiddenOffers.has(offerUrl);

  if (isCurrentlyHidden) {
    // Show the offer
    hiddenOffers.delete(offerUrl);
    removeHiddenState(offerElement);
    iconContainer.innerHTML = getEyeIconSVG(false);
  } else {
    // Hide the offer
    hiddenOffers.add(offerUrl);
    applyHiddenState(offerElement);
    iconContainer.innerHTML = getEyeIconSVG(true);
  }

  await saveHiddenOffers();
}

// Apply hidden state (85% transparency)
function applyHiddenState(offerElement) {
  offerElement.classList.add('tbc-offer-hidden');
}

// Remove hidden state
function removeHiddenState(offerElement) {
  offerElement.classList.remove('tbc-offer-hidden');
}

// Process existing offers on the page
function processExistingOffers() {
  const offers = document.querySelectorAll('a[href*="/offers/"]');
  offers.forEach(offer => {
    // Only process if it contains a card (to avoid navigation links)
    if (offer.querySelector('tbcx-pw-card')) {
      addEyeIcon(offer);
    }
  });
}

// Observe for new offers being added to the DOM
function observeOffers() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Check if the node itself is an offer link
          if (node.matches && node.matches('a[href*="/offers/"]') && node.querySelector('tbcx-pw-card')) {
            addEyeIcon(node);
          }
          // Check for offer links within the node
          const offers = node.querySelectorAll ? node.querySelectorAll('a[href*="/offers/"]') : [];
          offers.forEach(offer => {
            // Only process if it contains a card (to avoid navigation links)
            if (offer.querySelector('tbcx-pw-card')) {
              addEyeIcon(offer);
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Add auto-load button
function addControlButton() {
  // Check if button already exists
  if (document.querySelector('.tbc-auto-load-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.className = 'tbc-auto-load-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Auto-Load All Offers</span>
  `;
  button.title = 'Automatically scroll and load all offers';

  button.addEventListener('click', toggleAutoLoad);

  document.body.appendChild(button);
  autoLoadButton = button;
}

// Toggle auto-load functionality
async function toggleAutoLoad() {
  if (isAutoLoading) {
    stopAutoLoad();
  } else {
    startAutoLoad();
  }
}

// Start auto-loading
function startAutoLoad() {
  isAutoLoading = true;
  autoLoadButton.classList.add('active');
  autoLoadButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" stroke="currentColor" stroke-width="2"/>
    </svg>
    <span>Stop Loading...</span>
  `;

  autoScroll();
}

// Stop auto-loading
function stopAutoLoad() {
  isAutoLoading = false;
  autoLoadButton.classList.remove('active');
  autoLoadButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Auto-Load All Offers</span>
  `;
}

// Auto-scroll function
async function autoScroll() {
  if (!isAutoLoading) return;

  const previousHeight = document.body.scrollHeight;
  window.scrollTo(0, document.body.scrollHeight);

  // Wait for new content to load
  await new Promise(resolve => setTimeout(resolve, 1500));

  const newHeight = document.body.scrollHeight;

  // If page height hasn't changed, we've reached the end
  if (newHeight === previousHeight) {
    stopAutoLoad();
    showNotification('All offers loaded!');
  } else {
    // Continue scrolling
    autoScroll();
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'tbc-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Listen for storage changes (from options page)
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && changes[STORAGE_KEY]) {
    await loadHiddenOffers();
    // Reprocess all offers with new data
    const offers = document.querySelectorAll('a[href*="/offers/"]');
    offers.forEach(offer => {
      if (!offer.querySelector('tbcx-pw-card')) return; // Skip non-card links

      const offerUrl = offer.getAttribute('href');
      const normalizedUrl = normalizeOfferUrl(offerUrl);
      const iconContainer = offer.querySelector('.tbc-offer-toggle-icon');

      if (hiddenOffers.has(normalizedUrl)) {
        applyHiddenState(offer);
        if (iconContainer) {
          iconContainer.innerHTML = getEyeIconSVG(true);
        }
      } else {
        removeHiddenState(offer);
        if (iconContainer) {
          iconContainer.innerHTML = getEyeIconSVG(false);
        }
      }
    });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


