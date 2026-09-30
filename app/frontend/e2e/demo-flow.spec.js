import { expect, test } from '@playwright/test'

// Demo mode starts signed in as the club admin, so the app opens on the dashboard.
async function signIn(page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
}

async function signOut(page) {
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('button', { name: /Sign Out/ }).click()
  await expect(page).toHaveURL(/\/login/)
}

async function viewAs(page, label) {
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('button', { name: label, exact: true }).click()
}

test.describe('investor demo flow', () => {
  // (Redirect-to-login for protected pages is covered by the RequireAuth unit test: a full page load
  // in demo mode always starts signed in, so it cannot be observed here.)
  test('signing out and back in works', async ({ page }) => {
    await signIn(page)
    await signOut(page)
    await page.getByLabel(/username/i).fill('admin')
    await page.getByLabel(/password/i).fill('anything1')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
  })

  test('login, dashboard, add an athlete and open their profile', async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('Athletes').first()).toBeVisible()

    await page.getByRole('link', { name: 'Athletes' }).first().click()
    await page.getByRole('button', { name: 'Add Athlete' }).first().click()

    // Validation first
    await page.getByRole('button', { name: 'Add Athlete' }).last().click()
    await expect(page.getByText('First name is required.')).toBeVisible()

    await page.getByLabel(/first name/i).fill('Playwright')
    await page.getByLabel(/last name/i).fill('Tester')
    await page.getByLabel(/date of birth/i).fill('2003-04-05')
    await page.getByLabel(/gender/i).selectOption('Female')
    await page.getByLabel(/^sport/i).selectOption('Football')
    await page.getByLabel(/phone/i).fill('0244000111')
    await page.getByRole('button', { name: 'Add Athlete' }).last().click()
    await expect(page.getByRole('dialog')).toBeHidden()

    await page.getByLabel('Search athletes').fill('Playwright')
    await page.getByText('Playwright Tester').first().click()
    await expect(page).toHaveURL(/\/athletes\/\d+/)
    await expect(page.getByRole('heading', { name: /Playwright Tester/ })).toBeVisible()
  })

  test('analytics shows KPIs and the date range can change', async ({ page }) => {
    await signIn(page)
    await page.getByRole('link', { name: 'Analytics' }).click()
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByText('Revenue').first()).toBeVisible()
    await page.getByLabel('Date range').selectOption('90d')
    await expect(page.getByLabel('Date range')).toHaveValue('90d')
    await expect(page.getByText('Revenue').first()).toBeVisible()
  })

  test('intelligence shows retention risk with the reasons behind each score', async ({ page }) => {
    await signIn(page)
    await page.getByRole('link', { name: 'Intelligence' }).click()
    await expect(page.getByRole('heading', { name: 'Intelligence' })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Retention/ }).or(page.getByRole('button', { name: /Retention/ })).first()).toBeVisible()
    await expect(page.getByText(/membership|attendance/i).first()).toBeVisible()
  })

  test('a report previews and downloads as CSV', async ({ page }) => {
    await signIn(page)
    await page.getByRole('link', { name: 'Reports' }).click()
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'CSV' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/report.*\.csv$/)
  })

  test('switching role changes what the sidebar offers', async ({ page }) => {
    await signIn(page)
    const nav = page.getByRole('navigation')
    await expect(nav.getByRole('link', { name: 'Payments' })).toBeVisible()

    await viewAs(page, 'Coach')
    await expect(nav.getByRole('link', { name: 'Payments' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Attendance' })).toBeVisible()

    await page.goto('/payments')
    await expect(page.getByRole('heading', { name: /access/i }).or(page.getByText(/don't have access|no access|not allowed/i)).first()).toBeVisible()

    await viewAs(page, 'Athlete')
    await expect(page).toHaveURL(/\/me/)
    await expect(nav.getByRole('link', { name: 'Athletes' })).toHaveCount(0)
  })
})
