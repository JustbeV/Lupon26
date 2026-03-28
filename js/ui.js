/**
 * js/ui.js
 * ──────────────────────────────────────────────────────
 * Shared UI utilities — used by all other modules.
 * Includes: toast, print area, modal, date/badge helpers.
 * ──────────────────────────────────────────────────────
 */


/* ════════════════════════════════════
   TOAST NOTIFICATION
════════════════════════════════════ */

/**
 * Show a brief notification at the bottom-right of the screen.
 * @param {string} msg  - Message text
 * @param {string} bg   - Background colour (default: green)
 */
function toast(msg, bg = '#1a5c38') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = bg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ════════════════════════════════════
   LOGO BASE64 PRE-LOADER
   Both logos are converted to base64 on page load
   so they embed correctly when exported to Word.
════════════════════════════════════ */

let logoBase64     = '';   // lupon-logo.png  (Lupon seal — right side)
let brgyLogoBase64 = '';   // logo.png        (Barangay seal — left side)
let gensanLogoBase64 = ''; 

// Use fetch + FileReader instead of canvas to avoid tainted-canvas
// errors when the system is opened from a local file (file:// protocol).
function _encodeImage(src, callback) {
  fetch(src)
    .then(r => r.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(blob);
    })
    .catch(() => {});   // silently skip if image is missing
}

_encodeImage('assets/lupon-logo.png', function(b64) { logoBase64     = b64; });
_encodeImage('assets/logo.png',       function(b64) { brgyLogoBase64 = b64; });
_encodeImage('assets/magandang-gensan-logo.png', function(b64) { gensanLogoBase64 = b64; });


/* ════════════════════════════════════
   PRINT AREA
════════════════════════════════════ */

/**
 * Display HTML in the full-screen print overlay.
 * @param {string} html - HTML content to render
 */
function showPrint(html) {
  document.getElementById('print-content').innerHTML = html;
  document.getElementById('print-area').classList.add('visible');
}

/** Hide the print overlay. */
function closePrint() {
  document.getElementById('print-area').classList.remove('visible');
}

/**
 * Returns the standard Print / Close button row (hidden on print).
 * @param {string} extra - Optional additional buttons (HTML string)
 */
function printBtns(extra = '') {
  return `
    <div class="p-noprint">
      ${extra}
      <button onclick="window.print()"
        style="background:#0d2137;color:#fff;border:none;padding:10px 24px;
               border-radius:6px;font-size:.94rem;cursor:pointer;font-weight:700;">
        🖨️ Print
      </button>
      <button onclick="closePrint()"
        style="background:#6b7280;color:#fff;border:none;padding:10px 18px;
               border-radius:6px;font-size:.94rem;cursor:pointer;font-weight:700;">
        ✕ Close
      </button>
    </div>`;
}

/**
 * Export the currently displayed print-area content as a Word .doc file.
 * Embeds both logos as base64 so they display correctly in Word offline.
 * @param {string} filename - Download filename (without extension)
 */
function exportDocWord(filename, pageSize) {
  // pageSize: 'letter' (default, 8.5"x11") or 'legal' (8.5"x14")
  const isLegal = pageSize === 'legal';

  // Legal:  w=12240 (8.5"), h=20160 (14")
  // Letter: w=12240 (8.5"), h=15840 (11")
  // Units: twips (1440 per inch)
  const pgW = 12240;
  const pgH = isLegal ? 20160 : 15840;

  // Clone print content and strip UI-only elements
  const clone = document.getElementById('print-content').cloneNode(true);
  clone.querySelectorAll('.p-noprint').forEach(el => el.remove());
  clone.querySelectorAll('div[style*="font-size:8pt"]').forEach(el => el.remove());
  clone.querySelectorAll('div[style*="font-size: 8pt"]').forEach(el => el.remove());

  let content = clone.innerHTML;

  // Embed logos as base64
  if (logoBase64) {
    content = content.replace(/src="assets\/lupon-logo\.png"/g, `src="${logoBase64}"`);
    content = content.replace(/src='assets\/lupon-logo\.png'/g, `src='${logoBase64}'`);
  }
  if (brgyLogoBase64) {
    content = content.replace(/src="assets\/logo\.png"/g, `src="${brgyLogoBase64}"`);
    content = content.replace(/src='assets\/logo\.png'/g, `src='${brgyLogoBase64}'`);
  }
  if (gensanLogoBase64) {
    content = content.replace(/src="assets\/magandang-gensan-logo\.png"/g, `src="${gensanLogoBase64}"`);
    content = content.replace(/src='assets\/magandang-gensan-logo\.png'/g, `src='${gensanLogoBase64}'`);
  }

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <!--[if gte mso 9]><xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        <w:Settings>
          <w:defaultTabStop w:val="720"/>
        </w:Settings>
      </xml><![endif]-->
      <style>
        /* Word reads @page for paper size when combined with mso- properties */
        @page {
          size: ${isLegal ? '8.5in 14in' : '8.5in 11in'};
          margin: 1in;
          mso-page-orientation: portrait;
          mso-paper-source: 0;
          mso-header-margin: .5in;
          mso-footer-margin: .5in;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          margin: 0;
        }
        table { border-collapse: collapse; }
      </style>
      <!--[if gte mso 9]><xml>
        <w:WordDocument>
          <w:pgSz w:w="${pgW}" w:h="${pgH}" w:orient="portrait"/>
        </w:WordDocument>
      </xml><![endif]-->
    </head>
    <body style="mso-paper-source:0;">${content}</body>
    </html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename + '.doc';
  a.click();
  URL.revokeObjectURL(url);
  toast('📄 Exported to Word!');
}


/* ════════════════════════════════════
   MODAL
════════════════════════════════════ */

/** Close a modal overlay by ID. */
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal when clicking the backdrop
document.getElementById('view-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal('view-modal');
});


/* ════════════════════════════════════
   DATE & FORMAT HELPERS
════════════════════════════════════ */

/**
 * Format a date string as a long Filipino/English date.
 * e.g. "March 18, 2026"
 */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/**
 * Format a date string as a short date.
 * e.g. "Mar 18, 2026"
 */
function shortDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

/**
 * Format a date string in UPPERCASE short form for printed documents.
 * e.g. "MAR 18, 2026"
 */
function fmtPrintDate(d) {
  if (!d) return '&nbsp;';
  return new Date(d + 'T00:00:00')
    .toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    .toUpperCase();
}

/**
 * Convert a 24h time string to 12h AM/PM format.
 * e.g. "14:30" → "2:30 PM"
 */
function fmtTime(t) {
  if (!t) return '&nbsp;';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

/**
 * Return a coloured status badge HTML element.
 * @param {string} s - Status string
 */
function badge(s) {
  const map = {
    Pending:   'bp',
    Active:    'ba',
    Mediation: 'bm',
    Settled:   'bs',
    Dismissed: 'bd',
    Escalated: 'be'
  };
  return `<span class="badge ${map[s] || 'bp'}">${s}</span>`;
}

/**
 * Generate the next sequential case number based on current count.
 * Format: LUP-YYYY-NNN
 */
function genCaseNo() {
  const y = new Date().getFullYear();
  return `${String(cases.length + 1).padStart(3, '0')}-${y}`;
}


/* ════════════════════════════════════
   PRINT DOCUMENT HELPERS
════════════════════════════════════ */

/**
 * Returns the standard printed document header block.
 * Two-logo layout: barangay seal left | text center | lupon seal right.
 * Used by printCase(), printHearings(), printMembers() in their respective modules.
 * @param {string} sub - Optional document sub-title (underlined)
 */
function brgyHeader(sub = '') {
  return `
    <table style="width:auto;margin:0 auto;border-collapse:collapse;margin-bottom:6px;">
      <tr>
        <td style="width:80px;vertical-align:middle;text-align:center;">
          <img src="assets/logo.png" width="100" height="100"
               style="border-radius:50%;display:block;margin:0 auto;"
               onerror="this.style.display='none'">
        </td>
        <td style="vertical-align:middle;text-align:center;padding:20px 8px 0 8px;">
          <div style="font-size:9pt;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px;">
            Republic of the Philippines &nbsp;|&nbsp; Province of ${cfg.prov}
          </div>
          <div style="font-size:11pt;font-weight:700;">Municipality of ${cfg.muni}</div>
          <div style="font-size:14pt;font-weight:900;text-transform:uppercase;letter-spacing:.04em;">
            ${cfg.brgy}
          </div>
          <div style="font-size:11pt;font-weight:700;">LUPONG TAGAPAMAYAPA</div>
          ${sub
            ? `<div style="font-size:12pt;font-weight:800;margin-top:5px;text-decoration:underline;">
                 ${sub}
               </div>`
            : ''
          }
        </td>
 <td style="width:110px;vertical-align:middle;text-align:center;">
  <img src="assets/magandang-gensan-logo.png" width="100" height="100"
       style="display:block;margin:0 auto;"
       onerror="this.style.display='none'">
</td>
      </tr>
    </table>
`;
}

/**
 * Returns a small printed footer with timestamp and system name.
 */
function printFooter() {
  return `
    <div style="margin-top:28px;font-size:8pt;color:#999;text-align:right;
                border-top:1px solid #eee;padding-top:5px;">
      Printed: ${new Date().toLocaleString('en-PH')}
      &nbsp;|&nbsp; ${cfg.brgy} Lupon ng Tagapamayapa Case Management System
    </div>`;
}

/**
 * Shorthand for getting the value of a form element by ID.
 * Used heavily in the Tracer module.
 */
function gv(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/**
 * Returns an "Export to Word" button HTML string for use inside printBtns(extra).
 * @param {string} filename - Download filename (without extension)
 */
function exportWordBtn(filename, pageSize) {
  const ps = pageSize ? `,'${pageSize}'` : '';
  return `<button onclick="exportDocWord('${filename}'${ps})"
    style="background:#c9a84c;color:#0d2137;border:none;padding:10px 22px;
           border-radius:6px;font-size:.94rem;cursor:pointer;font-weight:700;">
    📄 Export to Word
  </button>`;
}