import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CalendarView from '../views/CalendarView.vue'
import SettingsView from '../views/SettingsView.vue'
import PeriodicSummaryView from '../views/PeriodicSummaryView.vue'
import DietometerView from '../views/DietometerView.vue'
import AboutView from '../views/AboutView.vue'
import PredictionView from '../views/PredictionView.vue'
import PatternsView from '../views/PatternsView.vue'

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
