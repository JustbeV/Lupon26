/**
 * js/documents.js — Official KP Document Generators
 * All 25 DILG Katarungang Pambarangay forms
 */

/* ════ SHARED STYLES ════ */
function kpDocStyles() {
  return `
    @page { size: 8.5in 11in; margin: 1in; }
    .kp-wrap { font-family:'Times New Roman',Times,serif; font-size:12pt; color:#000; max-width:680px; margin:0 auto; }
    .kp-republic { text-align:center; font-size:11pt; text-transform:uppercase; letter-spacing:.04em; margin-bottom:2px; }
    .kp-province  { text-align:center; font-size:11pt; margin-bottom:2px; }
    .kp-brgy      { text-align:center; font-size:11pt; font-weight:bold; margin-bottom:2px; }
    .kp-office    { text-align:center; font-size:11pt; font-weight:bold; text-transform:uppercase;  padding-bottom:4px; margin-bottom:8px; }
    .kp-divider   { border:none; border-top:2px solid #000; margin:6px 0 10px; }
    .kp-title     { text-align:center; font-size:13pt; font-weight:bold; text-transform:uppercase; letter-spacing:.12em; margin:10px 0 14px; }
    .kp-body      { font-size:12pt; line-height:1.8; margin-bottom:10px; }
    .kp-line      { display:inline-block; border-bottom:1px solid #000; min-width:180px; vertical-align:bottom; font-weight:bold; }
    .kp-line-sm   { min-width:80px; }
    .kp-line-lg   { min-width:280px; }
    .kp-line-full { display:block; width:100%; margin-top:4px; }
    .kp-sig-row   { display:flex; gap:40px; margin-bottom:30px; }
    .kp-sig-col   { flex:1; text-align:center; }
    .kp-sig-line  { border-top:1px solid #000; padding-top:4px; font-size:11pt; margin-top:44px; }
    .kp-sig-label { font-size:10.5pt; margin-top:2px; }
    .kp-indent    { margin-left:24px; font-size:12pt; line-height:1.8; }
    .kp-box       { border:1px solid #000; min-height:100px; padding:10px 14px; font-size:12pt; line-height:1.8; margin:8px 0 14px; }
    .kp-return-table { width:100%; border-collapse:collapse; font-size:11pt; margin-top:10px; }
    .kp-return-table td { padding:5px 6px; vertical-align:top; }
    .kp-note      { font-size:10pt; font-style:italic; margin-top:16px; border-top:1px dashed #aaa; padding-top:6px; color:#444; }
    .p-noprint    { margin-top:24px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
    @media print  { .p-noprint { display:none !important; } }
  `;
}

/* ════ SHARED HELPERS ════ */
function kpHeader() {
  return `
    <table style="width:auto;margin:0 auto;border-collapse:collapse;margin-bottom:6px;">
      <tr>
        <td style="width:90px;vertical-align:middle;text-align:center;">
          <img src="assets/logo.png" width="100" height="100"
               style="border-radius:50%;display:block;margin:0 auto;"
               onerror="this.style.display='none'">
        </td>
        <td style="vertical-align:middle;text-align:center;padding:20px 8px 0 8px;">

        <div class="kp-republic" style="text-transform:none;font-size:10pt;">Republic of the Philippines</div>
        <div class="kp-province" style="font-size:10pt;">Province of 1<sup>st</sup> District of ${cfg.prov}</div>
        <div class="kp-province" style="font-size:10pt;text-transform:uppercase;">CITY OF ${cfg.muni}</div>
        <div class="kp-brgy" style="font-size:13pt;text-transform:uppercase;letter-spacing:.05em;">${cfg.brgy}</div>
          <div style="margin-top:30px;"></div>
          <div class="kp-office">OFFICE OF THE LUPONG TAGAPAMAYAPA</div>
        </td>
  <td style="width:110px;vertical-align:middle;text-align:center;">
  <img src="assets/magandang-gensan-logo.png" width="100" height="100"
       style="display:block;margin:0 auto;"
       onerror="this.style.display='none'">
</td>
      </tr>
    </table>`;
}

function kpCaption(c) {
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  return `
    <table style="width:100%;font-size:11pt;margin-bottom:4px;">
      <tr>
        <td style="width:55%;vertical-align:top;">
          <div>${cn}</div>
          <div style="font-size:10pt;color:#333;">${c.comp.addr || ''}</div>
          <div style="padding-left:20px;font-style:italic;">Complainant/s</div>
          <div style="text-align:center;font-style:italic;margin:6px 0;">-against-</div>
          <div>${rn}</div>
          <div style="font-size:10pt;color:#333;">${c.resp.addr || ''}</div>
          <div style="padding-left:20px;font-style:italic;">Respondent/s</div>
        </td>
        <td style="width:45%;vertical-align:top;padding-left:16px;font-size:11pt;">
          <div>Barangay Case No. <strong>${c.caseNo}</strong></div>
<div style="margin-top:4px;">For: <strong>${c.nature}</strong></div>
        </td>
      </tr>
    </table>`;
}

function parseDateParts(v) {
  if (!v) return { dayStr: '_______', monthStr: '_______________', yearStr2: '__' };
  const d = new Date(v + 'T00:00:00');
  return { dayStr: d.getDate().toString(), monthStr: d.toLocaleString('en-PH', { month: 'long' }), yearStr2: d.getFullYear().toString().slice(-2) };
}

function parseTimeParts(v) {
  if (!v) return { hourStr: '_______', ampm: 'morning/afternoon' };
  const [h, m] = v.split(':'); const hr = parseInt(h);
  return { hourStr: `${hr > 12 ? hr - 12 : hr || 12}:${m}`, ampm: hr >= 12 ? 'afternoon' : 'morning' };
}

function kpDateLine(v) {
  const { dayStr, monthStr, yearStr2 } = parseDateParts(v);
  return `This <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span>.`;
}

function kpSingleSig(name, label) {
  return `<div style="margin-top:44px;text-align:center;"><div class="kp-line" style="min-width:260px;display:inline-block;">${name || ''}</div><div style="font-size:11pt;margin-top:4px;">${label}</div></div>`;
}

function kpTwoSig(n1, l1, n2, l2) {
  return `<div class="kp-sig-row" style="margin-top:40px;"><div class="kp-sig-col"><div class="kp-sig-line">${n1 || ''}</div><div class="kp-sig-label">${l1}</div></div><div class="kp-sig-col"><div class="kp-sig-line">${n2 || ''}</div><div class="kp-sig-label">${l2}</div></div></div>`;
}


function kpAttestedBy(name, label) {
  return `<div style="margin-top:16px;font-size:12pt;font-weight:bold;">Attested by:</div>${kpSingleSig(name, label)}`;
}

function getPBName() {
  const pb = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  return pb ? pb.name.toUpperCase() : '';
}

function kpShow(html, filename, pageSize) {
  showPrint(`<style>${kpDocStyles()}</style>${html}${printBtns(exportWordBtn(filename, pageSize))}`);
}

/* ════ DROPDOWN POPULATION ════ */
function fillDocDDs() {
  const caseOpts = '<option value="">— Select Case —</option>' +
    cases.map(c => `<option value="${c.id}">${c.caseNo} — ${c.comp.last} vs ${c.resp.last}</option>`).join('');
  const settleOpts = '<option value="">— Select Settlement —</option>' +
    settlements.map(s => `<option value="${s.id}">${s.caseNo} — ${s.type} (${shortDate(s.date)})</option>`).join('');
  const memberOpts = '<option value="">— Select Member —</option>' +
    members.map(m => `<option value="${m.id}">${m.name} — ${m.role}</option>`).join('');

  ['sum-case', 'cfa-case', 'cs-case', 'f8-case', 'f10-case', 'f11-case', 'f12-case', 'f13-case',
    'f14-case', 'f15-case', 'f17-case', 'f18-case', 'f19-case', 'f21-case', 'f22-case',
    'f23-case', 'f24-case', 'f25-case'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = caseOpts; });
  ['cert-settle', 'f25-settle'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = settleOpts; });
  ['f2-member', 'f3-member', 'f5-member', 'f6-member'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = memberOpts; });

  const today = new Date().toISOString().split('T')[0];
  ['sum-date', 'cfa-date', 'cert-date', 'cs-date', 'f8-date', 'f8-hdate', 'f10-date', 'f10-hdate',
    'f11-date', 'f12-date', 'f12-hdate', 'f13-date', 'f13-hdate', 'f14-date', 'f15-date',
    'f17-date', 'f18-date', 'f18-hdate', 'f19-date', 'f19-hdate', 'f21-date', 'f22-date',
    'f23-date', 'f24-date', 'f24-hdate', 'f25-date', 'f2-date', 'f3-date', 'f3-oath', 'f5-date', 'f6-date', 'f1-date', 'f1-deadline'].forEach(id => {
      const el = document.getElementById(id); if (el && !el.value) el.value = today;
    });
}

/* ════ FORM 7 — COMPLAINT ════ */
function printComplaintSheet() {
  const cid = document.getElementById('cs-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const compName = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">C O M P L A I N T</div>
    <div class="kp-body">I/WE hereby complain against above named respondent/s for violating my/our rights and interests in the following manner:</div>
     
    <div style="margin:8px 0 16px;">${c.desc || '<div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div>'}</div>
    <div class="kp-body">THEREFORE, I/WE pray that the following relief/s be granted to me/us in accordance with law and/or equity.</div>
   <div style="margin:8px 0 16px;">${c.relief || '<div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div><div style="border-bottom:1px solid #000;margin-top:18px;"></div>'}</div>
    <div class="kp-body">Made this <span class="kp-line" style="min-width:160px;">${fmtDate(document.getElementById('cs-date').value)}</span>.</div>
    ${kpSingleSig(compName, 'Complainant/s')}
    <div class="kp-body" style="margin-top:36px;">Received and filed this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpSingleSig('', 'Punong Barangay / Lupon Chairman')}
    ${printFooter()}</div>`, `Form7-Complaint-${c.caseNo}`);
}

/* ════ FORM 8 — NOTICE OF HEARING (MEDIATION) ════ */
function printNoticeHearingMed() {
  const cid = document.getElementById('f8-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('f8-hdate').value);
  const { hourStr, ampm } = parseTimeParts(document.getElementById('f8-htime').value);
  const compName = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title" style="font-size:12pt;">NOTICE OF HEARING<br>(MEDIATION PROCEEDINGS)</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${compName}</span></div>
    <div class="kp-body" style="margin-top:14px;">You are hereby required to appear before me on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span> at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock in the ${ampm} for the hearing of your complaint.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f8-date').value)}</div>
    ${kpSingleSig('', 'Punong Barangay / Lupon Chairman')}
    <div class="kp-body" style="margin-top:30px;">Notified this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    <div style="margin-top:16px;font-size:11pt;font-weight:bold;">Complainant/s</div>
    ${kpTwoSig('', '', '', '')}${printFooter()}</div>`, `Form8-NoticeHearingMed-${c.caseNo}`);
}

/* ════ FORM 9 — SUMMONS ════ */
function printSummons() {
  const cid = document.getElementById('sum-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const to = document.getElementById('sum-to').value;
  const sdate = fmtDate(document.getElementById('sum-date').value);
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('sum-hdate').value);
  const { hourStr, ampm } = parseTimeParts(document.getElementById('sum-htime').value);

  function oneSummons(person) {
    const pn = `${person.last}, ${person.first}${person.mid ? ' ' + person.mid : ''}`;
    return `<div class="kp-wrap">${kpHeader()}
      <div style="text-align:right;font-size:11pt;margin-bottom:10px;">${sdate}</div>
      ${kpCaption(c)}
      <div class="kp-title">S U M M O N S</div>
      <div class="kp-body">TO: <span class="kp-line kp-line-lg">${pn}</span><br><span style="display:inline-block;width:30px;"></span><span class="kp-line kp-line-lg">${person.addr || ''}</span></div>
      <div class="kp-body" style="margin-top:14px;">You are hereby summoned to appear before me in person, together with your witnesses, on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span>, at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock in the <span class="kp-line kp-line-sm">${ampm}</span>, then and there to answer to a complaint made before me, copy of which is attached hereto, for mediation/conciliation of your dispute with complainant/s.</div>
      <div class="kp-body">You are hereby warned that if you refuse or willfully fail to appear in obedience to this summons, you may be barred from filing any counterclaim arising from said complaint.</div>
      <div class="kp-body" style="font-weight:bold;">FAIL NOT or else face punishment as for contempt of court.</div>
      <div class="kp-body" style="margin-top:14px;">${kpDateLine(document.getElementById('sum-date').value)}</div>
      <div style="margin-top:36px;text-align:right;"><div class="kp-line" style="min-width:240px;display:inline-block;"></div><div style="font-size:11pt;margin-top:4px;">Punong Barangay / Lupon Chairman</div></div>
      <div style="page-break-before:always;"></div>
      <div class="kp-wrap">${kpHeader()}
        <div class="kp-title" style="font-size:12pt;">OFFICER'S RETURN</div>
        <div class="kp-body">I served this summons upon respondent <span class="kp-line" style="min-width:160px;"></span> on the <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>, and upon respondent <span class="kp-line" style="min-width:160px;"></span> on the <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>, by: <em>(Write name/s of respondent/s before mode by which served.)</em></div>
        <table class="kp-return-table">
          <tr><td>&nbsp;&nbsp;</td><td><span class="kp-line" style="min-width:200px;"></span> 1. handing to him/them said summons in person, or</td></tr>
          <tr><td colspan="2" style="height:8px;"></td></tr>
          <tr><td>&nbsp;&nbsp;</td><td><span class="kp-line" style="min-width:200px;"></span> 2. handing to him/them said summons and he/they refused to receive it, or</td></tr>
          <tr><td colspan="2" style="height:8px;"></td></tr>
          <tr><td>&nbsp;&nbsp;</td><td><span class="kp-line" style="min-width:200px;"></span> 3. leaving said summons at his/their dwelling with <span class="kp-line" style="min-width:160px;"></span> <em>(name)</em>, a person of suitable age and discretion residing therein, or</td></tr>
          <tr><td colspan="2" style="height:8px;"></td></tr>
          <tr><td>&nbsp;&nbsp;</td><td><span class="kp-line" style="min-width:200px;"></span> 4. leaving said summons at his/their office/place of business with <span class="kp-line" style="min-width:160px;"></span> <em>(name)</em>, a competent person in charge thereof.</td></tr>
        </table>
        <div style="margin-top:36px;text-align:right;"><div class="kp-line" style="min-width:200px;display:inline-block;"></div><div style="font-size:11pt;margin-top:4px;">Officer</div></div>
        <div style="margin-top:24px;font-size:11pt;font-weight:bold;">Received by Respondent/s / Representative/s:</div>
        <table style="width:100%;margin-top:10px;font-size:11pt;">
          <tr><td style="width:50%;padding-right:20px;"><div class="kp-line kp-line-full"></div><div style="font-size:10pt;margin-top:2px;">(Signature)</div></td><td><div class="kp-line kp-line-full"></div><div style="font-size:10pt;margin-top:2px;">(Date)</div></td></tr>
          <tr><td colspan="2" style="height:16px;"></td></tr>
          <tr><td style="padding-right:20px;"><div class="kp-line kp-line-full"></div><div style="font-size:10pt;margin-top:2px;">(Signature)</div></td><td><div class="kp-line kp-line-full"></div><div style="font-size:10pt;margin-top:2px;">(Date)</div></td></tr>
        </table>
      </div></div>`;
  }
  let html = '';
  if (to === 'respondent' || to === 'both') html += oneSummons(c.resp);
  if (to === 'both') html += '<div style="page-break-before:always;"></div>';
  if (to === 'complainant' || to === 'both') html += oneSummons(c.comp);
  kpShow(
  html + `<button onclick="exportSummonsDocx(${c.id})" style="background:#1a5c38;color:#fff;border:none;padding:10px 22px;border-radius:6px;font-size:.94rem;cursor:pointer;font-weight:700;">
    Export to Word (.docx)
  </button>`,
  `Form9-Summons-${c.caseNo}`
);
}

/* ════ FORM 10 — NOTICE FOR CONSTITUTION OF PANGKAT ════ */
function printNoticePangkat() {
  const cid = document.getElementById('f10-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('f10-hdate').value);
  const { hourStr, ampm } = parseTimeParts(document.getElementById('f10-htime').value);
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title" style="font-size:12pt;">NOTICE FOR CONSTITUTION OF PANGKAT</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${cn}</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="kp-line kp-line-lg">${rn}</span><br><span style="padding-left:30px;font-style:italic;">Complainant/s</span><span style="padding-left:120px;font-style:italic;">Respondent/s</span></div>
    <div class="kp-body" style="margin-top:14px;">You are hereby required to appear before me on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span> at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock in the ${ampm} for the constitution of the Pangkat ng Tagapagkasundo which shall conciliate your dispute. Should you fail to agree on the Pangkat membership or to appear on the aforesaid date for the constitution of the Pangkat, I shall determine the membership thereof by drawing lots.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f10-date').value)}</div>
    ${kpSingleSig('', 'Punong Barangay')}
    <div class="kp-body" style="margin-top:30px;">Notified this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpTwoSig('', 'Complainant/s', '', 'Respondent/s')}${printFooter()}</div>`, `Form10-NoticePangkat-${c.caseNo}`);
}

/* ════ FORM 11 — NOTICE TO CHOSEN PANGKAT MEMBER ════ */
function printNoticePangkatMember() {
  const cid = document.getElementById('f11-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const mn = document.getElementById('f11-member').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div style="text-align:right;font-size:11pt;margin-bottom:10px;">${fmtDate(document.getElementById('f11-date').value)}</div>
    <div class="kp-title" style="font-size:12pt;">NOTICE TO CHOSEN PANGKAT MEMBER</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${mn}</span></div>
    <div class="kp-body" style="margin-top:14px;">Notice is hereby given that you have been chosen member of the Pangkat ng Tagapagkasundo to amicably conciliate the dispute between the parties in the above-entitled case.</div>
    ${kpSingleSig('', 'Punong Barangay / Lupon Secretary')}
    <div class="kp-body" style="margin-top:30px;">Received this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpSingleSig('', 'Pangkat Member')}${printFooter()}</div>`, `Form11-NoticePangkatMember-${c.caseNo}`);
}

/* ════ FORM 12 — NOTICE OF HEARING (CONCILIATION) ════ */
function printNoticeHearingCon() {
  const cid = document.getElementById('f12-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('f12-hdate').value);
  const { hourStr } = parseTimeParts(document.getElementById('f12-htime').value);
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${cn}</span> &nbsp;&nbsp;&nbsp;&nbsp; <span class="kp-line kp-line-lg">${rn}</span><br><span style="padding-left:30px;font-style:italic;">Complainant/s</span><span style="padding-left:110px;font-style:italic;">Respondent/s</span></div>
    <div class="kp-title" style="font-size:12pt;">NOTICE OF HEARING<br>(CONCILIATION PROCEEDING)</div>
    <div class="kp-body">You are hereby required to appear before the Pangkat on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span>, at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock for a hearing of the above-entitled case.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f12-date').value)}</div>
    ${kpSingleSig('', 'Pangkat Chairman')}
    <div class="kp-body" style="margin-top:30px;">Notified this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpTwoSig('', 'Complainant/s', '', 'Respondent/s')}${printFooter()}</div>`, `Form12-NoticeHearingCon-${c.caseNo}`);
}

/* ════ FORM 13 — SUBPOENA ════ */
function printSubpoena() {
  const cid = document.getElementById('f13-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const w1 = document.getElementById('f13-w1').value.trim() || '______________________________';
  const w2 = document.getElementById('f13-w2').value.trim();
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('f13-hdate').value);
  const { hourStr } = parseTimeParts(document.getElementById('f13-htime').value);
  const issuer = document.getElementById('f13-issuer').value;
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">S U B P O E N A</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${w1}</span><br>${w2 ? `<span style="display:inline-block;width:30px;"></span><span class="kp-line kp-line-lg">${w2}</span><br>` : ''}<span style="padding-left:30px;font-style:italic;">Witness/es</span></div>
    <div class="kp-body" style="margin-top:14px;">You are hereby commanded to appear before me on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span>, at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock, then and there to testify in the hearing of the above-captioned case.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f13-date').value)}</div>
    ${kpSingleSig('', issuer === 'pangkat' ? 'Pangkat Chairman' : 'Punong Barangay / Pangkat Chairman')}
    <div class="kp-note">(Cross out whichever one is not applicable.)</div>
    ${printFooter()}</div>`, `Form13-Subpoena-${c.caseNo}`);
}

/* ════ FORM 14 — AGREEMENT FOR ARBITRATION ════ */
function printArbitrationAgreement() {
  const cid = document.getElementById('f14-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const arbType = document.getElementById('f14-type').value;
  const chair = document.getElementById('f14-chair').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">AGREEMENT FOR ARBITRATION</div>
    <div class="kp-body" style="margin-top:10px;">We hereby agree to submit our dispute for arbitration to the <span class="kp-line" style="min-width:200px;">${arbType}</span> and bind ourselves to comply with the award that may be rendered thereon. We have made this agreement freely with a full understanding of its nature and consequences.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f14-date').value)}</div>
    ${kpTwoSig(cn, 'Complainant/s', rn, 'Respondent/s')}
    <div style="margin-top:24px;font-size:12pt;font-weight:bold;">ATTESTATION</div>
    <div class="kp-body" style="margin-top:8px;">I hereby certify that the foregoing Agreement for Arbitration was entered into by the parties freely and voluntarily, after I had explained to them the nature and consequences of such agreement.</div>
    ${kpSingleSig(chair, 'Punong Barangay / Pangkat Chairman')}${printFooter()}</div>`, `Form14-ArbitrationAgreement-${c.caseNo}`);
}

/* ════ FORM 15 — ARBITRATION AWARD ════ */
function printArbitrationAward() {
  const cid = document.getElementById('f15-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const award = document.getElementById('f15-award').value.trim() || '&nbsp;';
  const chair = document.getElementById('f15-chair').value.trim() || '______________________________';
  const m1 = document.getElementById('f15-m1').value.trim();
  const m2 = document.getElementById('f15-m2').value.trim();
  const attested = document.getElementById('f15-attested').value.trim() || '______________________________';
  const attestBy = document.getElementById('f15-attest-by').value;
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">ARBITRATION AWARD</div>
    <div class="kp-body" style="margin-top:10px;">After hearing the testimonies, given the careful examination of the evidence presented in this case, award is hereby made as follows:</div>
    <div class="kp-box" style="min-height:120px;">${award}</div>
    <div class="kp-body">Made this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span> at <span class="kp-line" style="min-width:200px;">${cfg.brgy}</span>.</div>
    <div class="kp-sig-row" style="margin-top:40px;">
      <div class="kp-sig-col"><div class="kp-sig-line">${chair}</div><div class="kp-sig-label">Punong Barangay / Pangkat Chairman*</div></div>
      <div class="kp-sig-col"><div class="kp-sig-line">${m1 || ''}</div><div class="kp-sig-label">Member</div></div>
      <div class="kp-sig-col"><div class="kp-sig-line">${m2 || ''}</div><div class="kp-sig-label">Member</div></div>
    </div>
    <div style="margin-top:16px;font-size:12pt;font-weight:bold;">ATTESTED:</div>
    ${kpSingleSig(attested, attestBy === 'secretary' ? 'Punong Barangay / Lupon Secretary**' : 'Lupon Chairman**')}
    <div class="kp-note">* To be signed by either the Punong Barangay or the Pangkat Chairman, whoever made the award.<br>** To be signed by the Punong Barangay if the award is by the Pangkat Chairman, and by the Lupon Secretary if the award is made by the Punong Barangay.</div>
    ${printFooter()}</div>`, `Form15-ArbitrationAward-${c.caseNo}`);
}

/* ════ FORM 16 — AMICABLE SETTLEMENT ════ */
function printCertificate() {
  const sid = document.getElementById('cert-settle').value;
  const s = settlements.find(x => x.id == sid);
  if (!s) { toast('Select a settlement.', '#b22222'); return; }
  const c = cases.find(x => x.caseNo === s.caseNo);
  const cn = c ? `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}` : '______________________________';
  const rn = c ? `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}` : '______________________________';

  const _d = s.date ? new Date(s.date + 'T00:00:00') : null;
  const _day = _d ? _d.getDate() : null;
  const _ord = _day ? _day + (['th', 'st', 'nd', 'rd'][(_day % 100 > 10 && _day % 100 < 14) ? 0 : (_day % 10 < 4 ? _day % 10 : 0)] || 'th') : '______';
  const _mon = _d ? _d.toLocaleString('en-PH', { month: 'long' }) : '_________________';
  const _yr = _d ? _d.getFullYear() : '____';

  kpShow(`<div class="kp-wrap">${kpHeader()}<div style="margin-top:50px;"></div>${c ? kpCaption(c) : ''}
    <div class="kp-title">AMICABLE SETTLEMENT</div>
    <div class="kp-body" style="margin-top:10px;">We, complainant/s and respondent/s in the above-captioned case, do hereby agree to settle our dispute as follows:</div>
    <div style="margin:10px 0 16px;">
      ${s.terms
      ? `<div style="font-size:12pt;line-height:1.8;">${s.terms}</div>`
      : `<div style="border-bottom:1px solid #000;margin-top:20px;"></div>
           <div style="border-bottom:1px solid #000;margin-top:20px;"></div>
           <div style="border-bottom:1px solid #000;margin-top:20px;"></div>
           <div style="border-bottom:1px solid #000;margin-top:20px;"></div>
           <div style="border-bottom:1px solid #000;margin-top:20px;"></div>
           <div style="border-bottom:1px solid #000;margin-top:20px;"></div>`
    }
    </div>
    <div class="kp-body">And bind ourselves to comply honestly and faithfully with the above terms of settlement.</div>
    <div class="kp-body" style="margin-top:20px;">Entered this <strong>${_ord}</strong> day of <strong>${_mon}</strong>, ${_yr}</div>
   <table style="width:100%;margin-top:40px;font-size:11pt;">
  <tr>
    <td style="width:50%;text-align:center;padding-right:20px;">
      <div style="display:inline-block;text-align:center;">
        <div>${cn}</div>
        <div style="border-top:1px solid #000;padding-top:4px;">
          Complainant/s
        </div>
      </div>
    </td>
    <td style="width:50%;text-align:center;padding-left:20px;">
      <div style="display:inline-block;text-align:center;">
        <div>${rn}</div>
        <div style="border-top:1px solid #000;padding-top:4px;">
          Respondent/s
        </div>
      </div>
    </td>
  </tr>
</table>
    <div style="margin-top:30px;font-size:12pt;font-weight:bold;">ATTESTATION:</div>
    <div class="kp-body" style="margin-top:8px;">I hereby certify that the foregoing amicable settlement was entered into by the parties freely and voluntarily, after I had explained to them the nature and consequence of such settlement.</div>
    <div style="margin-top:44px;text-align:center;">
  <div style="display:inline-block;text-align:center;">
    <div style="padding:0 10px;">${getPBName()}</div>
    <div style="font-size:11pt;margin-top:4px;border-top:1px solid #000;">
      Punong Barangay
    </div>
  </div>
</div>
    <div class="kp-note">* Failure to repudiate the settlement within ten (10) days from date of settlement shall be deemed a waiver of the right to challenge on said grounds. (R.A. 7160, Sec. 416)</div>
    ${printFooter()}</div>
    <button onclick="exportAmicableSettlementDocx(${s.id})" style="background:#1a5c38;color:#fff;border:none;padding:10px 22px;border-radius:6px;font-size:.94rem;cursor:pointer;font-weight:700;">
      Export to Word (.docx)
    </button>`, `Form16-AmicableSettlement-${s.caseNo}`);
}

function printSettlementById(id) {
  fillDocDDs();
  setTimeout(() => {
    document.getElementById('cert-settle').value = id;
    const s = settlements.find(x => x.id === id);
    if (s) document.getElementById('cert-date').value = s.date || new Date().toISOString().split('T')[0];
    printCertificate();
  }, 100);
}

/* ════ FORM 17 — REPUDIATION ════ */
function printRepudiation() {
  const cid = document.getElementById('f17-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const ground = document.getElementById('f17-ground').value;
  const detail = document.getElementById('f17-detail').value.trim();
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const who = document.getElementById('f17-who').value;
  const pb = document.getElementById('f17-pb').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">REPUDIATION</div>
    <div class="kp-body" style="margin-top:10px;">I/WE hereby repudiate the settlement/agreement for arbitration on the ground that my/our consent was vitiated by:</div>
    <div class="kp-body" style="margin-left:20px;">
      <p style="margin:6px 0;">${ground === 'Fraud' ? '<strong>[&#10003;] Fraud.</strong>' : '[&nbsp;&nbsp;] Fraud.'} ${ground === 'Fraud' && detail ? `(${detail})` : '(State details) _______________________________________________'}</p>
      <p style="margin:6px 0;">${ground === 'Violence' ? '<strong>[&#10003;] Violence.</strong>' : '[&nbsp;&nbsp;] Violence.'} ${ground === 'Violence' && detail ? `(${detail})` : '(State details) _______________________________________________'}</p>
      <p style="margin:6px 0;">${ground === 'Intimidation' ? '<strong>[&#10003;] Intimidation.</strong>' : '[&nbsp;&nbsp;] Intimidation.'} ${ground === 'Intimidation' && detail ? `(${detail})` : '(State details) _______________________________________________'}</p>
    </div>
    <div class="kp-body" style="margin-top:14px;">${kpDateLine(document.getElementById('f17-date').value)}</div>
    ${kpTwoSig(who === 'complainant' ? cn : '', 'Complainant/s', who === 'respondent' ? rn : '', 'Respondent/s')}
    <div class="kp-body" style="margin-top:20px;">SUBSCRIBE AND SWORN TO before me this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span> at <span class="kp-line" style="min-width:200px;">${cfg.brgy}</span>.</div>
    ${kpSingleSig(pb, 'Punong Barangay / Pangkat Chairman / Member')}
    <div class="kp-body" style="margin-top:24px;">Received and filed this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpSingleSig('', 'Punong Barangay')}
    <div class="kp-note">* Failure to repudiate the settlement or the arbitration agreement within the time limits set (ten (10) days from date of settlement and five (5) days from the date of arbitration agreement) shall be deemed a waiver of the right to challenge on said grounds.</div>
    ${printFooter()}</div>`, `Form17-Repudiation-${c.caseNo}`);
}

/* ════ FORM 18 — NOTICE OF HEARING (COMPLAINANT FAILED TO APPEAR) ════ */
function printFailedAppearComp() {
  const cid = document.getElementById('f18-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const missed = fmtDate(document.getElementById('f18-missed').value);
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('f18-hdate').value);
  const { hourStr, ampm } = parseTimeParts(document.getElementById('f18-htime').value);
  const pb = document.getElementById('f18-pb').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title" style="font-size:11pt;">NOTICE OF HEARING<br>(RE: FAILURE TO APPEAR)</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${cn}</span><br><span style="padding-left:30px;font-style:italic;">Complainant/s</span></div>
    <div class="kp-body" style="margin-top:14px;">You are hereby required to appear before me/the Pangkat on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span>, at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock in the ${ampm} to explain why you failed to appear for mediation/conciliation scheduled on <span class="kp-line" style="min-width:160px;">${missed}</span> and why your complaint should not be dismissed, a certificate to bar the filing of your action in court/government office should not be issued, and contempt proceedings should not be initiated in court for willful failure or refusal to appear before the Punong Barangay/Pangkat ng Tagapagkasundo.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f18-date').value)}</div>
    ${kpSingleSig(pb, 'Punong Barangay / Pangkat Chairman')}
    <div class="kp-body" style="margin-top:30px;">Notified this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    <div style="margin-top:16px;font-size:11pt;font-weight:bold;">Complainant/s</div>
    ${kpTwoSig('', '', '', '')}${printFooter()}</div>`, `Form18-FailedAppearComp-${c.caseNo}`);
}

/* ════ FORM 19 — NOTICE OF HEARING (RESPONDENT FAILED TO APPEAR) ════ */
function printFailedAppearResp() {
  const cid = document.getElementById('f19-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const missed = fmtDate(document.getElementById('f19-missed').value);
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('f19-hdate').value);
  const { hourStr, ampm } = parseTimeParts(document.getElementById('f19-htime').value);
  const pb = document.getElementById('f19-pb').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title" style="font-size:11pt;">NOTICE OF HEARING<br>(RE: FAILURE TO APPEAR)</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${rn}</span><br><span style="padding-left:30px;font-style:italic;">Respondent/s</span></div>
    <div class="kp-body" style="margin-top:14px;">You are hereby required to appear before me/the Pangkat on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span>, at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock in the ${ampm} to explain why you failed to appear for mediation/conciliation scheduled on <span class="kp-line" style="min-width:160px;">${missed}</span> and why your counterclaim (if any) arising from the complaint should not be dismissed, a certificate to bar the filing of said counterclaim in court/government office should not be issued, and contempt proceedings should not be initiated in court for willful failure or refusal to appear before the Punong Barangay/Pangkat ng Tagapagkasundo.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f19-date').value)}</div>
    ${kpSingleSig(pb, 'Punong Barangay / Pangkat Chairman')}
    <div class="kp-body" style="margin-top:30px;">Notified this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    <div style="margin-top:16px;font-size:11pt;font-weight:bold;">Respondent/s</div>
    ${kpTwoSig('', '', '', '')}${printFooter()}</div>`, `Form19-FailedAppearResp-${c.caseNo}`);
}

/* ════ FORM 20/20-A/20-B — CFA ════ */
function printCFA() {
  const cid = document.getElementById('cfa-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const reason = document.getElementById('cfa-reason').value;
  const sec = document.getElementById('cfa-secretary').value || '______________________________';
  const cap = document.getElementById('cfa-captain').value || '______________________________';
  let items = [], label = 'Form20-B';
  if (reason === 'Failure to settle after mediation') { label = 'Form20-B'; items = ['Parties were called for mediation of the complaint but the mediation proceeding did not result to any amicable settlement;', 'The Punong Barangay set the meeting of the parties for the constitution of the Pangkat;', 'The respondent willfully failed or refused to appear without justifiable reason at the conciliation proceedings before the Pangkat; and', 'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.']; }
  else if (reason === 'Repudiation of settlement') { label = 'Form20'; items = ['There has been a personal confrontation between the parties before the Punong Barangay/Pangkat ng Tagapagkasundo;', 'An amicable settlement/agreement to arbitrate was reached;', 'The settlement/agreement has been repudiated in a statement sworn to before the Punong Barangay; and', 'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.']; }
  else if (reason === 'Failure to appear after two (2) summons') { label = 'Form20-A'; items = ['There has been a personal confrontation between the parties before the Punong Barangay but mediation failed;', 'The Pangkat ng Tagapagkasundo was constituted but the personal confrontation before the Pangkat likewise did not result into a settlement; and', 'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.']; }
  else if (reason === 'Waiver of the right to lupon conciliation') { label = 'Form20-A'; items = ['The parties were duly notified of the mediation proceedings;', 'One of the parties waived in writing his/her right to lupon conciliation; and', 'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.']; }
  else if (reason === 'Case not covered by lupon jurisdiction') { label = 'Form20'; items = ['The complaint filed in this case is not within the jurisdiction of the Lupon ng Tagapamayapa; and', 'Therefore, the corresponding complaint may now be filed directly in court/government office.']; }
  else { items = [`${reason}; and`, 'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.']; }
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">CERTIFICATION TO FILE ACTION</div>
    <div class="kp-body" style="margin-top:10px;">This is to certify that:</div>
    <div class="kp-indent">${items.map((it, i) => `<p style="margin:6px 0;">${i + 1}.&nbsp; ${it}</p>`).join('')}</div>
    <div class="kp-body" style="margin-top:16px;">${kpDateLine(document.getElementById('cfa-date').value)}</div>
    ${kpSingleSig(sec, 'Pangkat Secretary / Lupon Secretary')}
    ${kpAttestedBy(cap, `Pangkat Chairman / Lupon Chairman<br>${cfg.brgy}`)}
    ${printFooter()}</div>
    <button onclick="exportCFADocx(${c.id})" style="background:#1a5c38;color:#fff;border:none;padding:10px 22px;border-radius:6px;font-size:.94rem;cursor:pointer;font-weight:700;">
      Export to Word (.docx)
    </button>`, `${label}-CFA-${c.caseNo}`);
}

/* ════ FORM 21 — CERTIFICATION TO BAR ACTION ════ */
function printBarAction() {
  const cid = document.getElementById('f21-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const orderDate = fmtDate(document.getElementById('f21-order').value);
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const sec = document.getElementById('f21-sec').value.trim() || '______________________________';
  const chair = document.getElementById('f21-chair').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">CERTIFICATION TO BAR ACTION</div>
    <div class="kp-body" style="margin-top:10px;">This is to certify that the above-captioned case was dismissed pursuant to the Order dated <span class="kp-line" style="min-width:160px;">${orderDate}</span>, for complainant/s <span class="kp-line kp-line-lg">${cn}</span> willful failure or refusal to appear for hearing before the Punong Barangay/Pangkat ng Tagapagkasundo and therefore complainant/s is/are barred from filing an action in court/government office.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f21-date').value)}</div>
    ${kpSingleSig(sec, 'Lupon Secretary / Pangkat Secretary')}
    <div style="margin-top:16px;font-size:12pt;font-weight:bold;">Attested:</div>
    ${kpSingleSig(chair, 'Lupon Chairman / Pangkat Chairman')}
    <div class="kp-note">IMPORTANT: If Lupon Secretary makes the certification, the Lupon Chairman attests. If the Pangkat Secretary makes the certification, the Pangkat Chairman attests.</div>
    ${printFooter()}</div>`, `Form21-BarAction-${c.caseNo}`);
}

/* ════ FORM 22 — CERTIFICATION TO BAR COUNTERCLAIM ════ */
function printBarCounterclaim() {
  const cid = document.getElementById('f22-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const sec = document.getElementById('f22-sec').value.trim() || '______________________________';
  const chair = document.getElementById('f22-chair').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">CERTIFICATION TO BAR COUNTERCLAIM</div>
    <div class="kp-body" style="margin-top:10px;">This is to certify that after prior notice and hearing, the respondent/s <span class="kp-line kp-line-lg">${rn}</span> have been found to have willfully failed or refused to appear without justifiable reason before the Punong Barangay/Pangkat ng Tagapagkasundo and therefore respondent/s is/are barred from filing his/her counterclaim (if any) arising from the complaint in court/government office.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f22-date').value)}</div>
    ${kpSingleSig(sec, 'Lupon Secretary / Pangkat Secretary')}
    <div style="margin-top:16px;font-size:12pt;font-weight:bold;">Attested:</div>
    ${kpSingleSig(chair, 'Lupon Chairman / Pangkat Chairman')}
    <div class="kp-note">IMPORTANT: If Lupon Secretary makes the certification, the Lupon Chairman attests. If the Pangkat Secretary makes the certification, the Pangkat Chairman attests.</div>
    ${printFooter()}</div>`, `Form22-BarCounterclaim-${c.caseNo}`);
}

/* ════ FORM 23 — MOTION FOR EXECUTION ════ */
function printMotionExecution() {
  const cid = document.getElementById('f23-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const sd = fmtDate(document.getElementById('f23-settle').value);
  const filer = document.getElementById('f23-filer').value;
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">MOTION FOR EXECUTION</div>
    <div class="kp-body" style="margin-top:10px;">Complainant/s Respondent/s state as follows:</div>
    <div class="kp-indent">
      <p style="margin:6px 0;">1.&nbsp; On <span class="kp-line" style="min-width:160px;">${sd}</span> the parties in this case signed an amicable settlement/received the arbitration award rendered by the Lupon Chairman/Pangkat ng Tagapagkasundo;</p>
      <p style="margin:6px 0;">2.&nbsp; The period of ten (10) days from the above-stated date has expired without any of the parties filing a sworn statement of repudiation of the settlement before the Lupon Chairman or a petition for nullification of the arbitration award in court; and</p>
      <p style="margin:6px 0;">3.&nbsp; The amicable settlement/arbitration award is now final and executory.</p>
    </div>
    <div class="kp-body" style="margin-top:14px;">WHEREFORE, Complainant/s Respondent/s requests that the corresponding writ of execution be issued by the Lupon Chairman in this case.</div>
    <div class="kp-body" style="margin-top:14px;">${kpDateLine(document.getElementById('f23-date').value)}</div>
    ${kpTwoSig(filer === 'complainant' ? cn : '', 'Complainant/s', filer === 'respondent' ? rn : '', 'Respondent/s')}
    ${printFooter()}</div>`, `Form23-MotionExecution-${c.caseNo}`);
}

/* ════ FORM 24 — NOTICE OF HEARING (MOTION FOR EXECUTION) ════ */
function printNoticeExecution() {
  const cid = document.getElementById('f24-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const { dayStr, monthStr, yearStr2 } = parseDateParts(document.getElementById('f24-hdate').value);
  const { hourStr, ampm } = parseTimeParts(document.getElementById('f24-htime').value);
  const filerName = document.getElementById('f24-filer').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title" style="font-size:11pt;">NOTICE OF HEARING<br>(RE: MOTION FOR EXECUTION)</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${cn}</span> &nbsp;&nbsp;&nbsp;&nbsp; <span class="kp-line kp-line-lg">${rn}</span><br><span style="padding-left:30px;font-style:italic;">Complainant/s</span><span style="padding-left:100px;font-style:italic;">Respondent/s</span></div>
    <div class="kp-body" style="margin-top:14px;">You are hereby required to appear before me on the <span class="kp-line kp-line-sm">${dayStr}</span> day of <span class="kp-line">${monthStr}</span>, 20<span class="kp-line kp-line-sm">${yearStr2}</span> at <span class="kp-line kp-line-sm">${hourStr}</span> o'clock in the ${ampm} for the hearing of the motion for execution, copy of which is attached hereto, filed by <span class="kp-line" style="min-width:200px;">${filerName}</span>.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f24-date').value)}</div>
    ${kpSingleSig('', 'Punong Barangay / Lupon Chairman')}
    <div class="kp-body" style="margin-top:30px;">Notified this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpTwoSig('', '(Signature) — Complainant/s', '', '(Signature) — Respondent/s')}${printFooter()}</div>`, `Form24-NoticeExecution-${c.caseNo}`);
}

/* ════ FORM 25 — NOTICE OF EXECUTION ════ */
function printNoticeOfExecution() {
  const cid = document.getElementById('f25-case').value;
  const c = cases.find(x => x.id == cid); if (!c) { toast('Select a case.', '#b22222'); return; }
  const sid = document.getElementById('f25-settle').value;
  const s = settlements.find(x => x.id == sid);
  const sd = fmtDate(document.getElementById('f25-sdate').value);
  const ed = fmtDate(document.getElementById('f25-execdate').value);
  const et = document.getElementById('f25-exectime').value || '______';
  const ev = document.getElementById('f25-venue').value || `${cfg.brgy} Barangay Hall`;
  const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const terms = s ? s.terms : (document.getElementById('f25-terms').value || '______________________________');
  kpShow(`<div class="kp-wrap">${kpHeader()}${kpCaption(c)}
    <div class="kp-title">NOTICE OF EXECUTION</div>
    <div class="kp-body" style="margin-top:10px;">WHEREAS, on <span class="kp-line" style="min-width:160px;">${sd}</span>, an amicable settlement was signed by the parties in the above-entitled case (or an arbitration award rendered by the Punong Barangay/Pangkat ng Tagapagkasundo):</div>
    <div class="kp-body">WHEREAS, the terms and conditions of the settlement, the dispositive portion of the award, read:</div>
    <div class="kp-box" style="min-height:80px;">${terms}</div>
    <div class="kp-body">WHEREAS, neither party filed a sworn statement of repudiation of the settlement within ten (10) days from the date of settlement, and the same is now final and executory;</div>
    <div class="kp-body">NOW THEREFORE, you <span class="kp-line kp-line-lg">${cn}</span> and <span class="kp-line kp-line-lg">${rn}</span> are hereby notified that the writ of execution of the above-stated settlement/award will be effected on <span class="kp-line" style="min-width:160px;">${ed}</span> at <span class="kp-line kp-line-sm">${et}</span> o'clock, at <span class="kp-line" style="min-width:200px;">${ev}</span>.</div>
    <div class="kp-body">${kpDateLine(document.getElementById('f25-date').value)}</div>
    ${kpSingleSig('', 'Punong Barangay / Lupon Chairman')}${printFooter()}</div>`, `Form25-NoticeOfExecution-${c.caseNo}`);
}

/* ════ FORM 2 — APPOINTMENT ════ */
function printAppointment() {
  const mid = document.getElementById('f2-member').value;
  const m = members.find(x => x.id == mid); if (!m) { toast('Select a member.', '#b22222'); return; }
  const pb = document.getElementById('f2-pb').value.trim() || '______________________________';
  const sec = document.getElementById('f2-sec').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}
    <div style="text-align:right;font-size:11pt;margin-bottom:14px;">${fmtDate(document.getElementById('f2-date').value)}</div>
    <div class="kp-title">APPOINTMENT</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${m.name}</span></div>
    <div class="kp-body" style="margin-top:14px;">Pursuant to Chapter 7, Title One, Book III, Local Government Code of 1991 (Republic Act No. 7160), you are hereby appointed <strong>MEMBER of the Lupong Tagapamayapa</strong> of this Barangay effective upon taking your oath of office and until a new Lupon is constituted on the third year following your appointment.</div>
    ${kpSingleSig(pb, 'Punong Barangay')}
    <div style="margin-top:30px;font-size:12pt;font-weight:bold;">ATTESTED:</div>
    ${kpSingleSig(sec, 'Barangay Secretary')}${printFooter()}</div>`, `Form2-Appointment-${m.name.replace(/\s+/g, '-')}`);
}

/* ════ FORM 3 — NOTICE OF APPOINTMENT ════ */
function printNoticeAppointment() {
  const mid = document.getElementById('f3-member').value;
  const m = members.find(x => x.id == mid); if (!m) { toast('Select a member.', '#b22222'); return; }
  const oathDate = fmtDate(document.getElementById('f3-oath').value);
  const sec = document.getElementById('f3-sec').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}
    <div style="text-align:right;font-size:11pt;margin-bottom:14px;">${fmtDate(document.getElementById('f3-date').value)}</div>
    <div class="kp-body"><span class="kp-line kp-line-lg">${m.name}</span></div>
    <div class="kp-body" style="margin-top:4px;">Sir/Madam:</div>
    <div class="kp-title" style="font-size:12pt;text-align:left;letter-spacing:0;margin-top:8px;">NOTICE OF APPOINTMENT</div>
    <div class="kp-body">Please be informed that you have been appointed by the Punong Barangay as a <strong>MEMBER OF THE LUPONG TAGAPAMAYAPA</strong>, effective upon taking your oath of office, and until a new Lupon is constituted on the third year following your appointment. You may take your oath of office before the Punong Barangay on <span class="kp-line" style="min-width:200px;">${oathDate}</span>.</div>
    <div class="kp-body" style="margin-top:16px;">Very truly yours,</div>
    ${kpSingleSig(sec, 'Barangay Secretary')}${printFooter()}</div>`, `Form3-NoticeAppointment-${m.name.replace(/\s+/g, '-')}`);
}

/* ════ FORM 5 — OATH OF OFFICE ════ */
function printOathOfOffice() {
  const mid = document.getElementById('f5-member').value;
  const m = members.find(x => x.id == mid); if (!m) { toast('Select a member.', '#b22222'); return; }
  const pb = document.getElementById('f5-pb').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}
    <div class="kp-title">OATH OF OFFICE</div>
    <div class="kp-body" style="margin-top:14px;">Pursuant to Chapter 7, Title One, Book III, Local Government Code of 1991 (Republic Act 7160), I <span class="kp-line kp-line-lg">${m.name}</span>, being duly qualified and having been duly appointed <strong>MEMBER of the Lupong Tagapamayapa</strong> of this Barangay, do hereby solemnly swear (or affirm) that I will faithfully and conscientiously discharge to the best of my ability my duties and functions as such member and as member of the Pangkat ng Tagapagkasundo in which I may be chosen to serve; that I will bear true faith and allegiance to the Republic of the Philippines; that I will support and defend its Constitution and obey the laws, legal orders and decrees promulgated by its duly constituted authorities; and that I voluntarily impose upon myself this obligation without any mental reservation or purpose of evasion.</div>
    <div class="kp-body" style="margin-top:14px;font-weight:bold;">SO HELP ME GOD.</div>
    <div class="kp-body" style="font-size:10pt;font-style:italic;">(In case of affirmation the last sentence will be omitted.)</div>
    ${kpSingleSig(m.name, 'Member')}
    <div class="kp-body" style="margin-top:30px;">SUBSCRIBED AND SWORN TO (or affirmed) before me this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpSingleSig(pb, 'Punong Barangay')}${printFooter()}</div>`, `Form5-OathOfOffice-${m.name.replace(/\s+/g, '-')}`);
}

/* ════ FORM 6 — WITHDRAWAL OF APPOINTMENT ════ */
function printWithdrawal() {
  const mid = document.getElementById('f6-member').value;
  const m = members.find(x => x.id == mid); if (!m) { toast('Select a member.', '#b22222'); return; }
  const ground = document.getElementById('f6-ground').value;
  const detail = document.getElementById('f6-detail').value.trim();
  const pb = document.getElementById('f6-pb').value.trim() || '______________________________';
  kpShow(`<div class="kp-wrap">${kpHeader()}
    <div class="kp-title">WITHDRAWAL OF APPOINTMENT</div>
    <div class="kp-body">TO: <span class="kp-line kp-line-lg">${m.name}</span></div>
    <div class="kp-body" style="margin-top:14px;">After due hearing and with the concurrence of a majority of all the Lupong Tagapamayapa members of this Barangay, your appointment as member thereof is hereby withdrawn effective upon receipt hereof, on the following ground/s:</div>
    <div class="kp-body" style="margin-left:20px;">
      <p style="margin:6px 0;">${ground === 'incapacity' ? `<strong>[&#10003;] incapacity to discharge the duties of your office</strong> as shown by ${detail || '___________________'}` : '[&nbsp;&nbsp;] incapacity to discharge the duties of your office as shown by ___________________'}</p>
      <p style="margin:6px 0;">${ground === 'unsuitability' ? `<strong>[&#10003;] unsuitability by reason of</strong> ${detail || '___________________'}` : '[&nbsp;&nbsp;] unsuitability by reason of ___________________'}</p>
    </div>
    <div class="kp-body" style="margin-top:14px;">${kpDateLine(document.getElementById('f6-date').value)}</div>
    ${kpSingleSig(pb, 'Punong Barangay / Lupon Chairman')}
    <div style="margin-top:24px;font-size:11pt;font-weight:bold;">CONFORME (Signatures of concurring Lupon Members):</div>
    <table style="width:100%;margin-top:12px;font-size:11pt;">
      <tr><td style="width:50%;padding-bottom:20px;">1. <span class="kp-line" style="min-width:180px;"></span></td><td style="padding-bottom:20px;">2. <span class="kp-line" style="min-width:180px;"></span></td></tr>
      <tr><td style="padding-bottom:20px;">3. <span class="kp-line" style="min-width:180px;"></span></td><td style="padding-bottom:20px;">4. <span class="kp-line" style="min-width:180px;"></span></td></tr>
      <tr><td style="padding-bottom:20px;">5. <span class="kp-line" style="min-width:180px;"></span></td><td style="padding-bottom:20px;">6. <span class="kp-line" style="min-width:180px;"></span></td></tr>
      <tr><td style="padding-bottom:20px;">7. <span class="kp-line" style="min-width:180px;"></span></td><td style="padding-bottom:20px;">8. <span class="kp-line" style="min-width:180px;"></span></td></tr>
      <tr><td style="padding-bottom:20px;">9. <span class="kp-line" style="min-width:180px;"></span></td><td style="padding-bottom:20px;">10. <span class="kp-line" style="min-width:180px;"></span></td></tr>
      <tr><td colspan="2" style="padding-bottom:20px;">11. <span class="kp-line" style="min-width:180px;"></span></td></tr>
    </table>
    <div class="kp-body" style="margin-top:20px;">Received this <span class="kp-line kp-line-sm"></span> day of <span class="kp-line"></span>, 20<span class="kp-line kp-line-sm"></span>.</div>
    ${kpSingleSig('', '(Signature of withdrawn member)')}
    <div class="kp-note">NOTE: The members of the Lupon conforming to the withdrawal must personally affix their signatures or thumb marks. The withdrawal must be conformed to by more than one-half of the total number of members of the Lupon including the Punong Barangay and the member concerned.</div>
    ${printFooter()}</div>`, `Form6-Withdrawal-${m.name.replace(/\s+/g, '-')}`);
}

/* ════ FORM 1 — NOTICE TO CONSTITUTE THE LUPON ════ */
function printNoticeConstitute() {
  const date = document.getElementById('f1-date').value;
  const deadline = fmtDate(document.getElementById('f1-deadline').value);
  const pb = document.getElementById('f1-pb').value.trim() || '______________________________';
  const nominees = [];
  for (let i = 1; i <= 25; i++) {
    const v = document.getElementById('f1-n' + i);
    nominees.push(v ? v.value.trim() : '');
  }

  // Two-column nominee table.
  // Each name is just the text (or a short underline if blank).
  // No stretched full-width underlines — width follows content.
  const nameTd = (val) => {
    const name = val
      ? `<strong>${val}</strong>`
      : '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>';
    return `<td style="font-size:11pt;vertical-align:bottom;padding:1px 20px 1px 4px;
                       white-space:nowrap;line-height:1.2;">${name}</td>`;
  };

  let rows = '';
  for (let i = 0; i < 13; i++) {
    const lNum = i + 1;
    const rNum = i + 14;
    const hasR = rNum <= 25;

    rows += `<tr style="height:20px;">
      <td style="font-size:11pt;vertical-align:bottom;padding:1px 6px 1px 0;
                 white-space:nowrap;line-height:1.2;">${lNum}.</td>
      ${nameTd(nominees[i])}
      <td style="width:20px;"></td>
      ${hasR
        ? `<td style="font-size:11pt;vertical-align:bottom;padding:1px 6px 1px 0;
                      white-space:nowrap;line-height:1.2;">${rNum}.</td>
           ${nameTd(nominees[i + 13])}`
        : `<td></td><td></td>`
      }
    </tr>`;
  }

  kpShow(`
    <style>@page { size: 8.5in 14in; margin: 1in; }</style>
    <div class="kp-wrap">
      ${kpHeader()}
      <div style="text-align:right;font-size:11pt;margin-bottom:14px;">${fmtDate(date)}</div>
      <div class="kp-title">NOTICE TO CONSTITUTE THE LUPON</div>
      <div class="kp-body" style="font-weight:bold;">To All Barangay Members and All Other Persons Concerned:</div>
      <div class="kp-body" style="margin-top:10px;">In compliance with Section 1 (a), Chapter, Title One, Book III, Local Government Code of 1991 (Republic Act 7160), of the Katarungang Pambarangay Law, notice is hereby given to constitute the Lupong Tagapamayapa of this Barangay. The persons I am considering for appointment are the following:</div>
      <table style="width:100%;border-collapse:collapse;border-spacing:0;margin:14px 0 18px;table-layout:fixed;">${rows}</table>
      <div class="kp-body">They have been chosen on the basis of their suitability for the task of conciliation considering their integrity, impartiality, independence of mind, sense of fairness and reputation for probity in view of their age, social standing in the community, tact, patience, resourcefulness, flexibility, open mindedness and other relevant factors. The law provides that only those actually residing or working in the barangay who are not expressly disqualified by law are qualified to be appointed as Lupon members.</div>
      <div class="kp-body">All persons are hereby enjoined to immediately inform me of their opposition to or endorsement of any or all proposed members or recommend to me other persons not included on the list but not later than the <span style="display:inline-block;border-bottom:1px solid #000;min-width:220px;font-weight:bold;">${deadline}</span> (the last day for posting this notice).</div>
      ${kpSingleSig(pb, 'Punong Barangay')}
      <div class="kp-note">IMPORTANT: This notice is required to be posted in three (3) conspicuous places in the barangay for at least three (3) weeks.<br>WARNING: Tearing or defacing this notice shall be subject to punishment according to law.</div>
    </div>
  `, 'Form1-NoticeConstitute', 'legal');
}

/* ════ FORM 4 — LIST OF APPOINTED LUPON MEMBERS ════ */
function printListLuponMembers() {
  const pb = document.getElementById('f4-pb').value.trim() || '______________________________';
  const sec = document.getElementById('f4-sec').value.trim() || '______________________________';

  // Use existing members array, or blank slots if none
  const slots = [];
  for (let i = 0; i < 20; i++) {
    slots.push(members[i] ? members[i].name : '');
  }

  let rows = '';
  for (let i = 0; i < 10; i++) {
    const left = `${i + 1}. ${slots[i] ? `<strong>${slots[i]}</strong>` : '<span class="kp-line" style="min-width:180px;"></span>'}`;
    const right = `${i + 11}. ${slots[i + 10] ? `<strong>${slots[i + 10]}</strong>` : '<span class="kp-line" style="min-width:180px;"></span>'}`;
    rows += `<tr><td style="padding:4px 10px 4px 0;font-size:11pt;width:50%;">${left}</td><td style="padding:4px 0;font-size:11pt;">${right}</td></tr>`;
  }

  kpShow(`<div class="kp-wrap">${kpHeader()}
    <div class="kp-title">LIST OF APPOINTED LUPON MEMBERS</div>
    <div class="kp-body">Listed hereunder are the duly appointed members of the Lupong Tagapamayapa in this Barangay who shall serve as such upon taking their oath of office and until a new Lupon is constituted on the third year following their appointment.</div>
    <table style="width:100%;margin:10px 0 18px;">${rows}</table>
    ${kpSingleSig(pb, 'Punong Barangay')}
    <div style="margin-top:24px;font-size:12pt;font-weight:bold;">Attested:</div>
    ${kpSingleSig(sec, 'Barangay / Lupon Secretary')}
    <div class="kp-note">IMPORTANT: This list shall be posted in three (3) conspicuous places in the barangay for the duration of the terms of office of those named above.<br>WARNING: Tearing or defacing this notice shall be subject to punishment according to law.</div>
    ${printFooter()}</div>`, 'Form4-ListLuponMembers');
}