import { test, expect } from './test';
import { mockAudio, gotoHome } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page, { loadGames: false });
});

test.describe('Portfolio page', () => {
  test('loads with SEO and social metadata', async ({ page }) => {
    await expect(page).toHaveTitle(/tboy1337/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Portfolio of tboy1337/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tboy1337.github.io/');
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'strict-origin-when-cross-origin');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Developer & Innovator/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const schema = await page.locator('script[type="application/ld+json"]').textContent();
    expect(schema).toContain('"@type": "Person"');
  });

  test('shows portfolio projects and Starstruck achievement', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'MediaRelay' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Blinter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Starstruck' })).toBeVisible();
    await expect(page.getByText(/Last updated: \w+ \d{4}/)).toBeVisible();
    await expect(page.locator('.project-card')).toHaveCount(15);
  });

  test('shows GitHub star counts only for starred projects', async ({ page }) => {
    const starBadges = page.locator('.project-card [role="img"][aria-label$="GitHub stars"]');
    const badgeCount = await starBadges.count();

    expect(badgeCount).toBeGreaterThan(0);

    for (let index = 0; index < badgeCount; index += 1) {
      const label = await starBadges.nth(index).getAttribute('aria-label');
      const stars = Number(label?.match(/^(\d+)/)?.[1] ?? '0');
      expect(stars).toBeGreaterThan(0);
    }
  });

  test('contact form fields are present with accessibility labels', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Your Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Subject' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit contact form' })).toBeVisible();
    await expect(page.locator('#contact-name')).toHaveAttribute('aria-describedby', 'name-error');
    await expect(page.locator('#form-status')).toHaveAttribute('role', 'status');
    await expect(page.locator('input[name="_gotcha"]')).toHaveCount(1);
  });

  test('exposes a content security policy meta tag', async ({ page }) => {
    const csp = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(csp).toHaveAttribute('content', /default-src 'self'/);
    await expect(csp).toHaveAttribute('content', /formspree\.io/);
    await expect(csp).toHaveAttribute('content', /frame-src 'self' https:\/\/translate\.google\.com/);
    await expect(csp).toHaveAttribute('content', /'unsafe-inline'/);
    await expect(csp).toHaveAttribute('content', /translate-pa\.googleapis\.com/);
  });
});
