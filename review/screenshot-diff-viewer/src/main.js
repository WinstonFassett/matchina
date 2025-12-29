import './style.css'

// Dynamic image loading
let availableImages = [];

async function loadImages() {
  try {
    const response = await fetch('/api/images');
    availableImages = await response.json();
  } catch (error) {
    console.error('Failed to load images:', error);
    availableImages = [];
  }
}

const SET_NAMES = {
  'baseline/upstream': 'Baseline (Upstream)',
  'current': 'Current Branch',
  'after-css-fix': 'After CSS Fix',
  'after-theme-fix': 'After Theme Fix'
};

let currentImages = [];
let currentView = 'slider';

function parseImageName(filename) {
  const parts = filename.replace('.png', '').split('-');
  return {
    type: parts[0],
    theme: parts[1],
    layout: parts[2],
    state: parts.slice(3).join('-')
  };
}

function updateStats() {
  document.getElementById('stats').innerHTML = `
    <strong>Available Images:</strong> ${availableImages.length}<br>
    <strong>Filtered Images:</strong> ${currentImages.length}<br>
    <strong>View Mode:</strong> ${currentView}
  `;
}

function loadComparison() {
  if (availableImages.length === 0) {
    currentImages = [];
    renderComparisons();
    return;
  }

  const typeFilter = document.getElementById('typeFilter').value;
  const themeFilter = document.getElementById('themeFilter').value;
  const layoutFilter = document.getElementById('layoutFilter').value;
  
  let filteredImages = availableImages;
  
  if (typeFilter) {
    filteredImages = filteredImages.filter(img => parseImageName(img).type === typeFilter);
  }
  if (themeFilter) {
    filteredImages = filteredImages.filter(img => parseImageName(img).theme === themeFilter);
  }
  if (layoutFilter) {
    filteredImages = filteredImages.filter(img => parseImageName(img).layout === layoutFilter);
  }

  currentImages = filteredImages;
  renderComparisons();
  updateFilterInfo();
}

function updateFilterInfo() {
  const filterInfo = document.getElementById('filterInfo');
  const typeFilter = document.getElementById('typeFilter').value;
  const themeFilter = document.getElementById('themeFilter').value;
  const layoutFilter = document.getElementById('layoutFilter').value;
  
  const activeFilters = [];
  if (typeFilter) activeFilters.push(`type: ${typeFilter}`);
  if (themeFilter) activeFilters.push(`theme: ${themeFilter}`);
  if (layoutFilter) activeFilters.push(`layout: ${layoutFilter}`);
  
  if (activeFilters.length > 0) {
    filterInfo.style.display = 'block';
    filterInfo.innerHTML = `🔍 Filtering by: ${activeFilters.join(', ')} - Showing ${currentImages.length} of ${availableImages.length} images`;
  } else {
    filterInfo.style.display = 'none';
  }
}

function renderComparisons() {
  const container = document.getElementById('comparisons');
  
  if (currentImages.length === 0) {
    container.innerHTML = '<div class="loading">No images found for the selected criteria</div>';
    return;
  }

  container.innerHTML = currentImages.map(imageName => {
    const parsed = parseImageName(imageName);
    const imagePath = `/${imageName}`;
    
    if (currentView === 'slider') {
      return `
        <div class="comparison-card">
          <div class="card-header">
            ${parsed.type} - ${parsed.theme} - ${parsed.layout} - ${parsed.state}
          </div>
          <div class="image-container">
            <div class="slider-container" data-image="${imageName}">
              <img src="${imagePath}" class="before-image" alt="Before">
              <img src="${imagePath}" class="after-image" alt="After">
              <div class="slider-handle"></div>
            </div>
          </div>
        </div>
      `;
    } else if (currentView === 'side-by-side') {
      return `
        <div class="comparison-card">
          <div class="card-header">
            ${parsed.type} - ${parsed.theme} - ${parsed.layout} - ${parsed.state}
          </div>
          <div class="side-by-side" style="height: 200px;">
            <img src="${imagePath}" alt="Before">
            <img src="${imagePath}" alt="After">
          </div>
        </div>
      `;
    } else {
      return `
        <div class="comparison-card">
          <div class="card-header">
            ${parsed.type} - ${parsed.theme} - ${parsed.layout} - ${parsed.state}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #ddd; height: 200px;">
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 12px; display: flex; align-items: center; justify-content: center;">Image</div>
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 12px; display: flex; align-items: center; justify-content: center;">Image</div>
            <img src="${imagePath}" alt="Image" style="grid-column: 1;">
            <img src="${imagePath}" alt="Image" style="grid-column: 2;">
          </div>
        </div>
      `;
    }
  }).join('');

  if (currentView === 'slider') {
    setupSliders();
  }
}

function setupSliders() {
  document.querySelectorAll('.slider-container').forEach(container => {
    const handle = container.querySelector('.slider-handle');
    const afterImage = container.querySelector('.after-image');
    let isDragging = false;

    function updateSlider(x) {
      const rect = container.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
      handle.style.left = percent + '%';
      afterImage.style.clipPath = `inset(0 0 0 ${percent}%)`;
    }

    handle.addEventListener('mousedown', () => isDragging = true);
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        updateSlider(e.clientX);
      }
    });
    
    document.addEventListener('mouseup', () => isDragging = false);
    
    container.addEventListener('click', (e) => {
      if (!isDragging) {
        updateSlider(e.clientX);
      }
    });
  });
}

async function initialize() {
  // Load images first
  await loadImages();

  // Extract unique values for filters from loaded images
  const types = [...new Set(availableImages.map(img => parseImageName(img).type).sort())];
  const themes = [...new Set(availableImages.map(img => parseImageName(img).theme).sort())];
  const layouts = [...new Set(availableImages.map(img => parseImageName(img).layout).sort())];

  // Populate filters
  const typeFilter = document.getElementById('typeFilter');
  const themeFilter = document.getElementById('themeFilter');
  const layoutFilter = document.getElementById('layoutFilter');

  types.forEach(type => {
    typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
  });
  themes.forEach(theme => {
    themeFilter.innerHTML += `<option value="${theme}">${theme}</option>`;
  });
  layouts.forEach(layout => {
    layoutFilter.innerHTML += `<option value="${layout}">${layout}</option>`;
  });

  updateStats();
  loadComparison();

  // Event listeners
  typeFilter.addEventListener('change', loadComparison);
  themeFilter.addEventListener('change', loadComparison);
  layoutFilter.addEventListener('change', loadComparison);

  document.getElementById('compareBtn').addEventListener('click', loadComparison);
  
  document.getElementById('resetBtn').addEventListener('click', () => {
    typeFilter.value = '';
    themeFilter.value = '';
    layoutFilter.value = '';
    updateStats();
    loadComparison();
  });

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderComparisons();
    });
  });
}

document.querySelector('#app').innerHTML = `
  <div class="header">
    <h1>🖼️ Screenshot Viewer</h1>
    <div class="stats" id="stats">
      <div class="loading">Loading images...</div>
    </div>
  </div>

  <div class="controls">
    <div class="control-group">
      <label>Filter by Type</label>
      <select id="typeFilter">
        <option value="">All Types</option>
      </select>
    </div>

    <div class="control-group">
      <label>Filter by Theme</label>
      <select id="themeFilter">
        <option value="">All Themes</option>
      </select>
    </div>

    <div class="control-group">
      <label>Filter by Layout</label>
      <select id="layoutFilter">
        <option value="">All Layouts</option>
      </select>
    </div>

    <button id="compareBtn">Refresh</button>
    <button id="resetBtn">Reset</button>
  </div>

  <div class="view-toggle">
    <button class="view-btn active" data-view="slider">Slider View</button>
    <button class="view-btn" data-view="side-by-side">Side by Side</button>
    <button class="view-btn" data-view="grid">Grid View</button>
  </div>

  <div class="filter-info" id="filterInfo" style="display: none;"></div>

  <div id="comparisons" class="grid-view"></div>
`;

initialize();
