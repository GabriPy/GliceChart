import { t } from '../i18n'

export const DEFAULT_SETTINGS = Object.freeze({
  tir_min: 70,
  tir_max: 180,
  red_under: 55,
  red_over: 250,
  rapid_duration: 3,
  slow_duration: 24,
  carb_duration: 4,
  insulin_sensitivity: 60,
  carb_ratio: 15,
  quick_insulin_1: 1,
  quick_insulin_2: 2,
  quick_carb_1: 10,
  quick_carb_2: 20,
  telegram_enabled: false,
  telegram_high_low_alerts: true,
  telegram_insulin_alerts: false,
  telegram_carb_alerts: false,
  telegram_daily_summary: false,
  telegram_daily_summary_time: '21:00'
})

export const SETTINGS_CONSTRAINTS = Object.freeze({
  tir_min: { min: 40, max: 300 },
  tir_max: { min: 40, max: 300 },
  red_under: { min: 20, max: 100 },
  red_over: { min: 150, max: 400 },
  rapid_duration: { min: 1, max: 12 },
  slow_duration: { min: 1, max: 48 },
  carb_duration: { min: 1, max: 12 },
  insulin_sensitivity: { min: 1, max: 500 },
  carb_ratio: { min: 1, max: 100 },
  quick_insulin_1: { min: 0.5, max: 20 },
  quick_insulin_2: { min: 0.5, max: 20 },
  quick_carb_1: { min: 1, max: 200 },
  quick_carb_2: { min: 1, max: 200 }
})

export function normalizeBooleanSetting(value, fallback = false) {
  if (value === null || value === undefined) return fallback
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return Boolean(value)
}

export function normalizeTelegramFlags(raw) {
  return {
    telegram_enabled: normalizeBooleanSetting(raw.telegram_enabled, false),
    telegram_high_low_alerts: normalizeBooleanSetting(raw.telegram_high_low_alerts, true),
    telegram_insulin_alerts: normalizeBooleanSetting(raw.telegram_insulin_alerts, false),
    telegram_carb_alerts: normalizeBooleanSetting(raw.telegram_carb_alerts, false),
    telegram_daily_summary: normalizeBooleanSetting(raw.telegram_daily_summary, false),
    telegram_daily_summary_time: raw.telegram_daily_summary_time || '21:00'
  }
}

export function assertPositiveNumber(value, fieldLabel) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new ValidationError(`Invalid ${fieldLabel}: expected a positive number, received "${value}"`)
  }
  return numericValue
}

export function assertValidPin(pin) {
  if (typeof pin !== 'string' || !/^\d+$/.test(pin)) {
    throw new ValidationError('PIN must contain only digits')
  }
  if (pin.length < 4 || pin.length > 6) {
    throw new ValidationError('PIN must be between 4 and 6 digits')
  }
}

export function validateSettings(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return ['settings_payload_missing']
  }

  const issues = []

  for (const [field, range] of Object.entries(SETTINGS_CONSTRAINTS)) {
    const value = Number(candidate[field])
    if (!Number.isFinite(value) || value < range.min || value > range.max) {
      issues.push(field)
    }
  }

  const tirMin = Number(candidate.tir_min)
  const tirMax = Number(candidate.tir_max)
  const redUnder = Number(candidate.red_under)
  const redOver = Number(candidate.red_over)

  if (Number.isFinite(tirMin) && Number.isFinite(tirMax) && tirMin >= tirMax) {
    issues.push('tir_min_must_be_below_tir_max')
  }
  if (Number.isFinite(redUnder) && Number.isFinite(tirMin) && redUnder >= tirMin) {
    issues.push('red_under_must_be_below_tir_min')
  }
  if (Number.isFinite(redOver) && Number.isFinite(tirMax) && redOver <= tirMax) {
    issues.push('red_over_must_be_above_tir_max')
  }

  return issues
}

export class ValidationError extends Error { }
