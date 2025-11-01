// Spatial Grid for efficient neighbor finding
// Divides space into cells to reduce force calculations from O(N²) to O(N)

class SpatialGrid {
    constructor(width, height, cellSize = 100) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = [];
        this.clear();
    }
    
    clear() {
        // Initialize grid with empty arrays
        this.grid = [];
        for (let i = 0; i < this.cols * this.rows; i++) {
            this.grid[i] = [];
        }
    }
    
    getCellIndex(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Clamp to grid bounds
        const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
        const clampedRow = Math.max(0, Math.min(row, this.rows - 1));
        
        return clampedRow * this.cols + clampedCol;
    }
    
    insert(particle, index) {
        const cellIndex = this.getCellIndex(particle.pos.x, particle.pos.y);
        this.grid[cellIndex].push({ particle, index });
    }
    
    getNeighbors(x, y, radius = null) {
        const results = [];
        
        // Determine which cells to check
        const minCol = Math.max(0, Math.floor((x - (radius || this.cellSize)) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((x + (radius || this.cellSize)) / this.cellSize));
        const minRow = Math.max(0, Math.floor((y - (radius || this.cellSize)) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((y + (radius || this.cellSize)) / this.cellSize));
        
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                const cellIndex = row * this.cols + col;
                const cell = this.grid[cellIndex];
                
                for (let entry of cell) {
                    // If radius specified, check distance
                    if (radius !== null) {
                        const dx = entry.particle.pos.x - x;
                        const dy = entry.particle.pos.y - y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius) {
                            results.push(entry);
                        }
                    } else {
                        results.push(entry);
                    }
                }
            }
        }
        
        return results;
    }
    
    rebuild(particles) {
        this.clear();
        for (let i = 0; i < particles.length; i++) {
            this.insert(particles[i], i);
        }
    }
    
    updateCellSize(newSize) {
        this.cellSize = newSize;
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
        this.clear(); // Clear grid when cell size changes
    }
}

