/**
 * js/data.js
 * ──────────────────────────────────────────────────────
 * Data layer — localStorage persistence for all records.
 * All other modules read/write these global arrays.
 * ──────────────────────────────────────────────────────
 */

/* ── Application Data ── */
let cases       = JSON.parse(localStorage.getItem('lp-cases')   || '[]');
let hearings    = JSON.parse(localStorage.getItem('lp-hear')    || '[]');
let settlements = JSON.parse(localStorage.getItem('lp-settle')  || '[]');
let members     = JSON.parse(localStorage.getItem('lp-members') || '[]');

/* ── System Configuration ── */
let cfg = JSON.parse(
  localStorage.getItem('lp-cfg') ||
  JSON.stringify({
    brgy: 'Barangay Dadiangas West',
    muni: 'General Santos City',
    prov: 'South Cotabato',
    pass: 'c66432d603cbe1b37b0959440bad7cde824bffa1cc30d72e1a50fdfdf00cde4a', 
    user: 'admin'
  })
);

/**
 * Persist all data arrays to localStorage.
 * Call this after any create / update / delete operation.
 */
function persist() {
  localStorage.setItem('lp-cases',   JSON.stringify(cases));
  localStorage.setItem('lp-hear',    JSON.stringify(hearings));
  localStorage.setItem('lp-settle',  JSON.stringify(settlements));
  localStorage.setItem('lp-members', JSON.stringify(members));
}

/**
 * Persist the system configuration (barangay info, password).
 */
function saveCfg() {
  localStorage.setItem('lp-cfg', JSON.stringify(cfg));
}

/* ── Password Migration ──────────────────────────────────
   If an existing install still has the old btoa password,
   migrate it to SHA-256 automatically on first load.
   btoa('lupon2026') === 'bHVwb24yMDI2'
──────────────────────────────────────────────────────── */
if (cfg.pass === 'bHVwb24yMDI2') {
  cfg.pass = 'c66432d603cbe1b37b0959440bad7cde824bffa1cc30d72e1a50fdfdf00cde4a';
  saveCfg();
}