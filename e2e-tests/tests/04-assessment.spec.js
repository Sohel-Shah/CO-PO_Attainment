const { test, expect } = require('@playwright/test');

test.describe('Phase 4: Assessment & Question Papers', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Create an Exam', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for the course page to fully load before attempting nav click
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Question Papers' }).click();
    await expect(page.locator('h1', { hasText: 'Question Papers' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'T1' }).click();
    await page.getByRole('button', { name: '+ Add Main Question' }).click();
    
    await expect(page.locator('h2', { hasText: 'T1 — TA-1' })).toBeVisible();
    await page.waitForTimeout(2000);
  });
});
