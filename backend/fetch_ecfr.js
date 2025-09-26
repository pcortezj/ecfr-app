const axios = require('axios');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: false });

const db = new Database('ecfr.db');

// Metrics helper
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

// Insert helpers
const insertAgency = db.prepare('INSERT OR IGNORE INTO agencies (name, short_name, slug) VALUES (?, ?, ?)');
const getAgency = db.prepare('SELECT id FROM agencies WHERE slug = ?');
const insertTitle = db.prepare(`
  INSERT OR IGNORE INTO titles 
  (number, name, latest_amended_on, latest_issue_date, up_to_date_as_of, reserved)    
  VALUES (?, ?, ?, ?, ?, ?)
`);
const getTitle = db.prepare(`
  SELECT id, latest_amended_on, latest_issue_date, up_to_date_as_of, reserved
  FROM titles
  WHERE number = ?
`);
;
const insertSnapshot = db.prepare(`
  INSERT INTO snapshots (title_id, retrieved_at, raw_text, word_count, sentence_count, avg_sentence_length, checksum, lexical_density)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

async function fetchAgencies() {
  const { data } = await axios.get('https://www.ecfr.gov/api/admin/v1/agencies.json');
  for (const a of data.agencies) {
    insertAgency.run(a.name, a.short_name, a.slug);
  }
  console.log('Agencies stored.');
}

async function fetchTitles() {
  const { data } = await axios.get('https://www.ecfr.gov/api/versioner/v1/titles.json');
  for (const t of data.titles) { // <- note: titles array is inside `titles` key
    insertTitle.run(
      t.number,
      t.name,
      t.latest_amended_on,
      t.latest_issue_date,
      t.up_to_date_as_of,
      t.reserved ? 1 : 0
    );
  }
  console.log('Titles stored.');
}

async function fetchTitleText(titleNumber) {
  try {
    const titleRow = getTitle.get(titleNumber);
    if (!titleRow) {
      console.warn(`Title ${titleNumber} not found in DB`);
      return;
    }

    const date = titleRow.latest_issue_date;
    const url = `https://www.ecfr.gov/api/versioner/v1/full/${date}/title-${titleNumber}.xml`;

    console.log(`Fetching title ${titleNumber} for date ${date}...`);

    const { data } = await axios.get(url, { timeout: 60000, responseType: 'text' });

    const result = await parser.parseStringPromise(data);

    function extractText(node) {
      if (!node) return '';
      if (typeof node === 'string') return node;

      let out = '';
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) {
          for (const child of val) {
            out += extractText(child) + ' ';
          }
        } else if (typeof val === 'object') {
          out += extractText(val) + ' ';
        } else if (typeof val === 'string') {
          out += val + ' ';
        }
      }
      return out;
    }

    const fullText = extractText(result);

    // Split into chunks to avoid OOM
    const CHUNK_SIZE = 50000; // characters
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

    console.log(`Saved title ${titleNumber}: ${fullText.length} characters in ${Math.ceil(fullText.length / CHUNK_SIZE)} chunks`);

  } catch (err) {
    console.warn(`Error fetching title ${titleNumber}: ${err.message}`);
  }
}

async function main() {
  console.log('Fetching agencies...');
  await fetchAgencies();

  console.log('Fetching titles...');
  await fetchTitles();

  const titles = db.prepare('SELECT number FROM titles ORDER BY number').all();
  const BATCH_SIZE = 2; // Adjust to 2-3 for faster processing without blowing memory
  console.log(`Starting to fetch ${titles.length} titles in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE);

    // Fetch small batch in parallel
    const results = await Promise.allSettled(batch.map(t => fetchTitleText(t.number)));

    results.forEach((res, idx) => {
      const tNumber = batch[idx].number;
      if (res.status === 'fulfilled') {
        console.log(`[${i + idx + 1}/${titles.length}] Title ${tNumber} fetched successfully`);
      } else {
        console.warn(`[${i + idx + 1}/${titles.length}] Title ${tNumber} failed: ${res.reason}`);
      }
    });

    //force garbage collection if Node was started with --expose-gc
    if (global.gc) global.gc();
  }

  db.close();
  console.log('All titles processed.');
}



main();
