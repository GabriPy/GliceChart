import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { t, getLanguage } from '../i18n'

/**
 * Servizio per export dati in CSV e PDF
 * Supporta export di glicemia, insulina, carboidrati, note e impostazioni con i18n
 */

class ExportService {
  static getLocale() {
    return getLanguage() === 'en' ? 'en-US' : 'it-IT'
  }

  static renderTable(doc, options) {
    autoTable(doc, options)
    return doc.lastAutoTable
  }

  static normalizeTableHead(headers) {
    if (!headers?.length) return []
    return Array.isArray(headers[0]) ? headers : [headers]
  }

  static normalizeTableBody(headers, rows) {
    if (!rows.length) return []
    if (Array.isArray(rows[0])) return rows

    const flatHeaders = this.normalizeTableHead(headers)[0] || this.extractHeaders(rows)
    return rows.map((row) => flatHeaders.map((key) => row[key] ?? ''))
  }

  /**
   * Esporta dati in formato CSV
   * @param {Array} data - Array di oggetti da esportare
   * @param {string} filename - Nome del file senza estensione
   * @param {Object} options - Opzioni aggiuntive
   */
  static exportToCSV(data, filename, options = {}) {
    const {
      headers = null,
      transform = null
    } = options

    const csvData = transform ? data.map(transform) : data
    
    const csv = Papa.unparse(csvData, {
      quotes: true,
      delimiter: ',',
      header: true,
      newline: '\n',
      skipEmptyLines: true
    })

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${this.getTimestamp()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Esporta dati in formato PDF
   * @param {Array} data - Array di oggetti da esportare
   * @param {string} filename - Nome del file senza estensione
   * @param {Object} options - Opzioni aggiuntive
   */
  static exportToPDF(data, filename, options = {}) {
    const {
      title = t('exportReports.defaultTitle'),
      headers = null,
      transform = null,
      columns = null,
      pageSize = 'a4',
      orientation = 'portrait',
      styles = {},
      subtitle = t('exportReports.defaultSubtitle'),
      dateRange = null
    } = options

    const pdfData = transform ? data.map(transform) : data
    
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    })

    const headerBottom = this.drawPdfHeader(doc, {
      title,
      subtitle,
      count: pdfData.length,
      dateRange
    })

    if (pdfData.length === 0) {
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(14, headerBottom + 6, 182, 28, 6, 6, 'F')
      doc.setFontSize(12)
      doc.setTextColor(55, 65, 81)
      doc.setFont('helvetica', 'bold')
      doc.text(t('exportReports.noDataInPeriod'), 20, headerBottom + 20)
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'normal')
      doc.text(t('exportReports.noDataInPeriodHelp'), 20, headerBottom + 27)
      this.drawPdfFooter(doc, 'GliceChart Export')
      doc.save(`${filename}_${this.getTimestamp()}.pdf`)
      return
    }

    const tableHeaders = headers || this.extractHeaders(pdfData)

    const tableConfig = {
      startY: headerBottom + 8,
      head: this.normalizeTableHead(tableHeaders),
      body: this.normalizeTableBody(tableHeaders, pdfData),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [31, 41, 55],
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
        ...styles
      },
      headStyles: {
        fillColor: [18, 18, 18],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: headerBottom + 8, right: 14, bottom: 20, left: 14 }
    }

    if (columns) {
      tableConfig.columns = columns
    }

    this.renderTable(doc, tableConfig)

    this.drawPdfFooter(doc, `GliceChart - ${title}`)

    doc.save(`${filename}_${this.getTimestamp()}.pdf`)
  }

  /**
   * Esporta letture glicemiche
   * @param {Array} readings - Letture glicemiche
   * @param {string} format - 'csv' o 'pdf'
   * @param {Object} dateRange - Range date { start, end }
   */
  static exportGlucoseReadings(readings, format = 'csv', dateRange = null, settings = {}) {
    const effectiveRange = this.getEffectiveDateRange(dateRange)
    const filteredReadings = this.filterByDateRange(readings, effectiveRange)
    const loc = this.getLocale()

    const colDateTime = t('exportReports.csvHeaders.dateTime')
    const colGlucose = t('exportReports.csvHeaders.glucose')
    const colTrend = t('exportReports.csvHeaders.trend')
    const colRawTrend = t('exportReports.csvHeaders.rawTrend')

    const transform = (r) => ({
      [colDateTime]: new Date(r.timestamp).toLocaleString(loc),
      [colGlucose]: r.glucose,
      [colTrend]: r.trend,
      [colRawTrend]: r.raw_trend || ''
    })

    const headers = [colDateTime, colGlucose, colTrend, colRawTrend]

    if (format === 'csv') {
      this.exportToCSV(filteredReadings, 'glucose', {
        headers,
        transform
      })
    } else {
      this.exportGlucosePDF(filteredReadings, effectiveRange, settings)
    }
  }

  static exportGlucosePDF(readings, dateRange, settings = {}) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 14
    const loc = this.getLocale()

    let yPos = this.drawPdfHeader(doc, {
      title: t('exportReports.glucoseTitle'),
      subtitle: t('exportReports.glucoseSubtitle'),
      count: readings.length,
      dateRange
    }) + 6

    if (readings.length > 0) {
      const stats = this.calculateGlucoseStats(readings, settings)
      yPos = this.ensurePageSpace(doc, yPos, 34)
      this.drawStatCard(doc, margin, yPos, 40, 25, stats.avgGlucose, 'mg/dL', t('exportReports.avgGlucose'), [99, 102, 241])
      this.drawStatCard(doc, margin + 45, yPos, 40, 25, `${stats.tir}%`, '', t('exportReports.tir'), [34, 197, 94])
      this.drawStatCard(doc, margin + 90, yPos, 40, 25, `${stats.minGlucose}/${stats.maxGlucose}`, 'mg/dL', t('exportReports.minMax'), [249, 115, 22])
      this.drawStatCard(doc, margin + 135, yPos, 40, 25, readings.length, '', t('exportReports.totalReadings'), [107, 114, 128])
      yPos += 35

      yPos = this.ensurePageSpace(doc, yPos, 68)
      yPos = this.drawGlucoseTrendChart(doc, margin, yPos, readings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 56)
      yPos = this.drawTimeInRangeSection(doc, margin, yPos, readings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 58)
      yPos = this.drawHourlyDistribution(doc, margin, yPos, readings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 52)
      yPos = this.drawWeeklyTrend(doc, margin, yPos, readings, settings)
    } else {
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, yPos, 182, 28, 6, 6, 'F')
      doc.setFontSize(12)
      doc.setTextColor(55, 65, 81)
      doc.setFont('helvetica', 'bold')
      doc.text(t('exportReports.noDataInPeriod'), margin + 6, yPos + 14)
      yPos += 38
    }

    doc.addPage()
    yPos = 20
    doc.setFontSize(14)
    doc.setTextColor(18, 18, 18)
    doc.setFont('helvetica', 'bold')
    doc.text(t('exportReports.readingsDetail'), margin, yPos)
    yPos += 8

    const tableHeaders = [
      t('exportReports.csvHeaders.dateTime'),
      t('exportReports.csvHeaders.glucose'),
      t('exportReports.csvHeaders.trend')
    ]
    const tableBody = readings.map((r) => [
      new Date(r.timestamp).toLocaleString(loc),
      r.glucose,
      r.trend || '-'
    ])

    if (tableBody.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(t('common.noDataAvailable'), margin, yPos)
    } else {
      this.renderTable(doc, {
        startY: yPos,
        head: [tableHeaders],
        body: tableBody,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [228, 228, 231],
          textColor: [39, 39, 42]
        },
        headStyles: {
          fillColor: [18, 18, 18],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: yPos, right: margin, bottom: 15, left: margin },
        pageBreak: 'auto',
        theme: 'grid'
      })
    }

    this.drawPdfFooter(doc, `GliceChart - ${t('exportReports.glucoseTitle')}`)
    doc.save(`glucose_${this.getTimestamp()}.pdf`)
  }

  /**
   * Esporta record insulina
   * @param {Array} insulin - Record insulina
   * @param {string} format - 'csv' o 'pdf'
   * @param {Object} dateRange - Range date { start, end }
   */
  static exportInsulin(insulin, format = 'csv', dateRange = null) {
    const effectiveRange = this.getEffectiveDateRange(dateRange)
    const filteredInsulin = this.filterByDateRange(insulin, effectiveRange)
    const loc = this.getLocale()

    const colDateTime = t('exportReports.csvHeaders.dateTime')
    const colType = t('exportReports.csvHeaders.insulinType')
    const colUnits = t('exportReports.csvHeaders.units')

    const transform = (i) => ({
      [colDateTime]: new Date(i.timestamp).toLocaleString(loc),
      [colType]: i.type === 'rapid' ? t('home.rapid') : t('home.slow'),
      [colUnits]: i.units
    })

    const headers = [colDateTime, colType, colUnits]

    if (format === 'csv') {
      this.exportToCSV(filteredInsulin, 'insulin', {
        headers,
        transform
      })
    } else {
      this.exportToPDF(filteredInsulin, 'insulin', {
        title: t('exportReports.insulinTitle'),
        headers,
        transform,
        subtitle: t('exportReports.insulinSubtitle'),
        dateRange: effectiveRange
      })
    }
  }

  /**
   * Esporta record carboidrati
   * @param {Array} carbs - Record carboidrati
   * @param {string} format - 'csv' o 'pdf'
   * @param {Object} dateRange - Range date { start, end }
   */
  static exportCarbs(carbs, format = 'csv', dateRange = null) {
    const effectiveRange = this.getEffectiveDateRange(dateRange)
    const filteredCarbs = this.filterByDateRange(carbs, effectiveRange)
    const loc = this.getLocale()

    const colDateTime = t('exportReports.csvHeaders.dateTime')
    const colAmount = t('exportReports.csvHeaders.carbsAmount')

    const transform = (c) => ({
      [colDateTime]: new Date(c.timestamp).toLocaleString(loc),
      [colAmount]: c.amount
    })

    const headers = [colDateTime, colAmount]

    if (format === 'csv') {
      this.exportToCSV(filteredCarbs, 'carbs', {
        headers,
        transform
      })
    } else {
      this.exportToPDF(filteredCarbs, 'carbs', {
        title: t('exportReports.carbsTitle'),
        headers,
        transform,
        subtitle: t('exportReports.carbsSubtitle'),
        dateRange: effectiveRange
      })
    }
  }

  /**
   * Esporta note
   * @param {Array} notes - Note
   * @param {string} format - 'csv' o 'pdf'
   * @param {Object} dateRange - Range date { start, end }
   */
  static exportNotes(notes, format = 'csv', dateRange = null) {
    const effectiveRange = this.getEffectiveDateRange(dateRange)
    const filteredNotes = this.filterByDateRange(notes, effectiveRange)
    const loc = this.getLocale()

    const colDateTime = t('exportReports.csvHeaders.dateTime')
    const colText = t('exportReports.csvHeaders.noteText')

    const transform = (n) => ({
      [colDateTime]: new Date(n.timestamp).toLocaleString(loc),
      [colText]: n.text
    })

    const headers = [colDateTime, colText]

    if (format === 'csv') {
      this.exportToCSV(filteredNotes, 'notes', {
        headers,
        transform
      })
    } else {
      this.exportToPDF(filteredNotes, 'notes', {
        title: t('exportReports.notesTitle'),
        headers,
        transform,
        subtitle: t('exportReports.notesSubtitle'),
        dateRange: effectiveRange
      })
    }
  }

  /**
   * Esporta report completo (tutti i dati)
   * @param {Object} data - Dati completi { readings, insulin, carbs, notes }
   * @param {string} format - 'csv' o 'pdf'
   * @param {Object} dateRange - Range date { start, end }
   */
  static exportCompleteReport(data, format = 'pdf', dateRange = null) {
    const { readings, insulin, carbs, notes, settings } = data
    const effectiveRange = this.getEffectiveDateRange(dateRange)
    
    if (format === 'csv') {
      this.exportGlucoseReadings(readings, 'csv', effectiveRange, settings)
      this.exportInsulin(insulin, 'csv', effectiveRange)
      this.exportCarbs(carbs, 'csv', effectiveRange)
      this.exportNotes(notes, 'csv', effectiveRange)
    } else {
      this.exportCompletePDF(data, effectiveRange)
    }
  }

  /**
   * Crea PDF completo con multiple sezioni
   * @param {Object} data - Dati completi
   * @param {Object} dateRange - Range date
   */
  static exportCompletePDF(data, dateRange = null) {
    const { readings, insulin, carbs, notes, settings } = data
    const effectiveRange = this.getEffectiveDateRange(dateRange)
    const filteredReadings = this.filterByDateRange(readings, effectiveRange)
    const filteredInsulin = this.filterByDateRange(insulin, effectiveRange)
    const filteredCarbs = this.filterByDateRange(carbs, effectiveRange)
    const filteredNotes = this.filterByDateRange(notes, effectiveRange)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const loc = this.getLocale()

    let yPos = 0
    const pageHeight = doc.internal.pageSize.height
    const margin = 14
    yPos = this.drawPdfHeader(doc, {
      title: t('exportReports.fullReportTitle'),
      subtitle: t('exportReports.fullReportSubtitle'),
      count: filteredReadings.length,
      dateRange: effectiveRange
    }) + 6

    // Card statistiche visive
    if (filteredReadings.length > 0) {
      const stats = this.calculateGlucoseStats(filteredReadings, settings)
      yPos = this.ensurePageSpace(doc, yPos, 34)

      this.drawStatCard(doc, margin, yPos, 40, 25, stats.avgGlucose, 'mg/dL', t('exportReports.avgGlucose'), [99, 102, 241])
      this.drawStatCard(doc, margin + 45, yPos, 40, 25, `${stats.tir}%`, '', t('exportReports.tir'), [34, 197, 94])
      this.drawStatCard(doc, margin + 90, yPos, 40, 25, `${stats.minGlucose}/${stats.maxGlucose}`, 'mg/dL', t('exportReports.minMax'), [249, 115, 22])
      this.drawStatCard(doc, margin + 135, yPos, 40, 25, filteredReadings.length, '', t('exportReports.totalReadings'), [107, 114, 128])
      
      yPos += 35

      yPos = this.ensurePageSpace(doc, yPos, 68)
      yPos = this.drawGlucoseTrendChart(doc, margin, yPos, filteredReadings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 56)
      yPos = this.drawTimeInRangeSection(doc, margin, yPos, filteredReadings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 58)
      yPos = this.drawHourlyDistribution(doc, margin, yPos, filteredReadings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 52)
      yPos = this.drawWeeklyTrend(doc, margin, yPos, filteredReadings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 52)
      yPos = this.drawDistributionChart(doc, margin, yPos, filteredReadings, settings)

      yPos = this.ensurePageSpace(doc, yPos, 36)
      yPos = this.drawSummaryIcons(doc, margin, yPos, filteredReadings, filteredInsulin, filteredCarbs, filteredNotes)

      if (settings) {
        yPos = this.ensurePageSpace(doc, yPos, 28)
        yPos = this.drawSettingsSummary(doc, margin, yPos, settings)
      }
    } else {
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, yPos, 182, 30, 6, 6, 'F')
      doc.setFontSize(12)
      doc.setTextColor(55, 65, 81)
      doc.setFont('helvetica', 'bold')
      doc.text(t('exportReports.noDataInPeriod'), margin + 6, yPos + 14)
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'normal')
      doc.text(t('exportReports.noDataInPeriodHelp'), margin + 6, yPos + 21)
      yPos += 40
    }

    doc.addPage()
    yPos = 20

    // Funzione helper per aggiungere tabella
    const addTable = (title, tableData, headers, transform) => {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(18, 18, 18)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, yPos)
      yPos += 8

      const filteredData = transform ? tableData.map(transform) : tableData

      if (filteredData.length === 0) {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text(t('common.noDataAvailable'), margin, yPos)
        yPos += 10
        return
      }

      this.renderTable(doc, {
        startY: yPos,
        head: this.normalizeTableHead(headers),
        body: filteredData,
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [228, 228, 231],
          textColor: [39, 39, 42]
        },
        headStyles: { 
          fillColor: [18, 18, 18],
          textColor: 255, 
          fontStyle: 'bold',
          lineWidth: 0.2,
          lineColor: [39, 39, 42]
        },
        alternateRowStyles: { 
          fillColor: [248, 250, 252] 
        },
        margin: { top: yPos, right: margin, bottom: 15, left: margin },
        pageBreak: 'auto',
        theme: 'grid'
      })

      yPos = doc.lastAutoTable.finalY + 10
    }

    // Aggiungi tabelle
    addTable(t('exportReports.readingsDetail'), filteredReadings, [
      t('exportReports.csvHeaders.dateTime'),
      t('exportReports.csvHeaders.glucose'),
      t('exportReports.csvHeaders.trend')
    ], (r) => [
      new Date(r.timestamp).toLocaleString(loc),
      r.glucose,
      r.trend || '-'
    ])

    addTable(t('exportReports.insulinDetail'), filteredInsulin, [
      t('exportReports.csvHeaders.dateTime'),
      t('exportReports.csvHeaders.insulinType'),
      t('exportReports.csvHeaders.units')
    ], (i) => [
      new Date(i.timestamp).toLocaleString(loc),
      i.type === 'rapid' ? t('home.rapid') : t('home.slow'),
      i.units
    ])

    addTable(t('exportReports.carbsDetail'), filteredCarbs, [
      t('exportReports.csvHeaders.dateTime'),
      t('exportReports.csvHeaders.carbsAmount')
    ], (c) => [
      new Date(c.timestamp).toLocaleString(loc),
      c.amount
    ])

    addTable(t('exportReports.notesDetail'), filteredNotes, [
      t('exportReports.csvHeaders.dateTime'),
      t('exportReports.csvHeaders.noteText')
    ], (n) => [
      new Date(n.timestamp).toLocaleString(loc),
      n.text
    ])

    this.drawPdfFooter(doc, `GliceChart - ${t('exportReports.fullReportTitle')}`)

    doc.save(`glicechart_complete_report_${this.getTimestamp()}.pdf`)
  }

  static drawPdfHeader(doc, { title, subtitle, count, dateRange = null }) {
    const pageWidth = doc.internal.pageSize.width
    const margin = 14
    const effectiveRange = dateRange ? this.getEffectiveDateRange(dateRange) : null
    const loc = this.getLocale()

    doc.setFillColor(18, 18, 18)
    doc.rect(0, 0, pageWidth, 34, 'F')

    doc.setFillColor(29, 185, 84)
    doc.roundedRect(margin, 10, 18, 12, 4, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('GC', margin + 9, 17.5, { align: 'center' })

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(String(title), margin + 24, 16)

    doc.setFontSize(8)
    doc.setTextColor(212, 212, 216)
    doc.setFont('helvetica', 'normal')
    doc.text(String(subtitle), margin + 24, 23)
    doc.text(`${new Date().toLocaleDateString(loc)} ${new Date().toLocaleTimeString(loc)}`, margin + 24, 29)

    doc.setFillColor(255, 255, 255)
    doc.setTextColor(18, 18, 18)
    doc.roundedRect(pageWidth - 62, 9, 48, 9, 4, 4, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${count} items`, pageWidth - 38, 14.9, { align: 'center' })

    if (effectiveRange) {
      doc.setFillColor(39, 39, 42)
      doc.setTextColor(250, 250, 250)
      doc.roundedRect(pageWidth - 92, 21, 78, 9, 4, 4, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(this.formatDateRangeLabel(effectiveRange), pageWidth - 53, 26.8, { align: 'center' })
    }

    return 38
  }

  static drawPdfFooter(doc, label) {
    const pageCount = doc.internal.getNumberOfPages()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 14

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFillColor(250, 250, 250)
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
      doc.setDrawColor(229, 231, 235)
      doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12)

      doc.setFontSize(7)
      doc.setTextColor(113, 113, 122)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${i} / ${pageCount}`, margin, pageHeight - 5)
      doc.text(String(label), pageWidth - margin, pageHeight - 5, { align: 'right' })
    }
  }

  /**
   * Esporta impostazioni
   * @param {Object} settings - Impostazioni
   * @param {string} format - 'csv' o 'pdf'
   */
  static exportSettings(settings, format = 'csv') {
    const colParam = t('exportReports.csvHeaders.settingKey')
    const colVal = t('exportReports.csvHeaders.settingValue')

    const settingsRows = [
      { [colParam]: t('settings.minTarget'), [colVal]: settings.tir_min },
      { [colParam]: t('settings.maxTarget'), [colVal]: settings.tir_max },
      { [colParam]: t('settings.lowThreshold'), [colVal]: settings.red_under },
      { [colParam]: t('settings.highThreshold'), [colVal]: settings.red_over },
      { [colParam]: t('settings.rapidDuration'), [colVal]: settings.rapid_duration },
      { [colParam]: t('settings.slowDuration'), [colVal]: settings.slow_duration },
      { [colParam]: t('settings.carbDuration'), [colVal]: settings.carb_duration },
      { [colParam]: t('settings.insulinSensitivity'), [colVal]: settings.insulin_sensitivity },
      { [colParam]: t('settings.carbRatio'), [colVal]: settings.carb_ratio }
    ]

    const headers = [colParam, colVal]

    if (format === 'csv') {
      this.exportToCSV(settingsRows, 'settings', { headers })
    } else {
      this.exportToPDF(settingsRows, 'settings', {
        title: t('export.types.settings'),
        headers,
        subtitle: t('settings.subtitle')
      })
    }
  }

  static getDefaultLast30DaysRange() {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  static getEffectiveDateRange(dateRange) {
    if (dateRange?.start && dateRange?.end) {
      return dateRange
    }

    return this.getDefaultLast30DaysRange()
  }

  static formatDateRangeLabel(dateRange) {
    if (!dateRange?.start || !dateRange?.end) return t('export.default30DaysNote')
    const loc = this.getLocale()

    const start = new Date(dateRange.start).toLocaleDateString(loc)
    const end = new Date(dateRange.end).toLocaleDateString(loc)
    return `${start} - ${end}`
  }

  static filterByDateRange(data, dateRange) {
    if (!data || !Array.isArray(data)) return []
    if (!dateRange || !dateRange.start || !dateRange.end) {
      return data
    }

    const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0)
    const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999)

    return data.filter(item => {
      const itemDate = new Date(item.timestamp).getTime()
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  static extractHeaders(data) {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }

  static getTimestamp() {
    const now = new Date()
    return now.toISOString().slice(0, 10).replace(/-/g, '_')
  }

  static ensurePageSpace(doc, yPos, requiredHeight, topMargin = 20) {
    const pageHeight = doc.internal.pageSize.height
    if (yPos + requiredHeight > pageHeight - 20) {
      doc.addPage()
      return topMargin
    }

    return yPos
  }

  static calculateGlucoseStats(readings, settings) {
    const tirMin = settings?.tir_min || 70
    const tirMax = settings?.tir_max || 180
    const lowCount = readings.filter(r => r.glucose < tirMin).length
    const inRangeCount = readings.filter(r => r.glucose >= tirMin && r.glucose <= tirMax).length
    const highCount = readings.filter(r => r.glucose > tirMax).length

    return {
      avgGlucose: Math.round(readings.reduce((sum, r) => sum + Number(r.glucose || 0), 0) / (readings.length || 1)),
      minGlucose: readings.length ? Math.min(...readings.map(r => Number(r.glucose || 0))) : 0,
      maxGlucose: readings.length ? Math.max(...readings.map(r => Number(r.glucose || 0))) : 0,
      tir: Math.round((inRangeCount / (readings.length || 1)) * 100),
      lowCount,
      inRangeCount,
      highCount,
      lowPercentage: Math.round((lowCount / (readings.length || 1)) * 100),
      inRangePercentage: Math.round((inRangeCount / (readings.length || 1)) * 100),
      highPercentage: Math.round((highCount / (readings.length || 1)) * 100),
      tirMin,
      tirMax
    }
  }

  static drawStatCard(doc, x, y, width, height, value, unit, label, color) {
    doc.setFillColor(24, 24, 27)
    doc.roundedRect(x, y, width, height, 3, 3, 'F')
    
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(x + 3, y + 3, 3, height - 6, 1.5, 1.5, 'F')
    
    doc.setFontSize(7)
    doc.setTextColor(161, 161, 170)
    doc.setFont('helvetica', 'normal')
    doc.text(String(label), x + 9, y + 9)
    
    doc.setFontSize(16)
    doc.setTextColor(250, 250, 250)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value), x + 9, y + 18)
    
    if (unit) {
      doc.setFontSize(8)
      doc.setTextColor(color[0], color[1], color[2])
      doc.setFont('helvetica', 'normal')
      doc.text(String(unit), x + width - 4, y + 18, { align: 'right' })
    }
  }

  static drawTimeInRangeSection(doc, x, y, readings, settings) {
    const stats = this.calculateGlucoseStats(readings, settings)

    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text(t('exportReports.timeInRangeBreakdown'), x, y)
    y += 6

    doc.setFillColor(18, 18, 18)
    doc.roundedRect(x, y, 182, 42, 6, 6, 'F')

    doc.setFillColor(29, 185, 84)
    doc.roundedRect(x + 4, y + 4, 44, 34, 5, 5, 'F')
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(`${stats.tir}%`, x + 26, y + 18, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(t('charts.inRange'), x + 26, y + 25, { align: 'center' })
    doc.text(`${stats.inRangeCount}/${readings.length}`, x + 26, y + 31, { align: 'center' })

    const rows = [
      { label: `${t('charts.low')} < ${stats.tirMin}`, percentage: stats.lowPercentage, count: stats.lowCount, color: [239, 68, 68] },
      { label: `${t('charts.inRange')} ${stats.tirMin}-${stats.tirMax}`, percentage: stats.inRangePercentage, count: stats.inRangeCount, color: [34, 197, 94] },
      { label: `${t('charts.high')} > ${stats.tirMax}`, percentage: stats.highPercentage, count: stats.highCount, color: [249, 115, 22] }
    ]

    rows.forEach((row, index) => {
      const rowY = y + 8 + index * 10
      const barX = x + 60
      const barWidth = 92

      doc.setFontSize(7)
      doc.setTextColor(244, 244, 245)
      doc.setFont('helvetica', 'bold')
      doc.text(row.label, barX, rowY)
      doc.text(`${row.percentage}%`, x + 170, rowY, { align: 'right' })

      doc.setFillColor(63, 63, 70)
      doc.roundedRect(barX, rowY + 2, barWidth, 3.5, 1.5, 1.5, 'F')

      const filledWidth = Math.max(2, (barWidth * row.percentage) / 100)
      doc.setFillColor(row.color[0], row.color[1], row.color[2])
      doc.roundedRect(barX, rowY + 2, filledWidth, 3.5, 1.5, 1.5, 'F')

      doc.setFontSize(6)
      doc.setTextColor(161, 161, 170)
      doc.setFont('helvetica', 'normal')
      doc.text(`${row.count}`, x + 170, rowY + 5.8, { align: 'right' })
    })

    return y + 50
  }

  static downsampleReadings(readings, maxPoints = 80) {
    if (readings.length <= maxPoints) return readings

    const step = Math.ceil(readings.length / maxPoints)
    const result = []

    for (let i = 0; i < readings.length; i += step) {
      result.push(readings[i])
    }

    const last = readings[readings.length - 1]
    if (result[result.length - 1] !== last) {
      result.push(last)
    }

    return result
  }

  static drawGlucoseTrendChart(doc, x, y, readings, settings) {
    const tirMin = settings?.tir_min || 70
    const tirMax = settings?.tir_max || 180
    const chartWidth = 182
    const chartHeight = 58
    const loc = this.getLocale()

    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text(t('charts.currentTrend'), x, y)
    y += 6

    const chartY = y
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, chartY, chartWidth, chartHeight, 6, 6, 'F')

    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    const points = this.downsampleReadings(sorted, 90)
    const glucoseValues = points.map((p) => Number(p.glucose))
    const minG = Math.max(40, Math.min(...glucoseValues, tirMin) - 15)
    const maxG = Math.min(400, Math.max(...glucoseValues, tirMax) + 15)
    const rangeG = maxG - minG || 1

    const padLeft = 14
    const padRight = 8
    const padTop = 8
    const padBottom = 12
    const plotW = chartWidth - padLeft - padRight
    const plotH = chartHeight - padTop - padBottom
    const plotX = x + padLeft
    const plotY = chartY + padTop

    const valueToY = (value) => plotY + plotH - ((value - minG) / rangeG) * plotH

    const tirTopY = valueToY(tirMax)
    const tirBottomY = valueToY(tirMin)
    doc.setFillColor(220, 252, 231)
    doc.rect(plotX, tirTopY, plotW, tirBottomY - tirTopY, 'F')

    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.1)
    ;[tirMax, tirMin].forEach((level) => {
      const lineY = valueToY(level)
      doc.line(plotX, lineY, plotX + plotW, lineY)
    })

    doc.setDrawColor(99, 102, 241)
    doc.setLineWidth(0.5)
    points.forEach((point, index) => {
      const px = plotX + (index / Math.max(points.length - 1, 1)) * plotW
      const py = valueToY(Number(point.glucose))

      if (index > 0) {
        const prev = points[index - 1]
        const prevX = plotX + ((index - 1) / Math.max(points.length - 1, 1)) * plotW
        const prevY = valueToY(Number(prev.glucose))
        doc.line(prevX, prevY, px, py)
      }

      doc.setFillColor(99, 102, 241)
      doc.circle(px, py, index === points.length - 1 ? 1.2 : 0.6, 'F')
    })

    doc.setFontSize(6)
    doc.setTextColor(113, 113, 122)
    doc.setFont('helvetica', 'normal')
    doc.text(String(Math.round(maxG)), plotX - 2, plotY + 2, { align: 'right' })
    doc.text(String(tirMax), plotX - 2, tirTopY + 2, { align: 'right' })
    doc.text(String(tirMin), plotX - 2, tirBottomY + 2, { align: 'right' })
    doc.text(String(Math.round(minG)), plotX - 2, plotY + plotH, { align: 'right' })

    const firstDate = new Date(points[0].timestamp).toLocaleDateString(loc, { day: '2-digit', month: 'short' })
    const lastDate = new Date(points[points.length - 1].timestamp).toLocaleDateString(loc, { day: '2-digit', month: 'short' })
    doc.text(firstDate, plotX, chartY + chartHeight - 2)
    doc.text(lastDate, plotX + plotW, chartY + chartHeight - 2, { align: 'right' })

    doc.setFontSize(6)
    doc.setTextColor(34, 197, 94)
    doc.text(`Target ${tirMin}-${tirMax} mg/dL`, plotX + plotW, chartY + 5, { align: 'right' })

    return chartY + chartHeight + 8
  }

  static drawSettingsSummary(doc, x, y, settings) {
    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text(t('settings.title'), x, y)
    y += 6

    const items = [
      { label: t('settings.tirCardTitle'), value: `${settings.tir_min}-${settings.tir_max} mg/dL` },
      { label: t('settings.insulinSensitivity'), value: `${settings.insulin_sensitivity} mg/dL/U` },
      { label: t('settings.carbRatio'), value: `1U / ${settings.carb_ratio}g` },
      { label: t('settings.rapidDuration') + ' / ' + t('settings.slowDuration'), value: `${settings.rapid_duration}h / ${settings.slow_duration}h` }
    ]

    items.forEach((item, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const cardX = x + col * 93
      const cardY = y + row * 12

      doc.setFillColor(24, 24, 27)
      doc.roundedRect(cardX, cardY, 88, 10, 2, 2, 'F')
      doc.setFontSize(6)
      doc.setTextColor(161, 161, 170)
      doc.setFont('helvetica', 'normal')
      doc.text(item.label, cardX + 3, cardY + 4)
      doc.setFontSize(7)
      doc.setTextColor(250, 250, 250)
      doc.setFont('helvetica', 'bold')
      doc.text(item.value, cardX + 3, cardY + 8.5)
    })

    return y + 26
  }

  static drawDistributionChart(doc, x, y, readings, settings) {
    const tirMin = settings?.tir_min || 70
    const tirMax = settings?.tir_max || 180
    
    const ranges = [
      { label: `${t('charts.low')} (<${tirMin})`, min: 0, max: tirMin - 1, color: [239, 68, 68] },
      { label: `${t('charts.inRange')} (${tirMin}-${tirMax})`, min: tirMin, max: tirMax, color: [34, 197, 94] },
      { label: `${t('charts.high')} (>${tirMax})`, min: tirMax + 1, max: 400, color: [249, 115, 22] }
    ]
    
    const distribution = ranges.map(range => {
      const count = readings.filter(r => r.glucose >= range.min && r.glucose <= range.max).length
      return { ...range, count, percentage: readings.length > 0 ? Math.round((count / readings.length) * 100) : 0 }
    })
    
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text(t('exportReports.timeInRangeBreakdown'), x, y)
    y += 8
    
    const barWidth = 50
    const barHeight = 30
    const gap = 15
    const startX = x
    const maxCount = Math.max(...distribution.map(d => d.count), 1)
    
    distribution.forEach((item, index) => {
      const barX = startX + index * (barWidth + gap)
      const barY = y
      
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(barX, barY, barWidth, barHeight, 3, 3, 'F')
      
      const fillHeight = maxCount > 0 ? (item.count / maxCount) * (barHeight - 8) : 0
      if (fillHeight > 0) {
        doc.setFillColor(item.color[0], item.color[1], item.color[2])
        doc.roundedRect(barX, barY + barHeight - fillHeight - 4, barWidth, fillHeight, 2, 2, 'F')
      }
      
      doc.setFontSize(6)
      doc.setTextColor(80, 80, 80)
      doc.setFont('helvetica', 'normal')
      doc.text(item.label, barX + barWidth / 2, barY + barHeight + 5, { align: 'center' })
      
      doc.setFontSize(8)
      doc.setTextColor(item.color[0], item.color[1], item.color[2])
      doc.setFont('helvetica', 'bold')
      doc.text(`${item.percentage}%`, barX + barWidth / 2, barY - 2, { align: 'center' })
    })
    
    return y + barHeight + 15
  }

  static drawHourlyDistribution(doc, x, y, readings, settings) {
    const timeRanges = [
      { label: '00-04', start: 0, end: 4 },
      { label: '04-08', start: 4, end: 8 },
      { label: '08-12', start: 8, end: 12 },
      { label: '12-16', start: 12, end: 16 },
      { label: '16-20', start: 16, end: 20 },
      { label: '20-24', start: 20, end: 24 }
    ]
    
    const hourlyData = timeRanges.map(range => {
      const readingsInRange = readings.filter(r => {
        const hour = new Date(r.timestamp).getHours()
        return hour >= range.start && hour < range.end
      })
      const avg = readingsInRange.length > 0 
        ? Math.round(readingsInRange.reduce((sum, r) => sum + r.glucose, 0) / readingsInRange.length)
        : 0
      return { ...range, avg, count: readingsInRange.length }
    })
    
    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text(t('exportReports.hourlyDistribution'), x, y)
    y += 6

    const chartWidth = 182
    const chartHeight = 42
    const chartY = y
    const barBaseY = chartY + 30
    const maxAvg = Math.max(...hourlyData.map(d => d.avg), 200)
    const tirMin = settings?.tir_min || 70
    const tirMax = settings?.tir_max || 180

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, chartY, chartWidth, chartHeight, 6, 6, 'F')

    hourlyData.forEach((item, index) => {
      const barX = x + 10 + index * 28
      const barHeight = item.avg > 0 ? Math.max(3, ((item.avg / maxAvg) * 20)) : 2
      const color = this.getGlucoseColor(item.avg, tirMin, tirMax)

      doc.setFillColor(228, 228, 231)
      doc.roundedRect(barX, chartY + 8, 16, 22, 3, 3, 'F')

      if (item.avg > 0) {
        doc.setFillColor(color[0], color[1], color[2])
        doc.roundedRect(barX, barBaseY - barHeight, 16, barHeight, 3, 3, 'F')
      }

      doc.setFontSize(7)
      doc.setTextColor(24, 24, 27)
      doc.setFont('helvetica', 'bold')
      doc.text(item.avg > 0 ? String(item.avg) : '--', barX + 8, chartY + 6, { align: 'center' })

      doc.setFontSize(6)
      doc.setTextColor(82, 82, 91)
      doc.setFont('helvetica', 'normal')
      doc.text(item.label, barX + 8, chartY + 36, { align: 'center' })
    })

    return chartY + chartHeight + 8
  }

  static drawWeeklyTrend(doc, x, y, readings, settings = {}) {
    const tirMin = settings?.tir_min || 70
    const tirMax = settings?.tir_max || 180
    const isEn = getLanguage() === 'en'
    const days = isEn 
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

    const weeklyData = days.map((day, index) => {
      const dayReadings = readings.filter(r => new Date(r.timestamp).getDay() === index)
      const avg = dayReadings.length > 0 
        ? Math.round(dayReadings.reduce((sum, r) => sum + r.glucose, 0) / dayReadings.length)
        : 0
      return { day, avg, count: dayReadings.length }
    })
    
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text(t('exportReports.weeklyTrend'), x, y)
    y += 8
    
    const chartHeight = 35
    const startX = x
    const barWidth = 18
    const gap = 7
    
    const maxAvg = Math.max(...weeklyData.filter(d => d.avg > 0).map(d => d.avg), 200)
    
    weeklyData.forEach((item, index) => {
      const barX = startX + index * (barWidth + gap)
      const barY = y + chartHeight
      
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(barX, y, barWidth, chartHeight, 2, 2, 'F')
      
      if (item.avg > 0) {
        const fillHeight = (item.avg / maxAvg) * (chartHeight - 8)
        const color = this.getGlucoseColor(item.avg, tirMin, tirMax)
        
        doc.setFillColor(color[0], color[1], color[2])
        doc.roundedRect(barX, barY - fillHeight - 4, barWidth, fillHeight, 2, 2, 'F')
        
        doc.setFontSize(7)
        doc.setTextColor(color[0], color[1], color[2])
        doc.setFont('helvetica', 'bold')
        doc.text(String(item.avg), barX + barWidth / 2, barY - fillHeight - 7, { align: 'center' })
      }
      
      doc.setFontSize(6)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(item.day, barX + barWidth / 2, barY + 5, { align: 'center' })
    })
    
    return y + chartHeight + 15
  }

  static drawSummaryIcons(doc, x, y, readings, insulin, carbs, notes) {
    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text(t('exportReports.fullReportTitle'), x, y)
    y += 6
    
    const totalInsulin = insulin.reduce((sum, i) => sum + Number(i.units || 0), 0)
    const totalCarbs = carbs.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const rapidInsulin = insulin.filter(i => i.type === 'rapid').reduce((sum, i) => sum + Number(i.units || 0), 0)
    const slowInsulin = insulin.filter(i => i.type === 'slow').reduce((sum, i) => sum + Number(i.units || 0), 0)

    this.drawMiniMetricCard(doc, x, y, 42, 24, totalInsulin.toFixed(1), 'U', t('exportReports.insulinTitle'), [99, 102, 241])
    this.drawMiniMetricCard(doc, x + 46, y, 42, 24, String(totalCarbs), 'g', t('exportReports.carbsTitle'), [249, 115, 22])
    this.drawMiniMetricCard(doc, x + 92, y, 42, 24, String(notes.length), '#', t('exportReports.notesTitle'), [107, 114, 128])
    this.drawMiniMetricCard(doc, x + 138, y, 42, 24, `${rapidInsulin.toFixed(1)}/${slowInsulin.toFixed(1)}`, 'U', `${t('home.rapid')}/${t('home.slow')}`, [34, 197, 94])

    return y + 32
  }

  static drawMiniMetricCard(doc, x, y, width, height, value, suffix, label, color) {
    doc.setFillColor(24, 24, 27)
    doc.roundedRect(x, y, width, height, 4, 4, 'F')
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(x, y, width, 3, 2, 2, 'F')

    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value), x + 4, y + 11)

    doc.setFontSize(6)
    doc.setTextColor(color[0], color[1], color[2])
    doc.setFont('helvetica', 'normal')
    doc.text(String(suffix), x + 4, y + 16)

    doc.setFontSize(6)
    doc.setTextColor(161, 161, 170)
    doc.text(String(label), x + 4, y + 21)
  }

  static getGlucoseColor(value, tirMin, tirMax) {
    if (!value || Number(value) <= 0) return [99, 102, 241]
    if (value < tirMin) return [239, 68, 68]
    if (value > tirMax) return [249, 115, 22]
    return [34, 197, 94]
  }
}

export default ExportService
