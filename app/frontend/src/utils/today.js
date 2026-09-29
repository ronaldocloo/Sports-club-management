import { USE_MOCKS } from '../api/client'

// Demo data is written around a fixed date so the demo looks the same every day.
export const TODAY_ISO = USE_MOCKS ? '2026-09-29' : new Date().toISOString().slice(0, 10)
export const TODAY = new Date(TODAY_ISO)
