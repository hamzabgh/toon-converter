const fs = require('fs');
const path = require('path');
const { encode } = require('@toon-format/toon');
const { info, success, warning, error } = require('./utils');

function jsonToToon(inputPath, outputPath) {
  try {
    if (!fs.existsSync(inputPath)) {
      error(`❌ Input file does not exist: ${inputPath}`);
      return;
    }

    info(`📂 Reading JSON file: ${inputPath}`);
    const jsonData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    info('✨ Converting JSON → TOON...');
    const toonText = encode(jsonData);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(outputPath, toonText, 'utf8');

    success(`✔ Conversion successful!`);
    info(`➡ Output saved at: ${outputPath}`);
    info(`📄 JSON size: ${Buffer.byteLength(JSON.stringify(jsonData), 'utf8')} bytes`);
    info(`📄 TOON size: ${Buffer.byteLength(toonText, 'utf8')} bytes`);
  } catch (err) {
    error(`❌ Error: ${err.message}`);
  }
}

// CLI
const [,, input, output] = process.argv;
if (input && output) {
  jsonToToon(input, output);
} else {
  warning("Usage: node json-to-toon.js <input.json> <output.toon>");
}
