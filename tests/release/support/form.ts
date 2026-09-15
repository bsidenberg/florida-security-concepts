import { expect, type Page } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const FORM_NAME = 'Site assessment request form';
export type LeadInput = { fullName: string; email: string; phone: string; propertyType: string; service: string; city: string };

/** Distinct synthetic values so each can be searched for in analytics payloads and logs. */
export function syntheticLead(tag: string): LeadInput {
  const digits = String(Math.abs([...tag].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 10000).padStart(4, '0');
  return {
    fullName: `Zyx Canary ${tag}`,
    email: `fsc-canary-${tag}@example.invalid`,
    phone: `20255${digits.slice(0, 1)}0${digits.slice(1)}`,
    propertyType: 'HOA / gated community',
    service: 'Maintenance / service',
    city: 'Orlando',
  };
}

export function form(page: Page) { return page.getByRole('form', { name: FORM_NAME }); }

export async function fillLead(page: Page, lead: LeadInput) {
  const f = form(page);
  for (const name of ['fullName', 'email', 'phone', 'city'] as const) await f.locator(`[name="${name}"]`).fill(lead[name]);
  for (const name of ['propertyType', 'service'] as const) await f.locator(`[name="${name}"]`).selectOption(lead[name]);
}

export function submitButton(page: Page) { return form(page).locator('button[type="submit"]'); }

export async function expectValuesPreserved(page: Page, lead: LeadInput) {
  const f = form(page);
  for (const name of Object.keys(lead) as (keyof LeadInput)[]) await expect(f.locator(`[name="${name}"]`)).toHaveValue(lead[name]);
}

export function receiptPath(requestId: string) { return resolve('.fsc-local/receipts', `${requestId.toLowerCase()}.json`); }
export function readReceipt(requestId: string): { requestId: string; payload: Record<string, string> } {
  const path = receiptPath(requestId);
  expect(existsSync(path), `local receipt ${path} must exist`).toBe(true);
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Truthful confirmation copy required by SPEC §6 (Delivered state) and the emergency journey. */
export async function expectTruthfulConfirmation(page: Page, requestId: string) {
  const status = page.getByRole('status');
  await expect(status).toBeVisible();
  await expect(status.getByRole('heading', { name: 'Request received' })).toBeVisible();
  await expect(status).toContainText('An assessment is not yet booked.');
  await expect(status).toContainText('No technician has been dispatched.');
  await expect(status).toContainText(`Request reference: ${requestId}`);
  await expect(status.locator('a[href^="tel:"]')).toBeVisible();
  const text = (await status.innerText()).replace(/\s+/g, ' ');
  const falseClaims = [
    /\b(appointment|visit|assessment) (is|has been) (confirmed|scheduled|booked)\b/i,
    /(?<!no )technician (is|has been|will be) (dispatched|on the way|en route)/i,
    /\b(we('ve| have) (sent|emailed)|check your (email|inbox)|confirmation email)\b/i,
    /\bETA\b|\bwithin \d+ (minutes|hours)\b/i,
  ];
  for (const claim of falseClaims) expect(text, `confirmation must not make the claim ${claim}`).not.toMatch(claim);
}
