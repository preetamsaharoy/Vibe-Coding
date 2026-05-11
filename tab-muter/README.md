# Tab Muter

A minimal Chrome extension to mute and unmute any tab with one click.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

## Features

- **One-click mute** — mute or unmute the current tab instantly
- **Audio tab list** — see all tabs playing audio in one place
- **Per-tab control** — mute any individual tab from the popup
- **Mute all** — silence every tab playing audio at once
- **Zero config** — works out of the box, nothing to set up
- **No data collected** — fully local, no network requests, no tracking

## Installation

### From the Chrome Web Store
*Coming soon*

### Load locally (Developer Mode)
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `tab-muter` folder
5. The extension icon appears in your toolbar

## Project structure

```
tab-muter/
├── manifest.json        # Extension config (Manifest V3)
├── popup.html           # Popup UI
├── popup.js             # All extension logic (~100 lines)
├── privacy-policy.html  # Hosted privacy policy
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## How it works

The entire core is one Chrome API call:

```js
chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted });
```

The popup queries all audible and muted tabs, renders them as a list, and lets you toggle any of them. No server, no backend, no dependencies.

## Permissions

- `tabs` — needed to read tab mute state and toggle it. Nothing else.

## Privacy

Tab Muter collects no data. See [privacy-policy.html](./privacy-policy.html) for the full policy.

## License

MIT — free to use, modify, and distribute.
