import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  if (html.includes('Username atau Email')) {
    console.log("On login page. Typing credentials...");
    await page.type('input[placeholder="Username atau Email"]', 'admin');
    await page.type('input[placeholder="Password"]', '123');
    await page.click('button[type="submit"]');
    
    console.log("Waiting 5s...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Taking post-login screenshot...");
    await page.screenshot({ path: '/home/kkskr/.gemini/antigravity/brain/e617bae8-9490-4970-bf64-57b2524978c0/scratch/post_login.png' });
    
    const html2 = await page.content();
    console.log("Post login HTML length:", html2.length);
  } else {
    console.log("Not on login page?");
  }
  await browser.close();
})();
