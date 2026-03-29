import { test, expect } from '@playwright/test';

// =========================================================
// ĐẶT THÔNG TIN TÀI KHOẢN TEST THẬT VÀO ĐÂY
const VALID_EMAIL = 'lamltde180684@fpt.edu.vn';    // <-- Thay thành email thật
const VALID_PASSWORD = '123456';       // <-- Thay thành mật khẩu thật
const WRONG_PASSWORD = 'SaiMatKhauNay!999';
// =========================================================

test.describe('Authentication Tests', () => {
  test('1 màn login: sai mật khẩu -> thiếu input -> đúng mật khẩu -> logout', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/login');

    // 1) Sai mật khẩu
    await page.fill('#email', VALID_EMAIL);
    await page.fill('#password', WRONG_PASSWORD);
    await page.click('button[type="submit"]');

    const errorMsg = page.locator('.bg-red-50');
    await expect(errorMsg).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*\/login/);

    // 2) Thiếu input (xóa trắng rồi submit)
    await page.fill('#email', '');
    await page.fill('#password', '');
    await page.click('button[type="submit"]');

    const emailInput = page.locator('#email');
    const isValid = await emailInput.evaluate((el) => el.checkValidity());
    expect(isValid).toBe(false);
    await expect(page).toHaveURL(/.*\/login/);

    // 3) Đúng mật khẩu -> đăng nhập thành công
    await page.fill('#email', VALID_EMAIL);
    await page.fill('#password', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
    expect(page.url()).toMatch(/\/(app|staff)/);

    // 4) Logout
    const avatarBtn = page.locator('[data-testid="user-menu"], button.rounded-full, img.rounded-full').first();
    const avatarVisible = await avatarBtn.isVisible().catch(() => false);
    if (avatarVisible) {
      await avatarBtn.click();
      await page.waitForTimeout(500);
    }

    await page.getByText('Đăng xuất').first().click({ timeout: 10000 });
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

});
