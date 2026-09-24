const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\156c584e-50f4-4404-ba83-4bf917a65b84';
  
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:5174/login');
  
  // Login as Faculty
  await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Dr. A. Sharma');
  await page.getByText('FACULTY', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(2000);
  
  console.log('Capturing All Courses screenshot...');
  await page.screenshot({ path: path.join(artifactDir, '01_all_courses.png') });
  
  // Open the demo course (ME-701)
  await page.click('text=Refrigeration and Air Conditioning');
  await page.waitForTimeout(2000);
  
  console.log('Capturing Dashboard screenshot...');
  await page.screenshot({ path: path.join(artifactDir, '02_dashboard.png') });
  
  // Go to students
  await page.click('text=Student Roster');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, '03_students.png') });

  // Go to Marks
  await page.click('text=Marks Entry');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, '04_marks.png') });

  // Go to Report
  await page.click('text=Final Report (IQAC)');
  await page.waitForTimeout(3000);
  console.log('Capturing Final Report screenshot...');
  await page.screenshot({ path: path.join(artifactDir, '05_final_report.png'), fullPage: true });

  await browser.close();
  console.log('Evidence captured successfully!');
})();
