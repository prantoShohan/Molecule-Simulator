# Atomic Bonds Simulator

A 2D atom-based emergent simulator built with p5.js where simple atoms interact through abstracted physical and chemical rules to form complex molecular structures over time.

## Features

- **Real-time Simulation**: Watch atoms spontaneously form bonds and create molecules
- **Emergent Behavior**: Molecules grow into branched or chain structures over time
- **Physical Forces**: Electromagnetic attraction/repulsion, bonding forces, and thermal motion
- **Dynamic Bonding**: Atoms form covalent, ionic, or metallic bonds based on their properties
- **Interactive Controls**: Adjust temperature, attraction strength, and simulation parameters in real-time

## How to Run

Simply open `index.html` in a modern web browser. No build process or server required - it uses the p5.js CDN.

## Controls

- **SPACE**: Pause/Resume simulation
- **Temperature Slider**: Adjust thermal motion (higher = more random movement)
- **Attraction Strength**: Control bonding force intensity
- **Atom Types**: Change the variety of atomic types (affects valency and properties)
- **Number of Atoms**: Adjust the total number of atoms in the simulation
- **Reset Button**: Restart simulation with current settings
- **Randomize Button**: Randomly reposition all atoms
- **Show Forces**: Toggle visualization of bond force vectors
- **Show Energy Map**: Display energy landscape overlay

## How It Works

### Atom Properties

Each atom has:
- **Atomic Number (Z)**: Affects size, charge, attraction radius, and bonding capacity
- **Valency**: Maximum number of stable bonds it can form
- **Charge**: Positive, negative, or neutral (changes during interactions)
- **Bond Type**: Covalent, ionic, or metallic bonds form based on compatibility

### Forces

1. **Electromagnetic**: Opposite charges attract, like charges repel (inverse-square law)
2. **Bonding**: Spring-like forces keep bonded atoms at optimal distance
3. **Thermal**: Random motion based on temperature setting

### Bond Formation

Bonds form when:
- Atoms are within bonding distance
- Both atoms have available valency slots
- Atoms are compatible (based on valency, charge, and atomic number)

Bonds break when:
- Stretched beyond maximum threshold
- External forces overcome bond strength

### Emergent Behavior

Over time, you'll observe:
- Simple molecules forming (diatomic, triatomic)
- Chain structures growing
- Branched molecular structures
- Self-organized clusters
- Evolution from chaos to ordered structures

## File Structure

- `index.html`: Main HTML file with UI and p5.js setup
- `atom.js`: Atom class with properties and behavior
- `bond.js`: Bond class with spring dynamics
- `simulator.js`: Main simulation engine and physics
- `sketch.js`: p5.js setup and draw loop

## Technical Details

- Uses p5.Vector for 2D physics
- Spring-mass system for bonds (Hooke's law)
- BFS algorithm for molecule counting
- Real-time parameter adjustment
- Efficient force calculations with distance-based optimization

Enjoy watching the emergence of molecular structures!


