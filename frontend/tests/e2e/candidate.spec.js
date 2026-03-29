import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// =========================================================
// ĐẶT THÔNG TIN TÀI KHOẢN CANDIDATE THẬT VÀO ĐÂY
const CANDIDATE_EMAIL = 'lamltde180684@fpt.edu.vn';
const CANDIDATE_PASSWORD = '123456';
const SAMPLE_CV_PATH = fileURLToPath(new URL('./fixtures/sample-cv.pdf', import.meta.url));
// =========================================================

/**
 * Helper: login thật qua UI
 */
async function loginAsCandidate(page) {
  await page.goto('/login');
  await page.fill('#email', CANDIDATE_EMAIL);
  await page.fill('#password', CANDIDATE_PASSWORD);
  await page.click('button[type="submit"]');
  // Đợi redirect ra khỏi /login (bất kỳ role nào)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
}

async function getJobIdByApplyState(page, expectApplied) {
  await page.goto('/app/jobs');
  await page.waitForTimeout(2000);

  const viewButtons = page.locator('button:has-text("Xem chi tiết")');
  const count = await viewButtons.count();

  for (let i = 0; i < count; i++) {
    await viewButtons.nth(i).click();
    await page.waitForTimeout(1200);

    const currentUrl = page.url();
    const match = currentUrl.match(/\/app\/jobs\/(\d+)/);
    if (!match) {
      await page.goBack();
      await page.waitForTimeout(600);
      continue;
    }

    const jobId = match[1];
    const appliedBtn = page.locator('button:has-text("Đã ứng tuyển • Xem hồ sơ")');
    const applyBtn = page.locator('button:has-text("Ứng tuyển ngay")');
    const isApplied = await appliedBtn.isVisible({ timeout: 1200 }).catch(() => false);
    const canApply = await applyBtn.isVisible({ timeout: 1200 }).catch(() => false);

    if ((expectApplied && isApplied) || (!expectApplied && canApply)) {
      return jobId;
    }

    await page.goBack();
    await page.waitForTimeout(800);
  }

  return null;
}

async function ensurePreferredLocation(page) {
  const locationInput = page
    .locator('label:has-text("Địa điểm làm việc mong muốn")')
    .locator('xpath=following::input[1]');
  await locationInput.fill('Head Office');
  await locationInput.press('Enter');
}

test.describe('Candidate Flow Tests', () => {
  test('1 account - 1 màn: xem trạng thái và nộp CV thành công', async ({ page }) => {
    test.setTimeout(90000);

    await loginAsCandidate(page);

    // Tìm 1 job đã ứng tuyển
    const appliedJobId = await getJobIdByApplyState(page, true);
    expect(appliedJobId, 'Không tìm thấy job đã ứng tuyển').toBeTruthy();

    await page.goto(`/app/jobs/${appliedJobId}`);
    await page.waitForTimeout(1200);
    await expect(page.locator('button:has-text("Đã ứng tuyển • Xem hồ sơ")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Ứng tuyển ngay")')).not.toBeVisible();

    // Tìm 1 job chưa ứng tuyển
    await page.goto('/app/jobs');
    await page.waitForTimeout(1200);
    const unappliedJobId = await getJobIdByApplyState(page, false);
    if (!unappliedJobId) {
      console.log('[INFO] Account đã apply hết các job đang mở, không còn job để chạy bước nộp CV mới.');
      return;
    }

    await page.goto(`/app/jobs/${unappliedJobId}`);
    await page.waitForTimeout(1200);
    const applyBtn = page.locator('button:has-text("Ứng tuyển ngay")');
    const appliedBtn = page.locator('button:has-text("Đã ứng tuyển • Xem hồ sơ")');
    await expect(applyBtn).toBeVisible({ timeout: 5000 });
    await expect(appliedBtn).not.toBeVisible();

    // Luồng Ứng tuyển ngay -> Nộp CV thành công
    await applyBtn.click();
    await expect(page.locator('p:has-text("CV ứng tuyển gần nhất")')).toBeVisible({ timeout: 10000 });

    await page.locator('input[type="radio"][name="cv-source"]').last().check();
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_CV_PATH);
    await page.locator('input[type="checkbox"]').first().check();
    await ensurePreferredLocation(page);

    const submitBtn = page.locator('button:has-text("Nộp hồ sơ ứng tuyển")');
    await submitBtn.click();
    await expect(page.locator('button:has-text("Đang nộp...")')).not.toBeVisible({ timeout: 30000 });

    await expect(appliedBtn).toBeVisible({ timeout: 30000 });
    await expect(applyBtn).not.toBeVisible();
  });
});
