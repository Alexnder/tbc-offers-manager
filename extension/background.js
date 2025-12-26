// TBC Offers Manager - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('TBC Offers Manager extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getHiddenOffers') {
    chrome.storage.sync.get(['tbc_hidden_offers'], (result) => {
      sendResponse({ hiddenOffers: result.tbc_hidden_offers || [] });
    });
    return true; // Will respond asynchronously
  }

  if (request.action === 'setHiddenOffers') {
    chrome.storage.sync.set({ tbc_hidden_offers: request.hiddenOffers }, () => {
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
});


