// Spike (task 1): do native <dialog>, popover and `inert` work in phone browsers?
// Runs Playwright's own Chromium (Android Chrome) and WebKit (iOS Safari engine) with phone emulation.
// Real devices were not available — WebKit here is the same engine as iOS Safari, but not the iOS build.
import { chromium, webkit, devices } from 'playwright'

const html = `<meta name="viewport" content="width=device-width">
<button id="under">under</button>
<dialog id="dlg"><form method="dialog"><button id="ok" value="ok">OK</button></form></dialog>
<button id="pbtn" popovertarget="pop">tip</button><div id="pop" popover>tooltip</div>
<div id="inertBox" inert><button id="inertBtn">x</button></div>`

async function run(browserType, device) {
  const browser = await browserType.launch()
  const page = await (await browser.newContext({ ...devices[device] })).newPage()
  await page.setContent(html)
  const r = {}
  r.dialogApi = await page.evaluate(() => typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype)
  await page.evaluate(() => { window.clicks = 0; under.onclick = () => window.clicks++; dlg.showModal() })
  r.modalOpen = await page.evaluate(() => dlg.open && dlg.matches(':modal'))
  await page.mouse.click(5, 5) // try to click the page behind the modal
  r.behindBlocked = (await page.evaluate(() => window.clicks)) === 0
  await page.keyboard.press('Escape')
  r.escCloses = await page.evaluate(() => !dlg.open)
  await page.evaluate(() => dlg.showModal()); await page.click('#ok')
  r.formReturn = await page.evaluate(() => !dlg.open && dlg.returnValue === 'ok')
  r.popoverApi = await page.evaluate(() => 'showPopover' in HTMLElement.prototype)
  await page.click('#pbtn')
  r.popoverOpens = await page.evaluate(() => pop.matches(':popover-open'))
  await page.mouse.click(300, 600) // tap outside = light dismiss
  r.popoverLightDismiss = await page.evaluate(() => !pop.matches(':popover-open'))
  r.inertApi = await page.evaluate(() => 'inert' in HTMLElement.prototype)
  r.inertBlocksFocus = await page.evaluate(() => { inertBtn.focus(); return document.activeElement !== inertBtn })
  await browser.close()
  return r
}

console.log('Chromium (Pixel 7):', await run(chromium, 'Pixel 7'))
console.log('WebKit (iPhone 15):', await run(webkit, 'iPhone 15'))
