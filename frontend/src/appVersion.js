import pkg from '../package.json'

export const APP_VERSION = pkg.version
export const APP_VERSION_UI = `v${String(APP_VERSION).split('.').slice(0, 2).join('.')}`
export const APP_VERSION_LABEL = APP_VERSION_UI
