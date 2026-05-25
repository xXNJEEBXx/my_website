chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'NATIVE_TYPE' && sender.tab) {
    const tabId = sender.tab.id;
    const targetValue = message.text;

    // We must attach the debugger to send raw native events
    chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        console.error("Debugger attach error:", chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      // Helper function to dispatch a key event
      const dispatchKey = (type, text, key, code, windowsVirtualKeyCode) => {
        return new Promise((resolve) => {
          chrome.debugger.sendCommand({ tabId: tabId }, "Input.dispatchKeyEvent", {
            type: type,
            text: text,
            unmodifiedText: text,
            key: key,
            code: code,
            windowsVirtualKeyCode: windowsVirtualKeyCode,
            nativeVirtualKeyCode: windowsVirtualKeyCode
          }, resolve);
        });
      };

      const executeSequence = async () => {
        try {
          // Use Input.insertText which natively handles all characters, numbers, and symbols perfectly
          await new Promise((resolve) => {
            chrome.debugger.sendCommand({ tabId: tabId }, "Input.insertText", { text: targetValue }, resolve);
          });

          // Wait for Knockout.js to filter the dropdown (2.5 seconds)
          await new Promise(r => setTimeout(r, 2500));

          // Press ArrowDown
          await dispatchKey("rawKeyDown", "", "ArrowDown", "ArrowDown", 40);
          await dispatchKey("keyUp", "", "ArrowDown", "ArrowDown", 40);

          // Press Enter
          await new Promise(r => setTimeout(r, 800));
          await dispatchKey("rawKeyDown", "\r", "Enter", "Enter", 13);
          await dispatchKey("keyUp", "", "Enter", "Enter", 13);
          
        } finally {
          // ALWAYS detach when done, even if an error occurs
          chrome.debugger.detach({ tabId: tabId });
          sendResponse({ success: true });
        }
      };

      executeSequence();
    });

    return true; // Keep message channel open for async response
  }
});
