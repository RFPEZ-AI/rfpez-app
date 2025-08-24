const fs = require('fs');
const path = require('path');

// This script will help generate additional icon sizes for better Windows PWA support
// Since we don't have ImageMagick, we'll update the manifest to better support existing icons

const manifestPath = path.join(__dirname, 'public', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Update manifest with additional icon declarations for Windows
const updatedIcons = [
  {
    "src": "assets/icon/favicon.png",
    "sizes": "32x32",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/favicon.png",
    "sizes": "16x16",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/icon.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/icon.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "maskable"
  },
  {
    "src": "assets/icon/icon.png",
    "sizes": "144x144",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/icon.png",
    "sizes": "96x96",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/icon.png",
    "sizes": "72x72",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/icon.png",
    "sizes": "48x48",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "assets/icon/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
];

manifest.icons = updatedIcons;

// Write the updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Updated manifest.json with additional icon declarations for Windows PWA support');
console.log('📝 Note: The actual icon files are reused for multiple sizes, which is fine for PWAs');
console.log('🔄 Please rebuild your app and reinstall the PWA on Windows to see the changes');
