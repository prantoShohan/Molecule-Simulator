# ⚛️ Molecule Simulator

An interactive 2D particle physics simulation where atoms interact through electromagnetic forces to form molecular structures in real-time.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://yourusername.github.io/molecule-simulator)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-green)](https://pages.github.com)

## 🌟 Features

- **Interactive Particle Simulation**: Watch thousands of atoms interact and form bonds
- **Real-time Controls**: Adjust temperature, forces, and particle properties on the fly
- **Advanced Physics**: 
  - Electromagnetic attraction/repulsion
  - Spring-based bonding system
  - Collision detection and prevention
  - Thermal motion simulation
- **Customizable Particles**: 
  - Control color, size, mass, valency for each particle type
  - Lock properties to preserve during randomization
  - Real-time property updates
- **Visual Feedback**:
  - Energy map visualization
  - Force vector display
  - Statistics panel (bonds, molecules, etc.)
  - Debug information overlay
- **Performance Optimized**: Spatial partitioning for smooth simulation with thousands of particles

## 🎮 Controls

- **SPACE**: Pause/Play simulation
- **Mouse Drag**: Pan the scene
- **Mouse Wheel**: Zoom in/out
- **Sidebars**: Adjust simulation parameters in real-time

## 🚀 Quick Start

### Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. That's it! No build process or dependencies required.

### Online Demo

Visit the [live demo](https://yourusername.github.io/molecule-simulator) to try it immediately.

## 📁 Project Structure

```
molecule-simulator/
├── index.html          # Main HTML file with UI
├── sketch.js           # p5.js setup and draw loop
├── simulator.js        # Core physics simulation engine
├── atom.js             # Atom particle class
├── bond.js             # Bond spring dynamics
├── particleTypes.js    # Particle type management
├── spatialGrid.js      # Performance optimization
└── README.md           # This file
```

## 🛠️ Technologies Used

- **p5.js**: Graphics and animation library
- **Vanilla JavaScript**: No frameworks, pure JS
- **HTML5 Canvas**: Rendering
- **Physics**: Custom implementation of:
  - Hooke's law (spring forces)
  - Inverse-square law (electromagnetic forces)
  - Collision detection
  - Spatial partitioning

## 📊 Simulation Parameters

Adjust these in real-time via the left sidebar:

- **Temperature**: Controls random thermal motion
- **Attraction Strength**: Global bonding tendency
- **Electromagnetic Strength**: Charge-based forces
- **Thermal Noise**: Random motion magnitude
- **Damping**: Velocity decay rate
- **Max Velocity**: Speed limit
- **Spring Stiffness**: Bond strength
- **Collision Strength**: Repulsion force
- **Min Distance**: Collision threshold

## 🎨 Particle Customization

Each particle type can be customized via the right sidebar:

- Count, Color, Radius, Mass
- Valency (max bonds)
- Attraction radius
- Bonding distance
- Charge properties

Properties can be locked to prevent randomization.

## 🔬 Physics Details

The simulation models:

1. **Collision Forces**: Strong repulsion when particles overlap
2. **Electromagnetic Forces**: Opposite charges attract, like charges repel
3. **Bonding Forces**: Spring-like connections between compatible atoms
4. **Thermal Motion**: Random velocity based on temperature

Molecules form when atoms:
- Are within bonding distance
- Have available valency slots
- Are compatible (based on charge and type)

## 📈 Performance

- Optimized for 1000+ particles
- Spatial grid partitioning for O(n) force calculations
- Efficient molecule counting using BFS algorithm
- Smooth 60 FPS on modern browsers

## 🌐 Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## 📝 License

Feel free to use and modify this project for your own purposes!

## 🤝 Contributing

Suggestions and improvements are welcome! Open an issue or submit a pull request.

## 📧 Contact

Found a bug or have a suggestion? Open an issue on GitHub.

---

Made with ❤️ and p5.js
