══════════════════════════════════════════════════════
  LUPON NG TAGAPAMAYAPA
  Barangay Case Management System
  Brgy. Dadiangas West, General Santos City
══════════════════════════════════════════════════════

HOW TO USE
──────────────────────────────────────────────────────
1. Open "index.html" in any web browser (Chrome, Edge,
   or Firefox recommended).
2. Login with:   Username: admin   Password: lupon2026
3. First-time setup: click "Change Barangay Info / Password"
   on the login screen to set your barangay details.

SYSTEM REQUIREMENTS
──────────────────────────────────────────────────────
- A modern web browser (Chrome 90+, Edge 90+, Firefox 88+)
- No internet connection required — fully offline
- No installation needed

FOLDER STRUCTURE
──────────────────────────────────────────────────────
  index.html          ← Open this to launch the system
  css/
    style.css         ← All visual styles
  js/
    data.js           ← Data storage (localStorage)
    ui.js             ← Shared UI helpers
    app.js            ← Login, clock, navigation
    cases.js          ← Case filing & management
    hearings.js       ← Hearing scheduling
    settlement.js     ← Settlement recording
    members.js        ← Lupon member management
    documents.js      ← Document generators (Summons, CFA, etc.)
    tracer.js         ← Tracer form
    backup.js         ← Backup & restore
  assets/
    lupon-logo.png    ← Lupon seal (used in header & print)
    logo.png          ← Alternate logo
    lupon-seal.svg    ← SVG version of the seal
  backups/            ← Save your .json backup files here

BACKUP INSTRUCTIONS
──────────────────────────────────────────────────────
TO EXPORT:
  1. Login to the system
  2. Click "💾 Backup" in the navigation bar
  3. Click "Export All Data (.json)"
  4. Save the file in the backups/ folder

TO RESTORE:
  1. Login to the system
  2. Click "💾 Backup" in the navigation
  3. Click the restore zone and select your .json file
  4. Review the preview and click "Confirm & Restore"

Recommended: Backup every Friday.
Name files like: Lupon-Backup-2026-03-18.json

DEFAULT LOGIN
──────────────────────────────────────────────────────
  Username : admin
  Password : lupon2026

To change: click "⚙️ Change Barangay Info / Password"
on the login screen.

IMPORTANT NOTES
──────────────────────────────────────────────────────
- All data is stored in the browser's localStorage.
  Do NOT clear browser data without exporting a backup first.
- Keep the entire folder together — moving only index.html
  will break the system.
- For safety, copy this entire folder to a USB drive.
══════════════════════════════════════════════════════
