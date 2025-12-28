// TBC Offers Manager - Options Page Script

// DOM Elements
const hiddenCountEl = document.getElementById('hiddenCount');
const hiddenOffersListEl = document.getElementById('hiddenOffersList');
const hiddenCategoriesListEl = document.getElementById('hiddenCategoriesList');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const clearBtn = document.getElementById('clearBtn');
const clearCategoriesBtn = document.getElementById('clearCategoriesBtn');
const showAutoLoadBtnCheckbox = document.getElementById('showAutoLoadBtn');
const notification = document.getElementById('notification');

// Load and display hidden offers
async function loadHiddenOffers() {
  return await loadChunkedData(STORAGE_KEY);
}

// Load and display hidden categories
async function loadHiddenCategories() {
  return await loadSimpleData(HIDDEN_CATEGORIES_KEY);
}

// Update the UI
async function updateUI() {
  const hiddenOffers = await loadHiddenOffers();
  const hiddenCategories = await loadHiddenCategories();

  // Update count
  hiddenCountEl.textContent = hiddenOffers.length;

  // Update offers list
  if (hiddenOffers.length === 0) {
    hiddenOffersListEl.innerHTML = '<p class="empty-state">No hidden offers yet</p>';
  } else {
    hiddenOffersListEl.innerHTML = hiddenOffers.map((url, index) => `
      <div class="offer-item" data-index="${index}">
        <span class="offer-url">${url}</span>
        <button class="remove-offer-btn" data-url="${url}">Remove</button>
      </div>
    `).join('');

    // Add event listeners to remove buttons
    const removeButtons = hiddenOffersListEl.querySelectorAll('.remove-offer-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => removeOffer(btn.dataset.url));
    });
  }

  // Update categories list
  if (hiddenCategories.length === 0) {
    hiddenCategoriesListEl.innerHTML = '<p class="empty-state">No hidden categories yet</p>';
  } else {
    hiddenCategoriesListEl.innerHTML = hiddenCategories.map((category, index) => `
      <div class="offer-item" data-index="${index}">
        <span class="offer-url">${category}</span>
        <button class="remove-offer-btn" data-category="${category}">Remove</button>
      </div>
    `).join('');

    // Add event listeners to remove buttons
    const removeButtons = hiddenCategoriesListEl.querySelectorAll('.remove-offer-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => removeCategory(btn.dataset.category));
    });
  }

  // Update settings
  const showAutoLoadButton = await loadLocalSetting(SHOW_AUTOLOAD_BUTTON_KEY, true);
  showAutoLoadBtnCheckbox.checked = showAutoLoadButton;
}

// Remove a single offer
async function removeOffer(url) {
  const hiddenOffers = await loadHiddenOffers();
  const filtered = hiddenOffers.filter(offer => offer !== url);

  await saveChunkedData(STORAGE_KEY, filtered);
  await updateUI();
  showNotification('Offer removed successfully', false);
}

// Remove a single category
async function removeCategory(category) {
  const hiddenCategories = await loadHiddenCategories();
  const filtered = hiddenCategories.filter(cat => cat !== category);

  await saveSimpleData(HIDDEN_CATEGORIES_KEY, filtered);
  await updateUI();
  showNotification('Category removed successfully', false);
}

// Export hidden offers
async function exportHiddenOffers() {
  const hiddenOffers = await loadHiddenOffers();
  const hiddenCategories = await loadHiddenCategories();

  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    hiddenOffers: hiddenOffers,
    hiddenCategories: hiddenCategories
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tbc-hidden-offers-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification('Hidden offers and categories exported successfully', false);
}

// Import hidden offers
async function importHiddenOffers(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.hiddenOffers || !Array.isArray(data.hiddenOffers)) {
      throw new Error('Invalid file format');
    }

    // Merge with existing hidden offers (avoid duplicates)
    const existingOffers = await loadHiddenOffers();
    const mergedOffers = [...new Set([...existingOffers, ...data.hiddenOffers])];

    // Save merged offers using chunking
    await saveChunkedData(STORAGE_KEY, mergedOffers);

    // Merge categories if present
    if (data.hiddenCategories && Array.isArray(data.hiddenCategories)) {
      const existingCategories = await loadHiddenCategories();
      const mergedCategories = [...new Set([...existingCategories, ...data.hiddenCategories])];
      await saveSimpleData(HIDDEN_CATEGORIES_KEY, mergedCategories);
    }

    await updateUI();

    const categoryMsg = data.hiddenCategories ? ` and ${data.hiddenCategories.length} categories` : '';
    showNotification(`Imported ${data.hiddenOffers.length} hidden offers${categoryMsg}`, false);
  } catch (error) {
    console.error('Import error:', error);
    showNotification('Failed to import: Invalid file format', true);
  }
}

// Clear all hidden offers
async function clearAllOffers() {
  if (!confirm('Are you sure you want to clear all hidden offers? This action cannot be undone.')) {
    return;
  }

  await clearChunkedData(STORAGE_KEY);
  await updateUI();
  showNotification('All hidden offers cleared', false);
}

// Clear all hidden categories
async function clearAllCategories() {
  if (!confirm('Are you sure you want to clear all hidden categories? This action cannot be undone.')) {
    return;
  }

  await saveSimpleData(HIDDEN_CATEGORIES_KEY, []);
  await updateUI();
  showNotification('All hidden categories cleared', false);
}

// Show notification
function showNotification(message, isError = false) {
  notification.textContent = message;
  notification.classList.toggle('error', isError);
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Event Listeners
exportBtn.addEventListener('click', exportHiddenOffers);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    importHiddenOffers(file);
    e.target.value = ''; // Reset file input
  }
});
clearBtn.addEventListener('click', clearAllOffers);
if (clearCategoriesBtn) {
  clearCategoriesBtn.addEventListener('click', clearAllCategories);
}

// Settings event listeners
showAutoLoadBtnCheckbox.addEventListener('change', async (e) => {
  await saveLocalSetting(SHOW_AUTOLOAD_BUTTON_KEY, e.target.checked);
  showNotification(`Auto-Load button ${e.target.checked ? 'enabled' : 'disabled'}`, false);
});

// Initialize
updateUI();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Check if any hidden offers chunks changed
    const offersChanged = isChunkedDataChange(changes, STORAGE_KEY);
    const categoriesChanged = changes[HIDDEN_CATEGORIES_KEY];

    if (offersChanged || categoriesChanged) {
      updateUI();
    }
  }
});


