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
        // Type the target text character by character
        for (let i = 0; i < targetValue.length; i++) {
          const char = targetValue[i];
          // Simple ASCII keycode approximation for alphanumeric
          const keyCode = char.toUpperCase().charCodeAt(0);
          await dispatchKey("keyDown", char, char, `Key${char.toUpperCase()}`, keyCode);
          await dispatchKey("keyUp", "", char, `Key${char.toUpperCase()}`, keyCode);
        }

        // Wait for Knockout.js to filter the dropdown (2.5 seconds)
        await new Promise(r => setTimeout(r, 2500));

        // Press ArrowDown
        await dispatchKey("rawKeyDown", "", "ArrowDown", "ArrowDown", 40);
        await dispatchKey("keyUp", "", "ArrowDown", "ArrowDown", 40);

        // Press Enter
        await new Promise(r => setTimeout(r, 800));
        await dispatchKey("rawKeyDown", "\r", "Enter", "Enter", 13);
        await dispatchKey("keyUp", "", "Enter", "Enter", 13);

        // Detach when done
        chrome.debugger.detach({ tabId: tabId });
        sendResponse({ success: true });
      };

      executeSequence();
    });

    return true; // Keep message channel open for async response
  }
});
