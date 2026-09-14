// src/db/queries/settingsQueries.js
const { getPool } = require('../pool');

async function getSettings() {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT * FROM settings WHERE id = 1`);
  return rows[0] || null;
}

async function updateSettings({
  tir_min,
  tir_max,
  red_under,
  red_over,
  rapid_duration,
  slow_duration,
  carb_duration,
  insulin_sensitivity,
  carb_ratio,
  quick_insulin_1,
  quick_insulin_2,
  quick_carb_1,
  quick_carb_2,
  telegram_enabled,
  telegram_high_low_alerts,
  telegram_insulin_alerts,
  telegram_carb_alerts,
  telegram_daily_summary,
  telegram_daily_summary_time
}) {
  const p = await getPool();
  const finalTirMin = tir_min ?? 70;
  const finalTirMax = tir_max ?? 180;
  const finalRedUnder = red_under ?? 55;
  const finalRedOver = red_over ?? 250;
  const finalRapid = rapid_duration ?? 3;
  const finalSlow = slow_duration ?? 24;
  const finalCarbDuration = carb_duration ?? 4;
  const finalInsulinSensitivity = insulin_sensitivity ?? 60;
  const finalCarbRatio = carb_ratio ?? 15;
  const finalQuickIns1 = quick_insulin_1 ?? 1;
  const finalQuickIns2 = quick_insulin_2 ?? 2;
  const finalQuickCarb1 = quick_carb_1 ?? 10;
  const finalQuickCarb2 = quick_carb_2 ?? 20;
  const finalTelegramEnabled = telegram_enabled ?? false;
  const finalTelegramHighLow = telegram_high_low_alerts ?? true;
  const finalTelegramInsulin = telegram_insulin_alerts ?? false;
  const finalTelegramCarb = telegram_carb_alerts ?? false;
  const finalTelegramDaily = telegram_daily_summary ?? false;
  const finalDailySummaryTime = telegram_daily_summary_time || '21:00';

  const [result] = await p.execute(
    `UPDATE settings 
     SET tir_min = ?, tir_max = ?, red_under = ?, red_over = ?, rapid_duration = ?, slow_duration = ?, carb_duration = ?, insulin_sensitivity = ?, carb_ratio = ?, quick_insulin_1 = ?, quick_insulin_2 = ?, quick_carb_1 = ?, quick_carb_2 = ?, telegram_enabled = ?, telegram_high_low_alerts = ?, telegram_insulin_alerts = ?, telegram_carb_alerts = ?, telegram_daily_summary = ?, telegram_daily_summary_time = ?
     WHERE id = 1`,
    [
      finalTirMin,
      finalTirMax,
      finalRedUnder,
      finalRedOver,
      finalRapid,
      finalSlow,
      finalCarbDuration,
      finalInsulinSensitivity,
      finalCarbRatio,
      finalQuickIns1,
      finalQuickIns2,
      finalQuickCarb1,
      finalQuickCarb2,
      finalTelegramEnabled,
      finalTelegramHighLow,
      finalTelegramInsulin,
      finalTelegramCarb,
      finalTelegramDaily,
      finalDailySummaryTime
    ]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getSettings,
  updateSettings
};
