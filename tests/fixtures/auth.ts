import { test as base, expect, Page } from '@playwright/test';
import { TEST_USER } from '../../playwright.config';

/**
 * Authentication fixture for Playwright tests
 * Provides an authenticated page context for tests that require login
 */

// Extend the base test with an authenticated page
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
        // Navigate to login page
        await page.goto('/auth/sign-in');

        // Fill in credentials
        await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
        await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);

        // Click sign in button
        await page.click('button[type="submit"]');

        // Wait for navigation to dashboard
        await page.waitForURL('**/dashboard**', { timeout: 10000 });

        // Use the authenticated page in tests
        await use(page);
    },
});

export { expect, TEST_USER };

/**
 * Helper function to login programmatically
 */
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

/**
 * Helper function to logout
 */
export async function logout(page: Page) {
    // Click user menu and logout
    await page.click('[data-testid="user-menu"], .user-menu-trigger');
    await page.click('text=Sign out, text=Logout, [data-testid="logout"]');
    await page.waitForURL('**/auth/**');
}
