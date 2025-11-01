# GitHub Pages Deployment Guide

This guide will help you publish the Molecule Simulator as a standalone GitHub Pages website.

## Quick Setup

### Option 1: Deploy from Main Branch (Easiest)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add molecule simulator"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **Deploy from a branch**
   - Select **main** branch and **/ (root)** folder
   - Click **Save**

3. **Your site will be live at:**
   ```
   https://yourusername.github.io/repository-name/
   ```

### Option 2: Deploy from gh-pages Branch

1. **Create a gh-pages branch**
   ```bash
   git checkout -b gh-pages
   git push origin gh-pages
   ```

2. **Enable GitHub Pages**
   - Go to **Settings** → **Pages**
   - Select **gh-pages** branch as source
   - Click **Save**

## File Structure for GitHub Pages

Your repository should look like this:

```
molecule-simulator/
├── index.html          (Main HTML file)
├── spatialGrid.js
├── particleTypes.js
├── atom.js
├── bond.js
├── simulator.js
├── sketch.js
├── README.md
└── .gitignore
```

## Requirements

- ✅ All files are already in the correct structure
- ✅ `index.html` is in the root directory
- ✅ All JavaScript files are in the same directory
- ✅ p5.js is loaded from CDN (no installation needed)

## Custom Domain (Optional)

If you want a custom domain:

1. Add a `CNAME` file to your repository root:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Create a CNAME record pointing to `yourusername.github.io`
   - Wait for DNS propagation

## Troubleshooting

### Site shows 404 or blank page
- Check that `index.html` is in the root directory
- Wait a few minutes after enabling GitHub Pages (can take 1-10 minutes)
- Check the **Actions** tab for deployment status

### Scripts not loading
- Verify all `.js` files are in the same directory as `index.html`
- Check browser console for errors (F12)
- Ensure file names match exactly in `index.html`

### CSS not loading
- Check that all styles are in the `<style>` tag in `index.html`
- No external CSS files needed - everything is inline

## Updating Your Site

Just push changes to your repository:
```bash
git add .
git commit -m "Update simulator"
git push
```

GitHub Pages automatically rebuilds (usually takes 1-2 minutes).

## Example URLs

If your repository is `https://github.com/username/molecule-simulator`:
- Your site will be: `https://username.github.io/molecule-simulator/`
- Or if you rename repo to `username.github.io`: `https://username.github.io/`

## Pro Tips

1. **Use a dedicated repository** for the simulator:
   - Create a new repo like `molecule-simulator`
   - Keep it separate from your main portfolio

2. **Add a README.md** to the repo root with:
   - Project description
   - Features list
   - Link to live demo

3. **Pin the repository** on your GitHub profile so it's visible

4. **Share the link** - Add it to your portfolio, resume, or social media!

## Deployment Checklist

- [ ] All files pushed to GitHub
- [ ] GitHub Pages enabled in Settings
- [ ] `index.html` in root directory
- [ ] All `.js` files in same directory
- [ ] Site accessible at `username.github.io/repo-name`
- [ ] Tested on mobile and desktop
- [ ] README.md added (optional but recommended)

That's it! Your simulator should be live on GitHub Pages within minutes.
