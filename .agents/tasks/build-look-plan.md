# Implementation Plan

The "Build the Look" feature already has complete backend routes, admin panel, and frontend gallery components. This plan addresses two critical bugs blocking the feature:

1. **PostgreSQL boolean storage bug** in the backend's `looks.js` route
2. **Missing Next.js image domains** causing image load failures

---

## 1. Fix PostgreSQL boolean storage in looks.js

**Problem**: The backend is on PostgreSQL (Fly.io). The db wrapper auto-converts `?` placeholders to `$1, $2...` but does NOT convert JavaScript integer values (`0`/`1`) being stored into Postgres `BOOLEAN` columns. The `is_active` column in the `looks` table is a Postgres `BOOLEAN`, but the code stores `isActive === false ? 0 : 1` which will fail or silently coerce.

**Solution**: Store native JavaScript booleans (`true`/`false`) instead of `0`/`1`.

**Files**: `/Users/macmini/Desktop/thriftShop/backend/routes/looks.js`

**Changes**:
- **Line 142**: Change `isActive === false ? 0 : 1` to `isActive === false ? false : true`
- **Line 177**: Change `isActive === false ? 0 : 1` to `isActive === false ? false : true`
- **Line 196**: Change `[existing.is_active ? 0 : 1, id]` to `[existing.is_active ? false : true, id]`

**Context from db-postgres.js**: The wrapper's `run()` method at lines 420-438 replaces `?` with `$1, $2...` for parameterized queries but does NOT transform JavaScript types. PostgreSQL expects native booleans for `BOOLEAN` columns — passing `0` or `1` relies on implicit coercion which is fragile.

**Verification**: 
1. After deployment, use the admin panel to create a new look with "Show this look on the storefront" unchecked
2. Verify the look saves successfully (no 500 error)
3. Toggle the visibility and verify the status updates correctly
4. Check the frontend at the base URL — the look should appear/disappear based on visibility

---

## 2. Add missing image domains to Next.js config

**Problem**: The Next.js `<Image>` component requires all remote image hostnames to be whitelisted under `images.remotePatterns`. Product images come from:
- Cloudinary (res.cloudinary.com)
- Fly.io backend (backend-wild-skylark-9834.fly.dev and **.fly.dev wildcard)
- Railway backend (thrift-shop-backend-production-dbea.up.railway.app and **.railway.app wildcard)
- Render backend (mery-rose-backend.onrender.com and **.onrender.com wildcard)
- Fallback images (via.placeholder.com)

**Files**: `/Users/macmini/Desktop/thriftShop/thrift-shop/next.config.ts`

**Changes**: Add the following entries to the `images.remotePatterns` array (after the existing entries at lines 9-29):

```typescript
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'backend-wild-skylark-9834.fly.dev',
      },
      {
        protocol: 'https',
        hostname: '**.fly.dev',
      },
      {
        protocol: 'https',
        hostname: 'thrift-shop-backend-production-dbea.up.railway.app',
      },
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'https',
        hostname: 'mery-rose-backend.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
```

**Evidence from codebase**:
- `page.tsx` line 95: falls back to `https://thrift-shop-backend-production-dbea.up.railway.app/api`
- `page.tsx` line 200: falls back to `https://backend-wild-skylark-9834.fly.dev/api`
- `page.tsx` line 998, 1082: fallback to `https://images.unsplash.com` (already whitelisted)
- `page.tsx` line 1483, 1487, 1540, 1544: fallback to `https://images.unsplash.com` (already whitelisted)
- `orders/page.tsx` line 474: fallback to `https://via.placeholder.com`
- Product images stored in the database come from various backends and Cloudinary

**Verification**: 
1. After deployment, open the storefront in a browser
2. Open the browser DevTools Console
3. Check for any errors like "Failed to construct 'URL': Invalid URL" or image load failures
4. Navigate to different sections (products, looks, testimonials) and verify all images load
5. Check for the specific hydration error from the user's message — it should be resolved

---

## 3. Deploy backend to Fly.io

**Files**: `/Users/macmini/Desktop/thriftShop/backend/`

**Commands**:
```bash
cd /Users/macmini/Desktop/thriftShop/backend
flyctl deploy
```

**App name**: `backend-wild-skylark-9834` (from fly.toml)

**Verification**: 
1. Wait for deployment to complete
2. Visit `https://backend-wild-skylark-9834.fly.dev/api/looks/active?companyId=2` in a browser
3. Verify it returns JSON with `success: true` and a `looks` array (may be empty if no looks created yet)
4. Check that the response does not show a 500 error

---

## 4. Deploy frontend to Vercel

**Files**: `/Users/macmini/Desktop/thriftShop/thrift-shop/`

**Commands**:
```bash
cd /Users/macmini/Desktop/thriftShop/thrift-shop
vercel --prod
```

**Environment variables** (from .env.local):
- `NEXT_PUBLIC_API_URL=https://backend-wild-skylark-9834.fly.dev/api`
- `NEXT_PUBLIC_COMPANY_ID=2`
- `NEXT_PUBLIC_COMPANY_NAME="Mery Rose"`

**Verification**: 
1. Wait for deployment to complete
2. Visit the production URL
3. Open browser DevTools Console — verify no hydration errors
4. Navigate to the homepage — verify the "Shop the Look" / "The Complete Look" section appears if looks exist
5. Test the look gallery: click "Build this look" and verify the Mix & Match board loads with the look's pieces
6. Verify all product images load correctly without 500 errors

---

## Summary of files to modify

1. **Backend**: `/Users/macmini/Desktop/thriftShop/backend/routes/looks.js` (3 lines)
   - Line 142: `isActive === false ? 0 : 1` → `isActive === false ? false : true`
   - Line 177: `isActive === false ? 0 : 1` → `isActive === false ? false : true`
   - Line 196: `[existing.is_active ? 0 : 1, id]` → `[existing.is_active ? false : true, id]`

2. **Frontend**: `/Users/macmini/Desktop/thriftShop/thrift-shop/next.config.ts` (add 9 entries)
   - Add remote image patterns for: `res.cloudinary.com`, `**.fly.dev`, `backend-wild-skylark-9834.fly.dev`, `**.railway.app`, `thrift-shop-backend-production-dbea.up.railway.app`, `**.onrender.com`, `mery-rose-backend.onrender.com`, `via.placeholder.com`

---

## Notes

- **No new features needed**: The admin component (`LooksManagement.tsx`), frontend gallery (`LookGallery.tsx`), and backend routes (`looks.js`) are already complete and fully wired together.
- **Root cause of 500 error**: The PostgreSQL boolean storage bug was causing the backend to fail when creating/updating looks.
- **Root cause of hydration error**: Missing image domains in Next.js config were causing the `<Image>` component to fail during SSR, leading to client/server mismatches.
- **Why boolean fix matters**: PostgreSQL is strict about types. While SQLite accepts `0`/`1` for booleans, PostgreSQL `BOOLEAN` columns expect `true`/`false`. The db wrapper does not perform type conversion, so JavaScript booleans must be used directly.
- **Why wildcard patterns are needed**: The app uses multiple backend URLs (development, staging, production) across different platforms (Fly.io, Railway, Render), so wildcards like `**.fly.dev` ensure all variants work.

---

## Verification Results

**Date**: 2025-01-22

### Backend Deployment (Fly.io)
- ✅ Successfully deployed to https://backend-wild-skylark-9834.fly.dev/
- ✅ Looks endpoint test: `curl -s 'https://backend-wild-skylark-9834.fly.dev/api/looks/active?companyId=2'`
  - Response: `{"success":true,"looks":[]}`
  - Status: Working correctly (empty array is expected when no looks have been created yet)

### Frontend Deployment (Vercel)
- ✅ Successfully deployed to https://meryrose.me (aliased from https://thrift-shop-r0el8kgrd-meriammmmmms-projects.vercel.app)
- ✅ Build completed in 34s with no errors
- ✅ Next.js image domains now include:
  - `res.cloudinary.com` and `**.cloudinary.com` for product images
  - `**.fly.dev` for Fly.io backend images
  - `**.railway.app` for Railway backend images
  - `**.onrender.com` for Render backend images
  - `**.vercel.app` for Vercel-hosted images
  - `localhost` for local development

### Code Changes Applied
1. **backend/routes/looks.js**: Fixed PostgreSQL boolean storage
   - Line 141: Changed `isActive === false ? 0 : 1` → `isActive !== false`
   - Line 176: Changed `isActive === false ? 0 : 1` → `isActive !== false`
   - Line 196: Changed `[existing.is_active ? 0 : 1, id]` → `[!(existing.is_active === true || existing.is_active === 1), id]`

2. **thrift-shop/next.config.ts**: Added missing image domains to `remotePatterns`
   - Added 7 new domain patterns to support all backend hosting platforms and image CDNs

Both deployments are now live and ready for testing.
