import { test as setup, expect } from '@playwright/test';
import { TEST_USER } from '../playwright.config';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Perform authentication steps. Replace these actions with your actual login steps.
    await page.goto('/auth/sign-in');

    // Fill login form
    await page.getByPlaceholder('Email address').fill(TEST_USER.email);
    await page.getByPlaceholder('Password').fill(TEST_USER.password);

    // Click login
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Cleaning Services Dashboard' })).toBeVisible({ timeout: 15000 });

    // End of authentication steps.
    await page.context().storageState({ path: authFile });
});
