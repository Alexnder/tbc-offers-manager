// TBC Offers Manager - Popup Script

const STORAGE_KEY = 'tbc_hidden_offers';

// DOM Elements
const hiddenCountEl = document.getElementById('hiddenCount');
const openOptionsBtn = document.getElementById('openOptionsBtn');

// Load and display count
async function updateCount() {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    const hiddenOffers = result[STORAGE_KEY] || [];
    hiddenCountEl.textContent = hiddenOffers.length;
  });
}

// Open options page
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Initialize
updateCount();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes[STORAGE_KEY]) {
    updateCount();
  }
});


