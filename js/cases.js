/**
 * js/cases.js
 * ──────────────────────────────────────────────────────
 * Case management — file, view, search, delete, print,
 * and export the case registry to Word.
 * ──────────────────────────────────────────────────────
 */


/* ════════════════════════════════════
   CASE FORM
════════════════════════════════════ */

/** Pre-fill the auto-generated case number and today's date. */
function initCaseForm() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-no').value    = genCaseNo();
  document.getElementById('f-date').value  = today;
  document.getElementById('f-date').max    = today;  // prevent future dates

  // Populate pangkat multi-select from active Lupon members
  const sel = document.getElementById('f-pangkat');
  const cur = [...sel.selectedOptions].map(o => o.value);
  sel.innerHTML = members
    .filter(m => m.status === 'Active')
    .map(m => `<option value="${m.name}" ${cur.includes(m.name) ? 'selected' : ''}>${m.name} — ${m.role}</option>`)
    .join('');
}

/** Reset all fields on the File a Case form. */
function clearCaseForm() {
  // f-status is hidden (always Pending), f-pangkat is multi-select (handled separately)
  const fields = [
    'f-nature', 'f-docket', 'f-desc', 'f-relief',
    'fc-last', 'fc-first', 'fc-mid', 'fc-age', 'fc-addr', 'fc-tel', 'fc-civil',
    'fr-last', 'fr-first', 'fr-mid', 'fr-age', 'fr-addr', 'fr-tel', 'fr-civil',
    'f-hdate', 'f-htime', 'f-hvenue'
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });

  // Deselect all pangkat members (multi-select)
  [...document.getElementById('f-pangkat').options].forEach(o => o.selected = false);

  initCaseForm();
}

/** Validate and save a new case record. */
function saveCase() {
  const nature = document.getElementById('f-nature').value;
  const fcl    = document.getElementById('fc-last').value.trim();
  const fcf    = document.getElementById('fc-first').value.trim();
  const frl    = document.getElementById('fr-last').value.trim();
  const frf    = document.getElementById('fr-first').value.trim();

  if (!nature || !fcl || !fcf || !frl || !frf) {
    toast('Fill in all required fields.', '#b22222');
    return;
  }

  // Validate PH mobile numbers if provided (11 digits, starts with 09)
  const cTel = document.getElementById('fc-tel').value.replace(/[^0-9]/g, '');
  const rTel = document.getElementById('fr-tel').value.replace(/[^0-9]/g, '');
  if (cTel && (cTel.length !== 11 || !cTel.startsWith('09'))) {
    toast('Complainant contact must be 11 digits starting with 09.', '#b22222');
    return;
  }
  if (rTel && (rTel.length !== 11 || !rTel.startsWith('09'))) {
    toast('Respondent contact must be 11 digits starting with 09.', '#b22222');
    return;
  }

  const c = {
    id:       Date.now(),
    caseNo:   document.getElementById('f-no').value,
    dateFiled: document.getElementById('f-date').value,
    nature,
    status:   document.getElementById('f-status').value,
    pangkat: [...document.getElementById('f-pangkat').selectedOptions]
           .map(o => o.value).join(', '),
    docket:   document.getElementById('f-docket').value,
    desc:     document.getElementById('f-desc').value,
    relief:   document.getElementById('f-relief').value,
    comp: {
      last:  fcl,
      first: fcf,
      mid:   document.getElementById('fc-mid').value,
      age:   document.getElementById('fc-age').value,
      addr:  document.getElementById('fc-addr').value,
      tel:   document.getElementById('fc-tel').value.replace(/[^0-9]/g, '').slice(0, 11),
      civil: document.getElementById('fc-civil').value
    },
    resp: {
      last:  frl,
      first: frf,
      mid:   document.getElementById('fr-mid').value,
      age:   document.getElementById('fr-age').value,
      addr:  document.getElementById('fr-addr').value,
      tel:   document.getElementById('fr-tel').value.replace(/[^0-9]/g, '').slice(0, 11),
      civil: document.getElementById('fr-civil').value
    },
    hdate:  document.getElementById('f-hdate').value,
    htime:  document.getElementById('f-htime').value,
    hvenue: document.getElementById('f-hvenue').value
  };

  cases.push(c);

  // Auto-create the first hearing record if a date was provided
  if (c.hdate) {
    hearings.push({
      id:       Date.now() + 1,
      caseId:   c.id,
      caseNo:   c.caseNo,
      date:     c.hdate,
      time:     c.htime,
      venue:    c.hvenue,
      type:     'First Hearing',
      mediator: c.pangkat,
      notes:    ''
    });
  }

  persist();
  toast('Case ' + c.caseNo + ' filed!');
  clearCaseForm();
}

/** Save the current form and immediately open the print preview. */
function previewCase() {
  // Run the same validation as saveCase without saving yet
  const nature = document.getElementById('f-nature').value;
  const fcl    = document.getElementById('fc-last').value.trim();
  const fcf    = document.getElementById('fc-first').value.trim();
  const frl    = document.getElementById('fr-last').value.trim();
  const frf    = document.getElementById('fr-first').value.trim();

  if (!nature || !fcl || !fcf || !frl || !frf) {
    toast('Fill in all required fields.', '#b22222');
    return;
  }

  const cTel = document.getElementById('fc-tel').value.replace(/[^0-9]/g, '');
  const rTel = document.getElementById('fr-tel').value.replace(/[^0-9]/g, '');
  if (cTel && (cTel.length !== 11 || !cTel.startsWith('09'))) {
    toast('Complainant contact must be 11 digits starting with 09.', '#b22222');
    return;
  }
  if (rTel && (rTel.length !== 11 || !rTel.startsWith('09'))) {
    toast('Respondent contact must be 11 digits starting with 09.', '#b22222');
    return;
  }

  // All valid — save, then print the saved case
  saveCase();
  printCase(cases[cases.length - 1].id);
}


/* ════════════════════════════════════
   CASES TABLE
════════════════════════════════════ */

/** Re-render the filtered cases table. */
function renderCases() {
  const q  = (document.getElementById('srch').value || '').toLowerCase();
  const fs = document.getElementById('flt-status').value;

  const filtered = cases.filter(c => {
    const txt = `${c.caseNo} ${c.comp.last} ${c.comp.first} ${c.resp.last} ${c.resp.first} ${c.nature}`.toLowerCase();
    return txt.includes(q) && (!fs || c.status === fs);
  });

  const tb = document.getElementById('cases-tbody');

  if (!filtered.length) {
    tb.innerHTML = `<tr>
      <td colspan="7" style="text-align:center;color:#999;padding:28px;">
        No cases found.
      </td>
    </tr>`;
    return;
  }

  tb.innerHTML = filtered.map(c => `
    <tr>
      <td><b style="color:#0d2137;">${c.caseNo}</b></td>
      <td style="white-space:nowrap;">${shortDate(c.dateFiled)}</td>
      <td style="max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
          title="${c.nature}">${c.nature}</td>
      <td style="white-space:nowrap;">${c.comp.last}, ${c.comp.first}</td>
      <td style="white-space:nowrap;">${c.resp.last}, ${c.resp.first}</td>
      <td>${badge(c.status)}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-sm btn-outline" title="View / Edit Status" onclick="viewCase(${c.id})">👁 View</button>
        <button class="btn btn-sm btn-gold"    title="Print"              onclick="printCase(${c.id})">🖨️</button>
        <button class="btn btn-sm btn-danger"  title="Delete"             onclick="delCase(${c.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

/** Delete a case and all its related hearings. */
function delCase(id) {
  if (!confirm('Delete this case and all related records?')) return;
  cases    = cases.filter(c => c.id !== id);
  hearings = hearings.filter(h => h.caseId !== id);
  persist();
  renderCases();
  toast('Deleted.', '#b22222');
}

/** Open the Case Details modal. */
function viewCase(id) {
  const c = cases.find(x => x.id === id);
  if (!c) return;

  document.getElementById('view-modal-body').innerHTML = `

    <!-- Case header strip -->
    <div style="background:#0d2137;color:#fff;border-radius:8px;padding:14px 18px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-size:1.15rem;font-weight:800;letter-spacing:.03em;">${c.caseNo}</div>
          <div style="font-size:.82rem;opacity:.75;margin-top:2px;">${c.nature} &nbsp;·&nbsp; Filed: ${shortDate(c.dateFiled)}</div>
        </div>
        ${badge(c.status)}
      </div>
    </div>

    <!-- Parties -->
    <div class="grid2" style="gap:12px;margin-bottom:14px;">
      <div style="background:#f9f6f0;border:1px solid #e8dfc8;border-radius:8px;padding:12px 14px;">
        <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
                    color:#c9a84c;margin-bottom:6px;">👤 Complainant</div>
        <div style="font-weight:700;font-size:.95rem;">${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' '+c.comp.mid : ''}</div>
        <div style="font-size:.82rem;color:#555;margin-top:3px;">Age ${c.comp.age||'—'} &nbsp;·&nbsp; ${c.comp.civil||'—'}</div>
        <div style="font-size:.82rem;color:#555;">📍 ${c.comp.addr||'—'}</div>
        <div style="font-size:.82rem;color:#555;">📞 ${c.comp.tel||'—'}</div>
      </div>
      <div style="background:#f9f6f0;border:1px solid #e8dfc8;border-radius:8px;padding:12px 14px;">
        <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
                    color:#c9a84c;margin-bottom:6px;">👤 Respondent</div>
        <div style="font-weight:700;font-size:.95rem;">${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' '+c.resp.mid : ''}</div>
        <div style="font-size:.82rem;color:#555;margin-top:3px;">Age ${c.resp.age||'—'} &nbsp;·&nbsp; ${c.resp.civil||'—'}</div>
        <div style="font-size:.82rem;color:#555;">📍 ${c.resp.addr||'—'}</div>
        <div style="font-size:.82rem;color:#555;">📞 ${c.resp.tel||'—'}</div>
      </div>
    </div>

    <!-- Description -->
    ${c.desc ? `
    <div style="background:#fdf8f0;border-left:3px solid #c9a84c;border-radius:0 6px 6px 0;
                padding:10px 14px;font-size:.86rem;margin-bottom:14px;">
      <div style="font-weight:700;margin-bottom:3px;color:#0d2137;">Description</div>
      ${c.desc}
    </div>` : ''}

    <!-- Status update -->
    <div style="background:#f0f4f8;border:1px solid #dde3ea;border-radius:8px;
                padding:12px 14px;margin-bottom:16px;">
      <div style="font-size:.78rem;font-weight:700;text-transform:uppercase;
                  letter-spacing:.07em;color:#0d2137;margin-bottom:8px;">✏️ Update Status</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${['Pending','Active','Mediation','Settled','Dismissed','Escalated'].map(s => `
          <button onclick="updateCaseStatus(${c.id},'${s}')"
            style="padding:6px 14px;border-radius:20px;border:2px solid ${c.status===s?'#0d2137':'#ccc'};
                   background:${c.status===s?'#0d2137':'#fff'};
                   color:${c.status===s?'#fff':'#444'};
                   font-size:.82rem;font-weight:${c.status===s?'700':'400'};cursor:pointer;">
            ${s}
          </button>`).join('')}
      </div>
    </div>

    <!-- Actions -->
    <div class="btn-row">
      <button class="btn btn-gold"    onclick="printCase(${c.id})">🖨️ Print Case</button>
      <button class="btn btn-outline" onclick="closeModal('view-modal')">Close</button>
    </div>`;

  document.getElementById('view-modal').classList.add('open');
}

function updateCaseStatus(id, status) {
  const c = cases.find(x => x.id === id);
  if (!c) return;
  c.status = status;
  persist();
  renderCases();
  renderDashboard();
  viewCase(id);   // re-render modal so pill highlights update live
  toast('Status updated to ' + status);
}


/* ════════════════════════════════════
   PRINT: KP FORM NO. 7 — COMPLAINT
   Called from All Cases → 🖨️ button.
   Uses the official DILG format.
════════════════════════════════════ */

function printCase(id) {
  const c = cases.find(x => x.id === id);
  if (!c) return;

  const compName  = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const dateFiled = fmtDate(c.dateFiled);

  // Get the Punong Barangay name from members list
  const pb = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName = pb ? pb.name.toUpperCase() : '';

  // Parse filed date parts for ordinal formatting
  const _fd = c.dateFiled ? new Date(c.dateFiled + 'T00:00:00') : null;
  const _day = _fd ? _fd.getDate() : null;
  const _ordinal = _day
    ? _day + (['th','st','nd','rd'][(_day%100>10&&_day%100<14)?0:(_day%10<4?_day%10:0)] || 'th')
    : '____';
  const _month = _fd ? _fd.toLocaleString('en-PH', { month: 'long' }) : '____________';
  const _year  = _fd ? _fd.getFullYear() : '____';
  const { dayStr, monthStr, yearStr2 } = parseDateParts(c.dateFiled);

  showPrint(`
    <style>${kpDocStyles()}</style>
    <div class="kp-wrap">

      ${kpHeader()}
      ${kpCaption(c)}

      <div class="kp-title">C O M P L A I N T</div>

      <div class="kp-body" style="margin-top:10px;">
        I/WE hereby complain against above named respondent/s for violating my/our rights
        and interests in the following manner:
      </div>

      <div style="margin:8px 0 16px;">${c.desc||'<div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div>'}</div>

      <div class="kp-body">
        THEREFORE, I/WE pray that the following relief/s be granted to me/us in accordance
        with law and/or equity:
      </div>

      <div style="margin:8px 0 16px;">${c.relief||'<div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div>'}</div>

      <div class="kp-body" style="margin-top:10px;">
        Made this <strong>${_ordinal}</strong> day of <strong>${_month}</strong> ${_year}.
      </div>

      <div style="margin-top:36px;">
  <div style="font-size:11pt;">${compName}</div>
  <div style="font-size:11pt;">Complainant/s</div>
</div>

      <div class="kp-body" style="margin-top:36px;">
  Received and filed this ${_ordinal} day of ${monthStr}, 20${yearStr2}.
</div>

<div style="margin-top:16px;">
  <div style="font-size:11pt;">${pbName}</div>
  <div style="font-size:11pt;">Punong Barangay</div>
</div>

    ${printBtns(exportWordBtn(`Complaint-${c.caseNo}-${c.comp.last}`))}
  `);
}


/* ════════════════════════════════════
   EXPORT: CASE REGISTRY TO WORD
════════════════════════════════════ */

function exportWord() {
  const rows = cases.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.caseNo}</td>
      <td>${shortDate(c.dateFiled)}</td>
      <td>${c.nature}</td>
      <td>${c.comp.last}, ${c.comp.first}</td>
      <td>${c.resp.last}, ${c.resp.first}</td>
      <td>${c.status}</td>
    </tr>`).join('');

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'>
    <head>
      <meta charset='utf-8'>
      <title>Lupon Cases</title>
      <style>
        body  { font-family: Arial; font-size: 11pt; }
        h1, h2 { text-align: center; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #1a1a2e; color: #fff; padding: 7px 10px; font-size: 10pt; }
        td { padding: 6px 10px; border: 1px solid #ccc; font-size: 10pt; }
        tr:nth-child(even) td { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <h1>LUPON NG TAGAPAMAYAPA</h1>
      <h2>${cfg.brgy}, ${cfg.muni}, ${cfg.prov}</h2>
      <p style="text-align:center;font-size:10pt;color:#555;">
        Complete Case Registry &mdash;
        As of: ${fmtDate(new Date().toISOString().split('T')[0])}
      </p>
      <br>
      <table>
        <tr>
          <th>#</th><th>Case No.</th><th>Date Filed</th>
          <th>Nature</th><th>Complainant</th><th>Respondent</th><th>Status</th>
        </tr>
        ${rows}
      </table>
      <br>
      <p style="font-size:9pt;color:#999;text-align:right;">
        Generated by Lupon ng Tagapamayapa CMS &mdash; ${cfg.brgy}
      </p>
    </body>
    </html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Lupon-Cases-${cfg.brgy.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.doc`;
  a.click();
  URL.revokeObjectURL(url);
  toast('📄 Exported to Word!');
}