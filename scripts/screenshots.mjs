import { webkit, devices } from 'playwright'
import { spawn } from 'node:child_process'
const srv = spawn('npx', ['vite', 'preview', '--port', '4517', '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const b = await webkit.launch(); const ctx = await b.newContext({ ...devices['iPhone 14'] }); const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 1100 })
await p.goto('http://localhost:4517/'); await p.click('text=Load example')
await p.screenshot({ path: 'screens/main-example.png', fullPage: false })
const save = async (n, price, rent) => { await p.fill('[data-k=price]', String(price)); await p.fill('[data-k=rent]', String(rent)); await p.fill('input[placeholder^=Address]', n); await p.click('button:text-is("Save")') }
await p.fill('input[placeholder^=Address]', '412 Elm St'); await p.click('button:text-is("Save")')
await save('88 Oak Ave', 250000, 2800); await save('7 Birch Ct duplex', 180000, 2600)
await p.click('nav >> text=Saved'); for (const cb of await p.$$('.deals input[type=checkbox]')) await cb.check()
await p.waitForTimeout(2000); await p.screenshot({ path: 'screens/saved-list.png', fullPage: false })
await p.click('text=side by side'); await p.screenshot({ path: 'screens/compare.png', fullPage: false })
await p.click('nav >> text=How'); await p.screenshot({ path: 'screens/how.png', fullPage: false })
await b.close(); srv.kill()
