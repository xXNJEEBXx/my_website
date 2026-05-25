document.getElementById('fillBtn').addEventListener('click', async () => {
  const btn = document.getElementById('fillBtn');
  const status = document.getElementById('status');
  
  btn.innerText = "⏳ Expanding...";
  btn.style.opacity = '0.7';
  btn.disabled = true;

  // Get current active tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    // Execute the expandAndFill function in the MAIN world context
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: () => {
        if (window.__CV_AGENT && window.__CV_AGENT.expandAndFill) {
          window.__CV_AGENT.expandAndFill();
        } else {
          alert("CV AutoFill content script not fully loaded yet. Please refresh the page.");
        }
      }
    });

    btn.innerText = "🚀 Auto Expand & Fill";
    btn.style.opacity = '1';
    btn.disabled = false;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
      window.close();
    }, 2000);
  }
});
