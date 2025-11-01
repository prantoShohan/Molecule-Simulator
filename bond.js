// Bond class representing bonds between atoms
class Bond {
    constructor(atom1, atom2, bondType = 'covalent', springConstant = 0.1) {
        this.atom1 = atom1;
        this.atom2 = atom2;
        this.bondType = bondType;
        
        // Spring properties
        this.restLength = this.calculateRestLength();
        this.springConstant = springConstant;
        this.damping = 0.95;
        this.maxStretch = this.restLength * 2.5; // Bond breaks if stretched beyond this
        
        // Visual properties
        this.strength = 1.0;
        this.color = this.getBondColor();
    }
    
    calculateRestLength() {
        // Rest length based on combined atomic numbers
        const avgAtomic = (this.atom1.atomicNumber + this.atom2.atomicNumber) / 2;
        return 20 + avgAtomic * 2;
    }
    
    getBondColor() {
        // Different colors for different bond types
        switch (this.bondType) {
            case 'covalent':
                return [200, 200, 200, 180];
            case 'ionic':
                return [255, 200, 100, 180];
            case 'metallic':
                return [150, 150, 255, 180];
            default:
                return [200, 200, 200, 180];
        }
    }
    
    getOtherAtom(atom) {
        return atom === this.atom1 ? this.atom2 : this.atom1;
    }
    
    getLength() {
        return this.atom1.pos.dist(this.atom2.pos);
    }
    
    getDirection() {
        return p5.Vector.sub(this.atom2.pos, this.atom1.pos).normalize();
    }
    
    applyForces(attractionStrength = 1.0, springConstant = null) {
        // Update spring constant if provided
        if (springConstant !== null) {
            this.springConstant = springConstant;
        }
        
        const displacement = p5.Vector.sub(this.atom2.pos, this.atom1.pos);
        const distance = displacement.mag();
        
        // Check if bond should break
        if (distance > this.maxStretch) {
            this.break();
            return;
        }
        
        // Calculate spring force (Hooke's law)
        const stretch = distance - this.restLength;
        const forceMagnitude = this.springConstant * stretch * attractionStrength;
        const force = displacement.normalize().mult(forceMagnitude);
        
        // Apply forces to both atoms
        this.atom1.applyForce(force);
        this.atom2.applyForce(force.mult(-1));
        
        // Update bond strength based on stretch
        this.strength = max(0, 1 - abs(stretch) / this.restLength);
    }
    
    break() {
        // Remove bond from both atoms
        this.atom1.removeBond(this);
        this.atom2.removeBond(this);
        return true;
    }
    
    display() {
        const dist = this.getLength();
        if (dist > this.maxStretch) return;
        
        push();
        const alpha = map(this.strength, 0, 1, 50, this.color[3]);
        stroke(this.color[0], this.color[1], this.color[2], alpha);
        strokeWeight(map(this.strength, 0, 1, 1, 3));
        line(this.atom1.pos.x, this.atom1.pos.y, 
             this.atom2.pos.x, this.atom2.pos.y);
        pop();
    }
    
    displayForceVector() {
        // Visualize the bond force direction and magnitude
        const midpoint = p5.Vector.add(this.atom1.pos, this.atom2.pos).div(2);
        const displacement = p5.Vector.sub(this.atom2.pos, this.atom1.pos);
        const stretch = displacement.mag() - this.restLength;
        const forceVec = displacement.normalize().mult(stretch * 2);
        
        push();
        stroke(255, 255, 0, 150);
        strokeWeight(2);
        line(midpoint.x, midpoint.y, 
             midpoint.x + forceVec.x, midpoint.y + forceVec.y);
        pop();
    }
}


