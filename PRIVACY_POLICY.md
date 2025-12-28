# Privacy Policy for TBC Offers Manager

**Last Updated: December 28, 2025**

## Overview

TBC Offers Manager is a Chrome browser extension that helps you manage and organize offers on TBC Bank (tbcbank.ge) and TBC Concept (tbcconcept.ge) websites by allowing you to hide offers with transparency and auto-load all available offers.

## Data Collection

**We do not collect, transmit, or share any personal data.**

### What We Store Locally

The extension stores only the following information **locally on your device**:

- **Hidden Offer URLs**: A list of normalized offer identifiers that you have chosen to hide (e.g., `/xyz/offer-name`)
  - URLs are normalized to work across different languages (en, ka, etc.) and page variations
  - Only the unique offer identifier is stored, not the full URL path
  - Stored using Chrome Sync storage (syncs across your devices if Chrome Sync is enabled)

- **Hidden Categories**: Categories you've chosen to hide (e.g., "For Students", "For Youth", "Concept")
  - Stored using Chrome Sync storage (syncs across your devices if Chrome Sync is enabled)

- **UI Preferences**: Settings like auto-load button visibility
  - Stored locally per device (does not sync across devices)
  - Each device can have its own preferences

### Where Data is Stored

All data is stored using Chrome's built-in storage APIs:

**Chrome Sync Storage (`chrome.storage.sync`):**
- Stores your hidden offers and categories
- Data is stored locally in your browser
- If Chrome Sync is enabled in your browser settings, this data syncs across your Chrome browsers where you're signed in
- Limited to approximately 100KB total storage
- We have no access to this data
- The data never leaves your control

**Chrome Local Storage (`chrome.storage.local`):**
- Stores UI preferences (like auto-load button visibility)
- Data is stored only on the current device
- Does not sync across devices
- Up to 10MB+ storage available
- We have no access to this data
- The data never leaves your control

## Data We Do NOT Collect

- ❌ Personal information (name, email, address, etc.)
- ❌ Browsing history
- ❌ Cookies or tracking data
- ❌ Analytics or usage statistics
- ❌ Financial information
- ❌ Login credentials
- ❌ IP addresses
- ❌ Device information

## Permissions Used

The extension requires the following permissions:

### `storage`
**Purpose**: To save your list of hidden offers so they persist after closing your browser.

### `activeTab`
**Purpose**: To interact with the current TBC Bank or TBC Concept offers pages and add functionality (eye icons, auto-load button).

### Host Permissions
**`https://tbcconcept.ge/*`** and **`https://tbcbank.ge/*`**
**Purpose**: To inject the extension's features only on TBC Bank and TBC Concept website pages. The extension only activates on offers pages (`/*/offers*` URL pattern).

## Third-Party Services

**We do not use any third-party services, analytics, or tracking tools.**

The extension:
- Does not make external API calls
- Does not send data to any server
- Does not communicate with any third-party services
- Does not include any advertising or tracking code

## Data Security

- All data remains on your device
- No data is transmitted over the internet
- No servers or databases are used
- You have full control over your data

## Your Rights

You can:

- **View your data**: Open the extension's options page to see all hidden offers and categories
- **Export your data**: Download your hidden offers and categories list as a JSON file
- **Delete your data**: Use the "Clear All Hidden Offers" or "Clear All Hidden Categories" buttons in the options page
- **Manage preferences**: Toggle UI settings like auto-load button visibility
- **Uninstall**: Removing the extension will delete all stored data (both sync and local)

## Data Retention

- Data is stored indefinitely until you manually clear it or uninstall the extension
- Uninstalling the extension automatically removes all stored data

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document.

## Open Source

This extension is open source. You can inspect the code to verify that:
- No data is collected
- No external connections are made
- Only necessary permissions are used

## Contact

If you have questions about this privacy policy or the extension, please open an issue in the project repository.

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

---

**In Summary:**
- ✅ No data collection
- ✅ No tracking or analytics
- ✅ No external connections
- ✅ All data stays on your device
- ✅ Full user control
- ✅ Open source and transparent

