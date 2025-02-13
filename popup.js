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
  const customHost = document.getElementById('customHost');
  const localResults = document.getElementById('localResults');
  const publicResults = document.getElementById('publicResults');
  const customResults = document.getElementById('customResults');
  const localhostResult = document.getElementById('localhostResult');
  const localhost127Result = document.getElementById('localhost127Result');
  const publicIPResult = document.getElementById('publicIPResult');
  const customHostResult = document.getElementById('customHostResult');

  // IP History state
  let ipHistoryData = [];
  let sortAscending = false;
  let filterText = '';

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

  // Copy IP to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('IP copied to clipboard');
    } catch (err) {
      showToast('Failed to copy IP', 'error');
    }
  }

  // Export history to file
  function exportHistory() {
    const content = ipHistoryData.map(entry => 
      `[${entry.timestamp}] IP: ${entry.ip} (${entry.type})`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-history-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Filter and sort history
  function filterAndSortHistory() {
    let filtered = ipHistoryData;
    
    // Apply filter
    if (filterText) {
      filtered = filtered.filter(entry => 
        entry.ip.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortAscending ? timeA - timeB : timeB - timeA;
    });

    return filtered;
  }

  // Update history display with alternating rows
  function updateHistoryDisplay(history = null) {
    const filteredHistory = history || filterAndSortHistory();
    const ipHistory = document.getElementById('ipHistory');

    if (filteredHistory.length === 0) {
      ipHistory.innerHTML = '<div class="text-gray-500 text-center py-4">No changes recorded yet</div>';
      return;
    }

    ipHistory.innerHTML = filteredHistory
      .map((entry, index) => `
        <div class="flex justify-between items-center p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 last:border-0">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="font-mono">${entry.ip}</span>
              <button class="copy-ip text-gray-400 hover:text-blue-600 transition-colors" 
                      data-ip="${entry.ip}" 
                      title="Copy IP">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <span class="text-xs text-gray-500">${entry.type || 'Unknown'}</span>
          </div>
          <span class="text-sm text-gray-500">${entry.timestamp}</span>
        </div>
      `)
      .join('');

    // Add event listeners for copy buttons
    ipHistory.querySelectorAll('.copy-ip').forEach(button => {
      button.addEventListener('click', async () => {
        const ip = button.getAttribute('data-ip');
        try {
          await navigator.clipboard.writeText(ip);
          showToast('IP copied to clipboard');
          
          // Visual feedback animation
          button.classList.remove('text-gray-400');
          button.classList.add('text-green-500');
          setTimeout(() => {
            button.classList.remove('text-green-500');
            button.classList.add('text-gray-400');
          }, 1000);
        } catch (err) {
          showToast('Failed to copy IP', 'error');
        }
      });
    });
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

  // Add IP change to history
  function addToHistory(ip, timestamp, type) {
    chrome.storage.local.get({ ipHistory: [] }, (result) => {
      ipHistoryData = result.ipHistory;
      ipHistoryData.unshift({ ip, timestamp, type });
      
      // Keep only last 100 entries
      if (ipHistoryData.length > 100) {
        ipHistoryData.pop();
      }
      
      chrome.storage.local.set({ ipHistory: ipHistoryData });
      updateHistoryDisplay();
    });
  }

  // Check if port is open
  async function checkPort(port, customHost = '') {
    const results = {
      localhost: { isOpen: false, error: null },
      localhost127: { isOpen: false, error: null },
      public: { isOpen: false, error: null },
      custom: { isOpen: false, error: null }
    };

    // Helper function to check a specific URL
    async function checkUrl(url) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        await fetch(url, {
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return { isOpen: true, error: null };
      } catch (error) {
        return { 
          isOpen: false, 
          error: error.name === 'AbortError' ? 'Timeout' : error.message 
        };
      }
    }

    // Check localhost
    results.localhost = await checkUrl(`http://localhost:${port}`);
    results.localhost127 = await checkUrl(`http://127.0.0.1:${port}`);

    // Check public IP
    try {
      const publicIPResponse = await fetch('https://api.ipify.org?format=json');
      const publicIPData = await publicIPResponse.json();
      const publicIP = publicIPData.ip;
      results.public = await checkUrl(`http://${publicIP}:${port}`);
      results.publicIP = publicIP;
    } catch (error) {
      results.public = { isOpen: false, error: 'Failed to get public IP' };
    }

    // Check custom host if provided
    if (customHost) {
      results.custom = await checkUrl(`http://${customHost}:${port}`);
      results.customHost = customHost;
    }

    return results;
  }

  // Helper function to create status text with icon
  function getStatusText(result) {
    if (result.isOpen) {
      return `
        <div class="flex items-center gap-2 text-green-600">
          <i class="fas fa-check-circle"></i>
          <span>Open</span>
        </div>`;
    } else {
      const errorText = result.error ? `
        <div class="text-gray-500 text-xs mt-1">
          ${result.error}
        </div>` : '';
      
      return `
        <div class="flex flex-col items-end">
          <div class="flex items-center gap-2 text-red-600">
            <i class="fas fa-times-circle"></i>
            <span>Closed</span>
          </div>
          ${errorText}
        </div>`;
    }
  }

  // Helper function to create result row
  function createResultRow(host, result, port) {
    const fullUrl = `http://${host}:${port}`;
    
    // Function to truncate host if it's too long
    function truncateHost(host, maxLength = 25) {
      if (host.length <= maxLength) return host;
      const start = host.substring(0, maxLength - 10);
      const end = host.substring(host.length - 7);
      return `${start}...${end}`;
    }

    // Create display URL (truncated if needed)
    const displayHost = truncateHost(host);
    const displayUrl = `http://${displayHost}:${port}`;

    return `
      <div class="flex items-center justify-between w-full py-1.5 gap-3">
        <div class="text-gray-700 font-medium flex items-center gap-2 min-w-0">
          <div class="flex items-center gap-2 min-w-0 group">
            <span class="font-mono truncate" title="${fullUrl}">${displayUrl}</span>
            <button class="copy-url text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" 
                    data-url="${fullUrl}" 
                    title="Copy full URL">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
        <div class="flex-shrink-0">
          ${getStatusText(result)}
        </div>
      </div>`;
  }

  // Update port check UI
  function updatePortCheckUI(results) {
    const localResults = document.getElementById('localResults');
    const publicResults = document.getElementById('publicResults');
    const customResults = document.getElementById('customResults');
    const localhostResult = document.getElementById('localhostResult');
    const localhost127Result = document.getElementById('localhost127Result');
    const publicIPResult = document.getElementById('publicIPResult');
    const customHostResult = document.getElementById('customHostResult');
    const noResults = document.getElementById('noResults');
    const portCheckLoading = document.getElementById('portCheckLoading');
    const port = document.getElementById('portInput').value;

    // Hide loading state
    portCheckLoading.classList.add('hidden');
    noResults.classList.add('hidden');

    // Update local results
    localResults.classList.remove('hidden');
    localhostResult.innerHTML = createResultRow('localhost', results.localhost, port);
    localhost127Result.innerHTML = createResultRow('127.0.0.1', results.localhost127, port);

    // Update public results
    publicResults.classList.remove('hidden');
    publicIPResult.innerHTML = createResultRow(results.publicIP, results.public, port);

    // Update custom host results if applicable
    if (results.customHost) {
      customResults.classList.remove('hidden');
      customHostResult.innerHTML = createResultRow(results.customHost, results.custom, port);
    } else {
      customResults.classList.add('hidden');
    }

    // Add event listeners for copy buttons
    document.querySelectorAll('.copy-url').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const url = button.getAttribute('data-url');
        try {
          await navigator.clipboard.writeText(url);
          
          // Show success toast with the copied URL
          const shortUrl = url.length > 40 ? url.substring(0, 37) + '...' : url;
          showToast(`Copied: ${shortUrl}`);
          
          // Visual feedback animation
          button.classList.remove('text-gray-400', 'opacity-0');
          button.classList.add('text-green-500', 'opacity-100');
          setTimeout(() => {
            button.classList.remove('text-green-500');
            button.classList.add('text-gray-400');
            if (!button.matches(':hover')) {
              button.classList.add('opacity-0');
            }
          }, 1000);
        } catch (err) {
          showToast('Failed to copy URL', 'error');
        }
      });

      // Keep copy button visible while hovering
      button.addEventListener('mouseenter', () => {
        button.classList.remove('opacity-0');
        button.classList.add('opacity-100');
      });

      button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('text-green-500')) {
          button.classList.remove('opacity-100');
          button.classList.add('opacity-0');
        }
      });
    });
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

  portInput.addEventListener('input', () => {
    const value = parseInt(portInput.value);
    checkPortButton.disabled = !value || value < 1 || value > 65535;
    
    // Show validation feedback
    if (value) {
      if (value < 1 || value > 65535) {
        portInput.classList.add('border-red-500');
        portInput.classList.remove('border-gray-200', 'focus:border-blue-500');
      } else {
        portInput.classList.remove('border-red-500');
        portInput.classList.add('border-gray-200', 'focus:border-blue-500');
      }
    } else {
      portInput.classList.remove('border-red-500');
      portInput.classList.add('border-gray-200', 'focus:border-blue-500');
    }
  });

  checkPortButton.addEventListener('click', async () => {
    const port = parseInt(portInput.value);
    const customHost = document.getElementById('customHost').value.trim();
    
    if (!port || port < 1 || port > 65535) {
      showToast('Please enter a valid port number (1-65535)', 'error');
      return;
    }

    // Show loading state
    const portCheckLoading = document.getElementById('portCheckLoading');
    const noResults = document.getElementById('noResults');
    portCheckLoading.classList.remove('hidden');
    noResults.classList.add('hidden');

    // Hide previous results while loading
    document.getElementById('localResults').classList.add('hidden');
    document.getElementById('publicResults').classList.add('hidden');
    document.getElementById('customResults').classList.add('hidden');

    const originalContent = checkPortButton.innerHTML;
    addSpinner(checkPortButton);

    try {
      const results = await checkPort(port, customHost);
      updatePortCheckUI(results);
    } catch (error) {
      showToast('Error checking port status', 'error');
      portCheckLoading.classList.add('hidden');
      noResults.classList.remove('hidden');
      noResults.innerHTML = `
        <div class="flex items-center justify-center text-red-600 gap-2">
          <i class="fas fa-exclamation-circle"></i>
          <span>Error checking port status</span>
        </div>`;
    }

    removeSpinner(checkPortButton, originalContent);
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

  document.getElementById('ipFilter').addEventListener('input', (e) => {
    filterText = e.target.value;
    updateHistoryDisplay();
  });

  document.getElementById('sortTime').addEventListener('click', () => {
    sortAscending = !sortAscending;
    const sortIcon = document.getElementById('sortIcon');
    sortIcon.className = sortAscending ? 'fas fa-sort-up ml-1' : 'fas fa-sort-down ml-1';
    updateHistoryDisplay();
  });

  document.getElementById('exportHistory').addEventListener('click', exportHistory);

  // Load initial data
  updateIP();
  chrome.storage.local.get('ipHistory', (result) => {
    if (result.ipHistory) {
      ipHistoryData = result.ipHistory;
      updateHistoryDisplay();
    }
  });
});
