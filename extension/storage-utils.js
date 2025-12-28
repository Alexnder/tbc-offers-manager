// TBC Offers Manager - Storage Utilities
// Shared functions for chunked storage operations

const STORAGE_KEY = 'tbc_hidden_offers';
const HIDDEN_CATEGORIES_KEY = 'tbc_hidden_categories';
const SHOW_AUTOLOAD_BUTTON_KEY = 'tbc_show_autoload_button';
const MAX_CHUNK_BYTES = 7500; // Stay safely under 8KB (8,192 bytes)

// Calculate byte size of a string (UTF-8)
function getByteSize(str) {
  return new Blob([str]).size;
}

// Calculate byte size of an array of strings
function getArrayByteSize(arr) {
  return getByteSize(JSON.stringify(arr));
}

// Track ongoing migrations to prevent race conditions
const ongoingMigrations = new Set();

// Load chunked data from storage
async function loadChunkedData(keyPrefix) {
  return new Promise(async (resolve) => {
    // If migration is already in progress for this key, wait for it
    if (ongoingMigrations.has(keyPrefix)) {
      console.log(`[Storage] Migration already in progress for ${keyPrefix}, waiting...`);
      // Wait a bit and retry
      setTimeout(async () => {
        const result = await loadChunkedData(keyPrefix);
        resolve(result);
      }, 500);
      return;
    }

    chrome.storage.sync.get(null, async (result) => {
      const allItems = [];

      // Check for old format (single key without chunks)
      if (result[keyPrefix] && Array.isArray(result[keyPrefix])) {
        console.log(`[Storage] Found old format for ${keyPrefix}, migrating...`);
        ongoingMigrations.add(keyPrefix); // Mark as migrating

        const oldData = result[keyPrefix];
        allItems.push(...oldData);

        // Migrate to new format synchronously (wait for completion)
        await migrateToChunkedFormat(keyPrefix, oldData);

        ongoingMigrations.delete(keyPrefix); // Migration complete
        console.log(`[Storage] Migration complete, returning ${allItems.length} items`);
        resolve(allItems);
      } else {
        // Collect all chunks (new format)
        Object.keys(result).forEach(key => {
          if (key.startsWith(keyPrefix + '_chunk_')) {
            allItems.push(...result[key]);
          }
        });

        resolve(allItems);
      }
    });
  });
}

// Migrate old single-key format to new chunked format
async function migrateToChunkedFormat(keyPrefix, oldData) {
  console.log(`[Storage] Migrating ${oldData.length} items from old format to chunked format`);

  // Save in new chunked format
  await saveChunkedData(keyPrefix, oldData);

  // Remove old single-key storage (synchronously)
  return new Promise((resolve) => {
    chrome.storage.sync.remove([keyPrefix], () => {
      console.log(`[Storage] Migration complete, old key "${keyPrefix}" removed`);
      resolve();
    });
  });
}

// Save chunked data to storage
async function saveChunkedData(keyPrefix, itemsArray) {
  return new Promise((resolve) => {
    const chunks = {};

    let currentChunk = [];
    let currentChunkIndex = 0;

    // Split into chunks based on byte size
    for (const item of itemsArray) {
      // Try adding this item to current chunk
      const testChunk = [...currentChunk, item];
      const testSize = getArrayByteSize(testChunk);

      if (testSize > MAX_CHUNK_BYTES && currentChunk.length > 0) {
        // Current chunk is full, save it and start new chunk
        chunks[`${keyPrefix}_chunk_${currentChunkIndex}`] = currentChunk;
        currentChunkIndex++;
        currentChunk = [item];
      } else {
        // Add to current chunk
        currentChunk.push(item);
      }
    }

    // Save last chunk if not empty
    if (currentChunk.length > 0) {
      chunks[`${keyPrefix}_chunk_${currentChunkIndex}`] = currentChunk;
    }

    // Get existing chunk keys to remove old ones
    chrome.storage.sync.get(null, (result) => {
      const keysToRemove = [];
      Object.keys(result).forEach(key => {
        if (key.startsWith(keyPrefix + '_chunk_') && !chunks[key]) {
          keysToRemove.push(key);
        }
      });

      // Remove old chunks
      if (keysToRemove.length > 0) {
        chrome.storage.sync.remove(keysToRemove, () => {
          // Save new chunks
          chrome.storage.sync.set(chunks, resolve);
        });
      } else {
        // Save new chunks
        chrome.storage.sync.set(chunks, resolve);
      }
    });
  });
}

// Clear all chunked data
async function clearChunkedData(keyPrefix) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (result) => {
      const keysToRemove = [];
      Object.keys(result).forEach(key => {
        if (key.startsWith(keyPrefix + '_chunk_')) {
          keysToRemove.push(key);
        }
      });

      if (keysToRemove.length > 0) {
        chrome.storage.sync.remove(keysToRemove, resolve);
      } else {
        resolve();
      }
    });
  });
}

// Load simple (non-chunked) data from storage
async function loadSimpleData(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key] || []);
    });
  });
}

// Save simple (non-chunked) data to storage
async function saveSimpleData(key, data) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: data }, resolve);
  });
}

// Load setting from local storage (not synced)
async function loadLocalSetting(key, defaultValue = true) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}

// Save setting to local storage (not synced)
async function saveLocalSetting(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

// Check if a storage change is for chunked data
function isChunkedDataChange(changes, keyPrefix) {
  return Object.keys(changes).some(key => key.startsWith(keyPrefix + '_chunk_'));
}

