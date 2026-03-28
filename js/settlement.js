/**
 * js/settlement.js
 * ──────────────────────────────────────────────────────
 * Settlement recording — add, delete, render, and trigger
 * certificate printing from the settlement list.
 * ──────────────────────────────────────────────────────
 */



/* 
   ADD / DELETE
 */

/** Validate and record a new settlement. Also updates the parent case status. */
function addSettlement() {
  const cn    = document.getElementById('s-case').value;
  const terms = document.getElementById('s-terms').value.trim();
  const dt    = document.getElementById('s-date').value;

  if (!cn || !terms || !dt) {
    toast('⚠️ Select case, date, and enter terms.', '#b22222');
    return;
  }

  const st = document.getElementById('s-type').value;

  const s = {
    id:      Date.now(),
    caseNo:  cn,
    date:    dt,
    type:    st,
    terms,
    captain: document.getElementById('s-captain').value,
    witness: document.getElementById('s-witness').value
  };

  settlements.push(s);

  // Auto-update the linked case status
  const c = cases.find(x => x.caseNo === cn);
  if (c) {
    if (st.includes('Settlement') || st.includes('Agreement') || st.includes('Award')) {
      c.status = 'Settled';
    } else if (st.includes('Escalated')) {
      c.status = 'Escalated';
    } else if (st.includes('Dismissed')) {
      c.status = 'Dismissed';
    }
  }

  persist();
  renderSettlements();

  // Clear entry fields
  ['s-date', 's-terms', 's-captain', 's-witness']
    .forEach(id => { document.getElementById(id).value = ''; });

  toast(' Settlement recorded!');
}

/** Delete a settlement record by ID. */
function delSettlement(id) {
  if (!confirm('Delete this settlement record?')) return;
  settlements = settlements.filter(s => s.id !== id);
  persist();
  renderSettlements();
  toast('Deleted.', '#b22222');
}


/* 
   RENDER
 */

/** Re-render the settlements table (newest first). */
function renderSettlements() {
  const tb = document.getElementById('settle-tbody');

  if (!settlements.length) {
    tb.innerHTML = `<tr>
      <td colspan="5" style="text-align:center;color:#999;padding:24px;">
        No records yet.
      </td>
    </tr>`;
    return;
  }

  tb.innerHTML = [...settlements].reverse().map(s => {
    const summary = s.terms.substring(0, 55) + (s.terms.length > 55 ? '...' : '');
    return `
      <tr>
        <td><b>${s.caseNo}</b></td>
        <td>${shortDate(s.date)}</td>
        <td>${s.type}</td>
        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            title="${s.terms}">
          ${summary}
        </td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-gold"   onclick="printSettlementById(${s.id})">🖨️</button>
          <button class="btn btn-sm btn-danger"  onclick="delSettlement(${s.id})">🗑️</button>
        </td>
      </tr>`;
  }).join('');
}

/**
 * Convenience wrapper — pre-fill the Documents > Certificate tab
 * with a specific settlement and immediately generate the certificate.
 */
function printSettlementById(id) {
  fillDocDDs();
  setTimeout(() => {
    document.getElementById('cert-settle').value = id;
    const s = settlements.find(x => x.id === id);
    if (s) {
      document.getElementById('cert-date').value =
        s.date || new Date().toISOString().split('T')[0];
    }
    printCertificate();
  }, 100);
}
