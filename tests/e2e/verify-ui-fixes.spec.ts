import { test, expect } from '@playwright/test';

// Reuse the working account
const TEST_EMAIL = 'dageve5732@crsay.com';
const TEST_PASSWORD = 'password123';

test.describe('Verify UI Fixes', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/auth/sign-in');
        await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
        await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**');
    });

    test('Contractor Edit Page should load without error', async ({ page }) => {
        // Go to contractors list
        await page.goto('/dashboard/contractors');
        await page.waitForLoadState('networkidle');

        // Click first Edit button (or View then Edit)
        // The list item View button goes to detail: /dashboard/contractors/[id]
        // Let's find a View button
        const viewBtn = page.locator('a:has-text("View")').first();
        if (await viewBtn.isVisible()) {
            await viewBtn.click();
            await page.waitForURL('**/dashboard/contractors/**');

            // Now click Edit on the detail page
            const editBtn = page.locator('a:has-text("Edit")').first();
            await editBtn.click();

            // Should verify we are on edit page and NO server error
            await page.waitForURL('**/edit');
            await expect(page.locator('h2:has-text("Edit Contractor")')).toBeVisible();
        } else {
            console.log('No contractors found to test edit page');
        }
    });

    test('Checklist Edit Page should exist and load', async ({ page }) => {
        await page.goto('/dashboard/checklists');
        await page.waitForLoadState('networkidle');

        // Click first available View or Title to go to detail
        // Assuming list items have link to detail
        const itemLink = page.locator('a:has-text("View")').first();
        if (await itemLink.isVisible()) {
            await itemLink.click();
            await page.waitForURL('**/dashboard/checklists/**');

            // Find Edit button
            const editBtn = page.locator('a:has-text("Edit")').first();
            await expect(editBtn).toBeVisible();
            await editBtn.click();

            // Verify navigation to Edit page
            await page.waitForURL('**/edit');
            await expect(page.locator('h2:has-text("Edit Checklist")')).toBeVisible();
            await expect(page.locator('input[name="items[0].text"]')).toBeVisible(); // Check logic
        }
    });

    test('Service Edit Page should be accessible via Link', async ({ page }) => {
        await page.goto('/dashboard/services');
        await page.waitForLoadState('networkidle');

        const viewBtn = page.locator('a:has-text("View")').first();
        if (await viewBtn.isVisible()) {
            await viewBtn.click();
            await page.waitForURL('**/dashboard/services/**');

            const editBtn = page.locator('a:has-text("Edit")').first();
            await expect(editBtn).toBeVisible();
            // Verify it's a link
            await expect(editBtn).toHaveAttribute('href', /.*\/edit/);

            await editBtn.click();
            await page.waitForURL('**/edit');
            await expect(page.locator('input[name="name"]')).toBeVisible(); // Assuming form field
        }
    });

    test('Invoice Download PDF button should be present', async ({ page }) => {
        await page.goto('/dashboard/invoices');
        await page.waitForLoadState('networkidle');

        const viewBtn = page.locator('a:has-text("View")').first();
        if (await viewBtn.isVisible()) {
            await viewBtn.click();
            await page.waitForURL('**/dashboard/invoices/**');

            const downloadBtn = page.locator('button:has-text("Download PDF")');
            await expect(downloadBtn).toBeVisible();
            await expect(downloadBtn).toBeEnabled();
            // Checking actual print dialog is hard, but click shouldn't crash
            await downloadBtn.click();
        }
    });

});
