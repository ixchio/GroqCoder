import { test, expect } from '@playwright/test';

/**
 * Homepage and Landing Page Tests
 * Tests the public landing page at /
 */
test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    
    // Check for GroqCoder branding in the navbar
    await expect(page.locator('text=GroqCoder').first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that navigation links exist
    const githubLink = page.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
    
    // Check for Get Started or Dashboard button
    const ctaButton = page.locator('text=/Get Started|Dashboard/').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should display hero section content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for hero heading - contains "Imagination" or "Compiled"
    await expect(page.locator('text=/Imagination|Compiled/').first()).toBeVisible();
    
    // Check for Start Building CTA
    const startBuildingBtn = page.locator('text=/Start Building/').first();
    await expect(startBuildingBtn).toBeVisible();
  });

  test('should have AI-Powered badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for the AI-Powered badge
    await expect(page.locator('text=/AI-Powered/i').first()).toBeVisible();
  });
});

test.describe('Gallery Page', () => {
  test('should load the gallery page', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Auth Pages', () => {
  test('should load the register page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load the signin page', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Navbar should still be visible
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // GroqCoder branding should be visible
    await expect(page.locator('text=GroqCoder').first()).toBeVisible();
  });
});
