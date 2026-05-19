# QR Code Generator + Google Sheets Logger

A **Systems Integration** project that connects a browser-based QR code generator to Google Sheets via Google Apps Script. Every QR code generated is automatically logged as a new row in a live spreadsheet — demonstrating real-time data exchange between a web frontend and a cloud backend.

---

## 🗂️ Project Structure

```
qr-sheets-logger/
├── frontend/
│   └── index.html          ← QR generator web app (runs in browser, zero dependencies)
├── backend/
│   └── Code.gs             ← Google Apps Script (deployed as a Web App)
└── README.md               ← This file
```

---

## 🔗 System Architecture

```
[Browser: index.html]
        │
        │  User fills form → clicks Generate
        │
        ▼
[QRCode.js library (CDN)]
        │  Renders QR canvas in-page
        │
        ▼
[fetch() POST → Google Apps Script Web App URL]
        │  JSON payload: { timestamp, label, category, content, size, errorCorrection }
        │
        ▼
[Google Apps Script: Code.gs]
        │  doPost(e) handler parses JSON
        │  Calls SpreadsheetApp.getActiveSpreadsheet()
        │
        ▼
[Google Sheets: QR_Log tab]
        Appends a new row with all QR metadata
```

### Integration Points
| System A | Integration Method | System B |
|---|---|---|
| Frontend (HTML/JS) | HTTP POST (fetch, no-cors) | Google Apps Script Web App |
| Apps Script | SpreadsheetApp API | Google Sheets |

---

## ✅ Prerequisites

- A **Google account** (for Google Sheets + Apps Script)
- A modern web browser (Chrome, Firefox, Edge)
- No npm, no server, no build tools required

---

## 📋 Step-by-Step Setup

### PART 1 — Set Up Google Sheets + Apps Script Backend

#### Step 1: Create a new Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Rename it to something like `QR Logger` (click the title at the top)

#### Step 2: Open Apps Script

1. In your spreadsheet, click the menu: **Extensions → Apps Script**
2. A new tab opens with the Apps Script editor
3. Delete everything in the default `Code.gs` file

#### Step 3: Paste the backend code

1. Open the file `backend/Code.gs` from this project
2. Copy all its contents
3. Paste it into the Apps Script editor (replacing the blank file)
4. Click the 💾 **Save** icon (or press `Ctrl+S` / `Cmd+S`)
5. Name the project `QR Logger` when prompted

#### Step 4: Run createHeaders() to initialize the sheet

1. In the Apps Script editor, find the function dropdown at the top (it probably says `doPost`)
2. Click the dropdown and select **`createHeaders`**
3. Click the ▶ **Run** button
4. If prompted for permissions, click **Review permissions → Allow**
5. Go back to your Google Sheet — you should now see a styled header row in a new tab called `QR_Log`

#### Step 5: Deploy as a Web App

1. In Apps Script, click **Deploy → New Deployment**
2. Click the ⚙️ gear icon next to "Select type" and choose **Web app**
3. Fill in the settings:
   - **Description**: `QR Logger v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. If prompted for permissions again, click **Authorize access → Allow**
6. You will see a **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXX.../exec
   ```
7. **Copy this URL** — you will paste it into the frontend

> ⚠️ **Important**: Every time you edit `Code.gs`, you must create a **new deployment** (Deploy → Manage deployments → Edit → Version: New version) for changes to take effect. The URL stays the same.

---

### PART 2 — Run the Frontend

#### Step 6: Open index.html

1. Navigate to the `frontend/` folder
2. Open `index.html` directly in your browser (double-click it, or drag it into Chrome)
   - No server needed — it works as a local file
3. Alternatively, upload it to any static hosting (GitHub Pages, Netlify, etc.)

#### Step 7: Paste the Web App URL

1. In the app, find the field labeled **"Google Sheets Web App URL"**
2. Paste the URL you copied in Step 5
3. The URL is saved in the input for the session (you can also hardcode it in the HTML if you prefer)

#### Step 8: Generate your first QR code

1. Enter a URL or any text in the **Content / URL** field
2. Fill in an optional **Label** (e.g., `Product A`) and **Category**
3. Click **Generate + Log to Sheets**
4. The QR code appears on the right
5. The status log will show:
   ```
   ✓ QR code generated successfully.
   ✓ Data logged to Google Sheets.
   ```
6. Switch back to your Google Sheet — a new row has been added! 🎉

---

## 🧪 Testing the Integration

### Test the Apps Script endpoint directly

Open this URL in your browser (replace with your actual URL):
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
You should see:
```json
{ "status": "ok", "message": "QR Logger Web App is running.", "timestamp": "..." }
```

### Test a POST request (using curl)

```bash
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2025-01-01T00:00:00Z","label":"Test","category":"URL","content":"https://google.com","size":220,"errorCorrection":"M"}'
```

Expected response:
```json
{ "status": "success", "message": "Row logged.", "row": 2 }
```

---

## 📦 Data Logged to Google Sheets

Each QR generation appends one row with these columns:

| Column | Description | Example |
|---|---|---|
| Row # | Sequential row number | `1` |
| Timestamp (ISO) | UTC timestamp | `2025-05-21T10:30:00.000Z` |
| Local Date | YYYY-MM-DD | `2025-05-21` |
| Local Time | HH:MM:SS | `18:30:00` |
| Label | User-defined label | `Product A` |
| Category | Selected category | `URL` |
| Content | Full QR content | `https://example.com` |
| Content Length | Character count | `23` |
| QR Size (px) | Pixel dimensions | `220` |
| Error Correction | Level (L/M/Q/H) | `M` |
| IP / Origin | Request origin | `web` |
| Status | Log result | `SUCCESS` |

---

## ⚙️ Configuration Options

### Change the sheet tab name

In `Code.gs`, line 14:
```javascript
const SHEET_NAME = "QR_Log";   // ← change to whatever you want
```
Then redeploy.

### Change max content length stored

```javascript
const MAX_CONTENT_LENGTH = 500;  // ← increase or decrease
```

### Hardcode the Web App URL in the frontend

Open `index.html` and find:
```html
<input type="url" id="sheetsUrl" placeholder="..." />
```
Replace the placeholder with your URL, or pre-fill via JavaScript at the bottom of the file:
```javascript
document.getElementById('sheetsUrl').value = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

---

## 🔒 Security Notes

- The Apps Script runs **as you** (the deployer), so it inherits your Sheets permissions
- The frontend uses `mode: 'no-cors'` in `fetch()` — this is required for Apps Script; the response body is opaque but the POST is sent and received correctly
- The `sanitize()` function in `Code.gs` strips formula injection characters (e.g., `=`, `+`, `@`) to prevent CSV/Sheet injection attacks
- Do **not** share your Web App URL publicly if your sheet contains sensitive data — anyone with the URL can POST to it

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| "Data logged" but no row appears in sheet | You may have edited Code.gs but not redeployed. Create a new deployment version. |
| CORS error in browser console | This is normal with `no-cors` mode — the POST still goes through. Check the sheet. |
| `createHeaders()` asks for permissions | Click "Review permissions" → choose your account → "Advanced" → "Go to QR Logger (unsafe)" → Allow |
| Sheet tab not found | Run `createHeaders()` manually first, or check that `SHEET_NAME` matches your tab name |
| QR code doesn't render | Make sure the CDN script loaded. Try opening browser dev tools and checking for network errors. |

---

## 📐 Technologies Used

| Layer | Technology | Purpose |
|---|---|---|
| Frontend UI | HTML5, CSS3, Vanilla JS | QR form, output display, history table |
| QR Generation | [QRCode.js](https://github.com/davidshimjs/qrcodejs) (CDN) | Render QR canvas in-browser |
| HTTP Transport | `fetch()` API (POST, no-cors) | Send data to backend |
| Backend | Google Apps Script | Serverless function to receive POST |
| Database/Storage | Google Sheets (SpreadsheetApp) | Persistent log of all QR events |
| Local History | localStorage | Client-side session history |

---

## 🎓 Course Context

**Course**: System Integration and Architecture  
**Activity**: Performance Innovative Task (PIT) — Finals  
**Integration Type**: Web Application ↔ Cloud Service (Google Workspace)  
**Key Concepts Demonstrated**:
- REST-style API communication (HTTP POST)
- Middleware / serverless backend (Google Apps Script)
- Real-time data synchronization
- Cloud database write operations
- Security sanitization (formula injection prevention)
- Cross-origin request handling

---

## 📄 License

For academic/educational use. Third-party libraries used:
- **QRCode.js** — MIT License — [github.com/davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs)
- **Google Apps Script** — Google LLC — [developers.google.com/apps-script](https://developers.google.com/apps-script)
