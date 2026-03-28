/**
 * js/tracer.js
 * ──────────────────────────────────────────────────────
 * Tracer (Case Docket Record) — print preview and
 * Word export of the official tracer form.
 * ──────────────────────────────────────────────────────
 */


/* ════════════════════════════════════
   PRINT / EXPORT
════════════════════════════════════ */

/** Validate fields and show the tracer in the print overlay. */
function printTracer() {
  const caseNo = gv('tr-caseno');
  const cname  = gv('tr-cname');
  const rname  = gv('tr-rname');

  if (!caseNo || !cname || !rname) {
    toast('Fill in Case No., Complainant, and Respondent.', '#b22222');
    return;
  }

  showPrint(`
    <style>
      @page { size: 8.5in 14in; margin: 0.7in; }
      ${tracerCSS()}
    </style>
    <div id="tracer-doc">
      ${tracerBody(caseNo, cname, rname)}
    </div>
    ${printBtns()}
  `);
}

/** Clear all Tracer form fields. */
function clearTracer() {
  const ids = [
    'tr-caseno', 'tr-or', 'tr-nature', 'tr-filed', 'tr-sumdate',
    'tr-sumtime', 'tr-filedtime', 'tr-sumby', 'tr-sumrel',
    'tr-cname', 'tr-caddr', 'tr-ctel',
    'tr-rname', 'tr-raddr', 'tr-rtel',
    'tr-days', 'tr-pchair', 'tr-psec', 'tr-pmem',
    'tr-transmit', 'tr-recvd',
    'm1-date', 'm1-time', 'm1-disp', 'm1-rem',
    'm2-date', 'm2-time', 'm2-disp', 'm2-rem',
    'm3-date', 'm3-time', 'm3-disp', 'm3-rem',
    'c1-date', 'c1-time', 'c1-disp', 'c1-rem',
    'c2-date', 'c2-time', 'c2-disp', 'c2-rem',
    'c3-date', 'c3-time', 'c3-disp', 'c3-rem'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.tagName === 'SELECT' ? el.selectedIndex = 0 : el.value = '';
    }
  });
  toast('🗑️ Tracer cleared.');
}

/** Export the tracer as a .doc Word file. */
function exportTracerWord() {
  const caseNo = gv('tr-caseno');
  const cname  = gv('tr-cname');
  const rname  = gv('tr-rname');

  if (!caseNo || !cname || !rname) {
    toast('Fill in Case No., Complainant, and Respondent.', '#b22222');
    return;
  }

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Tracer - ${caseNo}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page { size: 8.5in 14in; margin: 0.7in; }
        ${tracerCSS()}
      </style>
    </head>
    <body>
      <div id="tracer-doc">
        ${tracerBody(caseNo, cname, rname)}
      </div>
    </body>
    </html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Tracer-${caseNo}-${cname.split(' ')[0]}-vs-${rname.split(' ')[0]}.doc`;
  a.click();
  URL.revokeObjectURL(url);
  toast('📄 Tracer exported to Word!');
}


/* ════════════════════════════════════
   TRACER CSS
════════════════════════════════════ */

/** Returns a CSS string scoped to #tracer-doc for print output. */
function tracerCSS() {
  return `
    #tracer-doc * { box-sizing: border-box; margin: 0; padding: 0; }

    #tracer-doc {
      font-family: Calibri, Arial, sans-serif;
      font-size: 10pt;
      color: #000;
      width: 100%;
    }

    /* Header */
    #tracer-doc .hdr {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    #tracer-doc .hdr-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    #tracer-doc .hdr-logo { width: 70px; height: 70px; flex-shrink: 0; }
    #tracer-doc .hdr-logo img { width: 70px; height: 70px; }

    #tracer-doc .hdr-title .t1 {
      font-size: 20pt;
      font-weight: 900;
      color: #000;
      line-height: 1.1;
      display: block;
    }
    #tracer-doc .hdr-title .t3 {
      font-size: 10pt;
      color: #000;
      font-style: italic;
      display: block;
    }

    /* Blue case info box */
    #tracer-doc .blue-box {
      background: #00BFFF;
      border-radius: 20px;
      padding: 14px 20px;
      min-width: 220px;
      min-height: 180px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #tracer-doc .blue-box .bn { font-size: 10pt; color: #000; text-decoration: none; }
#tracer-doc .blue-box .bn strong { font-size: 11pt; font-weight: 700; text-decoration: none; }
#tracer-doc .blue-box .bf { font-size: 10pt; color: #000; text-decoration: none; }
#tracer-doc .blue-box .bf strong { font-size: 11pt; font-weight: 700; text-decoration: none; }
    #tracer-doc .blue-box .bp {
      font-size: 14pt;
      font-weight: 900;
      color: #000;
      line-height: 2;
      margin-top: 6px;
    }
    #tracer-doc .blue-box .bv { font-size: 11pt; font-weight: 700; color: #000; }

    /* Table of Contents section */
    #tracer-doc .top-section { display: flex; gap: 10px; margin-bottom: 8px; }
    #tracer-doc .toc-box {
      border: 1.5px solid #000;
      padding: 10px 14px;
      flex: 1;
      min-height: 220px;
    }
    #tracer-doc .toc-title {
      font-size: 12pt;
      font-weight: 900;
      color: #8B0000;
      text-align: center;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      font-style: italic;
      display: block;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #tracer-doc .toc-sub {
      font-size: 10pt;
      font-weight: 700;
      display: block;
      margin-bottom: 4px;
    }
    #tracer-doc .toc-item {
      font-size: 9.5pt;
      display: flex;
      gap: 2px;
      margin-bottom: 3px;
      align-items: baseline;
    }
    #tracer-doc .toc-dots {
      flex: 1;
      border-bottom: 1px dashed #000;
      margin: 0 3px 2px;
    }
    #tracer-doc .toc-spare {
      flex: 1;
      border: 1.5px solid #000;
      min-height: 220px;
    }

    /* TRACER bar */
    #tracer-doc .tracer-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1.5px solid #000;
      border-bottom: none;
      padding: 4px 10px;
    }
    #tracer-doc .t-title {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: 0.15em;
    }
    #tracer-doc .or { font-size: 10pt; }
    #tracer-doc .or strong { font-size: 11pt; }

    /* Data tables */
    #tracer-doc table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    #tracer-doc table th {
      background: #fff;
      padding: 3px 6px;
      font-weight: 700;
      font-size: 9pt;
      border: 1px solid #000;
      text-align: center;
      text-transform: uppercase;
    }
    #tracer-doc table td {
      border: 1px solid #000;
      padding: 3px 6px;
      vertical-align: middle;
    }
    #tracer-doc table td.lbl { font-weight: 700; white-space: nowrap; }

    #tracer-doc .sec-bar {
      font-weight: 700;
      font-size: 10pt;
      text-align: center;
      letter-spacing: 0.1em;
      padding: 3px 6px;
      border: 1px solid #000;
      border-top: none;
    }
    #tracer-doc .pangkat-cell {
      font-size: 9pt;
      font-weight: 700;
      line-height: 2.2;
      vertical-align: top;
      padding: 6px 8px;
    }
  `;
}


/* ════════════════════════════════════
   TRACER BODY HTML
════════════════════════════════════ */

/** Builds the full tracer document HTML body. */
function tracerBody(caseNo, cname, rname) {

  /** Mediation row (1st/2nd/3rd) — rightmost cell spans 3 rows on first. */
  function mRow(seq, dateId, timeId, dispId, remId, firstRow) {
    const d    = gv(dateId), t = gv(timeId);
    const disp = gv(dispId), rem = gv(remId);
    const dc   = disp === 'Settled' ? 'color:#1a5c38;font-weight:700;' : '';

    const daysCell = firstRow
      ? `<td style="border:1px solid #000;padding:4px 6px;text-align:center;
                    font-weight:900;font-size:14pt;vertical-align:middle;"
             rowspan="3">
           ${gv('tr-days') || '&nbsp;'}
         </td>`
      : '';

    return `
      <tr>
        <td class="lbl" style="text-align:center;background:#f5f0e8;">${seq}</td>
        <td style="text-align:center;">${fmtPrintDate(d)}</td>
        <td style="text-align:center;">${fmtTime(t)}</td>
        <td style="text-align:center;${dc}">${disp || '&nbsp;'}</td>
        <td>${rem || '&nbsp;'}</td>
        ${daysCell}
      </tr>`;
  }

  /** Conciliation row (1st/2nd/Ext.) */
  function cRow(seq, dateId, timeId, dispId, remId) {
    const d    = gv(dateId), t = gv(timeId);
    const disp = gv(dispId), rem = gv(remId);
    const dc   = (disp === 'Settled' || disp === 'CFA Issued')
                   ? 'color:#1a5c38;font-weight:700;' : '';

    return `
      <tr>
        <td class="lbl" style="text-align:center;background:#f5f0e8;">${seq}</td>
        <td style="text-align:center;">${fmtPrintDate(d)}</td>
        <td style="text-align:center;">${fmtTime(t)}</td>
        <td colspan="2" style="${dc}">${disp || '&nbsp;'}</td>
      </tr>`;
  }

  return `
    <!-- ── Header ── -->
    <div class="hdr">
      <div class="hdr-left">
        <div class="hdr-logo">
          <img src="assets/logo.png" width="70" height="70"
               onerror="this.style.display='none'">
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex:1;">
          <div class="hdr-title">
            <span class="t1">LUPONG TAGAPAMAYAPA</span>
            <span class="t3">${cfg.brgy}</span>
          </div>
          <div style="flex-shrink:0;">
            <img src="assets/magandang-gensan-logo.png" width="100" height="100"
                 style="display:block;" onerror="this.style.display='none'">
          </div>
        </div>
      </div>
      <div class="blue-box">
        <div class="bn">Barangay case no. <strong>${caseNo}</strong></div>
        <div class="bf">For: <strong>${gv('tr-nature').toUpperCase()}</strong></div>
        <div class="bp">
          ${cname.toUpperCase()}<br>
          <span class="bv">VS.</span><br>
          ${rname}
        </div>
      </div>
    </div>

    <!-- ── Table of Contents ── -->
    <div class="top-section">
      <div class="toc-box">
        <span class="toc-title">TABLE OF CONTENTS</span>
        <span class="toc-sub">MEDIATION (PB)</span>
        <div class="toc-item">Complaint form<span class="toc-dots"></span>1</div>
        <div class="toc-item">1st Notice of hearing to Complainant<span class="toc-dots"></span>2</div>
        <div class="toc-item">Summon for respondent<span class="toc-dots"></span>3</div>
        <div class="toc-item">Minutes of the Proceedings<span class="toc-dots"></span>4</div>
        <div class="toc-item">Amicable settlement<span class="toc-dots"></span>5</div>
      </div>
      <div class="toc-spare">&nbsp;</div>
    </div>

    <!-- ── TRACER header bar ── -->
    <div class="tracer-hdr">
      <span class="t-title">TRACER</span>
      <span class="or">O.R.#: <strong>${gv('tr-or') || '___________'}</strong></span>
    </div>

    <!-- ── Parties ── -->
    <table>
      <tr>
        <th colspan="3">COMPLAINANT/S</th>
        <th colspan="3">RESPONDENT/S</th>
      </tr>
      <tr>
        <td class="lbl">Name:</td>
        <td colspan="2"><strong>${cname}</strong></td>
        <td class="lbl">Name:</td>
        <td colspan="2"><strong>${rname}</strong></td>
      </tr>
      <tr>
        <td class="lbl">Add:</td>
        <td colspan="2">${gv('tr-caddr') || '&nbsp;'}</td>
        <td class="lbl">Add:</td>
        <td colspan="2">${gv('tr-raddr') || '&nbsp;'}</td>
      </tr>
      <tr>
        <td class="lbl">CP no.</td>
        <td colspan="2">${gv('tr-ctel') || '&nbsp;'}</td>
        <td class="lbl">CP no.</td>
        <td colspan="2">${gv('tr-rtel') || '&nbsp;'}</td>
      </tr>
      <tr>
        <td class="lbl">Date Filed:</td>
        <td colspan="2"><strong>${fmtPrintDate(gv('tr-filed'))}</strong></td>
        <td class="lbl">Date of Summon:</td>
        <td colspan="2"><strong>${fmtPrintDate(gv('tr-sumdate'))}</strong></td>
      </tr>
      <tr>
        <td class="lbl">Time:</td>
        <td colspan="2">${fmtTime(gv('tr-filedtime'))}</td>
        <td class="lbl">Time:</td>
        <td colspan="2">${fmtTime(gv('tr-sumtime'))}</td>
      </tr>
      <tr>
        <td class="lbl">Summon Received by:</td>
        <td colspan="2">${gv('tr-sumby') || '&nbsp;'}</td>
        <td class="lbl">Relation to Respondent:</td>
        <td colspan="2">${gv('tr-sumrel') || '&nbsp;'}</td>
      </tr>
    </table>

    <!-- ── Mediation section ── -->
    <div class="sec-bar">MEDIATION</div>
    <table style="border-top:none;">
      <tr>
        <th style="width:32px;">&nbsp;</th>
        <th>Schedule of Hearing</th>
        <th>Time of Hearing</th>
        <th>DISPOSITION</th>
        <th>REMARKS</th>
        <th style="width:55px;font-size:8pt;line-height:1.3;">
          NO. OF DAYS IN BRGY.
        </th>
      </tr>
      ${mRow('1st', 'm1-date', 'm1-time', 'm1-disp', 'm1-rem', true)}
      ${mRow('2nd', 'm2-date', 'm2-time', 'm2-disp', 'm2-rem', false)}
      ${mRow('3rd', 'm3-date', 'm3-time', 'm3-disp', 'm3-rem', false)}
    </table>

    <!-- ── Conciliation section ── -->
    <div class="sec-bar">CONCILIATION</div>
    <table style="border-top:none;">
      <tr>
        <th style="width:32px;">&nbsp;</th>
        <th>Schedule of Hearing</th>
        <th>Time of Hearing</th>
        <th colspan="2">&nbsp;</th>
        <th rowspan="4" class="pangkat-cell"
            style="border:1px solid #000;width:120px;">
          PANGKAT NG TAGAPAGKASUNDO<br><br>
          Chairman:
          ${gv('tr-pchair')
            ? '<u>' + gv('tr-pchair') + '</u>'
            : '_______________'}<br><br>
          Secretary:
          ${gv('tr-psec')
            ? '<u>' + gv('tr-psec') + '</u>'
            : '_______________'}<br><br>
          Member:
          ${gv('tr-pmem')
            ? '<u>' + gv('tr-pmem') + '</u>'
            : '_______________'}
        </th>
      </tr>
      ${cRow('1st', 'c1-date', 'c1-time', 'c1-disp', 'c1-rem')}
      ${cRow('2nd', 'c2-date', 'c2-time', 'c2-disp', 'c2-rem')}
      ${cRow('Ext.', 'c3-date', 'c3-time', 'c3-disp', 'c3-rem')}
      <tr>
        <td colspan="3" style="padding:4px 6px;font-size:9.5pt;">
          <strong>Date of Transmittal of Settlement to court:</strong>
          &nbsp;${fmtPrintDate(gv('tr-transmit'))}
        </td>
        <td colspan="2" style="padding:4px 6px;font-size:9.5pt;">
          <strong>Received:</strong> &nbsp;${gv('tr-recvd') || '&nbsp;'}
        </td>
      </tr>
    </table>
  `;
}