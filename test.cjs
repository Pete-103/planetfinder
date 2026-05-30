const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  
  await page.goto('http://localhost:4173');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking 2D button');
  await page.evaluate(() => {
     const btns = document.querySelectorAll('.view-btn');
     if(btns.length > 1) btns[1].click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  console.log('Clicking 3D Solar System button');
  await page.evaluate(() => {
     const btns = document.querySelectorAll('.view-btn');
     if(btns.length > 2) btns[2].click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
