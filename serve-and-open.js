import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  let openBrowser;
  try {
    const openModule = await import('open');
    openBrowser = openModule.default;
  } catch {
    openBrowser = null;
    console.warn('  ⚠ Could not import "open" — browser will not auto-launch');
  }

  const comparisonFiles = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('-comparison.html'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(__dirname, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (comparisonFiles.length === 0) {
    console.error('✗ No *-comparison.html found.');
    console.error('  Run: node build-comparison.js first');
    process.exit(1);
  }

  const comparisonFilename = comparisonFiles[0].name;
  const comparisonPath = path.resolve(__dirname, comparisonFilename);

  const app = express();

  // Serve all project files as static (variants + comparison page)
  app.use(express.static(__dirname, {
    // Cache-control: no-cache so edits to variants are picked up on reload
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
  }));

  const PORT = 3000;
  app.listen(PORT, async () => {
    const url = `http://localhost:${PORT}/${comparisonFilename}`;
    console.log(`\n✓ Serving at ${url}`);
    console.log('  All variants run as live iframes — animations play automatically.');
    console.log('\n  Press Ctrl+C to stop.\n');

    if (openBrowser) {
      await openBrowser(url);
      console.log('  Browser launched.');
    } else {
      console.log(`  Open manually: ${url}`);
    }
  });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
