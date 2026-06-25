# Fix: storefront shows "0 Products" (API 500)

## What's wrong
`meryrose.me/products` calls Supabase:

```
products?select=*&company_id=eq.2&order=display_order.asc,id.asc&limit=100
```

This returns **HTTP 500**, so the page shows *0 Products*.

The cause is in the **data, not the code**. About 80 products store their photos
as multi-megabyte **base64 data-URIs** directly inside the `images` column.
Pulling all 100 in one page produces a response hundreds of MB large, which
exceeds Supabase/PostgREST's limit and fails with 500.

Proof: the same query selecting any columns *except* `images` returns all 80
products fine; adding `images` back makes it 500.

## The fix
The repo already has the real photos in `supabase-backup/product_images/`
(148 jpgs) and the id→filename mapping in `supabase-backup/products_clean.csv`.
`fix-product-images.mjs` uploads those photos to Supabase Storage and rewrites
each product's `images` column to the small public URLs. The rows become tiny
and the storefront loads normally.

## Run it (once)

1. Get your **service_role** key: Supabase dashboard → Project Settings → API →
   `service_role` secret. (This is the admin key — keep it private, don't commit it.)

2. From the repo root:

   ```bash
   export SUPABASE_URL="https://oiwvvxyewszwwfnvsnza.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="paste-the-service_role-key"

   node fix-product-images.mjs --dry-run   # preview, no changes
   node fix-product-images.mjs             # do the fix
   ```

   Requires Node 18+. No `npm install` needed.

3. Reload `meryrose.me/products`. The 500 is gone and products appear.

The script is safe to re-run (uploads upsert; rows just get the same URLs).

## Stop it happening again
The base64 got there because the admin "add product" / AI flow saved uploaded
images as base64 into the database instead of uploading them to Storage. To
prevent a repeat, update that upload path to push the file to the
`product-images` bucket and store the returned public URL — same shape this
script writes. Happy to wire that up next if you want.
