export const PATTERN_THRESHOLDS = Object.freeze({
  minReadingsForAnalysis: 288,
  maxSampleGapMinutes: 15,
  minSlopeMgDlPerMinute: 0.45,
  minConsistencyRatio: 0.65,
  minAbsoluteSamples: 10,
  minSamplesRatioOfDaysObserved: 0.3,
  recencyHalfLifeDays: 30,
  minNoteOccurrences: 4,
  minNoteImpactMgDl: 20,
  postEventWindowHours: 3
})

export const PATTERN_OVERLAP = Object.freeze({
  toleranceMinutes: 30,
  minSlopeOccurrences: 8
})
