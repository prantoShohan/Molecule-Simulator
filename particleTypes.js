// Particle Type Manager - stores and manages properties for each atomic number/type
class ParticleTypeManager {
    constructor() {
        this.types = new Map(); // Map<atomicNumber, properties>
        this.initializeDefaults();
    }
    
    initializeDefaults() {
        // Initialize default types (1-15)
        for (let i = 1; i <= 15; i++) {
            this.createDefaultType(i);
        }
    }
    
    createDefaultType(atomicNumber) {
        const defaults = {
            atomicNumber: atomicNumber,
            name: this.getDefaultName(atomicNumber),
            color: this.getDefaultColor(atomicNumber),
            radius: 5 + atomicNumber * 2,
            mass: 1 + atomicNumber * 0.5,
            valency: this.getDefaultValency(atomicNumber),
            attractionRadius: 30 + atomicNumber * 5,
            bondingDistance: 15 + atomicNumber * 2,
            baseCharge: 0,
            chargeRange: 0.3,
            count: 10 // Default count per type
        };
        this.types.set(atomicNumber, defaults);
        return defaults;
    }
    
    getDefaultName(atomicNumber) {
        const names = {
            1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B',
            6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
            11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P'
        };
        return names[atomicNumber] || `Type ${atomicNumber}`;
    }
    
    getDefaultColor(atomicNumber) {
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
        return colors[atomicNumber % colors.length];
    }
    
    getDefaultValency(atomicNumber) {
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
        if (valencyMap[atomicNumber] !== undefined) {
            return valencyMap[atomicNumber];
        }
        return min(8, max(1, (atomicNumber % 8) || 2));
    }
    
    getType(atomicNumber) {
        if (!this.types.has(atomicNumber)) {
            this.createDefaultType(atomicNumber);
        }
        return this.types.get(atomicNumber);
    }
    
    setType(atomicNumber, properties) {
        const current = this.getType(atomicNumber);
        Object.assign(current, properties);
    }
    
    updateType(atomicNumber, property, value) {
        const type = this.getType(atomicNumber);
        if (property === 'color') {
            // Color comes as [r, g, b] array
            type.color = value;
        } else {
            type[property] = value;
        }
        // Update existing atoms of this type
        return this;
    }
    
    randomizeType(atomicNumber) {
        const type = this.getType(atomicNumber);
        type.color = [
            random(50, 255),
            random(50, 255),
            random(50, 255)
        ];
        type.radius = random(5, 15); // Keep radius below 15 as requested
        type.mass = random(0.5, 10);
        type.valency = floor(random(0, 8));
        type.attractionRadius = random(20, 100);
        type.bondingDistance = random(10, 50);
        type.baseCharge = random(-1, 1);
        type.chargeRange = random(0.1, 0.5);
        return type;
    }
    
    getAllTypes() {
        return Array.from(this.types.entries()).map(([num, props]) => ({
            atomicNumber: num,
            ...props
        }));
    }
    
    getActiveTypes(maxType) {
        // Get types that are actually being used
        const active = [];
        for (let i = 1; i <= maxType + 1; i++) {
            if (this.types.has(i)) {
                active.push({
                    atomicNumber: i,
                    ...this.types.get(i)
                });
            }
        }
        return active.sort((a, b) => a.atomicNumber - b.atomicNumber);
    }
}

