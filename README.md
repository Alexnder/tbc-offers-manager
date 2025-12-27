# TBC Offers Manager - Chrome Extension

A Chrome extension for managing offers on [TBC Bank](https://tbcbank.ge) and [TBC Concept](https://tbcconcept.ge) with transparency toggle and auto-load functionality.

**[📥 Install from Chrome Web Store](https://chromewebstore.google.com/detail/tbc-offers-manager/iajjfpbldpfodgbincholpgbcocckeie)**

## Features

### 🎯 Core Features
- **Toggle Offer Visibility**: Click the eye icon on any offer card to toggle 85% transparency
- **Category-Based Hiding**: Hide all offers in specific categories (For Students, For Youth, Concept)
- **Auto-Hide Ended Offers**: Offers marked as "Ended" are automatically hidden
- **Persistent Storage**: Hidden offers and categories are saved and restored after page refresh
- **Auto-Load All Offers**: Automatically scroll and load all available offers with a single click
- **Import/Export**: Backup and restore your hidden offers and categories list

### 👁️ Eye Icon
- Appears on each offer card in the top-right corner
- Click to hide (85% transparency when not hovering)
- Click again to show (restore full opacity)
- State persists across page refreshes

### 🏷️ Category Icons
- Small eye icons appear next to category badges (For Students, For Youth, Concept)
- Click to hide/show all offers in that category
- Category preferences are saved and synced across pages
- Works across both TBC Bank and TBC Concept websites

### 🔄 Auto-Load Button
- Fixed button in the bottom-right corner
- Automatically scrolls down to load all offers
- Stops when all offers are loaded
- Can be cancelled at any time

### ⚙️ Options Page
- View all hidden offers with their URLs
- View and manage hidden categories
- Remove individual offers or categories from the hidden list
- Export hidden offers and categories to JSON file for backup
- Import hidden offers and categories from JSON file
- Clear all hidden offers or categories

## Installation

### Option 1: Install from Chrome Web Store (Recommended)

**[📥 Install TBC Offers Manager](https://chromewebstore.google.com/detail/tbc-offers-manager/iajjfpbldpfodgbincholpgbcocckeie)**

Simply click the link above and click "Add to Chrome" to install the extension.

### Option 2: Install from Source (Development)

1. **Download/Clone the Extension**
   ```bash
   cd tbc-offers/extension
   ```

2. **Icons are Already Included**
   The extension includes pre-generated icons in the `icons/` directory.

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `tbc-offers/extension` directory

## Usage

### Hiding Offers
1. Visit https://tbcbank.ge/en/offers/all-offers or https://tbcconcept.ge/en/offers
2. Each offer card will have an eye icon in the top-right corner
3. Click the eye icon to toggle transparency (hidden/visible)
4. Hidden offers will be at 85% transparency (unless hovered)
5. Hidden offers work across all languages (en, ka, etc.) and both websites

### Hiding by Category
1. Look for category badges on offer cards (e.g., "For Students", "For Youth", "Concept")
2. Click the small eye icon next to the category name
3. All offers in that category will be hidden across all pages
4. Click the eye icon again to show offers from that category
5. Category preferences persist across page refreshes and sync across devices

### Auto-Hiding Ended Offers
- Offers marked as "Ended" are automatically hidden when the page loads
- You can still click their eye icon to show them if needed
- This helps keep the offers page clean and focused on active offers

### Auto-Loading All Offers
1. Click the "Auto-Load All Offers" button in the bottom-right corner
2. The extension will automatically scroll and load all offers
3. Click "Stop Loading..." to cancel at any time
4. A notification will appear when all offers are loaded

### Managing Hidden Offers
1. Click the extension icon in Chrome toolbar
2. Click "Open Settings" to access the options page
3. From there you can:
   - View all hidden offers
   - Remove individual offers
   - Export hidden offers to JSON
   - Import hidden offers from JSON
   - Clear all hidden offers

## Technical Details

### Supported Websites
- **TBC Bank**: `https://tbcbank.ge/*/offers*`
- **TBC Concept**: `https://tbcconcept.ge/*/offers*`
- Works on all language versions (en, ka, etc.)

### Storage
- Uses Chrome's `chrome.storage.sync` API
- Data syncs across Chrome browsers when signed in
- Storage keys: `tbc_hidden_offers*` (chunked), `tbc_hidden_categories`
- Stores normalized offer identifiers (not full URLs)
- **Capacity**: Can store thousands of offers (up to ~3,000-4,000 offers with sync limits)
- Each chunk stores up to 7.5KB of data to stay safely under Chrome's 8KB per-item limit
- Automatic cleanup of old chunks when offers are removed

### Content Script Matching
- Matches: `https://tbcconcept.ge/*/offers*` and `https://tbcbank.ge/*/offers*`
- Runs at: `document_end`
- Observes DOM for dynamically loaded offers

### Permissions
- `storage`: For saving hidden offers
- `activeTab`: For accessing the current tab
- `https://tbcconcept.ge/*` and `https://tbcbank.ge/*`: Host permissions for content script injection

## Browser Compatibility

- **Chrome**: ✅ Full support (Manifest V3)
- **Edge**: ✅ Full support (Chromium-based)
- **Opera**: ✅ Full support (Chromium-based)
- **Firefox**: ⚠️ Requires Manifest V2 conversion

## License

This extension is provided as-is for personal use.

## Support

For issues or questions, please:
- Create an issue in the repository
- Leave a review on the [Chrome Web Store](https://chromewebstore.google.com/detail/tbc-offers-manager/iajjfpbldpfodgbincholpgbcocckeie)

---

**[📥 Get the Extension](https://chromewebstore.google.com/detail/tbc-offers-manager/iajjfpbldpfodgbincholpgbcocckeie)** | [Privacy Policy](PRIVACY_POLICY.md)


