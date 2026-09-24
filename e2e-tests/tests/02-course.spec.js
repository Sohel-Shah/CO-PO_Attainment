const { test, expect } = require('@playwright/test');

test.describe('Phase 2: Course & Academic Management', () => {
  let courseCode = `TEST-${Math.floor(Math.random() * 1000)}`;

  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Create a new course', async ({ page }) => {
    let promptCount = 0;
    page.on('dialog', async dialog => {
      const msg = dialog.message();
      if (msg.includes('Course Code')) {
        await dialog.accept(courseCode);
      } else if (msg.includes('Course Name')) {
        await dialog.accept('Automated Test Course');
      } else if (msg.includes('Semester')) {
        await dialog.accept('V');
      } else {
        await dialog.accept();
      }
    });

    await page.getByRole('button', { name: '+ New Course' }).click();

    await expect(page.getByText('Automated Test Course').first()).toBeVisible();
    await expect(page.getByText(courseCode).first()).toBeVisible();
  });

  test('Open course and verify Teaching Plan & CO-PO Setup', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Teaching Plan' }).click();
    await expect(page.locator('h1', { hasText: 'Theory Teaching Plan' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'CO-PO Attainment' }).click();
    await expect(page.locator('h2', { hasText: 'Course Outcomes' })).toBeVisible({ timeout: 10000 });
  });
});
