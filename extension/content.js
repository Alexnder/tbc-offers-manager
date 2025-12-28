// TBC Offers Manager - Content Script

let hiddenOffers = new Set();
let hiddenCategories = new Set();
let autoLoadButton = null;
let isAutoLoading = false;

// Initialize the extension
async function init() {
  await loadHiddenOffers();
  await loadHiddenCategories();
  addControlButton();
  observeOffers();
  processExistingOffers();
  observeUrlChanges();
}

// Load hidden offers from storage (chunked)
async function loadHiddenOffers() {
  const offers = await loadChunkedData(STORAGE_KEY);
  hiddenOffers = new Set(offers);
}

// Load hidden categories from storage
async function loadHiddenCategories() {
  const categories = await loadSimpleData(HIDDEN_CATEGORIES_KEY);
  hiddenCategories = new Set(categories);
}

// Save hidden offers to storage (chunked by byte size)
async function saveHiddenOffers() {
  const offersArray = Array.from(hiddenOffers);
  await saveChunkedData(STORAGE_KEY, offersArray);
}

// Save hidden categories to storage
async function saveHiddenCategories() {
  const categoriesArray = Array.from(hiddenCategories);
  await saveSimpleData(HIDDEN_CATEGORIES_KEY, categoriesArray);
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

// Get offer categories from badges
function getOfferCategories(offerLink) {
  const categories = [];
  const card = offerLink.querySelector('tbcx-pw-card');
  if (!card) return categories;

  const badges = card.querySelectorAll('tbcx-pw-text-badge .tbcx-pw-text-badge');
  badges.forEach(badge => {
    const categoryText = badge.textContent.trim();
    if (categoryText) {
      categories.push(categoryText);
    }
  });

  return categories;
}

// Check if offer should be hidden by category
function shouldHideByCategory(offerLink) {
  const categories = getOfferCategories(offerLink);
  return categories.some(category => hiddenCategories.has(category));
}

// Add category toggle icons to badges
function addCategoryIcons(offerLink) {
  const card = offerLink.querySelector('tbcx-pw-card');
  if (!card) return;

  const badgeGroup = card.querySelector('tbcx-pw-badge-group .tbcx-pw-badge-group');
  if (!badgeGroup) return;

  // List of categories that should have toggle icons
  const allowedCategories = ['For Students', 'For Youth', 'Concept'];

  const badges = badgeGroup.querySelectorAll('tbcx-pw-text-badge');
  badges.forEach(badgeWrapper => {
    // Check if icon already exists
    if (badgeWrapper.querySelector('.tbc-category-toggle-icon')) {
      return;
    }

    const badgeDiv = badgeWrapper.querySelector('.tbcx-pw-text-badge');
    if (!badgeDiv) return;

    const categoryName = badgeDiv.textContent.trim();
    if (!categoryName) return;

    // Only add icon for allowed categories
    if (!allowedCategories.includes(categoryName)) return;

    // Create small eye icon for category
    const iconContainer = document.createElement('span');
    iconContainer.className = 'tbc-category-toggle-icon';
    iconContainer.title = `Toggle "${categoryName}" category`;

    const isHidden = hiddenCategories.has(categoryName);
    iconContainer.innerHTML = getCategoryEyeIconSVG(isHidden);

    // Add click handler
    iconContainer.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await toggleCategoryVisibility(categoryName, iconContainer);
    });

    // Append icon to badge
    badgeDiv.style.display = 'inline-flex';
    badgeDiv.style.alignItems = 'center';
    badgeDiv.style.gap = '4px';
    badgeDiv.appendChild(iconContainer);
  });
}

// Get small eye icon SVG for categories
function getCategoryEyeIconSVG(isHidden) {
  const size = 14;
  if (isHidden) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3L21 21M10.584 10.587C10.2087 10.9624 9.99778 11.4708 9.99756 12.0013C9.99734 12.5319 10.2078 13.0404 10.5828 13.4161C10.9578 13.7917 11.4661 14.0027 11.9967 14.0029C12.5272 14.0031 13.0357 13.7926 13.4113 13.4176M10.584 10.587L13.4113 13.4176M10.584 10.587L7.36197 7.36201M13.4113 13.4176L7.36197 7.36201M7.36197 7.36201C5.68663 8.49031 4.27451 10.0545 3.27197 11.902C2.90801 12.5772 2.90801 13.4228 3.27197 14.098C5.22297 17.338 8.53597 19.5 11.998 19.5C13.5642 19.5037 15.1062 19.1165 16.49 18.371M19.558 16.558C20.6746 15.4109 21.5784 14.0615 22.222 12.582C22.908 11.098 22.908 9.402 22.222 7.918C20.271 4.678 16.958 2.5 13.496 2.5C12.3516 2.49847 11.217 2.70063 10.144 3.098" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  } else {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5C8.53798 5 5.22498 7.163 3.27398 10.403C2.90998 11.078 2.90998 11.922 3.27398 12.597C5.22498 15.837 8.53798 18 12 18C15.462 18 18.775 15.837 20.726 12.597C21.09 11.922 21.09 11.078 20.726 10.403C18.775 7.163 15.462 5 12 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}

// Toggle category visibility
async function toggleCategoryVisibility(categoryName, iconContainer) {
  const isCurrentlyHidden = hiddenCategories.has(categoryName);

  if (isCurrentlyHidden) {
    // Show category
    hiddenCategories.delete(categoryName);
    iconContainer.innerHTML = getCategoryEyeIconSVG(false);
  } else {
    // Hide category
    hiddenCategories.add(categoryName);
    iconContainer.innerHTML = getCategoryEyeIconSVG(true);
  }

  await saveHiddenCategories();

  // Update all offers with this category
  updateAllOffersVisibility();
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

  // Add category toggle icons to badges
  addCategoryIcons(offerLink);

  // Check if offer has ended - auto-hide ended offers
  const hasEnded = isOfferEnded(offerLink);
  const hiddenByCategory = shouldHideByCategory(offerLink);
  const manuallyHidden = hiddenOffers.has(normalizedUrl);

  // Hide if: manually hidden, hidden by category, or has ended
  let isHidden = manuallyHidden || hiddenByCategory || hasEnded;

  // If ended but was manually hidden, remove from manual hidden list
  // (no need to track ended offers in storage)
  if (hasEnded && manuallyHidden) {
    hiddenOffers.delete(normalizedUrl);
    saveHiddenOffers();
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
  const isManuallyHidden = hiddenOffers.has(offerUrl);
  const hasEnded = isOfferEnded(offerElement);
  const hiddenByCategory = shouldHideByCategory(offerElement);

  if (isManuallyHidden) {
    // Show the offer (remove from manual hidden list)
    hiddenOffers.delete(offerUrl);

    // Check if it should still be hidden due to other reasons
    const shouldStillBeHidden = hasEnded || hiddenByCategory;

    if (shouldStillBeHidden) {
      // Keep it hidden but update icon to show it's not manually hidden
      iconContainer.innerHTML = getEyeIconSVG(true);
    } else {
      // Fully show the offer
      removeHiddenState(offerElement);
      iconContainer.innerHTML = getEyeIconSVG(false);
    }
  } else {
    // Hide the offer (add to manual hidden list)
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

// Update all offers visibility based on current settings
function updateAllOffersVisibility() {
  const offers = document.querySelectorAll('a[href*="/offers/"]');
  offers.forEach(offer => {
    if (!offer.querySelector('tbcx-pw-card')) return;

    const offerUrl = offer.getAttribute('href');
    const normalizedUrl = normalizeOfferUrl(offerUrl);
    const hiddenByUrl = hiddenOffers.has(normalizedUrl);
    const hiddenByCategory = shouldHideByCategory(offer);
    const isHidden = hiddenByUrl || hiddenByCategory;

    const iconContainer = offer.querySelector('.tbc-offer-toggle-icon');

    if (isHidden) {
      applyHiddenState(offer);
      if (iconContainer && !hiddenByUrl) {
        // Don't update icon if manually hidden by URL
        iconContainer.innerHTML = getEyeIconSVG(true);
      }
    } else if (!hiddenByUrl) {
      // Only remove hidden state if not manually hidden
      removeHiddenState(offer);
      if (iconContainer) {
        iconContainer.innerHTML = getEyeIconSVG(false);
      }
    }

    // Update category icons
    const categoryIcons = offer.querySelectorAll('.tbc-category-toggle-icon');
    categoryIcons.forEach(icon => {
      const badge = icon.closest('.tbcx-pw-text-badge');
      if (badge) {
        const categoryName = badge.textContent.trim();
        const isCategoryHidden = hiddenCategories.has(categoryName);
        icon.innerHTML = getCategoryEyeIconSVG(isCategoryHidden);
      }
    });
  });
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
    let offersAdded = false;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Check if the node itself is an offer link
          if (node.matches && node.matches('a[href*="/offers/"]') && node.querySelector('tbcx-pw-card')) {
            addEyeIcon(node);
            offersAdded = true;
          }
          // Check for offer links within the node
          const offers = node.querySelectorAll ? node.querySelectorAll('a[href*="/offers/"]') : [];
          offers.forEach(offer => {
            // Only process if it contains a card (to avoid navigation links)
            if (offer.querySelector('tbcx-pw-card')) {
              addEyeIcon(offer);
              offersAdded = true;
            }
          });
        }
      });
    });

    // Check if we need to show/hide the auto-load button
    if (offersAdded) {
      updateAutoLoadButtonVisibility();
      // Re-check offers after a short delay to catch late-loaded "Ended" status
      setTimeout(recheckOffersForEndedStatus, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Re-check existing offers for "Ended" status that might have been added after initial render
function recheckOffersForEndedStatus() {
  const offers = document.querySelectorAll('a[href*="/offers/"]');
  offers.forEach(offer => {
    if (!offer.querySelector('tbcx-pw-card')) return;

    const hasEnded = isOfferEnded(offer);
    if (!hasEnded) return;

    const offerUrl = offer.getAttribute('href');
    const normalizedUrl = normalizeOfferUrl(offerUrl);
    if (!normalizedUrl || hiddenOffers.has(normalizedUrl)) return;

    // This offer has ended but isn't hidden yet
    applyHiddenState(offer);
    const iconContainer = offer.querySelector('.tbc-offer-toggle-icon');
    if (iconContainer) {
      iconContainer.innerHTML = getEyeIconSVG(true);
    }
  });
}

// Update auto-load button visibility based on offer count
function updateAutoLoadButtonVisibility() {
  if (shouldShowAutoLoadButton()) {
    if (!autoLoadButton && !document.querySelector('.tbc-auto-load-btn')) {
      addControlButton();
    }
  } else {
    if (autoLoadButton || document.querySelector('.tbc-auto-load-btn')) {
      removeControlButton();
    }
  }
}

// Check if current page is an offers page
function isOffersPage() {
  return window.location.pathname.includes('/offers');
}

// Count offers on the page
function countOffers() {
  const offers = document.querySelectorAll('a[href*="/offers/"]');
  let count = 0;
  offers.forEach(offer => {
    // Only count if it contains a card (to avoid navigation links)
    if (offer.querySelector('tbcx-pw-card')) {
      count++;
    }
  });
  return count;
}

// Check if auto-load button should be shown
function shouldShowAutoLoadButton() {
  return isOffersPage() && countOffers() > 6;
}

// Remove auto-load button
function removeControlButton() {
  if (autoLoadButton) {
    autoLoadButton.remove();
    autoLoadButton = null;
  }
  // Also remove any orphaned buttons
  const existingButton = document.querySelector('.tbc-auto-load-btn');
  if (existingButton) {
    existingButton.remove();
  }
}

// Add auto-load button
async function addControlButton() {
  // Check if button already exists
  if (document.querySelector('.tbc-auto-load-btn')) {
    return;
  }

  // Check if user wants to show the button (from local storage)
  const showButton = await loadLocalSetting(SHOW_AUTOLOAD_BUTTON_KEY, true);
  if (!showButton) {
    return; // User disabled the button
  }

  // Only show button on offers pages with more than 6 offers
  if (!shouldShowAutoLoadButton()) {
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

// Observe URL changes (for SPA navigation)
function observeUrlChanges() {
  let lastUrl = location.href;

  // Listen for popstate (back/forward button)
  window.addEventListener('popstate', () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      handleUrlChange();
    }
  });

  // Observe for pushState/replaceState (SPA navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function() {
    originalPushState.apply(this, arguments);
    handleUrlChange();
  };

  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    handleUrlChange();
  };

  // Also observe DOM changes in case the page structure changes
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      handleUrlChange();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// Handle URL changes
function handleUrlChange() {
  if (isOffersPage()) {
    // Wait a bit for offers to load, then check if button should be shown
    setTimeout(() => {
      updateAutoLoadButtonVisibility();
    }, 500);
  } else {
    // Remove button if we're not on offers page
    removeControlButton();
    // Stop auto-loading if it's running
    if (isAutoLoading) {
      stopAutoLoad();
    }
  }
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
  if (namespace === 'sync') {
    // Check if any hidden offers chunks changed
    const offersChanged = isChunkedDataChange(changes, STORAGE_KEY);
    const categoriesChanged = changes[HIDDEN_CATEGORIES_KEY];

    if (offersChanged) {
      await loadHiddenOffers();
    }

    if (categoriesChanged) {
      await loadHiddenCategories();
    }

    // Update all offers with new data
    if (offersChanged || categoriesChanged) {
      updateAllOffersVisibility();
    }
  }

  if (namespace === 'local') {
    // Handle auto-load button visibility setting change (local storage)
    const autoLoadButtonSettingChanged = changes[SHOW_AUTOLOAD_BUTTON_KEY];

    if (autoLoadButtonSettingChanged) {
      const showButton = autoLoadButtonSettingChanged.newValue;
      if (!showButton) {
        // Hide button
        removeControlButton();
      } else {
        // Show button (if conditions met)
        await addControlButton();
      }
    }
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


