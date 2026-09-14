import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.env.SHOOT_PORT || '5176'
const BASE = `http://localhost:${PORT}`
const OUT = 'C:/Bebetterone/Code/Vue/blog-vue-ts/.shots'
mkdirSync(OUT, { recursive: true })

const pages = [
  ['home', '/'],
  ['article', '/article'],
  ['about', '/about'],
  ['login', '/about/login'],
  ['register', '/about/register'],
  ['search', '/search?q=vue'],
]

const viewports = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]

const themes = ['light', 'dark']

const browser = await chromium.launch()
try {
  for (const [vpName, viewport] of viewports) {
    for (const theme of themes) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 })
      const page = await ctx.newPage()
      // set theme before app boots
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t)
          document.documentElement.setAttribute('data-theme', t)
        } catch {
          /* theme will fall back to default */
        }
      }, theme)
      for (const [name, path] of pages) {
        const url = BASE + path
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
        } catch (e) {
          console.log(`WARN goto ${url}: ${e.message}`)
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
        }
        await page.waitForTimeout(700)
        // ensure theme applied
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
        await page.waitForTimeout(200)
        const file = `${OUT}/${name}-${vpName}-${theme}.png`
        await page.screenshot({ path: file, fullPage: true })
        console.log(`SHOT ${file}`)
      }
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}
console.log('DONE')
