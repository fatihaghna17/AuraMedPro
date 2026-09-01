import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  await page.goto('http://localhost:3000');
  await page.waitForSelector('input[type="email"]');
  
  console.log("Found email input. Logging in...");
  
  await page.type('input[type="email"]', 'admin');
  await page.type('input[type="password"]', '123');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  console.log("Clicked login. Waiting for 5 seconds to see logs...");
  
  await new Promise(r => setTimeout(r, 5000));
  
  const currentUrl = page.url();
  console.log("Current URL after 5s:", currentUrl);
  
  await browser.close();
})();
