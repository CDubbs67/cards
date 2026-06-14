/* ==========================================================================
   Lorebeast Portal JS Logic
   ========================================================================== */

// 1. Monster Database Definitions
const MONSTERS = [
  {
    id: "ignisaur",
    name: "Ignisaur",
    element: "fire",
    lore: "Born from the heart of an active volcano, Ignisaur guards the ancient magma chambers. Its shell is molten obsidian, and its breath can melt steel instantly. Legend says it wakes only when tectonic shifts threaten its homeland.",
    stats: { attack: 85, defense: 90, speed: 40 },
    image: "assets/monsters/ignisaur.png"
  },
  {
    id: "glaciarix",
    name: "Glaciarix",
    element: "ice",
    lore: "A majestic phoenix whose feathers are made of everlasting ice. It resides on the highest peaks of the Shivering Spires, bringing blizzards with a single flap of its wings. Its icy breath can freeze time itself for brief moments.",
    stats: { attack: 75, defense: 65, speed: 95 },
    image: "assets/monsters/glaciarix.png"
  },
  {
    id: "terraclaw",
    name: "Terraclaw",
    element: "earth",
    lore: "A gigantic golem formed from tectonic shifting. Terraclaw wanders the deep canyons, shaping the terrain with its massive granite fists. Despite its fearsome appearance, it is a protector of subterranean eco-systems.",
    stats: { attack: 95, defense: 99, speed: 15 },
    image: "assets/monsters/terraclaw.png"
  },
  {
    id: "astroslime",
    name: "Astroslime",
    element: "cosmic",
    lore: "A gelatinous alien entity that fell from a passing comet. Astroslime is composed of dark matter and sparkling star-dust. It can warp gravitational fields nearby, floating effortlessly and passing through solid structures.",
    stats: { attack: 60, defense: 50, speed: 70 },
    image: "assets/monsters/astroslime.png"
  },
  {
    id: "electrosyren",
    name: "Electrosyren",
    element: "lightning",
    lore: "A serpentine creature that swims through storm clouds. Electrosyren feeds on lightning strikes and can unleash high-voltage electromagnetic waves to neutralize threats. Its hum sounds like high-tension power lines.",
    stats: { attack: 90, defense: 60, speed: 85 },
    image: "assets/monsters/electrosyren.png"
  },
  {
    id: "shadowlurker",
    name: "Shadowlurker",
    element: "shadow",
    lore: "A phantom that lives in the spaces between shadows. Shadowlurker has no permanent physical form and feeds on the residual ambient fear of lost travelers in the Whispering Woods. It is highly evasive and vanishes when exposed to light.",
    stats: { attack: 80, defense: 45, speed: 90 },
    image: "assets/monsters/shadowlurker.png"
  }
];

// 2. Application State
let unlockedMonsters = new Set();
let activeScanner = null;
let currentView = 'gallery'; // 'gallery', 'scanner', 'portal'

// 3. Audio Synthesizer (Web Audio API)
// Creates premium retro sci-fi sounds dynamically without downloading assets
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (type === 'click') {
    // Futuristic tick
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } 
  else if (type === 'scanner-start') {
    // Low electronic hum rising to a beep
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.linearRampToValueAtTime(300, now + 0.4);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.linearRampToValueAtTime(800, now + 0.4);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }
  else if (type === 'portal-unlock') {
    // Epic portal sound: sweep up + resonance synth pad
    const duration = 1.2;
    
    // Sweep oscillator
    const oscSweep = audioCtx.createOscillator();
    const oscPad1 = audioCtx.createOscillator();
    const oscPad2 = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    oscSweep.type = 'triangle';
    oscSweep.frequency.setValueAtTime(150, now);
    oscSweep.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

    oscPad1.type = 'sawtooth';
    oscPad1.frequency.setValueAtTime(220, now); // A3 chord

    oscPad2.type = 'triangle';
    oscPad2.frequency.setValueAtTime(330, now); // E4

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscSweep.connect(filter);
    oscPad1.connect(filter);
    oscPad2.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    oscSweep.start(now);
    oscPad1.start(now);
    oscPad2.start(now);
    oscSweep.stop(now + duration);
    oscPad1.stop(now + duration);
    oscPad2.stop(now + duration);
  }
}

// 4. Initial DOM Elements Cache
const elGrid = document.getElementById('monster-grid');
const elProgressText = document.getElementById('progress-text');
const elProgressFill = document.getElementById('progress-fill');
const elViewGallery = document.getElementById('view-gallery');
const elViewScanner = document.getElementById('view-scanner');
const elViewPortal = document.getElementById('view-portal');
const elPortalContent = document.getElementById('portal-content');

const btnStartScanner = document.getElementById('start-scanner-btn');
const btnStopScanner = document.getElementById('stop-scanner-btn');
const btnResetCollection = document.getElementById('reset-collection-btn');

// 5. Initialize Application
function init() {
  loadCollection();
  renderGallery();
  updateProgressUI();
  handleUrlRouting();
  setupEventListeners();
}

// Load unlocked list from localStorage
function loadCollection() {
  try {
    const data = localStorage.getItem('lorebeast_unlocked');
    if (data) {
      const parsed = JSON.parse(data);
      unlockedMonsters = new Set(parsed);
    }
  } catch (err) {
    console.error("Error loading collection from localStorage:", err);
  }
}

// Save unlocked list to localStorage
function saveCollection() {
  try {
    localStorage.setItem('lorebeast_unlocked', JSON.stringify([...unlockedMonsters]));
  } catch (err) {
    console.error("Error saving collection to localStorage:", err);
  }
}

// Render the grid list of monsters
function renderGallery() {
  elGrid.innerHTML = '';
  
  MONSTERS.forEach(monster => {
    const isUnlocked = unlockedMonsters.has(monster.id);
    const card = document.createElement('div');
    card.className = `monster-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.setAttribute('data-element', monster.element);
    card.setAttribute('data-id', monster.id);
    
    let htmlContent = '';
    
    if (isUnlocked) {
      // Unlocked State Content
      htmlContent = `
        <div class="element-badge">${monster.element}</div>
        <div class="card-visuals">
          <img src="${monster.image}" class="card-img" alt="${monster.name}">
        </div>
        <div class="card-body">
          <h3 class="card-title">${monster.name}</h3>
          <p class="card-desc">${monster.lore.slice(0, 95)}...</p>
          <div class="card-qr-block">
            <div class="qr-image-wrapper" id="qr-${monster.id}"></div>
            <div class="qr-actions">
              <span class="qr-tip">Share code or scan on another device to transfer data.</span>
              <button class="btn btn-secondary btn-xs btn-view-portal" data-id="${monster.id}">Open Portal View</button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Locked State Content
      htmlContent = `
        <div class="element-badge">locked</div>
        <div class="card-visuals">
          <div class="locked-overlay">
            <svg class="locked-glyph" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            <div class="locked-text">Beast Locked</div>
          </div>
          <div class="scanlines"></div>
          <img src="${monster.image}" class="card-img" alt="Locked Monster">
        </div>
        <div class="card-body">
          <h3 class="card-title">???</h3>
          <p class="card-desc">Scan the corresponding digital matrix glyph to materialize and unlock this mysterious specimen's records.</p>
          <div class="card-qr-block">
            <div class="qr-image-wrapper" id="qr-${monster.id}"></div>
            <div class="qr-actions">
              <button class="btn btn-primary btn-xs btn-simulate" data-id="${monster.id}">Simulate Scan</button>
              <span class="qr-tip">Scan QR above with a phone or click "Simulate" to unlock.</span>
            </div>
          </div>
        </div>
      `;
    }
    
    card.innerHTML = htmlContent;
    elGrid.appendChild(card);

    // Generate QR Code dynamically client-side (fully compatible with GitHub Pages)
    const targetUrl = `${window.location.origin}${window.location.pathname}?monster=${monster.id}`;
    new QRCode(document.getElementById(`qr-${monster.id}`), {
      text: targetUrl,
      width: 78,
      height: 78,
      colorDark : "#0f172a",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.M
    });
  });
  
  // Attach event handlers for newly rendered DOM cards
  attachCardEvents();
}

// Attach event listeners to gallery items
function attachCardEvents() {
  // Portal viewing button
  document.querySelectorAll('.btn-view-portal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const id = btn.getAttribute('data-id');
      openMonsterPortal(id);
    });
  });
  
  // Simulate scan click
  document.querySelectorAll('.btn-simulate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      unlockMonster(id, true);
    });
  });

  // Make whole unlocked cards clickable to show portal details
  document.querySelectorAll('.monster-card.unlocked').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      playSound('click');
      openMonsterPortal(id);
    });
  });
}

// Update the index metrics progress bar
function updateProgressUI() {
  const total = MONSTERS.length;
  const unlocked = unlockedMonsters.size;
  const percentage = (unlocked / total) * 100;
  
  elProgressText.innerText = `${unlocked} / ${total} DISCOVERED`;
  elProgressFill.style.width = `${percentage}%`;
}

// View switcher layout router
function switchView(target) {
  currentView = target;
  
  // Fade out current views
  [elViewGallery, elViewScanner, elViewPortal].forEach(view => {
    view.classList.remove('active');
  });
  
  // Fade in target view
  setTimeout(() => {
    if (target === 'gallery') elViewGallery.classList.add('active');
    if (target === 'scanner') elViewScanner.classList.add('active');
    if (target === 'portal') elViewPortal.classList.add('active');
  }, 100);
}

// Unlock a monster
function unlockMonster(id, forcePortalView = false) {
  const monster = MONSTERS.find(m => m.id === id);
  if (!monster) return;

  const isNewUnlock = !unlockedMonsters.has(id);
  
  if (isNewUnlock) {
    unlockedMonsters.add(id);
    saveCollection();
    updateProgressUI();
    renderGallery();
    playSound('portal-unlock');
  }
  
  if (isNewUnlock || forcePortalView) {
    openMonsterPortal(id, isNewUnlock);
  }
}

// Open Portal details screen
function openMonsterPortal(id, isNewUnlock = false) {
  const monster = MONSTERS.find(m => m.id === id);
  if (!monster) return;
  
  switchView('portal');
  
  elPortalContent.innerHTML = `
    <div class="portal-element-card ${isNewUnlock ? 'portal-unlocked-flash' : ''} portal-card-unlocked" data-element="${monster.element}">
      
      <div class="portal-art-panel">
        <div class="portal-badge-absolute">
          <span class="portal-badge">${monster.element} type</span>
        </div>
        <div class="portal-art-glow"></div>
        <img src="${monster.image}" class="portal-img" alt="${monster.name}">
      </div>

      <div class="portal-info-panel">
        ${isNewUnlock ? `
          <div class="portal-unlocked-banner animate-pulse">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            BEAST ENCODED & INTEGRATED
          </div>
        ` : ''}
        
        <h2 class="portal-monster-name">${monster.name}</h2>
        <div class="portal-monster-element">${monster.element} element</div>
        
        <div class="portal-lore-section">
          <div class="portal-section-title">Database Records</div>
          <p class="portal-lore-text">${monster.lore}</p>
        </div>
        
        <div class="portal-stats-section">
          <div class="portal-section-title">Combat Metrics</div>
          
          <div class="stat-row">
            <span class="stat-name">ATTACK</span>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" id="stat-att" style="width: 0%"></div>
            </div>
            <span class="stat-val">${monster.stats.attack}</span>
          </div>

          <div class="stat-row">
            <span class="stat-name">DEFENSE</span>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" id="stat-def" style="width: 0%"></div>
            </div>
            <span class="stat-val">${monster.stats.defense}</span>
          </div>

          <div class="stat-row">
            <span class="stat-name">SPEED</span>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" id="stat-spd" style="width: 0%"></div>
            </div>
            <span class="stat-val">${monster.stats.speed}</span>
          </div>
        </div>
        
        <div class="portal-actions">
          <button class="btn btn-primary btn-block btn-portal-close">← Exit Portal Database</button>
        </div>
      </div>
      
    </div>
  `;

  // Animate stat bars filling up after view transitions
  setTimeout(() => {
    const elAtt = document.getElementById('stat-att');
    const elDef = document.getElementById('stat-def');
    const elSpd = document.getElementById('stat-spd');
    
    if (elAtt) elAtt.style.width = `${monster.stats.attack}%`;
    if (elDef) elDef.style.width = `${monster.stats.defense}%`;
    if (elSpd) elSpd.style.width = `${monster.stats.speed}%`;
  }, 150);
  
  // Close portal view button listener
  document.querySelector('.btn-portal-close').addEventListener('click', () => {
    playSound('click');
    switchView('gallery');
    // Clear URL parameter so refreshing doesn't automatically trigger portal
    window.history.replaceState({}, document.title, window.location.pathname);
  });
}

// Camera Scanner Handling
function startScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    alert("Scanning library is still loading. Please check network connection and try again.");
    return;
  }
  
  // Reset scan viewport overlays
  const elReticle = document.querySelector('.scanner-reticle');
  if (elReticle) elReticle.style.display = 'block';
  const elReader = document.getElementById('interactive-reader');
  if (elReader) elReader.innerHTML = '';
  
  switchView('scanner');
  playSound('scanner-start');
  
  activeScanner = new Html5Qrcode("interactive-reader");
  const config = { 
    fps: 15, 
    qrbox: (width, height) => {
      const minDimension = Math.min(width, height);
      const boxSize = Math.floor(minDimension * 0.7);
      return { width: boxSize, height: boxSize };
    }
  };
  
  activeScanner.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      handleScanSuccess(decodedText);
    },
    (errorMessage) => {
      // Suppress spamming errors
    }
  ).catch(err => {
    console.warn("Live camera connection failed:", err);
    
    // Hide overlay outline reticle
    if (elReticle) elReticle.style.display = 'none';
    
    // Show descriptive secure-context camera error
    if (elReader) {
      elReader.innerHTML = `
        <div class="scanner-camera-error">
          <svg class="icon error-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <div class="error-title">Live Video Unavailable</div>
          <div class="error-subtitle">Mobile browsers restrict camera streams over non-secure HTTP networks. Connect via HTTPS, localhost, or upload a photo below!</div>
          <div class="error-tip">Tap <strong>Upload / Take Photo</strong> below to scan.</div>
        </div>
      `;
    }
  });
}

function stopScanner() {
  if (activeScanner) {
    activeScanner.stop().then(() => {
      activeScanner = null;
      switchView('gallery');
    }).catch(err => {
      console.error("Failed to stop scanner stream:", err);
      activeScanner = null;
      switchView('gallery');
    });
  } else {
    switchView('gallery');
  }
}

function handleScanSuccess(text) {
  // Stop scanner to prevent multiple scans
  if (activeScanner) {
    activeScanner.stop().then(() => {
      activeScanner = null;
      processDecodedString(text);
    }).catch(err => {
      console.error("Failed to stop scanner on success:", err);
      activeScanner = null;
      processDecodedString(text);
    });
  } else {
    processDecodedString(text);
  }
}

// Parse decoded text (e.g., full URL or simple id)
function processDecodedString(text) {
  let monsterId = null;
  
  try {
    // Try to parse as URL
    if (text.startsWith('http://') || text.startsWith('https://')) {
      const url = new URL(text);
      monsterId = url.searchParams.get('monster');
    } else {
      // Fallback: direct ID matching
      monsterId = text.trim().toLowerCase();
    }
  } catch (err) {
    // Fallback
    monsterId = text.trim().toLowerCase();
  }
  
  // Verify it exists in our monster definitions
  const monster = MONSTERS.find(m => m.id === monsterId);
  if (monster) {
    unlockMonster(monsterId, true);
  } else {
    alert(`Decoded QR: "${text}". No matching lorebeast found for ID "${monsterId}".`);
    switchView('gallery');
  }
}

// Handles window search parameter on load (e.g. ?monster=ignisaur)
function handleUrlRouting() {
  const params = new URLSearchParams(window.location.search);
  const monsterParam = params.get('monster');
  if (monsterParam) {
    // Timeout to make sure render finishes and user is interacting
    setTimeout(() => {
      unlockMonster(monsterParam, true);
    }, 400);
  }
}

// Global button clicks setup
function setupEventListeners() {
  btnStartScanner.addEventListener('click', () => {
    startScanner();
  });
  
  btnStopScanner.addEventListener('click', () => {
    playSound('click');
    stopScanner();
  });
  
  btnResetCollection.addEventListener('click', () => {
    playSound('click');
    if (confirm("Are you sure you want to lock all monsters and wipe your database index logs?")) {
      unlockedMonsters.clear();
      saveCollection();
      renderGallery();
      updateProgressUI();
    }
  });

  // Handle QR code scanning from file upload/photo capture
  const fileInput = document.getElementById('qr-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length === 0) return;
      
      const imageFile = e.target.files[0];
      const fileScanner = new Html5Qrcode("interactive-reader");
      
      fileScanner.scanFile(imageFile, true)
        .then(decodedText => {
          playSound('click');
          if (activeScanner) {
            stopScanner();
          }
          processDecodedString(decodedText);
        })
        .catch(err => {
          console.error("QR image read error:", err);
          alert("Could not detect any valid QR Code glyph. Please make sure the photo is clear, well-lit, and the QR code is centered.");
        });
    });
  }

  // Resume AudioContext on first touch/click interaction
  document.body.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }, { once: true });
}

// Start app
window.addEventListener('DOMContentLoaded', init);
