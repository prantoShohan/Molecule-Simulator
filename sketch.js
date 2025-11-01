// p5.js main sketch file
let simulator;
let canvas;

function setup() {
    // Create fullscreen canvas
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Make canvas available globally for mouse event checking
    canvas.elt.style.pointerEvents = 'auto';
    
    // Initialize simulator (no numAtoms parameter now)
    const numTypes = parseInt(document.getElementById('atom-types').value);
    simulator = new Simulator(numTypes);
    window.simulator = simulator; // Make accessible globally
    
    // Setup UI controls
    setupControls();
    
    // Setup pan/zoom
    setupPanZoom();
    
    // Initialize statistics panel immediately after simulator is set up
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
        updateStatisticsPanel();
    }, 0);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function setupControls() {
    // Helper function to sync slider and input
    // Number inputs are unconstrained, sliders have ranges
    function syncControls(sliderId, inputId, setter, min, max, step) {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);
        
        // Remove constraints from number input
        input.removeAttribute('min');
        input.removeAttribute('max');
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            input.value = value;
            setter(value);
        });
        
        input.addEventListener('input', (e) => {
            let value = parseFloat(e.target.value);
            // Don't clamp number input, but update slider if it's in range
            if (!isNaN(value)) {
                // Only update slider if value is in slider's range
                if (value >= min && value <= max) {
                    if (step < 1) {
                        value = Math.round(value / step) * step;
                    }
                    slider.value = value;
                }
                setter(value);
            }
        });
    }
    
    // Temperature
    syncControls('temperature', 'temperature-input', 
        (v) => simulator.temperature = v, 0, 100, 0.1);
    
    // Attraction Strength
    syncControls('attraction', 'attraction-input',
        (v) => simulator.attractionStrength = v, 0, 10, 0.1);
    
    // Electromagnetic Strength
    syncControls('electromagnetic-strength', 'electromagnetic-strength-input',
        (v) => simulator.electromagneticStrength = v, 0, 500, 10);
    
    // Thermal Noise
    syncControls('thermal-noise', 'thermal-noise-input',
        (v) => simulator.thermalNoise = v, 0, 5, 0.1);
    
    // Atom Types
    syncControls('atom-types', 'atom-types-input',
        (v) => {
            simulator.numTypes = parseInt(v);
            buildParticleTypeEditor(); // Rebuild UI when types change
        }, 3, 15, 1);
    
    // Build particle type editor initially
    buildParticleTypeEditor();
    
    // Damping
    syncControls('damping', 'damping-input',
        (v) => simulator.damping = v, 0.1, 1.0, 0.01);
    
    // Max Velocity
    syncControls('max-velocity', 'max-velocity-input',
        (v) => simulator.maxVelocity = v, 1, 50, 1);
    
    // Spring Constant
    syncControls('spring-constant', 'spring-constant-input',
        (v) => simulator.springConstant = v, 0.01, 2.0, 0.01);
    
    // Collision Strength
    syncControls('collision-strength', 'collision-strength-input',
        (v) => simulator.collisionStrength = v, 100, 2000, 50);
    
    // Min Distance
    syncControls('min-distance', 'min-distance-input',
        (v) => simulator.minDistance = v, 0.5, 10, 0.5);
    
    // Scene Width
    syncControls('scene-width', 'scene-width-input',
        (v) => {
            simulator.sceneWidth = Math.max(100, v);
        }, 500, 5000, 100);
    
    // Scene Height
    syncControls('scene-height', 'scene-height-input',
        (v) => {
            simulator.sceneHeight = Math.max(100, v);
        }, 500, 5000, 100);
    
    // Boundary mode selector
    document.getElementById('boundary-mode').addEventListener('change', (e) => {
        simulator.boundaryMode = e.target.value;
    });
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
        const numTypes = parseInt(document.getElementById('atom-types').value);
        simulator.reset(numTypes);
        buildParticleTypeEditor(); // Rebuild UI after reset
        updateStatisticsPanel(); // Update statistics after reset
    });
    
    // Randomize button
    document.getElementById('randomize-btn').addEventListener('click', () => {
        simulator.randomize();
        updateStatisticsPanel(); // Update statistics after randomize
    });
    
    // Show forces checkbox
    document.getElementById('show-forces').addEventListener('change', (e) => {
        simulator.showForces = e.target.checked;
    });
    
    // Show energy map checkbox
    document.getElementById('show-energy').addEventListener('change', (e) => {
        simulator.showEnergyMap = e.target.checked;
    });
}

let frameCountStart = 0;
let lastFPS = 0;
let fpsCounter = 0;
let fpsTime = 0;

function draw() {
    // Dark background
    background(20, 25, 40);
    
    // Calculate FPS
    fpsCounter++;
    if (millis() - fpsTime > 1000) {
        lastFPS = fpsCounter;
        fpsCounter = 0;
        fpsTime = millis();
    }
    
    // Update simulation
    simulator.update();
    
    // Display simulation
    simulator.display();
    
    // Update statistics panel (every few frames for performance)
    // Debug overlay is updated within updateStatisticsPanel
    if (frameCount % 10 === 0) {
        updateStatisticsPanel();
    } else {
        // Still update debug overlay every frame (it's lightweight)
        displayDebugOverlay();
    }
}

function displayDebugOverlay() {
    // Update debug stats in the statistics panel
    if (!simulator) return;
    
    const avgVelocity = simulator.atoms.length > 0 
        ? simulator.atoms.reduce((sum, a) => sum + a.vel.mag(), 0) / simulator.atoms.length 
        : 0;
    
    const debugFrame = document.getElementById('stat-frame');
    const debugFPS = document.getElementById('stat-fps');
    const debugAvgVel = document.getElementById('stat-avg-velocity');
    const debugMode = document.getElementById('stat-mode');
    const debugScene = document.getElementById('stat-scene');
    const debugZoom = document.getElementById('stat-zoom');
    
    if (debugFrame) debugFrame.textContent = frameCount;
    if (debugFPS) debugFPS.textContent = lastFPS;
    if (debugAvgVel) debugAvgVel.textContent = avgVelocity.toFixed(2);
    if (debugMode) debugMode.textContent = simulator.useSpatialPartitioning && simulator.atoms.length > 50 ? 'Optimized' : 'Standard';
    if (debugScene) debugScene.textContent = `${simulator.sceneWidth}x${simulator.sceneHeight}`;
    if (debugZoom) debugZoom.textContent = `${simulator.zoom.toFixed(2)}x`;
}

function updateStatisticsPanel() {
    if (!simulator) return;
    
    const stats = simulator.getMoleculeStats();
    
    // Update all statistics elements safely
    const statAtoms = document.getElementById('stat-atoms');
    const statBonds = document.getElementById('stat-bonds');
    const statMolecules = document.getElementById('stat-molecules');
    const statLone = document.getElementById('stat-lone');
    const statLargest = document.getElementById('stat-largest');
    const statPopularSize = document.getElementById('stat-popular-size');
    const statPopularCount = document.getElementById('stat-popular-count');
    
    if (statAtoms) statAtoms.textContent = simulator.atoms.length;
    if (statBonds) statBonds.textContent = simulator.bonds.length;
    if (statMolecules) statMolecules.textContent = stats.total;
    if (statLone) statLone.textContent = stats.loneAtoms;
    if (statLargest) statLargest.textContent = stats.largestSize;
    if (statPopularSize) statPopularSize.textContent = stats.mostPopularSize;
    if (statPopularCount) statPopularCount.textContent = stats.mostPopularCount;
    
    // Also update debug info
    displayDebugOverlay();
}

function keyPressed() {
    // Space bar to pause/play
    if (key === ' ') {
        simulator.togglePause();
        return false; // Prevent default behavior
    }
}

function isMouseOverUI() {
    // Check if mouse is over sidebar elements
    const sidebar = document.getElementById('sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const sidebarRect = sidebar.getBoundingClientRect();
    const rightSidebarRect = rightSidebar.getBoundingClientRect();
    
    return (mouseX >= sidebarRect.left && mouseX <= sidebarRect.right && 
            mouseY >= sidebarRect.top && mouseY <= sidebarRect.bottom) ||
           (mouseX >= rightSidebarRect.left && mouseX <= rightSidebarRect.right && 
            mouseY >= rightSidebarRect.top && mouseY <= rightSidebarRect.bottom);
}

function mousePressed() {
    // Only start panning if left mouse button and not over UI
    if (mouseButton === LEFT && !isMouseOverUI()) {
        simulator.isPanning = true;
        simulator.panStartX = mouseX;
        simulator.panStartY = mouseY;
    }
}

function mouseReleased() {
    simulator.isPanning = false;
}

function mouseDragged() {
    // Only pan if not over UI elements
    if (simulator.isPanning && !isMouseOverUI()) {
        const dx = mouseX - simulator.panStartX;
        const dy = mouseY - simulator.panStartY;
        simulator.offsetX += dx / simulator.zoom;
        simulator.offsetY += dy / simulator.zoom;
        simulator.panStartX = mouseX;
        simulator.panStartY = mouseY;
    } else {
        simulator.isPanning = false;
    }
}

function mouseWheel(e) {
    // Only zoom if not over UI elements
    if (!isMouseOverUI()) {
        const zoomFactor = e.delta > 0 ? 0.9 : 1.1;
        simulator.zoom = constrain(simulator.zoom * zoomFactor, 0.1, 5.0);
        return false;
    }
    return true;
}

function buildParticleTypeEditor() {
    const container = document.getElementById('particle-types-container');
    container.innerHTML = '';
    
    const activeTypes = simulator.typeManager.getActiveTypes(simulator.numTypes);
    
    activeTypes.forEach(type => {
        const panel = createParticleTypePanel(type);
        container.appendChild(panel);
    });
}

function createParticleTypePanel(type) {
    const panel = document.createElement('div');
    panel.className = 'particle-type-panel';
    panel.setAttribute('data-atomic-number', type.atomicNumber);
    
    // Convert RGB array to hex color for color input
    const rgbToHex = (r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    };
    
    const hexColor = rgbToHex(type.color[0], type.color[1], type.color[2]);
    
    panel.innerHTML = `
        <div class="particle-type-header">
            <span class="particle-type-name">Type ${type.atomicNumber} (${type.name})</span>
        </div>
        <div class="mini-control">
            <label>Count:</label>
            <div class="control-with-lock">
                <input type="range" id="count-${type.atomicNumber}" min="0" max="100" step="1" value="${type.count || 10}">
                <input type="number" id="count-input-${type.atomicNumber}" value="${type.count || 10}">
                <input type="checkbox" class="lock-checkbox" id="lock-count-${type.atomicNumber}" ${(type.locked && type.locked.count) ? 'checked' : ''}>
            </div>
        </div>
        <div class="color-picker-row">
            <label>Color:</label>
            <div class="control-with-lock">
                <input type="color" id="color-${type.atomicNumber}" value="${hexColor}">
                <input type="checkbox" class="lock-checkbox" id="lock-color-${type.atomicNumber}" ${(type.locked && type.locked.color) ? 'checked' : ''}>
            </div>
        </div>
        <div class="mini-control">
            <label>Radius:</label>
            <div class="control-with-lock">
                <input type="range" id="radius-${type.atomicNumber}" min="3" max="40" step="1" value="${type.radius}">
                <input type="number" id="radius-input-${type.atomicNumber}" value="${type.radius}">
                <input type="checkbox" class="lock-checkbox" id="lock-radius-${type.atomicNumber}" ${(type.locked && type.locked.radius) ? 'checked' : ''}>
            </div>
        </div>
        <div class="mini-control">
            <label>Mass:</label>
            <div class="control-with-lock">
                <input type="range" id="mass-${type.atomicNumber}" min="0.1" max="20" step="0.1" value="${type.mass}">
                <input type="number" id="mass-input-${type.atomicNumber}" value="${type.mass}">
                <input type="checkbox" class="lock-checkbox" id="lock-mass-${type.atomicNumber}" ${(type.locked && type.locked.mass) ? 'checked' : ''}>
            </div>
        </div>
        <div class="mini-control">
            <label>Valency:</label>
            <div class="control-with-lock">
                <input type="range" id="valency-${type.atomicNumber}" min="0" max="8" step="1" value="${type.valency}">
                <input type="number" id="valency-input-${type.atomicNumber}" value="${type.valency}">
                <input type="checkbox" class="lock-checkbox" id="lock-valency-${type.atomicNumber}" ${(type.locked && type.locked.valency) ? 'checked' : ''}>
            </div>
        </div>
        <div class="mini-control">
            <label>Attract Radius:</label>
            <div class="control-with-lock">
                <input type="range" id="attract-${type.atomicNumber}" min="10" max="150" step="5" value="${type.attractionRadius}">
                <input type="number" id="attract-input-${type.atomicNumber}" value="${type.attractionRadius}">
                <input type="checkbox" class="lock-checkbox" id="lock-attract-${type.atomicNumber}" ${(type.locked && type.locked.attractionRadius) ? 'checked' : ''}>
            </div>
        </div>
        <div class="mini-control">
            <label>Bond Distance:</label>
            <div class="control-with-lock">
                <input type="range" id="bond-${type.atomicNumber}" min="5" max="80" step="2" value="${type.bondingDistance}">
                <input type="number" id="bond-input-${type.atomicNumber}" value="${type.bondingDistance}">
                <input type="checkbox" class="lock-checkbox" id="lock-bond-${type.atomicNumber}" ${(type.locked && type.locked.bondingDistance) ? 'checked' : ''}>
            </div>
        </div>
        <div class="mini-control">
            <label>Base Charge:</label>
            <div class="control-with-lock">
                <input type="range" id="charge-${type.atomicNumber}" min="-2" max="2" step="0.1" value="${type.baseCharge}">
                <input type="number" id="charge-input-${type.atomicNumber}" value="${type.baseCharge}">
                <input type="checkbox" class="lock-checkbox" id="lock-charge-${type.atomicNumber}" ${(type.locked && type.locked.baseCharge) ? 'checked' : ''}>
            </div>
        </div>
        <div class="mini-control">
            <label>Charge Range:</label>
            <div class="control-with-lock">
                <input type="range" id="chargeRange-${type.atomicNumber}" min="0" max="1" step="0.05" value="${type.chargeRange}">
                <input type="number" id="chargeRange-input-${type.atomicNumber}" value="${type.chargeRange}">
                <input type="checkbox" class="lock-checkbox" id="lock-chargeRange-${type.atomicNumber}" ${(type.locked && type.locked.chargeRange) ? 'checked' : ''}>
            </div>
        </div>
        <button class="randomize-type-btn" data-atomic-number="${type.atomicNumber}">Randomize</button>
    `;
    
    // Setup event listeners
    const atomicNum = type.atomicNumber;
    
    // Helper to update lock state
    function updateLock(prop, checkboxId) {
        const checkbox = panel.querySelector(checkboxId);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                const type = simulator.typeManager.getType(atomicNum);
                if (!type.locked) type.locked = {};
                type.locked[prop] = e.target.checked;
            });
        }
    }
    
    // Setup lock checkboxes
    updateLock('count', `#lock-count-${atomicNum}`);
    updateLock('color', `#lock-color-${atomicNum}`);
    updateLock('radius', `#lock-radius-${atomicNum}`);
    updateLock('mass', `#lock-mass-${atomicNum}`);
    updateLock('valency', `#lock-valency-${atomicNum}`);
    updateLock('attractionRadius', `#lock-attract-${atomicNum}`);
    updateLock('bondingDistance', `#lock-bond-${atomicNum}`);
    updateLock('baseCharge', `#lock-charge-${atomicNum}`);
    updateLock('chargeRange', `#lock-chargeRange-${atomicNum}`);
    
    // Color picker
    const colorInput = panel.querySelector(`#color-${atomicNum}`);
    colorInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        simulator.typeManager.updateType(atomicNum, 'color', [r, g, b]);
        simulator.updateAllAtomsFromTypes();
    });
    
    // Helper function for syncing controls
    // Number inputs are unconstrained, sliders have ranges
    function syncMiniControl(prop, sliderId, inputId, min, max, step, setter) {
        const slider = panel.querySelector(sliderId);
        const input = panel.querySelector(inputId);
        
        // Remove constraints from number input
        input.removeAttribute('min');
        input.removeAttribute('max');
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            input.value = val;
            setter(val);
        });
        
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            // Don't clamp number input, but update slider if it's in range
            if (!isNaN(val)) {
                // Only update slider if value is in slider's range
                if (val >= min && val <= max) {
                    if (step < 1) {
                        val = Math.round(val / step) * step;
                    }
                    slider.value = val;
                }
                setter(val);
            }
        });
    }
    
    // Count control (special case - needs to reset simulation)
    syncMiniControl('count', `#count-${atomicNum}`, `#count-input-${atomicNum}`, 0, 100, 1,
        (v) => {
            const count = Math.max(0, Math.floor(v)); // Ensure non-negative integer
            simulator.typeManager.updateType(atomicNum, 'count', count);
            // Reinitialize atoms when count changes
            simulator.initializeAtoms();
            updateStatisticsPanel(); // Update statistics when atoms are reinitialized
        });
    
    // Radius
    syncMiniControl('radius', `#radius-${atomicNum}`, `#radius-input-${atomicNum}`, 3, 40, 1,
        (v) => {
            simulator.typeManager.updateType(atomicNum, 'radius', v);
            simulator.updateAllAtomsFromTypes();
        });
    
    // Mass
    syncMiniControl('mass', `#mass-${atomicNum}`, `#mass-input-${atomicNum}`, 0.1, 20, 0.1,
        (v) => {
            simulator.typeManager.updateType(atomicNum, 'mass', v);
            simulator.updateAllAtomsFromTypes();
        });
    
    // Valency
    syncMiniControl('valency', `#valency-${atomicNum}`, `#valency-input-${atomicNum}`, 0, 8, 1,
        (v) => {
            simulator.typeManager.updateType(atomicNum, 'valency', parseInt(v));
            simulator.updateAllAtomsFromTypes();
        });
    
    // Attraction Radius
    syncMiniControl('attractionRadius', `#attract-${atomicNum}`, `#attract-input-${atomicNum}`, 10, 150, 5,
        (v) => {
            simulator.typeManager.updateType(atomicNum, 'attractionRadius', v);
            simulator.updateAllAtomsFromTypes();
        });
    
    // Bonding Distance
    syncMiniControl('bondingDistance', `#bond-${atomicNum}`, `#bond-input-${atomicNum}`, 5, 80, 2,
        (v) => {
            simulator.typeManager.updateType(atomicNum, 'bondingDistance', v);
            simulator.updateAllAtomsFromTypes();
        });
    
    // Base Charge
    syncMiniControl('baseCharge', `#charge-${atomicNum}`, `#charge-input-${atomicNum}`, -2, 2, 0.1,
        (v) => {
            simulator.typeManager.updateType(atomicNum, 'baseCharge', v);
            simulator.updateAllAtomsFromTypes();
        });
    
    // Charge Range
    syncMiniControl('chargeRange', `#chargeRange-${atomicNum}`, `#chargeRange-input-${atomicNum}`, 0, 1, 0.05,
        (v) => {
            simulator.typeManager.updateType(atomicNum, 'chargeRange', v);
            simulator.updateAllAtomsFromTypes();
        });
    
    // Randomize button
    const randomizeBtn = panel.querySelector(`.randomize-type-btn`);
    randomizeBtn.addEventListener('click', () => {
        const randomized = simulator.typeManager.randomizeType(atomicNum);
        const type = simulator.typeManager.getType(atomicNum);
        const locked = type.locked || {};
        
        // Update only unlocked properties in UI
        if (!locked.color) {
            const hex = rgbToHex(randomized.color[0], randomized.color[1], randomized.color[2]);
            colorInput.value = hex;
        }
        if (!locked.radius) {
            panel.querySelector(`#radius-${atomicNum}`).value = randomized.radius;
            panel.querySelector(`#radius-input-${atomicNum}`).value = randomized.radius;
        }
        if (!locked.mass) {
            panel.querySelector(`#mass-${atomicNum}`).value = randomized.mass;
            panel.querySelector(`#mass-input-${atomicNum}`).value = randomized.mass;
        }
        if (!locked.valency) {
            panel.querySelector(`#valency-${atomicNum}`).value = randomized.valency;
            panel.querySelector(`#valency-input-${atomicNum}`).value = randomized.valency;
        }
        if (!locked.attractionRadius) {
            panel.querySelector(`#attract-${atomicNum}`).value = randomized.attractionRadius;
            panel.querySelector(`#attract-input-${atomicNum}`).value = randomized.attractionRadius;
        }
        if (!locked.bondingDistance) {
            panel.querySelector(`#bond-${atomicNum}`).value = randomized.bondingDistance;
            panel.querySelector(`#bond-input-${atomicNum}`).value = randomized.bondingDistance;
        }
        if (!locked.baseCharge) {
            panel.querySelector(`#charge-${atomicNum}`).value = randomized.baseCharge;
            panel.querySelector(`#charge-input-${atomicNum}`).value = randomized.baseCharge;
        }
        if (!locked.chargeRange) {
            panel.querySelector(`#chargeRange-${atomicNum}`).value = randomized.chargeRange;
            panel.querySelector(`#chargeRange-input-${atomicNum}`).value = randomized.chargeRange;
        }
        
        simulator.updateAllAtomsFromTypes();
    });
    
    return panel;
}

function setupPanZoom() {
    // Pan/zoom is handled in mousePressed, mouseDragged, mouseReleased, and mouseWheel functions below
}
