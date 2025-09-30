const axios = require('axios');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: false });

const db = new Database('ecfr.db');

// ------------------- Helpers -------------------
function computeMetrics(text) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return { wordCount: 0, sentenceCount: 0, avgSentenceLength: 0, lexicalDensity: 0 };

  const words = clean.split(/\s+/);
  const wordCount = words.length;
  const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = wordCount / sentenceCount;
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/gi, ''))).size;
  const lexicalDensity = uniqueWords / wordCount;

  return { wordCount, sentenceCount, avgSentenceLength, lexicalDensity };
}

function checksum(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// ------------------- DB Statements -------------------
const insertAgency = db.prepare(`
  INSERT OR IGNORE INTO agencies (name, short_name, slug, parent_id)
  VALUES (?, ?, ?, ?)
`);
const getAgencyBySlug = db.prepare('SELECT id FROM agencies WHERE slug = ?');

const insertTitleAgency = db.prepare(`
  INSERT OR IGNORE INTO title_agency (title_id, agency_id) VALUES (?, ?)
`);

const getTitleByNumber = db.prepare('SELECT id, number, latest_issue_date FROM titles WHERE number = ?');

const insertTitle = db.prepare(`
  INSERT OR IGNORE INTO titles 
  (number, name, latest_amended_on, latest_issue_date, up_to_date_as_of, reserved, agency_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertSnapshot = db.prepare(`
  INSERT INTO snapshots
  (title_id, retrieved_at, raw_text, word_count, sentence_count, avg_sentence_length, checksum, lexical_density)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// ------------------- Fetch Titles -------------------
async function fetchTitles() {
  const { data } = await axios.get('https://www.ecfr.gov/api/versioner/v1/titles.json');
  console.log(`Fetched ${data.titles.length} titles`);

  for (const t of data.titles) {
    insertTitle.run(
      parseInt(t.number, 10),
      t.name,
      t.latest_amended_on,
      t.latest_issue_date,
      t.up_to_date_as_of,
      t.reserved ? 1 : 0,
      null
    );
  }
  console.log('Titles stored.');
}

// ------------------- Fetch Agencies -------------------
async function insertAgencyRecursive(a, parentId = null) {
  // Insert or ignore
  insertAgency.run(a.name, a.short_name, a.slug, parentId);

  // Get the actual agency ID
  const agencyRow = getAgencyBySlug.get(a.slug);
  const agencyId = agencyRow.id;

  // Link titles (multiple agencies can reference the same title now)
  if (Array.isArray(a.cfr_references)) {
    for (const ref of a.cfr_references) {
      const titleRow = getTitleByNumber.get(parseInt(ref.title, 10));
      if (titleRow) {
        insertTitleAgency.run(titleRow.id, agencyId);
      }
    }
  }

  // Recurse children (safe even if empty array)
  if (Array.isArray(a.children) && a.children.length > 0) {
    for (const child of a.children) {
      await insertAgencyRecursive(child, agencyId);
    }
  }
}

async function fetchAgencies() {
  const { data } = await axios.get('https://www.ecfr.gov/api/admin/v1/agencies.json');
  console.log(`Fetched ${data.agencies.length} agencies`);
  

  for (const a of data.agencies) {
    console.log(a.children);
    
    await insertAgencyRecursive(a, null);
  }

  console.log('Agencies stored and linked to titles (including children).');
}

// ------------------- Fetch Title Text -------------------
async function fetchTitleText(titleNumber) {
  try {
    const titleRow = getTitleByNumber.get(parseInt(titleNumber, 10));
    if (!titleRow) return console.warn(`Title ${titleNumber} not found`);

    const url = `https://www.ecfr.gov/api/versioner/v1/full/${titleRow.latest_issue_date}/title-${titleNumber}.xml`;
    const { data } = await axios.get(url, { timeout: 60000, responseType: 'text' });
    const result = await parser.parseStringPromise(data);

    function extractText(node) {
      if (!node) return '';
      if (typeof node === 'string') return node;
      let out = '';
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach(child => out += extractText(child) + ' ');
        else if (typeof val === 'object') out += extractText(val) + ' ';
        else if (typeof val === 'string') out += val + ' ';
      }
      return out;
    }

    const fullText = extractText(result);
    const CHUNK_SIZE = 50000;

    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
      const chunk = fullText.slice(i, i + CHUNK_SIZE);
      const { wordCount, sentenceCount, avgSentenceLength, lexicalDensity } = computeMetrics(chunk);
      const cs = checksum(chunk);

      insertSnapshot.run(
        titleRow.id,
        new Date().toISOString(),
        chunk,
        wordCount,
        sentenceCount,
        avgSentenceLength,
        cs,
        lexicalDensity
      );
    }

    console.log(`Saved title ${titleNumber}: ${fullText.length} chars`);
  } catch (err) {
    console.warn(`Error fetching title ${titleNumber}: ${err.message}`);
  }
}

// ------------------- Main -------------------
async function main() {
  console.log('Fetching titles...');
  await fetchTitles();

  console.log('Fetching agencies and linking...');
  await fetchAgencies();

  const titles = db.prepare('SELECT number FROM titles ORDER BY number').all();
  console.log(`Starting to fetch ${titles.length} titles in batches of 2...`);

  const BATCH_SIZE = 2;
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(t => fetchTitleText(t.number)));
    results.forEach((res, idx) => {
      const tNumber = batch[idx].number;
      if (res.status === 'fulfilled') console.log(`[${i + idx + 1}/${titles.length}] Title ${tNumber} fetched`);
      else console.warn(`[${i + idx + 1}/${titles.length}] Title ${tNumber} failed: ${res.reason}`);
    });

    if (global.gc) global.gc();
  }

  db.close();
  console.log('All done.');
}

main();
