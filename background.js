// Set up alarm for periodic IP checks
chrome.runtime.onInstalled.addListener((details) => {
  // Check IP every 5 minutes
  chrome.alarms.create('checkIP', {
    periodInMinutes: 5
  });

  // Open welcome page on install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
});

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkIP') {
    checkIPAddress();
  }
});

// Function to check IP address
async function checkIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const newIP = data.ip;

    // Compare with stored IP
    chrome.storage.local.get('currentIP', (result) => {
      const oldIP = result.currentIP;
      
      if (oldIP !== newIP) {
        // Update stored IP
        chrome.storage.local.set({ currentIP: newIP });
        
        // Add to history
        const timestamp = new Date().toLocaleString();
        addToHistory(newIP, timestamp);
        
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'IP Address Changed',
          message: `Your IP address has changed to: ${newIP}`
        });
      }
    });
  } catch (error) {
    console.error('Error checking IP:', error);
  }
}

// Function to add IP to history
function addToHistory(ip, timestamp) {
  chrome.storage.local.get({ ipHistory: [] }, (result) => {
    const history = result.ipHistory;
    history.unshift({ ip, timestamp });
    
    // Keep only last 10 entries
    if (history.length > 10) {
      history.pop();
    }
    
    chrome.storage.local.set({ ipHistory: history });
  });
}
