const { test, expect } = require('@playwright/test');

test.describe('Phase 2 Tests (Syllabus, Plan, Pedagogy, References)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Update Syllabus Modules', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for course page to fully load before nav
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Syllabus' }).click();
    await expect(page.locator('h1', { hasText: 'Unit-wise Syllabus' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '+ Add unit' }).click();
    await expect(page.locator('textarea').first()).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('Update Teaching Plan', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for course page to fully load before nav
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Teaching Plan' }).click();
    await expect(page.locator('h1', { hasText: 'Theory Teaching Plan' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '+ Add lecture row' }).click();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('Update References', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for course page to fully load before nav
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'References' }).click();
    await expect(page.locator('h1', { hasText: 'Reading Resources' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '+ Add entry' }).first().click();
    await page.waitForTimeout(1000);
  });
});
