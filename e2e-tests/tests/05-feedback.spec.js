const { test, expect } = require('@playwright/test');

test.describe('Phase 5: Feedback & Reports', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Generate IQAC Report', async ({ page }) => {
    // Navigate to course
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for course page to fully load before nav
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    // Go to Final Report
    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Final Report (IQAC)' }).click();
    
    // Check if the report renders (it usually has the course code or name)
    await expect(page.getByText('COURSE OUTCOME & PROGRAM OUTCOME ATTAINMENT DOSSIER').first()).toBeVisible();
    await expect(page.getByText('Automated Test Course').first()).toBeVisible();
  });
});
