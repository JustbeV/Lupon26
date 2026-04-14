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
async function buildKpHeader(office = 'OFFICE OF THE LUPONG TAGAPAMAYAPA') {
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
        para(office, { align: AlignmentType.CENTER, size: 22, bold: true }),
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
    console.log('saveDocx called with doc:', !!doc, 'filename:', filename);
    const blob = await Packer.toBlob(doc);
    console.log('Blob created, size:', blob.size);
    const url = URL.createObjectURL(blob);
    console.log('URL created:', url);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.docx';
    console.log('Clicking download link...');
    a.click();
    URL.revokeObjectURL(url);
    console.log('Download link clicked, URL revoked');
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
 
  function summonsSection(person, roleLabel) {
    const pn = `${person.last}, ${person.first}${person.mid ? ' ' + person.mid : ''}`;
    return [
      header,
      spacer(8),
      para(`${sdt.ordDay} day of ${sdt.month} ${sdt.year}`, { align: AlignmentType.RIGHT, size: 22 }),
      spacer(6),
      caption,
      hRule(),
      para('S U M M O N S', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([{ text: 'TO: ' }, { text: pn, bold: true, underline: true }], { size: 24, after: 20 }),
      para(person.addr || '', { size: 22, after: 20 }),
      para(roleLabel, { size: 22, italic: true, after: 80 }),
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
      ...sigLine(pbName, 'Punong Barangay / Lupon Chairman', AlignmentType.RIGHT),
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
  if (to === 'respondent' || to === 'both') sections.push(...summonsSection(c.resp, 'Respondent/s'));
  if (to === 'complainant' || to === 'both') sections.push(...summonsSection(c.comp, 'Complainant/s'));
 
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
  const pbName = (typeof getPBName === 'function' ? getPBName() : '') || cap;
  const date   = document.getElementById('cfa-date').value;
  const dt     = parseDt(date);
 
  let items = [], label = 'Form20-B';
  if (reason === 'Failure to settle after mediation') {
    label = 'Form20-B';
    items = [
      'There was a personal confrontation between the parties before the Punong Barangay but mediation failed;',
      'The Punong Barangay set the meeting of the parties for the constitution of the Pangkat;',
      'The respondent willfully failed or refused to appear without justifiable reason at the conciliation proceedings before the Pangkat; and',
      'Therefore, the corresponding complaint for the dispute may now be filed in court/government office.',
    ];
  } else if (reason === 'Repudiation of settlement') {
    label = 'Form20';
    items = [
      'There has been a personal confrontation between the parties before the Punong Barangay/Pangkat ng Tagapagkasundo;',
      'An amicable settlement/agreement to arbitrate was reached;',
      [
        { text: 'The settlement has been repudiated in a statement sworn to before the Punong Barangay ' },
        { text: pbName, bold: true, underline: true },
        { text: ' by on ground of ' },
        { text: '______________________________', underline: true },
        { text: '; and' },
      ],
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
        ...items.map((item, i) => mixedPara(
          Array.isArray(item)
            ? [{ text: `${i + 1}.  ` }, ...item]
            : [{ text: `${i + 1}.  ${item}` }],
          { size: 24, after: 60 }
        )),
 
        spacer(8),
 
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' }, { text: dt.year, bold: true, underline: true }, { text: '.' },
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
 
function notifiedLine(dt = null) {
  const text = dt
    ? `Notified this ${dt.day} day of ${dt.month}, ${dt.year}.`
    : 'Notified this ______ day of _________________, 20_____.';
  return para(text, { size: 24, before: 120, after: 60 });
}
 
function partyNameParas(names) {
  const entries = (Array.isArray(names) ? names : String(names || '')
    .split(/\r?\n|;|\/|&|\band\b/gi))
    .map(name => name.trim())
    .filter(Boolean);
  const lines = entries.length ? entries : ['______________________________'];
  return lines.map(name => new Paragraph({
    spacing: { before: 0, after: 40 },
    children: [new TextRun({
      text: name,
      font: FONT,
      size: 22,
      underline: name.includes('_') ? undefined : { type: UnderlineType.SINGLE },
    })],
  }));
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
 
  const header  = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(MEDIATION PROCEEDINGS)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: cn, bold: true, underline: true }], { size: 24, after: 20 }),
        para('Complainant/s', { italic: true, size: 22, after: 80 }),
        mixedPara([
          { text: 'You are hereby required to appear before me on the ' },
          { text: hdt.day, bold: true, underline: true },
          { text: ' day of ' },
          { text: hdt.month, bold: true, underline: true },
          { text: ', 20' },
          { text: hdt.year.slice(-2), bold: true, underline: true },
          { text: ' at ' },
          { text: fmtTimeStr(hTime), bold: true, underline: true },
          { text: " o'clock in the morning/afternoon for the hearing of your complaint." },
        ], { size: 24, after: 80 }),
        mixedPara([
          { text: 'This ' }, { text: dt.ordDay, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay / Lupon Chairman', AlignmentType.LEFT),
        mixedPara([
          { text: 'Notified this ' },
          { text: dt.day, underline: true },
          { text: ' day of ' },
          { text: dt.month, underline: true },
          { text: ', 20' },
          { text: dt.year.slice(-2), underline: true },
          { text: '.' },
        ], { size: 24, before: 120, after: 60 }),
        para('Complainant/s', { bold: true, size: 22, after: 40 }),
        twoSig('', '', '', ''),
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
  const [rawHour = '', rawMinute = ''] = hTime ? hTime.split(':') : [];
  const hourNum = parseInt(rawHour, 10);
  const hourStr = hTime ? `${hourNum > 12 ? hourNum - 12 : hourNum || 12}:${rawMinute}` : '______';
  const ampm = !hTime ? 'morning/afternoon' : hourNum >= 12 ? 'afternoon' : 'morning';
 
  const header  = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para('NOTICE FOR CONSTITUTION OF PANGKAT', { align: AlignmentType.CENTER, bold: true, size: 24, before: 80, after: 80 }),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [900, 4050, 360, 4050],
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
                  width: { size: 900, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.TOP,
                  children: [para('TO:', { size: 24 })],
                }),
                new TableCell({
                  borders: NO_BORDER,
                  width: { size: 4050, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
                      spacing: { before: 0, after: 40 },
                      children: [new TextRun({ text: cn, font: FONT, size: 22, bold: true })],
                    }),
                    para('Complainant/s', { align: AlignmentType.CENTER, size: 22, italic: true }),
                  ],
                }),
                new TableCell({
                  borders: NO_BORDER,
                  width: { size: 360, type: WidthType.DXA },
                  children: [para('', { size: 22 })],
                }),
                new TableCell({
                  borders: NO_BORDER,
                  width: { size: 4050, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
                      spacing: { before: 0, after: 40 },
                      children: [new TextRun({ text: rn, font: FONT, size: 22, bold: true })],
                    }),
                    para('Respondent/s', { align: AlignmentType.CENTER, size: 22, italic: true }),
                  ],
                }),
              ],
            }),
          ],
        }),
        spacer(8),
        para(
          `You are hereby required to appear before me on the ${hdt.day} day of ${hdt.month}, ${hdt.year} at ${hourStr} o'clock in the ${ampm} for the constitution of the Pangkat ng Tagapagkasundo which shall conciliate your dispute. Should you fail to agree on the Pangkat membership or to appear on the aforesaid date for the constitution of the Pangkat, I shall determine the membership thereof by drawing lots.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.day, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', 20' }, { text: dt.year.slice(-2), bold: true }, { text: '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay', AlignmentType.LEFT),
        notifiedLine(dt),
        twoSig(cn, 'Complainant/s', rn, 'Respondent/s'),
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
 
  const mn    = document.getElementById('f11-member').value;
  if (!mn) { toast('Select a member.', '#b22222'); return; }
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
        para(`${dt.month} ${dt.day}, ${dt.year}`, { align: AlignmentType.RIGHT, size: 22, after: 60 }),
        para('NOTICE TO CHOSEN PANGKAT MEMBER', { align: AlignmentType.CENTER, bold: true, size: 24, before: 80, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: mn, bold: true, underline: true }], { size: 24, after: 80 }),
        para(
          'Notice is hereby given that you have been chosen member of the Pangkat ng Tagapagkasundo to amicably conciliate the dispute between the parties in the above-entitled case.',
          { size: 24, after: 80 }
        ),
        ...sigLine(pbName, 'Punong Barangay / Lupon Secretary', AlignmentType.LEFT),
        spacer(12),
        para(`Received this ${dt.month} ${dt.day}, ${dt.year}.`, { size: 24, after: 60 }),
        ...sigLine(mn, 'Pangkat Member', AlignmentType.LEFT),
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
  const pangkatChair = members.find(m => m.role === 'Pangkat Chairperson');
  const chairName = pangkatChair ? pangkatChair.name.toUpperCase() : '';
 
  const header  = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption = buildCaption(c);
  const toBlock = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [900, 4050, 4050],
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
            width: { size: 900, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            children: [para('TO:', { size: 24 })],
          }),
          new TableCell({
            borders: NO_BORDER,
            width: { size: 4050, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [new TextRun({ text: cn, font: FONT, size: 22, underline: { type: UnderlineType.SINGLE }, bold: true })],
              }),
              para('Complainant/s', { align: AlignmentType.CENTER, size: 22, italic: true }),
            ],
          }),
          new TableCell({
            borders: NO_BORDER,
            width: { size: 4050, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [new TextRun({ text: rn, font: FONT, size: 22, underline: { type: UnderlineType.SINGLE }, bold: true })],
              }),
              para('Respondent/s', { align: AlignmentType.CENTER, size: 22, italic: true }),
            ],
          }),
        ],
      }),
    ],
  });
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        toBlock,
        spacer(8),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(CONCILIATION PROCEEDING)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        para(
          `You are hereby required to appear before the Pangkat on the ${hdt.day} day of ${hdt.month}, ${hdt.year}, at ${fmtTimeStr(hTime)} o'clock for a hearing of the above-entitled case.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.day, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(chairName, 'Pangkat Chairman', AlignmentType.LEFT),
        para(`Notified this ${dt.day} day of ${dt.month}, ${dt.year}.`, { size: 24, after: 60 }),
        twoSig(cn, 'Complainant/s', rn, 'Respondent/s'),
      ],
    }],
  });
  await saveDocx(doc, `Form12-NoticeHearingCon-${c.caseNo}`);
}

async function exportSubpoenaDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }

  const w1 = document.getElementById('f13-w1').value.trim() || '______________________________';
  const w2 = document.getElementById('f13-w2').value.trim();
  const hDate = document.getElementById('f13-hdate').value;
  const hTime = document.getElementById('f13-htime').value;
  const date = document.getElementById('f13-date').value;
  const issuer = document.getElementById('f13-issuer').value;
  const hdt = parseDt(hDate);
  const dt = parseDt(date);
  const chair = issuer === 'pangkat'
    ? members.find(m => m.role === 'Pangkat Chairperson')
    : members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const chairName = chair ? chair.name.toUpperCase() : '';

  const header = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption = buildCaption(c);

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
        }
      },
      children: [
        header, spacer(16), caption, hRule(),
        para('S U B P O E N A', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: w1, bold: true, underline: true }], { size: 24, after: 20 }),
        ...(w2 ? [para(w2, { size: 22, after: 20, underline: true })] : []),
        para('Witness/es', { size: 22, italic: true, after: 80 }),
        para(
          `You are hereby commanded to appear before me on the ${hdt.day} day of ${hdt.month}, ${hdt.year}, at ${fmtTimeStr(hTime)} o'clock, then and there to testify in the hearing of the above-captioned case.`,
          { size: 24, after: 80 }
        ),
        mixedPara([
          { text: 'This ' }, { text: dt.day, bold: true },
          { text: ' day of ' }, { text: dt.month, bold: true },
          { text: ', ' + dt.year + '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(chairName, issuer === 'pangkat' ? 'Pangkat Chairman' : 'Punong Barangay / Pangkat Chairman', AlignmentType.LEFT),
        para('(Cross out whichever one is not applicable.)', { size: 18, italic: true, after: 40 }),
      ],
    }],
  });
  await saveDocx(doc, `Form13-Subpoena-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 18 — NOTICE (COMPLAINANT FAILED TO APPEAR)
════════════════════════════════════ */
 
async function exportFailedAppearCompDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn      = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn      = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const missed  = document.getElementById('f18-missed').value;
  const hDate   = document.getElementById('f18-hdate').value;
  const hTime   = document.getElementById('f18-htime').value;
  const date    = document.getElementById('f18-date').value;
  const missedDt = parseDt(missed);
  const hdt     = parseDt(hDate);
  const dt      = parseDt(date);
  const pb      = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbOfficial = pb ? pb.name.toUpperCase() : '______________________________';
  const pbName  = document.getElementById('f18-pb').value.trim() || pbOfficial;
  const hearingTime = fmtTimeStr(hTime);
  const hearingHour = hearingTime.replace(/ (AM|PM)$/, '');
  const hearingPeriod = /PM$/.test(hearingTime) ? 'afternoon' : /AM$/.test(hearingTime) ? 'morning' : 'morning/afternoon';
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(RE: FAILURE TO APPEAR)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: cn, bold: true, underline: true }], { size: 24, after: 10 }),
        para('Complainant/s', { italic: true, size: 22, after: 80 }),
        mixedPara([
          { text: 'You are hereby required to appear before me/the Pangkat on the ' },
          { text: hdt.day, bold: true, underline: true },
          { text: ' day of ' },
          { text: hdt.month, bold: true, underline: true },
          { text: ', 20' },
          { text: hdt.year.slice(-2), bold: true, underline: true },
          { text: ', at ' },
          { text: hearingHour, bold: true, underline: true },
          { text: ` o'clock in the ${hearingPeriod} to explain why you failed to appear for mediation/conciliation scheduled on ${missedDt.day} day of ${missedDt.month}, ${missedDt.year} and why your complaint should not be dismissed, a certificate to bar the filing of your action in court/government office should not be issued, and contempt proceedings should not be initiated in court for willful failure or refusal to appear before the Punong Barangay/Pangkat ng Tagapagkasundo.` },
        ], { size: 24, after: 80 }),
        mixedPara([
          { text: 'This ' },
          { text: dt.day, bold: true, underline: true },
          { text: ' day of ' },
          { text: dt.month, bold: true, underline: true },
          { text: ', 20' },
          { text: dt.year.slice(-2), bold: true, underline: true },
          { text: '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay / Pangkat Chairman', AlignmentType.LEFT),
        mixedPara([
          { text: 'Notified this ' },
          { text: dt.day, underline: true },
          { text: ' day of ' },
          { text: dt.month, underline: true },
          { text: ', 20' },
          { text: dt.year.slice(-2), underline: true },
          { text: '.' },
        ], { size: 24, before: 120, after: 60 }),
        para('Complainant', { bold: true, size: 22, after: 20 }),
        ...partyNameParas(cn),
        para('Respondent', { bold: true, size: 22, before: 40, after: 20 }),
        ...partyNameParas(rn),
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
 
  const cn      = `${c.comp.last}, ${c.comp.first}${c.comp.mid ? ' ' + c.comp.mid : ''}`;
  const rn      = `${c.resp.last}, ${c.resp.first}${c.resp.mid ? ' ' + c.resp.mid : ''}`;
  const missed  = document.getElementById('f19-missed').value;
  const hDate   = document.getElementById('f19-hdate').value;
  const hTime   = document.getElementById('f19-htime').value;
  const date    = document.getElementById('f19-date').value;
  const missedDt = parseDt(missed);
  const hdt     = parseDt(hDate);
  const dt      = parseDt(date);
  const pb      = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbOfficial = pb ? pb.name.toUpperCase() : '______________________________';
  const pbName  = document.getElementById('f19-pb').value.trim() || pbOfficial;
  const hearingTime = fmtTimeStr(hTime);
  const hearingHour = hearingTime.replace(/ (AM|PM)$/, '');
  const hearingPeriod = /PM$/.test(hearingTime) ? 'afternoon' : /AM$/.test(hearingTime) ? 'morning' : 'morning/afternoon';
 
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        header, spacer(16), caption, hRule(),
        para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
        para('(RE: FAILURE TO APPEAR)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
        mixedPara([{ text: 'TO: ' }, { text: rn, bold: true, underline: true }], { size: 24, after: 10 }),
        para('Respondent/s', { italic: true, size: 22, after: 80 }),
        mixedPara([
          { text: 'You are hereby required to appear before me/the Pangkat on the ' },
          { text: hdt.day, bold: true, underline: true },
          { text: ' day of ' },
          { text: hdt.month, bold: true, underline: true },
          { text: ', 20' },
          { text: hdt.year.slice(-2), bold: true, underline: true },
          { text: ', at ' },
          { text: hearingHour, bold: true, underline: true },
          { text: ` o'clock in the ${hearingPeriod} to explain why you failed to appear for mediation/conciliation scheduled on ${missedDt.day} day of ${missedDt.month}, ${missedDt.year} and why your counterclaim (if any) arising from the complaint should not be dismissed, a certificate to bar the filing of said counterclaim in court/government office should not be issued, and contempt proceedings should not be initiated in court for willful failure or refusal to appear before the Punong Barangay/Pangkat ng Tagapagkasundo.` },
        ], { size: 24, after: 80 }),
        mixedPara([
          { text: 'This ' },
          { text: dt.day, bold: true, underline: true },
          { text: ' day of ' },
          { text: dt.month, bold: true, underline: true },
          { text: ', 20' },
          { text: dt.year.slice(-2), bold: true, underline: true },
          { text: '.' },
        ], { size: 24, after: 80 }),
        ...sigLine(pbName, 'Punong Barangay / Pangkat Chairman', AlignmentType.LEFT),
        mixedPara([
          { text: 'Notified this ' },
          { text: dt.day, underline: true },
          { text: ' day of ' },
          { text: dt.month, underline: true },
          { text: ', 20' },
          { text: dt.year.slice(-2), underline: true },
          { text: '.' },
        ], { size: 24, before: 120, after: 60 }),
        para('Respondent/s:', { bold: true, size: 22, after: 20 }),
        ...partyNameParas(rn),
        para('Complainant/s:', { bold: true, size: 22, before: 40, after: 20 }),
        ...partyNameParas(cn),
      ],
    }],
  });
  await saveDocx(doc, `Form19-FailedAppearResp-${c.caseNo}`);
}
 /* ════════════════════════════════════
   FORM 14 — AGREEMENT FOR ARBITRATION
════════════════════════════════════ */
 
async function exportArbitrationAgreementDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn      = `${c.comp.last}, ${c.comp.first}${c.comp.mid?' '+c.comp.mid:''}`;
  const rn      = `${c.resp.last}, ${c.resp.first}${c.resp.mid?' '+c.resp.mid:''}`;
  const arbType = document.getElementById('f14-type').value;
  const chair   = document.getElementById('f14-chair').value.trim() || '______________________________';
  const date    = document.getElementById('f14-date').value;
  const dt      = parseDt(date);
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('AGREEMENT FOR ARBITRATION', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([
        { text: 'We hereby agree to submit our dispute for arbitration to the ' },
        { text: arbType, bold: true, underline: true },
        { text: '/Pangkat ng Tagapagkasundo (Please cross out whichever one is not applicable) and bind ourselves to comply with the award that may be rendered thereon. We have made this agreement freely with a full understanding of its nature and consequences.' },
      ], { size: 24, after: 80 }),
      mixedPara([
        { text: 'Entered into this ' }, { text: dt.day, bold: true },
        { text: ' day of ' }, { text: dt.month, bold: true },
        { text: ', ' + dt.year + '.' },
      ], { size: 24, after: 80 }),
      twoSig(cn, 'Complainant/s', rn, 'Respondent/s'),
      spacer(12),
      para('ATTESTATION', { bold: true, size: 24, before: 80, after: 60 }),
      para('I hereby certify that the foregoing Agreement for Arbitration was entered into by the parties freely and voluntarily, after I had explained to them the nature and consequences of such agreement.', { size: 24, after: 80 }),
      ...sigLine(chair, 'Punong Barangay / Pangkat Chairman', AlignmentType.LEFT),
    ],
  }] });
  await saveDocx(doc, `Form14-ArbitrationAgreement-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 15 — ARBITRATION AWARD
════════════════════════════════════ */
 
async function exportArbitrationAwardDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const award    = document.getElementById('f15-award').value.trim();
  const chair    = document.getElementById('f15-chair').value.trim() || '______________________________';
  const m1       = document.getElementById('f15-m1').value.trim();
  const m2       = document.getElementById('f15-m2').value.trim();
  const attested = document.getElementById('f15-attested').value.trim() || '______________________________';
  const attestBy = document.getElementById('f15-attest-by').value;
  const date     = document.getElementById('f15-date') ? document.getElementById('f15-date').value : '';
  const dt       = parseDt(date);
  const header   = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption  = buildCaption(c);
 
  const stackedAwardSigs = new Table({
    width: { size: 2800, type: WidthType.DXA },
    columnWidths: [2800],
    alignment: AlignmentType.LEFT,
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [
      new TableCell({ borders: NO_BORDER, width: { size: 2800, type: WidthType.DXA }, children: [
        spacer(20),
        new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } }, spacing: { before: 0, after: 40 }, children: [new TextRun({ text: chair, font: FONT, size: 22 })] }),
        para('Punong Barangay / Pangkat Chairman*', { align: AlignmentType.LEFT, size: 20 }),
        new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } }, spacing: { before: 400, after: 40 }, children: [new TextRun({ text: m1 || '', font: FONT, size: 22 })] }),
        para('Member', { align: AlignmentType.LEFT, size: 22 }),
        new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } }, spacing: { before: 400, after: 40 }, children: [new TextRun({ text: m2 || '', font: FONT, size: 22 })] }),
        para('Member', { align: AlignmentType.LEFT, size: 22 }),
      ]}),
    ]})],
  });
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('ARBITRATION AWARD', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      para('After hearing the testimonies, given the careful examination of the evidence presented in this case, award is hereby made as follows:', { size: 24, after: 60 }),
      ...(award ? [para(award, { size: 24, after: 80 })] : blankLines(5)),
      mixedPara([
        { text: 'Made this ' }, { text: dt.day || '___', bold: true, underline: true },
        { text: ' day of ' }, { text: dt.month || '_____________', bold: true },
        { text: ', 20' }, { text: (dt.year || '____').slice(-2), bold: true, underline: true },
        { text: ' at ' + cfg.brgy + '.' },
      ], { size: 24, after: 80 }),
      stackedAwardSigs,
      spacer(12),
      para('ATTESTED:', { bold: true, size: 24, before: 60, after: 60 }),
      ...sigLine(attested, attestBy === 'secretary' ? 'Punong Barangay / Lupon Secretary**' : 'Lupon Chairman**', AlignmentType.LEFT),
      spacer(8),
      para('* To be signed by either the Punong Barangay or the Pangkat Chairman, whoever made the award.', { size: 18, italic: true }),
      para('** To be signed by the Punong Barangay if the award is by the Pangkat Chairman, and by the Lupon Secretary if the award is made by the Punong Barangay.', { size: 18, italic: true }),
    ],
  }] });
  await saveDocx(doc, `Form15-ArbitrationAward-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 17 — REPUDIATION
════════════════════════════════════ */
 
async function exportRepudiationDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn         = `${c.comp.last}, ${c.comp.first}${c.comp.mid?' '+c.comp.mid:''}`;
  const rn         = `${c.resp.last}, ${c.resp.first}${c.resp.mid?' '+c.resp.mid:''}`;
  const ground     = document.getElementById('f17-ground').value;
  const detail     = document.getElementById('f17-detail').value.trim();
  const who        = document.getElementById('f17-who').value;
  const pbName     = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const officialPb = pbName ? pbName.name.toUpperCase() : '______________________________';
  const pb         = document.getElementById('f17-pb').value.trim() || officialPb;
  const date       = document.getElementById('f17-date').value;
  const dt         = parseDt(date);
 
  const groundItem = (g, label) => {
    const checked = ground === g;
    return new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({ text: checked ? `[X] ${label}. ` : `[  ] ${label}. `, font: FONT, size: 24, bold: checked }),
        new TextRun({ text: 'State details ', font: FONT, size: 24 }),
        new TextRun({
          text: checked ? (detail || '_______________________________') : '_______________________________',
          font: FONT,
          size: 24,
          bold: checked,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    });
  };
 
  const header  = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption = buildCaption(c);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('REPUDIATION', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      para('I/WE hereby repudiate the settlement/agreement for arbitration on the ground that my/our consent was vitiated by:', { size: 24, after: 60 }),
      groundItem('Fraud', 'Fraud'),
      groundItem('Violence', 'Violence'),
      groundItem('Intimidation', 'Intimidation'),
      mixedPara([
        { text: 'This ' }, { text: dt.day, bold: true, underline: true },
        { text: ' day of ' }, { text: dt.month, bold: true, underline: true },
        { text: ', 20' }, { text: dt.year.slice(-2), bold: true, underline: true },
        { text: '.' },
      ], { size: 24, before: 60, after: 80 }),
      twoSig(who === 'complainant' ? cn : '', 'Complainant/s', who === 'respondent' ? rn : '', 'Respondent/s'),
      spacer(12),
      mixedPara([
        { text: 'SUBSCRIBE AND SWORN TO before me this ' },
        { text: dt.day, bold: true, underline: true },
        { text: ' day of ' },
        { text: dt.month, bold: true, underline: true },
        { text: ', 20' },
        { text: dt.year.slice(-2), bold: true, underline: true },
        { text: ' at ' + cfg.brgy + '.' },
      ], { size: 24, before: 80, after: 80 }),
      ...sigLine(pb, 'Punong Barangay / Pangkat Chairman / Member', AlignmentType.LEFT),
      spacer(10),
      mixedPara([
        { text: 'Received and filed this ' },
        { text: dt.day, bold: true, underline: true },
        { text: ' day of ' },
        { text: dt.month, bold: true, underline: true },
        { text: ', 20' },
        { text: dt.year.slice(-2), bold: true, underline: true },
        { text: '.' },
      ], { size: 24, before: 60, after: 80 }),
      ...sigLine(officialPb, 'Punong Barangay', AlignmentType.LEFT),
      spacer(8),
      para('* Failure to repudiate the settlement or the arbitration agreement within the time limits set (ten (10) days from date of settlement and five (5) days from the date of arbitration agreement) shall be deemed a waiver of the right to challenge on said grounds.', { size: 18, italic: true }),
    ],
  }] });
  await saveDocx(doc, `Form17-Repudiation-${c.caseNo}`);
}
 
 
/* ------------------------------------
   FORM 21 � CERTIFICATION TO BAR ACTION
------------------------------------ */
async function exportBarActionDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn        = `${c.comp.last}, ${c.comp.first}${c.comp.mid?' '+c.comp.mid:''}`;
  const orderDate = document.getElementById('f21-order').value;
  const sec       = document.getElementById('f21-sec').value.trim()   || '______________________________';
  const chair     = document.getElementById('f21-chair').value.trim() || '______________________________';
  const date      = document.getElementById('f21-date').value;
  const odt       = parseDt(orderDate);
  const dt        = parseDt(date);
  const header    = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption   = buildCaption(c);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('CERTIFICATION TO BAR ACTION', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([
        { text: 'This is to certify that the above-captioned case was dismissed pursuant to the Order dated ' },
        { text: `${odt.ordDay} day of ${odt.month}, ${odt.year}`, bold: true, underline: true },
        { text: ', for complainant/s ' },
        { text: cn, bold: true, underline: true },
        { text: ' willful failure or refusal to appear for hearing before the Punong Barangay/Pangkat ng Tagapagkasundo and therefore complainant/s is/are barred from filing an action in court/government office.' },
      ], { size: 24, after: 80 }),
      mixedPara([
        { text: 'This ' }, { text: dt.day, bold: true, underline: true },
        { text: ' day of ' }, { text: dt.month, bold: true, underline: true },
        { text: ', 20' }, { text: dt.year.slice(-2), bold: true, underline: true }, { text: '.' },
      ], { size: 24, after: 80 }),
      ...sigLine(sec, 'Lupon Secretary / Pangkat Secretary', AlignmentType.LEFT),
      spacer(10),
      para('Attested:', { bold: true, size: 24, before: 60, after: 40 }),
      ...sigLine(chair, 'Lupon Chairman / Pangkat Chairman', AlignmentType.LEFT),
      spacer(8),
      para('IMPORTANT: If Lupon Secretary makes the certification, the Lupon Chairman attests. If the Pangkat Secretary makes the certification, the Pangkat Chairman attests.', { size: 18, italic: true }),
    ],
  }] });
  await saveDocx(doc, `Form21-BarAction-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 22 — CERTIFICATION TO BAR COUNTERCLAIM
════════════════════════════════════ */
 
async function exportBarCounterclaimDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const rn    = `${c.resp.last}, ${c.resp.first}${c.resp.mid?' '+c.resp.mid:''}`;
  const sec   = document.getElementById('f22-sec').value.trim()   || '______________________________';
  const chair = document.getElementById('f22-chair').value.trim() || '______________________________';
  const date  = document.getElementById('f22-date').value;
  const dt    = parseDt(date);
  const header  = await buildKpHeader();
  const caption = buildCaption(c);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('CERTIFICATION TO BAR COUNTERCLAIM', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([
        { text: 'This is to certify that after prior notice and hearing, the respondent/s ' },
        { text: rn, bold: true },
        { text: ' have been found to have willfully failed or refused to appear without justifiable reason before the Punong Barangay/Pangkat ng Tagapagkasundo and therefore respondent/s is/are barred from filing his/her counterclaim (if any) arising from the complaint in court/government office.' },
      ], { size: 24, after: 80 }),
      mixedPara([
        { text: 'This ' }, { text: dt.ordDay, bold: true },
        { text: ' day of ' }, { text: dt.month, bold: true },
        { text: ', ' + dt.year + '.' },
      ], { size: 24, after: 80 }),
      ...sigLine(sec, 'Lupon Secretary / Pangkat Secretary', AlignmentType.LEFT),
      spacer(10),
      para('Attested:', { bold: true, size: 24, before: 60, after: 40 }),
      ...sigLine(chair, 'Lupon Chairman / Pangkat Chairman', AlignmentType.LEFT),
      spacer(8),
      para('IMPORTANT: If Lupon Secretary makes the certification, the Lupon Chairman attests. If the Pangkat Secretary makes the certification, the Pangkat Chairman attests.', { size: 18, italic: true }),
    ],
  }] });
  await saveDocx(doc, `Form22-BarCounterclaim-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 23 — MOTION FOR EXECUTION
════════════════════════════════════ */
 
async function exportMotionExecutionDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn    = `${c.comp.last}, ${c.comp.first}${c.comp.mid?' '+c.comp.mid:''}`;
  const rn    = `${c.resp.last}, ${c.resp.first}${c.resp.mid?' '+c.resp.mid:''}`;
  const sd    = document.getElementById('f23-settle').value;
  const filer = document.getElementById('f23-filer').value;
  const date  = document.getElementById('f23-date').value;
  const sdt   = parseDt(sd);
  const dt    = parseDt(date);
  const header  = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption = buildCaption(c);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('MOTION FOR EXECUTION', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      para('Complainant/s Respondent/s state as follows:', { size: 24, after: 60 }),
      mixedPara([
        { text: '1.  On ' },
        { text: fmtDate(sd), bold: true, underline: true },
        { text: ' the parties in this case signed an amicable settlement/received the arbitration award rendered by the Lupon Chairman/Pangkat ng Tagapagkasundo;' },
      ], { size: 24, after: 60 }),
      para('2.  The period of ten (10) days from the above-stated date has expired without any of the parties filing a sworn statement of repudiation of the settlement before the Lupon Chairman or a petition for nullification of the arbitration award in court; and', { size: 24, after: 60 }),
      para('3.  The amicable settlement/arbitration award is now final and executory.', { size: 24, after: 80 }),
      para('WHEREFORE, Complainant/s Respondent/s requests that the corresponding writ of execution be issued by the Lupon Chairman in this case.', { size: 24, after: 80 }),
      mixedPara([
        { text: 'This ' }, { text: dt.ordDay, bold: true },
        { text: ' day of ' }, { text: dt.month, bold: true },
        { text: ', ' + dt.year + '.' },
      ], { size: 24, after: 80 }),
      twoSig(filer === 'complainant' ? cn : '', 'Complainant/s', filer === 'respondent' ? rn : '', 'Respondent/s'),
    ],
  }] });
  await saveDocx(doc, `Form23-MotionExecution-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 24 — NOTICE OF HEARING (MOTION FOR EXECUTION)
════════════════════════════════════ */
 
async function exportNoticeExecutionDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn         = `${c.comp.last}, ${c.comp.first}${c.comp.mid?' '+c.comp.mid:''}`;
  const rn         = `${c.resp.last}, ${c.resp.first}${c.resp.mid?' '+c.resp.mid:''}`;
  const hDate      = document.getElementById('f24-hdate').value;
  const hTime      = document.getElementById('f24-htime').value;
  const date       = document.getElementById('f24-date').value;
  const filerName  = document.getElementById('f24-filer').value.trim() || '______________________________';
  const hdt        = parseDt(hDate);
  const dt         = parseDt(date);
  const hearingTime = fmtTimeStr(hTime);
  const hearingPeriod = /PM$/.test(hearingTime) ? 'afternoon' : /AM$/.test(hearingTime) ? 'morning' : 'morning/afternoon';
  const pb         = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName     = pb ? pb.name.toUpperCase() : '';
  const header     = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption    = buildCaption(c);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('NOTICE OF HEARING', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 20 }),
      para('(RE: MOTION FOR EXECUTION)', { align: AlignmentType.CENTER, bold: true, size: 24, after: 80 }),
      para('TO:', { size: 24, after: 20 }),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
        },
        rows: [new TableRow({
          children: [
            new TableCell({
              borders: NO_BORDER,
              width: { size: 4680, type: WidthType.DXA },
              children: [
                para(cn, { size: 22, bold: true, underline: true }),
                para('Complainant/s', { size: 22, italic: true })
              ],
            }),
            new TableCell({
              borders: NO_BORDER,
              width: { size: 4680, type: WidthType.DXA },
              children: [
                para(rn, { size: 22, bold: true, underline: true }),
                para('Respondent/s', { size: 22, italic: true })
              ],
            }),
          ],
        })],
      }),
      spacer(6),
      mixedPara([
        { text: 'You are hereby required to appear before me on the ' },
        { text: hdt.day, bold: true, underline: true },
        { text: ' day of ' },
        { text: hdt.month, bold: true, underline: true },
        { text: ', 20' },
        { text: hdt.year.slice(-2), bold: true, underline: true },
        { text: ' at ' },
        { text: hearingTime, bold: true, underline: true },
        { text: ` o'clock in the ${hearingPeriod} for the hearing of the motion for execution, copy of which is attached hereto, filed by ` },
        { text: filerName, bold: true, underline: true },
        { text: '.' },
      ], { size: 24, after: 80 }),
      mixedPara([
        { text: 'This ' }, { text: dt.day, bold: true, underline: true },
        { text: ' day of ' }, { text: dt.month, bold: true, underline: true },
        { text: ', 20' }, { text: dt.year.slice(-2), bold: true, underline: true }, { text: '.' },
      ], { size: 24, after: 80 }),
      ...sigLine(pbName, 'Punong Barangay / Lupon Chairman', AlignmentType.LEFT),
      notifiedLine(dt),
      twoSig('', '(Signature) — Complainant/s', '', '(Signature) — Respondent/s'),
    ],
  }] });
  await saveDocx(doc, `Form24-NoticeExecution-${c.caseNo}`);
}
 
 
/* ════════════════════════════════════
   FORM 25 — NOTICE OF EXECUTION
════════════════════════════════════ */
 
async function exportNoticeOfExecutionDocx(caseId) {
  const c = cases.find(x => x.id === caseId);
  if (!c) { toast('Case not found.', '#b22222'); return; }
 
  const cn      = `${c.comp.last}, ${c.comp.first}${c.comp.mid?' '+c.comp.mid:''}`;
  const rn      = `${c.resp.last}, ${c.resp.first}${c.resp.mid?' '+c.resp.mid:''}`;
  const sid     = document.getElementById('f25-settle').value;
  const s       = settlements.find(x => x.id == sid);
  const sDate   = document.getElementById('f25-sdate').value;
  const date    = document.getElementById('f25-date').value;
  const terms   = s ? s.terms : (document.getElementById('f25-terms').value || '______________________________');
  const sdt     = parseDt(sDate);
  const dt      = parseDt(date);
  const pb      = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pbName  = pb ? pb.name.toUpperCase() : '';
  const header  = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
  const caption = buildCaption(c);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16), caption, hRule(),
      para('NOTICE OF EXECUTION', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([
        { text: 'WHEREAS, on ' },
        { text: fmtDate(sDate), bold: true, underline: true },
        { text: ', an amicable settlement was signed by the parties in the above-entitled case (or an arbitration award rendered by the Punong Barangay/Pangkat ng Tagapagkasundo):' },
      ], { size: 24, after: 60 }),
      para('WHEREAS, the terms and conditions of the settlement, the dispositive portion of the award, read:', { size: 24, after: 60 }),
      ...(terms ? [para(terms, { size: 24, after: 80 })] : blankLines(4)),
      para('The said settlement/award is now final and executory;', { size: 24, after: 60 }),
      mixedPara([
        { text: 'WHEREAS, the party obliged ' },
        { text: '______________________________', underline: true },
        { text: ' has not complied voluntarily with the aforestated amicable settlement/arbitration award, within the period of five (5) days from the date of hearing on the motion for execution;' },
      ], { size: 24, after: 80 }),
      mixedPara([
        { text: 'NOW, THEREFORE, in behalf of the Lupong Tagapamayapa and by virtue of the powers vested upon me and the Lupon by the Katarungang Pambarangay Law and Rule, I shall cause to be realized from the goods and personal property of ' },
        { text: '______________________________', underline: true },
        { text: ' the sum of ' },
        { text: '______________________________', underline: true },
        { text: ' agreed upon in the said amicable settlement (or adjudged in the arbitration award) unless voluntary compliance of said settlement or award shall have been made upon receipt hereof.' },
      ], { size: 24, after: 80 }),
      mixedPara([
        { text: 'Signed this ' }, { text: dt.day, bold: true, underline: true },
        { text: ' day of ' }, { text: dt.month, bold: true, underline: true },
        { text: ' 20' }, { text: dt.year.slice(-2), bold: true, underline: true }, { text: '.' },
      ], { size: 24, after: 80 }),
      ...sigLine(pbName, 'Punong Barangay', AlignmentType.LEFT),
      spacer(8),
      para('Copy furnished:', { bold: true, size: 24, before: 40, after: 40 }),
      twoSig(cn, 'Complainant/s', rn, 'Respondent/s'),
    ],
  }] });
  await saveDocx(doc, `Form25-NoticeOfExecution-${c.caseNo}`);
}

/* ════════════════════════════════════
   FORM 2 — APPOINTMENT
════════════════════════════════════ */
 
async function exportAppointmentDocx(memberId) {
  const m = members.find(x => x.id === memberId);
  if (!m) { toast('Member not found.', '#b22222'); return; }
 
  const pb   = document.getElementById('f2-pb').value.trim()  || '______________________________';
  const sec  = document.getElementById('f2-sec').value.trim() || '______________________________';
  const date = document.getElementById('f2-date').value;
  const dt   = parseDt(date);
  const header = await buildKpHeader();
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16),
      para(`${dt.ordDay} day of ${dt.month}, ${dt.year}`, { align: AlignmentType.RIGHT, size: 22, after: 80 }),
      para('APPOINTMENT', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([{ text: 'TO: ' }, { text: m.name, bold: true }], { size: 24, after: 80 }),
      mixedPara([
        { text: 'Pursuant to Chapter 7, Title One, Book III, Local Government Code of 1991 (Republic Act No. 7160), you are hereby appointed ' },
        { text: 'MEMBER of the Lupong Tagapamayapa', bold: true },
        { text: ' of this Barangay effective upon taking your oath of office and until a new Lupon is constituted on the third year following your appointment.' },
      ], { size: 24, after: 80 }),
      ...sigLine(pb, 'Punong Barangay', AlignmentType.LEFT),
      spacer(12),
      para('ATTESTED:', { bold: true, size: 24, before: 60, after: 40 }),
      ...sigLine(sec, 'Barangay Secretary', AlignmentType.LEFT),
    ],
  }] });
  await saveDocx(doc, `Form2-Appointment-${m.name.replace(/\s+/g, '-')}`);
}
 
 
/* ════════════════════════════════════
   FORM 3 — NOTICE OF APPOINTMENT
════════════════════════════════════ */
 
async function exportNoticeAppointmentDocx() {
  try {
    console.log('Starting export...');
    const selected = Array.from(document.getElementById('f3-member').selectedOptions);
    console.log('Selected members:', selected.length);
    if (!selected.length) { toast('Select at least one member.', '#b22222'); return; }
 
  const oathDate = document.getElementById('f3-oath').value;
  const sec      = document.getElementById('f3-sec').value.trim() || '______________________________';
  const date     = document.getElementById('f3-date').value;
  const dt       = parseDt(date);
  const odt      = parseDt(oathDate);
  const header   = await buildKpHeader('OFFICE OF THE PUNONG BARANGAY');
    console.log('Header built successfully');
  // Create paragraphs for each member name
  const memberParas = selected.map(option => {
    const m = members.find(x => x.id == option.value);
    return m ? para(m.name, { size: 24, after: 10, underline: true }) : null;
  }).filter(p => p);
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16),
      para(`${dt.ordDay} day of ${dt.month}, ${dt.year}`, { align: AlignmentType.RIGHT, size: 22, after: 80 }),
      ...memberParas,
      para('Sir/Madam:', { size: 24, after: 60 }),
      para('NOTICE OF APPOINTMENT', { bold: true, size: 24, before: 60, after: 80, align: AlignmentType.CENTER }),
      mixedPara([
        { text: 'Please be informed that you have been appointed by the Punong Barangay as a ' },
        { text: 'MEMBER OF THE LUPONG TAGAPAMAYAPA', bold: true },
        { text: ', effective upon taking your oath of office, and until a new Lupon is constituted on the third year following your appointment. You may take your oath of office before the Punong Barangay on ' },
        { text: `${odt.ordDay} day of ${odt.month}, ${odt.year}`, bold: true, underline: true },
        { text: '.' },
      ], { size: 24, after: 80 }),
      para('Very truly yours,', { size: 24, after: 80 }),
      ...sigLine(sec, 'Barangay Secretary', AlignmentType.LEFT),
    ],
  }] });
  console.log('Document created successfully');
  const filename = selected.length === 1 
    ? `Form3-NoticeAppointment-${members.find(x => x.id == selected[0].value)?.name.replace(/\s+/g, '-') || 'Unknown'}`
    : `Form3-NoticeAppointment-Multiple`;
  console.log('Calling saveDocx with filename:', filename);
  await saveDocx(doc, filename);
  console.log('saveDocx completed');
  } catch (error) {
    console.error('Export error:', error);
    toast('Export failed: ' + error.message, '#b22222');
  }
}
 
 
/* ════════════════════════════════════
   FORM 4 — LIST OF APPOINTED LUPON MEMBERS
════════════════════════════════════ */
 
async function exportListLuponMembersDocx() {
  const pbMember = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const secMember = members.find(m => m.role === 'Barangay Secretary' || m.role === 'Lupon Secretary');
  const pb = pbMember ? pbMember.name : '______________________________';
  const sec = secMember ? secMember.name : '______________________________';
  const pbName = pb.toUpperCase();
  const header = await buildKpHeader();
 
  // Two-column member list table
  const luponMembers = members.filter(m => m.role === 'Lupon Member');
  const slots = Array.from({ length: 20 }, (_, i) => luponMembers[i] ? luponMembers[i].name : '');
 
  const memberRows = Array.from({ length: 10 }, (_, i) => {
    const lName = slots[i]      || '';
    const rName = slots[i + 10] || '';
    return new TableRow({ children: [
      new TableCell({ borders: NO_BORDER, width: { size: 4680, type: WidthType.DXA }, children: [
        mixedPara([
          { text: `${i + 1}.  ` },
          { text: lName || '______________________________', bold: !!lName, underline: !lName },
        ], { size: 24, after: 40 }),
      ]}),
      new TableCell({ borders: NO_BORDER, width: { size: 4680, type: WidthType.DXA }, children: [
        mixedPara([
          { text: `${i + 11}.  ` },
          { text: rName || '______________________________', bold: !!rName, underline: !rName },
        ], { size: 24, after: 40 }),
      ]}),
    ]});
  });
 
  const memberTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: memberRows,
  });
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16),
      para('LIST OF APPOINTED LUPON MEMBERS', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      para('Listed hereunder are the duly appointed members of the Lupong Tagapamayapa in this Barangay who shall serve as such upon taking their oath of office and until a new Lupon is constituted on the third year following their appointment.', { size: 24, after: 80 }),
      memberTable,
      spacer(16),
      ...sigLine(pbName, 'Punong Barangay', AlignmentType.LEFT),
      spacer(12),
      para('Attested:', { bold: true, size: 24, before: 60, after: 40 }),
      ...sigLine(sec, 'Barangay / Lupon Secretary', AlignmentType.LEFT),
      spacer(8),
      para('IMPORTANT: This list shall be posted in three (3) conspicuous places in the barangay for the duration of the terms of office of those named above.', { size: 18, italic: true }),
      para('WARNING: Tearing or defacing this notice shall be subject to punishment according to law.', { size: 18, italic: true }),
    ],
  }] });
  await saveDocx(doc, 'Form4-ListLuponMembers');
}
 
 
/* ════════════════════════════════════
   FORM 5 — OATH OF OFFICE
════════════════════════════════════ */
 
async function exportOathOfOfficeDocx(memberId) {
  const m = members.find(x => x.id === memberId);
  if (!m) { toast('Member not found.', '#b22222'); return; }
 
  const pbMember = members.find(x => x.role === 'Punong Barangay (Chairperson)');
  const pbInput = document.getElementById('f5-pb');
  const pb = (pbInput && pbInput.value.trim()) || (pbMember ? pbMember.name : '______________________________');
  const dateInput = document.getElementById('f5-date').value;
  const date = dateInput ? new Date(dateInput + 'T00:00:00') : new Date();
  const day = String(date.getDate());
  const month = date.toLocaleString('en-PH', { month: 'long' });
  const year = date.getFullYear().toString().slice(-2);
  const header = await buildKpHeader('OFFICE OF THE PUNONG BARANGAY');
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16),
      para('OATH OF OFFICE', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([
        { text: 'Pursuant to Chapter 7, Title One, Book III, Local Government Code of 1991 (Republic Act 7160), I ' },
        { text: m.name, bold: true },
        { text: ', being duly qualified and having been duly appointed ' },
        { text: 'MEMBER of the Lupong Tagapamayapa', bold: true },
        { text: ' of this Barangay, do hereby solemnly swear (or affirm) that I will faithfully and conscientiously discharge to the best of my ability my duties and functions as such member and as member of the Pangkat ng Tagapagkasundo in which I may be chosen to serve; that I will bear true faith and allegiance to the Republic of the Philippines; that I will support and defend its Constitution and obey the laws, legal orders and decrees promulgated by its duly constituted authorities; and that I voluntarily impose upon myself this obligation without any mental reservation or purpose of evasion.' },
      ], { size: 24, after: 80 }),
      para('SO HELP ME GOD.', { bold: true, size: 24, after: 20 }),
      para('(In case of affirmation the last sentence will be omitted.)', { italic: true, size: 20, after: 80 }),
      ...sigLine(m.name, 'Member', AlignmentType.LEFT),
      spacer(12),
      mixedPara([
        { text: 'SUBSCRIBED AND SWORN TO (or affirmed) before me this ' },
        { text: day, bold: true, underline: true },
        { text: ' day of ' },
        { text: month, bold: true, underline: true },
        { text: ', 20' },
        { text: year, bold: true, underline: true },
        { text: '.' },
      ], { size: 24, before: 60, after: 80 }),
      ...sigLine(pb, 'Punong Barangay', AlignmentType.LEFT),
    ],
  }] });
  await saveDocx(doc, `Form5-OathOfOffice-${m.name.replace(/\s+/g, '-')}`);
}
 
 
/* ════════════════════════════════════
   FORM 6 — WITHDRAWAL OF APPOINTMENT
════════════════════════════════════ */
 
async function exportWithdrawalDocx(memberId) {
  const m = members.find(x => x.id === memberId);
  if (!m) { toast('Member not found.', '#b22222'); return; }
 
  const ground = document.getElementById('f6-ground').value;
  const detail = document.getElementById('f6-detail').value.trim();
  const pb     = document.getElementById('f6-pb').value.trim() || '______________________________';
  const date   = document.getElementById('f6-date').value;
  const dt     = parseDt(date);
  const header = await buildKpHeader('OFFICE OF THE LUPONG TAGAPAMAYAPA');
 
  const groundItem = (g, label) => {
    const checked = ground === g;
    const txt = checked
      ? `[✓] ${label}${detail ? ' as shown by ' + detail : ' as shown by ___________________'}`
      : `[   ] ${label} as shown by ___________________`;
    return para(txt, { size: 24, bold: checked, after: 60 });
  };
 
  const conformeCell = (label) => new TableCell({
    borders: NO_BORDER,
    width: { size: 4680, type: WidthType.DXA },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 200 },
        children: [
          new TextRun({ text: `${label}. `, font: FONT, size: 22 }),
          new TextRun({
            text: '                              ',
            font: FONT,
            size: 22,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
      }),
    ],
  });

  // 11 signature lines for concurring members (2 per row)
  const conformeRows = Array.from({ length: 5 }, (_, i) => {
    const l = i * 2 + 1;
    const r = l + 1;
    return new TableRow({ children: [
      conformeCell(l),
      r <= 11
        ? conformeCell(r)
        : new TableCell({
            borders: NO_BORDER,
            width: { size: 4680, type: WidthType.DXA },
            children: [para('', { size: 22 })],
          }),
    ]});
  });
 
  const conformeTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: conformeRows,
  });
 
  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16),
      para('WITHDRAWAL OF APPOINTMENT', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([{ text: 'TO: ' }, { text: m.name, bold: true, underline: true }], { size: 24, after: 80 }),
      para('After due hearing and with the concurrence of a majority of all the Lupong Tagapamayapa members of this Barangay, your appointment as member thereof is hereby withdrawn effective upon receipt hereof, on the following ground/s:', { size: 24, after: 60 }),
      groundItem('incapacity', 'incapacity to discharge the duties of your office'),
      groundItem('unsuitability', 'unsuitability by reason of'),
      mixedPara([
        { text: 'This ' }, { text: dt.ordDay, bold: true },
        { text: ' day of ' }, { text: dt.month, bold: true },
        { text: ', ' + dt.year + '.' },
      ], { size: 24, before: 60, after: 80 }),
      ...sigLine(pb, 'Punong Barangay / Lupon Chairman', AlignmentType.LEFT),
      spacer(12),
      para('CONFORME (Signatures of concurring Lupon Members):', { bold: true, size: 22, before: 60, after: 60 }),
      conformeTable,
      spacer(8),
      mixedPara([
        { text: 'Received this ' },
        { text: dt.day, underline: true },
        { text: ' day of ' },
        { text: dt.month, underline: true },
        { text: ', 20' },
        { text: dt.year.slice(-2), underline: true },
        { text: '.' },
      ], { size: 24, before: 60, after: 80 }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({
            text: '                               ',
            font: FONT,
            size: 22,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
      }),
      para('(Signature of withdrawn member)', { align: AlignmentType.LEFT, size: 22 }),
      spacer(8),
      para('NOTE: The members of the Lupon conforming to the withdrawal must personally affix their signatures or thumb marks. The withdrawal must be conformed to by more than one-half of the total number of members of the Lupon including the Punong Barangay and the member concerned.', { size: 18, italic: true }),
    ],
  }] });
  await saveDocx(doc, `Form6-Withdrawal-${m.name.replace(/\s+/g, '-')}`);
}
 
 
/* ════════════════════════════════════
   FORM 1 — NOTICE TO CONSTITUTE THE LUPON (Legal Size)
════════════════════════════════════ */
 
async function exportNoticeConstituteDocx() {
  const date     = document.getElementById('f1-date').value;
  const deadline = document.getElementById('f1-deadline').value;
  const pbMember = members.find(m => m.role === 'Punong Barangay (Chairperson)');
  const pb       = pbMember ? pbMember.name : '______________________________';
  const nominees = Array.from({ length: 25 }, (_, i) => {
    const el = document.getElementById('f1-n' + (i + 1));
    return el ? el.value.trim() : '';
  });
  const dt  = parseDt(date);
  const ddt = parseDt(deadline);

  // Custom header for Form 1
  const brgyBytes = await fetchImageBytes('assets/logo.png');
  const gensanBytes = await fetchImageBytes('assets/magandang-gensan-logo.png');
  const logoSize = 914400;
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
    para('OFFICE OF THE PUNONG BARANGAY', { align: AlignmentType.CENTER, size: 22, bold: true }),
  ];
  const header = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [1440, 5760, 1440],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: [new TableRow({
      children: [
        new TableCell({ borders: NO_BORDER, children: [brgyImg] }),
        new TableCell({ borders: NO_BORDER, children: centerText }),
        new TableCell({ borders: NO_BORDER, children: [gensanImg] }),
      ],
    })],
  });
 
  // Two-column nominee table: 1-13 left, 14-25 right
  const nomineeRows = Array.from({ length: 13 }, (_, i) => {
    const lName = nominees[i]      || '';
    const rName = i + 13 < 25 ? (nominees[i + 13] || '') : null;
    return new TableRow({ children: [
      new TableCell({ borders: NO_BORDER, width: { size: 700, type: WidthType.DXA }, children: [
        para(`${i + 1}.`, { size: 22, after: 40 }),
      ]}),
      new TableCell({ borders: NO_BORDER, width: { size: 3980, type: WidthType.DXA }, children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 } },
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: lName, font: FONT, size: 22, bold: !!lName })],
        }),
      ]}),
      new TableCell({ borders: NO_BORDER, width: { size: 700, type: WidthType.DXA }, children: [
        rName !== null ? para(`${i + 14}.`, { size: 22, after: 40 }) : spacer(4),
      ]}),
      new TableCell({ borders: NO_BORDER, width: { size: 3980, type: WidthType.DXA }, children: [
        rName !== null
          ? new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 } },
              spacing: { before: 0, after: 80 },
              children: [new TextRun({ text: rName, font: FONT, size: 22, bold: !!rName })],
            })
          : spacer(4),
      ]}),
    ]});
  });
 
  const nomineeTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [700, 3980, 700, 3980],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: nomineeRows,
  });
 
  const doc = new Document({ sections: [{ properties: { page: {
    size: { width: 12240, height: 20160 },  // Legal size
    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
  }},
    children: [
      header, spacer(16),
      para(`${dt.month} ${dt.day}, ${dt.year}`, { align: AlignmentType.RIGHT, size: 22, after: 80 }),
      para('NOTICE TO CONSTITUTE THE LUPON', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      para('To All Barangay Members and All Other Persons Concerned:', { bold: true, size: 24, after: 60 }),
      para('In compliance with Section 1 (a), Chapter, Title One, Book III, Local Government Code of 1991 (Republic Act 7160), of the Katarungang Pambarangay Law, notice is hereby given to constitute the Lupong Tagapamayapa of this Barangay. The persons I am considering for appointment are the following:', { size: 24, after: 80 }),
      nomineeTable,
      spacer(8),
      para('They have been chosen on the basis of their suitability for the task of conciliation considering their integrity, impartiality, independence of mind, sense of fairness and reputation for probity in view of their age, social standing in the community, tact, patience, resourcefulness, flexibility, open mindedness and other relevant factors. The law provides that only those actually residing or working in the barangay who are not expressly disqualified by law are qualified to be appointed as Lupon members.', { size: 24, after: 80 }),
      mixedPara([
        { text: 'All persons are hereby enjoined to immediately inform me of their opposition to or endorsement of any or all proposed members or recommend to me other persons not included on the list but not later than the day ' },
        { text: ddt.day, underline: true },
        { text: ' day of ' },
        { text: ddt.month, underline: true },
        { text: ', 20' },
        { text: ddt.year.slice(-2), underline: true },
        { text: ' (the last day for posting this notice).' },
      ], { size: 24, after: 80 }),
      ...sigLine(pb, 'Punong Barangay', AlignmentType.LEFT),
      spacer(12),
      para('IMPORTANT: This notice is required to be posted in three (3) conspicuous places in the barangay for at least three (3) weeks.', { size: 18, italic: true }),
      para('WARNING: Tearing or defacing this notice shall be subject to punishment according to law.', { size: 18, italic: true }),
    ],
  }] });
  await saveDocx(doc, 'Form1-NoticeConstitute');
}

async function exportMonthlyTransmittalDocx() {
  const date  = document.getElementById('f28-date').value;
  const judge = document.getElementById('f28-judge').value.trim() || '______________________________';
  const city  = document.getElementById('f28-city').value.trim()  || cfg.muni;
  const sec   = document.getElementById('f28-sec').value.trim()   || '______________________________';
  const dt    = parseDt(date);

  const settled = cases.filter(c => c.status === 'Settled' || c.status === 'Escalated');
  const header  = await buildKpHeader();

  const STD = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
  const borders = { top: STD, bottom: STD, left: STD, right: STD };

  const headerRow = new TableRow({ children: [
    new TableCell({ borders, width: { size: 500, type: WidthType.DXA },  shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, children: [para('#', { bold: true, size: 22, align: AlignmentType.CENTER })] }),
    new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, children: [para('Barangay Case No.', { bold: true, size: 22 })] }),
    new TableCell({ borders, width: { size: 6860, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, children: [para('Title (Complainant, et al. vs. Respondent, et al.)', { bold: true, size: 22 })] }),
  ]});

  const dataRows = Array.from({ length: 10 }, (_, i) => {
    const c = settled[i];
    return new TableRow({ children: [
      new TableCell({ borders, width: { size: 500,  type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, children: [para(String(i + 1), { size: 22, align: AlignmentType.CENTER })] }),
      new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, children: [para(c ? c.caseNo : '', { size: 22 })] }),
      new TableCell({ borders, width: { size: 6860, type: WidthType.DXA }, shading: { fill: 'FFFFFF', type: ShadingType.CLEAR }, children: [para(c ? `${c.comp.last}, et al. vs. ${c.resp.last}, et al.` : '', { size: 22 })] }),
    ]});
  });

  const table = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [500, 2000, 6860],
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    children: [
      header, spacer(16),
      para('OFFICE OF THE LUPONG TAGAPAMAYAPA', { align: AlignmentType.CENTER, bold: true, size: 22, after: 0 }),
      para('OFFICE OF THE BARANGAY CAPTAIN', { align: AlignmentType.CENTER, bold: true, size: 22, after: 80 }),
      para(`${dt.ordDay} day of ${dt.month}, ${dt.year}`, { align: AlignmentType.RIGHT, size: 22, after: 80 }),
      para('MONTHLY TRANSMITTAL OF FINAL REPORTS', { align: AlignmentType.CENTER, bold: true, size: 26, before: 80, after: 80 }),
      mixedPara([{ text: 'To: City/Municipal Judge ' }, { text: judge, bold: true }], { size: 24, after: 10 }),
      para(`(${city})`, { italic: true, size: 22, before: 0, after: 80 }),
      para('Enclosed herewith are the final reports of settlement of disputes and arbitration awards made by the Barangay Captain/Pangkat Tagapagkasundo in the following cases:', { size: 24, after: 80 }),
      table,
      spacer(16),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
        rows: [new TableRow({ children: [
          new TableCell({ borders: NO_BORDER, width: { size: 4680, type: WidthType.DXA }, children: [spacer(4)] }),
          new TableCell({ borders: NO_BORDER, width: { size: 4680, type: WidthType.DXA }, children: [
            spacer(20),
            new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } }, spacing: { before: 0, after: 40 }, children: [new TextRun({ text: sec, font: FONT, size: 22 })] }),
            para('Lupon/Pangkat Secretary', { align: AlignmentType.CENTER, size: 22 }),
          ]}),
        ]})],
      }),
      spacer(12),
      para(`IMPORTANT: Lupon/Pangkat Secretary shall transmit not later than the first five days of each month the final reports for preceding month.`, { size: 24, before: 60, after: 80 }),

    ],
  }] });

  await saveDocx(doc, 'Form28-MonthlyTransmittal');
}

/* ════════════════════════════════════
   TRACER — CASE DOCKET RECORD
════════════════════════════════════ */
 
async function exportTracerDocx() {
  const caseNo = gv('tr-caseno');
  const cname  = gv('tr-cname');
  const rname  = gv('tr-rname');
  if (!caseNo || !cname || !rname) { toast('Fill in Case No., Complainant, and Respondent.', '#b22222'); return; }
 
  const STD   = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
  const bdr   = { top: STD, bottom: STD, left: STD, right: STD };
  const SHDE  = 'F5F0E8';
  const CW    = 11520;
 
  const ft = (t) => { if (!t) return ''; const [h,m]=t.split(':'); const hr=parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; };
  const fd = (d) => { if (!d) return ''; return new Date(d+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}).toUpperCase(); };
 
  const cell = (children, opts={}) => new TableCell({
    borders: opts.noBdr ? NO_BORDER : bdr,
    width: opts.w ? { size: opts.w, type: WidthType.DXA } : undefined,
    shading: { fill: opts.fill || 'FFFFFF', type: ShadingType.CLEAR },
    columnSpan: opts.span || 1,
    rowSpan: opts.rs || 1,
    verticalAlign: opts.va || VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: Array.isArray(children) ? children : [children],
  });
 
  const cp = (text, opts={}) => new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: 0, after: opts.after || 0 },
    children: [new TextRun({ text: String(text||''), font: FONT, size: opts.size||18, bold: opts.bold||false, color: opts.color||'000000' })],
  });
 
  // ── Logos ──
  const brgyBytes = await fetchImageBytes('assets/lupon-logo.png');
 
  // ── Left box: logo + title + TOC ──
  const leftChildren = [];
 
  // Logo + title on same line using inline image
  if (brgyBytes) {
    leftChildren.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 20 },
      children: [
        new ImageRun({ data: brgyBytes, transformation: { width: 50, height: 50 }, type: 'png' }),
        new TextRun({ text: '  LUPONG TAGAPAMAYAPA', font: FONT, size: 28, bold: true }),
      ],
    }));
  } else {
    leftChildren.push(cp('LUPONG TAGAPAMAYAPA', { bold: true, size: 28, after: 20 }));
  }
 
  leftChildren.push(
    cp(cfg.brgy, { bold: true, size: 22, after: 20 }),
    // TABLE OF CONTENTS inner box — simulated with border paragraph
    new Paragraph({ spacing: { before: 0, after: 6 }, border: { top: STD, bottom: STD, left: STD, right: STD }, children: [new TextRun({ text: 'TABLE OF CONTENTS', font: FONT, size: 20, bold: true, color: 'C00000' })] }),
    cp('', { after: 6 }),
    cp('MEDIATION (PB)', { bold: true, size: 16, after: 6 }),
    cp('Complaint form---------------------------------1', { size: 14, after: 2 }),
    cp('1st Notice of hearing to Complainant----2', { size: 14, after: 2 }),
    cp('Summon for respondent---------------------3', { size: 14, after: 2 }),
    cp('Minutes of the Proceedings-----------------4', { size: 14, after: 2 }),
    cp('Amicable settlement -----------------------5', { size: 14, after: 0 }),
  );
 
  // ── Blue box: case info ──
  const blueChildren = [
    cp('', { after: 20 }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 }, children: [
      new TextRun({ text: 'Barangay case no. ', font: FONT, size: 18 }),
      new TextRun({ text: caseNo, font: FONT, size: 20, bold: true }),
    ]}),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [
      new TextRun({ text: 'For: ', font: FONT, size: 18 }),
      new TextRun({ text: gv('tr-nature').toUpperCase(), font: FONT, size: 18, bold: true }),
    ]}),
    cp('', { after: 20 }),
    cp(cname.toUpperCase(), { bold: true, size: 18, align: AlignmentType.CENTER, after: 16 }),
    cp('VS.', { bold: true, size: 22, align: AlignmentType.CENTER, after: 16 }),
    cp(rname.toUpperCase(), { bold: true, size: 18, align: AlignmentType.CENTER, after: 20 }),
    cp('', { after: 0 }),
  ];
 
  const topTable = new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [6500, 5020],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [
      cell(leftChildren, { noBdr: false, w: 6500, fill: 'FFFFFF' }),
      cell(blueChildren, { w: 5020, fill: '00BFFF' }),
    ]})],
  });
 
  // ── TRACER bar ──
  const tracerTable = new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [7000, 4520],
    rows: [new TableRow({ children: [
      cell(cp('TRACER', { bold: true, size: 36 }), { fill: 'FFFFFF' }),
      cell(new Paragraph({ alignment: AlignmentType.RIGHT, spacing:{before:0,after:0}, children: [new TextRun({ text: 'O.R.#: ', font: FONT, size: 20 }), new TextRun({ text: gv('tr-or')||'___________', font: FONT, size: 24, bold: true })] }), { fill: 'FFFFFF' }),
    ]})],
  });
 
  // ── Parties table ──
  const partiesTable = new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [1200, 1800, 2760, 1200, 1800, 2760],
    rows: [
      new TableRow({ children: [cell(cp('COMPLAINANT/S',{bold:true,size:18}),{span:3,fill:SHDE}), cell(cp('RESPONDENT/S',{bold:true,size:18}),{span:3,fill:SHDE})] }),
      new TableRow({ children: [cell(cp('Name:',{bold:true,size:16}),{fill:SHDE}), cell(cp(cname,{bold:true,size:18}),{span:2}), cell(cp('Name:',{bold:true,size:16}),{fill:SHDE}), cell(cp(rname,{bold:true,size:18}),{span:2})] }),
      new TableRow({ children: [cell(cp('Add:',{size:16}),{fill:SHDE}), cell(cp(gv('tr-caddr'),{size:16}),{span:2}), cell(cp('Add:',{size:16}),{fill:SHDE}), cell(cp(gv('tr-raddr'),{size:16}),{span:2})] }),
      new TableRow({ children: [cell(cp('CP no.',{size:16}),{fill:SHDE}), cell(cp(gv('tr-ctel'),{size:16}),{span:2}), cell(cp('CP no.',{size:16}),{fill:SHDE}), cell(cp(gv('tr-rtel'),{size:16}),{span:2})] }),
      new TableRow({ children: [cell(cp('Date of Filed:',{size:16}),{fill:SHDE}), cell(cp(fd(gv('tr-filed')),{bold:true,size:16})), cell(cp('Date of Summon:',{size:16}),{fill:SHDE,span:1}), cell(cp('',{size:16}),{fill:SHDE}), cell(cp(fd(gv('tr-sumdate')),{bold:true,size:16}),{span:2})] }),
      new TableRow({ children: [cell(cp('Time:',{size:16}),{fill:SHDE}), cell(cp(ft(gv('tr-filedtime')),{size:16}),{span:2}), cell(cp('Time:',{size:16}),{fill:SHDE}), cell(cp(ft(gv('tr-sumtime')),{size:16}),{span:2})] }),
      new TableRow({ children: [cell(cp('Summon Received by: '+(gv('tr-sumby')||''),{size:16}),{span:3}), cell(cp('Relation to Respondent: '+(gv('tr-sumrel')||''),{size:16}),{span:3})] }),
    ],
  });
 
  // ── Mediation table ──
  const mRowD = (seq,dId,tId,dispId,remId) => { const disp=gv(dispId); return new TableRow({ children: [cell(cp(seq,{size:16}),{fill:SHDE}), cell(cp(fd(gv(dId)),{size:16})), cell(cp(ft(gv(tId)),{size:16})), cell(cp(disp,{bold:disp==='Settled',size:16})), cell(cp(gv(remId),{size:16}))] }); };
 
  const mediationTable = new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [500, 2400, 1800, 2400, 3220, 1200],
    rows: [
      new TableRow({ children: [cell(cp('MEDIATION',{bold:true,size:18}),{span:3,fill:SHDE}), cell(cp('DISPOSITION',{bold:true,size:16,align:AlignmentType.CENTER}),{fill:SHDE}), cell(cp('REMARKS',{bold:true,size:16}),{fill:SHDE}), cell(cp('NUMBER OF DAYS IN BRGY.',{bold:true,size:13,align:AlignmentType.CENTER}),{fill:SHDE})] }),
      new TableRow({ children: [cell(cp('Schedule of Hearing',{size:14}),{fill:SHDE}), cell(cp('',{size:14}),{fill:SHDE}), cell(cp('Time of Hearing',{size:14}),{fill:SHDE}), cell(cp('',{size:14})), cell(cp('',{size:14})), cell(cp('',{size:14}))] }),
      new TableRow({ children: [cell(cp('1st',{size:16}),{fill:SHDE}), cell(cp(fd(gv('m1-date')),{size:16})), cell(cp(ft(gv('m1-time')),{size:16})), cell(cp(gv('m1-disp'),{bold:gv('m1-disp')==='Settled',size:16})), cell(cp(gv('m1-rem'),{size:16})), cell(cp(gv('tr-days')||'',{bold:true,size:28,align:AlignmentType.CENTER}),{rs:3,va:VerticalAlign.CENTER})] }),
      new TableRow({ children: [cell(cp('2nd',{size:16}),{fill:SHDE}), cell(cp(fd(gv('m2-date')),{size:16})), cell(cp(ft(gv('m2-time')),{size:16})), cell(cp(gv('m2-disp'),{bold:gv('m2-disp')==='Settled',size:16})), cell(cp(gv('m2-rem'),{size:16}))] }),
      new TableRow({ children: [cell(cp('3rd',{size:16}),{fill:SHDE}), cell(cp(fd(gv('m3-date')),{size:16})), cell(cp(ft(gv('m3-time')),{size:16})), cell(cp(gv('m3-disp'),{bold:gv('m3-disp')==='Settled',size:16})), cell(cp(gv('m3-rem'),{size:16}))] }),
    ],
  });
 
  // ── Conciliation table ──
  const pangkatCell = cell([
    cp('PANGKAT NG TAGAPAGKASUNDO', { bold: true, size: 16, align: AlignmentType.CENTER, after: 60 }),
    cp('Chairman:', { size: 14, after: 10 }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 } }, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: gv('tr-pchair')||'', font: FONT, size: 14 })] }),
    cp('Secretary:', { size: 14, after: 10 }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 } }, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: gv('tr-psec')||'', font: FONT, size: 14 })] }),
    cp('Member:', { size: 14, after: 10 }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 } }, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: gv('tr-pmem')||'', font: FONT, size: 14 })] }),
  ], { rs: 5, va: VerticalAlign.CENTER });
 
  const cRowD = (seq,dId,tId,dispId,remId) => { const disp=gv(dispId); return new TableRow({ children: [cell(cp(seq,{size:16}),{fill:SHDE}), cell(cp(fd(gv(dId)),{size:16})), cell(cp(ft(gv(tId)),{size:16})), cell(cp(disp,{bold:disp==='Settled'||disp==='CFA Issued',size:16}),{span:2})] }); };
 
  const conciliationTable = new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [500, 2400, 1800, 2000, 2400, 2420],
    rows: [
      new TableRow({ children: [cell(cp('CONCILIATION',{bold:true,size:18}),{span:2,fill:SHDE}), cell(cp('',{size:14}),{fill:SHDE}), cell(cp('',{size:14}),{span:2}), pangkatCell] }),
      new TableRow({ children: [cell(cp('Schedule of Hearing',{size:14}),{fill:SHDE}), cell(cp('',{size:14}),{fill:SHDE}), cell(cp('Time of Hearing',{size:14}),{fill:SHDE}), cell(cp('',{size:14}),{span:2})] }),
      cRowD('1st','c1-date','c1-time','c1-disp','c1-rem'),
      cRowD('2nd','c2-date','c2-time','c2-disp','c2-rem'),
      cRowD('Ext.','c3-date','c3-time','c3-disp','c3-rem'),
      new TableRow({ children: [
        cell(new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:'Date of Transmittal of Settlement to court:  ',font:FONT,size:16}),new TextRun({text:fd(gv('tr-transmit')),font:FONT,size:16,bold:true})]}),{span:3}),
        cell(new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:'Received:  ',font:FONT,size:16}),new TextRun({text:gv('tr-recvd')||'',font:FONT,size:16,bold:true})]}),{span:2}),
      ]}),
    ],
  });
 
  const doc = new Document({ sections: [{ properties: { page: {
    size: { width: 12240, height: 20160 },
    margin: { top: 720, right: 720, bottom: 720, left: 720 },
  }},
    children: [topTable, spacer(8), tracerTable, partiesTable, mediationTable, conciliationTable],
  }] });
 
  await saveDocx(doc, `Tracer-${caseNo}`);
}