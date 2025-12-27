// TBC Offers Manager - Popup Script

// DOM Elements
const hiddenCountEl = document.getElementById('hiddenCount');
const openOptionsBtn = document.getElementById('openOptionsBtn');

// Load and display count
async function updateCount() {
  const hiddenOffers = await loadChunkedData(STORAGE_KEY);
  hiddenCountEl.textContent = hiddenOffers.length;
}

// Open options page
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Initialize
updateCount();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Check if any hidden offers chunks changed
    const offersChanged = isChunkedDataChange(changes, STORAGE_KEY);

    if (offersChanged) {
      updateCount();
    }
  }
});


