import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']})
const p = await b.newPage({ viewport:{width:450,height:800} })
p.on('pageerror', e=>console.log('PAGEERROR', e.message))
await p.goto('http://127.0.0.1:4173/?qa=1&tier=B', {waitUntil:'networkidle'})
await p.waitForTimeout(2500)
await p.waitForFunction(()=>!!window.__nexusQA)
await p.evaluate(()=>window.__nexusQA.start('full'))
await p.waitForTimeout(800)
for (const t of [40,42,44,46,48]) {
  await p.evaluate(tt=>window.__nexusQA.seek(tt), t)
  await p.waitForTimeout(400)
  const s = await p.evaluate(()=>{ const S=window.__nexusQA.state()
    return { sub:S.sub.map(v=>+v.toFixed(2)), flare:S.flare.map(v=>+v.toFixed(2)),
             packet:+S.packet.toFixed(2), gain:+S.packetGain.toFixed(2),
             confirm:+S.confirm.toFixed(2), pulse:+S.pulse.toFixed(2),
             bloom:+S.bloom.toFixed(2), ign:+S.ignition.toFixed(2), sys:+S.systems.toFixed(2) } })
  console.log(t, JSON.stringify(s))
}
await b.close()
