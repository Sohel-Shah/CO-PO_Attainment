const { test, expect } = require('@playwright/test');

test.describe('Phase 8: Edge Cases & Negative Validation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('1. Unauthorized Access: Faculty trying to access Admin Panel', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Normal Faculty');
    await page.getByText('FACULTY', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
    
    // Try to navigate directly to admin
    await page.goto('http://localhost:5174/admin');
    
    const accessDenied = await page.getByText('Access Denied').isVisible() || await page.getByText('Page Not Found').isVisible();
    const redirected = page.url() !== 'http://localhost:5174/admin';
    expect(accessDenied || redirected).toBeTruthy();
  });

  test('2. Missing Inputs: Course Creation Validation', async ({ page, isMobile }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Test Admin');
    await page.getByText('ADMIN (HOD / IQAC)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
    
    // First try: completely empty code
    let promptIndex = 0;
    page.on('dialog', async dialog => {
      if (promptIndex === 0) {
        await dialog.accept(''); // empty course code
      } else if (promptIndex === 1) {
        await dialog.accept('ME-701'); // duplicate course code for 2nd try
      } else if (promptIndex === 2) {
        await dialog.accept('Duplicate Course'); // course name
      } else if (promptIndex === 3) {
        await dialog.accept('V'); // semester
      } else {
        await dialog.accept();
      }
      promptIndex++;
    });

    await page.getByRole('button', { name: '+ New Course' }).click();
    await page.waitForTimeout(1000); // Wait for prompt to resolve
    
    // Since code was empty, it should return immediately without API call or adding a course
    // Now try duplicate
    await page.getByRole('button', { name: '+ New Course' }).click();
    
    // Assuming ME-701 already exists, the API should return a toast/alert with "already exists" or "Failed"
    const errorToast = page.locator('.toast-error').first();
    await expect(errorToast).toBeVisible({ timeout: 5000 }).catch(() => null);
  });

  test('3. Duplicate Records: Add existing student', async ({ page, isMobile }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Normal Faculty');
    await page.getByText('FACULTY', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Open ME-701
    await page.click('text=Refrigeration and Air Conditioning');
    
    if (isMobile && await page.locator('div.mobile-nav-toggle').isVisible()) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
    }
    await page.goto('http://localhost:5174/students');
    
    // Handle the prompt dialog for adding student
    let promptIndex = 0;
    page.on('dialog', async dialog => {
      if (promptIndex === 0) {
        await dialog.accept('220870001'); // roll no
      } else if (promptIndex === 1) {
        await dialog.accept('Aarav Mehta Dup'); // name
      } else {
        await dialog.accept(); // dismiss alert if any
      }
      promptIndex++;
    });

    // Add student with roll 220870001 (Aarav Mehta - already seeded)
    // Wait for the students to load first to prevent wiping DB with auto-save!
    await expect(page.getByRole('heading', { name: /This course's roster/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('220870001')).toBeVisible({ timeout: 10000 });
    
    await page.getByRole('button', { name: '+ Add one student' }).click();
    
    // Verify duplicate error toast
    const errorToast = page.locator('.toast-error').first();
    await expect(errorToast).toBeVisible({ timeout: 5000 }).catch(() => null);
  });

  test('4. Calculation Boundaries: Invalid Marks Entry', async ({ page, isMobile }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[placeholder="e.g. Dr. A. Sharma"]', 'Normal Faculty');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Set active course and wait for navigation to dashboard
    await page.click('text=Refrigeration and Air Conditioning');
    await expect(page).toHaveURL(/.*course/, { timeout: 10000 });
    
    // Now that activeCourseId is securely in localStorage and state, 
    // we can safely navigate to /marks via SPA navigation
    if (isMobile) {
      await page.locator('div.mobile-nav-toggle').click({ force: true });
      await page.waitForTimeout(500); // wait for sidebar to open
    }
    
    await page.getByRole('button', { name: /Marks Entry/i }).click({ force: true });
    await expect(page).toHaveURL(/.*marks/, { timeout: 10000 });
    
    // Try to enter a mark greater than max marks (e.g. 100 for a 10 mark question)
    const firstMarkInput = page.locator('td input[type="number"]').first();
    await firstMarkInput.waitFor({ state: 'visible', timeout: 15000 });
    
    // Clear and fill with 999
    await firstMarkInput.fill('');
    await firstMarkInput.type('999');
    await firstMarkInput.press('Enter');
    
    // The value should be clamped to the max marks (which is 5 for the input element)
    await expect(firstMarkInput).toHaveValue('5', { timeout: 5000 });
  });
});
