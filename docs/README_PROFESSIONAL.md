# Lupon26

Lupon26 is an offline-first Barangay Case Management System for the Lupong Tagapamayapa workflow. It helps barangay staff record cases, manage hearings and settlements, maintain Lupon member records, and generate Katarungang Pambarangay documents from a single browser-based application.

## Highlights

- Offline browser-based operation
- Case filing and tracking
- Hearing and settlement management
- Lupon member administration
- KP form printing and Word export
- JSON backup and restore
- SHA-256 password verification

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser `localStorage`
- Web Crypto API
- `docx`

## Run The App

1. Open [`index.html`](/d:/Lupon26/index.html) in a modern browser.
2. Sign in with:

```text
Username: admin
Password: lupon2026
```

3. Update the barangay details and password before deployment.

## Key Files

- [`index.html`](/d:/Lupon26/index.html): UI shell and script loading
- [`js/data.js`](/d:/Lupon26/js/data.js): persistence and configuration
- [`js/app.js`](/d:/Lupon26/js/app.js): bootstrap, login, navigation, dashboard
- [`js/documents.js`](/d:/Lupon26/js/documents.js): printable forms and export logic
- [`js/backup.js`](/d:/Lupon26/js/backup.js): backup, restore, and data reset

## Storage

The app stores its working data in browser `localStorage`, so regular backup export is required to avoid data loss.

## Additional Documentation

- [`docs/PROJECT_DOCUMENTATION.md`](/d:/Lupon26/docs/PROJECT_DOCUMENTATION.md)
