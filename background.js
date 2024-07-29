let ttsEnabled = true;
let darkMode = false;
let wordCount = 0;

chrome.storage.sync.get(['ttsEnabled', 'darkMode', 'wordCount'], (data) => {
  ttsEnabled = data.ttsEnabled !== undefined ? data.ttsEnabled : true;
  darkMode = data.darkMode !== undefined ? data.darkMode : false;
  wordCount = data.wordCount || 0;
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "speak-definition") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" });
    });
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in background:", request);
    if (request.action === "speakDefinition") {
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${request.word}`)
        .then(response => response.json())
        .then(data => {
          const definition = data[0].meanings[0].definitions[0].definition;
          console.log("Definition found:", definition);
          
          chrome.storage.sync.get(['wordCount'], (data) => {
            let wordCount = (data.wordCount || 0) + 1;
            chrome.storage.sync.set({ wordCount: wordCount });
            
            chrome.storage.sync.get(['ttsEnabled', 'darkMode'], (settings) => {
              chrome.tabs.sendMessage(sender.tab.id, {
                action: "showDefinition",
                word: request.word,
                definition: definition,
                position: request.position,
                ttsEnabled: settings.ttsEnabled,
                darkMode: settings.darkMode,
                wordCount: wordCount
              });
  
              if (settings.ttsEnabled) {
                chrome.tts.speak(`${request.word}. ${definition}`, {
                  onEvent: function(event) {
                    if (event.type === 'end') {
                      chrome.tabs.sendMessage(sender.tab.id, { action: "ttsEnded" });
                    }
                  }
                });
              }
            });
          });
        })
        .catch(error => {
          console.error("Error fetching definition:", error);
          chrome.storage.sync.get(['ttsEnabled', 'darkMode', 'wordCount'], (settings) => {
            chrome.tabs.sendMessage(sender.tab.id, {
              action: "showDefinition",
              word: request.word,
              definition: "Definition not found",
              position: request.position,
              ttsEnabled: settings.ttsEnabled,
              darkMode: settings.darkMode,
              wordCount: settings.wordCount || 0
            });
            if (settings.ttsEnabled) {
              chrome.tts.speak("Definition not found");
            }
          });
        });
    } else if (request.action === "toggleTTS") {
      chrome.storage.sync.set({ ttsEnabled: request.enabled });
    } else if (request.action === "toggleDarkMode") {
      chrome.storage.sync.set({ darkMode: request.enabled });
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: "updateDarkMode", darkMode: request.enabled });
        });
      });
    } else if (request.action === "stopTTS") {
      chrome.tts.stop();
    }
  });