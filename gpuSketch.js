// GPU-Accelerated p5.js sketch
// Uses WebGL mode for GPU computation

let simulator;
let canvas;
let useGPU = false;
let gpuSimulator;

function setup() {
    // Always use regular canvas (P2D) - GPU version needs more work
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Initialize CPU simulator
    const numTypes = parseInt(document.getElementById('atom-types').value);
    simulator = new Simulator(numTypes);
    window.simulator = simulator;
    
    // Disable GPU mode for now (it needs more work)
    useGPU = false;
    
    // Uncomment below to try GPU mode (experimental):
    /*
    try {
        const glCanvas = createCanvas(windowWidth, windowHeight, WEBGL);
        const gl = glCanvas.drawingContext;
        if (gl && gl.getExtension('OES_texture_float')) {
            useGPU = true;
            gpuSimulator = new GPUSimulator();
            gpuSimulator.initGL(gl);
            console.log('GPU mode enabled');
        }
    } catch (e) {
        console.log('GPU mode not available:', e);
    }
    */
    
    setupControls();
    setupPanZoom();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (useGPU && gpuSimulator && gpuSimulator.gl) {
        // Reinitialize if needed
    }
}

function setupControls() {
    // Same control setup as before, but route to appropriate simulator
    function syncControls(sliderId, inputId, setter, min, max, step) {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);
        
        input.removeAttribute('min');
        input.removeAttribute('max');
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            input.value = value;
            setter(value);
        });
        
        input.addEventListener('input', (e) => {
            let value = parseFloat(e.target.value);
            if (!isNaN(value)) {
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
        (v) => {
            if (useGPU) gpuSimulator.temperature = v;
            else simulator.temperature = v;
        }, 0, 10, 0.1);
    
    // Attraction Strength
    syncControls('attraction', 'attraction-input',
        (v) => {
            if (useGPU) gpuSimulator.attractionStrength = v;
            else simulator.attractionStrength = v;
        }, 0, 10, 0.1);
    
    // Atom Types
    syncControls('atom-types', 'atom-types-input',
        (v) => {
            const numTypes = parseInt(v);
            if (useGPU) {
                gpuSimulator.numTypes = numTypes;
                buildParticleTypeEditor();
                gpuSimulator.reset(numTypes);
            } else {
                simulator.numTypes = numTypes;
                buildParticleTypeEditor();
            }
        }, 3, 15, 1);
    
    buildParticleTypeEditor();
    
    // Damping
    syncControls('damping', 'damping-input',
        (v) => {
            if (useGPU) gpuSimulator.damping = v;
            else simulator.damping = v;
        }, 0.5, 1.0, 0.01);
    
    // Max Velocity
    syncControls('max-velocity', 'max-velocity-input',
        (v) => {
            if (useGPU) gpuSimulator.maxVelocity = v;
            else simulator.maxVelocity = v;
        }, 1, 50, 1);
    
    // Spring Constant
    syncControls('spring-constant', 'spring-constant-input',
        (v) => {
            if (useGPU) gpuSimulator.springConstant = v;
            else simulator.springConstant = v;
        }, 0.01, 2.0, 0.01);
    
    // Collision Strength
    syncControls('collision-strength', 'collision-strength-input',
        (v) => {
            if (useGPU) gpuSimulator.collisionStrength = v;
            else simulator.collisionStrength = v;
        }, 100, 2000, 50);
    
    // Scene Width
    syncControls('scene-width', 'scene-width-input',
        (v) => {
            const val = Math.max(100, v);
            if (useGPU) gpuSimulator.sceneWidth = val;
            else simulator.sceneWidth = val;
        }, 500, 5000, 100);
    
    // Scene Height
    syncControls('scene-height', 'scene-height-input',
        (v) => {
            const val = Math.max(100, v);
            if (useGPU) gpuSimulator.sceneHeight = val;
            else simulator.sceneHeight = val;
        }, 500, 5000, 100);
    
    // Boundary mode
    document.getElementById('boundary-mode').addEventListener('change', (e) => {
        if (useGPU) gpuSimulator.boundaryMode = e.target.value;
        else simulator.boundaryMode = e.target.value;
    });
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
        const numTypes = parseInt(document.getElementById('atom-types').value);
        if (useGPU) {
            gpuSimulator.reset(numTypes);
        } else {
            simulator.reset(numTypes);
            buildParticleTypeEditor();
        }
    });
    
    // Randomize button
    document.getElementById('randomize-btn').addEventListener('click', () => {
        if (useGPU) {
            gpuSimulator.initializeParticleData();
        } else {
            simulator.randomize();
        }
    });
    
    // Show forces checkbox
    document.getElementById('show-forces').addEventListener('change', (e) => {
        if (useGPU) gpuSimulator.showForces = e.target.checked;
        else simulator.showForces = e.target.checked;
    });
    
    // Show energy map checkbox
    document.getElementById('show-energy').addEventListener('change', (e) => {
        if (useGPU) gpuSimulator.showEnergyMap = e.target.checked;
        else simulator.showEnergyMap = e.target.checked;
    });
}

function draw() {
    background(20, 25, 40);
    
    // Always fallback to CPU if GPU isn't working
    if (useGPU && gpuSimulator && gpuSimulator.initialized) {
        try {
            gpuSimulator.update(1.0/60.0);
            gpuSimulator.display(this);
            
            // Show mode indicator
            push();
            fill(255);
            textAlign(LEFT, TOP);
            textSize(12);
            text(`Mode: GPU (WebGL) | Particles: ${gpuSimulator.numParticles}`, 10, 10);
            pop();
        } catch (e) {
            console.error('GPU error, falling back to CPU:', e);
            useGPU = false;
            // Initialize CPU simulator if not already
            if (!simulator) {
                const numTypes = parseInt(document.getElementById('atom-types').value);
                simulator = new Simulator(numTypes);
                window.simulator = simulator;
            }
        }
    }
    
    // Use CPU version
    if (!useGPU && simulator) {
        simulator.update();
        simulator.display();
        
        // Show mode indicator
        push();
        fill(255);
        textAlign(LEFT, TOP);
        textSize(12);
        text(`Mode: CPU | Particles: ${simulator.atoms.length}`, 10, 10);
        pop();
    } else if (!simulator && !gpuSimulator) {
        // Nothing initialized - show error
        push();
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('Simulator not initialized', width/2, height/2);
        pop();
    }
}

function keyPressed() {
    if (key === ' ') {
        if (useGPU) gpuSimulator.togglePause();
        else simulator.togglePause();
        return false;
    }
}

function isMouseOverUI() {
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
    if (mouseButton === LEFT && !isMouseOverUI()) {
        const sim = useGPU ? gpuSimulator : simulator;
        if (sim) {
            sim.isPanning = true;
            sim.panStartX = mouseX;
            sim.panStartY = mouseY;
        }
    }
}

function mouseReleased() {
    const sim = useGPU ? gpuSimulator : simulator;
    if (sim) sim.isPanning = false;
}

function mouseDragged() {
    const sim = useGPU ? gpuSimulator : simulator;
    if (sim && sim.isPanning && !isMouseOverUI()) {
        const dx = mouseX - sim.panStartX;
        const dy = mouseY - sim.panStartY;
        sim.offsetX += dx / sim.zoom;
        sim.offsetY += dy / sim.zoom;
        sim.panStartX = mouseX;
        sim.panStartY = mouseY;
    } else if (sim) {
        sim.isPanning = false;
    }
}

function mouseWheel(e) {
    if (!isMouseOverUI()) {
        const sim = useGPU ? gpuSimulator : simulator;
        if (sim) {
            const zoomFactor = e.delta > 0 ? 0.9 : 1.1;
            sim.zoom = constrain(sim.zoom * zoomFactor, 0.1, 5.0);
            return false;
        }
    }
    return true;
}

// Include particle type editor functions from original sketch.js
function buildParticleTypeEditor() {
    const container = document.getElementById('particle-types-container');
    container.innerHTML = '';
    
    const activeSim = useGPU ? gpuSimulator : simulator;
    if (!activeSim || !activeSim.typeManager) return;
    
    const activeTypes = activeSim.typeManager.getActiveTypes(activeSim.numTypes);
    
    activeTypes.forEach(type => {
        const panel = createParticleTypePanel(type, activeSim);
        container.appendChild(panel);
    });
}

function createParticleTypePanel(type, activeSim) {
    const panel = document.createElement('div');
    panel.className = 'particle-type-panel';
    panel.setAttribute('data-atomic-number', type.atomicNumber);
    
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
            <input type="range" id="count-${type.atomicNumber}" min="0" max="100" step="1" value="${type.count || 10}">
            <input type="number" id="count-input-${type.atomicNumber}" value="${type.count || 10}">
        </div>
        <div class="color-picker-row">
            <label>Color:</label>
            <input type="color" id="color-${type.atomicNumber}" value="${hexColor}">
        </div>
        <div class="mini-control">
            <label>Radius:</label>
            <input type="range" id="radius-${type.atomicNumber}" min="3" max="40" step="1" value="${type.radius}">
            <input type="number" id="radius-input-${type.atomicNumber}" value="${type.radius}">
        </div>
        <div class="mini-control">
            <label>Mass:</label>
            <input type="range" id="mass-${type.atomicNumber}" min="0.1" max="20" step="0.1" value="${type.mass}">
            <input type="number" id="mass-input-${type.atomicNumber}" value="${type.mass}">
        </div>
        <div class="mini-control">
            <label>Valency:</label>
            <input type="range" id="valency-${type.atomicNumber}" min="0" max="8" step="1" value="${type.valency}">
            <input type="number" id="valency-input-${type.atomicNumber}" value="${type.valency}">
        </div>
        <div class="mini-control">
            <label>Attract Radius:</label>
            <input type="range" id="attract-${type.atomicNumber}" min="10" max="150" step="5" value="${type.attractionRadius}">
            <input type="number" id="attract-input-${type.atomicNumber}" value="${type.attractionRadius}">
        </div>
        <div class="mini-control">
            <label>Bond Distance:</label>
            <input type="range" id="bond-${type.atomicNumber}" min="5" max="80" step="2" value="${type.bondingDistance}">
            <input type="number" id="bond-input-${type.atomicNumber}" value="${type.bondingDistance}">
        </div>
        <div class="mini-control">
            <label>Base Charge:</label>
            <input type="range" id="charge-${type.atomicNumber}" min="-2" max="2" step="0.1" value="${type.baseCharge}">
            <input type="number" id="charge-input-${type.atomicNumber}" value="${type.baseCharge}">
        </div>
        <div class="mini-control">
            <label>Charge Range:</label>
            <input type="range" id="chargeRange-${type.atomicNumber}" min="0" max="1" step="0.05" value="${type.chargeRange}">
            <input type="number" id="chargeRange-input-${type.atomicNumber}" value="${type.chargeRange}">
        </div>
        <button class="randomize-type-btn" data-atomic-number="${type.atomicNumber}">🎲 Randomize</button>
    `;
    
    const atomicNum = type.atomicNumber;
    const colorInput = panel.querySelector(`#color-${atomicNum}`);
    
    colorInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        activeSim.typeManager.updateType(atomicNum, 'color', [r, g, b]);
        if (!useGPU) activeSim.updateAllAtomsFromTypes();
    });
    
    function syncMiniControl(prop, sliderId, inputId, min, max, step, setter) {
        const slider = panel.querySelector(sliderId);
        const input = panel.querySelector(inputId);
        input.removeAttribute('min');
        input.removeAttribute('max');
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            input.value = val;
            setter(val);
        });
        
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                if (val >= min && val <= max) {
                    if (step < 1) val = Math.round(val / step) * step;
                    slider.value = val;
                }
                setter(val);
            }
        });
    }
    
    syncMiniControl('count', `#count-${atomicNum}`, `#count-input-${atomicNum}`, 0, 100, 1,
        (v) => {
            const count = Math.max(0, Math.floor(v));
            activeSim.typeManager.updateType(atomicNum, 'count', count);
            if (useGPU) {
                gpuSimulator.reset(gpuSimulator.numTypes);
            } else {
                simulator.initializeAtoms();
            }
        });
    
    syncMiniControl('radius', `#radius-${atomicNum}`, `#radius-input-${atomicNum}`, 3, 40, 1,
        (v) => {
            activeSim.typeManager.updateType(atomicNum, 'radius', v);
            if (!useGPU) activeSim.updateAllAtomsFromTypes();
        });
    
    syncMiniControl('mass', `#mass-${atomicNum}`, `#mass-input-${atomicNum}`, 0.1, 20, 0.1,
        (v) => {
            activeSim.typeManager.updateType(atomicNum, 'mass', v);
            if (!useGPU) activeSim.updateAllAtomsFromTypes();
        });
    
    syncMiniControl('valency', `#valency-${atomicNum}`, `#valency-input-${atomicNum}`, 0, 8, 1,
        (v) => {
            activeSim.typeManager.updateType(atomicNum, 'valency', parseInt(v));
            if (!useGPU) activeSim.updateAllAtomsFromTypes();
        });
    
    syncMiniControl('attractionRadius', `#attract-${atomicNum}`, `#attract-input-${atomicNum}`, 10, 150, 5,
        (v) => {
            activeSim.typeManager.updateType(atomicNum, 'attractionRadius', v);
            if (!useGPU) activeSim.updateAllAtomsFromTypes();
        });
    
    syncMiniControl('bondingDistance', `#bond-${atomicNum}`, `#bond-input-${atomicNum}`, 5, 80, 2,
        (v) => {
            activeSim.typeManager.updateType(atomicNum, 'bondingDistance', v);
            if (!useGPU) activeSim.updateAllAtomsFromTypes();
        });
    
    syncMiniControl('baseCharge', `#charge-${atomicNum}`, `#charge-input-${atomicNum}`, -2, 2, 0.1,
        (v) => {
            activeSim.typeManager.updateType(atomicNum, 'baseCharge', v);
            if (!useGPU) activeSim.updateAllAtomsFromTypes();
        });
    
    syncMiniControl('chargeRange', `#chargeRange-${atomicNum}`, `#chargeRange-input-${atomicNum}`, 0, 1, 0.05,
        (v) => {
            activeSim.typeManager.updateType(atomicNum, 'chargeRange', v);
            if (!useGPU) activeSim.updateAllAtomsFromTypes();
        });
    
    const randomizeBtn = panel.querySelector(`.randomize-type-btn`);
    randomizeBtn.addEventListener('click', () => {
        const randomized = activeSim.typeManager.randomizeType(atomicNum);
        const hex = rgbToHex(randomized.color[0], randomized.color[1], randomized.color[2]);
        colorInput.value = hex;
        panel.querySelector(`#radius-${atomicNum}`).value = randomized.radius;
        panel.querySelector(`#radius-input-${atomicNum}`).value = randomized.radius;
        panel.querySelector(`#mass-${atomicNum}`).value = randomized.mass;
        panel.querySelector(`#mass-input-${atomicNum}`).value = randomized.mass;
        panel.querySelector(`#valency-${atomicNum}`).value = randomized.valency;
        panel.querySelector(`#valency-input-${atomicNum}`).value = randomized.valency;
        panel.querySelector(`#attract-${atomicNum}`).value = randomized.attractionRadius;
        panel.querySelector(`#attract-input-${atomicNum}`).value = randomized.attractionRadius;
        panel.querySelector(`#bond-${atomicNum}`).value = randomized.bondingDistance;
        panel.querySelector(`#bond-input-${atomicNum}`).value = randomized.bondingDistance;
        panel.querySelector(`#charge-${atomicNum}`).value = randomized.baseCharge;
        panel.querySelector(`#charge-input-${atomicNum}`).value = randomized.baseCharge;
        panel.querySelector(`#chargeRange-${atomicNum}`).value = randomized.chargeRange;
        panel.querySelector(`#chargeRange-input-${atomicNum}`).value = randomized.chargeRange;
        if (!useGPU) activeSim.updateAllAtomsFromTypes();
    });
    
    return panel;
}

