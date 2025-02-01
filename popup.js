document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const currentIPElement = document.getElementById('currentIP');
  const copyIPButton = document.getElementById('copyIP');
  const refreshIPButton = document.getElementById('refreshIP');
  const portInput = document.getElementById('portInput');
  const checkPortButton = document.getElementById('checkPort');
  const portResult = document.getElementById('portResult');
  const testNetworkButton = document.getElementById('testNetwork');
  const networkStatus = document.getElementById('networkStatus');
  const ipHistory = document.getElementById('ipHistory');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Show toast notification
  function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
    
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      toast.classList.remove('translate-x-0', 'opacity-100');
    }, 3000);
  }

  // Add loading spinner
  function addSpinner(element) {
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    element.disabled = true;
  }

  function removeSpinner(element, originalContent) {
    element.innerHTML = originalContent;
    element.disabled = false;
  }

  // Fetch IP address
  async function fetchIP() {
    try {
      // Try to get IPv4 specifically
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ip = data.ip;
      
      // Check if IP is IPv4 or IPv6
      const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
      
      return {
        ip: ip,
        type: isIPv4 ? 'IPv4' : 'IPv6'
      };
    } catch (error) {
      console.error('Error fetching IP:', error);
      return null;
    }
  }

  // Update IP display
  async function updateIP(manual = false) {
    const originalContent = refreshIPButton.innerHTML;
    addSpinner(refreshIPButton);
    currentIPElement.textContent = 'Updating...';
    
    const ipData = await fetchIP();
    
    if (ipData) {
      const oldIP = await chrome.storage.local.get('currentIP');
      currentIPElement.innerHTML = `${ipData.ip} <span class="text-sm text-gray-500">(${ipData.type})</span>`;
      
      if (oldIP.currentIP !== ipData.ip) {
        chrome.storage.local.set({ currentIP: ipData.ip });
        const timestamp = new Date().toLocaleString();
        addToHistory(ipData.ip, timestamp, ipData.type);
        
        if (!manual) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'IP Address Changed',
            message: `Your ${ipData.type} address has changed to: ${ipData.ip}`
          });
        }
      }
      if (manual) {
        showToast('IP Address updated successfully');
      }
    } else {
      currentIPElement.textContent = 'Error fetching IP';
      if (manual) {
        showToast('Failed to update IP address', 'error');
      }
    }
    removeSpinner(refreshIPButton, originalContent);
  }

  // Add IP change to history with type
  function addToHistory(ip, timestamp, type) {
    chrome.storage.local.get({ ipHistory: [] }, (result) => {
      const history = result.ipHistory;
      history.unshift({ ip, timestamp, type });
      
      // Keep only last 10 entries
      if (history.length > 10) {
        history.pop();
      }
      
      chrome.storage.local.set({ ipHistory: history });
      updateHistoryDisplay(history);
    });
  }

  // Update history display
  function updateHistoryDisplay(history) {
    if (history.length === 0) {
      ipHistory.innerHTML = '<div class="text-gray-500 text-center py-4">No changes recorded yet</div>';
      return;
    }

    ipHistory.innerHTML = history
      .map(entry => `
        <div class="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
          <div class="flex flex-col">
            <span class="font-mono">${entry.ip}</span>
            <span class="text-xs text-gray-500">${entry.type || 'Unknown'}</span>
          </div>
          <span class="text-sm text-gray-500">${entry.timestamp}</span>
        </div>
      `)
      .join('');
  }

  // Check if port is open
  async function checkPort(port) {
    try {
      // First try localhost
      const localhostUrls = [
        `http://localhost:${port}`,
        `http://127.0.0.1:${port}`
      ];

      // Try localhost first
      for (const url of localhostUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const response = await fetch(url, {
            mode: 'no-cors',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          return {
            isOpen: true,
            type: 'localhost',
            url: url
          };
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.log(`Port ${port} might be open on ${url} (error: ${error.name})`);
          }
        }
      }

      // Then try public IP
      const publicIPResponse = await fetch('https://api.ipify.org?format=json');
      const publicIPData = await publicIPResponse.json();
      const publicIP = publicIPData.ip;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`http://${publicIP}:${port}`, {
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return {
          isOpen: true,
          type: 'public',
          url: `http://${publicIP}:${port}`
        };
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log(`Port ${port} might be open on public IP (error: ${error.name})`);
        }
      }

      return {
        isOpen: false,
        type: 'none',
        url: null
      };
    } catch (error) {
      console.error('Error checking port:', error);
      return null;
    }
  }

  // Event Listeners
  copyIPButton.addEventListener('click', () => {
    const ip = currentIPElement.textContent.split(' ')[0];
    navigator.clipboard.writeText(ip).then(() => {
      showToast('IP copied to clipboard');
    });
  });

  refreshIPButton.addEventListener('click', async () => {
    await updateIP(true);
  });

  checkPortButton.addEventListener('click', async () => {
    const port = parseInt(portInput.value);
    if (!port || port < 1 || port > 65535) {
      portResult.innerHTML = `
        <div class="bg-red-50 text-red-600 p-3 rounded-lg">
          Please enter a valid port number (1-65535)
        </div>`;
      return;
    }

    const originalContent = checkPortButton.innerHTML;
    addSpinner(checkPortButton);
    
    portResult.innerHTML = `
      <div class="bg-blue-50 text-blue-600 p-3 rounded-lg">
        Checking port ${port}...
      </div>`;

    try {
      const result = await checkPort(port);
      
      if (result === null) {
        portResult.innerHTML = `
          <div class="bg-red-50 text-red-600 p-3 rounded-lg">
            Error checking port
          </div>`;
      } else if (result.isOpen) {
        portResult.innerHTML = `
          <div class="bg-green-50 text-green-600 p-3 rounded-lg">
            Port ${port} is open on ${result.type}<br>
            <span class="text-sm opacity-75">${result.url}</span>
          </div>`;
      } else {
        portResult.innerHTML = `
          <div class="bg-red-50 text-red-600 p-3 rounded-lg">
            Port ${port} is closed
          </div>`;
      }
    } catch (error) {
      portResult.innerHTML = `
        <div class="bg-red-50 text-red-600 p-3 rounded-lg">
          Error checking port
        </div>`;
      console.error('Port check error:', error);
    } finally {
      removeSpinner(checkPortButton, originalContent);
    }
  });

  testNetworkButton.addEventListener('click', async () => {
    networkStatus.classList.remove('hidden');
    const originalContent = testNetworkButton.innerHTML;
    addSpinner(testNetworkButton);
    
    try {
      const timeout = 5000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const testUrls = [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/cdn-cgi/trace',
        'https://api.ipify.org?format=json'
      ];

      let isConnected = false;
      for (const url of testUrls) {
        try {
          const response = await fetch(url, {
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
          });
          
          if (response.status === 0 || response.status === 200) {
            isConnected = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      clearTimeout(timeoutId);

      if (isConnected) {
        networkStatus.innerHTML = `
          <div class="bg-green-50 text-green-600 p-3 rounded-lg flex items-center gap-2">
            <i class="fas fa-check-circle"></i>
            Connected to the internet
          </div>`;
      } else {
        throw new Error('No connection');
      }
    } catch (error) {
      networkStatus.innerHTML = `
        <div class="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <i class="fas fa-times-circle"></i>
          No internet connection
        </div>`;
    } finally {
      removeSpinner(testNetworkButton, originalContent);
      setTimeout(() => {
        networkStatus.classList.add('hidden');
      }, 5000);
    }
  });

  // Load initial data
  updateIP();
  chrome.storage.local.get('ipHistory', (result) => {
    if (result.ipHistory) {
      updateHistoryDisplay(result.ipHistory);
    }
  });
});
