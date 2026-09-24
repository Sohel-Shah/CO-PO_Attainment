const { test, expect } = require('@playwright/test');

test.describe('Phase 3: Student Management & Attendance', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Navigate to Student Roster and Bulk Add Students', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    // Wait for course page to fully load
    await expect(page.getByRole('heading', { name: 'Course & CO-PO Setup' })).toBeVisible({ timeout: 10000 });

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Student Roster' }).click();
    await expect(page.locator('h1', { hasText: 'Student Roster' })).toBeVisible({ timeout: 10000 });

    const textareas = await page.locator('textarea').all();
    await textareas[0].fill('2026TEST01, Automation Student 1\n2026TEST02, Automation Student 2');

    await page.getByRole('button', { name: 'Add students' }).click();

    await expect(page.getByText('2026TEST01').first()).toBeVisible();
    await expect(page.getByText('Automation Student 2').first()).toBeVisible();

    await page.waitForTimeout(3000);
  });

  test('Master Roster semester demotion on remove', async ({ page }) => {
    const courseRow = page.locator('tr').filter({ hasText: 'Automated Test Course' }).first();
    await courseRow.waitFor({ state: 'visible', timeout: 10000 });
    await courseRow.click();

    if (await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.locator('nav button').filter({ hasText: 'Student Roster' }).click();

    // Add a student to Master Roster at Semester 1
    const masterTextarea = page.locator('textarea').nth(1);
    await masterTextarea.fill('2026SEM01, Semester Demotable Student');
    await page.getByRole('button', { name: 'Add to Master Roster' }).click();

    // Verify student is in Semester 1
    const studentRow = page.locator('tr').filter({ hasText: '2026SEM01' }).first();
    await expect(studentRow).toBeVisible({ timeout: 5000 });

    // Promote Semester 1 -> 2
    await page.getByRole('button', { name: 'Promote →' }).click();
    await expect(studentRow.locator('td').nth(2)).toHaveText('2');

    // Now click Remove (×) on this student row
    await studentRow.locator('button', { hasText: '×' }).click();

    // Verify student was moved back to Semester 1 instead of being deleted!
    await expect(studentRow).toBeVisible();
    await expect(studentRow.locator('td').nth(2)).toHaveText('1');
  });
});
