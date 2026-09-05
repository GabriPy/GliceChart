// index.js - Core i18n initialization and language management for GliceChart
import { createI18n } from 'vue-i18n'
import it from './locales/it.js'
import en from './locales/en.js'
import { datetimeFormats, numberFormats } from './formats.js'

export const SUPPORTED_LOCALES = ['it', 'en']
export const DEFAULT_LOCALE = 'it'
export const STORAGE_KEY = 'glicechart_lang'

/**
 * Detect user's preferred language based on localStorage or browser navigator
 */
export function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved)) {
      return saved
    }

    const browserLangs = navigator.languages || [navigator.language || '']
    for (const lang of browserLangs) {
      const code = String(lang || '').toLowerCase()
      if (code.startsWith('it')) return 'it'
      if (code.startsWith('en')) return 'en'
    }
  } catch (e) {
    // LocalStorage or navigator inaccessible
  }
  return DEFAULT_LOCALE
}

const initialLocale = detectLocale()

// Update html lang attribute
try {
  document.documentElement.setAttribute('lang', initialLocale)
} catch (e) {}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    it,
    en
  },
  datetimeFormats,
  numberFormats,
  missingWarn: process.env.NODE_ENV !== 'production',
  fallbackWarn: process.env.NODE_ENV !== 'production',
  missing: (locale, key) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Missing translation for key: "${key}" in locale: "${locale}"`)
    }
  }
})

/**
 * Change the active application language
 * @param {'it' | 'en'} lang 
 */
export function setLanguage(lang) {
  if (!SUPPORTED_LOCALES.includes(lang)) return
  i18n.global.locale.value = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.setAttribute('lang', lang)
  } catch (e) {}
}

/**
 * Get current active language
 * @returns {'it' | 'en'}
 */
export function getLanguage() {
  return i18n.global.locale.value || DEFAULT_LOCALE
}

/**
 * Direct translation helper for external JS modules / store
 */
export function t(key, params, count) {
  if (count !== undefined) {
    return i18n.global.t(key, count, params)
  }
  return i18n.global.t(key, params)
}

/**
 * Direct datetime formatter helper
 */
export function d(value, format) {
  return i18n.global.d(value, format)
}

/**
 * Direct number formatter helper
 */
export function n(value, format) {
  return i18n.global.n(value, format)
}

export default i18n
