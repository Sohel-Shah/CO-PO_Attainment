const { test, expect } = require('@playwright/test');

test.describe('Phase 3 Tests (Papers, Marks Entry, Feedback)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Marks Entry', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for course page to fully load before nav
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Marks Entry' }).click();
    await expect(page.locator('h1', { hasText: 'Marks Entry' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'T1' }).click();
    await page.waitForTimeout(1000);
  });

  test('Course Exit Feedback', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for course page to fully load before nav
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Course Exit Feedback' }).click();
    await expect(page.locator('h1', { hasText: 'Course Exit Feedback' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '+ Add response' }).first().click();
    await page.waitForTimeout(1000);
  });
});
