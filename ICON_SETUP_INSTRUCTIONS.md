# Icon Setup Instructions for Blissyy Bakes PWA

## 📱 Required Icon Files

You need to create the following icon files from your bakery logo image and place them in the `public/` folder:

### Required Files:
1. **favicon.ico** - 32x32 or 16x16 (browser tab icon)
2. **favicon-16x16.png** - 16x16 pixels
3. **favicon-32x32.png** - 32x32 pixels
4. **apple-touch-icon.png** - 180x180 pixels (iOS home screen)
5. **icon-192x192.png** - 192x192 pixels (Android home screen)
6. **icon-512x512.png** - 512x512 pixels (Android splash screen)

## 🎨 How to Create Icons

### Option 1: Online Tools (Easiest)
1. Go to https://realfavicongenerator.net/ or https://www.favicon-generator.org/
2. Upload your bakery logo image
3. Download all generated icons
4. Place them in the `public/` folder

### Option 2: Manual Creation
1. Use an image editor (Photoshop, GIMP, Canva, etc.)
2. Resize your logo to each required size
3. Save as PNG files (except favicon.ico)
4. For favicon.ico, use an online converter or ImageMagick

### Option 3: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first, then:
convert your-logo.png -resize 16x16 public/favicon-16x16.png
convert your-logo.png -resize 32x32 public/favicon-32x32.png
convert your-logo.png -resize 180x180 public/apple-touch-icon.png
convert your-logo.png -resize 192x192 public/icon-192x192.png
convert your-logo.png -resize 512x512 public/icon-512x512.png
```

## 📂 File Structure
After adding icons, your `public/` folder should look like:
```
public/
  ├── favicon.ico
  ├── favicon-16x16.png
  ├── favicon-32x32.png
  ├── apple-touch-icon.png
  ├── icon-192x192.png
  ├── icon-512x512.png
  ├── manifest.json
  ├── sw.js
  └── robots.txt
```

## ✅ Verification

After adding the icons:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser tab - should show your logo
4. On mobile, try "Add to Home Screen" - should show your logo

## 🔍 Testing PWA Installation

### Desktop (Chrome/Edge):
1. Look for install icon in address bar
2. Or go to Settings → Install app

### Mobile (iOS):
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Your logo should appear

### Mobile (Android):
1. Open in Chrome
2. Tap menu (3 dots)
3. Select "Add to Home Screen" or "Install app"
4. Your logo should appear

## 🎯 Quick Setup Checklist

- [ ] Create all 6 icon files from your logo
- [ ] Place all icons in `public/` folder
- [ ] Verify `manifest.json` exists
- [ ] Verify `sw.js` exists
- [ ] Clear browser cache
- [ ] Test on mobile device
- [ ] Test "Add to Home Screen" functionality
