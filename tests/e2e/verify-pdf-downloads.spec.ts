
import { test, expect } from '@playwright/test';
import { TEST_USER } from '../fixtures/auth';

test.describe('PDF Download Functionality', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('should have PDF download button on Customer Detail page', async ({ page }) => {
        // Go to first customer
        await page.goto('/dashboard/customers');
        await page.waitForTimeout(2000); // Wait for list to load
        const firstRowLink = page.locator('tbody tr:first-child a').first();
        // Navigate if possible, otherwise construct URL if we knew ID. 
        // Assuming list is clickable or has a View button.
        // Let's try to click the first row
        await firstRowLink.click();
        await expect(page.getByText('Download PDF')).toBeVisible();
    });

    test('should have PDF download button on Job Site Detail page', async ({ page }) => {
        await page.goto('/dashboard/job-sites');
        await page.waitForTimeout(2000);
        const firstRowLink = page.locator('tbody tr:first-child a').first();
        await firstRowLink.click();
        await expect(page.getByText('Download PDF')).toBeVisible();
    });

    test('should have PDF download button on Checklist Detail page', async ({ page }) => {
        await page.goto('/dashboard/checklists');
        await page.waitForTimeout(2000);
        // Determine how to get to detail. Usually clicking the name/row.
        const firstRowLink = page.locator('h3 a, tbody tr a').first();
        await firstRowLink.click();
        await expect(page.getByText('Download PDF')).toBeVisible();
    });

    test('should have PDF download button on Worker Detail page', async ({ page }) => {
        await page.goto('/dashboard/workers');
        await page.waitForTimeout(2000);
        const firstRowLink = page.locator('tbody tr:first-child a').first();
        await firstRowLink.click();
        await expect(page.getByText('Download PDF')).toBeVisible();
    });

    test('should have PDF download button on Contractor Detail page', async ({ page }) => {
        await page.goto('/dashboard/contractors');
        await page.waitForTimeout(2000);
        const firstRowLink = page.locator('tbody tr:first-child a').first();
        await firstRowLink.click();
        await expect(page.getByText('Download PDF')).toBeVisible();
    });

    test('should have PDF download button on Job Detail page', async ({ page }) => {
        await page.goto('/dashboard/jobs');
        await page.waitForTimeout(2000);
        const firstRowLink = page.locator('tbody tr:first-child a').first();
        await firstRowLink.click();
        await expect(page.getByText('Download PDF')).toBeVisible();
    });

    test('should have PDF download button on Service Detail page', async ({ page }) => {
        await page.goto('/dashboard/services');
        await page.waitForTimeout(2000);
        const firstRowLink = page.locator('tbody tr:first-child a').first();
        await firstRowLink.click();
        await expect(page.getByText('Download PDF')).toBeVisible();
    });

    test('should have PDF download button on Schedule page', async ({ page }) => {
        await page.goto('/dashboard/schedule');
        await page.waitForTimeout(2000); // Wait for stats/calendar
        // Check for the button. In schedule page we just labelled it "Download".
        // Wait, I labelled it "Download" in the code replacement above, but other pages say "Download PDF".
        // I should check for "Download".
        await expect(page.getByText('Download', { exact: true })).toBeVisible();
    });
});

