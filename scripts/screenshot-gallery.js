#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Screenshot Gallery - Scrollable grid view with context
 */

function findScreenshots() {
  const screenshots = [];
  const dirs = [
    'test-results',
    'test/e2e/visual/*.spec.ts-snapshots', 
    'test/e2e/functional/*.spec.ts-snapshots',
    'review/screenshots',
    '.playwright-mcp'
  ];
  
  dirs.forEach(dir => {
    if (dir.includes('*.spec.ts-snapshots')) {
      const specFiles = fs.readdirSync('test/e2e/visual').filter(f => f.endsWith('.spec.ts'));
      specFiles.forEach(specFile => {
        const snapshotDir = `test/e2e/visual/${specFile}-snapshots`;
        if (fs.existsSync(snapshotDir)) {
          const files = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.png'));
          files.forEach(file => {
            screenshots.push({
              path: path.join(snapshotDir, file),
              type: 'snapshot',
              test: specFile,
              size: fs.statSync(path.join(snapshotDir, file)).size,
              date: fs.statSync(path.join(snapshotDir, file)).mtime
            });
          });
        }
      });
    } else if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      files.forEach(file => {
        screenshots.push({
          path: path.join(dir, file),
          type: dir.includes('test-results') ? 'test-result' : dir.includes('review') ? 'review' : 'mcp',
          size: fs.statSync(path.join(dir, file)).size,
          date: fs.statSync(path.join(dir, file)).mtime
        });
      });
    }
  });
  
  return screenshots.sort((a, b) => b.date - a.date);
}

function generateGallery() {
  const screenshots = findScreenshots();
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screenshot Gallery - ${screenshots.length} images</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background: #0a0a0a; 
            color: #fff; 
            padding: 20px;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            text-align: center;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
            margin-bottom: 30px; 
        }
        .stat { 
            background: #1a1a1a; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
            border: 1px solid #333;
        }
        .stat-value { font-size: 24px; font-weight: 700; color: #667eea; }
        .stat-label { font-size: 12px; color: #999; text-transform: uppercase; margin-top: 4px; }
        
        .filters { 
            background: #1a1a1a; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
            display: flex; 
            gap: 10px; 
            flex-wrap: wrap;
            border: 1px solid #333;
        }
        .filter-btn { 
            padding: 8px 16px; 
            border: 1px solid #667eea; 
            background: transparent; 
            color: #667eea; 
            border-radius: 20px; 
            cursor: pointer; 
            transition: all 0.2s;
        }
        .filter-btn:hover, .filter-btn.active { 
            background: #667eea; 
            color: white; 
        }
        
        .gallery { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .screenshot { 
            background: #1a1a1a; 
            border-radius: 12px; 
            overflow: hidden; 
            border: 1px solid #333;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        .screenshot:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        .screenshot-image { 
            width: 100%; 
            height: 200px; 
            object-fit: cover; 
            display: block; 
        }
        .screenshot-info { 
            padding: 15px; 
        }
        .screenshot-name { 
            font-weight: 600; 
            margin-bottom: 8px; 
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .screenshot-meta { 
            font-size: 12px; 
            color: #999; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
        }
        .type-badge { 
            background: #667eea; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 10px; 
            text-transform: uppercase;
        }
        .modal { 
            display: none; 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.9); 
            z-index: 1000; 
            cursor: pointer;
        }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .modal-image { 
            max-width: 90%; 
            max-height: 90%; 
            border-radius: 8px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .modal-close { 
            position: absolute; 
            top: 20px; 
            right: 40px; 
            font-size: 40px; 
            color: white; 
            cursor: pointer;
        }
        .error { 
            background: #dc3545; 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Screenshot Gallery</h1>
        <p>${screenshots.length} screenshots • Scroll through everything</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${screenshots.length}</div>
            <div class="stat-label">Total</div>
        </div>
        <div class="stat">
            <div class="stat-value">${screenshots.filter(s => s.type === 'snapshot').length}</div>
            <div class="stat-label">Tests</div>
        </div>
        <div class="stat">
            <div class="stat-value">${screenshots.filter(s => s.type === 'review').length}</div>
            <div class="stat-label">Review</div>
        </div>
        <div class="stat">
            <div class="stat-value">${screenshots.filter(s => s.type === 'mcp').length}</div>
            <div class="stat-label">MCP</div>
        </div>
    </div>
    
    <div class="filters">
        <button class="filter-btn active" data-type="all">All</button>
        <button class="filter-btn" data-type="snapshot">Tests</button>
        <button class="filter-btn" data-type="review">Review</button>
        <button class="filter-btn" data-type="mcp">MCP</button>
        <button class="filter-btn" data-type="test-result">Failures</button>
    </div>
    
    <div class="gallery">
        ${screenshots.map((screenshot, index) => {
          const fullPath = path.resolve(screenshot.path).replace(/\\/g, '/');
          return `
        <div class="screenshot" data-type="${screenshot.type}" onclick="openModal('${fullPath}')">
            <img src="file://${fullPath}" alt="${path.basename(screenshot.path)}" class="screenshot-image" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIiLz4KPHRleHQgeD0iMTUwIiB5PSIxMDAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+SW1hZ2UgRXJyb3I8L3RleHQ+Cjwvc3ZnPg=='">
            <div class="screenshot-info">
                <div class="screenshot-name">${path.basename(screenshot.path)}</div>
                <div class="screenshot-meta">
                    <span class="type-badge">${screenshot.type}</span>
                    <span>${(screenshot.size / 1024).toFixed(1)}KB</span>
                </div>
            </div>
        </div>
        `;}).join('')}
    </div>
    
    <div class="modal" id="modal" onclick="closeModal()">
        <span class="modal-close">&times;</span>
        <img id="modal-image" class="modal-image" src="" alt="">
    </div>
    
    <script>
        function openModal(path) {
            document.getElementById('modal-image').src = 'file://' + path;
            document.getElementById('modal').classList.add('active');
        }
        
        function closeModal() {
            document.getElementById('modal').classList.remove('active');
        }
        
        // Filter functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const type = btn.dataset.type;
                document.querySelectorAll('.screenshot').forEach(screenshot => {
                    if (type === 'all' || screenshot.dataset.type === type) {
                        screenshot.style.display = 'block';
                    } else {
                        screenshot.style.display = 'none';
                    }
                });
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    </script>
</body>
</html>`;

  const galleryPath = 'test-results/screenshot-gallery.html';
  fs.writeFileSync(galleryPath, html);
  
  console.log(`🖼️  Gallery created: ${galleryPath}`);
  console.log(`📊 ${screenshots.length} screenshots organized by type`);
  
  return galleryPath;
}

// Open gallery in browser
const galleryPath = generateGallery();

import('child_process').then(({ exec }) => {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = `open "${galleryPath}"`;
  } else if (platform === 'win32') {
    command = `start "${galleryPath}"`;
  } else {
    command = `xdg-open "${galleryPath}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open gallery: ${error.message}`);
    } else {
      console.log(`🌐 Gallery opened in browser`);
    }
  });
});
