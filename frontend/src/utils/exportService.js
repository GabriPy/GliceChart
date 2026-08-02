import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

/**
 * Servizio per export dati in CSV e PDF
 * Supporta export di glicemia, insulina, carboidrati, note e impostazioni
 */

class ExportService {
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
      transform = null,
      dateFormat = 'it-IT'
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
      title = 'Report Dati',
      headers = null,
      transform = null,
      columns = null,
      pageSize = 'a4',
      orientation = 'portrait',
      styles = {},
      subtitle = 'Esportazione dati',
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
      doc.text('Nessun dato nel periodo selezionato', 20, headerBottom + 20)
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'normal')
      doc.text('Prova ad ampliare il periodo o verifica che siano presenti record da esportare.', 20, headerBottom + 27)
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
    
    const transform = (r) => ({
      'Data/Ora': new Date(r.timestamp).toLocaleString('it-IT'),
      'Glicemia (mg/dL)': r.glucose,
      'Trend': r.trend,
      'Trend Raw': r.raw_trend || ''
    })

    const headers = ['Data/Ora', 'Glicemia (mg/dL)', 'Trend', 'Trend Raw']

    if (format === 'csv') {
      this.exportToCSV(filteredReadings, 'glicemia', {
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
    let yPos = this.drawPdfHeader(doc, {
      title: 'Report Glicemia',
      subtitle: 'Andamento glicemico con statistiche e grafici',
      count: readings.length,
      dateRange
    }) + 6

    if (readings.length > 0) {
      const stats = this.calculateGlucoseStats(readings, settings)
      yPos = this.ensurePageSpace(doc, yPos, 34)
      this.drawStatCard(doc, margin, yPos, 40, 25, stats.avgGlucose, 'mg/dL', 'Media Glicemia', [99, 102, 241])
      this.drawStatCard(doc, margin + 45, yPos, 40, 25, `${stats.tir}%`, '', 'Time in Range', [34, 197, 94])
      this.drawStatCard(doc, margin + 90, yPos, 40, 25, `${stats.minGlucose}/${stats.maxGlucose}`, 'mg/dL', 'Min / Max', [249, 115, 22])
      this.drawStatCard(doc, margin + 135, yPos, 40, 25, readings.length, '', 'Totale Letture', [107, 114, 128])
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
      doc.text('Nessun dato nel periodo selezionato', margin + 6, yPos + 14)
      yPos += 38
    }

    doc.addPage()
    yPos = 20
    doc.setFontSize(14)
    doc.setTextColor(18, 18, 18)
    doc.setFont('helvetica', 'bold')
    doc.text('Dettaglio Letture', margin, yPos)
    yPos += 8

    const tableHeaders = ['Data/Ora', 'Glicemia (mg/dL)', 'Trend']
    const tableBody = readings.map((r) => [
      new Date(r.timestamp).toLocaleString('it-IT'),
      r.glucose,
      r.trend || '-'
    ])

    if (tableBody.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text('Nessun dato disponibile', margin, yPos)
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

    this.drawPdfFooter(doc, 'GliceChart - Report Glicemia')
    doc.save(`glicemia_${this.getTimestamp()}.pdf`)
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
    
    const transform = (i) => ({
      'Data/Ora': new Date(i.timestamp).toLocaleString('it-IT'),
      'Tipo': i.type === 'rapid' ? 'Rapida' : 'Lenta',
      'Unità': i.units
    })

    const headers = ['Data/Ora', 'Tipo', 'Unità']

    if (format === 'csv') {
      this.exportToCSV(filteredInsulin, 'insulina', {
        headers,
        transform
      })
    } else {
      this.exportToPDF(filteredInsulin, 'insulina', {
        title: 'Report Insulina',
        headers,
        transform,
        subtitle: 'Somministrazioni registrate',
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
    
    const transform = (c) => ({
      'Data/Ora': new Date(c.timestamp).toLocaleString('it-IT'),
      'Carboidrati (g)': c.amount
    })

    const headers = ['Data/Ora', 'Carboidrati (g)']

    if (format === 'csv') {
      this.exportToCSV(filteredCarbs, 'carboidrati', {
        headers,
        transform
      })
    } else {
      this.exportToPDF(filteredCarbs, 'carboidrati', {
        title: 'Report Carboidrati',
        headers,
        transform,
        subtitle: 'Carboidrati registrati',
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
    
    const transform = (n) => ({
      'Data/Ora': new Date(n.timestamp).toLocaleString('it-IT'),
      'Nota': n.text
    })

    const headers = ['Data/Ora', 'Nota']

    if (format === 'csv') {
      this.exportToCSV(filteredNotes, 'note', {
        headers,
        transform
      })
    } else {
      this.exportToPDF(filteredNotes, 'note', {
        title: 'Report Note',
        headers,
        transform,
        subtitle: 'Note registrate',
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
      // Per CSV, crea file separati
      this.exportGlucoseReadings(readings, 'csv', effectiveRange, settings)
      this.exportInsulin(insulin, 'csv', effectiveRange)
      this.exportCarbs(carbs, 'csv', effectiveRange)
      this.exportNotes(notes, 'csv', effectiveRange)
    } else {
      // Per PDF, crea un report multi-sezione
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

    let yPos = 0
    const pageHeight = doc.internal.pageSize.height
    const margin = 14
    yPos = this.drawPdfHeader(doc, {
      title: 'GliceChart',
      subtitle: 'Report completo in stile dashboard',
      count: filteredReadings.length,
      dateRange: effectiveRange
    }) + 6

    // Card statistiche visive
    if (filteredReadings.length > 0) {
      const stats = this.calculateGlucoseStats(filteredReadings, settings)
      yPos = this.ensurePageSpace(doc, yPos, 34)

      // Card 1: Media Glicemia
      this.drawStatCard(doc, margin, yPos, 40, 25, stats.avgGlucose, 'mg/dL', 'Media Glicemia', [99, 102, 241])
      
      // Card 2: TIR
      this.drawStatCard(doc, margin + 45, yPos, 40, 25, `${stats.tir}%`, '', 'Time in Range', [34, 197, 94])
      
      // Card 3: Min/Max
      this.drawStatCard(doc, margin + 90, yPos, 40, 25, `${stats.minGlucose}/${stats.maxGlucose}`, 'mg/dL', 'Min / Max', [249, 115, 22])
      
      // Card 4: Record totali
      this.drawStatCard(doc, margin + 135, yPos, 40, 25, filteredReadings.length, '', 'Totale Letture', [107, 114, 128])
      
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
      doc.text('Nessuna lettura glicemica negli ultimi 30 giorni', margin + 6, yPos + 14)
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'normal')
      doc.text('Le tabelle sottostanti mostreranno solo i dati presenti nel periodo effettivo di export.', margin + 6, yPos + 21)
      yPos += 40
    }

    yPos = this.ensurePageSpace(doc, yPos, 20)
    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text('Riepilogo Dati Esportati', margin, yPos)
    yPos += 7

    doc.setFontSize(9)
    doc.setTextColor(82, 82, 91)
    doc.setFont('helvetica', 'normal')
    doc.text(`Letture glicemia: ${filteredReadings.length}`, margin, yPos)
    yPos += 5
    doc.text(`Insulina: ${filteredInsulin.length} record`, margin, yPos)
    yPos += 5
    doc.text(`Carboidrati: ${filteredCarbs.length} record`, margin, yPos)
    yPos += 5
    doc.text(`Note: ${filteredNotes.length} record`, margin, yPos)

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
        doc.text('Nessun dato disponibile', margin, yPos)
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
    addTable('Glicemia', filteredReadings, ['Data/Ora', 'Glicemia', 'Trend'], (r) => [
      new Date(r.timestamp).toLocaleString('it-IT'),
      r.glucose,
      r.trend
    ])

    addTable('Insulina', filteredInsulin, ['Data/Ora', 'Tipo', 'Unità'], (i) => [
      new Date(i.timestamp).toLocaleString('it-IT'),
      i.type === 'rapid' ? 'Rapida' : 'Lenta',
      i.units
    ])

    addTable('Carboidrati', filteredCarbs, ['Data/Ora', 'Grammi'], (c) => [
      new Date(c.timestamp).toLocaleString('it-IT'),
      c.amount
    ])

    addTable('Note', filteredNotes, ['Data/Ora', 'Nota'], (n) => [
      new Date(n.timestamp).toLocaleString('it-IT'),
      n.text
    ])

    this.drawPdfFooter(doc, 'GliceChart - Report Completo')

    doc.save(`glicechart_report_completo_${this.getTimestamp()}.pdf`)
  }

  static drawPdfHeader(doc, { title, subtitle, count, dateRange = null }) {
    const pageWidth = doc.internal.pageSize.width
    const margin = 14
    const effectiveRange = dateRange ? this.getEffectiveDateRange(dateRange) : null

    doc.setFillColor(18, 18, 18)
    doc.rect(0, 0, pageWidth, 34, 'F')

    doc.setFillColor(29, 185, 84)
    doc.roundedRect(margin, 10, 18, 12, 4, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('GC', margin + 9, 17.5, { align: 'center' })

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(String(title), margin + 24, 16)

    doc.setFontSize(9)
    doc.setTextColor(212, 212, 216)
    doc.setFont('helvetica', 'normal')
    doc.text(String(subtitle), margin + 24, 23)
    doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, margin + 24, 29)

    doc.setFillColor(255, 255, 255)
    doc.setTextColor(18, 18, 18)
    doc.roundedRect(pageWidth - 62, 9, 48, 9, 4, 4, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${count} record`, pageWidth - 38, 14.9, { align: 'center' })

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
      doc.text(`Pagina ${i} di ${pageCount}`, margin, pageHeight - 5)
      doc.text(String(label), pageWidth - margin, pageHeight - 5, { align: 'right' })
    }
  }

  /**
   * Esporta impostazioni
   * @param {Object} settings - Impostazioni
   * @param {string} format - 'csv' o 'pdf'
   */
  static exportSettings(settings, format = 'csv') {
    const settingsRows = [
      { 'Parametro': 'TIR Minimo', 'Valore': settings.tir_min },
      { 'Parametro': 'TIR Massimo', 'Valore': settings.tir_max },
      { 'Parametro': 'Soglia Rossa Sotto', 'Valore': settings.red_under },
      { 'Parametro': 'Soglia Rossa Sopra', 'Valore': settings.red_over },
      { 'Parametro': 'Durata Insulina Rapida (ore)', 'Valore': settings.rapid_duration },
      { 'Parametro': 'Durata Insulina Lenta (ore)', 'Valore': settings.slow_duration },
      { 'Parametro': 'Durata Carboidrati (ore)', 'Valore': settings.carb_duration },
      { 'Parametro': 'Sensibilità Insulina', 'Valore': settings.insulin_sensitivity },
      { 'Parametro': 'Ratio Carboidrati', 'Valore': settings.carb_ratio }
    ]

    const headers = ['Parametro', 'Valore']

    if (format === 'csv') {
      this.exportToCSV(settingsRows, 'impostazioni', { headers })
    } else {
      this.exportToPDF(settingsRows, 'impostazioni', {
        title: 'Report Impostazioni',
        headers,
        subtitle: 'Configurazione corrente dell\'app'
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
    if (!dateRange?.start || !dateRange?.end) return 'Ultimi 30 giorni'

    const start = new Date(dateRange.start).toLocaleDateString('it-IT')
    const end = new Date(dateRange.end).toLocaleDateString('it-IT')
    return `${start} - ${end}`
  }

  /**
   * Filtra dati per range di date
   * @param {Array} data - Dati da filtrare
   * @param {Object} dateRange - { start, end } in formato YYYY-MM-DD
   */
  static filterByDateRange(data, dateRange) {
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

  /**
   * Estrae headers dai dati
   * @param {Array} data - Dati
   */
  static extractHeaders(data) {
    if (data.length === 0) return []
    return Object.keys(data[0])
  }

  /**
   * Genera timestamp per filename
   */
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
      avgGlucose: Math.round(readings.reduce((sum, r) => sum + Number(r.glucose || 0), 0) / readings.length),
      minGlucose: Math.min(...readings.map(r => Number(r.glucose || 0))),
      maxGlucose: Math.max(...readings.map(r => Number(r.glucose || 0))),
      tir: Math.round((inRangeCount / readings.length) * 100),
      lowCount,
      inRangeCount,
      highCount,
      lowPercentage: Math.round((lowCount / readings.length) * 100),
      inRangePercentage: Math.round((inRangeCount / readings.length) * 100),
      highPercentage: Math.round((highCount / readings.length) * 100),
      tirMin,
      tirMax
    }
  }

  /**
   * Disegna una card statistica nel PDF
   * @param {Object} doc - Documento jsPDF
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   * @param {number} width - Larghezza card
   * @param {number} height - Altezza card
   * @param {string} value - Valore principale
   * @param {string} unit - Unità di misura
   * @param {string} label - Etichetta
   * @param {Array} color - Colore [R, G, B]
   */
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
    doc.text('Time In Range', x, y)
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
    doc.text('nel target', x + 26, y + 25, { align: 'center' })
    doc.text(`${stats.inRangeCount}/${readings.length} letture`, x + 26, y + 31, { align: 'center' })

    const rows = [
      { label: `Bassi < ${stats.tirMin}`, percentage: stats.lowPercentage, count: stats.lowCount, color: [239, 68, 68] },
      { label: `In range ${stats.tirMin}-${stats.tirMax}`, percentage: stats.inRangePercentage, count: stats.inRangeCount, color: [34, 197, 94] },
      { label: `Alti > ${stats.tirMax}`, percentage: stats.highPercentage, count: stats.highCount, color: [249, 115, 22] }
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
      doc.text(`${row.count} letture`, x + 170, rowY + 5.8, { align: 'right' })
    })

    return y + 50
  }

  /**
   * Disegna grafico distribuzione glicemia
   * @param {Object} doc - Documento jsPDF
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   * @param {Array} readings - Letture glicemiche
   * @param {Object} settings - Impostazioni
   * @returns {number} Nuova posizione Y
   */
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

    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text('Andamento Glicemico', x, y)
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

    const firstDate = new Date(points[0].timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    const lastDate = new Date(points[points.length - 1].timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
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
    doc.text('Parametri Terapeutici', x, y)
    y += 6

    const items = [
      { label: 'Target glicemia', value: `${settings.tir_min}-${settings.tir_max} mg/dL` },
      { label: 'Sensibilita insulina', value: `${settings.insulin_sensitivity} mg/dL/U` },
      { label: 'Ratio carboidrati', value: `1U / ${settings.carb_ratio}g` },
      { label: 'Insulina rapida/lenta', value: `${settings.rapid_duration}h / ${settings.slow_duration}h` }
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
    
    // Calcola distribuzione
    const ranges = [
      { label: 'Basso (<70)', min: 0, max: tirMin - 1, color: [239, 68, 68] },
      { label: 'Target (70-180)', min: tirMin, max: tirMax, color: [34, 197, 94] },
      { label: 'Alto (>180)', min: tirMax + 1, max: 400, color: [249, 115, 22] }
    ]
    
    const distribution = ranges.map(range => {
      const count = readings.filter(r => r.glucose >= range.min && r.glucose <= range.max).length
      return { ...range, count, percentage: readings.length > 0 ? Math.round((count / readings.length) * 100) : 0 }
    })
    
    // Titolo
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text('Distribuzione Glicemia', x, y)
    y += 8
    
    // Disegna barre
    const barWidth = 50
    const barHeight = 30
    const gap = 15
    const startX = x
    const maxCount = Math.max(...distribution.map(d => d.count))
    
    distribution.forEach((item, index) => {
      const barX = startX + index * (barWidth + gap)
      const barY = y
      
      // Background bar
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(barX, barY, barWidth, barHeight, 3, 3, 'F')
      
      // Value bar (proporzionale)
      const fillHeight = maxCount > 0 ? (item.count / maxCount) * (barHeight - 8) : 0
      if (fillHeight > 0) {
        doc.setFillColor(item.color[0], item.color[1], item.color[2])
        doc.roundedRect(barX, barY + barHeight - fillHeight - 4, barWidth, fillHeight, 2, 2, 'F')
      }
      
      // Label sotto
      doc.setFontSize(6)
      doc.setTextColor(80, 80, 80)
      doc.setFont('helvetica', 'normal')
      doc.text(item.label, barX + barWidth / 2, barY + barHeight + 5, { align: 'center' })
      
      // Percentuale sopra
      doc.setFontSize(8)
      doc.setTextColor(item.color[0], item.color[1], item.color[2])
      doc.setFont('helvetica', 'bold')
      doc.text(`${item.percentage}%`, barX + barWidth / 2, barY - 2, { align: 'center' })
    })
    
    return y + barHeight + 15
  }

  /**
   * Disegna grafico distribuzione oraria
   * @param {Object} doc - Documento jsPDF
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   * @param {Array} readings - Letture glicemiche
   * @returns {number} Nuova posizione Y
   */
  static drawHourlyDistribution(doc, x, y, readings, settings) {
    // Dividi in 6 fasce orarie (4 ore ciascuna)
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
    doc.text('Distribuzione Oraria', x, y)
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

  /**
   * Disegna grafico trend settimanale
   * @param {Object} doc - Documento jsPDF
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   * @param {Array} readings - Letture glicemiche
   * @returns {number} Nuova posizione Y
   */
  static drawWeeklyTrend(doc, x, y, readings, settings = {}) {
    const tirMin = settings?.tir_min || 70
    const tirMax = settings?.tir_max || 180
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    const weeklyData = days.map((day, index) => {
      const dayReadings = readings.filter(r => new Date(r.timestamp).getDay() === index)
      const avg = dayReadings.length > 0 
        ? Math.round(dayReadings.reduce((sum, r) => sum + r.glucose, 0) / dayReadings.length)
        : 0
      return { day, avg, count: dayReadings.length }
    })
    
    // Titolo
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text('Trend Settimanale', x, y)
    y += 8
    
    // Disegna mini bar chart
    const chartWidth = 180
    const chartHeight = 35
    const startX = x
    const barWidth = 18
    const gap = 7
    
    const maxAvg = Math.max(...weeklyData.filter(d => d.avg > 0).map(d => d.avg), 200)
    
    weeklyData.forEach((item, index) => {
      const barX = startX + index * (barWidth + gap)
      const barY = y + chartHeight
      
      // Background bar
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(barX, y, barWidth, chartHeight, 2, 2, 'F')
      
      // Value bar
      if (item.avg > 0) {
        const fillHeight = (item.avg / maxAvg) * (chartHeight - 8)
        const color = this.getGlucoseColor(item.avg, tirMin, tirMax)
        
        doc.setFillColor(color[0], color[1], color[2])
        doc.roundedRect(barX, barY - fillHeight - 4, barWidth, fillHeight, 2, 2, 'F')
        
        // Valore
        doc.setFontSize(7)
        doc.setTextColor(color[0], color[1], color[2])
        doc.setFont('helvetica', 'bold')
        doc.text(String(item.avg), barX + barWidth / 2, barY - fillHeight - 7, { align: 'center' })
      }
      
      // Label giorno
      doc.setFontSize(6)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(item.day, barX + barWidth / 2, barY + 5, { align: 'center' })
    })
    
    return y + chartHeight + 15
  }

  /**
   * Disegna sezione riepilogo con icone
   * @param {Object} doc - Documento jsPDF
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   * @param {Array} readings - Letture glicemiche
   * @param {Array} insulin - Record insulina
   * @param {Array} carbs - Record carboidrati
   * @param {Array} notes - Note
   * @returns {number} Nuova posizione Y
   */
  static drawSummaryIcons(doc, x, y, readings, insulin, carbs, notes) {
    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.text('Attivita Registrate', x, y)
    y += 6
    
    const totalInsulin = insulin.reduce((sum, i) => sum + Number(i.units || 0), 0)
    const totalCarbs = carbs.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const rapidInsulin = insulin.filter(i => i.type === 'rapid').reduce((sum, i) => sum + Number(i.units || 0), 0)
    const slowInsulin = insulin.filter(i => i.type === 'slow').reduce((sum, i) => sum + Number(i.units || 0), 0)

    this.drawMiniMetricCard(doc, x, y, 42, 24, totalInsulin.toFixed(1), 'U totali', 'Insulina', [99, 102, 241])
    this.drawMiniMetricCard(doc, x + 46, y, 42, 24, String(totalCarbs), 'grammi', 'Carboidrati', [249, 115, 22])
    this.drawMiniMetricCard(doc, x + 92, y, 42, 24, String(notes.length), 'record', 'Note', [107, 114, 128])
    this.drawMiniMetricCard(doc, x + 138, y, 42, 24, `${rapidInsulin.toFixed(1)}/${slowInsulin.toFixed(1)}`, 'U R/L', 'Rapida/Lenta', [34, 197, 94])

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

  /**
   * Disegna icona con valore
   * @param {Object} doc - Documento jsPDF
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   * @param {string} icon - Emoji icona
   * @param {string} value - Valore
   * @param {string} label - Etichetta
   * @param {Array} color - Colore [R, G, B]
   */
  static drawIcon(doc, x, y, icon, value, label, color) {
    // Icona emoji
    doc.setFontSize(12)
    doc.text(String(icon), x, y)
    
    // Valore
    doc.setFontSize(10)
    doc.setTextColor(color[0], color[1], color[2])
    doc.setFont('helvetica', 'bold')
    doc.text(String(value), x, y + 8)
    
    // Label
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(String(label), x, y + 14)
  }
}

export default ExportService
