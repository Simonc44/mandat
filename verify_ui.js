import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to a common size
  await page.setViewportSize({ width: 1280, height: 1000 });

  // 1. Homepage & Search bar (rounded-full)
  console.log('Visiting Homepage...');
  await page.goto('http://localhost:8082');
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({ path: 'homepage.png' });

  // 2. Scrutins page (rounded-full elements)
  console.log('Visiting Scrutins...');
  await page.goto('http://localhost:8082/scrutins');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scrutins.png' });

  // 3. Dept 44 (Scroll check)
  console.log('Visiting Dept 44...');
  await page.goto('http://localhost:8082/deputes?dept=44');
  await page.waitForTimeout(3000);

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'dept44_bottom.png' });

  await browser.close();
})();
