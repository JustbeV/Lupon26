# Project Documentation

## 1. Purpose

Lupon26 is a browser-based case management system intended for Katarungang Pambarangay operations. Its goal is to give barangay personnel a practical, offline-capable tool for handling the day-to-day administrative workflow of Lupon proceedings without relying on a hosted backend or internet connectivity.

The application centers on five operational areas:

- case intake
- hearing management
- settlement tracking
- Lupon member administration
- official document generation

## 2. System Design

The project uses a simple client-side architecture:

1. `index.html` defines the full UI shell and all page sections.
2. JavaScript files are loaded in a specific order.
3. Shared global arrays and configuration objects are created in `js/data.js`.
4. Feature modules read and mutate those globals directly.
5. Changes are persisted back into browser `localStorage`.

This architecture keeps deployment simple, but it also means:

- there is tight coupling between modules
- script order matters
- data contracts are implicit rather than enforced through typed interfaces

## 3. Runtime Flow

### Application startup

- The browser loads [`index.html`](/d:/Lupon26/index.html).
- Script files are loaded in sequence, with [`js/data.js`](/d:/Lupon26/js/data.js) establishing initial state.
- The login screen is shown first.
- After successful login, the main app shell becomes visible and the dashboard is rendered.

### Login flow

- Username and password are read from the login form.
- The password is hashed with SHA-256 in [`js/app.js`](/d:/Lupon26/js/app.js).
- The result is compared against the stored config hash in [`js/data.js`](/d:/Lupon26/js/data.js).
- Successful login unlocks navigation and the main modules.

### Navigation flow

- The app uses a page-switching pattern rather than separate routes.
- `showPage()` in [`js/app.js`](/d:/Lupon26/js/app.js) toggles visible sections.
- Each page can trigger page-specific render or setup behavior.

## 4. Data Model

The system stores its data in browser `localStorage` under the following keys:

| Key | Purpose |
|---|---|
| `lp-cases` | Filed case records |
| `lp-hear` | Hearing records |
| `lp-settle` | Settlement records |
| `lp-members` | Lupon member records |
| `lp-cfg` | Barangay details, username, and hashed password |

### Configuration object

The config object stores:

- barangay name
- municipality or city
- province
- username
- password hash

### Persistence strategy

All modules rely on shared in-memory arrays. After a create, update, or delete action, `persist()` in [`js/data.js`](/d:/Lupon26/js/data.js) serializes the active arrays back into `localStorage`.

This is intentionally lightweight, but there are tradeoffs:

- there is no transaction model
- there is no schema validation layer
- malformed imported records can affect downstream rendering

## 5. Functional Areas

### 5.1 Dashboard

Implemented primarily through [`js/app.js`](/d:/Lupon26/js/app.js), the dashboard shows:

- total case counts
- status-based case counts
- recent cases
- upcoming hearings

This page acts as the operational summary for staff.

### 5.2 Case Filing And Case List

Implemented through [`js/cases.js`](/d:/Lupon26/js/cases.js), this module handles:

- new complaint intake
- complainant and respondent details
- case numbering
- case search and filtering
- preview and print behavior

The filing page is the main intake point of the application.

### 5.3 Hearings

Implemented through [`js/hearings.js`](/d:/Lupon26/js/hearings.js), this module supports:

- scheduling hearings
- linking hearings to cases
- assigning hearing types
- storing venue, time, and notes

Dashboard summaries depend on this data to display upcoming events.

### 5.4 Settlements

Implemented through [`js/settlement.js`](/d:/Lupon26/js/settlement.js), this area records settlement outcomes and related case resolution details.

The documents and reporting flow also depend on these records.

### 5.5 Lupon Members

Implemented through [`js/members.js`](/d:/Lupon26/js/members.js), the member module supports:

- member creation
- inline editing
- deletion
- status management
- printable member list output

It also populates document form fields automatically, such as Punong Barangay and secretary references.

### 5.6 Documents

Implemented through [`js/documents.js`](/d:/Lupon26/js/documents.js), this is one of the largest modules in the project.

It provides:

- printable KP forms
- document preparation helpers
- member and case dropdown population
- Word export actions

The module appears to support a broad set of DILG-aligned Katarungang Pambarangay forms, including summons, complaint forms, appointment notices, Lupon notices, and monthly transmittals.

### 5.7 Backup And Restore

Implemented through [`js/backup.js`](/d:/Lupon26/js/backup.js), this area supports:

- backup export to JSON
- restore preview
- record merge restore
- complete data clearing

Restore currently merges incoming records by comparing `id` values instead of replacing the full dataset.

## 6. Script Loading Order

The application depends on global symbols, so the order at the bottom of [`index.html`](/d:/Lupon26/index.html) is important.

Current order:

1. `js/data.js`
2. `js/ui.js`
3. `js/documents.js`
4. `js/cases.js`
5. `js/hearings.js`
6. `js/settlement.js`
7. `js/members.js`
8. `js/tracer.js`
9. `js/backup.js`
10. `js/app.js`
11. `js/docx.bundle.js`
12. `js/wordexport.js`

If these are reordered carelessly, parts of the app may fail because helper functions and shared state are referenced globally.

## 7. Security And Privacy

### Current protections

- password hashing through the browser Web Crypto API
- offline-first runtime
- no network dependency for daily use

### Important caveats

- the app is not a multi-user authenticated platform
- all data is local to the browser profile
- anyone with access to the machine and browser profile may access stored data
- browser storage loss means application data loss unless backups exist

For sensitive deployments, regular backups and workstation access control are still required.

## 8. Maintenance Notes

### Strengths of the current implementation

- easy to deploy
- simple to understand
- no backend hosting cost
- practical for small-office offline use

### Risks in the current implementation

- large monolithic modules, especially the document generator
- heavy reliance on globals
- no formal validation layer
- no automated regression testing pipeline
- restore flow and UI copy are not fully aligned in some areas

## 9. Testing Status

The repository contains [`documents-test.js`](/d:/Lupon26/documents-test.js) and [`members-test.js`](/d:/Lupon26/members-test.js), but `package.json` does not currently expose a real automated test command. The existing `"test"` script is still the default placeholder.

As of this documentation pass, the project should be treated as manually verified unless a proper test runner is added.

## 10. Suggested Roadmap

### Short term

- clean up README and onboarding docs
- align backup UI text with actual merge behavior
- document data shapes for cases, hearings, settlements, and members
- remove or formalize unused test artifacts

### Medium term

- split `js/documents.js` into smaller domain files
- add import validation and backup schema version handling
- add a local development server and build scripts
- introduce a lightweight automated test setup

### Long term

- migrate from implicit globals to modules
- add a structured storage or sync layer
- support user roles and audit trails
- add printable and digital reporting improvements

## 11. Operational Guidance

For actual office use:

- open the app from [`index.html`](/d:/Lupon26/index.html)
- change the default password before deployment
- export backups on a fixed schedule
- keep the whole project folder together
- avoid clearing browser data
- test document output after changing browser or machine

## 12. Summary

Lupon26 is a functional offline administrative application with a practical focus and a low deployment barrier. Its current design is best suited for small-scale, controlled environments where simplicity matters more than centralized infrastructure.
