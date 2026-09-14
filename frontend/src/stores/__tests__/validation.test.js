import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS,
  normalizeBooleanSetting,
  normalizeTelegramFlags,
  assertPositiveNumber,
  assertValidPin,
  validateSettings,
  ValidationError
} from '../validation'

describe('Form & Clinical Constraints Validation', () => {
  describe('Boolean & Flag Normalizers', () => {
    it('should correctly normalize truthy and falsy values', () => {
      expect(normalizeBooleanSetting(true)).toBe(true)
      expect(normalizeBooleanSetting('true')).toBe(true)
      expect(normalizeBooleanSetting(1)).toBe(true)
      expect(normalizeBooleanSetting('1')).toBe(true)

      expect(normalizeBooleanSetting(false)).toBe(false)
      expect(normalizeBooleanSetting('false')).toBe(false)
      expect(normalizeBooleanSetting(0)).toBe(false)
      expect(normalizeBooleanSetting('0')).toBe(false)
      expect(normalizeBooleanSetting(null, true)).toBe(true)
    })

    it('should normalize telegram flags bundle', () => {
      const raw = {
        telegram_enabled: '1',
        telegram_high_low_alerts: '0',
        telegram_daily_summary_time: '20:30'
      }
      const flags = normalizeTelegramFlags(raw)
      expect(flags.telegram_enabled).toBe(true)
      expect(flags.telegram_high_low_alerts).toBe(false)
      expect(flags.telegram_daily_summary_time).toBe('20:30')
    })
  })

  describe('PIN Validation', () => {
    it('should accept 4 to 6 numeric digits', () => {
      expect(() => assertValidPin('1234')).not.toThrow()
      expect(() => assertValidPin('123456')).not.toThrow()
    })

    it('should reject non-numeric PIN or length out of range', () => {
      expect(() => assertValidPin('123')).toThrow(ValidationError)
      expect(() => assertValidPin('1234567')).toThrow(ValidationError)
      expect(() => assertValidPin('abcd')).toThrow(ValidationError)
    })
  })

  describe('Settings Bounds & Physiological Safety Validation', () => {
    it('should accept valid default settings', () => {
      const issues = validateSettings(DEFAULT_SETTINGS)
      expect(issues).toHaveLength(0)
    })

    it('should reject inverted TIR ranges (tir_min >= tir_max)', () => {
      const invalid = { ...DEFAULT_SETTINGS, tir_min: 190, tir_max: 180 }
      const issues = validateSettings(invalid)
      expect(issues).toContain('tir_min_must_be_below_tir_max')
    })

    it('should reject red_under >= tir_min', () => {
      const invalid = { ...DEFAULT_SETTINGS, red_under: 80, tir_min: 70 }
      const issues = validateSettings(invalid)
      expect(issues).toContain('red_under_must_be_below_tir_min')
    })

    it('should reject red_over <= tir_max', () => {
      const invalid = { ...DEFAULT_SETTINGS, red_over: 170, tir_max: 180 }
      const issues = validateSettings(invalid)
      expect(issues).toContain('red_over_must_be_above_tir_max')
    })
  })
})
