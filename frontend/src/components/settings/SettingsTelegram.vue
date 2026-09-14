<template>
  <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-info rounded-2xl">
    <div class="card-body p-4 md:p-6 gap-4 md:gap-5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="p-2.5 md:p-3 bg-info/10 rounded-xl ring-1 ring-info/20 text-info">
            <i class="fa-brands fa-telegram text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 class="text-sm md:text-base font-bold text-base-content">
              {{ $t('settings.telegramCardTitle') }}
            </h3>
            <p class="text-xs text-base-content/60 font-medium">
              {{ $t('settings.telegramCardSubtitle') }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1 bg-base-100/70 rounded-lg border border-base-content/10 shrink-0">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :class="form.telegram_enabled ? 'bg-success animate-pulse' : 'bg-error'"
          ></div>
          <span class="text-xs font-semibold">
            {{ form.telegram_enabled ? $t('settings.activeStatus') : $t('settings.inactiveStatus') }}
          </span>
        </div>
      </div>

      <!-- Telegram Toggles -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <label
          class="label cursor-pointer justify-between gap-3 p-3 bg-base-100/50 rounded-xl hover:bg-base-100 transition-colors border border-base-content/5"
        >
          <span class="label-text text-xs font-semibold text-base-content/80">
            {{ $t('settings.enableTelegram') }}
          </span>
          <input
            v-model="form.telegram_enabled"
            type="checkbox"
            class="toggle toggle-primary toggle-sm shrink-0"
          />
        </label>

        <label
          class="label cursor-pointer justify-between gap-3 p-3 bg-base-100/50 rounded-xl hover:bg-base-100 transition-colors border border-base-content/5"
          :class="{ 'opacity-50 pointer-events-none': !form.telegram_enabled }"
        >
          <span class="label-text text-xs font-semibold text-base-content/80">
            {{ $t('settings.alertHighLow') }}
          </span>
          <input
            v-model="form.telegram_high_low_alerts"
            :disabled="!form.telegram_enabled"
            type="checkbox"
            class="toggle toggle-error toggle-sm shrink-0"
          />
        </label>

        <label
          class="label cursor-pointer justify-between gap-3 p-3 bg-base-100/50 rounded-xl hover:bg-base-100 transition-colors border border-base-content/5"
          :class="{ 'opacity-50 pointer-events-none': !form.telegram_enabled }"
        >
          <span class="label-text text-xs font-semibold text-base-content/80">
            {{ $t('settings.insulinConfirm') }}
          </span>
          <input
            v-model="form.telegram_insulin_alerts"
            :disabled="!form.telegram_enabled"
            type="checkbox"
            class="toggle toggle-primary toggle-sm shrink-0"
          />
        </label>

        <label
          class="label cursor-pointer justify-between gap-3 p-3 bg-base-100/50 rounded-xl hover:bg-base-100 transition-colors border border-base-content/5"
          :class="{ 'opacity-50 pointer-events-none': !form.telegram_enabled }"
        >
          <span class="label-text text-xs font-semibold text-base-content/80">
            {{ $t('settings.carbConfirm') }}
          </span>
          <input
            v-model="form.telegram_carb_alerts"
            :disabled="!form.telegram_enabled"
            type="checkbox"
            class="toggle toggle-accent toggle-sm shrink-0"
          />
        </label>

        <label
          class="label cursor-pointer justify-between gap-3 p-3 bg-base-100/50 rounded-xl hover:bg-base-100 transition-colors border border-base-content/5 sm:col-span-2"
          :class="{ 'opacity-50 pointer-events-none': !form.telegram_enabled }"
        >
          <div class="flex items-center gap-2">
            <span class="label-text text-xs font-semibold text-base-content/80">
              {{ $t('settings.dailySummary') }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <input
              type="time"
              v-model="form.telegram_daily_summary_time"
              :disabled="!form.telegram_enabled || !form.telegram_daily_summary"
              class="input input-bordered input-xs font-semibold"
            />
            <input
              v-model="form.telegram_daily_summary"
              :disabled="!form.telegram_enabled"
              type="checkbox"
              class="toggle toggle-info toggle-sm shrink-0"
            />
          </div>
        </label>
      </div>

    </div>
  </div>
</template>

<script setup>
defineProps({
  form: {
    type: Object,
    required: true
  }
})
</script>
