document.addEventListener('DOMContentLoaded', function() {
    const ttsToggle = document.getElementById('tts-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const wordCountSpan = document.getElementById('word-count');
  
    chrome.storage.sync.get(['ttsEnabled', 'darkMode', 'wordCount'], (data) => {
      updateToggleButton(ttsToggle, data.ttsEnabled !== undefined ? data.ttsEnabled : true);
      updateToggleButton(darkModeToggle, data.darkMode !== undefined ? data.darkMode : false);
      wordCountSpan.textContent = data.wordCount || 0;
      updateDarkMode(data.darkMode);
    });
  
    ttsToggle.addEventListener('click', function() {
      const newState = !this.classList.contains('on');
      updateToggleButton(this, newState);
      chrome.storage.sync.set({ ttsEnabled: newState });
      chrome.runtime.sendMessage({ action: "toggleTTS", enabled: newState });
    });
  
    darkModeToggle.addEventListener('click', function() {
      const newState = !this.classList.contains('on');
      updateToggleButton(this, newState);
      chrome.storage.sync.set({ darkMode: newState });
      chrome.runtime.sendMessage({ action: "toggleDarkMode", enabled: newState });
      updateDarkMode(newState);
    });
  
    function updateToggleButton(button, state) {
      button.textContent = state ? 'ON' : 'OFF';
      button.classList.toggle('on', state);
      button.classList.toggle('off', !state);
    }
  
    function updateDarkMode(enabled) {
      document.body.classList.toggle('dark-mode', enabled);
    }
  });