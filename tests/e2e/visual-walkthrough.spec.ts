import { test, expect, Page } from '@playwright/test';

// CREDENTIALS
const TEST_EMAIL = 'dageve5732@crsay.com';
const TEST_PASSWORD = 'password123';

const SCREENSHOT_DIR = './test-results/screenshots/walkthrough';

async function screenshot(page: Page, name: string) {
    // Wait a bit before every screenshot to ensure settling
    await page.waitForTimeout(2000);
    await page.screenshot({
        path: `${SCREENSHOT_DIR}/${name}.png`,
        fullPage: true
    });
    console.log(`📸 Saved: ${name}.png`);
}

test.describe('Admin Visual Walkthrough', () => {

    test('Navigate and capture all major pages', async ({ page }) => {
        test.setTimeout(300000); // 5 mins

        // 1. Login
        await page.goto('/auth/sign-in');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
        console.log('✅ Logged in');

        // 2. Dashboard
        await page.waitForLoadState('networkidle');
        await screenshot(page, '01_dashboard');

        // 3. Schedule
        await page.goto('/dashboard/schedule');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '02_schedule');

        // 4. Jobs
        await page.goto('/dashboard/jobs');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '03_jobs_list');

        // 5. New Job Form
        await page.goto('/dashboard/jobs/new');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '04_new_job');

        // 6. Workers
        await page.goto('/dashboard/workers');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '05_workers_list');

        // 7. New Worker Form
        await page.goto('/dashboard/workers/new');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '06_new_worker');

        // 8. Settings - General/Profile
        await page.goto('/dashboard/settings');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '07_settings_main');

        // 9. Settings - Users
        await page.goto('/dashboard/settings/users');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '08_settings_users');

        // 10. Settings - Services
        await page.goto('/dashboard/settings/services');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '09_settings_services');

        console.log('✨ Walkthrough Complete');
    });
});
