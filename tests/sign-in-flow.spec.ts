import { test, expect } from '@playwright/test';

test.describe('Sign In Flow Tests', () => {
  test('Successful Sign In', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('https://demo-saas.bugbug.io/sign-in');
    
    // Enter credentials
    await page.getByLabel('Email').fill('igor.lantushenko+11@gmail.com');
    await page.getByLabel('Password').fill('igor.lantushenko@gmail.com');
    
    // Click Sign In button using submit type
    await page.getByRole('group').getByRole('button', { name: 'Log in' }).click();
    
    // Verify successful login by checking onboarding URL
    await expect(page).toHaveURL(/.*onboarding/);
  });

  test('Failed Sign In - User Does Not Exist', async ({ page }) => {
    // Monitor network requests to find the correct URL
    page.on('request', request => {
      if (request.url().includes('sign-in')) {
        console.log('Sign-in request URL:', request.url());
        console.log('Request method:', request.method());
      }
    });

    // Set up API route mock for non-existent user
    await page.route('**/api/auth/sign-in/email**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 404,
            message: 'Invalid email or password',
            error: 'Not Found'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to sign in page
    await page.goto('https://demo-saas.bugbug.io/sign-in');
    
    // Enter credentials
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('anypassword');
    
    // Click Sign In button using submit type
    await page.getByRole('group').getByRole('button', { name: 'Log in' }).click();
    
    // Verify error message in the alert - allow time for the error to appear
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
  });

  test('Failed Sign In - Unconfirmed Account', async ({ page }) => {
    // Monitor network requests to find the correct URL
    page.on('request', request => {
      if (request.url().includes('sign-in')) {
        console.log('Sign-in request URL:', request.url());
        console.log('Request method:', request.method());
      }
    });

    // Set up API route mock for unconfirmed account
    await page.route('**/api1/auth/sign-in/email**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 403,
            message: 'Account email is not verified',
            error: 'Forbidden'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to sign in page
    await page.goto('https://demo-saas.bugbug.io/sign-in');
    
    // Enter credentials with mock data
    await page.getByLabel('Email').fill('unconfirmed@example.com');
    await page.getByLabel('Password').fill('testpassword');
    
    // Click Sign In button using submit type
    await page.getByRole('group').getByRole('button', { name: 'Log in' }).click();
    
    // Verify error message in the alert - allow time for the error to appear
    await expect(page.getByText('Account email is not verified')).toBeVisible({ timeout: 10000 });
  });
});