# IP Manager Chrome Extension

A powerful and intuitive Chrome extension designed to simplify IP address management and network monitoring for developers.

## Features

- 🔄 Real-time public IP address display
- 🔔 Automatic notifications for IP changes
- 📋 One-click IP and URL copying
- 🕒 Automatic IP refresh every 5 minutes
- 📊 Advanced IP history management
  - Search and filter functionality
  - Time-based sorting
  - Export to log file
- 🔍 Enhanced port checking
  - Local network testing
  - Public IP testing
  - Custom host support
  - URL copying for ports
- 🌐 Network connection testing
- 💻 Clean, modern user interface

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the extension directory
4. The IP Manager icon should appear in your Chrome toolbar

## Usage

### Viewing Your IP
- Click the extension icon to view your current public IP address
- The IP address is automatically refreshed every 5 minutes
- Click the refresh button to manually update the IP
- Copy any IP address with one click

### Port Checking
1. Enter a port number (1-65535)
2. Optionally enter a custom host (IP or domain)
3. Click "Check" to test the port
4. Results will show:
   - Internal network status (localhost and 127.0.0.1)
   - External network status (your public IP)
   - Custom host status (if specified)
5. Copy full URLs with one click

### IP History Management
- View and search through IP address changes
- Sort history by time (ascending/descending)
- Export history to a log file
- Copy any IP from history with one click
- Each entry includes:
  - IP address
  - IP type (IPv4/IPv6)
  - Timestamp

## Development

### File Structure
```
├── manifest.json       # Extension configuration
├── popup.html         # Main extension interface
├── popup.js          # Frontend functionality
├── background.js     # Background service worker
├── styles.css        # UI styling
└── icons/           # Extension icons
```

### Requirements
- Chrome Browser
- Developer Mode enabled for loading unpacked extensions

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
