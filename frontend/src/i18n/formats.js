// formats.js - Centralized datetime and number formats for vue-i18n

export const datetimeFormats = {
  it: {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    },
    shortWithTime: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    monthYear: {
      month: 'long',
      year: 'numeric'
    }
  },
  en: {
    short: {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    },
    shortWithTime: {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    long: {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    monthYear: {
      month: 'long',
      year: 'numeric'
    }
  }
}

export const numberFormats = {
  it: {
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    },
    integer: {
      style: 'decimal',
      maximumFractionDigits: 0
    },
    percent: {
      style: 'percent',
      useGrouping: false
    }
  },
  en: {
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    },
    integer: {
      style: 'decimal',
      maximumFractionDigits: 0
    },
    percent: {
      style: 'percent',
      useGrouping: false
    }
  }
}
