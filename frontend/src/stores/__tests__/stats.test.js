import { describe, it, expect } from 'vitest'
import {
  calculateExponentialIobFraction,
  calculateIob,
  calculateCob,
  calculateStats,
  getStatusColorForValue
} from '../stats'

describe('Clinical Stats & Exponential Pharmacokinetics (AGP Standards)', () => {
  describe('Exponential IOB Model (Walsh / Scheiner)', () => {
    it('should return 1.0 at t = 0 min', () => {
      expect(calculateExponentialIobFraction(0, 3, 75)).toBe(1)
    })

    it('should return 0.0 at t >= DIA', () => {
      expect(calculateExponentialIobFraction(180, 3, 75)).toBe(0)
      expect(calculateExponentialIobFraction(240, 3, 75)).toBe(0)
    })

    it('should decrease monotonically over time', () => {
      const f30 = calculateExponentialIobFraction(30, 3, 75)
      const f75 = calculateExponentialIobFraction(75, 3, 75)
      const f120 = calculateExponentialIobFraction(120, 3, 75)
      const f150 = calculateExponentialIobFraction(150, 3, 75)

      expect(f30).toBeGreaterThan(f75)
      expect(f75).toBeGreaterThan(f120)
      expect(f120).toBeGreaterThan(f150)
      expect(f150).toBeGreaterThan(0)
    })

    it('should calculate IOB accurately from multiple rapid entries', () => {
      const now = 1700000000000
      const entries = [
        // 5 unità iniettate 60 min fa (t = 60 min)
        { timestamp: new Date(now - 60 * 60 * 1000).toISOString(), type: 'rapid', units: 5 },
        // 3 unità iniettate 300 min fa (t > DIA -> 0 IOB)
        { timestamp: new Date(now - 300 * 60 * 1000).toISOString(), type: 'rapid', units: 3 },
        // 14 unità di lenta (non contribuisce a IOB rapida)
        { timestamp: new Date(now - 30 * 60 * 1000).toISOString(), type: 'slow', units: 14 }
      ]

      const iob = calculateIob(entries, 3, now)
      expect(iob).toBeGreaterThan(0)
      expect(iob).toBeLessThan(5) // parzialmente consumata
    })
  })

  describe('COB Model (Active Carbs)', () => {
    it('should calculate active carbs from carb entries', () => {
      const now = 1700000000000
      const entries = [
        { timestamp: new Date(now - 30 * 60 * 1000).toISOString(), amount: 60 }
      ]
      const cob = calculateCob(entries, 4, now)
      expect(cob).toBeGreaterThan(0)
      expect(cob).toBeLessThan(60)
    })
  })

  describe('AGP Consensus Stats (TIR, GMI, CV, eA1C)', () => {
    const fixtureData = [
      { glucose: 65 },  // Low (<70)
      { glucose: 95 },  // In Range (70-180)
      { glucose: 110 }, // In Range
      { glucose: 120 }, // In Range
      { glucose: 135 }, // In Range
      { glucose: 150 }, // In Range
      { glucose: 175 }, // In Range
      { glucose: 195 }, // High (>180)
      { glucose: 260 }  // Very High (>250)
    ]
    const settings = { tir_min: 70, tir_max: 180, red_under: 55, red_over: 250 }

    it('should calculate mean, min, and max correctly', () => {
      const stats = calculateStats(fixtureData, settings)
      expect(stats.min).toBe(65)
      expect(stats.max).toBe(260)
      expect(stats.avg).toBe(145) // sum = 1305 / 9 = 145
    })

    it('should calculate TIR, TBR, and TAR percentages accurately', () => {
      const stats = calculateStats(fixtureData, settings)
      // 6 su 9 in range: 6/9 = 66.6% -> 67%
      expect(stats.tir).toBe(67)
      // 1 su 9 below range (<70): 1/9 = 11%
      expect(stats.tbr).toBe(11)
      // 2 su 9 above range (>180): 2/9 = 22%
      expect(stats.tar).toBe(22)
      // 1 su 9 very high (>250): 1/9 = 11%
      expect(stats.tarVeryHigh).toBe(11)
    })

    it('should calculate GMI according to ADA formula (3.31 + 0.02392 * avg)', () => {
      const stats = calculateStats(fixtureData, settings)
      const expectedGmi = Math.round((3.31 + 0.02392 * 145) * 10) / 10
      expect(stats.gmi).toBe(expectedGmi)
    })

    it('should calculate CV% (coefficient of variation)', () => {
      const stats = calculateStats(fixtureData, settings)
      expect(stats.cv).toBeGreaterThan(0)
      expect(stats.stdDev).toBeGreaterThan(0)
    })

    it('should return null for empty data', () => {
      expect(calculateStats([], settings)).toBeNull()
      expect(calculateStats(null, settings)).toBeNull()
    })
  })

  describe('Status Color Classification', () => {
    const settings = { tir_min: 70, tir_max: 180, red_under: 55, red_over: 250 }

    it('should return text-error for severe hypo or hyper', () => {
      expect(getStatusColorForValue(50, settings)).toBe('text-error')
      expect(getStatusColorForValue(260, settings)).toBe('text-error')
    })

    it('should return text-warning for mild out of range', () => {
      expect(getStatusColorForValue(65, settings)).toBe('text-warning')
      expect(getStatusColorForValue(190, settings)).toBe('text-warning')
    })

    it('should return text-success for in-range values', () => {
      expect(getStatusColorForValue(100, settings)).toBe('text-success')
      expect(getStatusColorForValue(140, settings)).toBe('text-success')
    })
  })
})
