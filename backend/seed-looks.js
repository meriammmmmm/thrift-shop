/**
 * Seeds the "Shop the Look" starter looks.
 *
 * Looks are normally created and edited from the admin panel
 * (Admin → Shop the Look). This script only inserts a starter set so the
 * storefront section is not empty on first deploy — run it once, then manage
 * everything from the admin.
 *
 *   node seed-looks.js            # defaults to company 2 (Mery Rose)
 *   node seed-looks.js 1          # seed a different company
 *
 * Skips any company that already has looks, so it is safe to re-run.
 */
require('dotenv').config();
const db = require('./database/db');

const COMPANY_ID = Number(process.argv[2] || process.env.SEED_COMPANY_ID || 2);

const STARTER_LOOKS = [
  {
    name: 'After-Dark Black',
    occasion: 'party',
    tagline: 'Lace and patent leather, all the way down.',
    productIds: [77, 32, 14, 43],
  },
  {
    name: 'Burgundy & Camel',
    occasion: 'date',
    tagline: 'A soft corset, a suede skirt, gold hardware.',
    productIds: [4, 66, 9, 14],
  },
  {
    name: 'Holographic Set',
    occasion: 'party',
    tagline: 'One piece that does the whole night.',
    productIds: [58, 162, 21],
  },
  {
    name: 'Mustard Garden',
    occasion: 'casual',
    tagline: 'Jacquard florals with a little 70s in them.',
    productIds: [51, 19, 14],
  },
  {
    name: 'Red Hot',
    occasion: 'date',
    tagline: 'Red lace, red patent, nothing subtle.',
    productIds: [5, 27, 162, 42],
  },
];

async function seed() {
  try {
    const existing = await db.all('SELECT id FROM looks WHERE company_id = ?', [COMPANY_ID]);
    if (existing.length > 0) {
      console.log(`ℹ️  Company ${COMPANY_ID} already has ${existing.length} look(s) — nothing to seed.`);
      console.log('   Manage them in the admin panel under "Shop the Look".');
      process.exit(0);
    }

    const products = await db.all('SELECT id FROM products WHERE company_id = ?', [COMPANY_ID]);
    const validIds = new Set(products.map((p) => p.id));
    console.log(`📦 Company ${COMPANY_ID} has ${validIds.size} products.`);

    let created = 0;

    for (let order = 0; order < STARTER_LOOKS.length; order++) {
      const def = STARTER_LOOKS[order];
      const ids = def.productIds.filter((id) => validIds.has(id));
      const skipped = def.productIds.filter((id) => !validIds.has(id));

      if (ids.length === 0) {
        console.log(`⚠️  Skipping "${def.name}" — none of its products exist for this company.`);
        continue;
      }

      const result = await db.run(
        `INSERT INTO looks (company_id, name, occasion, tagline, worn_image, is_active, display_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, true, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [COMPANY_ID, def.name, def.occasion, def.tagline, order]
      );

      for (let i = 0; i < ids.length; i++) {
        await db.run(
          `INSERT INTO look_items (look_id, product_id, sort_order) VALUES (?, ?, ?)
             ON CONFLICT (look_id, product_id) DO NOTHING`,
          [result.id, ids[i], i]
        );
      }

      created += 1;
      console.log(`✅ "${def.name}" — ${ids.length} piece(s)${skipped.length ? ` (skipped product ids: ${skipped.join(', ')})` : ''}`);
    }

    console.log(`\n🎉 Seeded ${created} look(s) for company ${COMPANY_ID}.`);
    console.log('   Open Admin → Shop the Look to upload the outfit photos and edit.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();