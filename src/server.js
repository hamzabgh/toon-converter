const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { encode, decode } = require('@toon-format/toon');
const { info, success, warning, error } = require('./utils');

const app = express();
const PORT = 4004;

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// Multer setup for file uploads
const upload = multer({ dest: path.join(__dirname, '../data/') });

// POST route for conversion
app.post('/convert', upload.single('file'), (req, res) => {
  const type = req.body.type; // 'json-to-toon' or 'toon-to-json'
  const file = req.file;

  if (!file) return res.status(400).send('No file uploaded');

  const inputPath = file.path;
  const outputFileName = `${path.parse(file.originalname).name}-${type === 'json-to-toon' ? 'converted.toon' : 'converted.json'}`;
  const outputPath = path.join(__dirname, '../output/', outputFileName);

  try {
    let result;
    if (type === 'json-to-toon') {
      const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      result = encode(data);
    } else if (type === 'toon-to-json') {
      const data = fs.readFileSync(inputPath, 'utf8');
      result = JSON.stringify(decode(data), null, 2);
    } else {
      return res.status(400).send('Invalid conversion type');
    }

    // Ensure output folder exists
    if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, result, 'utf8');

    success(`File converted successfully: ${outputFileName}`);
    res.download(outputPath, outputFileName, (err) => {
      if (err) error(`Download error: ${err.message}`);
    });
  } catch (err) {
    error(`Conversion error: ${err.message}`);
    res.status(500).send('Conversion failed');
  } finally {
    // Remove uploaded file
    fs.unlinkSync(inputPath);
  }
});

app.listen(PORT, () => {
  info(`🚀 Server running at http://localhost:${PORT}`);
});
