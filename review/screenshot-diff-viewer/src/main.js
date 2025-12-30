import './style.css'

// Dynamic image loading
let imageSets = {};

async function loadImageSets() {
  try {
    const response = await fetch('/api/sets');
    imageSets = await response.json();
  } catch (error) {
    console.error('Failed to load image sets:', error);
    imageSets = {};
  }
}

const SET_NAMES = {
  'baseline': 'Baseline',
  'current': 'Current',
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
  const beforeSet = document.getElementById('beforeSet').value;
  const afterSet = document.getElementById('afterSet').value;
  
  if (!beforeSet || !afterSet) {
    document.getElementById('stats').innerHTML = '<div class="loading">Select image sets to compare</div>';
    return;
  }

  const beforeCount = imageSets[beforeSet]?.length || 0;
  const afterCount = imageSets[afterSet]?.length || 0;
  
  document.getElementById('stats').innerHTML = `
    <strong>Image Sets:</strong> ${SET_NAMES[beforeSet]} vs ${SET_NAMES[afterSet]}<br>
    <strong>Images:</strong> ${beforeCount} vs ${afterCount}<br>
    <strong>Comparisons:</strong> ${Math.min(beforeCount, afterCount)} pairs
  `;
}

function loadComparison() {
  const beforeSet = document.getElementById('beforeSet').value;
  const afterSet = document.getElementById('afterSet').value;
  
  if (!beforeSet || !afterSet) return;

  const beforeImages = imageSets[beforeSet] || [];
  const afterImages = imageSets[afterSet] || [];
  
  const commonImages = beforeImages.filter(img => afterImages.includes(img));
  
  const typeFilter = document.getElementById('typeFilter').value;
  const themeFilter = document.getElementById('themeFilter').value;
  const layoutFilter = document.getElementById('layoutFilter').value;
  
  let filteredImages = commonImages;
  
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
  const beforeSet = document.getElementById('beforeSet').value;
  const afterSet = document.getElementById('afterSet').value;
  const typeFilter = document.getElementById('typeFilter').value;
  const themeFilter = document.getElementById('themeFilter').value;
  const layoutFilter = document.getElementById('layoutFilter').value;
  
  const activeFilters = [];
  if (typeFilter) activeFilters.push(`type: ${typeFilter}`);
  if (themeFilter) activeFilters.push(`theme: ${themeFilter}`);
  if (layoutFilter) activeFilters.push(`layout: ${layoutFilter}`);
  
  const totalCommon = (imageSets[beforeSet] || []).filter(img => (imageSets[afterSet] || []).includes(img)).length;
  
  if (activeFilters.length > 0) {
    filterInfo.style.display = 'block';
    filterInfo.innerHTML = `🔍 Filtering by: ${activeFilters.join(', ')} - Showing ${currentImages.length} of ${totalCommon} common images`;
  } else {
    filterInfo.style.display = 'none';
  }
}

async function renderComparisons() {
  const container = document.getElementById('comparisons');
  const beforeSet = document.getElementById('beforeSet').value;
  const afterSet = document.getElementById('afterSet').value;
  
  if (currentImages.length === 0) {
    container.innerHTML = '<div class="loading">No images found for the selected criteria</div>';
    return;
  }

  // Check for differences
  const diffResults = await Promise.all(
    currentImages.map(async imageName => {
      try {
        const response = await fetch(`/api/diff/${beforeSet}/${afterSet}/${imageName}`);
        return await response.json();
      } catch (error) {
        return { filename: imageName, hasDifference: false, error: true };
      }
    })
  );

  container.innerHTML = currentImages.map((imageName, index) => {
    const parsed = parseImageName(imageName);
    const beforePath = `/${beforeSet}/${imageName}`;
    const afterPath = `/${afterSet}/${imageName}`;
    const diffResult = diffResults[index];
    const hasDiff = diffResult.hasDifference;
    
    const diffIndicator = hasDiff ? 
      '<span style="color: #dc3545; font-weight: bold;">● DIFF</span>' : 
      '<span style="color: #28a745;">● SAME</span>';
    
    if (currentView === 'slider') {
      return `
        <div class="comparison-card" style="${hasDiff ? 'border: 2px solid #dc3545;' : ''}">
          <div class="card-header">
            ${diffIndicator} ${parsed.type} - ${parsed.theme} - ${parsed.layout} - ${parsed.state}
            ${hasDiff ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">Size: ${diffResult.beforeSize} → ${diffResult.afterSize} bytes</div>` : ''}
            <button class="animate-slider-btn" data-image="${imageName}" style="margin-top: 8px; padding: 4px 8px; font-size: 11px;">Animate Slider</button>
          </div>
          <div class="image-container">
            <div class="slider-container" data-image="${imageName}">
              <img src="${beforePath}" class="before-image" alt="Before">
              <img src="${afterPath}" class="after-image" alt="After">
              <div class="slider-handle"></div>
            </div>
          </div>
        </div>
      `;
    } else if (currentView === 'side-by-side') {
      return `
        <div class="comparison-card" style="${hasDiff ? 'border: 2px solid #dc3545;' : ''}">
          <div class="card-header">
            ${diffIndicator} ${parsed.type} - ${parsed.theme} - ${parsed.layout} - ${parsed.state}
            ${hasDiff ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">Size: ${diffResult.beforeSize} → ${diffResult.afterSize} bytes</div>` : ''}
          </div>
          <div class="side-by-side">
            <img src="${beforePath}" alt="Before">
            <img src="${afterPath}" alt="After">
          </div>
        </div>
      `;
    } else {
      return `
        <div class="comparison-card" style="${hasDiff ? 'border: 2px solid #dc3545;' : ''}">
          <div class="card-header">
            ${diffIndicator} ${parsed.type} - ${parsed.theme} - ${parsed.layout} - ${parsed.state}
            ${hasDiff ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">Size: ${diffResult.beforeSize} → ${diffResult.afterSize} bytes</div>` : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: #333; height: 400px;">
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 12px; display: flex; align-items: center; justify-content: center;">Before</div>
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 12px; display: flex; align-items: center; justify-content: center;">After</div>
            <img src="${beforePath}" alt="Before" style="grid-column: 1;">
            <img src="${afterPath}" alt="After" style="grid-column: 2;">
          </div>
        </div>
      `;
    }
  }).join('');

  if (currentView === 'slider') {
    setupSliders();
    setupSliderAnimations();
  }
}

function setupSliders() {
  let isDragging = false;
  let currentContainer = null;
  let dragStartX = 0;
  let dragStartPositions = {};

  function updateAllSliders(x) {
    const deltaX = x - dragStartX;
    document.querySelectorAll('.slider-container').forEach(container => {
      const handle = container.querySelector('.slider-handle');
      const afterImage = container.querySelector('.after-image');
      const rect = container.getBoundingClientRect();
      const startPos = dragStartPositions[container.dataset.image] || 0.5;
      const position = Math.max(0, Math.min(1, startPos + (deltaX / rect.width)));
      handle.style.left = `${position * 100}%`;
      afterImage.style.clipPath = `inset(0 0 0 ${position * 100}%)`;
    });
  }

  function updateSlider(x, container) {
    const handle = container.querySelector('.slider-handle');
    const afterImage = container.querySelector('.after-image');
    const rect = container.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    handle.style.left = `${position * 100}%`;
    afterImage.style.clipPath = `inset(0 0 0 ${position * 100}%)`;
  }

  document.querySelectorAll('.slider-container').forEach(container => {
    const handle = container.querySelector('.slider-handle');

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      currentContainer = container;
      dragStartX = e.clientX;
      
      // Store current positions for all sliders
      document.querySelectorAll('.slider-container').forEach(c => {
        const h = c.querySelector('.slider-handle');
        const currentLeft = parseFloat(h.style.left) || 50;
        dragStartPositions[c.dataset.image] = currentLeft / 100;
      });
      
      e.preventDefault();
    });
    
    container.addEventListener('click', (e) => {
      if (!isDragging) {
        updateAllSliders(e.clientX);
      }
    });
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    currentContainer = null;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      updateAllSliders(e.clientX);
    }
  });
}

function setupSliderAnimations() {
  let globalAnimation = null;
  let globalStartTime = null;

  document.querySelectorAll('.animate-slider-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Stop any existing animation
      if (globalAnimation) {
        document.querySelectorAll('.animate-slider-btn').forEach(b => {
          b.dataset.animating = 'false';
          b.textContent = 'Animate Slider';
        });
        globalAnimation = null;
        globalStartTime = null;
        return;
      }
      
      // Start global animation
      document.querySelectorAll('.animate-slider-btn').forEach(b => {
        b.dataset.animating = 'true';
        b.textContent = 'Stop Animation';
      });
      
      globalStartTime = Date.now();
      const duration = 1000; // 1 second per swing
      
      const animate = () => {
        if (!globalStartTime) return;
        
        const elapsed = Date.now() - globalStartTime;
        const progress = (elapsed % duration) / duration;
        // Oscillate between 0 and 1 (full dimensions)
        const position = 0.5 + Math.sin(progress * Math.PI * 2) * 0.5;
        
        // Update all sliders
        document.querySelectorAll('.slider-container').forEach(container => {
          const handle = container.querySelector('.slider-handle');
          const afterImage = container.querySelector('.after-image');
          handle.style.left = `${position * 100}%`;
          afterImage.style.clipPath = `inset(0 0 0 ${position * 100}%)`;
        });
        
        globalAnimation = requestAnimationFrame(animate);
      };
      
      animate();
    });
  });
}

async function initialize() {
// Load image sets first
await loadImageSets();

// Populate set selectors
  const beforeSelect = document.getElementById('beforeSet');
  const afterSelect = document.getElementById('afterSet');
  
  Object.entries(SET_NAMES).forEach(([path, name]) => {
    if (imageSets[path]) {
      beforeSelect.innerHTML += `<option value="${path}">${name}</option>`;
      afterSelect.innerHTML += `<option value="${path}">${name}</option>`;
    }
  });

  // Set default selections
  const availableSets = Object.keys(imageSets);
  if (availableSets.length >= 2) {
    beforeSelect.value = availableSets[0];
    afterSelect.value = availableSets[1];
  }

  // Extract unique values for filters from all images
  const allImages = Object.values(imageSets).flat();
  const types = [...new Set(allImages.map(img => parseImageName(img).type).sort())];
  const themes = [...new Set(allImages.map(img => parseImageName(img).theme).sort())];
  const layouts = [...new Set(allImages.map(img => parseImageName(img).layout).sort())];

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
  beforeSelect.addEventListener('change', () => {
    updateStats();
    loadComparison();
  });
  afterSelect.addEventListener('change', () => {
    updateStats();
    loadComparison();
  });
  typeFilter.addEventListener('change', loadComparison);
  themeFilter.addEventListener('change', loadComparison);
  layoutFilter.addEventListener('change', loadComparison);

  document.getElementById('compareBtn').addEventListener('click', loadComparison);
  
  document.getElementById('resetBtn').addEventListener('click', () => {
    const availableSets = Object.keys(imageSets);
    if (availableSets.length >= 2) {
      beforeSelect.value = availableSets[0];
      afterSelect.value = availableSets[1];
    }
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
    <h1>🖼️ Screenshot Diff Viewer</h1>
    <div class="stats" id="stats">
      <div class="loading">Loading image sets...</div>
    </div>
  </div>

  <div class="controls">
    <div class="control-group">
      <label>Before Set</label>
      <select id="beforeSet">
        <option value="">Select baseline...</option>
      </select>
    </div>
    
    <div class="control-group">
      <label>After Set</label>
      <select id="afterSet">
        <option value="">Select comparison...</option>
      </select>
    </div>

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

    <button id="compareBtn">Compare Sets</button>
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
