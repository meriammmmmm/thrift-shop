# Free Virtual Try-On (no billing) — what changed

The try-on was calling Google's **paid** image model
(`gemini-2.5-flash-preview-image`), which returns `limit: 0` on the free tier —
that model needs a billing-enabled Google Cloud project. So every try-on failed
with the "quota exceeded" error.

It now uses **Hugging Face — Kolors Virtual Try-On**, which is **100% free**
(no credit card, no API key required).

## Files changed
- `backend/routes/tryon.js` — the **live** endpoint (the website calls this on Railway). Now uses Kolors.
- `backend/package.json` — added `@gradio/client`.
- `thrift-shop/app/api/tryon/run/route.ts` — kept consistent (same free logic).
- `thrift-shop/package.json` — added `@gradio/client`.

## Deploy (Railway backend — this is the one the live site uses)
1. Commit and push these changes.
2. Railway will run `npm install` and pick up `@gradio/client` automatically.
3. No environment variable is required. You can **delete** the old
   `GEMINI_API_KEY` / `GEMINI_IMAGE_MODEL` vars if you want.
4. Test: open `https://<your-backend>/api/tryon/health` — it should show
   `"free": true` and `"spaceReachable": true`.

## Optional (recommended for fewer "busy" errors)
The Kolors Space runs on a **shared free GPU**, so at busy times it may say
"GPU busy" or "queue full". A free Hugging Face token gives you higher priority:
1. Get a token at https://huggingface.co/settings/tokens (free account).
2. Add an env var on Railway: `HF_TOKEN = hf_xxxxxxxx`.

That's it — still free, just more reliable.

## Notes
- First request after idle can take ~20–40s while the Space wakes up; retry once.
- Quality is good for a free option, but not as polished as paid services like
  FASHN. If you later want top quality, the code is structured so swapping the
  provider back is easy.
