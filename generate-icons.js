const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, 'public', 'logo.svg');
  const iconDir = path.join(__dirname, 'public', 'assets', 'icon');
  
  // Ensure the icon directory exists
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate different sizes
    const sizes = [
      { name: 'favicon.png', size: 32 },
      { name: 'icon.png', size: 192 },
      { name: 'icon-512.png', size: 512 }
    ];

    for (const { name, size } of sizes) {
      const outputPath = path.join(iconDir, name);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated ${name} (${size}x${size})`);
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
