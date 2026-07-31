/**
 * Folds the standalone build into a single self-contained HTML file.
 *
 * No external requests at all: JS, CSS and the logo are all inlined, so the
 * result opens straight off a phone's Files app, an email attachment, or a
 * host with a strict content security policy.
 *
 * Produces two files in dist-standalone/:
 *   nexus-iq-living-intelligence-core.html — a complete document
 *   artifact-body.html                     — body content only, for hosts
 *                                            that supply their own shell
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist-standalone')

const LOGO_TOKEN = '/brand/nexus-iq-logo.png'
const logoPath = process.env.LOGO_EMBED || path.join(root, 'public/brand/nexus-iq-logo.png')

const js = fs.readFileSync(path.join(dist, 'app.js'), 'utf8')
const css = fs.readFileSync(path.join(dist, 'app.css'), 'utf8')
const logoDataUri =
  'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')

if (!js.includes(LOGO_TOKEN)) {
  throw new Error(
    `Logo path "${LOGO_TOKEN}" not found in the bundle — LOGO_SRC in config/brand.ts ` +
      `has changed and this script needs updating, otherwise the mark would silently 404.`,
  )
}

// The logo is referenced both as an <img src> and as a CSS mask-image; a data
// URI is valid in both, so a straight substitution is enough.
const inlinedJs = js.split(LOGO_TOKEN).join(logoDataUri)

// </script> anywhere in the bundle would close the tag early.
const safeJs = inlinedJs.replace(/<\/script>/gi, '<\\/script>')

const title = 'Nexus IQ Systems'

const styleTag = `<style>\n${css}\n</style>`
const scriptTag = `<script type="module">\n${safeJs}\n</script>`

// Body-only variant, for a host that supplies its own document shell.
const body = `<title>${title}</title>
${styleTag}
<div id="root"></div>
${scriptTag}
`

const document = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#02040a" />
    <meta name="color-scheme" content="dark" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="mobile-web-app-capable" content="yes" />
    <title>${title}</title>
${styleTag}
  </head>
  <body>
    <div id="root"></div>
${scriptTag}
  </body>
</html>
`

fs.writeFileSync(path.join(dist, 'artifact-body.html'), body)
fs.writeFileSync(path.join(dist, 'nexus-iq-living-intelligence-core.html'), document)

const mb = (s) => (Buffer.byteLength(s) / 1024 / 1024).toFixed(2) + ' MB'
console.log('artifact-body.html                     ', mb(body))
console.log('nexus-iq-living-intelligence-core.html ', mb(document))
