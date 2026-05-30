const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const path = require("path");

const files = [
  ["01-marketplace.html", 1280, 1400],
  ["02-project-detail.html", 1280, 1700],
  ["03-pledge.html", 1100, 1000],
  ["04-org.html", 1280, 1300],
  ["05-playbooks.html", 1280, 1500],
];

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  for (const [file, width, height] of files) {
    const page = await ctx.newPage();
    await page.setViewportSize({ width, height });
    const url = "file://" + path.resolve(__dirname, file);
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(200);
    const out = path.resolve(__dirname, file.replace(/\.html$/, ".png"));
    await page.screenshot({ path: out, fullPage: false });
    console.log("rendered", out);
    await page.close();
  }
  await browser.close();
})();
