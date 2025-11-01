// GPU-Accelerated Simulator using WebGL Shaders
// Stores particles in textures and computes physics on GPU

class GPUSimulator {
    constructor(numTypes = 5, typeManager = null) {
        this.numTypes = numTypes;
        this.typeManager = typeManager || new ParticleTypeManager();
        
        // Simulation parameters (same as CPU version)
        this.temperature = 1.0;
        this.attractionStrength = 1.0;
        this.electromagneticStrength = 100;
        this.thermalNoise = 0.5;
        this.damping = 0.98;
        this.maxVelocity = 10;
        this.springConstant = 0.1;
        this.boundaryMode = 'wrap';
        this.collisionStrength = 500;
        this.minDistance = 2;
        
        // Scene size
        this.sceneWidth = 1000;
        this.sceneHeight = 700;
        
        // Pan/Zoom
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1.0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        
        // UI flags
        this.showForces = true;
        this.showEnergyMap = false;
        this.paused = false;
        
        // GPU resources
        this.gl = null;
        this.particleShader = null;
        this.renderShader = null;
        this.particleTexture = null;
        this.forceTexture = null;
        this.framebuffer = null;
        this.numParticles = 0;
        this.textureWidth = 0;
        this.textureHeight = 0;
        
        // Initialize GPU resources after WebGL context is available
        this.initialized = false;
    }
    
    initGL(gl) {
        if (this.initialized) return;
        
        this.gl = gl;
        
        // Calculate texture dimensions based on particle count
        this.updateParticleCount();
        
        // Create textures for particle data
        this.createTextures();
        
        // Compile shaders
        this.compileShaders();
        
        this.initialized = true;
    }
    
    updateParticleCount() {
        const activeTypes = this.typeManager.getActiveTypes(this.numTypes);
        this.numParticles = activeTypes.reduce((sum, type) => sum + (type.count || 10), 0);
        
        // Round up to power of 2 for better GPU performance
        this.textureWidth = Math.pow(2, Math.ceil(Math.log2(Math.sqrt(this.numParticles))));
        this.textureHeight = Math.ceil(this.numParticles / this.textureWidth);
        
        // Ensure we have enough space
        while (this.textureWidth * this.textureHeight < this.numParticles) {
            this.textureWidth *= 2;
        }
    }
    
    createTextures() {
        const gl = this.gl;
        
        // Particle data texture: RGBA = [pos.x, pos.y, vel.x, vel.y]
        this.particleTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.particleTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Force accumulation texture
        this.forceTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.forceTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Initialize particle data
        this.initializeParticleData();
    }
    
    initializeParticleData() {
        const gl = this.gl;
        const data = new Float32Array(this.textureWidth * this.textureHeight * 4);
        
        const activeTypes = this.typeManager.getActiveTypes(this.numTypes);
        let index = 0;
        
        for (let type of activeTypes) {
            const count = type.count || 10;
            for (let i = 0; i < count; i++) {
                const x = random(50, this.sceneWidth - 50);
                const y = random(50, this.sceneHeight - 50);
                const vx = random(-1, 1);
                const vy = random(-1, 1);
                
                const texIdx = index * 4;
                data[texIdx] = x;
                data[texIdx + 1] = y;
                data[texIdx + 2] = vx;
                data[texIdx + 3] = vy;
                index++;
            }
        }
        
        gl.bindTexture(gl.TEXTURE_2D, this.particleTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.textureWidth, this.textureHeight, gl.RGBA, gl.FLOAT, data);
    }
    
    compileShaders() {
        // Vertex shader for fullscreen quad
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_position * 0.5 + 0.5;
            }
        `;
        
        // Fragment shader for physics computation
        const physicsShaderSource = `
            precision highp float;
            uniform sampler2D u_particles;
            uniform float u_deltaTime;
            uniform float u_temperature;
            uniform float u_damping;
            uniform float u_maxVelocity;
            uniform float u_sceneWidth;
            uniform float u_sceneHeight;
            uniform float u_collisionStrength;
            uniform float u_electromagneticStrength;
            uniform float u_textureWidth;
            uniform float u_textureHeight;
            uniform float u_numParticles;
            varying vec2 v_texCoord;
            
            vec2 getParticlePos(int idx) {
                float x = mod(float(idx), u_textureWidth);
                float y = floor(float(idx) / u_textureWidth);
                vec2 coord = (vec2(x, y) + 0.5) / vec2(u_textureWidth, u_textureHeight);
                vec4 data = texture2D(u_particles, coord);
                return data.xy;
            }
            
            vec2 getParticleVel(int idx) {
                float x = mod(float(idx), u_textureWidth);
                float y = floor(float(idx) / u_textureWidth);
                vec2 coord = (vec2(x, y) + 0.5) / vec2(u_textureWidth, u_textureHeight);
                vec4 data = texture2D(u_particles, coord);
                return data.zw;
            }
            
            void main() {
                // Get current particle index from texture coordinates
                int idx = int(v_texCoord.x * u_textureWidth + v_texCoord.y * u_textureHeight * u_textureWidth);
                if (idx >= int(u_numParticles)) {
                    gl_FragColor = vec4(0.0);
                    return;
                }
                
                vec2 pos = getParticlePos(idx);
                vec2 vel = getParticleVel(idx);
                vec2 force = vec2(0.0);
                
                // Compute forces from all other particles
                for (int i = 0; i < int(u_numParticles); i++) {
                    if (i == idx) continue;
                    
                    vec2 otherPos = getParticlePos(i);
                    vec2 delta = otherPos - pos;
                    float dist = length(delta);
                    
                    if (dist < 0.1) continue;
                    
                    // Collision force (simplified)
                    if (dist < 50.0) {
                        float overlap = 50.0 - dist;
                        float f = u_collisionStrength * overlap / (dist * dist + 0.1);
                        force -= normalize(delta) * f;
                    }
                    
                    // Electromagnetic force (simplified - using distance only)
                    if (dist > 50.0 && dist < 200.0) {
                        float f = u_electromagneticStrength / (dist * dist);
                        force += normalize(delta) * f;
                    }
                }
                
                // Thermal motion
                force += vec2(
                    (fract(sin(dot(vec2(idx * 123.456, idx * 789.012), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_temperature,
                    (fract(sin(dot(vec2(idx * 456.789, idx * 123.456), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_temperature
                );
                
                // Update velocity
                vel += force * u_deltaTime;
                vel *= u_damping;
                
                // Limit velocity
                if (length(vel) > u_maxVelocity) {
                    vel = normalize(vel) * u_maxVelocity;
                }
                
                // Update position
                pos += vel * u_deltaTime;
                
                // Boundary conditions (wrap)
                if (pos.x < 0.0) pos.x = u_sceneWidth;
                if (pos.x > u_sceneWidth) pos.x = 0.0;
                if (pos.y < 0.0) pos.y = u_sceneHeight;
                if (pos.y > u_sceneHeight) pos.y = 0.0;
                
                gl_FragColor = vec4(pos, vel);
            }
        `;
        
        // Compile shader
        const vs = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fs = this.compileShader(physicsShaderSource, this.gl.FRAGMENT_SHADER);
        this.particleShader = this.createProgram(vs, fs);
    }
    
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vs, fs) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    update(deltaTime = 0.016) {
        if (this.paused || !this.initialized) return;
        
        const gl = this.gl;
        
        // Set up render-to-texture
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.forceTexture, 0);
        
        // Use physics shader
        gl.useProgram(this.particleShader);
        
        // Set uniforms
        const uniforms = {
            'u_particles': 0,
            'u_deltaTime': deltaTime,
            'u_temperature': this.temperature,
            'u_damping': this.damping,
            'u_maxVelocity': this.maxVelocity,
            'u_sceneWidth': this.sceneWidth,
            'u_sceneHeight': this.sceneHeight,
            'u_collisionStrength': this.collisionStrength,
            'u_electromagneticStrength': this.electromagneticStrength,
            'u_textureWidth': this.textureWidth,
            'u_textureHeight': this.textureHeight,
            'u_numParticles': this.numParticles
        };
        
        // Bind particle texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.particleTexture);
        
        // Set uniforms
        Object.keys(uniforms).forEach(name => {
            const loc = gl.getUniformLocation(this.particleShader, name);
            if (loc) {
                const value = uniforms[name];
                if (typeof value === 'number') {
                    gl.uniform1f(loc, value);
                } else if (value === 0) {
                    gl.uniform1i(loc, 0);
                }
            }
        });
        
        // Draw fullscreen quad
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const positionLoc = gl.getAttribLocation(this.particleShader, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // Swap textures
        const temp = this.particleTexture;
        this.particleTexture = this.forceTexture;
        this.forceTexture = temp;
        
        // Clean up
        gl.deleteFramebuffer(framebuffer);
        gl.deleteBuffer(buffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    display(p5) {
        // For now, use simple point rendering
        // In a full implementation, you'd read back texture data or use instanced rendering
        p5.push();
        p5.translate(p5.width/2, p5.height/2);
        p5.scale(this.zoom);
        p5.translate(-p5.width/2 + this.offsetX, -p5.height/2 + this.offsetY);
        
        // Render particles (simplified - would need texture readback or instanced rendering)
        p5.fill(255, 100, 100);
        p5.noStroke();
        
        // For GPU mode, we'd typically use WebGL instancing or read texture data
        // This is a placeholder - full implementation would require more complex rendering
        for (let i = 0; i < min(this.numParticles, 10000); i++) {
            // Would read from texture here
            p5.circle(random(this.sceneWidth), random(this.sceneHeight), 5);
        }
        
        p5.pop();
    }
    
    reset(numTypes) {
        this.numTypes = numTypes;
        this.updateParticleCount();
        if (this.initialized) {
            this.createTextures();
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
    }
}

