# Favicon Setup Instructions

## Problem
Sometimes the Lovable favicon appears instead of the Haldeki favicon due to:
1. External favicon dependency (Google Cloud Storage URL)
2. Browser cache conflicts
3. `lovable-tagger` plugin injection in development mode
4. Missing local favicon files

## Solution Implemented

### 1. Files Created
- `public/haldeki-logo.svg` - Haldeki logo (downloaded from GCS)
- `public/favicon.ico` - Existing favicon
- `public/site.webmanifest` - PWA manifest
- `public/apple-touch-icon.png` - iOS icon (placeholder - needs generation)
- `public/favicon-generator.html` - Tool to generate PNG favicons

### 2. index.html Updated
Removed external favicon URL and added comprehensive local favicon links:
```html
<!-- SVG for modern browsers -->
<link rel="icon" type="image/svg+xml" href="/haldeki-logo.svg">
<!-- ICO fallback for older browsers -->
<link rel="icon" type="image/x-icon" sizes="64x64 32x32 24x24 16x16" href="/favicon.ico">
<!-- Apple touch icon for iOS -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<!-- PWA manifest -->
<link rel="manifest" href="/site.webmanifest">
<!-- Theme color for browser UI -->
<meta name="theme-color" content="#22c55e">
<!-- Microsoft tile color -->
<meta name="msapplication-TileColor" content="#22c55e">
```

### 3. How to Generate PNG Favicons

1. Open `public/favicon-generator.html` in your browser
2. Wait for the canvases to render with the Haldeki logo
3. Click "İndir" (Download) button for each size:
   - `apple-touch-icon.png` (180x180)
   - `favicon-32x32.png` (32x32)
   - `favicon-16x16.png` (16x16)
4. Save all downloaded PNG files to `public/` folder

### 4. Clear Browser Cache

After updating favicons, clear browser cache:
1. Chrome/Edge: `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Hard refresh: `Ctrl + F5`

Or use DevTools:
1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 5. Prevention Measures

#### Remove Lovable Tagger (Optional)
If you want to completely remove Lovable's influence:

```bash
npm uninstall lovable-tagger
```

Then update `vite.config.ts`:
```typescript
plugins: [react()]  // Remove componentTagger()
```

#### Cache-Busting (If Needed)
Add version parameter to favicon links:
```html
<link rel="icon" href="/haldeki-logo.svg?v=2">
```

### 6. Verification

To verify favicons are working:
1. Open browser DevTools (`F12`)
2. Go to Network tab
3. Filter by "Img"
4. Refresh page
5. Check that `/haldeki-logo.svg` is loaded (not external URL)

### 7. Deployment Checklist

Before deploying:
- [ ] Generate PNG favicons from favicon-generator.html
- [ ] Save all PNG files to `public/`
- [ ] Test locally: `npm run dev`
- [ ] Clear browser cache
- [ ] Verify Haldeki favicon appears
- [ ] Commit and push changes
- [ ] Test on production after deployment

## Expected Result
After these changes, the Haldeki logo (green leaf design) should consistently appear as the favicon across all browsers and platforms, replacing any Lovable or default favicons.
