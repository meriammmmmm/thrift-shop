#!/usr/bin/env node
/**
 * fix-product-images.mjs
 * --------------------------------------------------------------------------
 * WHY: The storefront request
 *        products?select=*&company_id=eq.2&order=display_order...
 *      returns HTTP 500 because the `images` column holds multi-megabyte
 *      base64 data-URIs for ~80 products. Selecting them all in one page
 *      blows past Supabase/PostgREST's response limit -> 500 -> "0 Products".
 *
 * WHAT THIS DOES (run once):
 *   1. Ensures a PUBLIC storage bucket `product-images` exists.
 *   2. Uploads every real photo from supabase-backup/product_images/.
 *   3. Rewrites each product's `images` column to the small public URLs,
 *      ordered the same way as supabase-backup/products_clean.csv.
 *
 * After it finishes, the rows are tiny and the storefront loads normally.
 *
 * USAGE:
 *   export SUPABASE_URL="https://oiwvvxyewszwwfnvsnza.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="<service_role key from Supabase>"
 *   node fix-product-images.mjs            # add --dry-run to preview only
 *
 * Get the service_role key: Supabase dashboard -> Project Settings -> API
 *   -> "service_role" secret (NOT the anon/publishable key). Keep it private.
 *
 * Safe to re-run (uploads upsert, rows just get the same URLs again).
 * --------------------------------------------------------------------------
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oiwvvxyewszwwfnvsnza.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'product-images';
const DRY_RUN = process.argv.includes('--dry-run');

const IMAGES_DIR = join(__dirname, 'supabase-backup', 'product_images');
const CSV_PATH = join(__dirname, 'supabase-backup', 'products_clean.csv');

if (!KEY) {
  console.error('\nERROR: set SUPABASE_SERVICE_ROLE_KEY first.\n' +
    'Find it in Supabase -> Project Settings -> API -> service_role secret.\n');
  process.exit(1);
}

const authHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// ---- tiny CSV parser (handles quoted fields & embedded commas) ------------
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function loadIdToFilenames() {
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf8'));
  const header = rows[0];
  const idIdx = header.indexOf('id');
  const imgIdx = header.indexOf('images');
  const map = new Map();
  for (const r of rows.slice(1)) {
    if (!r[idIdx]) continue;
    const id = r[idIdx].trim();
    const files = (r[imgIdx] || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (id && files.length) map.set(id, files);
  }
  return map;
}

async function ensureBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) { console.log(`Created public bucket "${BUCKET}".`); return; }
  const body = await res.json().catch(() => ({}));
  if (res.status === 409 || /already exists/i.test(body.message || '')) {
    console.log(`Bucket "${BUCKET}" already exists.`);
  } else {
    throw new Error(`Bucket create failed (${res.status}): ${JSON.stringify(body)}`);
  }
}

async function uploadFile(filename) {
  const bytes = readFileSync(join(IMAGES_DIR, filename));
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`,
    {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
      body: bytes,
    },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Upload failed for ${filename} (${res.status}): ${t}`);
  }
}

function publicUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(filename)}`;
}

async function patchProductImages(id, urls) {
  // Live rows store `images` as a JSON-encoded string (the frontend JSON.parses
  // it). Keep that exact shape so nothing else needs to change.
  const value = JSON.stringify(urls);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ images: value }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Update failed for product ${id} (${res.status}): ${t}`);
  }
}

async function main() {
  console.log(`\nSupabase: ${SUPABASE_URL}`);
  console.log(`Bucket:   ${BUCKET}`);
  console.log(`Mode:     ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}\n`);

  const idToFiles = loadIdToFilenames();
  const onDisk = new Set(readdirSync(IMAGES_DIR));
  console.log(`Products in CSV: ${idToFiles.size} | photos on disk: ${onDisk.size}\n`);

  // sanity: every referenced file exists
  const missing = [];
  for (const files of idToFiles.values())
    for (const f of files) if (!onDisk.has(f)) missing.push(f);
  if (missing.length) {
    console.error('Missing image files referenced by CSV:', missing);
    process.exit(1);
  }

  if (DRY_RUN) {
    let n = 0;
    for (const [id, files] of idToFiles) {
      if (n++ < 5) console.log(`  product ${id} -> ${files.map(publicUrl).join('\n             ')}`);
    }
    console.log(`\nDry run OK. Would upload ${onDisk.size} files and update ${idToFiles.size} products.`);
    return;
  }

  await ensureBucket();

  // upload every referenced file
  const allFiles = [...new Set([...idToFiles.values()].flat())];
  console.log(`Uploading ${allFiles.length} images...`);
  let up = 0;
  for (const f of allFiles) {
    await uploadFile(f);
    if (++up % 20 === 0) console.log(`  uploaded ${up}/${allFiles.length}`);
  }
  console.log(`Uploaded ${up} images.\n`);

  // rewrite each product's images column
  console.log(`Updating ${idToFiles.size} product rows...`);
  let done = 0;
  for (const [id, files] of idToFiles) {
    await patchProductImages(id, files.map(publicUrl));
    if (++done % 20 === 0) console.log(`  updated ${done}/${idToFiles.size}`);
  }
  console.log(`Updated ${done} products.\n`);

  console.log('Done. Reload meryrose.me/products — the 500 should be gone.\n');
}

main().catch(err => { console.error('\nFAILED:', err.message, '\n'); process.exit(1); });
