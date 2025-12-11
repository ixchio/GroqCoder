import { test, expect } from '@playwright/test';

/**
 * Homepage and Navigation Tests
 */
test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading or logo
    await expect(page.locator('h1')).toContainText('Groq Coder');
  });

  test('should have working navigation tabs', async ({ page }) => {
    await page.goto('/');
    
    // Check that Chat and Preview tabs exist
    const chatTab = page.getByRole('button', { name: /chat/i });
    const previewTab = page.getByRole('button', { name: /preview/i });
    
    await expect(chatTab).toBeVisible();
    await expect(previewTab).toBeVisible();
    
    // Click Preview tab
    await previewTab.click();
    
    // Click Chat tab
    await chatTab.click();
  });

  test('should have a prompt input textarea', async ({ page }) => {
    await page.goto('/');
    
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    
    // Check placeholder text
    await expect(textarea).toHaveAttribute('placeholder', /ask groq coder/i);
  });
});

test.describe('Gallery', () => {
  test('should load the gallery page', async ({ page }) => {
    await page.goto('/gallery');
    
    // Check for gallery title
    await expect(page.locator('h1')).toContainText(/gallery|community/i);
  });
});

test.describe('Settings', () => {
  test('should open settings modal', async ({ page }) => {
    await page.goto('/');
    
    // Find and click the Settings button
    const settingsButton = page.getByRole('button', { name: /settings/i });
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Check for model selection
      await expect(page.getByText(/choose a model/i)).toBeVisible();
    }
  });
});

test.describe('Download Button', () => {
  test('should have download button in header', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for download button
    const downloadButton = page.getByRole('button', { name: /download/i });
    await expect(downloadButton).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Logo should still be visible
    await expect(page.locator('img[alt*="Groq Coder"]')).toBeVisible();
  });
});
