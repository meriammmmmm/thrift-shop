# 🌹 Mery Rose Logo Setup Guide

## Quick Setup (2 Minutes)

### Method 1: Save from Screenshot (Easiest)

1. **Right-click** on your Mery Rose logo image (the pink one with the woman silhouette)
2. Select **"Save Image As..."** or **"Download Image"**
3. Save it with the name: `mery-rose-logo.png`
4. Move it to: `thrift-shop/public/images/mery-rose-logo.png`
5. Done! ✅

### Method 2: Drag & Drop

1. Open your file explorer/finder
2. Navigate to your project folder
3. Go to: `thrift-shop/public/images/`
4. Drag your logo image into this folder
5. Rename it to: `mery-rose-logo.png`
6. Done! ✅

### Method 3: Use the Helper Page

1. Open `save-mery-rose-logo.html` in your browser
2. Click "Upload Your Logo"
3. Select your logo image
4. Click "Download as mery-rose-logo.png"
5. Move the downloaded file to: `thrift-shop/public/images/`
6. Done! ✅

## File Location

```
your-project/
└── thrift-shop/
    └── public/
        └── images/
            └── mery-rose-logo.png  ← Put your logo here!
```

## Exact Path

```
thrift-shop/public/images/mery-rose-logo.png
```

## File Requirements

- **Name**: Must be exactly `mery-rose-logo.png`
- **Format**: PNG, JPG, or WEBP (PNG recommended for transparency)
- **Size**: Any size (will auto-resize, but 400x200px is ideal)
- **Background**: Transparent PNG works best

## How to Verify It's Working

### Option 1: Check the File
```bash
cd thrift-shop/public/images
ls -la mery-rose-logo.png
```

If you see the file listed, you're good! ✅

### Option 2: Run the Website
```bash
cd thrift-shop
npm run dev
```

Then open: http://localhost:3000

You should see your logo in the center of the navigation bar! 🎉

### Option 3: Use the Test Button
1. Open `save-mery-rose-logo.html` in your browser
2. Click "Test Logo Path"
3. If it says "Logo found!" you're all set! ✅

## What the Logo Will Look Like

Once added, your logo will:
- ✨ Appear in the center of the navigation bar
- 🎭 Have a beautiful floating animation
- ✨ Glow on hover
- 📱 Be responsive on all devices
- 🔄 Auto-fallback to "MERY ROSE" text if image fails

## Troubleshooting

### Logo Not Showing?

**Check 1: File Name**
- Must be exactly: `mery-rose-logo.png`
- Case-sensitive on some systems
- No spaces or special characters

**Check 2: File Location**
```bash
# Should be here:
thrift-shop/public/images/mery-rose-logo.png

# NOT here:
thrift-shop/images/mery-rose-logo.png
thrift-shop/public/mery-rose-logo.png
public/images/mery-rose-logo.png
```

**Check 3: File Format**
- PNG is best (supports transparency)
- JPG works too
- Make sure it's actually an image file

**Check 4: Restart Dev Server**
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Check 5: Clear Browser Cache**
- Press `Ctrl+Shift+R` (Windows/Linux)
- Press `Cmd+Shift+R` (Mac)

### Still Not Working?

The website will automatically show "MERY ROSE" text as a fallback, so your site will still look good! The text uses the same burgundy color from your logo.

## Logo Specifications

### Current Logo (from your image):
- **Style**: Elegant woman silhouette with rose
- **Colors**: Deep burgundy (#8B1538) on soft pink background (#F4D7E0)
- **Text**: "Mery Rose" in elegant script font
- **Vibe**: Feminine, sophisticated, boutique

### Recommended Dimensions:
- **Width**: 300-500px
- **Height**: 100-200px
- **Aspect Ratio**: 2:1 or 3:1 (wider than tall)
- **File Size**: Under 500KB for fast loading

### Logo Variations (Optional):
You can create different versions:
- `mery-rose-logo.png` - Main logo (what we're using)
- `mery-rose-logo-white.png` - White version for dark backgrounds
- `mery-rose-logo-icon.png` - Just the icon/symbol
- `mery-rose-logo-text.png` - Just the text

## Next Steps

After adding the logo:

1. ✅ Logo is in place
2. 🎨 Website has trendy design
3. 🏷️ Product badges are active
4. ✨ Animations are working
5. 🌹 Mery Rose branding is complete!

Now you can:
- Add products through the admin panel
- Customize colors in the theme settings
- Add more pages
- Launch your boutique! 🚀

## Need Help?

If you're stuck, check:
1. File name is exactly: `mery-rose-logo.png`
2. File is in: `thrift-shop/public/images/`
3. Dev server is running: `npm run dev`
4. Browser cache is cleared: `Ctrl+Shift+R`

Your Mery Rose boutique is almost ready! 🌹✨
