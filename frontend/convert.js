const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const folderPath = path.join(__dirname, 'public', 'doctors');

async function convertImages() {
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.svg'));
  console.log(`Found ${files.length} SVGs. Converting...`);

  for (const file of files) {
    const input = path.join(folderPath, file);
    const output = path.join(folderPath, file.replace('.svg', '.png'));

    await sharp(input).png().toFile(output);
    console.log(`Converted: ${file} -> .png`);
  }
  process.exit();
}

convertImages();