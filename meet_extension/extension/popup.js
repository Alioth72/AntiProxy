// Load saved settings
chrome.storage.local.get(['lastLog', 'afkEnabled'], (result) => {
  if (result.lastLog) document.getElementById('log').innerText = result.lastLog;
  if (result.afkEnabled) document.getElementById('afkToggle').checked = true;
});

// Listen for toggle changes
document.getElementById('afkToggle').addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  chrome.storage.local.set({ afkEnabled: isEnabled });
  
  // Tell content script immediately
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "TOGGLE_AFK", enabled: isEnabled });
  });
});

// Update log live
chrome.storage.onChanged.addListener((changes) => {
  if (changes.lastLog) document.getElementById('log').innerText = changes.lastLog.newValue;
});