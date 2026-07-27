/**
 * Fold the built bundle into one self-contained HTML fragment.
 *
 * Artifacts run under a strict CSP that blocks every external host, so the
 * JavaScript has to be inlined rather than referenced. The output is a fragment,
 * not a document: no doctype, <html>, <head> or <body>, because the host wraps
 * it at publish time.
 *
 * Usage:  npm run build && npm run bundle
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = 'artifact/nexus-academy.html';

const assets = await readdir(join(DIST, 'assets'));
const scripts = assets.filter((name) => name.endsWith('.js'));
const styles = assets.filter((name) => name.endsWith('.css'));

if (scripts.length !== 1) {
  throw new Error(
    `expected exactly one JS chunk to inline, found ${scripts.length}: ${scripts.join(', ')}. ` +
      'Code splitting would need a loader, which the CSP forbids.'
  );
}

const code = await readFile(join(DIST, 'assets', scripts[0]), 'utf8');
const css = (
  await Promise.all(styles.map((name) => readFile(join(DIST, 'assets', name), 'utf8')))
).join('\n');

// A literal </script> anywhere in the bundle would terminate the inline block
// early. Splitting the sequence is inert to the JS parser.
const safeCode = code.replace(/<\/script/gi, '<\\/script');

const html = `<style>
  /* The walkthrough owns the whole frame: no page chrome, no scrolling. The
     environment commits to a single dark visual world, so it does not follow the
     viewer's light/dark theme — that is deliberate, not an omission. */
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  body {
    background: #060d18;
    color: #eaf6ff;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  #root { width: 100%; height: 100%; }
  #root canvas { display: block; }
  button:focus-visible { outline: 2px solid #7fd8ff; outline-offset: 2px; }
  /* Full-bleed WebGL with a moving camera is a poor fit for reduced-motion, but
     the guided tour is the default view, so at least stop the page-level UI from
     animating. */
  @media (prefers-reduced-motion: reduce) {
    button { transition: none !important; }
  }
  #nexus-boot {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 10px;
    text-align: center;
    background: #060d18;
    z-index: 20;
    transition: opacity 600ms ease;
  }
  #nexus-boot[hidden] { display: none; }
  #nexus-boot .mark {
    font-size: 11px;
    letter-spacing: 3px;
    color: #7fd8ff;
    opacity: 0.85;
  }
  #nexus-boot .note { font-size: 12.5px; opacity: 0.55; }
</style>

<div id="root"></div>

<div id="nexus-boot">
  <div class="mark">NEXUS ACADEMY</div>
  <div class="note">Building the campus…</div>
</div>
${css ? `<style>\n${css}\n</style>\n` : ''}
<script type="module">
${safeCode}
</script>
<script>
  // The scene builds its geometry and bakes its textures synchronously on mount,
  // so the first frame is the right moment to clear the boot card.
  (function () {
    var boot = document.getElementById('nexus-boot');
    if (!boot) return;
    var start = Date.now();
    var poll = setInterval(function () {
      var painted = document.querySelector('#root canvas');
      if (painted || Date.now() - start > 20000) {
        clearInterval(poll);
        boot.style.opacity = '0';
        setTimeout(function () { boot.hidden = true; }, 600);
      }
    }, 120);
  })();
</script>
`;

await mkdir('artifact', { recursive: true });
await writeFile(OUT, html, 'utf8');

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
console.log(`wrote ${OUT} — ${kb(Buffer.byteLength(html))} (inlined ${scripts[0]}, ${kb(code.length)})`);
