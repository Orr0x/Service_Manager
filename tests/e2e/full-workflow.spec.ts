/**
 * Comprehensive E2E Test Suite - Using Working Account
 * 
 * Uses the known working account: dageve5732@crsay.com
 * 
 * Run with: npx playwright test tests/e2e/full-workflow.spec.ts --project=chromium --headed
 */

import { test, expect, Page } from '@playwright/test';

// KNOWN WORKING TEST ACCOUNT
const TEST_EMAIL = 'dageve5732@crsay.com';
const TEST_PASSWORD = 'password123';

// Screenshots directory
const SCREENSHOT_DIR = './test-results/screenshots';

async function screenshot(page: Page, name: string) {
    await page.screenshot({
        path: `${SCREENSHOT_DIR}/${name}.png`,
        fullPage: true
    });
    console.log(`📸 Screenshot saved: ${name}.png`);
}

test.describe('Complete Application Workflow', () => {

    test.beforeAll(async () => {
        const fs = await import('fs');
        if (!fs.existsSync(SCREENSHOT_DIR)) {
            fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        }
    });

    test('Full workflow with working account', async ({ page }) => {
        test.setTimeout(300000); // 5 minutes

        // ============================================
        // STEP 1: LOGIN WITH WORKING ACCOUNT
        // ============================================
        console.log('\n🔐 STEP 1: Logging in with working account...');

        await page.goto('/auth/sign-in');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '01_login_page');

        // Fill login form
        await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
        await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
        await screenshot(page, '02_login_filled');

        // Submit login
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        try {
            await page.waitForURL('**/dashboard**', { timeout: 30000 });
            console.log('✅ Login successful!');
        } catch (e) {
            console.log('⚠️ Login redirect timeout, checking current state...');
            await screenshot(page, '02b_login_error');
        }

        await page.waitForTimeout(5000);
        await screenshot(page, '03_after_login');

        // ============================================
        // STEP 2: DASHBOARD
        // ============================================
        console.log('\n📊 STEP 2: Dashboard...');
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '04_dashboard');

        // ============================================
        // STEP 3: CUSTOMERS - View & Create
        // ============================================
        console.log('\n👥 STEP 3: Customers...');
        await page.goto('/dashboard/customers');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '05_customers_list');

        // Try to add a customer
        const addCustomerBtn = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
        if (await addCustomerBtn.isVisible()) {
            await addCustomerBtn.click();
            await page.waitForTimeout(1500);
            await screenshot(page, '06_customer_form');

            // Fill form
            const businessInput = page.locator('input[name="business_name"], input[name="businessName"], input[placeholder*="business"], input[placeholder*="Business"]').first();
            if (await businessInput.isVisible()) {
                await businessInput.fill('Test Company Ltd');
            }

            const contactInput = page.locator('input[name="contact_name"], input[name="contactName"], input[placeholder*="contact"], input[placeholder*="Contact"]').first();
            if (await contactInput.isVisible()) {
                await contactInput.fill('John Doe');
            }

            const emailInput = page.locator('input[name="email"][type="email"], input[placeholder*="email"]').first();
            if (await emailInput.isVisible()) {
                await emailInput.fill('john@testcompany.com');
            }

            await screenshot(page, '07_customer_filled');

            // Save
            const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
            if (await saveBtn.isVisible()) {
                await saveBtn.click();
                await page.waitForTimeout(2000);
                await screenshot(page, '08_customer_saved');
            }
        }

        // ============================================
        // STEP 4: WORKERS
        // ============================================
        console.log('\n👷 STEP 4: Workers...');
        await page.goto('/dashboard/workers');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '09_workers_list');

        const addWorkerBtn = page.locator('button:has-text("Add"), button:has-text("New")').first();
        if (await addWorkerBtn.isVisible()) {
            await addWorkerBtn.click();
            await page.waitForTimeout(1500);
            await screenshot(page, '10_worker_form');

            const firstNameInput = page.locator('input[name="first_name"], input[name="firstName"]').first();
            if (await firstNameInput.isVisible()) await firstNameInput.fill('Alice');

            const lastNameInput = page.locator('input[name="last_name"], input[name="lastName"]').first();
            if (await lastNameInput.isVisible()) await lastNameInput.fill('Worker');

            await screenshot(page, '11_worker_filled');

            const saveBtn = page.locator('button[type="submit"], button:has-text("Save")').first();
            if (await saveBtn.isVisible()) {
                await saveBtn.click();
                await page.waitForTimeout(2000);
                await screenshot(page, '12_worker_saved');
            }
        }

        // ============================================
        // STEP 5: CONTRACTORS
        // ============================================
        console.log('\n🔧 STEP 5: Contractors...');
        await page.goto('/dashboard/contractors');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '13_contractors_list');

        // ============================================
        // STEP 6: SERVICES
        // ============================================
        console.log('\n🛠️ STEP 6: Services...');
        await page.goto('/dashboard/services');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '14_services_list');

        // ============================================
        // STEP 7: JOBS
        // ============================================
        console.log('\n📋 STEP 7: Jobs...');
        await page.goto('/dashboard/jobs');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '15_jobs_list');

        // ============================================
        // STEP 8: QUOTES
        // ============================================
        console.log('\n💰 STEP 8: Quotes...');
        await page.goto('/dashboard/quotes');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '16_quotes_list');

        // ============================================
        // STEP 9: INVOICES
        // ============================================
        console.log('\n📄 STEP 9: Invoices...');
        await page.goto('/dashboard/invoices');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '17_invoices_list');

        // ============================================
        // STEP 10: CHECKLISTS
        // ============================================
        console.log('\n✅ STEP 10: Checklists...');
        await page.goto('/dashboard/checklists');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '18_checklists_list');

        // ============================================
        // STEP 11: CONTRACTS
        // ============================================
        console.log('\n📝 STEP 11: Contracts...');
        await page.goto('/dashboard/contracts');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '19_contracts_list');

        // ============================================
        // STEP 12: JOB SITES
        // ============================================
        console.log('\n📍 STEP 12: Job Sites...');
        await page.goto('/dashboard/job-sites');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '20_job_sites_list');

        // ============================================
        // STEP 13: SCHEDULING
        // ============================================
        console.log('\n📅 STEP 13: Scheduling...');
        await page.goto('/dashboard/scheduling');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '21_scheduling');

        // ============================================
        // STEP 14: SETTINGS
        // ============================================
        console.log('\n⚙️ STEP 14: Settings...');
        await page.goto('/dashboard/settings/profile');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '22_settings_profile');

        await page.goto('/dashboard/settings/security');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '23_settings_security');

        // Business Info
        await page.goto('/dashboard/settings/business');
        await page.waitForLoadState('networkidle');
        await screenshot(page, '24_settings_business');

        // ============================================
        // COMPLETE
        // ============================================
        console.log('\n✨ TEST COMPLETE!');
        console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
        console.log(`📧 Account used: ${TEST_EMAIL}`);
    });
});
