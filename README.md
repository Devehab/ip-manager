# IP Manager Chrome Extension

A powerful and intuitive Chrome extension designed to simplify IP address management and network monitoring for developers.

## Features

- 🔄 Real-time public IP address display
- 🔔 Automatic notifications for IP changes
- 📋 One-click IP copying
- 🕒 Automatic IP refresh every 5 minutes
- 📊 IP change history tracking
- 🔍 Port checking functionality
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

### Copying IP Address
- Click the copy icon next to your IP address
- The IP will be copied to your clipboard
- A visual confirmation will appear

### Checking Ports
1. Enter a port number in the port checker input
2. Click "Check" to test if the port is open
3. Results will be displayed below the input

### Testing Network Connection
1. Click "Test Network Connection"
2. The extension will check your internet connectivity
3. Results will show whether you're online or offline

### IP Change History
- View the last 10 IP address changes
- Each entry includes the IP and timestamp
- History is automatically updated when your IP changes

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
