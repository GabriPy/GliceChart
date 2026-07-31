import { createRouter, createWebHistory } from 'vue-router'

// Lazy loading delle views per migliorare performance
const HomeView = () => import('../views/HomeView.vue')
const CalendarView = () => import('../views/CalendarView.vue')
const SettingsView = () => import('../views/SettingsView.vue')
const PeriodicSummaryView = () => import('../views/PeriodicSummaryView.vue')
const DietometerView = () => import('../views/DietometerView.vue')
const AboutView = () => import('../views/AboutView.vue')
const PredictionView = () => import('../views/PredictionView.vue')
const PatternsView = () => import('../views/PatternsView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: CalendarView
    },
    // {
    //   path: '/prediction',
    //   name: 'prediction',
    //   component: PredictionView
    // },
    {
      path: '/patterns',
      name: 'patterns',
      component: PatternsView
    },
    {
      path: '/dietometer',
      name: 'dietometer',
      component: DietometerView
    },
    {
      path: '/summary',
      name: 'summary',
      component: PeriodicSummaryView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    }
  ]
})

export default router
