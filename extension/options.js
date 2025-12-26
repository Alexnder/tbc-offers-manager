// TBC Offers Manager - Options Page Script

const STORAGE_KEY = 'tbc_hidden_offers';

// DOM Elements
const hiddenCountEl = document.getElementById('hiddenCount');
const hiddenOffersListEl = document.getElementById('hiddenOffersList');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const clearBtn = document.getElementById('clearBtn');
const notification = document.getElementById('notification');

// Load and display hidden offers
async function loadHiddenOffers() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const hiddenOffers = result[STORAGE_KEY] || [];
      resolve(hiddenOffers);
    });
  });
}

// Update the UI
async function updateUI() {
  const hiddenOffers = await loadHiddenOffers();

  // Update count
  hiddenCountEl.textContent = hiddenOffers.length;

  // Update list
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
}

// Remove a single offer
async function removeOffer(url) {
  const hiddenOffers = await loadHiddenOffers();
  const filtered = hiddenOffers.filter(offer => offer !== url);

  await chrome.storage.sync.set({ [STORAGE_KEY]: filtered });
  await updateUI();
  showNotification('Offer removed successfully', false);
}

// Export hidden offers
async function exportHiddenOffers() {
  const hiddenOffers = await loadHiddenOffers();

  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    hiddenOffers: hiddenOffers
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

  showNotification('Hidden offers exported successfully', false);
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

    await chrome.storage.sync.set({ [STORAGE_KEY]: mergedOffers });
    await updateUI();

    showNotification(`Imported ${data.hiddenOffers.length} hidden offers`, false);
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

  await chrome.storage.sync.set({ [STORAGE_KEY]: [] });
  await updateUI();
  showNotification('All hidden offers cleared', false);
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

// Initialize
updateUI();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes[STORAGE_KEY]) {
    updateUI();
  }
});


