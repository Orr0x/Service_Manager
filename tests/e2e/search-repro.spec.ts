import { test, expect } from '@playwright/test';
import searchTerms from '../fixtures/search-terms.json';

test.describe('Search Functionality Reproduction', () => {
    // Use existing auth state
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('should search Job Sites by Name', async ({ page }) => {
        // Navigate to job sites
        await page.goto('/dashboard/job-sites');
        await page.waitForLoadState('networkidle');

        // Search by City (if available) or Name
        const searchTerm = searchTerms.jobSiteCity || searchTerms.jobSiteName || 'Stanton';
        console.log(`Searching Job Sites for: ${searchTerm}`);

        await page.getByPlaceholder('Search job sites by name, address, or customer...').fill(searchTerm);
        await page.waitForTimeout(2000); // Wait for debounce and search

        // Expect at least one row or card to be visible
        // Adjust selector based on actual UI (assuming table rows or cards)
        const rows = page.locator('table tbody tr');
        const cards = page.locator('.grid > div'); // Fallback for card view

        await expect(rows.or(cards).first()).toBeVisible();
        await page.screenshot({ path: 'test-results/search-jobsite-name.png' });
    });

    test('should search Job Sites by Address', async ({ page }) => {
        if (!searchTerms.jobSiteAddress) test.skip(true, 'No address found to test');

        await page.goto('/dashboard/job-sites');
        await page.waitForLoadState('networkidle');

        const searchTerm = searchTerms.jobSiteAddress;
        console.log(`Searching Job Sites for Address: ${searchTerm}`);

        await page.getByPlaceholder('Search job sites by name, address, or customer...').fill(searchTerm);
        await page.waitForTimeout(2000);

        await expect(page.locator('body')).toContainText(searchTerm);
        await page.screenshot({ path: 'test-results/search-jobsite-address.png' });
    });

    test('should search Contracts', async ({ page }) => {
        if (!searchTerms.contractName) test.skip(true, 'No contract found to test');

        await page.goto('/dashboard/contracts');
        await page.waitForLoadState('networkidle');

        const searchTerm = searchTerms.contractName;
        console.log(`Searching Contracts for: ${searchTerm}`);

        await page.getByPlaceholder('Search contracts by name, customer, or type...').fill(searchTerm);
        await page.waitForTimeout(2000);

        await expect(page.locator('body')).toContainText(searchTerm);
        await page.screenshot({ path: 'test-results/search-contracts.png' });
    });

    test('should search Quotes with Numbers', async ({ page }) => {
        if (!searchTerms.quoteNumber) test.skip(true, 'No quote found to test');

        await page.goto('/dashboard/quotes');
        await page.waitForLoadState('networkidle');

        const searchTerm = String(searchTerms.quoteNumber);
        console.log(`Searching Quotes for Number: ${searchTerm}`);

        await page.getByPlaceholder('Search quotes by title, customer, or status...').fill(searchTerm);
        await page.waitForTimeout(2000);

        // QuoteList uses ul/li, not table
        await expect(page.getByRole('listitem').first()).toBeVisible();
        // Since Quote Number is not displayed, we verify the Title is visible
        if (searchTerms.quoteTitle) {
            await expect(page.locator('body')).toContainText(searchTerms.quoteTitle);
        } else {
            // Fallback if title not available (should not happen with updated script)
            await expect(page.getByRole('listitem').first()).toBeVisible();
        }
        await page.screenshot({ path: 'test-results/search-quotes-number.png' });
    });

    test('should search Jobs', async ({ page }) => {
        if (!searchTerms.jobTitle) test.skip(true, 'No job found to test');

        await page.goto('/dashboard/jobs');
        await page.waitForLoadState('networkidle');

        const searchTerm = searchTerms.jobTitle;
        console.log(`Searching Jobs for: ${searchTerm}`);

        await page.getByPlaceholder('Search jobs by title or description...').fill(searchTerm);
        await page.waitForTimeout(2000);

        await expect(page.locator('body')).toContainText(searchTerm);
        await page.screenshot({ path: 'test-results/search-jobs-text.png' });
    });

    test('should search Workers', async ({ page }) => {
        if (!searchTerms.workerName) test.skip(true, 'No worker found to test');

        await page.goto('/dashboard/workers');
        await page.waitForLoadState('networkidle');

        const searchTerm = searchTerms.workerName;
        console.log(`Searching Workers for: ${searchTerm}`);

        await page.getByPlaceholder('Search workers by name, role, or email...').fill(searchTerm);
        await page.waitForTimeout(2000);

        await expect(page.locator('body')).toContainText(searchTerm);
        await page.screenshot({ path: 'test-results/search-workers.png' });
    });
});
