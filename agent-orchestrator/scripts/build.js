const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'src', 'server.js');
const destinationDir = path.join(__dirname, '..', 'dist');
const destination = path.join(destinationDir, 'server.js');

if (!fs.existsSync(source)) {
  console.error(`Source file not found: ${source}`);
  process.exit(1);
}

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log(`Copied ${source} -> ${destination}`);
