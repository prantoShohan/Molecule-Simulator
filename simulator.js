// Main simulation engine
class Simulator {
    constructor(numTypes = 5, typeManager = null) {
        this.atoms = [];
        this.bonds = [];
        this.numTypes = numTypes;
        this.typeManager = typeManager || new ParticleTypeManager();
        
        // Simulation parameters
        this.temperature = 1.0;
        this.attractionStrength = 1.0;
        this.electromagneticStrength = 100;
        this.thermalNoise = 0.5;
        this.damping = 0.98;
        this.maxVelocity = 10;
        this.springConstant = 0.1;
        this.boundaryMode = 'wrap'; // 'wrap', 'bounce', 'contain'
        this.collisionStrength = 500; // Strength of collision repulsion
        this.minDistance = 2; // Minimum distance before strong repulsion kicks in
        
        // Pan/Zoom parameters
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1.0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        
        // Scene size (actual simulation area)
        this.sceneWidth = 1000;
        this.sceneHeight = 700;
        
        // UI flags
        this.showForces = true;
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
        
        // Calculate all forces
        this.calculateCollisionForces(); // First: prevent overlaps
        this.calculateElectromagneticForces();
        this.calculateBondingForces();
        this.applyThermalMotion();
        
        // Try to form new bonds
        this.attemptBondFormation();
        
        // Update bonds (apply spring forces, check for breaking)
        for (let i = this.bonds.length - 1; i >= 0; i--) {
            this.bonds[i].applyForces(this.attractionStrength, this.springConstant);
            // Remove broken bonds
            if (this.bonds[i].getLength() > this.bonds[i].maxStretch * 1.1) {
                this.bonds.splice(i, 1);
            }
        }
        
        // Update atoms
        for (let atom of this.atoms) {
            atom.update(this.damping, this.maxVelocity, this.boundaryMode);
        }
    }
    
    calculateCollisionForces() {
        // Prevent atoms from overlapping - strong repulsion when too close
        for (let i = 0; i < this.atoms.length; i++) {
            for (let j = i + 1; j < this.atoms.length; j++) {
                const atom1 = this.atoms[i];
                const atom2 = this.atoms[j];
                
                const displacement = p5.Vector.sub(atom2.pos, atom1.pos);
                const distance = displacement.mag();
                const minSeparation = atom1.radius + atom2.radius + this.minDistance;
                
                // Strong repulsion if atoms are too close
                if (distance < minSeparation && distance > 0) {
                    // Use inverse distance with strong force when overlapping
                    const overlap = minSeparation - distance;
                    const forceMagnitude = this.collisionStrength * overlap / (distance * distance + 0.1);
                    const force = displacement.normalize().mult(forceMagnitude);
                    
                    // Apply stronger force to lighter atoms
                    const massRatio1 = atom2.mass / (atom1.mass + atom2.mass);
                    const massRatio2 = atom1.mass / (atom1.mass + atom2.mass);
                    
                    atom1.applyForce(force.mult(-massRatio1));
                    atom2.applyForce(force.mult(massRatio2));
                }
            }
        }
    }
    
    calculateElectromagneticForces() {
        // Calculate electromagnetic attraction/repulsion between all atom pairs
        for (let i = 0; i < this.atoms.length; i++) {
            for (let j = i + 1; j < this.atoms.length; j++) {
                const atom1 = this.atoms[i];
                const atom2 = this.atoms[j];
                
                // Skip if already bonded (bond force handles that)
                if (atom1.isBondedTo(atom2)) continue;
                
                const displacement = p5.Vector.sub(atom2.pos, atom1.pos);
                const distance = displacement.mag();
                
                // Avoid division by zero
                if (distance < 1) continue;
                
                // Only apply electromagnetic forces if not in collision range
                const minSeparation = atom1.radius + atom2.radius + this.minDistance;
                if (distance < minSeparation) continue;
                
                // Inverse square law for electromagnetic force
                const chargeProduct = atom1.charge * atom2.charge;
                const forceMagnitude = (this.electromagneticStrength * chargeProduct) / (distance * distance);
                
                // Attraction for opposite charges, repulsion for like charges
                const force = displacement.normalize().mult(forceMagnitude);
                
                atom1.applyForce(force.mult(-1));
                atom2.applyForce(force);
                
                // Check if atoms are within bonding distance and can form a bond
                if (distance < (atom1.bondingDistance + atom2.bondingDistance) / 2) {
                    // Additional attraction for potential bonding
                    const bondingAttraction = this.attractionStrength * 50 / (distance * distance);
                    const bondForce = displacement.normalize().mult(bondingAttraction);
                    atom1.applyForce(bondForce.mult(-1));
                    atom2.applyForce(bondForce);
                }
            }
        }
    }
    
    calculateBondingForces() {
        // Bond forces are applied in the update() method for each bond
        // This method is reserved for additional bonding-related calculations if needed
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
        // Try to form bonds between nearby atoms
        for (let i = 0; i < this.atoms.length; i++) {
            for (let j = i + 1; j < this.atoms.length; j++) {
                const atom1 = this.atoms[i];
                const atom2 = this.atoms[j];
                
                // Skip if already bonded
                if (atom1.isBondedTo(atom2)) continue;
                
                // Skip if either atom has no available valency
                if (!atom1.canFormBond() || !atom2.canFormBond()) continue;
                
                const distance = atom1.pos.dist(atom2.pos);
                const maxBondDistance = (atom1.bondingDistance + atom2.bondingDistance) / 2;
                
                // Check if atoms are close enough and conditions are favorable
                if (distance < maxBondDistance) {
                    // Probability of bond formation (higher for compatible atoms)
                    const compatibility = this.calculateCompatibility(atom1, atom2);
                    const formationChance = compatibility * (1 - distance / maxBondDistance);
                    
                    if (random() < formationChance * 0.05) { // Formation rate
                        this.formBond(atom1, atom2);
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

