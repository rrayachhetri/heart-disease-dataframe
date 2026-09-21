import { test, expect } from '@playwright/test';

/**
 * End-to-end coverage for the recent session's work:
 *  - axios-based API client (all requests below go through it)
 *  - unified doctor search (single form: insurance + specialty + optional ZIP)
 *  - in-network insurance verification badge
 *  - self-scheduling (doctor publishes a slot, patient books it)
 */

const stamp = Date.now();
const doctorFirstName = `Alex${stamp}`;
const doctorLastName = `Rivera${stamp}`;
const doctorEmail = `e2e-doctor-${stamp}@example.com`;
const patientEmail = `e2e-patient-${stamp}@example.com`;
const password = 'StrongPass123';

let slotLabel = '';

/** Drives the custom DateTimePicker (calendar popup + native time input) that replaced
 * the native datetime-local input. The trigger button's accessible name comes from its
 * wrapping <label> (e.g. "Start"/"End"), not its own placeholder text. */
async function pickDateTime(page: import('@playwright/test').Page, labelText: string, target: Date) {
  await page.getByRole('button', { name: labelText, exact: true }).click();

  const panel = page.getByRole('dialog', { name: 'Choose date and time' });
  const targetMonthYear = target.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  for (let guard = 0; guard < 24; guard += 1) {
    const heading = await panel.locator('span').first().textContent();
    if (heading === targetMonthYear) break;
    await panel.getByRole('button', { name: 'Next month' }).click();
  }
  await panel.getByRole('button', { name: String(target.getDate()), exact: true }).click();

  const pad = (n: number) => String(n).padStart(2, '0');
  await panel.locator('input[type="time"]').fill(`${pad(target.getHours())}:${pad(target.getMinutes())}`);
  await panel.getByRole('button', { name: 'Done' }).click();
}

test.describe.serial('doctor booking flow', () => {
  test('doctor registers, sets accepted insurance, and publishes an appointment slot', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Doctor' }).click();
    await page.getByPlaceholder('Jane').fill(doctorFirstName);
    await page.getByPlaceholder('Doe').fill(doctorLastName);
    await page.getByPlaceholder('you@example.com').fill(doctorEmail);
    await page.getByPlaceholder('Min. 8 characters').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/');

    await page.goto('/doctor/profile');
    await page.getByPlaceholder('10-digit NPI').fill('1234567890');
    await page.getByPlaceholder('e.g. Cardiology').fill('Cardiology');
    await page.getByPlaceholder('BlueCross, Aetna, UnitedHealth').fill('Blue Cross');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('button', { name: '✓ Saved' })).toBeVisible({ timeout: 10000 });

    const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    await pickDateTime(page, 'Start', start);
    await pickDateTime(page, 'End', end);
    await page.getByRole('button', { name: 'Publish time' }).click();

    slotLabel = start.toLocaleString();
    await expect(page.getByText(slotLabel, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('patient finds the doctor via the unified search, sees the verified insurance match, and books the slot', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Jane').fill('Pat');
    await page.getByPlaceholder('Doe').fill('Patient');
    await page.getByPlaceholder('you@example.com').fill(patientEmail);
    await page.getByPlaceholder('Min. 8 characters').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/');

    await page.goto('/doctors');
    await page.getByPlaceholder('e.g. Blue Cross').fill('Blue Cross');
    await page.getByPlaceholder('e.g. Cardiology').fill('Cardiology');
    await page.getByRole('button', { name: 'Find doctors' }).click();

    const doctorCard = page.locator('article', { hasText: `${doctorFirstName} ${doctorLastName}` });
    await expect(doctorCard.getByText('Verified in network: Blue Cross')).toBeVisible({ timeout: 10000 });

    await doctorCard.getByRole('button', { name: 'View appointments' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: slotLabel, exact: true }).click();

    // Scoped to the dialog: a toast with the same confirmation text also appears.
    await expect(dialog.getByText('Appointment confirmed')).toBeVisible({ timeout: 10000 });
  });
});
