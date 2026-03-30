/**
 * js/wordexport.js
 * ──────────────────────────────────────────────────────
 * Native .docx export for KP forms using the docx library.
 * Requires js/docx.bundle.js to be loaded first.
 * ──────────────────────────────────────────────────────
 */

/* ════════════════════════════════════
   HELPERS
════════════════════════════════════ */

const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, VerticalAlign, ShadingType,
    ImageRun, PageOrientation, UnderlineType, Header, Footer,
    TableLayoutType
} = docx;

// Page dimensions (Letter, 1" margins)
const PAGE_W = 12240;  // 8.5in in DXA
const PAGE_H = 15840;  // 11in in DXA
const MARGIN = 1440;   // 1in
const CONTENT_W = PAGE_W - MARGIN * 2;  // 9360 DXA

// Font
const FONT = 'Times New Roman';

// No borders (for layout tables)
const NO_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

// Standard border
const STD_BORDER = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

// Only bottom border (signature line)
const BOTTOM_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

/** Helper: plain paragraph */
function para(text, opts = {}) {
    return new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { before: opts.before || 0, after: opts.after || 0 },
        children: [new TextRun({
            text,
            font: FONT,
            size: opts.size || 24,   // 12pt default
            bold: opts.bold || false,
            italics: opts.italic || false,
            underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
        })],
    });
}

/** Helper: empty spacer paragraph */
function spacer(pts = 6) {
    return new Paragraph({
        spacing: { before: 0, after: pts * 20 },
        children: [new TextRun({ text: '', font: FONT, size: 24 })],
    });
}

/** Helper: mixed-run paragraph */
function mixedPara(runs, opts = {}) {
    return new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { before: opts.before || 0, after: opts.after || 80 },
        children: runs.map(r => new TextRun({
            text: r.text,
            font: FONT,
            size: r.size || opts.size || 24,
            bold: r.bold || false,
            italics: r.italic || false,
            underline: r.underline ? { type: UnderlineType.SINGLE } : undefined,
        })),
    });
}

/** Ordinal suffix: 1→1st, 2→2nd, 23→23rd */
function ordinal(n) {
    if (!n) return '____';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Format date string → { day, ordDay, month, year } */
function parseDt(dateStr) {
    if (!dateStr) return { day: '___', ordDay: '______', month: '___________', year: '____' };
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate();
    return {
        day: String(day),
        ordDay: ordinal(day),
        month: d.toLocaleString('en-PH', { month: 'long' }),
        year: String(d.getFullYear()),
    };
}

/** Fetch image as Uint8Array for ImageRun */
async function fetchImageBytes(src) {
    try {
        const resp = await fetch(src);
        const buf = await resp.arrayBuffer();
        return new Uint8Array(buf);
    } catch { return null; }
}

/** Build the three-column header table (logo | text | logo) */
async function buildKpHeader() {
    const brgyBytes = await fetchImageBytes('assets/logo.png');
    const gensanBytes = await fetchImageBytes('assets/magandang-gensan-logo.png');

    const logoSize = 914400;  // ~60pt in EMU (914400 EMU = 1 inch)

    const brgyImg = brgyBytes ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: brgyBytes, transformation: { width: 60, height: 60 }, type: 'png' })],
    }) : para('', { align: AlignmentType.CENTER });

    const gensanImg = gensanBytes ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: gensanBytes, transformation: { width: 60, height: 60 }, type: 'png' })],
    }) : para('', { align: AlignmentType.CENTER });

    const centerText = [
        para('Republic of the Philippines', { align: AlignmentType.CENTER, size: 20 }),
        para(`Province of 1st District of ${cfg.prov}`, { align: AlignmentType.CENTER, size: 20 }),
        para(`CITY OF ${cfg.muni}`, { align: AlignmentType.CENTER, size: 20 }),
        para(cfg.brgy.toUpperCase(), { align: AlignmentType.CENTER, size: 24, bold: true }),
        spacer(4),
        para('OFFICE OF THE LUPONG TAGAPAMAYAPA', { align: AlignmentType.CENTER, size: 22, bold: true }),
    ];

    return new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1200, 6960, 1200],
        borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE }
        },
        rows: [new TableRow({
            children: [
                new TableCell({
                    borders: NO_BORDER,
                    width: { size: 1200, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [brgyImg],
                }),
                new TableCell({
                    borders: NO_BORDER,
                    width: { size: 6960, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    children: centerText,
                }),
                new TableCell({
                    borders: NO_BORDER,
                    width: { size: 1200, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [gensanImg],
                }),
            ],
        })],
    });
}

/** Build the caption table (parties left | case info right) */
function buildCaption(c) {
    const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
    const rn = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;

    const leftChildren = [
        para(cn, { size: 22 }),
        c.comp.addr ? para(c.comp.addr, { size: 20 }) : null,
        para('Complainant/s', { size: 22, italic: true }),
        para('-against-', { align: AlignmentType.CENTER, size: 22, italic: true }),
        para(rn, { size: 22 }),
        c.resp.addr ? para(c.resp.addr, { size: 20 }) : null,
        para('Respondent/s', { size: 22, italic: true }),
    ].filter(Boolean);

    const rightChildren = [
        mixedPara([
            { text: 'Barangay Case No. ' },
            { text: c.caseNo, bold: true },
        ], { size: 22 }),
        mixedPara([
            { text: 'For: ' },
            { text: c.nature, bold: true },
        ], { size: 22 }),
    ];

    return new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [5200, 4160],
        borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
        },
        rows: [new TableRow({
            children: [
                new TableCell({ borders: NO_BORDER, width: { size: 5200, type: WidthType.DXA }, children: leftChildren }),
                new TableCell({ borders: NO_BORDER, width: { size: 4160, type: WidthType.DXA }, children: rightChildren }),
            ],
        })],
    });
}

/** Horizontal rule */
function hRule() {
    return new Paragraph({
        // border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: '' })],
    });
}

/** Signature line with name above and label below */
function sigLine(name, label, align = AlignmentType.CENTER) {
    return [
        spacer(20),
        new Paragraph({
            alignment: align,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: name || '', font: FONT, size: 22, underline: { type: UnderlineType.SINGLE } })],
        }),
        para(label, { align, size: 22 }),
    ];
}

/** Two-column signature block */
function twoSig(n1, l1, n2, l2) {
    return new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [4500, 4860],
        borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders: NO_BORDER,
                        width: { size: 4500, type: WidthType.DXA },
                        children: [
                            spacer(20),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: n1 || '', font: FONT, size: 22, underline: { type: UnderlineType.SINGLE } })],
                            }),
                            para(l1, { align: AlignmentType.CENTER, size: 22 }),
                        ],
                    }),
                    new TableCell({
                        borders: NO_BORDER,
                        width: { size: 4860, type: WidthType.DXA },
                        children: [
                            spacer(20),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
                                spacing: { before: 0, after: 40 },
                                children: [new TextRun({ text: n2 || '', font: FONT, size: 22 })],
                            }),
                            para(l2, { align: AlignmentType.CENTER, size: 22 }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

/** Blank lines for handwriting */
function blankLines(count = 5) {
    return Array.from({ length: count }, () =>
        new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 } },
            spacing: { before: 0, after: 200 },
            children: [new TextRun({ text: '', font: FONT, size: 24 })],
        })
    );
}

/** Save the docx file */
async function saveDocx(doc, filename) {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.docx';
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported to Word (.docx)!');
}


/* ════════════════════════════════════
   FORM 7 — COMPLAINT
════════════════════════════════════ */

async function exportComplaintDocx(caseId) {
    const c = cases.find(x => x.id === caseId);
    if (!c) { toast('Case not found.', '#b22222'); return; }

    const cn = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
    const dt = parseDt(c.dateFiled);
    const pb = members.find(m => m.role === 'Punong Barangay (Chairperson)');
    const pbName = pb ? pb.name.toUpperCase() : '';

    const header = await buildKpHeader();
    const caption = buildCaption(c);

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: PAGE_W, height: PAGE_H },
                    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
                },
            },
            children: [
                // Header
                header,
                spacer(10),

                // Caption
                caption,
                hRule(),

                // Title
                para('C O M P L A I N T', {
                    align: AlignmentType.CENTER,
                    bold: true,
                    size: 26,
                    before: 80,
                    after: 80,
                }),

                // Body 1
                para(
                    'I/WE hereby complain against above named respondent/s for violating my/our rights and interests in the following manner:',
                    { size: 24, after: 60 }
                ),

                // Description — filled text or blank lines
                ...(c.desc
                    ? [para(c.desc, { size: 24, after: 100 })]
                    : blankLines(5)
                ),

                spacer(6),

                // Body 2
                para(
                    'THEREFORE, I/WE pray that the following relief/s be granted to me/us in accordance with law and/or equity.',
                    { size: 24, after: 60 }
                ),

                // Relief — filled text or blank lines
                ...(c.relief
                    ? [para(c.relief, { size: 24, after: 100 })]
                    : blankLines(3)
                ),

                spacer(6),

                // Made this
                mixedPara([
                    { text: 'Made this ' },
                    { text: dt.ordDay, bold: true },
                    { text: ' day of ' },
                    { text: dt.month, bold: true },
                    { text: ' ' + dt.year + '.' },
                ], { size: 24, after: 80 }),

                // Complainant signature
                ...sigLine(cn, 'Complainant/s', AlignmentType.LEFT),

                spacer(12),

                // Received and filed
                mixedPara([
                    { text: 'Received and filed this ' },
                    { text: dt.ordDay, bold: true },
                    { text: ' day of ' },
                    { text: dt.month, bold: true },
                    { text: ', ' + dt.year + '.' },
                ], { size: 24, after: 80 }),

                // PB signature
                ...sigLine(pbName, 'Punong Barangay', AlignmentType.LEFT),
            ],
        }],
    });

    await saveDocx(doc, `Form7-Complaint-${c.caseNo}-${c.comp.last}`);
}

/* ════════════════════════════════════
   FORM 9 — SUMMONS
════════════════════════════════════ */
 
async function exportSummonsDocx(caseId) {
  const c   = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const to      = document.getElementById('sum-to').value;
  const sDate   = document.getElementById('sum-date').value;
  const hDate   = document.getElementById('sum-hdate').value;
  const hTime   = document.getElementById('sum-htime').value;
 
  const sdt = parseDt(sDate);
  const hdt = parseDt(hDate);
 
  // Time formatting
  const fTime = (t) => {
    if (!t) return '______';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };
  const timeStr = fTime(hTime);
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
  const pb      = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName  = pb ? pb.name.toUpperCase() : '';
 
  function summonsSection(person) {
    const pn = `${person.last}, ${person.first}${person.mid ? ' ' + person.mid : ''}`;
    return [
      header,
      spacer(8),
      para(`${sdt.ordDay} day of ${sdt.month} ${sdt.year}`, { align: AlignmentType.RIGHT, size: 22 }),
      spacer(6),
      caption,
      hRule(),
      para('S U M M O N S', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([{ text: 'TO: ' }, { text: pn, bold: true }], { size: 24 }),
      para(person.addr || '', { size: 22, after: 80 }),
      para(
        `You are hereby summoned to appear before me in person, together with your witnesses, on the ${hdt.ordDay} day of ${hdt.month}, ${hdt.year}, at ${timeStr}, then and there to answer to a complaint made before me, copy of which is attached hereto, for mediation/conciliation of your dispute with complainant/s.`,
        { size: 24, after: 80 }
      ),
      para(
        'You are hereby warned that if you refuse or willfully fail to appear in obedience to this summons, you may be barred from filing any counterclaim arising from said complaint.',
        { size: 24, after: 80 }
      ),
      para('FAIL NOT or else face punishment as for contempt of court.', { size: 24, bold: true, after: 80 }),
      mixedPara([
        { text: 'This ' }, { text: sdt.ordDay, bold: true },
        { text: ' day of ' }, { text: sdt.month, bold: true },
        { text: ', ' + sdt.year + '.' },
      ], { size: 24, after: 80 }),
      ...sigLine(pbName, 'Punong Barangay', AlignmentType.RIGHT),
      spacer(20),
 
      // Officer's Return
      para("OFFICER'S RETURN", { align: AlignmentType.CENTER, bold: true, size: 24, before: 80, after: 80 }),
      para(
        "I served this summons upon respondent __________________________ on the ______ day of _________________, 20___, by:",
        { size: 22, after: 80 }
      ),
      para('(Write name/s of respondent/s before mode by which served.)', { size: 20, italic: true, after: 60 }),
      para('__________________________ 1. handing to him/them said summons in person, or', { size: 22, after: 40 }),
      para('__________________________ 2. handing to him/them said summons and he/they refused to receive it, or', { size: 22, after: 40 }),
      para("__________________________ 3. leaving said summons at his/their dwelling with __________________________ (name), a person of suitable age and discretion residing therein, or", { size: 22, after: 40 }),
      para("__________________________ 4. leaving said summons at his/their office/place of business with __________________________ (name), a competent person in charge thereof.", { size: 22, after: 80 }),
      ...sigLine('', 'Officer', AlignmentType.RIGHT),
      spacer(12),
      para('Received by Respondent/s / Representative/s:', { bold: true, size: 22, after: 60 }),
      twoSig('', '(Signature)', '', '(Date)'),
      spacer(8),
      twoSig('', '(Signature)', '', '(Date)'),
    ];
  }
 
  const sections = [];
  if (to === 'respondent' || to === 'both') sections.push(...summonsSection(c.resp));
  if (to === 'complainant' || to === 'both') sections.push(...summonsSection(c.comp));
 
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      children: sections,
    }],
  });
 
  await saveDocx(doc, `Form9-Summons-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 16 — AMICABLE SETTLEMENT
════════════════════════════════════ */
 
async function exportAmicableSettlementDocx(settlementId) {
  const s = settlements.find(x => x.id === settlementId);
  if (!s) { toast('Settlement not found.', '#b22222'); return; }
  const c  = cases.find(x => x.caseNo === s.caseNo);
  const cn = c ? `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}` : '______________________________';
  const rn = c ? `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}` : '______________________________';
 
  const dt     = parseDt(s.date);
  const pb     = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName = pb ? pb.name.toUpperCase() : '';
 
  const header  = await buildKpHeader();
  const caption = c ? buildCaption(c) : spacer(10);
 
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      children: [
        header,
        spacer(16),
        caption,
        hRule(),
 
        para('AMICABLE SETTLEMENT', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
 
        para(
          'We, complainant/s and respondent/s in the above-captioned case, do hereby agree to settle our dispute as follows:',
          { size: 24, after: 60 }
        ),
 
        // Terms or blank lines
        ...(s.terms
          ? [para(s.terms, { size: 24, after: 100 })]
          : blankLines(6)
        ),
 
        spacer(6),
        para('And bind ourselves to comply honestly and faithfully with the above terms of settlement.', { size: 24, after: 80 }),
 
        mixedPara([
          { text: 'Entered this ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, before: 80, after: 80 }),
 
        twoSig(cn, 'Complainant/s', rn, 'Respondent/s'),
        spacer(12),
 
        para('ATTESTATION:', { bold: true, size: 24, before: 80, after: 60 }),
        para(
          'I hereby certify that the foregoing amicable settlement was entered into by the parties freely and voluntarily, after I had explained to them the nature and consequence of such settlement.',
          { size: 24, after: 80 }
        ),
 
        mixedPara([
          { text: 'Received and filed this ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
 
        ...sigLine(pbName, 'Punong Barangay', AlignmentType.LEFT),
        spacer(12),
 
        para(
          '* Failure to repudiate the settlement within ten (10) days from date of settlement shall be deemed a waiver of the right to challenge on said grounds. (R.A. 7160, Sec. 416)',
          { size: 18, italic: true, after: 0 }
        ),
      ],
    }],
  });
 
  await saveDocx(doc, `Form16-AmicableSettlement-${s.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 20 — CERTIFICATION TO FILE ACTION (CFA)
════════════════════════════════════ */
 
async function exportCFADocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const reason = document.getElementById('cfa-reason').value;
  const sec    = document.getElementById('cfa-secretary').value.trim() || '______________________________';
  const cap    = document.getElementById('cfa-captain').value.trim()   || '______________________________';
  const date   = document.getElementById('cfa-date').value;
  const dt     = parseDt(date);
 
  let items = [], label = 'Form20-B';
  if (reason === 'Failure to settle after mediation') {
    label = 'Form20-B';
    items = [
      'Parties were called for mediation of the complaint but the mediation proceeding did not result to any amicable settlement;',
      'The Punong Barangay set the meeting of the parties for the constitution of the Pangkat;',
      'The respondent willfully failed or refused to appear without justifiable reason at the conciliation proceedings before the Pangkat; and',
      'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.',
    ];
  } else if (reason === 'Repudiation of settlement') {
    label = 'Form20';
    items = [
      'There has been a personal confrontation between the parties before the Punong Barangay/Pangkat ng Tagapagkasundo;',
      'An amicable settlement/agreement to arbitrate was reached;',
      'The settlement/agreement has been repudiated in a statement sworn to before the Punong Barangay; and',
      'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.',
    ];
  } else if (reason === 'Failure to appear after two (2) summons') {
    label = 'Form20-A';
    items = [
      'There has been a personal confrontation between the parties before the Punong Barangay but mediation failed;',
      'The Pangkat ng Tagapagkasundo was constituted but the personal confrontation before the Pangkat likewise did not result into a settlement; and',
      'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.',
    ];
  } else if (reason === 'Waiver of the right to lupon conciliation') {
    label = 'Form20-A';
    items = [
      'The parties were duly notified of the mediation proceedings;',
      'One of the parties waived in writing his/her right to lupon conciliation; and',
      'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.',
    ];
  } else if (reason === 'Case not covered by lupon jurisdiction') {
    label = 'Form20';
    items = [
      'The complaint filed in this case is not within the jurisdiction of the Lupon ng Tagapamayapa; and',
      'Therefore, the corresponding complaint may now be filed directly in court/government office.',
    ];
  } else {
    items = [
      `${reason}; and`,
      'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.',
    ];
  }
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      children: [
        header,
        spacer(16),
        caption,
        hRule(),
 
        para('CERTIFICATION TO FILE ACTION', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
 
        para('This is to certify that:', { size: 24, after: 60 }),
 
        // Numbered items
        ...items.map((item, i) => mixedPara([
          { text: `${i + 1}.  ${item}` },
        ], { size: 24, after: 60 })),
 
        spacer(8),
 
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
 
        ...sigLine(sec, 'Pangkat Secretary / Lupon Secretary', AlignmentType.LEFT),
        spacer(12),
 
        para('Attested by:', { bold: true, size: 24, after: 40 }),
        ...sigLine(cap, `Pangkat Chairman / Lupon Chairman\n${cfg.brgy}`, AlignmentType.LEFT),
      ],
    }],
  });
 
  await saveDocx(doc, `${label}-CFA-${c.caseNo}`);
}

/* ════════════════════════════════════
   SHARED: notified line + two blank sigs
════════════════════════════════════ */
 
function notifiedLine() {
  return para('Notified this ______ day of _________________, 20_____.', { size: 24, before: 120, after: 60 });
}
 
function fmtTimeStr(t) {
  if (!t) return '______';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
 
 
/* ════════════════════════════════════
   FORM 8 — NOTICE OF HEARING (MEDIATION)
════════════════════════════════════ */
 
async function exportNoticeHearingMedDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const hDate  = document.getElementById('f8-hdate').value;
  const hTime  = document.getElementById('f8-htime').value;
  const date   = document.getElementById('f8-date').value;
  const hdt    = parseDt(hDate);
  const dt     = parseDt(date);
  const cn     = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const pb     = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName = pb ? pb.name.toUpperCase() : '';
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(MEDIATION PROCEEDINGS)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: cn, bold: true }], { size: 24, after: 80 }),
        para(
          `You are hereby required to appear before me on the ${hdt.ordDay} day of ${hdt.month}, ${hdt.year} at ${fmtTimeStr(hTime)} o'clock for the hearing of your complaint.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay', AlignmentType.LEFT),
        notifiedLine(),
        para('Complainant/s', { bold: true, size: 22, after: 40 }),
        twoSig('', '(Signature)', '', '(Date)'),
      ],
    }],
  });
  await saveDocx(doc, `Form8-NoticeHearingMed-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 10 — NOTICE FOR CONSTITUTION OF PANGKAT
════════════════════════════════════ */
 
async function exportNoticePangkatDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const hDate  = document.getElementById('f10-hdate').value;
  const hTime  = document.getElementById('f10-htime').value;
  const date   = document.getElementById('f10-date').value;
  const hdt    = parseDt(hDate);
  const dt     = parseDt(date);
  const cn     = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn     = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const pb     = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName = pb ? pb.name.toUpperCase() : '';
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para('NOTICE FOR CONSTITUTION OF PANGKAT', { align: AlignmentType.CENTER, bold: true, size: 24, before: 80, after: 80 }),
        mixedPara([
          { text: 'TO: ' }, { text: cn, bold: true },
          { text: '     and     ' },
          { text: rn, bold: true },
        ], { size: 24, after: 20 }),
        twoSig('', 'Complainant/s', '', 'Respondent/s'),
        spacer(8),
        para(
          `You are hereby required to appear before me on the ${hdt.ordDay} day of ${hdt.month}, ${hdt.year} at ${fmtTimeStr(hTime)} o'clock for the constitution of the Pangkat ng Tagapagkasundo which shall conciliate your dispute. Should you fail to agree on the Pangkat membership or to appear on the aforesaid date for the constitution of the Pangkat, I shall determine the membership thereof by drawing lots.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay', AlignmentType.LEFT),
        notifiedLine(),
        twoSig('', 'Complainant/s', '', 'Respondent/s'),
      ],
    }],
  });
  await saveDocx(doc, `Form10-NoticePangkat-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 11 — NOTICE TO CHOSEN PANGKAT MEMBER
════════════════════════════════════ */
 
async function exportNoticePangkatMemberDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const mn    = document.getElementById('f11-member').value.trim() || '______________________________';
  const date  = document.getElementById('f11-date').value;
  const dt    = parseDt(date);
  const pb    = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName = pb ? pb.name.toUpperCase() : '';
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para(`${dt.ordDay} day of ${dt.month}, ${dt.year}`, { align: AlignmentType.RIGHT, size: 22, after: 60 }),
        para('NOTICE TO CHOSEN PANGKAT MEMBER', { align: AlignmentType.CENTER, bold: true, size: 24, before: 80, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: mn, bold: true }], { size: 24, after: 80 }),
        para(
          'Notice is hereby given that you have been chosen member of the Pangkat ng Tagapagkasundo to amicably conciliate the dispute between the parties in the above-entitled case.',
          { size: 24, after: 80 }
        ),
        ...sigLine(pbName, 'Punong Barangay / Lupon Secretary', AlignmentType.LEFT),
        spacer(12),
        para('Received this ______ day of _________________, 20_____.', { size: 24, after: 60 }),
        ...sigLine('', 'Pangkat Member', AlignmentType.LEFT),
      ],
    }],
  });
  await saveDocx(doc, `Form11-NoticePangkatMember-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 12 — NOTICE OF HEARING (CONCILIATION)
════════════════════════════════════ */
 
async function exportNoticeHearingConDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const hDate = document.getElementById('f12-hdate').value;
  const hTime = document.getElementById('f12-htime').value;
  const date  = document.getElementById('f12-date').value;
  const hdt   = parseDt(hDate);
  const dt    = parseDt(date);
  const cn    = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn    = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        mixedPara([
          { text: 'TO: ' }, { text: cn, bold: true },
          { text: '     and     ' },
          { text: rn, bold: true },
        ], { size: 24, after: 20 }),
        twoSig('', 'Complainant/s', '', 'Respondent/s'),
        spacer(8),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(CONCILIATION PROCEEDING)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        para(
          `You are hereby required to appear before the Pangkat on the ${hdt.ordDay} day of ${hdt.month}, ${hdt.year}, at ${fmtTimeStr(hTime)} o'clock for a hearing of the above-entitled case.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine('', 'Pangkat Chairman', AlignmentType.LEFT),
        notifiedLine(),
        twoSig('', 'Complainant/s', '', 'Respondent/s'),
      ],
    }],
  });
  await saveDocx(doc, `Form12-NoticeHearingCon-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 18 — NOTICE (COMPLAINANT FAILED TO APPEAR)
════════════════════════════════════ */
 
async function exportFailedAppearCompDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn      = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const missed  = document.getElementById('f18-missed').value;
  const hDate   = document.getElementById('f18-hdate').value;
  const hTime   = document.getElementById('f18-htime').value;
  const date    = document.getElementById('f18-date').value;
  const missedDt = parseDt(missed);
  const hdt     = parseDt(hDate);
  const dt      = parseDt(date);
  const pb      = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName  = pb ? pb.name.toUpperCase() : '';
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(RE: FAILURE TO APPEAR)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: cn, bold: true }], { size: 24, after: 10 }),
        para('Complainant/s', { italic: true, size: 22, after: 80 }),
        para(
          `You are hereby required to appear before me/the Pangkat on the ${hdt.ordDay} day of ${hdt.month}, ${hdt.year}, at ${fmtTimeStr(hTime)} o'clock to explain why you failed to appear for mediation/conciliation scheduled on ${missedDt.ordDay} day of ${missedDt.month}, ${missedDt.year} and why your complaint should not be dismissed, a certificate to bar the filing of your action in court/government office should not be issued, and contempt proceedings should not be initiated in court for willful failure or refusal to appear before the Punong Barangay/Pangkat ng Tagapagkasundo.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay / Pangkat Chairman', AlignmentType.LEFT),
        notifiedLine(),
        para('Complainant/s', { bold: true, size: 22, after: 40 }),
        twoSig('', '(Signature)', '', '(Date)'),
      ],
    }],
  });
  await saveDocx(doc, `Form18-FailedAppearComp-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 19 — NOTICE (RESPONDENT FAILED TO APPEAR)
════════════════════════════════════ */
 
async function exportFailedAppearRespDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const rn      = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const missed  = document.getElementById('f19-missed').value;
  const hDate   = document.getElementById('f19-hdate').value;
  const hTime   = document.getElementById('f19-htime').value;
  const date    = document.getElementById('f19-date').value;
  const missedDt = parseDt(missed);
  const hdt     = parseDt(hDate);
  const dt      = parseDt(date);
  const pb      = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName  = pb ? pb.name.toUpperCase() : '';
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(RE: FAILURE TO APPEAR)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: rn, bold: true }], { size: 24, after: 10 }),
        para('Respondent/s', { italic: true, size: 22, after: 80 }),
        para(
          `You are hereby required to appear before me/the Pangkat on the ${hdt.ordDay} day of ${hdt.month}, ${hdt.year}, at ${fmtTimeStr(hTime)} o'clock to explain why you failed to appear for mediation/conciliation scheduled on ${missedDt.ordDay} day of ${missedDt.month}, ${missedDt.year} and why your counterclaim (if any) arising from the complaint should not be dismissed, a certificate to bar the filing of said counterclaim in court/government office should not be issued, and contempt proceedings should not be initiated in court for willful failure or refusal to appear before the Punong Barangay/Pangkat ng Tagapagkasundo.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay / Pangkat Chairman', AlignmentType.LEFT),
        notifiedLine(),
        para('Respondent/s', { bold: true, size: 22, after: 40 }),
        twoSig('', '(Signature)', '', '(Date)'),
      ],
    }],
  });
  await saveDocx(doc, `Form19-FailedAppearResp-${c.caseNo}`);
}