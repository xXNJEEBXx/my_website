# CV AutoFill Extension — Documentation

> ⚠️ **For Agents:** Before modifying ANY extension file, read the file headers.
> Files marked with ⛔ require explicit user permission to edit.

## 📁 File Structure

```
cv-autofill-extension/
├── manifest.json         # Chrome extension config (load order, permissions)
├── data.js              ⛔ LOCKED — CV data + universal field patterns
├── site-rules.js        ✅ OPEN — Platform selectors + site-specific rules
├── engine.js            ⛔ LOCKED — Core execution engine + Oracle knowledge base
├── content.js           ✅ OPEN — Page scanner + action planner
├── ui.js                ✅ OPEN — Dashboard overlay UI
├── popup.html           ✅ OPEN — Extension popup
├── popup.js             ✅ OPEN — Popup script
├── logger.js            ✅ OPEN — Local debug server (Node.js)
└── debug_logs.txt           — Auto-generated log output
```

### File Roles

| File | Role | Who Can Edit |
|------|------|:---:|
| **data.js** | Personal CV data, universal field patterns, dropdown synonyms | ⛔ User only |
| **site-rules.js** | Platform CSS selectors, Oracle combobox mappings | ✅ Agents freely |
| **engine.js** | Execution functions (typing, clicking, Oracle dropdown handling) | ⛔ User only |
| **content.js** | Page scanning, action planning, smart scan, link filling | ✅ Agents freely |
| **ui.js** | Visual dashboard overlay | ✅ Agents freely |
| **logger.js** | Local server for debug log collection | ✅ Agents freely |

---

## 🚀 How to Use

### For Users (Manual)
1. Install the extension in Chrome (`chrome://extensions` → Developer Mode → Load Unpacked)
2. Navigate to any job application page
3. The extension auto-scans on page load
4. Click **▶ Play All** to fill all fields, or **⏭ Next** to fill one at a time
5. Click **🔄 Scan** to re-scan for new fields after form sections expand

### For Browser Agents (Programmatic)
```javascript
// Fill everything automatically
window.__CV_AGENT.fill();

// Or step-by-step
window.__CV_AGENT.plan(false);  // Generate action plan
// Then use the UI buttons or:
window.__CV_APP.Engine.play();  // Execute all actions
window.__CV_APP.Engine.next();  // Execute next action only
```

### Debug Logger (for troubleshooting Oracle dropdowns)
```bash
# Start the local logger server
node cv-autofill-extension/logger.js

# Logs are saved to:
# cv-autofill-extension/debug_logs.txt
```

---

## 🧠 How It Works

### Execution Pipeline
```
1. detectPlatform()     → Identify the job site (greenhouse, oracle_hcm, etc.)
2. planOracleSpecifics() → Handle Oracle-specific checkboxes, comboboxes
3. planTemplate()        → Apply known CSS selectors for the platform
4. planSmartScan()       → Scan ALL visible inputs and match by field hints
5. planLinks()           → Fill link fields and click "+ Add Another Link"
6. planExpansions()      → Click "Add Experience", "Add Education", etc.
7. Execute queue         → Run each action with appropriate delay
```

### Smart Scan Matching
For each visible `<input>` / `<textarea>`, the extension collects "hints":
- `el.name`, `el.id`, `el.placeholder`, `aria-label`, `data-automation-id`
- The text of the associated `<label>` element

These hints are matched against `FIELD_PATTERNS` in `data.js` using regex.

### Oracle HCM Dropdown Handling
See the **COMPLETE KNOWLEDGE BASE** in `engine.js` (lines 61–208) for the
full technical documentation of 7 failed attempts and the working solution.

**TL;DR:** Oracle uses `cx-select` custom elements. The extension:
1. Types the value to filter the dropdown
2. Searches for visible `<li>` items inside `.cx-select__options`
3. Dispatches `pointerdown → mousedown → pointerup → mouseup → click` with `composed: true`

---

## 📝 Adding a New Platform

### Step 1: Add detection in `content.js`
```javascript
// In detectPlatform():
if (/newsite\.com/.test(url)) return 'newsite';
```

### Step 2: Add selectors in `site-rules.js`
```javascript
newsite: {
    'input#firstName': CV.firstName,
    'input#lastName': CV.lastName,
    'input#email': CV.email,
    // ... discovered selectors
},
```

### Step 3: Test and verify
Navigate to the site, run `window.__CV_AGENT.fill()`, check the log panel.

---

## 📊 Unmapped Field Tracking

When the smart scan encounters a visible empty field that doesn't match any
pattern, it logs it to `window.__CV_APP.unmappedFields` and sends the list
to the local logger server.

**Example log output:**
```
=== UNMAPPED FIELDS ===
[INPUT] type=text id="customField1" name="referral" hints="referral How did you hear about us?"
[TEXTAREA] type= id="cover" name="" hints="cover_letter Write your cover letter"
```

Use this data to add new patterns to `data.js` (with user permission).

---

## ⚠️ Known Limitations

1. **File Uploads**: The extension cannot upload files (CV, Cover Letter) automatically.
   Browser security prevents JavaScript from accessing the local filesystem.
   Files must be uploaded manually or via browser agent's `set_input_files`.

2. **Checkboxes & Radio Buttons**: Only the "Current Job" checkbox on Oracle HCM is
   handled automatically. Other checkboxes/radios need manual clicking.

3. **CAPTCHA / OTP**: The extension cannot solve CAPTCHAs. Stop and notify the user.

4. **isTrusted Events**: Some frameworks reject synthetic events. The cx-select
   workaround uses `composed: true` events, but this may not work on all sites.
