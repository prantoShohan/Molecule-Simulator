// Main simulation engine
class Simulator {
    constructor(numTypes = 5, typeManager = null) {
        this.atoms = [];
        this.bonds = [];
        this.numTypes = numTypes;
        this.typeManager = typeManager || new ParticleTypeManager();
        
        // Simulation parameters
        this.temperature = 1.0;
        this.attractionStrength = 0.2;
        this.electromagneticStrength = 100;
        this.thermalNoise = 0.5;
        this.damping = 0.17;
        this.maxVelocity = 40;
        this.springConstant = 1.0;
        this.boundaryMode = 'wrap'; // 'wrap', 'bounce', 'contain'
        this.collisionStrength = 350; // Strength of collision repulsion
        this.minDistance = 2; // Minimum distance before strong repulsion kicks in
        this.angularForceStrength = 0.5; // Strength of angular repulsion between bonds (VSEPR)
        this.enableStability = true; // Enable/disable stability system
        this.massCapacityMultiplier = 5.0; // How many times an atom's mass it can support
        
        // Pan/Zoom parameters
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1.0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        
        // Scene size (actual simulation area)
        this.sceneWidth = 1500;
        this.sceneHeight = 1500;
        
        // Spatial partitioning for performance
        this.spatialGrid = new SpatialGrid(this.sceneWidth, this.sceneHeight, 150);
        this.useSpatialPartitioning = true; // Enable by default (only for >50 particles)
        
        // UI flags
        this.showForces = false;
        this.showEnergyMap = false;
        this.paused = false;
        
        this.initializeAtoms();
    }
    
    initializeAtoms() {
        this.atoms = [];
        this.bonds = [];
        
        // Create atoms based on per-type counts
        const activeTypes = this.typeManager.getActiveTypes(this.numTypes);
        for (let type of activeTypes) {
            const count = type.count || 10;
            for (let i = 0; i < count; i++) {
                const x = random(50, this.sceneWidth - 50);
                const y = random(50, this.sceneHeight - 50);
                const typeProps = this.typeManager.getType(type.atomicNumber);
                this.atoms.push(new Atom(x, y, type.atomicNumber, typeProps));
            }
        }
    }
    
    updateAllAtomsFromTypes() {
        // Update all existing atoms when type properties change
        for (let atom of this.atoms) {
            const typeProps = this.typeManager.getType(atom.atomicNumber);
            const oldBondCount = atom.bonds.length;
            atom.updateFromTypeProperties(typeProps);
            
            // Remove broken bonds from simulator's bond array
            if (atom.bonds.length < oldBondCount) {
                // Some bonds were removed, clean up simulator's bond array
                this.bonds = this.bonds.filter(bond => {
                    return bond.atom1.bonds.includes(bond) && bond.atom2.bonds.includes(bond);
                });
            }
        }
    }
    
    update() {
        if (this.paused) return;
        
        // Rebuild spatial grid if needed (only for larger particle counts)
        if (this.useSpatialPartitioning && this.atoms.length > 50) {
            // Update grid size if scene changed
            if (this.spatialGrid.width !== this.sceneWidth || this.spatialGrid.height !== this.sceneHeight) {
                this.spatialGrid = new SpatialGrid(this.sceneWidth, this.sceneHeight, 150);
            }
        }
        
        // Calculate all forces
        this.calculateCollisionForces(); // First: prevent overlaps
        this.calculateElectromagneticForces();
        this.calculateBondingForces();
        
        // Apply angular forces (VSEPR) - bonds repel each other to maximize angles
        // Stronger at lower temperatures (temperatureFactor increases as temp decreases)
        const temperatureFactor = max(0.1, 2.0 / (this.temperature + 0.1)); // Higher at lower temp
        this.calculateAngularForces(temperatureFactor);
        
        this.applyThermalMotion();
        
        // Try to form new bonds
        this.attemptBondFormation();
        
        // Update bonds (apply spring forces, check for breaking with stability)
        for (let i = this.bonds.length - 1; i >= 0; i--) {
            const bond = this.bonds[i];
            bond.applyForces(this.attractionStrength, this.springConstant);
            
            // Check if bond should break
            let shouldBreak = false;
            
            // Standard break check (distance)
            if (bond.getLength() > bond.maxStretch) {
                shouldBreak = true;
            }
            
            // Stability-based break check (if enabled)
            if (this.enableStability && !shouldBreak) {
                const massCapacity1 = bond.atom1.mass * this.massCapacityMultiplier;
                const massCapacity2 = bond.atom2.mass * this.massCapacityMultiplier;
                
                const stability1 = bond.atom1.calculateStability(massCapacity1);
                const stability2 = bond.atom2.calculateStability(massCapacity2);
                
                // If either atom becomes unstable (stability < threshold), break bonds
                // Start breaking bonds from the most unstable atom
                const stabilityThreshold = 0.3; // Break if stability drops below 30%
                
                if (stability1 < stabilityThreshold || stability2 < stabilityThreshold) {
                    // Unstable: break this bond
                    // Prioritize breaking bonds from the more unstable atom
                    const minStability = min(stability1, stability2);
                    if (minStability < stabilityThreshold) {
                        shouldBreak = true;
                    }
                }
            }
            
            if (shouldBreak) {
                bond.break();
                this.bonds.splice(i, 1);
            }
        }
        
        // Update atoms
        for (let atom of this.atoms) {
            atom.update(this.damping, this.maxVelocity, this.boundaryMode);
        }
    }
    
    calculateCollisionForces() {
        if (this.useSpatialPartitioning && this.atoms.length > 50) {
            // Use spatial grid for better performance
            this.spatialGrid.rebuild(this.atoms);
            
            const checkedPairs = new Set();
            
            for (let i = 0; i < this.atoms.length; i++) {
                const atom1 = this.atoms[i];
                const searchRadius = atom1.radius * 2 + this.minDistance * 2;
                const neighbors = this.spatialGrid.getNeighbors(atom1.pos.x, atom1.pos.y, searchRadius);
                
                for (let entry of neighbors) {
                    const atom2 = entry.particle;
                    const j = entry.index;
                    
                    // Skip self and already processed pairs
                    if (i >= j) continue;
                    
                    const pairKey = i < j ? `${i},${j}` : `${j},${i}`;
                    if (checkedPairs.has(pairKey)) continue;
                    checkedPairs.add(pairKey);
                    
                    const displacement = p5.Vector.sub(atom2.pos, atom1.pos);
                    const distance = displacement.mag();
                    const minSeparation = atom1.radius + atom2.radius + this.minDistance;
                    
                    // Strong repulsion if atoms are too close
                    if (distance < minSeparation && distance > 0) {
                        const overlap = minSeparation - distance;
                        const forceMagnitude = this.collisionStrength * overlap / (distance * distance + 0.1);
                        const force = displacement.normalize().mult(forceMagnitude);
                        
                        const massRatio1 = atom2.mass / (atom1.mass + atom2.mass);
                        const massRatio2 = atom1.mass / (atom1.mass + atom2.mass);
                        
                        atom1.applyForce(force.mult(-massRatio1));
                        atom2.applyForce(force.mult(massRatio2));
                    }
                }
            }
        } else {
            // Original O(N²) method for small particle counts
            for (let i = 0; i < this.atoms.length; i++) {
                for (let j = i + 1; j < this.atoms.length; j++) {
                    const atom1 = this.atoms[i];
                    const atom2 = this.atoms[j];
                    
                    const displacement = p5.Vector.sub(atom2.pos, atom1.pos);
                    const distance = displacement.mag();
                    const minSeparation = atom1.radius + atom2.radius + this.minDistance;
                    
                    if (distance < minSeparation && distance > 0) {
                        const overlap = minSeparation - distance;
                        const forceMagnitude = this.collisionStrength * overlap / (distance * distance + 0.1);
                        const force = displacement.normalize().mult(forceMagnitude);
                        
                        const massRatio1 = atom2.mass / (atom1.mass + atom2.mass);
                        const massRatio2 = atom1.mass / (atom1.mass + atom2.mass);
                        
                        atom1.applyForce(force.mult(-massRatio1));
                        atom2.applyForce(force.mult(massRatio2));
                    }
                }
            }
        }
    }
    
    calculateElectromagneticForces() {
        if (this.useSpatialPartitioning && this.atoms.length > 50) {
            // Use spatial grid
            const checkedPairs = new Set();
            
            for (let i = 0; i < this.atoms.length; i++) {
                const atom1 = this.atoms[i];
                const maxInteractionRadius = Math.max(atom1.attractionRadius, 200); // Reasonable max distance
                const neighbors = this.spatialGrid.getNeighbors(atom1.pos.x, atom1.pos.y, maxInteractionRadius);
                
                for (let entry of neighbors) {
                    const atom2 = entry.particle;
                    const j = entry.index;
                    
                    if (i >= j) continue; // Skip self and duplicates
                    
                    // Skip if already bonded
                    if (atom1.isBondedTo(atom2)) continue;
                    
                    const pairKey = i < j ? `${i},${j}` : `${j},${i}`;
                    if (checkedPairs.has(pairKey)) continue;
                    checkedPairs.add(pairKey);
                    
                    const displacement = p5.Vector.sub(atom2.pos, atom1.pos);
                    const distance = displacement.mag();
                    
                    if (distance < 1) continue;
                    
                    const minSeparation = atom1.radius + atom2.radius + this.minDistance;
                    if (distance < minSeparation) continue;
                    
                    // Inverse square law for electromagnetic force
                    const chargeProduct = atom1.charge * atom2.charge;
                    const forceMagnitude = (this.electromagneticStrength * chargeProduct) / (distance * distance);
                    
                    const force = displacement.normalize().mult(forceMagnitude);
                    
                    atom1.applyForce(force.mult(-1));
                    atom2.applyForce(force);
                    
                    // Check bonding distance
                    if (distance < (atom1.bondingDistance + atom2.bondingDistance) / 2) {
                        const bondingAttraction = this.attractionStrength * 50 / (distance * distance);
                        const bondForce = displacement.normalize().mult(bondingAttraction);
                        atom1.applyForce(bondForce.mult(-1));
                        atom2.applyForce(bondForce);
                    }
                }
            }
        } else {
            // Original O(N²) method
            for (let i = 0; i < this.atoms.length; i++) {
                for (let j = i + 1; j < this.atoms.length; j++) {
                    const atom1 = this.atoms[i];
                    const atom2 = this.atoms[j];
                    
                    if (atom1.isBondedTo(atom2)) continue;
                    
                    const displacement = p5.Vector.sub(atom2.pos, atom1.pos);
                    const distance = displacement.mag();
                    
                    if (distance < 1) continue;
                    
                    const minSeparation = atom1.radius + atom2.radius + this.minDistance;
                    if (distance < minSeparation) continue;
                    
                    const chargeProduct = atom1.charge * atom2.charge;
                    const forceMagnitude = (this.electromagneticStrength * chargeProduct) / (distance * distance);
                    
                    const force = displacement.normalize().mult(forceMagnitude);
                    
                    atom1.applyForce(force.mult(-1));
                    atom2.applyForce(force);
                    
                    if (distance < (atom1.bondingDistance + atom2.bondingDistance) / 2) {
                        const bondingAttraction = this.attractionStrength * 50 / (distance * distance);
                        const bondForce = displacement.normalize().mult(bondingAttraction);
                        atom1.applyForce(bondForce.mult(-1));
                        atom2.applyForce(bondForce);
                    }
                }
            }
        }
    }
    
    calculateBondingForces() {
        // Bond forces are applied in the update() method for each bond
        // This method is reserved for additional bonding-related calculations if needed
    }
    
    calculateAngularForces(temperatureFactor = 1.0) {
        // Apply VSEPR-like angular repulsion forces
        // Bonds on the same atom try to maximize angles between them
        for (let atom of this.atoms) {
            if (atom.bonds.length >= 2) {
                atom.applyAngularForces(this.angularForceStrength, temperatureFactor);
            }
        }
    }
    
    applyThermalMotion() {
        // Add random thermal motion based on temperature
        for (let atom of this.atoms) {
            const thermalForce = createVector(
                random(-1, 1) * this.thermalNoise * this.temperature,
                random(-1, 1) * this.thermalNoise * this.temperature
            );
            atom.applyForce(thermalForce);
        }
    }
    
    attemptBondFormation() {
        if (this.useSpatialPartitioning && this.atoms.length > 50) {
            // Use spatial grid for bond formation
            const checkedPairs = new Set();
            
            for (let i = 0; i < this.atoms.length; i++) {
                const atom1 = this.atoms[i];
                const maxBondRange = Math.max(atom1.bondingDistance, 100);
                const neighbors = this.spatialGrid.getNeighbors(atom1.pos.x, atom1.pos.y, maxBondRange);
                
                for (let entry of neighbors) {
                    const atom2 = entry.particle;
                    const j = entry.index;
                    
                    if (i >= j) continue;
                    
                    if (atom1.isBondedTo(atom2)) continue;
                    if (!atom1.canFormBond() || !atom2.canFormBond()) continue;
                    
                    const pairKey = i < j ? `${i},${j}` : `${j},${i}`;
                    if (checkedPairs.has(pairKey)) continue;
                    checkedPairs.add(pairKey);
                    
                    const distance = atom1.pos.dist(atom2.pos);
                    const maxBondDistance = (atom1.bondingDistance + atom2.bondingDistance) / 2;
                    
                    if (distance < maxBondDistance) {
                        const compatibility = this.calculateCompatibility(atom1, atom2);
                        const formationChance = compatibility * (1 - distance / maxBondDistance);
                        
                        if (random() < formationChance * 0.05) {
                            this.formBond(atom1, atom2);
                        }
                    }
                }
            }
        } else {
            // Original method
            for (let i = 0; i < this.atoms.length; i++) {
                for (let j = i + 1; j < this.atoms.length; j++) {
                    const atom1 = this.atoms[i];
                    const atom2 = this.atoms[j];
                    
                    if (atom1.isBondedTo(atom2)) continue;
                    if (!atom1.canFormBond() || !atom2.canFormBond()) continue;
                    
                    const distance = atom1.pos.dist(atom2.pos);
                    const maxBondDistance = (atom1.bondingDistance + atom2.bondingDistance) / 2;
                    
                    if (distance < maxBondDistance) {
                        const compatibility = this.calculateCompatibility(atom1, atom2);
                        const formationChance = compatibility * (1 - distance / maxBondDistance);
                        
                        if (random() < formationChance * 0.05) {
                            this.formBond(atom1, atom2);
                        }
                    }
                }
            }
        }
    }
    
    calculateCompatibility(atom1, atom2) {
        // Calculate how compatible two atoms are for bonding
        // Based on valency, charge, and atomic number difference
        
        const valencyMatch = min(atom1.valency, atom2.valency) / max(atom1.valency, atom2.valency);
        const chargeCompatibility = abs(atom1.charge - atom2.charge) * 2; // Opposite charges help
        const atomicCompatibility = 1 - abs(atom1.atomicNumber - atom2.atomicNumber) / 15;
        
        return (valencyMatch * 0.5 + chargeCompatibility * 0.3 + atomicCompatibility * 0.2);
    }
    
    formBond(atom1, atom2) {
        // Check again if both can form bonds (safety check)
        if (!atom1.canFormBond() || !atom2.canFormBond()) {
            return false;
        }
        
        // Determine bond type
        const chargeDiff = abs(atom1.charge - atom2.charge);
        let bondType = 'covalent';
        
        if (chargeDiff > 0.5) {
            bondType = 'ionic';
        } else if (atom1.atomicNumber > 5 && atom2.atomicNumber > 5) {
            bondType = random() < 0.3 ? 'metallic' : 'covalent';
        }
        
        // Create bond with current spring constant
        const bond = new Bond(atom1, atom2, bondType, this.springConstant);
        
        // Try to add bond to both atoms
        const added1 = atom1.addBond(bond);
        const added2 = atom2.addBond(bond);
        
        if (added1 && added2) {
            this.bonds.push(bond);
            
            // Adjust charges slightly after bonding
            const chargeTransfer = chargeDiff * 0.1;
            if (atom1.charge > atom2.charge) {
                atom1.charge -= chargeTransfer;
                atom2.charge += chargeTransfer;
            } else {
                atom1.charge += chargeTransfer;
                atom2.charge -= chargeTransfer;
            }
            return true;
        } else {
            // If one failed, remove from the other
            if (added1) atom1.removeBond(bond);
            if (added2) atom2.removeBond(bond);
            return false;
        }
    }
    
    display() {
        push();
        // Apply pan and zoom
        translate(width/2, height/2);
        scale(this.zoom);
        translate(-width/2 + this.offsetX, -height/2 + this.offsetY);
        
        // Draw bonds first (so they appear behind atoms)
        for (let bond of this.bonds) {
            bond.display();
            if (this.showForces) {
                bond.displayForceVector();
            }
        }
        
        // Draw energy map if enabled
        if (this.showEnergyMap) {
            this.displayEnergyMap();
        }
        
        // Draw atoms
        for (let atom of this.atoms) {
            atom.display();
        }
        
        pop();
        
        // Display stats (not transformed)
        this.displayStats();
    }
    
    displayEnergyMap() {
        // Visualize energy landscape (simplified, optimized)
        push();
        noStroke();
        const resolution = 20; // Lower resolution for better performance
        for (let x = 0; x < width; x += resolution) {
            for (let y = 0; y < height; y += resolution) {
                let energy = 0;
                const pos = createVector(x, y);
                
                // Only check nearby atoms for performance
                for (let atom of this.atoms) {
                    const dist = pos.dist(atom.pos);
                    if (dist < 100 && dist > 0) { // Only within 100 pixels
                        energy += abs(atom.charge) * 10 / dist;
                    }
                }
                
                const alpha = map(min(energy, 50), 0, 50, 0, 150);
                fill(255, 100, 100, alpha);
                rect(x, y, resolution, resolution);
            }
        }
        pop();
    }
    
    displayStats() {
        push();
        fill(255, 255, 255, 200);
        textSize(14);
        textAlign(LEFT, TOP);
        text(`Atoms: ${this.atoms.length}`, 10, 10);
        text(`Bonds: ${this.bonds.length}`, 10, 30);
        text(`Molecules: ${this.countMolecules()}`, 10, 50);
        text(this.paused ? 'PAUSED' : 'RUNNING', 10, 70);
        if (this.useSpatialPartitioning && this.atoms.length > 50) {
            text('Optimized (Spatial Grid)', 10, 90);
        }
        pop();
    }
    
    countMolecules() {
        // Simple molecule counting: connected components
        const visited = new Set();
        let moleculeCount = 0;
        
        for (let atom of this.atoms) {
            if (!visited.has(atom)) {
                // BFS to mark all atoms in this molecule
                const queue = [atom];
                visited.add(atom);
                
                while (queue.length > 0) {
                    const current = queue.shift();
                    for (let bond of current.bonds) {
                        const other = bond.getOtherAtom(current);
                        if (!visited.has(other)) {
                            visited.add(other);
                            queue.push(other);
                        }
                    }
                }
                moleculeCount++;
            }
        }
        
        return moleculeCount;
    }
    
    getMoleculeStats() {
        // Get detailed molecule statistics
        const visited = new Set();
        const molecules = [];
        
        for (let atom of this.atoms) {
            if (!visited.has(atom)) {
                const molecule = [];
                const queue = [atom];
                visited.add(atom);
                molecule.push(atom);
                
                while (queue.length > 0) {
                    const current = queue.shift();
                    for (let bond of current.bonds) {
                        const other = bond.getOtherAtom(current);
                        if (!visited.has(other)) {
                            visited.add(other);
                            queue.push(other);
                            molecule.push(other);
                        }
                    }
                }
                molecules.push(molecule);
            }
        }
        
        // Count molecules by size
        const sizeCounts = {};
        let largestMolecule = null;
        let largestSize = 0;
        let mostPopularSize = 0;
        let mostPopularCount = 0;
        
        for (let molecule of molecules) {
            const size = molecule.length;
            sizeCounts[size] = (sizeCounts[size] || 0) + 1;
            
            if (size > largestSize) {
                largestSize = size;
                largestMolecule = molecule;
            }
            
            if (sizeCounts[size] > mostPopularCount) {
                mostPopularCount = sizeCounts[size];
                mostPopularSize = size;
            }
        }
        
        return {
            total: molecules.length,
            largestSize: largestSize,
            mostPopularSize: mostPopularSize,
            mostPopularCount: mostPopularCount,
            sizeDistribution: sizeCounts,
            loneAtoms: sizeCounts[1] || 0
        };
    }
    
    reset(numTypes) {
        this.numTypes = numTypes;
        this.initializeAtoms();
    }
    
    randomize() {
        this.initializeAtoms();
    }
    
    togglePause() {
        this.paused = !this.paused;
    }
}

