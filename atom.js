// Atom class representing individual atoms in the simulation
class Atom {
    constructor(x, y, atomicNumber, typeProperties = null) {
        this.pos = createVector(x, y);
        this.vel = createVector(random(-1, 1), random(-1, 1));
        this.acc = createVector(0, 0);
        
        // Atomic properties
        this.atomicNumber = atomicNumber; // Z value
        this.bonds = []; // Array of bonds this atom is part of
        
        // Use type properties if provided, otherwise use defaults
        if (typeProperties) {
            this.applyTypeProperties(typeProperties);
        } else {
            // Fallback to old defaults
            this.valency = this.calculateValency();
            this.radius = 5 + atomicNumber * 2;
            this.mass = 1 + atomicNumber * 0.5;
            this.color = this.getColorByAtomicNumber();
            this.attractionRadius = 30 + atomicNumber * 5;
            this.bondingDistance = 15 + atomicNumber * 2;
            this.charge = this.initializeCharge();
        }
    }
    
    applyTypeProperties(typeProps) {
        this.valency = typeProps.valency;
        this.radius = typeProps.radius;
        this.mass = typeProps.mass;
        this.color = [...typeProps.color]; // Copy color array
        this.attractionRadius = typeProps.attractionRadius;
        this.bondingDistance = typeProps.bondingDistance;
        this.baseCharge = typeProps.baseCharge || 0;
        this.chargeRange = typeProps.chargeRange || 0.3;
        // Initialize charge based on type properties
        this.charge = this.baseCharge + random(-this.chargeRange, this.chargeRange);
    }
    
    updateFromTypeProperties(typeProps) {
        // Update properties from type manager (for existing atoms)
        this.valency = typeProps.valency;
        const oldRadius = this.radius;
        this.radius = typeProps.radius;
        this.mass = typeProps.mass;
        this.color = [...typeProps.color];
        this.attractionRadius = typeProps.attractionRadius;
        this.bondingDistance = typeProps.bondingDistance;
        this.baseCharge = typeProps.baseCharge || 0;
        this.chargeRange = typeProps.chargeRange || 0.3;
        // If radius changed significantly, adjust position to avoid overlap
        // (This is handled by collision detection, but we can clamp bonds)
        if (this.bonds.length > this.valency) {
            // Remove excess bonds if valency decreased
            const bondsToRemove = this.bonds.slice(this.valency);
            this.bonds = this.bonds.slice(0, this.valency);
            for (let bond of bondsToRemove) {
                const otherAtom = bond.getOtherAtom(this);
                if (otherAtom) {
                    otherAtom.removeBond(bond);
                }
            }
        }
    }
    
    calculateValency() {
        // Simplified valency calculation based on atomic number
        // Common patterns: H=1, C=4, N=3, O=2, P=5, etc.
        const valencyMap = {
            1: 1,   // H
            2: 0,   // He (noble)
            3: 1,   // Li
            4: 2,   // Be
            5: 3,   // B
            6: 4,   // C
            7: 3,   // N
            8: 2,   // O
            9: 1,   // F
            10: 0,  // Ne
            11: 1,  // Na
            12: 2,  // Mg
            13: 3,  // Al
            14: 4,  // Si
            15: 5   // P
        };
        
        if (valencyMap[this.atomicNumber] !== undefined) {
            return valencyMap[this.atomicNumber];
        }
        // Default: roughly based on position in periodic table
        return min(8, max(1, (this.atomicNumber % 8) || 2));
    }
    
    initializeCharge() {
        // Most atoms start neutral, but can gain/lose charge during bonding
        // Electronegativity simulation
        const electronegativity = this.atomicNumber / 10;
        return random(-0.3, 0.3) * electronegativity;
    }
    
    getColorByAtomicNumber() {
        // Color mapping for different atomic types
        const colors = [
            [255, 100, 100],  // Red - H, Li, Na
            [150, 150, 255],  // Blue - Be, Mg
            [100, 255, 100],  // Green - B, Al
            [100, 100, 100],  // Gray - C, Si
            [150, 150, 255],  // Light Blue - N
            [255, 100, 100],  // Red - O
            [255, 255, 100],  // Yellow - F, P
            [200, 200, 255]   // Light Purple - Noble gases
        ];
        const index = this.atomicNumber % colors.length;
        return colors[index];
    }
    
    canFormBond() {
        return this.bonds.length < this.valency;
    }
    
    addBond(bond) {
        if (this.canFormBond() && !this.bonds.includes(bond)) {
            this.bonds.push(bond);
            return true;
        }
        return false;
    }
    
    removeBond(bond) {
        const index = this.bonds.indexOf(bond);
        if (index > -1) {
            this.bonds.splice(index, 1);
        }
    }
    
    getBondedAtoms() {
        return this.bonds.map(bond => bond.getOtherAtom(this));
    }
    
    isBondedTo(atom) {
        return this.bonds.some(bond => bond.getOtherAtom(this) === atom);
    }
    
    update(damping, maxVelocity, boundaryMode) {
        // Apply velocity
        this.vel.add(this.acc);
        
        // Limit velocity
        if (this.vel.mag() > maxVelocity) {
            this.vel.normalize().mult(maxVelocity);
        }
        
        this.pos.add(this.vel);
        
        // Boundary conditions (use scene dimensions)
        const sceneWidth = typeof window !== 'undefined' && window.simulator ? window.simulator.sceneWidth : width;
        const sceneHeight = typeof window !== 'undefined' && window.simulator ? window.simulator.sceneHeight : height;
        
        if (boundaryMode === 'wrap') {
            if (this.pos.x < 0) this.pos.x = sceneWidth;
            if (this.pos.x > sceneWidth) this.pos.x = 0;
            if (this.pos.y < 0) this.pos.y = sceneHeight;
            if (this.pos.y > sceneHeight) this.pos.y = 0;
        } else if (boundaryMode === 'bounce') {
            if (this.pos.x < this.radius) {
                this.pos.x = this.radius;
                this.vel.x *= -0.6; // Less bouncy
            }
            if (this.pos.x > sceneWidth - this.radius) {
                this.pos.x = sceneWidth - this.radius;
                this.vel.x *= -0.6; // Less bouncy
            }
            if (this.pos.y < this.radius) {
                this.pos.y = this.radius;
                this.vel.y *= -0.6; // Less bouncy
            }
            if (this.pos.y > sceneHeight - this.radius) {
                this.pos.y = sceneHeight - this.radius;
                this.vel.y *= -0.6; // Less bouncy
            }
        } else if (boundaryMode === 'contain') {
            // Contain: stop at boundaries but don't bounce
            if (this.pos.x < this.radius) {
                this.pos.x = this.radius;
                this.vel.x = 0;
            }
            if (this.pos.x > sceneWidth - this.radius) {
                this.pos.x = sceneWidth - this.radius;
                this.vel.x = 0;
            }
            if (this.pos.y < this.radius) {
                this.pos.y = this.radius;
                this.vel.y = 0;
            }
            if (this.pos.y > sceneHeight - this.radius) {
                this.pos.y = sceneHeight - this.radius;
                this.vel.y = 0;
            }
        }
        
        // Reset acceleration
        this.acc.mult(0);
        
        // Apply damping
        this.vel.mult(damping);
    }
    
    applyForce(force) {
        this.acc.add(force.div(this.mass));
    }
    
    display() {
        push();
        translate(this.pos.x, this.pos.y);
        
        // Draw atom circle
        fill(this.color[0], this.color[1], this.color[2]);
        noStroke();
        circle(0, 0, this.radius * 2);
        
        // Draw charge indicator
        if (abs(this.charge) > 0.1) {
            fill(255, 255, 0);
            textSize(10);
            textAlign(CENTER, CENTER);
            text(this.charge > 0 ? '+' : '-', 0, 0);
        }
        
        // Draw valency indicator (small dots around atom)
        if (this.valency > 0) {
            fill(200, 200, 200, 100);
            for (let i = 0; i < this.valency; i++) {
                const angle = (TWO_PI / this.valency) * i;
                const x = cos(angle) * (this.radius + 8);
                const y = sin(angle) * (this.radius + 8);
                const used = i < this.bonds.length;
                fill(used ? 255 : 200, used ? 0 : 200, used ? 0 : 200, 150);
                circle(x, y, 4);
            }
        }
        
        pop();
    }
}

