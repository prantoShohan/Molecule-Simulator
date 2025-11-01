# Integration Guide: Molecule Simulator into Next.js Portfolio

## Overview
This guide shows how to integrate the Molecule Simulator into your Next.js portfolio website.

## Step 1: Copy Simulator Files to Your Portfolio

Copy these files to your Next.js project's `public` folder:
- `spatialGrid.js`
- `particleTypes.js`
- `atom.js`
- `bond.js`
- `simulator.js`
- `sketch.js`

Create a folder structure like this:
```
your-portfolio/
├── public/
│   └── simulator/
│       ├── spatialGrid.js
│       ├── particleTypes.js
│       ├── atom.js
│       ├── bond.js
│       ├── simulator.js
│       └── sketch.js
```

## Step 2: Create Next.js Page for Simulator

Create a new file at `app/simulator/page.tsx` (or `pages/simulator.tsx` if using Pages Router):

**For App Router (Next.js 13+):**
```tsx
// app/simulator/page.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function SimulatorPage() {
  useEffect(() => {
    // Load p5.js dynamically
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js';
      script.async = true;
      document.body.appendChild(script);

      // Load simulator scripts after p5.js loads
      script.onload = () => {
        const scripts = [
          '/simulator/spatialGrid.js',
          '/simulator/particleTypes.js',
          '/simulator/atom.js',
          '/simulator/bond.js',
          '/simulator/simulator.js',
          '/simulator/sketch.js',
        ];

        scripts.forEach((src, index) => {
          setTimeout(() => {
            const s = document.createElement('script');
            s.src = src;
            document.body.appendChild(s);
          }, index * 100);
        });
      };
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div id="sidebar"></div>
      <div id="canvas-container"></div>
      <div id="right-sidebar"></div>
    </div>
  );
}
```

**Alternative: Using iframe or standalone HTML**

You can also create a standalone HTML file and load it in an iframe. Create `public/simulator.html` with your current `index.html` content, then:

```tsx
// app/simulator/page.tsx
export default function SimulatorPage() {
  return (
    <iframe 
      src="/simulator.html" 
      style={{ width: '100vw', height: '100vh', border: 'none' }}
      title="Molecule Simulator"
    />
  );
}
```

## Step 3: Add Button to Your Portfolio

Add a button/link anywhere in your portfolio. Examples:

**In a Projects section:**
```tsx
import Link from 'next/link';

<Link href="/simulator">
  <button className="project-card">
    <h3>Molecule Simulator</h3>
    <p>Interactive particle physics simulation</p>
    <span>Launch →</span>
  </button>
</Link>
```

**In Navigation:**
```tsx
<Link href="/simulator">Simulator</Link>
```

**As a Featured Project:**
```tsx
<div className="featured-project">
  <h2>Molecule Simulator</h2>
  <p>Watch atoms interact and form molecules in real-time</p>
  <Link href="/simulator">
    <button>Try it Live</button>
  </Link>
</div>
```

## Step 4: Add CSS Styles

Copy the CSS from `index.html` into your global CSS or component styles. You can create `app/simulator/styles.css` or add to your global styles.

## Recommended Approach

For easiest integration, I recommend:
1. Copy all JS files to `public/simulator/`
2. Copy the HTML content (body and styles) to `app/simulator/page.tsx` as shown above
3. Add a button/link in your projects section pointing to `/simulator`

## File Structure Summary

```
your-portfolio/
├── public/
│   └── simulator/
│       ├── spatialGrid.js
│       ├── particleTypes.js
│       ├── atom.js
│       ├── bond.js
│       ├── simulator.js
│       └── sketch.js
├── app/
│   └── simulator/
│       └── page.tsx
└── ...rest of your portfolio
```

## Notes

- The simulator uses p5.js which is loaded from CDN
- All simulator logic is in vanilla JavaScript, compatible with React/Next.js
- The simulator runs client-side only
- Make sure to use `'use client'` directive if using App Router
