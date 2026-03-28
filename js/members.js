/**
 * js/members.js
 * ──────────────────────────────────────────────────────
 * Lupon Members — add, edit (inline), delete, render,
 * and print the official members list.
 * ──────────────────────────────────────────────────────
 */

let editingMemberId = null;


/* ════════════════════════════════════
   ADD / DELETE
════════════════════════════════════ */

/** Validate and add a new Lupon member. */
function addMember() {
  const name = document.getElementById('lm-name').value.trim();
  if (!name) { toast('⚠️ Enter member name.', '#b22222'); return; }

  members.push({
    id:     Date.now(),
    name,
    role:   document.getElementById('lm-role').value,
    tel:    document.getElementById('lm-tel').value,
    date:   document.getElementById('lm-date').value,
    exp:    document.getElementById('lm-exp').value,
    status: document.getElementById('lm-status').value
  });

  persist();
  renderMembers();

  // Clear entry fields
  ['lm-name', 'lm-tel', 'lm-date', 'lm-exp']
    .forEach(id => { document.getElementById(id).value = ''; });

  toast('👤 Member added!');
}

/** Delete a member record by ID. */
function delMember(id) {
  if (!confirm('Delete this member?')) return;
  members = members.filter(m => m.id !== id);
  persist();
  renderMembers();
  toast('Deleted.', '#b22222');
}


/* ════════════════════════════════════
   INLINE EDIT
════════════════════════════════════ */

/** Switch a table row into edit mode. */
function startMemberEdit(id) {
  editingMemberId = id;
  renderMembers();
  const el = document.getElementById('em-name');
  if (el) el.focus();
}

/** Cancel inline editing without saving. */
function cancelMemberEdit() {
  editingMemberId = null;
  renderMembers();
}

/** Save the inline-edited member record. */
function saveMemberEdit(id) {
  const name = document.getElementById('em-name').value.trim();
  if (!name) { toast('⚠️ Name is required.', '#b22222'); return; }

  const m   = members.find(x => x.id === id);
  m.name    = name;
  m.role    = document.getElementById('em-role').value;
  m.tel     = document.getElementById('em-tel').value;
  m.date    = document.getElementById('em-date').value;
  m.exp     = document.getElementById('em-exp').value;
  m.status  = document.getElementById('em-status').value;

  editingMemberId = null;
  persist();
  renderMembers();
  toast('Member updated!');
}


/* ════════════════════════════════════
   RENDER
════════════════════════════════════ */

const ROLES = [
  'Punong Barangay (Chairperson)',
  'Lupon Secretary',
  'Lupon Clerk',
  'Lupon Member',
  'Pangkat Chairperson',
  'Pangkat Member'
];

/** Re-render the members table. Rows in edit mode show inline inputs. */
function renderMembers() {
  const tb = document.getElementById('members-tbody');

  if (!members.length) {
    tb.innerHTML = `<tr>
      <td colspan="8" style="text-align:center;color:#999;padding:24px;">
        No members yet.
      </td>
    </tr>`;
    return;
  }

  tb.innerHTML = members.map((m, i) => {
    if (editingMemberId === m.id) {
      // ── Edit row ──
      const roleOpts = ROLES.map(r =>
        `<option ${m.role === r ? 'selected' : ''}>${r}</option>`
      ).join('');

      return `
        <tr style="background:#fdf8f0;">
          <td>${i + 1}</td>
          <td>
            <input id="em-name" value="${m.name}"
              style="width:100%;border:1.5px solid #c9a84c;border-radius:5px;
                     padding:5px 8px;font-family:inherit;font-size:.84rem;">
          </td>
          <td>
            <select id="em-role"
              style="width:100%;border:1.5px solid #c9a84c;border-radius:5px;
                     padding:5px 8px;font-family:inherit;font-size:.84rem;">
              ${roleOpts}
            </select>
          </td>
          <td>
            <input id="em-tel" value="${m.tel || ''}" placeholder="Contact"
              style="width:100%;border:1.5px solid #c9a84c;border-radius:5px;
                     padding:5px 8px;font-family:inherit;font-size:.84rem;">
          </td>
          <td>
            <input type="date" id="em-date" value="${m.date || ''}"
              style="width:100%;border:1.5px solid #c9a84c;border-radius:5px;
                     padding:5px 8px;font-family:inherit;font-size:.84rem;">
          </td>
          <td>
            <input type="date" id="em-exp" value="${m.exp || ''}"
              style="width:100%;border:1.5px solid #c9a84c;border-radius:5px;
                     padding:5px 8px;font-family:inherit;font-size:.84rem;">
          </td>
          <td>
            <select id="em-status"
              style="width:100%;border:1.5px solid #c9a84c;border-radius:5px;
                     padding:5px 8px;font-family:inherit;font-size:.84rem;">
              <option ${m.status === 'Active'   ? 'selected' : ''}>Active</option>
              <option ${m.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </td>
          <td style="white-space:nowrap;">
            <button class="btn btn-sm btn-green"   onclick="saveMemberEdit(${m.id})">💾 Save</button>
            <button class="btn btn-sm btn-outline"  onclick="cancelMemberEdit()">✕</button>
          </td>
        </tr>`;
    }

    // ── Display row ──
    return `
      <tr>
        <td>${i + 1}</td>
        <td><b>${m.name}</b></td>
        <td>${m.role}</td>
        <td>${m.tel || '—'}</td>
        <td>${shortDate(m.date)}</td>
        <td>${shortDate(m.exp)}</td>
        <td>
          <span class="badge ${m.status === 'Active' ? 'bs' : 'bd'}">
            ${m.status}
          </span>
        </td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-gold"   onclick="startMemberEdit(${m.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger"  onclick="delMember(${m.id})">🗑️</button>
        </td>
      </tr>`;
  }).join('');
}


/* ════════════════════════════════════
   PRINT: MEMBERS LIST
════════════════════════════════════ */

function printMembers() {
  showPrint(`
    ${brgyHeader('LIST OF LUPON MEMBERS')}
    <table class="ptbl">
      <tr>
        <th>#</th><th>Name</th><th>Position</th><th>Contact</th>
        <th>Date Appointed</th><th>Term Expiry</th><th>Status</th><th>Signature</th>
      </tr>
      ${members.map((m, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${m.name}</b></td>
          <td>${m.role}</td>
          <td>${m.tel || '—'}</td>
          <td>${shortDate(m.date)}</td>
          <td>${shortDate(m.exp)}</td>
          <td>${m.status}</td>
          <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
        </tr>`).join('')}
    </table>

    <div style="margin-top:34px;display:flex;justify-content:space-between;font-size:9.5pt;">
      <span>Prepared by: ____________________________</span>
      <span>Date: ____________________________</span>
      <span>Noted by: ____________________________</span>
    </div>

    ${printFooter()}
    ${printBtns(exportWordBtn('Lupon-Members-List'))}
  `);
}