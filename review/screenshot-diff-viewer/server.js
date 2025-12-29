import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173;

// API endpoint to get image list
app.get('/api/images', (req, res) => {
  const screenshotsDir = '/Users/winston/dev/personal/matchina/review/screenshots/all-visualizers';
  const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
  res.json(files);
});

// Serve individual images
app.get('/:filename', (req, res, next) => {
  if (req.params.filename.endsWith('.png')) {
    const filePath = `/Users/winston/dev/personal/matchina/review/screenshots/all-visualizers/${req.params.filename}`;
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  next();
});

// Serve the main app
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - ONLY for routes that don't start with /api or aren't .png files
app.use((req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.endsWith('.png')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
