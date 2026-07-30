<template>
  <div class="card bg-base-200/70 backdrop-blur-xl shadow-xl border border-white/10 rounded-3xl overflow-hidden">
    <div class="card-body gap-4 p-6">
      <span class="text-xs uppercase tracking-widest opacity-60 font-semibold">{{ title }}</span>
      <div class="relative h-[260px] w-full bg-base-300/20 rounded-2xl p-2">
        <component :is="chartComponent" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar, Pie, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler, Legend, ArcElement, BarElement, Title
} from 'chart.js'
import { useGlucoseStore } from '../stores/glucose'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend, ArcElement, BarElement, Title)

const props = defineProps({
  title: { type: String, default: 'Statistiche' },
  type: { type: String, default: 'bar' },
  data: { type: Object, default: null },
  readings: { type: Array, default: null }
})

const store = useGlucoseStore()

const chartComponent = computed(() => {
  switch (props.type) {
    case 'pie': return Pie
    case 'doughnut': return Doughnut
    default: return Bar
  }
})

const chartData = computed(() => {
  if (props.data) return props.data
  
  // Dati di esempio per distribuzione range o fasce orarie
  const readings = props.readings || store.readings
  if (!readings.length) return { datasets: [] }
  
  // Se il titolo contiene "Fasce Orarie" o "Hourly", calcola dati orari per percentuali in range
  if (props.title.includes('Fasce Orarie') || props.title.includes('Hourly')) {
    // Inizializza array per 24 ore, con contatori per ogni range
    const hourlyData = Array.from({ length: 24 }, () => ({ low: 0, inRange: 0, high: 0, total: 0 }))
    
    readings.forEach(r => {
      const date = new Date(r.timestamp)
      const hour = date.getHours()
      
      hourlyData[hour].total += 1
      if (r.glucose < store.settings.tir_min) {
        hourlyData[hour].low += 1
      } else if (r.glucose > store.settings.tir_max) {
        hourlyData[hour].high += 1
      } else {
        hourlyData[hour].inRange += 1
      }
    })
    
    // Crea labels per le 24 ore
    const labels = Array.from({ length: 24 }, (_, idx) => `${idx.toString().padStart(2, '0')}:00`)
    
    // Crea 3 dataset: uno per ogni range (percentuali)
    const datasets = [
      {
        label: 'Basso (%)',
        data: hourlyData.map(h => h.total > 0 ? Math.round((h.low / h.total) * 100) : null),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false
      },
      {
        label: 'In Range (%)',
        data: hourlyData.map(h => h.total > 0 ? Math.round((h.inRange / h.total) * 100) : null),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false
      },
      {
        label: 'Alto (%)',
        data: hourlyData.map(h => h.total > 0 ? Math.round((h.high / h.total) * 100) : null),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false
      }
    ]
    
    return { labels, datasets }
  }
  
  // Altrimenti, mostra la distribuzione range (default)
  const inRange = readings.filter(r => 
    r.glucose >= store.settings.tir_min && r.glucose <= store.settings.tir_max
  ).length
  const low = readings.filter(r => r.glucose < store.settings.tir_min).length
  const high = readings.filter(r => r.glucose > store.settings.tir_max).length
  
  if (props.type === 'bar') {
    return {
      labels: ['Basso', 'In Range', 'Alto'],
      datasets: [{
        label: 'Numero di letture',
        data: [low, inRange, high],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false
      }]
    }
  }
  
  return {
    labels: ['Basso', 'In Range', 'Alto'],
    datasets: [{
      label: 'Percentuale',
      data: [low, inRange, high],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: 'transparent',
      borderWidth: 0,
      hoverOffset: 12
    }]
  }
})

const chartOptions = computed(() => {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748b',
          font: { size: 12, weight: '600' },
          padding: 24,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        padding: 16,
        cornerRadius: 16,
        titleFont: { weight: '700' },
        bodyFont: { weight: '500' }
      }
    }
  }
  
  if (props.type === 'bar') {
    // Se è il grafico delle fasce orarie, imposta le scale in modo che siano impilate e la y vada da 0 a 100
    if (props.title.includes('Fasce Orarie') || props.title.includes('Hourly')) {
      return {
        ...commonOptions,
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#64748b', font: { size: 12, weight: '500' } },
            grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false }
          },
          y: {
            stacked: true,
            min: 0,
            max: 100,
            ticks: { 
              color: '#64748b', 
              font: { size: 12, weight: '500' },
              callback: (value) => `${value}%`
            },
            grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false }
          }
        }
      }
    }
    
    return {
      ...commonOptions,
      scales: {
        x: {
          ticks: { color: '#64748b', font: { size: 12, weight: '500' } },
          grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false }
        },
        y: {
          ticks: { color: '#64748b', font: { size: 12, weight: '500' } },
          grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false }
        }
      }
    }
  }
  
  return commonOptions
})
</script>
