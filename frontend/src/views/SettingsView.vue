```vue
<template>
  <div class="flex flex-col gap-4 md:gap-5 lg:gap-6 px-2 md:px-4 lg:px-0 pb-28">

    <!-- Header -->
    <div
      class="flex items-center justify-between gap-4 bg-base-200 border border-base-content/10 border-l-4 border-l-primary rounded-2xl px-4 md:px-6 py-4 md:py-5 shadow-sm">
      <div class="flex items-center gap-3 md:gap-4">
        <div class="p-3 md:p-4 bg-primary/10 rounded-xl md:rounded-2xl ring-1 ring-primary/10">
          <i class="fa-solid fa-gear text-primary text-xl md:text-2xl"></i>
        </div>

        <div>
          <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">
            {{ $t('settings.title') }}
          </h2>

          <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">
            {{ $t('settings.subtitle') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-5">

      <!-- Range Glicemico - Hero, full width -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-success rounded-2xl lg:col-span-4">
        <div class="card-body p-5 md:p-8 gap-5 md:gap-7">

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center gap-2 md:gap-3">

              <div class="p-2 md:p-3 bg-success/10 rounded-lg md:rounded-xl ring-1 ring-success/10">
                <i class="fa-solid fa-chart-line text-success text-lg md:text-xl"></i>
              </div>

              <div>
                <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">
                  {{ $t('settings.tirCardTitle') }}
                </h3>

                <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  {{ $t('settings.tirCardSubtitle') }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-lg ring-1 ring-success/10 w-fit">
              <span class="text-xs md:text-sm font-black text-success">
                {{ tirRange }}
              </span>

              <span class="text-[10px] font-bold opacity-50">
                {{ $t('common.mgDl') }}
              </span>
            </div>
          </div>

          <!-- Visual Range Preview -->
          <div class="space-y-2 md:space-y-3">
            <div class="h-5 md:h-7 w-full rounded-full overflow-hidden flex border border-base-content/10 shadow-inner">
              <div class="bg-error/25 flex-1"></div>
              <div class="bg-success/40" style="flex: 3 1 0%"></div>
              <div class="bg-error/25 flex-1"></div>
            </div>

            <div class="flex items-center justify-between text-[10px] md:text-xs font-black uppercase opacity-50 px-1">
              <span>
                {{ form.red_under }} {{ $t('common.mgDl') }}
              </span>

              <span class="text-success opacity-100">
                {{ form.tir_min }} – {{ form.tir_max }}
              </span>

              <span>
                {{ form.red_over }} {{ $t('common.mgDl') }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

            <div class="space-y-1 md:space-y-2 min-w-0">
              <label class="text-[10px] font-black uppercase opacity-40">
                {{ $t('settings.lowThreshold') }}
              </label>

              <input type="number" v-model.number="form.red_under"
                class="input input-bordered font-black border-error/30 focus:border-error focus:outline-none w-full input-sm md:input-md" />
            </div>

            <div class="space-y-1 md:space-y-2 min-w-0">
              <label class="text-[10px] font-black uppercase opacity-40">
                {{ $t('settings.minTarget') }}
              </label>

              <input type="number" v-model.number="form.tir_min"
                class="input input-bordered font-black border-success/30 focus:border-success focus:outline-none w-full input-sm md:input-md" />
            </div>

            <div class="space-y-1 md:space-y-2 min-w-0">
              <label class="text-[10px] font-black uppercase opacity-40">
                {{ $t('settings.maxTarget') }}
              </label>

              <input type="number" v-model.number="form.tir_max"
                class="input input-bordered font-black border-success/30 focus:border-success focus:outline-none w-full input-sm md:input-md" />
            </div>

            <div class="space-y-1 md:space-y-2 min-w-0">
              <label class="text-[10px] font-black uppercase opacity-40">
                {{ $t('settings.highThreshold') }}
              </label>

              <input type="number" v-model.number="form.red_over"
                class="input input-bordered font-black border-error/30 focus:border-error focus:outline-none w-full input-sm md:input-md" />
            </div>

          </div>
        </div>
      </div>

      <!-- Insulina e Carboidrati -->
      <div
        class="card bg-base-200 border border-base-content/10 border-l-4 border-l-primary rounded-2xl lg:col-span-2 lg:row-span-2">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-5">

          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl ring-1 ring-primary/10">
              <i class="fa-solid fa-syringe text-primary text-lg md:text-xl"></i>
            </div>

            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">
                {{ $t('settings.pharmaCardTitle') }}
              </h3>

              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">
                {{ $t('settings.pharmaCardSubtitle') }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <i class="fa-regular fa-clock text-primary text-sm"></i>

            <span class="text-[10px] font-black uppercase opacity-50">
              {{ $t('settings.actionDurationHours') }}
            </span>
          </div>

          <div class="flex flex-col divide-y divide-base-content/5">

            <div class="flex items-center gap-3 md:gap-4 py-3 first:pt-0">
              <div
                class="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/10">
                <i class="fa-solid fa-bolt text-primary text-xs md:text-sm"></i>
              </div>

              <div class="flex-1 min-w-0">
                <label class="text-[8px] md:text-[9px] font-black uppercase opacity-40">
                  {{ $t('settings.rapidDuration') }}
                </label>

                <input type="number" v-model.number="form.rapid_duration"
                  class="input input-bordered font-black input-sm w-full" />
              </div>
            </div>

            <div class="flex items-center gap-3 md:gap-4 py-3">
              <div
                class="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-secondary/10">
                <i class="fa-regular fa-hourglass-half text-secondary text-xs md:text-sm"></i>
              </div>

              <div class="flex-1 min-w-0">
                <label class="text-[8px] md:text-[9px] font-black uppercase opacity-40">
                  {{ $t('settings.slowDuration') }}
                </label>

                <input type="number" v-model.number="form.slow_duration"
                  class="input input-bordered font-black input-sm w-full" />
              </div>
            </div>

            <div class="flex items-center gap-3 md:gap-4 py-3 last:pb-0">
              <div
                class="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 ring-1 ring-accent/10">
                <i class="fa-solid fa-bread-slice text-accent text-xs md:text-sm"></i>
              </div>

              <div class="flex-1 min-w-0">
                <label class="text-[8px] md:text-[9px] font-black uppercase opacity-40">
                  {{ $t('settings.carbDuration') }}
                </label>

                <input type="number" v-model.number="form.carb_duration"
                  class="input input-bordered font-black input-sm border-accent/30 w-full" />
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-accent rounded-2xl lg:col-span-2">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-5">

          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl ring-1 ring-accent/10">
              <i class="fa-solid fa-bolt text-accent text-lg md:text-xl"></i>
            </div>

            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">
                {{ $t('settings.quickPresetsCardTitle') }}
              </h3>

              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">
                {{ $t('settings.quickPresetsCardSubtitle') }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 md:gap-5">

            <div class="space-y-2 md:space-y-3">
              <label class="text-[10px] font-black uppercase opacity-50">
                {{ $t('settings.insulinUnitsLabel') }}
              </label>

              <div class="grid grid-cols-2 gap-2 md:gap-3">

                <div class="space-y-1 min-w-0">
                  <label class="text-[9px] font-black opacity-30">
                    {{ $t('settings.preset1') }}
                  </label>

                  <input type="number" v-model.number="form.quick_insulin_1"
                    class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                </div>

                <div class="space-y-1 min-w-0">
                  <label class="text-[9px] font-black opacity-30">
                    {{ $t('settings.preset2') }}
                  </label>

                  <input type="number" v-model.number="form.quick_insulin_2"
                    class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                </div>

              </div>
            </div>

            <div class="space-y-2 md:space-y-3">
              <label class="text-[10px] font-black uppercase opacity-50">
                {{ $t('settings.carbsGramsLabel') }}
              </label>

              <div class="grid grid-cols-2 gap-2 md:gap-3">

                <div class="space-y-1 min-w-0">
                  <label class="text-[9px] font-black opacity-30">
                    {{ $t('settings.preset1') }}
                  </label>

                  <input type="number" v-model.number="form.quick_carb_1"
                    class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                </div>

                <div class="space-y-1 min-w-0">
                  <label class="text-[9px] font-black opacity-30">
                    {{ $t('settings.preset2') }}
                  </label>

                  <input type="number" v-model.number="form.quick_carb_2"
                    class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- PIN Lock -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-warning rounded-2xl lg:col-span-2">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-5">

          <div class="flex items-center justify-between gap-3">

            <div class="flex items-center gap-3 md:gap-4">
              <div class="p-2.5 md:p-3 bg-warning/10 rounded-xl ring-1 ring-warning/10">
                <i class="fa-solid fa-lock text-warning text-lg md:text-xl"></i>
              </div>

              <div>
                <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">
                  {{ $t('pin.cardTitle') }}
                </h3>

                <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  {{ $t('pin.cardSubtitle') }}
                </span>
              </div>
            </div>

            <div v-if="auth.pinEnabled"
              class="flex items-center gap-2 px-2.5 py-1 bg-success/10 rounded-lg ring-1 ring-success/10 w-fit shrink-0">
              <div class="w-2 h-2 rounded-full bg-success animate-pulse shadow-sm shadow-success/30"></div>

              <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                {{ $t('pin.enabled') }}
              </span>
            </div>

            <div v-else
              class="flex items-center gap-2 px-2.5 py-1 bg-base-100/50 rounded-lg ring-1 ring-base-content/5 w-fit shrink-0">
              <div class="w-2 h-2 rounded-full bg-error"></div>

              <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
                {{ $t('settings.inactiveStatus') }}
              </span>
            </div>

          </div>

          <div class="divider my-0 opacity-10"></div>

          <!-- Nessun PIN impostato -->
          <div v-if="!auth.pinEnabled" class="flex flex-col sm:flex-row sm:items-end gap-3 md:gap-4">
            <div class="space-y-1.5 flex-1">
              <label class="text-[10px] font-black uppercase opacity-40">
                {{ $t('pin.newPlaceholder') }}
              </label>

              <input v-model="newPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6"
                :placeholder="$t('pin.newPlaceholder')"
                class="input input-bordered font-black text-center tracking-[0.15em] text-lg input-md w-full" />
            </div>

            <button @click="savePin"
              class="btn btn-warning btn-md font-black uppercase tracking-widest shadow-md shadow-warning/30 gap-2 w-full sm:w-auto shrink-0"
              :disabled="auth.loading || !newPin">
              <span v-if="auth.loading" class="loading loading-spinner loading-xs"></span>
              <i v-else class="fa-solid fa-check"></i>
              {{ $t('pin.setBtn') }}
            </button>
          </div>

          <!-- PIN già impostato -->
          <div v-else class="flex flex-col sm:flex-row sm:items-end gap-3 md:gap-4">
            <div class="space-y-1.5 flex-1">
              <label class="text-[10px] font-black uppercase opacity-40">
                {{ $t('pin.editPinPlaceholder') }}
              </label>

              <input v-model="currentPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6"
                :placeholder="$t('pin.editPinPlaceholder')"
                class="input input-bordered font-black text-center tracking-[0.15em] text-lg input-md w-full" />
            </div>

            <div class="flex gap-2 w-full sm:w-auto shrink-0">

              <button @click="changePin"
                class="btn btn-primary btn-md font-black uppercase tracking-widest shadow-md shadow-primary/30 gap-2 flex-1 sm:flex-none"
                :disabled="auth.loading || !currentPin">
                <span v-if="auth.loading" class="loading loading-spinner loading-xs"></span>
                <i v-else class="fa-solid fa-rotate"></i>
                {{ $t('pin.changeBtn') }}
              </button>

              <button @click="openRemovePinModal"
                class="btn btn-error btn-outline btn-md font-black uppercase tracking-widest gap-2 flex-1 sm:flex-none"
                :disabled="auth.loading">
                <i class="fa-solid fa-trash"></i>
                {{ $t('pin.removeBtn') }}
              </button>

            </div>
          </div>

        </div>
      </div>

      <!-- Language -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-primary rounded-2xl lg:col-span-1">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-5">

          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl ring-1 ring-primary/10">
              <i class="fa-solid fa-language text-primary text-lg md:text-xl"></i>
            </div>

            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">
                {{ $t('settings.languageCardTitle') }}
              </h3>

              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">
                {{ $t('settings.languageCardSubtitle') }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-2">

            <button type="button" @click="onSelectLanguage('it')"
              class="btn btn-sm rounded-xl flex items-center justify-center gap-2 transition-all font-black text-xs uppercase tracking-wider border w-full"
              :class="currentLocale === 'it'
                ? 'btn-primary border-transparent shadow-md shadow-primary/25'
                : 'bg-base-100/50 hover:bg-base-100 border-base-content/10'">
              <span>🇮🇹</span>
              <span>{{ $t('settings.italian') }}</span>
            </button>

            <button type="button" @click="onSelectLanguage('en')"
              class="btn btn-sm rounded-xl flex items-center justify-center gap-2 transition-all font-black text-xs uppercase tracking-wider border w-full"
              :class="currentLocale === 'en'
                ? 'btn-primary border-transparent shadow-md shadow-primary/25'
                : 'bg-base-100/50 hover:bg-base-100 border-base-content/10'">
              <span>🇬🇧</span>
              <span>{{ $t('settings.english') }}</span>
            </button>

          </div>
        </div>
      </div>

      <!-- Telegram Notifications -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-info rounded-2xl lg:col-span-2">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-5">

          <div class="flex items-center justify-between gap-3">

            <div class="flex items-center gap-2 md:gap-3">
              <div class="p-2 md:p-3 bg-info/10 rounded-lg md:rounded-xl ring-1 ring-info/10">
                <i class="fa-brands fa-telegram text-info text-lg md:text-xl"></i>
              </div>

              <div>
                <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">
                  {{ $t('settings.telegramCardTitle') }}
                </h3>

                <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  {{ $t('settings.telegramCardSubtitle') }}
                </span>
              </div>
            </div>

            <div
              class="flex items-center gap-2 px-2.5 py-1 bg-base-100/50 rounded-lg border border-base-content/10 shrink-0">
              <div class="w-2 h-2 rounded-full shadow-sm" :class="form.telegram_enabled
                ? 'bg-success animate-pulse'
                : 'bg-error'"></div>

              <span class="text-[9px] md:text-[10px] font-bold">
                {{
                  form.telegram_enabled
                    ? $t('settings.activeStatus')
                    : $t('settings.inactiveStatus')
                }}
              </span>
            </div>

          </div>

          <!-- Telegram Settings -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2">

            <label
              class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-xl hover:bg-base-100/50 transition-colors border border-transparent hover:border-base-content/5">
              <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">
                {{ $t('settings.enableTelegram') }}
              </span>

              <input v-model="form.telegram_enabled" type="checkbox"
                class="toggle toggle-primary toggle-xs md:toggle-sm flex-shrink-0" />
            </label>

            <label
              class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-xl hover:bg-base-100/50 transition-colors border border-transparent hover:border-base-content/5">
              <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">
                {{ $t('settings.alertHighLow') }}
              </span>

              <input v-model="form.telegram_high_low_alerts" :disabled="!form.telegram_enabled" type="checkbox"
                class="toggle toggle-error toggle-xs md:toggle-sm flex-shrink-0" />
            </label>

            <label
              class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-xl hover:bg-base-100/50 transition-colors border border-transparent hover:border-base-content/5">
              <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">
                {{ $t('settings.insulinConfirm') }}
              </span>

              <input v-model="form.telegram_insulin_alerts" :disabled="!form.telegram_enabled" type="checkbox"
                class="toggle toggle-success toggle-xs md:toggle-sm flex-shrink-0" />
            </label>

            <label
              class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-xl hover:bg-base-100/50 transition-colors border border-transparent hover:border-base-content/5">
              <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">
                {{ $t('settings.carbConfirm') }}
              </span>

              <input v-model="form.telegram_carb_alerts" :disabled="!form.telegram_enabled" type="checkbox"
                class="toggle toggle-accent toggle-xs md:toggle-sm flex-shrink-0" />
            </label>

            <!-- Riepilogo giornaliero -->
            <label
              class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-xl hover:bg-base-100/50 transition-colors border border-transparent hover:border-base-content/5">
              <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">
                {{ $t('settings.dailySummary') }}
              </span>

              <input v-model="form.telegram_daily_summary" :disabled="!form.telegram_enabled" type="checkbox"
                class="toggle toggle-info toggle-xs md:toggle-sm flex-shrink-0" />
            </label>

            <!-- Ora riepilogo -->
            <div class="flex items-center justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-xl">
              <label class="text-[10px] font-black uppercase opacity-60 truncate">
                {{ $t('settings.summaryTime') }}
              </label>

              <input v-model="form.telegram_daily_summary_time"
                :disabled="!form.telegram_enabled || !form.telegram_daily_summary" type="time"
                class="input input-bordered font-black input-xs md:input-sm w-auto" />
            </div>

          </div>

        </div>
      </div>

      <!-- Export -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-accent rounded-2xl lg:col-span-1">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-5">

          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl ring-1 ring-accent/10">
              <i class="fa-solid fa-download text-accent text-lg md:text-xl"></i>
            </div>

            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">
                {{ $t('settings.exportCardTitle') }}
              </h3>

              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">
                {{ $t('settings.exportCardSubtitle') }}
              </span>
            </div>
          </div>

          <p class="text-[9px] md:text-[10px] opacity-60 leading-relaxed">
            {{ $t('settings.exportCardDescription') }}
          </p>

          <button @click="openExportModal"
            class="btn btn-accent w-full btn-sm md:btn-md font-black uppercase tracking-widest gap-2 shadow-md shadow-accent/20">
            <i class="fa-solid fa-download"></i>
            {{ $t('settings.openExportBtn') }}
          </button>

        </div>
      </div>

    </div>

    <!-- Floating Action Dock -->
    <div
      class="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 md:gap-2 bg-base-100 border border-base-content/10 rounded-full shadow-xl shadow-black/10 px-2 py-2">
      <button @click="openResetModal"
        class="btn btn-ghost btn-sm rounded-full font-black uppercase tracking-widest opacity-60 hover:opacity-100"
        :disabled="store.loading">
        <i class="fa-solid fa-rotate-right mr-1 md:mr-2"></i>
        <span>{{ $t('settings.resetBtn') }}</span>
      </button>

      <button @click="save"
        class="btn btn-primary btn-sm rounded-full px-6 shadow-md shadow-primary/30 font-black uppercase tracking-widest gap-2"
        :disabled="store.loading">
        <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
        <i v-else class="fa-regular fa-floppy-disk"></i>
        {{ $t('common.save') }}
      </button>
    </div>

    <!-- Messaggio Successo -->
    <div v-if="saved" class="toast toast-end">
      <div class="alert alert-success text-xs font-black uppercase py-2 shadow-lg">
        <span>{{ $t('settings.savedSuccessToast') }}</span>
      </div>
    </div>

    <!-- Export Modal -->
    <ExportModal :is-open="showExportModal" @close="showExportModal = false" />

    <!-- Modal Conferma Ripristino -->
    <dialog id="reset_modal" class="modal">
      <div
        class="modal-box bg-base-200 border border-base-content/10 border-l-4 border-l-warning shadow-2xl shadow-black/10 rounded-2xl p-4 md:p-6">
        <div class="flex items-center gap-2 md:gap-3 mb-4">

          <div class="p-2 md:p-3 bg-warning/10 rounded-lg md:rounded-xl ring-1 ring-warning/10">
            <i class="fa-solid fa-rotate-right text-warning text-lg md:text-xl"></i>
          </div>

          <div>
            <h3 class="text-base md:text-lg font-black uppercase tracking-tight leading-none">
              {{ $t('settings.resetModalTitle') }}
            </h3>

            <span class="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-widest">
              {{ $t('settings.defaultValues') }}
            </span>
          </div>

        </div>

        <p class="text-xs md:text-sm opacity-70 mb-6 leading-relaxed">
          {{ $t('settings.resetModalWarning') }}
        </p>

        <div class="modal-action gap-2">

          <form method="dialog">
            <button class="btn btn-ghost uppercase font-black text-xs">
              {{ $t('common.cancel') }}
            </button>
          </form>

          <button @click="confirmReset"
            class="btn btn-warning uppercase font-black text-xs px-8 shadow-md shadow-warning/30"
            :disabled="store.loading">
            <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>

            <span v-else>
              {{ $t('settings.resetBtn') }}
            </span>
          </button>

        </div>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button>{{ $t('common.close') }}</button>
      </form>
    </dialog>

    <!-- Modal Conferma Rimozione PIN -->
    <dialog id="remove_pin_modal" class="modal">
      <div
        class="modal-box bg-base-200 border border-base-content/10 border-l-4 border-l-error shadow-2xl shadow-black/10 rounded-2xl p-4 md:p-6">
        <div class="flex items-center gap-2 md:gap-3 mb-4">

          <div class="p-2 md:p-3 bg-error/10 rounded-lg md:rounded-xl ring-1 ring-error/10">
            <i class="fa-solid fa-lock-open text-error text-lg md:text-xl"></i>
          </div>

          <div>
            <h3 class="text-base md:text-lg font-black uppercase tracking-tight leading-none">
              {{ $t('pin.removeBtn') }}
            </h3>

            <span class="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-widest">
              {{ $t('pin.statusLabel') }}
            </span>
          </div>

        </div>

        <p class="text-xs md:text-sm opacity-70 mb-6 leading-relaxed">
          {{ $t('pin.removeConfirm') }}
        </p>

        <div class="modal-action gap-2">

          <form method="dialog">
            <button class="btn btn-ghost uppercase font-black text-xs">
              {{ $t('common.cancel') }}
            </button>
          </form>

          <button @click="confirmRemovePin"
            class="btn btn-error uppercase font-black text-xs px-8 shadow-md shadow-error/30" :disabled="auth.loading">
            <span v-if="auth.loading" class="loading loading-spinner loading-xs"></span>

            <span v-else>
              {{ $t('pin.removeBtn') }}
            </span>
          </button>

        </div>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button>{{ $t('common.close') }}</button>
      </form>
    </dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useGlucoseStore } from '../stores/glucose'
import { setLanguage } from '../i18n'
import ExportModal from '../components/ExportModal.vue'

const { locale } = useI18n()

const store = useGlucoseStore()
const auth = useAuthStore()

const saved = ref(false)
const showExportModal = ref(false)

const currentLocale = computed(() => locale.value)

function onSelectLanguage(code) {
  setLanguage(code)
}

const form = reactive({
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

const tirRange = computed(() => {
  return `${form.tir_min} - ${form.tir_max}`
})

onMounted(async () => {
  await store.fetchSettings()
  updateFormFromStore()
})

function normalizeBoolean(value, fallback = false) {
  if (value === null || value === undefined) {
    return fallback
  }

  if (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true'
  ) {
    return true
  }

  if (
    value === false ||
    value === 0 ||
    value === '0' ||
    value === 'false'
  ) {
    return false
  }

  return Boolean(value)
}

function updateFormFromStore() {
  form.tir_min = store.settings.tir_min
  form.tir_max = store.settings.tir_max
  form.red_under = store.settings.red_under
  form.red_over = store.settings.red_over

  form.rapid_duration = store.settings.rapid_duration
  form.slow_duration = store.settings.slow_duration
  form.carb_duration = store.settings.carb_duration

  form.insulin_sensitivity = store.settings.insulin_sensitivity
  form.carb_ratio = store.settings.carb_ratio

  form.quick_insulin_1 = store.settings.quick_insulin_1 ?? 1
  form.quick_insulin_2 = store.settings.quick_insulin_2 ?? 2

  form.quick_carb_1 = store.settings.quick_carb_1 ?? 10
  form.quick_carb_2 = store.settings.quick_carb_2 ?? 20

  form.telegram_enabled = normalizeBoolean(
    store.settings.telegram_enabled,
    false
  )

  form.telegram_high_low_alerts = normalizeBoolean(
    store.settings.telegram_high_low_alerts,
    true
  )

  form.telegram_insulin_alerts = normalizeBoolean(
    store.settings.telegram_insulin_alerts,
    false
  )

  form.telegram_carb_alerts = normalizeBoolean(
    store.settings.telegram_carb_alerts,
    false
  )

  form.telegram_daily_summary = normalizeBoolean(
    store.settings.telegram_daily_summary,
    false
  )

  form.telegram_daily_summary_time =
    store.settings.telegram_daily_summary_time || '21:00'
}

function openResetModal() {
  document.getElementById('reset_modal').showModal()
}

async function confirmReset() {
  await store.resetSettings()

  updateFormFromStore()

  document.getElementById('reset_modal').close()

  saved.value = true

  setTimeout(() => {
    saved.value = false
  }, 3000)
}

async function save() {
  const settingsToSave = {
    tir_min: form.tir_min || 70,
    tir_max: form.tir_max || 180,
    red_under: form.red_under || 55,
    red_over: form.red_over || 250,

    rapid_duration: form.rapid_duration || 3,
    slow_duration: form.slow_duration || 24,
    carb_duration: form.carb_duration || 4,

    insulin_sensitivity: form.insulin_sensitivity || 60,
    carb_ratio: form.carb_ratio || 15,

    quick_insulin_1: form.quick_insulin_1 || 1,
    quick_insulin_2: form.quick_insulin_2 || 2,

    quick_carb_1: form.quick_carb_1 || 10,
    quick_carb_2: form.quick_carb_2 || 20,

    telegram_enabled: form.telegram_enabled,
    telegram_high_low_alerts: form.telegram_high_low_alerts,
    telegram_insulin_alerts: form.telegram_insulin_alerts,
    telegram_carb_alerts: form.telegram_carb_alerts,
    telegram_daily_summary: form.telegram_daily_summary,
    telegram_daily_summary_time:
      form.telegram_daily_summary_time || '21:00'
  }

  await store.updateSettings(settingsToSave)

  if (!store.error) {
    updateFormFromStore()

    saved.value = true

    setTimeout(() => {
      saved.value = false
    }, 3000)
  }
}

function openExportModal() {
  showExportModal.value = true
}

const newPin = ref('')
const currentPin = ref('')

async function savePin() {
  const ok = await auth.setPin(newPin.value)

  if (ok) {
    newPin.value = ''

    saved.value = true

    setTimeout(() => {
      saved.value = false
    }, 3000)
  }
}

async function changePin() {
  const ok = await auth.setPin(currentPin.value)

  if (ok) {
    currentPin.value = ''

    saved.value = true

    setTimeout(() => {
      saved.value = false
    }, 3000)
  }
}

function openRemovePinModal() {
  document.getElementById('remove_pin_modal').showModal()
}

async function confirmRemovePin() {
  const ok = await auth.removePin()

  if (ok) {
    document.getElementById('remove_pin_modal').close()

    saved.value = true

    setTimeout(() => {
      saved.value = false
    }, 3000)
  }
}
</script>