window.__CV_APP = window.__CV_APP || {};

window.__CV_APP.UI = {
  init: function() {
    if (document.getElementById('cv-agent-dashboard')) return;
    
    const style = document.createElement('style');
    style.innerHTML = `
      #cv-agent-dashboard {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-family: 'Segoe UI', system-ui, sans-serif;
        z-index: 999999;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      .cv-header {
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 14px;
        cursor: move;
      }
      .cv-header-title { display: flex; align-items: center; gap: 8px; }
      .cv-pulse { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
      
      .cv-console {
        height: 150px;
        overflow-y: auto;
        padding: 12px;
        font-family: 'Consolas', monospace;
        font-size: 11px;
        color: #94a3b8;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cv-console-item { display: flex; gap: 6px; }
      .cv-console-item.success { color: #4ade80; }
      .cv-console-item.error { color: #f87171; }
      .cv-console-item.info { color: #60a5fa; }
      
      .cv-controls {
        padding: 12px;
        display: flex;
        gap: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      .cv-btn {
        flex: 1;
        padding: 8px 0;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: background 0.2s;
      }
      .cv-btn-play { background: #2563eb; color: white; }
      .cv-btn-play:hover { background: #1d4ed8; }
      .cv-btn-next { background: #475569; color: white; }
      .cv-btn-next:hover { background: #334155; }
      .cv-btn-cancel { background: transparent; color: #f87171; border: 1px solid #f87171; }
      .cv-btn-cancel:hover { background: rgba(248, 113, 113, 0.1); }
      
      .cv-progress-container { width: 100%; height: 4px; background: rgba(255,255,255,0.1); }
      .cv-progress-bar { height: 100%; background: #22c55e; width: 0%; transition: width 0.3s; }
      
      /* Webkit scrollbar for console */
      .cv-console::-webkit-scrollbar { width: 6px; }
      .cv-console::-webkit-scrollbar-track { background: transparent; }
      .cv-console::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'cv-agent-dashboard';
    overlay.innerHTML = `
      <div class="cv-header">
        <div class="cv-header-title">
          <div class="cv-pulse"></div>
          CV AutoFill Agent
        </div>
        <span id="cv-action-count">0/0</span>
      </div>
      <div class="cv-progress-container"><div id="cv-progress" class="cv-progress-bar"></div></div>
      <div id="cv-console" class="cv-console">
        <div class="cv-console-item info">▶ Agent initialized. Waiting to generate plan...</div>
      </div>
      <div class="cv-controls">
        <button id="cv-btn-play" class="cv-btn cv-btn-play">▶ Play All</button>
        <button id="cv-btn-next" class="cv-btn cv-btn-next">⏭ Next</button>
        <button id="cv-btn-rescan" class="cv-btn cv-btn-next" style="background: #eab308; color: #000;">🔄 Scan</button>
        <button id="cv-btn-cancel" class="cv-btn cv-btn-cancel">⏹</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('cv-btn-play').addEventListener('click', () => window.__CV_APP.Engine.play());
    document.getElementById('cv-btn-next').addEventListener('click', () => window.__CV_APP.Engine.next());
    document.getElementById('cv-btn-cancel').addEventListener('click', () => window.__CV_APP.Engine.cancel());
    document.getElementById('cv-btn-rescan').addEventListener('click', () => window.__CV_AGENT.plan(false));
  },

  log: function(message, type = 'info') {
    const consoleEl = document.getElementById('cv-console');
    if (!consoleEl) return;
    
    const item = document.createElement('div');
    item.className = `cv-console-item ${type}`;
    
    let icon = '•';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = '▶';
    
    item.innerText = `${icon} ${message}`;
    consoleEl.appendChild(item);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  },

  updateProgress: function(current, total) {
    document.getElementById('cv-action-count').innerText = `${current}/${total}`;
    const percent = total === 0 ? 0 : (current / total) * 100;
    document.getElementById('cv-progress').style.width = `${percent}%`;
  },
  
  highlight: function(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const orig = el.style.outline;
    el.style.outline = `3px solid #f59e0b`;
    el.style.outlineOffset = '2px';
    setTimeout(() => {
      el.style.outline = orig;
      el.style.outlineOffset = '';
    }, 1500);
  }
};
