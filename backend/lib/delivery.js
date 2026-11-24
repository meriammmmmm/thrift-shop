/**
 * ============================================================
 *  DELIVERY & TOTALS — Mery Rose
 * ============================================================
 *
 *  The one place that decides what an order costs.
 *
 *  Two things live here:
 *
 *  1. The delivery fee. The shop delivers across the whole country for
 *     one flat fee, and the fee lives in the settings so the owner can
 *     change it from the admin panel without a deploy.
 *
 *  2. The quote. The storefront shows the customer a total, and the
 *     customer is told that the total was checked by the server. That
 *     check happens here — the browser sends what is in the bag, and the
 *     server answers with the prices it holds, the delivery fee and the
 *     total. The browser never adds anything up on its own.
 *
 *  The tax is zero on purpose: the prices shown in the shop already
 *  include it, and the customer is charged the price they were shown.
 * ============================================================
 */

const db = require('../database/db');

/** The delivery fee used until the owner sets one of their own. */
const DEFAULT_DELIVERY_FEE = 8;

/** The currency the shop sells in. */
const CURRENCY = 'TND';

/**
 * Read the delivery fee out of the settings.
 *
 * The settings table may not exist yet on a fresh install, and the value
 * in it may be nonsense — both fall back to the flat fee rather than
 * letting an order through with a broken total.
 */
async function getDeliveryFee() {
  try {
    const setting = await db.get('SELECT * FROM settings WHERE key = ?', ['delivery']);
    if (!setting) return DEFAULT_DELIVERY_FEE;

    const value = JSON.parse(setting.value);
    const fee = Number(value?.fee);

    return Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_DELIVERY_FEE;
  } catch (error) {
    console.warn('⚠️ Could not read the delivery fee, using the default:', error.message);
    return DEFAULT_DELIVERY_FEE;
  }
}

/**
 * The delivery details a customer has to give.
 *
 * A guest has no account, so these are the only way the shop knows where
 * the order goes and who to call.
 */
const REQUIRED_DELIVERY_FIELDS = [
  { key: 'name', label: 'full name' },
  { key: 'phone', label: 'phone number' },
  { key: 'governorate', label: 'governorate' },
  { key: 'city', label: 'city' },
  { key: 'address', label: 'delivery address' },
];

/**
 * Check the delivery details and say what is missing.
 *
 * Returns the list of missing fields — empty when everything is there.
 */
function missingDeliveryFields(shippingAddress) {
  if (!shippingAddress) return REQUIRED_DELIVERY_FIELDS.map((field) => field.label);

  return REQUIRED_DELIVERY_FIELDS.filter((field) => {
    const value = shippingAddress[field.key];
    return typeof value !== 'string' || value.trim().length === 0;
  }).map((field) => field.label);
}

/**
 * Price a bag.
 *
 * `items` are `{ product_id, quantity }`. The prices are the ones the
 * server holds — the price the browser sends is never used.
 *
 * Returns the priced lines, the totals and the reasons any line could
 * not be priced (a piece that has been sold, reserved or removed).
 */
async function quoteItems(items) {
  const lines = [];
  const unavailable = [];
  let subtotal = 0;

  for (const item of items) {
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const product = await db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);

    if (!product) {
      unavailable.push({ id: item.product_id, reason: 'not found' });
      continue;
    }

    if (product.in_stock === false || product.in_stock === 0) {
      unavailable.push({ id: item.product_id, name: product.name, reason: 'sold out' });
      continue;
    }

    if (product.reservation_status === 'reserved') {
      unavailable.push({ id: item.product_id, name: product.name, reason: 'reserved by another customer' });
      continue;
    }

    if (product.reservation_status === 'sold') {
      unavailable.push({ id: item.product_id, name: product.name, reason: 'already sold' });
      continue;
    }

    const price = Number(product.price) || 0;
    subtotal += price * quantity;

    lines.push({
      product_id: item.product_id,
      quantity,
      price,
      line_total: Number((price * quantity).toFixed(2)),
      company_id: product.company_id,
    });
  }

  const delivery = await getDeliveryFee();
  const tax = 0;
  const total = Number((subtotal + delivery + tax).toFixed(2));

  return {
    lines,
    unavailable,
    subtotal: Number(subtotal.toFixed(2)),
    delivery,
    tax,
    total,
    currency: CURRENCY,
    /** When the server did the sum — the storefront shows this to the customer. */
    verified_at: new Date().toISOString(),
  };
}

module.exports = {
  DEFAULT_DELIVERY_FEE,
  CURRENCY,
  REQUIRED_DELIVERY_FIELDS,
  getDeliveryFee,
  missingDeliveryFields,
  quoteItems,
};
