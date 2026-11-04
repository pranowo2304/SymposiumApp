#!/usr/bin/env node
/**
 * GitHub Pages Build & Deployment Script
 *
 * Ensures the Vite + React + PWA application is compiled with the exact
 * GitHub Pages repository base path (e.g., `/SymposiumApp/`) and prepares
 * `dist/` so static files are served cleanly from the root of the `gh-pages`
 * branch or GitHub Actions Pages artifact.
 *
 * Usage:
 *   node scripts/deploy-gh-pages.mjs                  # Builds dist/ with /SymposiumApp/ base path
 *   node scripts/deploy-gh-pages.mjs --base=/MyRepo/  # Builds dist/ with custom base path
 *   node scripts/deploy-gh-pages.mjs --push           # Builds dist/ and pushes it to the root of gh-pages branch
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function detectBasePath() {
  // 1. CLI flag --base=/RepoName/
  const baseArg = process.argv.find((arg) => arg.startsWith('--base='));
  if (baseArg) {
    return normalizeBasePath(baseArg.split('=')[1]);
  }

  // 2. Explicit environment variable VITE_BASE_PATH
  if (process.env.VITE_BASE_PATH) {
    return normalizeBasePath(process.env.VITE_BASE_PATH);
  }

  // 3. GitHub Actions GITHUB_REPOSITORY (format: "owner/repo")
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    if (repoName && !repoName.endsWith('.github.io')) {
      return `/${repoName}/`;
    }
    return '/';
  }

  // 4. Try reading git remote origin URL
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    const match = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/);
    if (match && match[1]) {
      if (match[1].endsWith('.github.io')) {
        return '/';
      }
      return `/${match[1]}/`;
    }
  } catch {
    // Fallback if git remote is not configured
  }

  // 5. Default to /SymposiumApp/ for pranowo2304/SymposiumApp
  return '/SymposiumApp/';
}

function normalizeBasePath(input) {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed === './' || trimmed === '.') return './';
  if (trimmed === '/') return '/';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

function main() {
  const basePath = detectBasePath();
  const shouldPush = process.argv.includes('--push');

  console.log(`\n🚀 [GitHub Pages Build] Using base path: "${basePath}"`);

  // Step 1: Run Vite production build with VITE_BASE_PATH
  execSync('npx vite build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_BASE_PATH: basePath,
    },
  });

  if (!fs.existsSync(distDir)) {
    throw new Error('Build failed: dist/ directory was not generated.');
  }

  // Step 2: Copy index.html -> 404.html so direct sub-route / refresh requests never 404 on GitHub Pages
  const indexHtmlPath = path.join(distDir, 'index.html');
  const notFoundHtmlPath = path.join(distDir, '404.html');
  fs.copyFileSync(indexHtmlPath, notFoundHtmlPath);
  console.log('✅ Created dist/404.html for GitHub Pages SPA fallback');

  // Step 3: Create .nojekyll so GitHub Pages serves all files and folders from the root without Jekyll filtering
  const noJekyllPath = path.join(distDir, '.nojekyll');
  fs.writeFileSync(noJekyllPath, '');
  console.log('✅ Created dist/.nojekyll to disable Jekyll processing');

  // Step 4: Optional direct git push of dist/ to the root of the `gh-pages` branch
  if (shouldPush) {
    console.log('\n📦 Publishing dist/ to the root of the "gh-pages" branch...');
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd: rootDir,
    })
      .toString()
      .trim();

    execSync('git init', { cwd: distDir, stdio: 'inherit' });
    execSync('git checkout -B gh-pages', { cwd: distDir, stdio: 'inherit' });
    execSync('git add -A', { cwd: distDir, stdio: 'inherit' });
    execSync(
      'git -c user.name="GitHub Pages Bot" -c user.email="actions@github.com" commit -m "deploy: publish static build to gh-pages root"',
      { cwd: distDir, stdio: 'inherit' }
    );
    execSync(`git push -f "${remoteUrl}" gh-pages:gh-pages`, {
      cwd: distDir,
      stdio: 'inherit',
    });
    console.log(`\n🎉 Successfully deployed to branch "gh-pages" (base: ${basePath})`);
  } else {
    console.log(
      `\n✨ Static bundle ready in ./dist (configured for base path "${basePath}").`
    );
  }
}

main();
