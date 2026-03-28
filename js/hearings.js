/**
 * js/hearings.js
 * ──────────────────────────────────────────────────────
 * Hearing scheduling — add, delete, render, and print
 * the hearing schedule list.
 * ──────────────────────────────────────────────────────
 */


/* ════════════════════════════════════
   ADD / DELETE
════════════════════════════════════ */

/** Validate and add a new hearing record. */
function addHearing() {
  const cn = document.getElementById('h-case').value;
  const dt = document.getElementById('h-date').value;

  if (!cn || !dt) {
    toast('⚠️ Select case and date.', '#b22222');
    return;
  }

  const c = cases.find(x => x.caseNo === cn);

  hearings.push({
    id:       Date.now(),
    caseId:   c ? c.id : null,
    caseNo:   cn,
    date:     dt,
    time:     document.getElementById('h-time').value,
    venue:    document.getElementById('h-venue').value,
    type:     document.getElementById('h-type').value,
    mediator: document.getElementById('h-mediator').value,
    notes:    document.getElementById('h-notes').value
  });

  persist();
  renderHearings();

  // Clear entry fields (keep case dropdown selection)
  ['h-date', 'h-time', 'h-venue', 'h-mediator', 'h-notes']
    .forEach(id => { document.getElementById(id).value = ''; });

  toast('📅 Hearing scheduled!');
}

/** Remove a hearing record by ID. */
function delHearing(id) {
  if (!confirm('Delete this hearing?')) return;
  hearings = hearings.filter(h => h.id !== id);
  persist();
  renderHearings();
  toast('Deleted.', '#b22222');
}


/* ════════════════════════════════════
   RENDER
════════════════════════════════════ */

/** Re-render the hearings list sorted by date. */
let _editingHearingId = null;

function renderHearings() {
  const area = document.getElementById('hearing-list');

  if (!hearings.length) {
    area.innerHTML = `
      <div class="empty">
        <div class="ei">📭</div>
        <p>No hearings yet.</p>
      </div>`;
    return;
  }

  area.innerHTML = [...hearings]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => {
      const d   = new Date(h.date + 'T00:00:00');
      const editing = _editingHearingId === h.id;

      if (editing) {
        // ── Inline edit form ──
        return `
          <div class="h-item" style="flex-direction:column;align-items:stretch;
                background:#fdf8f0;border:2px solid #c9a84c;border-radius:10px;padding:14px;">
            <div style="font-weight:700;color:#0d2137;margin-bottom:10px;font-size:.9rem;">
              ✏️ Edit Hearing — <span style="color:#1e4d6b;">${h.caseNo}</span>
            </div>
            <div class="grid3" style="gap:10px;margin-bottom:10px;">
              <div class="fg" style="margin:0;">
                <label>Date *</label>
                <input type="date" id="eh-date" value="${h.date}">
              </div>
              <div class="fg" style="margin:0;">
                <label>Time</label>
                <input type="time" id="eh-time" value="${h.time || ''}">
              </div>
              <div class="fg" style="margin:0;">
                <label>Hearing Type</label>
                <select id="eh-type">
                  ${['First Hearing','Mediation','Conciliation','Arbitration','Follow-up','Cancelled']
                    .map(t => `<option ${h.type===t?'selected':''}>${t}</option>`).join('')}
                </select>
              </div>
              <div class="fg" style="margin:0;">
                <label>Venue</label>
                <input id="eh-venue" value="${h.venue || ''}">
              </div>
              <div class="fg" style="margin:0;">
                <label>Mediator / Pangkat</label>
                <input id="eh-mediator" value="${h.mediator || ''}">
              </div>
              <div class="fg" style="margin:0;">
                <label>Notes</label>
                <input id="eh-notes" value="${h.notes || ''}">
              </div>
            </div>
            <div class="btn-row" style="margin:0;justify-content:flex-start;gap:8px;">
              <button class="btn btn-navy" onclick="saveHearingEdit(${h.id})">💾 Save</button>
              <button class="btn btn-outline" onclick="cancelHearingEdit()">✕ Cancel</button>
            </div>
          </div>`;
      }

      // ── Normal display ──
      return `
        <div class="h-item">
          <div class="h-date-box">
            <div class="h-day">${d.getDate()}</div>
            <div class="h-mon">${d.toLocaleString('en-PH',{month:'short'}).toUpperCase()}</div>
          </div>
          <div style="flex:1;">
            <b>${h.caseNo}</b>
            — <span style="color:${h.type==='Cancelled'?'#b22222':'#1e4d6b'};
                            ${h.type==='Cancelled'?'text-decoration:line-through;':''}">${h.type}</span>
            <div style="font-size:.79rem;color:#666;margin-top:2px;">
              🕐 ${h.time || 'TBD'}
              &nbsp;|&nbsp; 📍 ${h.venue || 'TBD'}
              ${h.mediator ? '&nbsp;|&nbsp; 👨‍⚖️ ' + h.mediator : ''}
            </div>
            ${h.notes
              ? `<div style="font-size:.76rem;color:#999;margin-top:2px;">📝 ${h.notes}</div>`
              : ''}
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn btn-sm btn-gold"   title="Edit"   onclick="startHearingEdit(${h.id})">✏️</button>
            <button class="btn btn-sm btn-danger"  title="Delete" onclick="delHearing(${h.id})">🗑️</button>
          </div>
        </div>`;
    }).join('');
}

function startHearingEdit(id) {
  _editingHearingId = id;
  renderHearings();
  // Scroll to the edit form
  setTimeout(() => {
    const items = document.querySelectorAll('#hearing-list .h-item');
    items.forEach(el => { if (el.querySelector('#eh-date')) el.scrollIntoView({behavior:'smooth',block:'center'}); });
  }, 50);
}

function cancelHearingEdit() {
  _editingHearingId = null;
  renderHearings();
}

function saveHearingEdit(id) {
  const h = hearings.find(x => x.id === id);
  if (!h) return;
  const dt = document.getElementById('eh-date').value;
  if (!dt) { toast('⚠️ Date is required.', '#b22222'); return; }

  h.date     = dt;
  h.time     = document.getElementById('eh-time').value;
  h.type     = document.getElementById('eh-type').value;
  h.venue    = document.getElementById('eh-venue').value;
  h.mediator = document.getElementById('eh-mediator').value;
  h.notes    = document.getElementById('eh-notes').value;

  _editingHearingId = null;
  persist();
  renderHearings();
  toast('Hearing updated!');
}


/* ════════════════════════════════════
   FILL CASE DROPDOWNS
════════════════════════════════════ */

/**
 * Populate the case selector dropdowns used on the Hearings
 * and Settlement pages.
 */
function fillCaseDDs() {
  ['h-case', 's-case'].forEach(id => {
    const el  = document.getElementById(id);
    const cur = el.value;
    el.innerHTML =
      '<option value="">— Select Case —</option>' +
      cases.map(c =>
        `<option value="${c.caseNo}" ${c.caseNo === cur ? 'selected' : ''}>
           ${c.caseNo} — ${c.comp.last} vs ${c.resp.last}
         </option>`
      ).join('');
  });
}


/* ════════════════════════════════════
   PRINT: HEARING SCHEDULE
════════════════════════════════════ */

function printHearings() {
  const sorted = [...hearings].sort((a, b) => a.date.localeCompare(b.date));

  showPrint(`
    ${brgyHeader('HEARING SCHEDULE')}
    <div style="text-align:center;font-size:10pt;margin-bottom:16px;">
      As of: <b>${fmtDate(new Date().toISOString().split('T')[0])}</b>
    </div>
    <table class="ptbl">
      <tr>
        <th>#</th><th>Case No.</th><th>Date</th>
        <th>Time</th><th>Venue</th><th>Type</th><th>Mediator</th>
      </tr>
      ${sorted.map((h, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${h.caseNo}</b></td>
          <td>${fmtDate(h.date)}</td>
          <td>${h.time || '—'}</td>
          <td>${h.venue || '—'}</td>
          <td>${h.type}</td>
          <td>${h.mediator || '—'}</td>
        </tr>`).join('')}
    </table>
    ${printFooter()}
    ${printBtns(exportWordBtn('Hearing-Schedule'))}
  `);
}