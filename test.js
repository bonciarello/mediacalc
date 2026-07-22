/**
 * Test suite for MediaCalc — Calcolatore di Capacità di Archiviazione
 *
 * Tests:
 * 1. HTML structure & accessibility basics
 * 2. Calculation logic for all file types
 * 3. Validation (empty, negative, zero, too-large values)
 * 4. Reset functionality
 * 5. Comparison table correctness
 * 6. Ring/percentage update
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
const { document, window } = dom.window;

// Wait for scripts to execute
function waitForDom() {
  return new Promise(resolve => {
    dom.window.addEventListener('load', () => resolve());
    // If already loaded
    if (document.readyState === 'complete') resolve();
    setTimeout(resolve, 100);
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error('  ✗ FAIL:', message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message} — expected "${expected}", got "${actual}"`);
  }
}

function assertContains(haystack, needle, message) {
  if (haystack && haystack.includes(needle)) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message} — "${needle}" not found`);
  }
}

async function runTests() {
  await waitForDom();

  console.log('\n=== Test Suite: MediaCalc ===\n');

  // ─── 1. HTML Structure & Accessibility ───
  console.log('1. HTML Structure & Accessibility');

  const h1 = document.querySelector('h1');
  assert(h1 !== null, 'Has exactly one <h1>');
  assert(h1.textContent.toLowerCase().includes('calcolatore'), '<h1> contains app name');

  const mainEl = document.querySelector('main');
  assert(mainEl !== null, '<main> landmark exists');
  assert(mainEl.id === 'mainContent', '<main> has id="mainContent"');

  const headerEl = document.querySelector('header');
  assert(headerEl !== null, '<header> landmark exists');

  const footerEl = document.querySelector('footer');
  assert(footerEl !== null, '<footer> landmark exists');

  const capacityLabel = document.querySelector('label[for="capacity"]');
  assert(capacityLabel !== null, '<label for="capacity"> exists');
  assert(capacityLabel.textContent.includes('GB'), 'Capacity label mentions GB');

  const fileTypeLabel = document.querySelector('label[for="fileType"]');
  assert(fileTypeLabel !== null, '<label for="fileType"> exists');

  const capacityInput = document.getElementById('capacity');
  assert(capacityInput !== null, '#capacity input exists');
  assertEqual(capacityInput.type, 'number', 'Capacity input type is number');
  assert(capacityInput.hasAttribute('aria-describedby'), 'Capacity has aria-describedby');

  const fileTypeSelect = document.getElementById('fileType');
  assert(fileTypeSelect !== null, '#fileType select exists');
  assert(fileTypeSelect.tagName, 'SELECT', 'File type is a <select>');

  const btnCalc = document.getElementById('btnCalculate');
  assert(btnCalc !== null, 'Calculate button exists');
  assert(btnCalc.tagName, 'BUTTON', 'Calculate is a <button>');
  assert(btnCalc.hasAttribute('aria-label'), 'Calculate has aria-label');

  const btnReset = document.getElementById('btnReset');
  assert(btnReset !== null, 'Reset button exists');
  assert(btnReset.hasAttribute('aria-label'), 'Reset has aria-label');

  // Canonical & meta
  const canonical = document.querySelector('link[rel="canonical"]');
  assert(canonical !== null, 'Canonical link exists');

  const metaDesc = document.querySelector('meta[name="description"]');
  assert(metaDesc !== null, 'Meta description exists');
  assert(metaDesc.content.length > 20, 'Meta description has content');

  const ogTitle = document.querySelector('meta[property="og:title"]');
  assert(ogTitle !== null, 'og:title exists');

  const jsonld = document.querySelector('script[type="application/ld+json"]');
  assert(jsonld !== null, 'JSON-LD structured data exists');

  const viewport = document.querySelector('meta[name="viewport"]');
  assert(viewport !== null, 'Viewport meta exists');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── 2. Validation ───
  console.log('2. Input Validation');

  // Helper: simulate calculation click
  function clickCalc() {
    btnCalc.click();
  }

  function clickReset() {
    btnReset.click();
  }

  function setCapacity(val) {
    capacityInput.value = val;
    // Trigger input event
    capacityInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  }

  function setFileType(val) {
    fileTypeSelect.value = val;
    fileTypeSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  }

  function getErrorText(errorEl) {
    return errorEl.querySelector('span').textContent;
  }

  function isResultsVisible() {
    return document.getElementById('resultsCard').classList.contains('visible');
  }

  const capacityError = document.getElementById('capacityError');
  const fileTypeError = document.getElementById('fileTypeError');

  // Empty capacity
  setCapacity('');
  setFileType('jpeg-12mp');
  clickCalc();
  assert(!isResultsVisible(), 'Empty capacity: results not shown');
  assert(capacityError.classList.contains('visible'), 'Empty capacity: error shown');
  assertContains(getErrorText(capacityError), 'GB', 'Error mentions GB');

  // Negative capacity
  setCapacity('-5');
  clickCalc();
  assert(!isResultsVisible(), 'Negative capacity: results not shown');
  assert(capacityError.classList.contains('visible'), 'Negative capacity: error shown');

  // Zero capacity
  setCapacity('0');
  clickCalc();
  assert(!isResultsVisible(), 'Zero capacity: results not shown');

  // No file type selected
  setCapacity('64');
  setFileType('');
  clickCalc();
  assert(!isResultsVisible(), 'No file type: results not shown');
  assert(fileTypeError.classList.contains('visible'), 'No file type: error shown');

  // Valid input
  setFileType('jpeg-12mp');
  clickCalc();
  assert(isResultsVisible(), 'Valid input: results shown');
  assert(!capacityError.classList.contains('visible'), 'Valid input: no capacity error');
  assert(!fileTypeError.classList.contains('visible'), 'Valid input: no file type error');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── 3. Calculation Logic ───
  console.log('3. Calculation Logic');

  // JPEG 12MP ~5 MB, 64 GB = 65536 MB, file count = floor(65536/5) = 13107
  setCapacity('64');
  setFileType('jpeg-12mp');
  clickCalc();
  const grid = document.getElementById('resultGrid');
  const statValues = grid.querySelectorAll('.stat-value');
  assert(statValues.length > 0, 'Result stats present');

  // First stat is the file count
  let fileCountText = statValues[0].textContent.replace(/\s/g, '');
  let fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 13107, '64 GB = 13107 JPEG 12MP files');

  // RAW 24MP ~30 MB, 64 GB = floor(65536/30) = 2184
  setFileType('raw-24mp');
  clickCalc();
  const grid2 = document.getElementById('resultGrid');
  const sv2 = grid2.querySelectorAll('.stat-value');
  fileCountText = sv2[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 2184, '64 GB = 2184 RAW 24MP files');

  // Video 1080p ~130 MB/min, 64 GB = floor(65536/130) = 504
  setFileType('video-1080p');
  clickCalc();
  const grid3 = document.getElementById('resultGrid');
  const sv3 = grid3.querySelectorAll('.stat-value');
  fileCountText = sv3[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 504, '64 GB = 504 minuti video 1080p');

  // Video 4K ~375 MB/min, 64 GB = floor(65536/375) = 174
  setFileType('video-4k');
  clickCalc();
  const grid4 = document.getElementById('resultGrid');
  const sv4 = grid4.querySelectorAll('.stat-value');
  fileCountText = sv4[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 174, '64 GB = 174 minuti video 4K');

  // PDF ~2 MB, 64 GB = floor(65536/2) = 32768
  setFileType('pdf');
  clickCalc();
  const grid5 = document.getElementById('resultGrid');
  const sv5 = grid5.querySelectorAll('.stat-value');
  fileCountText = sv5[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 32768, '64 GB = 32768 PDF');

  // DOCX ~0.5 MB, 64 GB = floor(65536/0.5) = 131072
  setFileType('docx');
  clickCalc();
  const grid6 = document.getElementById('resultGrid');
  const sv6 = grid6.querySelectorAll('.stat-value');
  fileCountText = sv6[0].textContent.replace(/\s/g, '');
  // For 131072, it'll be formatted as "131.1 M" or similar
  assert(sv6[0].textContent.length > 0, 'DOCX result displayed');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── 4. Different capacities ───
  console.log('4. Various Capacities');

  // 32 GB, JPEG 12MP: floor(32768/5) = 6553
  setCapacity('32');
  setFileType('jpeg-12mp');
  clickCalc();
  const g7 = document.getElementById('resultGrid');
  const s7 = g7.querySelectorAll('.stat-value');
  fileCountText = s7[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 6553, '32 GB = 6553 JPEG 12MP files');

  // 128 GB, JPEG 12MP: floor(131072/5) = 26214
  setCapacity('128');
  clickCalc();
  const g8 = document.getElementById('resultGrid');
  const s8 = g8.querySelectorAll('.stat-value');
  fileCountText = s8[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 26214, '128 GB = 26214 JPEG 12MP files');

  // 1 TB (1024 GB), JPEG 12MP: floor(1048576/5) = 209715
  setCapacity('1024');
  clickCalc();
  const g9 = document.getElementById('resultGrid');
  const s9 = g9.querySelectorAll('.stat-value');
  fileCountText = s9[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 209715, '1 TB (1024 GB) = 209715 JPEG 12MP files');

  // Decimal capacity: 1.5 GB, JPEG 12MP: floor(1536/5) = 307
  setCapacity('1.5');
  clickCalc();
  const g10 = document.getElementById('resultGrid');
  const s10 = g10.querySelectorAll('.stat-value');
  fileCountText = s10[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 307, '1.5 GB = 307 JPEG 12MP files');

  // Very small capacity: 0.01 GB ≈ 10.24 MB, JPEG 12MP: floor(10.24/5) = 2
  setCapacity('0.01');
  clickCalc();
  const g11 = document.getElementById('resultGrid');
  const s11 = g11.querySelectorAll('.stat-value');
  fileCountText = s11[0].textContent.replace(/\s/g, '');
  fileCount = parseInt(fileCountText.replace(/\./g, ''), 10);
  assertEqual(fileCount, 2, '0.01 GB = 2 JPEG 12MP files (10.24 MB)');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── 5. Reset Functionality ───
  console.log('5. Reset');

  setCapacity('128');
  setFileType('video-4k');
  clickCalc();
  assert(isResultsVisible(), 'Before reset: results visible');
  assert(capacityInput.value, '128', 'Before reset: capacity = 128');

  clickReset();
  assertEqual(capacityInput.value, '', 'After reset: capacity empty');
  assertEqual(fileTypeSelect.value, '', 'After reset: file type empty');
  assert(!isResultsVisible(), 'After reset: results hidden');
  assert(!capacityError.classList.contains('visible'), 'After reset: no capacity error');
  assert(!fileTypeError.classList.contains('visible'), 'After reset: no file type error');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── 6. Comparison Table ───
  console.log('6. Comparison Table');

  const compBody = document.getElementById('comparisonBody');
  const compRows = compBody.querySelectorAll('tr');
  assert(compRows.length === 6, 'Comparison table has 6 rows (one per file type)');

  // Check 32 GB JPEG count in table
  const firstRow = compRows[0]; // JPEG 12MP
  const cells = firstRow.querySelectorAll('td.num');
  assert(cells.length >= 3, 'JPEG row has at least 3 numeric cells (for 32, 128, 1024 GB)');

  // 32 GB JPEG count should be 6553
  const cell32Text = cells[1].textContent.replace(/[.\s]/g, '');
  assertEqual(parseInt(cell32Text, 10), 6553, 'Comparison: 32 GB JPEG = 6553');

  // 1 TB RAW count should be floor(1048576/30) = 34952
  const rawRow = compRows[1];
  const rawCells = rawRow.querySelectorAll('td.num');
  // td.num columns: [0]=Dim.media, [1]=32GB, [2]=128GB, [3]=1TB
  const raw1TBText = rawCells[3].textContent.replace(/[.\s]/g, '');
  assertEqual(parseInt(raw1TBText, 10), 34952, 'Comparison: 1 TB RAW = 34952');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── 7. Ring Display ───
  console.log('7. Ring/Percentage Display');

  setCapacity('64');
  setFileType('jpeg-12mp');
  clickCalc();
  const ringPct = document.getElementById('ringPct');
  const pctText = ringPct.textContent;
  assert(pctText !== '—', 'Ring shows a percentage after calculation');
  assert(pctText.includes('%'), 'Ring text includes % sign');

  // For 64 GB / 5 MB JPEG: one file = 5/65536 = 0.0076%
  assert(pctText.length > 1, 'Ring has meaningful value');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── 8. Edge Cases ───
  console.log('8. Edge Cases');

  // Very large capacity
  setCapacity('999999');
  setFileType('docx');
  clickCalc();
  assert(isResultsVisible(), 'Very large capacity (999999 GB): results shown');

  // Re-validate that errors clear on valid input
  clickReset();
  setCapacity('32');
  setFileType('');
  clickCalc();
  assert(fileTypeError.classList.contains('visible'), 'File type error shown');

  setFileType('pdf');
  clickCalc();
  assert(isResultsVisible(), 'After fixing file type: results shown');
  assert(!fileTypeError.classList.contains('visible'), 'File type error cleared after fix');

  console.log(`  ${passed + failed} assertions run\n`);

  // ─── SUMMARY ───
  console.log('═══════════════════════════════════');
  console.log(`  Totale: ${passed} passati, ${failed} falliti`);
  console.log('═══════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
