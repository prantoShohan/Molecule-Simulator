// Example button component for your Next.js portfolio
// Add this to wherever you want the button in your portfolio

import Link from 'next/link';

export function SimulatorButton() {
  return (
    <Link href="/simulator">
      <button 
        className="
          px-6 py-3 
          bg-gradient-to-r from-blue-500 to-purple-600 
          text-white font-semibold rounded-lg 
          shadow-lg hover:shadow-xl 
          transition-all duration-300
          hover:scale-105
          active:scale-95
        "
      >
        🧬 Launch Molecule Simulator
      </button>
    </Link>
  );
}

// Or as a project card:
export function SimulatorProjectCard() {
  return (
    <Link href="/simulator">
      <div className="
        project-card 
        bg-white/10 backdrop-blur-lg
        rounded-xl p-6
        hover:bg-white/20
        transition-all duration-300
        cursor-pointer
        border border-white/20
        hover:border-white/40
      ">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⚛️</span>
          <h3 className="text-xl font-bold">Molecule Simulator</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Interactive particle physics simulation where atoms interact through 
          electromagnetic forces to form molecular structures in real-time.
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-500/30 rounded-full text-sm">p5.js</span>
          <span className="px-3 py-1 bg-purple-500/30 rounded-full text-sm">Physics</span>
          <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm">Interactive</span>
        </div>
        <button className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:opacity-90 transition">
          Launch Simulator →
        </button>
      </div>
    </Link>
  );
}

// Simple inline button:
export function SimpleSimulatorLink() {
  return (
    <Link 
      href="/simulator" 
      className="text-blue-400 hover:text-blue-300 underline"
    >
      Try Molecule Simulator
    </Link>
  );
}
