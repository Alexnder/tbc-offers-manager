# TBC Offers Manager - Chrome Extension

A Chrome extension for managing offers on [tbcconcept.ge](https://tbcconcept.ge) with transparency toggle and auto-load functionality.

## Features

### 🎯 Core Features
- **Toggle Offer Visibility**: Click the eye icon on any offer card to toggle 85% transparency
- **Persistent Storage**: Hidden offers are saved and restored after page refresh
- **Auto-Load All Offers**: Automatically scroll and load all available offers with a single click
- **Import/Export**: Backup and restore your hidden offers list

### 👁️ Eye Icon
- Appears on each offer card in the top-right corner
- Click to hide (85% transparency when not hovering)
- Click again to show (restore full opacity)
- State persists across page refreshes

### 🔄 Auto-Load Button
- Fixed button in the bottom-right corner
- Automatically scrolls down to load all offers
- Stops when all offers are loaded
- Can be cancelled at any time

### ⚙️ Options Page
- View all hidden offers with their URLs
- Remove individual offers from the hidden list
- Export hidden offers to JSON file for backup
- Import hidden offers from JSON file
- Clear all hidden offers

## Installation

1. **Download/Clone the Extension**
   ```bash
   cd /home/user/homedev/tbc-offers/extension
   ```

2. **Create Extension Icons**
   Since the extension needs icons, you'll need to add PNG files to the `icons/` directory:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `/home/user/homedev/tbc-offers/extension` directory

## Usage

### Hiding Offers
1. Visit https://tbcconcept.ge/en/offers?segment=Concept&page=1&filters=Category%21NewYearOffers
2. Each offer card will have an eye icon in the top-right corner
3. Click the eye icon to toggle transparency (hidden/visible)
4. Hidden offers will be at 85% transparency (unless hovered)

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

### Storage
- Uses Chrome's `chrome.storage.sync` API
- Data syncs across Chrome browsers when signed in
- Storage key: `tbc_hidden_offers`
- Stores array of offer URLs

### Content Script Matching
- Matches: `https://tbcconcept.ge/*/offers*`
- Runs at: `document_end`
- Observes DOM for dynamically loaded offers

### Permissions
- `storage`: For saving hidden offers
- `activeTab`: For accessing the current tab
- `https://tbcconcept.ge/*`: Host permission for content script injection

## Browser Compatibility

- **Chrome**: ✅ Full support (Manifest V3)
- **Edge**: ✅ Full support (Chromium-based)
- **Opera**: ✅ Full support (Chromium-based)
- **Firefox**: ⚠️ Requires Manifest V2 conversion

## License

This extension is provided as-is for personal use.

## Support

For issues or questions, please create an issue in the repository.


