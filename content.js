let definitionBox = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "getSelectedText") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    console.log("Selected text:", selectedText);
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      chrome.runtime.sendMessage({ 
        action: "speakDefinition", 
        word: selectedText,
        position: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY
        }
      });
    }
  } else if (request.action === "showDefinition") {
    showDefinitionBox(request.word, request.definition, request.position, request.ttsEnabled, request.darkMode, request.wordCount);
  } else if (request.action === "ttsEnded") {
    if (definitionBox) {
      document.body.removeChild(definitionBox);
      definitionBox = null;
    }
  } else if (request.action === "updateDarkMode") {
    if (definitionBox) {
      definitionBox.classList.toggle('dark-mode', request.darkMode);
    }
  }
});

function showDefinitionBox(word, definition, position, ttsEnabled, darkMode, wordCount) {
  if (definitionBox) {
    document.body.removeChild(definitionBox);
  }
  
  definitionBox = document.createElement('div');
  definitionBox.className = `definition-box ${darkMode ? 'dark-mode' : ''}`;
  definitionBox.style.left = `${position.x}px`;
  definitionBox.style.top = `${position.y - definitionBox.offsetHeight - 10}px`;
  
  definitionBox.innerHTML = `
    <div class="definition-header">
      <h3>${word}</h3>
      <button class="close-button">×</button>
    </div>
    <p class="definition-text">${definition}</p>
    <div class="definition-footer">
      <span class="word-count">Words defined: ${wordCount}</span>
    </div>
  `;

  const closeButton = definitionBox.querySelector('.close-button');
  closeButton.onclick = () => {
    document.body.removeChild(definitionBox);
    definitionBox = null;
    if (ttsEnabled) {
      chrome.runtime.sendMessage({ action: "stopTTS" });
    }
  };

  document.body.appendChild(definitionBox);

  if (!ttsEnabled) {
    setTimeout(() => {
      if (definitionBox) {
        document.body.removeChild(definitionBox);
        definitionBox = null;
      }
    }, 5000);
  }
}