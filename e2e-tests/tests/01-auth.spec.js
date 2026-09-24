const { test, expect } = require('@playwright/test');

test.describe('Phase 1: Authentication & Admin Panel', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login as Faculty', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await expect(page).toHaveURL(/.*login/);
    
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Faculty');
    await page.getByText('FACULTY', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
    }
    await expect(page.getByText('Test Faculty').first()).toBeVisible();
    await expect(page.getByText('faculty', { exact: true }).first()).toBeVisible();
  });

  test('Login as Admin and verify Admin Panel', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
    }
    
    await expect(page.getByText('Test Admin').first()).toBeVisible();
    await expect(page.getByText('admin', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('All Courses').first()).toBeVisible();
  });

  test('Logout flow', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Logout');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
    
    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500); // Wait for sidebar animation
    }
    const switchBtn = page.getByRole('button', { name: 'Switch user' });
    await switchBtn.waitFor({ state: 'visible', timeout: 10000 });
    // Use JS click to bypass viewport constraint on mobile
    await switchBtn.evaluate(el => el.click());
    
    // Accept the new confirm modal
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    await expect(page).toHaveURL(/.*login/);
  });
});
