import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/kkskr/.gemini/antigravity/brain/e617bae8-9490-4970-bf64-57b2524978c0/scratch/screenshot.png' });
  const html = await page.content();
  console.log(html.substring(0, 500));
  await browser.close();
})();
