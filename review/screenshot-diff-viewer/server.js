import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173;

// API endpoint to get image sets
app.get('/api/sets', (req, res) => {
  const sets = {
    'baseline': '/Users/winston/dev/personal/matchina/review/baseline',
    'current': '/Users/winston/dev/personal/matchina/review/current', 
    'after-css-fix': '/Users/winston/dev/personal/matchina/review/after-css-fix',
    'after-theme-fix': '/Users/winston/dev/personal/matchina/review/after-theme-fix'
  };
  
  const result = {};
  Object.entries(sets).forEach(([name, path]) => {
    if (fs.existsSync(path)) {
      result[name] = fs.readdirSync(path).filter(f => f.endsWith('.png'));
    }
  });
  
  res.json(result);
});

// API endpoint to compare two images and detect differences
app.get('/api/diff/:beforeSet/:afterSet/:filename', async (req, res) => {
  const { beforeSet, afterSet, filename } = req.params;
  const validSets = ['baseline', 'current', 'after-css-fix', 'after-theme-fix'];
  
  if (!validSets.includes(beforeSet) || !validSets.includes(afterSet)) {
    return res.status(400).json({ error: 'Invalid set names' });
  }
  
  const beforePath = `/Users/winston/dev/personal/matchina/review/${beforeSet}/${filename}`;
  const afterPath = `/Users/winston/dev/personal/matchina/review/${afterSet}/${filename}`;
  
  if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
    return res.status(404).json({ error: 'Images not found' });
  }
  
  try {
    // Simple pixel comparison - for now just return that they're different
    const beforeStats = fs.statSync(beforePath);
    const afterStats = fs.statSync(afterPath);
    
    const hasDifference = beforeStats.size !== afterStats.size;
    
    res.json({
      filename,
      beforeSet,
      afterSet,
      hasDifference,
      beforeSize: beforeStats.size,
      afterSize: afterStats.size,
      // In a real implementation, you'd use image processing libraries
      // to detect actual pixel differences and generate diff images
      message: hasDifference ? 'Images differ' : 'Images appear identical'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare images' });
  }
});

// Serve images from specific sets
app.get('/:set/:filename', (req, res, next) => {
  const { set, filename } = req.params;
  const validSets = ['baseline', 'current', 'after-css-fix', 'after-theme-fix'];
  
  if (validSets.includes(set) && filename.endsWith('.png')) {
    const filePath = `/Users/winston/dev/personal/matchina/review/${set}/${filename}`;
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
