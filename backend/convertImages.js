const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Target the doctor_photos folder
const folderPath = path.join(__dirname, 'database', 'doctor_photos');

async function convertSvgToPng() {
  try {
    const files = fs.readdirSync(folderPath);
    const svgs = files.filter(file => file.endsWith('.svg'));

    if (svgs.length === 0) {
      return console.log('No SVG files found in the directory.');
    }

    console.log(`Found ${svgs.length} SVGs. Starting conversion...`);

    for (const file of svgs) {
      const inputPath = path.join(folderPath, file);
      // Replace .svg extension with .png
      const outputPath = path.join(folderPath, file.replace('.svg', '.png'));

      await sharp(inputPath)
        .png() // Convert to PNG format
        .toFile(outputPath);
        
      console.log(`✅ Converted: ${file}`);
    }

    console.log('\n🎉 All images converted successfully!');
    
  } catch (err) {
    console.error('Error during conversion:', err.message);
  }
}

convertSvgToPng();