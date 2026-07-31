import Papa from 'papaparse'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Servizio per export dati in CSV e PDF
 * Supporta export di glicemia, insulina, carboidrati, note e impostazioni
 */

class ExportService {
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
      styles = {}
    } = options

    const pdfData = transform ? data.map(transform) : data
    
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    })

    // Header
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text(title, 14, 20)

    // Data report
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generato: ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}`, 14, 28)
    doc.text(`Totale record: ${data.length}`, 14, 34)

    // Table
    const tableConfig = {
      startY: 40,
      head: headers || this.extractHeaders(pdfData),
      body: pdfData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        ...styles
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 40, right: 14, bottom: 20, left: 14 }
    }

    if (columns) {
      tableConfig.columns = columns
    }

    doc.autoTable(tableConfig)

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Pagina ${i} di ${pageCount} - GliceChart Report`,
        14,
        doc.internal.pageSize.height - 10
      )
    }

    doc.save(`${filename}_${this.getTimestamp()}.pdf`)
  }

  /**
   * Esporta letture glicemiche
   * @param {Array} readings - Letture glicemiche
   * @param {string} format - 'csv' o 'pdf'
   * @param {Object} dateRange - Range date { start, end }
   */
  static exportGlucoseReadings(readings, format = 'csv', dateRange = null) {
    const filteredReadings = this.filterByDateRange(readings, dateRange)
    
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
      this.exportToPDF(filteredReadings, 'glicemia', {
        title: 'Report Glicemia',
        headers,
        transform
      })
    }
  }

  /**
   * Esporta record insulina
   * @param {Array} insulin - Record insulina
   * @param {string} format - 'csv' o 'pdf'
   * @param {Object} dateRange - Range date { start, end }
   */
  static exportInsulin(insulin, format = 'csv', dateRange = null) {
    const filteredInsulin = this.filterByDateRange(insulin, dateRange)
    
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
        transform
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
    const filteredCarbs = this.filterByDateRange(carbs, dateRange)
    
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
        transform
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
    const filteredNotes = this.filterByDateRange(notes, dateRange)
    
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
        transform
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
    
    if (format === 'csv') {
      // Per CSV, crea file separati
      this.exportGlucoseReadings(readings, 'csv', dateRange)
      this.exportInsulin(insulin, 'csv', dateRange)
      this.exportCarbs(carbs, 'csv', dateRange)
      this.exportNotes(notes, 'csv', dateRange)
    } else {
      // Per PDF, crea un report multi-sezione
      this.exportCompletePDF(data, dateRange)
    }
  }

  /**
   * Crea PDF completo con multiple sezioni
   * @param {Object} data - Dati completi
   * @param {Object} dateRange - Range date
   */
  static exportCompletePDF(data, dateRange = null) {
    const { readings, insulin, carbs, notes, settings } = data
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    let yPos = 20
    const pageHeight = doc.internal.pageSize.height
    const margin = 14

    // Header principale
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('GliceChart - Report Completo', margin, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generato: ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}`, margin, yPos)
    yPos += 6

    if (dateRange) {
      doc.text(`Periodo: ${dateRange.start} - ${dateRange.end}`, margin, yPos)
      yPos += 6
    }

    // Statistiche generali
    yPos += 10
    doc.setFontSize(14)
    doc.setTextColor(99, 102, 241)
    doc.text('Statistiche Generali', margin, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    
    if (readings.length > 0) {
      const avgGlucose = Math.round(readings.reduce((sum, r) => sum + r.glucose, 0) / readings.length)
      const minGlucose = Math.min(...readings.map(r => r.glucose))
      const maxGlucose = Math.max(...readings.map(r => r.glucose))
      
      doc.text(`Media glicemia: ${avgGlucose} mg/dL`, margin, yPos)
      yPos += 6
      doc.text(`Min/Max: ${minGlucose} / ${maxGlucose} mg/dL`, margin, yPos)
      yPos += 6
    }

    doc.text(`Totale insulina: ${insulin.length} record`, margin, yPos)
    yPos += 6
    doc.text(`Totale carboidrati: ${carbs.length} record`, margin, yPos)
    yPos += 6
    doc.text(`Totale note: ${notes.length} record`, margin, yPos)
    yPos += 10

    // Funzione helper per aggiungere tabella
    const addTable = (title, tableData, headers, transform) => {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(99, 102, 241)
      doc.text(title, margin, yPos)
      yPos += 8

      const transformedData = transform ? tableData.map(transform) : tableData
      const filteredData = dateRange ? this.filterByDateRange(transformedData, dateRange) : transformedData

      if (filteredData.length === 0) {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('Nessun dato disponibile', margin, yPos)
        yPos += 10
        return
      }

      doc.autoTable({
        startY: yPos,
        head: headers,
        body: filteredData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: yPos, right: margin, bottom: 15, left: margin },
        pageBreak: 'auto'
      })

      yPos = doc.lastAutoTable.finalY + 10
    }

    // Aggiungi tabelle
    addTable('Glicemia', readings, ['Data/Ora', 'Glicemia', 'Trend'], (r) => [
      new Date(r.timestamp).toLocaleString('it-IT'),
      r.glucose,
      r.trend
    ])

    addTable('Insulina', insulin, ['Data/Ora', 'Tipo', 'Unità'], (i) => [
      new Date(i.timestamp).toLocaleString('it-IT'),
      i.type === 'rapid' ? 'Rapida' : 'Lenta',
      i.units
    ])

    addTable('Carboidrati', carbs, ['Data/Ora', 'Grammi'], (c) => [
      new Date(c.timestamp).toLocaleString('it-IT'),
      c.amount
    ])

    addTable('Note', notes, ['Data/Ora', 'Nota'], (n) => [
      new Date(n.timestamp).toLocaleString('it-IT'),
      n.text
    ])

    // Footer su tutte le pagine
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Pagina ${i} di ${pageCount} - GliceChart Report Completo`,
        margin,
        pageHeight - 10
      )
    }

    doc.save(`glicechart_report_completo_${this.getTimestamp()}.pdf`)
  }

  /**
   * Esporta impostazioni
   * @param {Object} settings - Impostazioni
   * @param {string} format - 'csv' o 'pdf'
   */
  static exportSettings(settings, format = 'csv') {
    const transform = (s) => ({
      'Parametro': 'TIR Minimo',
      'Valore': s.tir_min
    }, {
      'Parametro': 'TIR Massimo',
      'Valore': s.tir_max
    }, {
      'Parametro': 'Soglia Rossa Sotto',
      'Valore': s.red_under
    }, {
      'Parametro': 'Soglia Rossa Sopra',
      'Valore': s.red_over
    }, {
      'Parametro': 'Durata Insulina Rapida (ore)',
      'Valore': s.rapid_duration
    }, {
      'Parametro': 'Durata Insulina Lenta (ore)',
      'Valore': s.slow_duration
    }, {
      'Parametro': 'Durata Carboidrati (ore)',
      'Valore': s.carb_duration
    }, {
      'Parametro': 'Sensibilità Insulina',
      'Valore': s.insulin_sensitivity
    }, {
      'Parametro': 'Ratio Carboidrati',
      'Valore': s.carb_ratio
    })

    const headers = ['Parametro', 'Valore']

    if (format === 'csv') {
      this.exportToCSV([settings], 'impostazioni', {
        headers,
        transform: () => transform(settings)
      })
    } else {
      this.exportToPDF([settings], 'impostazioni', {
        title: 'Report Impostazioni',
        headers,
        transform: () => transform(settings)
      })
    }
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
}

export default ExportService