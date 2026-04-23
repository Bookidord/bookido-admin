/**
 * Generate cannibalization.csv from crawl.csv
 * Computes Jaccard similarity on title n-grams (3-word windows)
 * Threshold: >=4 shared keywords (stopwords removed)
 */
import fs from 'fs';

const STOPWORDS = new Set([
  'de','del','la','el','los','las','en','para','un','una','y','o','e','a',
  'al','su','sus','con','por','que','como','es','son','se','no','si','más',
  'este','esta','estos','estas','tu','mi','te','le','lo','rd','republica',
  'dominicana','dominicano','dominicanos','república','dominicanas',
  'guia','guía','completa','completo','todo','todos','toda','todas',
  'cómo','como','qué','que','cuál','cual','sobre','desde','hasta',
  '2025','2026','gestióndo','gestiondo','pro','plus','san'
]);

function tokenize(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function jaccard(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function sharedKeywords(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  return [...setA].filter(x => setB.has(x));
}

// Read crawl.csv
const csv = fs.readFileSync('C:/Users/debai/bookido/audit/crawl.csv', 'utf8').trim().split('\n');
const posts = csv.slice(1).map(line => {
  const vals = []; let cur = '', inQ = false;
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) { vals.push(cur); cur = ''; }
    else cur += c;
  }
  vals.push(cur);
  return {
    url: vals[0],
    title: vals[3],
    wordCount: parseInt(vals[10] || 0),
    category: vals[0].split('/').filter(Boolean)[2] || ''
  };
}).filter(p => p.title && p.url);

console.log(`Processing ${posts.length} posts...`);

// Tokenize all
const tokenized = posts.map(p => ({
  ...p,
  tokens: tokenize(p.title)
}));

// Find all pairs with >=4 shared keywords
const pairs = [];
for (let i = 0; i < tokenized.length; i++) {
  for (let j = i + 1; j < tokenized.length; j++) {
    const a = tokenized[i];
    const b = tokenized[j];
    const shared = sharedKeywords(a.tokens, b.tokens);
    if (shared.length >= 4) {
      const sim = jaccard(new Set(a.tokens), new Set(b.tokens));
      // Determine shared query (the shared keywords joined)
      const query = shared.slice(0, 5).join(' ');
      pairs.push({
        url_a: a.url,
        url_b: b.url,
        title_a: a.title,
        title_b: b.title,
        shared_keywords: shared.join('|'),
        shared_query: query,
        jaccard_sim: sim.toFixed(3),
        shared_count: shared.length,
        words_a: a.wordCount,
        words_b: b.wordCount,
        cat_a: a.category,
        cat_b: b.category
      });
    }
  }
}

// Sort by jaccard desc
pairs.sort((a, b) => parseFloat(b.jaccard_sim) - parseFloat(a.jaccard_sim));

console.log(`Found ${pairs.length} pairs with >=4 shared keywords`);

// Write CSV
const header = 'url_a,url_b,title_a,title_b,shared_query,shared_keywords,jaccard_sim,shared_count,words_a,words_b,cat_a,cat_b';
const rows = pairs.map(p => {
  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  return [p.url_a, p.url_b, p.title_a, p.title_b, p.shared_query, p.shared_keywords,
    p.jaccard_sim, p.shared_count, p.words_a, p.words_b, p.cat_a, p.cat_b].map(esc).join(',');
});

fs.writeFileSync('C:/Users/debai/bookido/audit/cannibalization.csv', header + '\n' + rows.join('\n'));
console.log(`Written to audit/cannibalization.csv`);
console.log(`\nTop 10 pairs by similarity:`);
pairs.slice(0, 10).forEach(p => {
  console.log(`  [${p.jaccard_sim}] ${p.shared_count} shared: ${p.shared_query}`);
  console.log(`    A: ${p.url_a.split('/').slice(-2,-1)[0]}`);
  console.log(`    B: ${p.url_b.split('/').slice(-2,-1)[0]}`);
});
