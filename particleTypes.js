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
        
        // Override defaults for first 5 types with specific values
        // Type 1: (1000, 2, 2, 1)
        if (this.types.has(1)) {
            const type1 = this.types.get(1);
            type1.count = 1000;
            type1.radius = 2;
            type1.mass = 2;
            type1.valency = 1;
            type1.locked.count = true; // Lock count by default
            type1.locked.radius = true;
            type1.locked.mass = true;
            type1.locked.valency = true;
        }
        // Type 2: (400, 4, 4, 2)
        if (this.types.has(2)) {
            const type2 = this.types.get(2);
            type2.count = 400;
            type2.radius = 4;
            type2.mass = 4;
            type2.valency = 2;
            type2.locked.count = true;
            type2.locked.radius = true;
            type2.locked.mass = true;
            type2.locked.valency = true;
        }
        // Type 3: (200, 6, 6, 3)
        if (this.types.has(3)) {
            const type3 = this.types.get(3);
            type3.count = 200;
            type3.radius = 6;
            type3.mass = 6;
            type3.valency = 3;
            type3.locked.count = true;
            type3.locked.radius = true;
            type3.locked.mass = true;
            type3.locked.valency = true;
        }
        // Type 4: (100, 8, 8, 4)
        if (this.types.has(4)) {
            const type4 = this.types.get(4);
            type4.count = 100;
            type4.radius = 8;
            type4.mass = 8;
            type4.valency = 4;
            type4.locked.count = true;
            type4.locked.radius = true;
            type4.locked.mass = true;
            type4.locked.valency = true;
        }
        // Type 5: (50, 10, 10, 5)
        if (this.types.has(5)) {
            const type5 = this.types.get(5);
            type5.count = 50;
            type5.radius = 10;
            type5.mass = 10;
            type5.valency = 5;
            type5.locked.count = true;
            type5.locked.radius = true;
            type5.locked.mass = true;
            type5.locked.valency = true;
        }
    }
    
    createDefaultType(atomicNumber) {
        const defaults = {
            atomicNumber: atomicNumber,
            name: this.getDefaultName(atomicNumber),
            color: this.getDefaultColor(atomicNumber),
            radius: atomicNumber,
            mass: 1 + atomicNumber * 0.5,
            valency: this.getDefaultValency(atomicNumber),
            attractionRadius: 30 + atomicNumber * 5,
            bondingDistance: 15 + atomicNumber * 2,
            baseCharge: 0,
            chargeRange: 0.3,
            count: 10, // Default count per type
            locked: {
                count: false,
                color: false,
                radius: false,
                mass: false,
                valency: false,
                attractionRadius: false,
                bondingDistance: false,
                baseCharge: false,
                chargeRange: false
            }
        };
        this.types.set(atomicNumber, defaults);
        return defaults;
    }
    
    getDefaultName(atomicNumber) {
        const names = {
            1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E',
            6: 'F', 7: 'G', 8: 'H', 9: 'I', 10: 'J',
            11: 'K', 12: 'L', 13: 'M', 14: 'N', 15: 'O'
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
            2: 2,   // He (noble)
            3: 3,   // Li
            4: 4,   // Be
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
        const locked = type.locked || {};
        
        // Only randomize unlocked properties
        if (!locked.color) {
            type.color = [
                random(50, 255),
                random(50, 255),
                random(50, 255)
            ];
        }
        if (!locked.radius) {
            type.radius = random(5, 15); // Keep radius below 15 as requested
        }
        if (!locked.mass) {
            type.mass = random(0.5, 10);
        }
        if (!locked.valency) {
            type.valency = floor(random(0, 8));
        }
        if (!locked.attractionRadius) {
            type.attractionRadius = random(20, 100);
        }
        if (!locked.bondingDistance) {
            type.bondingDistance = random(10, 50);
        }
        if (!locked.baseCharge) {
            type.baseCharge = random(-1, 1);
        }
        if (!locked.chargeRange) {
            type.chargeRange = random(0.1, 0.5);
        }
        // Count is never randomized
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

