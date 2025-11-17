const fs = require('fs');
const path = require('path');
const { decode } = require('@toon-format/toon');
const { info, success, warning, error } = require('./utils');

function toonToJson(inputPath, outputPath) {
  try {
    if (!fs.existsSync(inputPath)) {
      error(`❌ Input file does not exist: ${inputPath}`);
      return;
    }

    info(`📂 Reading TOON file: ${inputPath}`);
    const toonText = fs.readFileSync(inputPath, 'utf8');

    info('✨ Converting TOON → JSON...');
    const jsonData = decode(toonText);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');

    success(`✔ Conversion successful!`);
    info(`➡ Output saved at: ${outputPath}`);
    info(`📄 TOON size: ${Buffer.byteLength(toonText, 'utf8')} bytes`);
    info(`📄 JSON size: ${Buffer.byteLength(JSON.stringify(jsonData), 'utf8')} bytes`);
  } catch (err) {
    error(`❌ Error: ${err.message}`);
  }
}

// CLI
const [,, input, output] = process.argv;
if (input && output) {
  toonToJson(input, output);
} else {
  warning("Usage: node toon-to-json.js <input.toon> <output.json>");
}
