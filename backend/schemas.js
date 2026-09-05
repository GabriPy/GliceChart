const { z } = require('zod');

const readingSchema = z.object({
  timestamp: z.string().datetime().or(z.coerce.date()),
  glucose: z.coerce.number().int().min(40).max(400),
  trend: z.string().max(50).optional().nullable()
});

const insulinTypeEnum = z.enum(['rapid', 'correction', 'slow', 'mixed']);

const insulinSchema = z.object({
  timestamp: z.string().datetime().or(z.coerce.date()),
  type: insulinTypeEnum,
  units: z.coerce.number().positive().max(100),
  tag: z.string().max(50).optional().nullable()
});

const carbSchema = z.object({
  timestamp: z.string().datetime().or(z.coerce.date()),
  amount: z.coerce.number().int().positive().max(500),
  tag: z.string().max(50).optional().nullable()
});

const noteSchema = z.object({
  timestamp: z.string().datetime().or(z.coerce.date()),
  text: z.string().min(1).max(1000),
  tag: z.string().max(50).optional().nullable()
});

const dietFoodSchema = z.object({
  name: z.string().min(1).max(100),
  carbs: z.coerce.number().positive().max(500)
});

const idSchema = z.coerce.number().int().positive();

const shareTokenSchema = z.object({
  label: z.string().min(1).max(100).optional().default('Condivisione'),
  ttl_hours: z.coerce.number().int().min(1).max(24 * 365).optional().default(24),
  max_age_hours: z.coerce.number().int().min(1).max(24 * 30).optional().default(24),
  allow_settings: z.boolean().optional().default(false),
  allow_notes: z.boolean().optional().default(false)
});

const healthImportRowSchema = z.object({
  timestamp: z.string().datetime().or(z.coerce.date()),
  type: z.enum(['glucose', 'steps', 'heartRate', 'sleep', 'workout']),
  value: z.coerce.number(),
  unit: z.string().max(20).optional(),
  source: z.string().max(50).optional()
});

const settingsSchema = z.object({
  tir_min: z.number().int().min(40).max(120).optional(),
  tir_max: z.number().int().min(100).max(300).optional(),
  red_under: z.number().int().min(30).max(100).optional(),
  red_over: z.number().int().min(150).max(400).optional(),
  rapid_duration: z.number().int().min(1).max(12).optional(),
  slow_duration: z.number().int().min(12).max(48).optional(),
  carb_duration: z.number().int().min(1).max(12).optional(),
  insulin_sensitivity: z.number().int().min(10).max(500).optional(),
  carb_ratio: z.number().int().min(1).max(100).optional(),
  quick_insulin_1: z.number().int().min(0).max(100).optional(),
  quick_insulin_2: z.number().int().min(0).max(100).optional(),
  quick_carb_1: z.number().int().min(0).max(500).optional(),
  quick_carb_2: z.number().int().min(0).max(500).optional(),
  telegram_enabled: z.boolean().optional(),
  telegram_high_low_alerts: z.boolean().optional(),
  telegram_insulin_alerts: z.boolean().optional(),
  telegram_carb_alerts: z.boolean().optional(),
  telegram_daily_summary: z.boolean().optional(),
  telegram_daily_summary_time: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

module.exports = {
  readingSchema,
  insulinSchema,
  carbSchema,
  noteSchema,
  dietFoodSchema,
  settingsSchema,
  idSchema,
  shareTokenSchema,
  healthImportRowSchema,
  insulinTypeEnum
};
