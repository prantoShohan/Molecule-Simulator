'use client';

import { useEffect } from 'react';

export default function SimulatorPage() {
  useEffect(() => {
    // Load p5.js
    const loadP5 = () => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined' && (window as any).p5) {
          resolve((window as any).p5);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js';
        script.async = true;
        script.onload = () => resolve((window as any).p5);
        document.head.appendChild(script);
      });
    };

    // Load simulator scripts in order
    const loadScripts = async () => {
      await loadP5();
      
      const scripts = [
        '/simulator/spatialGrid.js',
        '/simulator/particleTypes.js',
        '/simulator/atom.js',
        '/simulator/bond.js',
        '/simulator/simulator.js',
        '/simulator/sketch.js',
      ];

      // Load scripts sequentially
      for (const src of scripts) {
        await new Promise((resolve) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve(undefined);
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve(undefined);
          document.body.appendChild(script);
        });
      }
    };

    loadScripts();

    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Sidebars will be created by sketch.js */}
      <div id="sidebar"></div>
      <div id="canvas-container"></div>
      <div id="right-sidebar"></div>
    </div>
  );
}
